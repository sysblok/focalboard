// Package d1driver implements a database/sql driver for Cloudflare D1
// via the D1 HTTP REST API.
//
// DSN format: d1://<accountID>/<databaseID>?token=<apiToken>
//
// Transactions are implemented using D1's batch endpoint: all DML
// statements within a transaction are buffered and sent atomically on
// Commit. SELECT statements execute immediately (no read-your-own-writes
// within an open transaction).
package d1driver

import (
	"bytes"
	"context"
	"database/sql"
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"sync/atomic"
)

const DriverName = "d1"

func init() {
	sql.Register(DriverName, &d1Driver{})
}

// ---------------------------------------------------------------------------
// DSN parsing
// ---------------------------------------------------------------------------

type d1Config struct {
	AccountID  string
	DatabaseID string
	APIToken   string
}

// parseDSN parses "d1://<accountID>/<databaseID>?token=<apiToken>".
func parseDSN(dsn string) (*d1Config, error) {
	u, err := url.Parse(dsn)
	if err != nil {
		return nil, fmt.Errorf("d1: invalid DSN: %w", err)
	}
	if u.Scheme != "d1" {
		return nil, fmt.Errorf("d1: expected scheme 'd1', got %q", u.Scheme)
	}
	token := u.Query().Get("token")
	if token == "" {
		return nil, fmt.Errorf("d1: missing 'token' query parameter in DSN")
	}
	databaseID := strings.TrimPrefix(u.Path, "/")
	if u.Host == "" || databaseID == "" {
		return nil, fmt.Errorf("d1: DSN must be d1://<accountID>/<databaseID>?token=<token>")
	}
	return &d1Config{
		AccountID:  u.Host,
		DatabaseID: databaseID,
		APIToken:   token,
	}, nil
}

// ---------------------------------------------------------------------------
// API types
// ---------------------------------------------------------------------------

type queryRequest struct {
	SQL    string        `json:"sql"`
	Params []interface{} `json:"params"`
}

type batchRequest struct {
	Statements []queryRequest `json:"statements"`
}

type queryMeta struct {
	Changes     int64   `json:"changes"`
	LastRowID   int64   `json:"last_row_id"`
	RowsRead    int64   `json:"rows_read"`
	RowsWritten int64   `json:"rows_written"`
	Duration    float64 `json:"duration"`
}

type queryResult struct {
	Results []orderedRow `json:"results"`
	Success bool         `json:"success"`
	Meta    queryMeta    `json:"meta"`
}

type apiError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

type apiResponse struct {
	Result   []queryResult `json:"result"`
	Success  bool          `json:"success"`
	Errors   []apiError    `json:"errors"`
}

// orderedRow preserves JSON object key order, which maps to column order.
type orderedRow struct {
	cols []string
	vals []interface{}
}

func (o *orderedRow) UnmarshalJSON(data []byte) error {
	dec := json.NewDecoder(bytes.NewReader(data))
	dec.UseNumber()

	tok, err := dec.Token()
	if err != nil {
		return err
	}
	if delim, ok := tok.(json.Delim); !ok || delim != '{' {
		return fmt.Errorf("d1: expected '{', got %v", tok)
	}
	for dec.More() {
		keyTok, kErr := dec.Token()
		if kErr != nil {
			return kErr
		}
		key, ok := keyTok.(string)
		if !ok {
			return fmt.Errorf("d1: expected string key")
		}
		var val interface{}
		if err := dec.Decode(&val); err != nil {
			return err
		}
		o.cols = append(o.cols, key)
		o.vals = append(o.vals, val)
	}
	return nil
}

// ---------------------------------------------------------------------------
// Driver
// ---------------------------------------------------------------------------

type d1Driver struct{}

func (d *d1Driver) Open(dsn string) (driver.Conn, error) {
	cfg, err := parseDSN(dsn)
	if err != nil {
		return nil, err
	}
	return &d1Conn{cfg: cfg, client: &http.Client{}}, nil
}

// ---------------------------------------------------------------------------
// Conn
// ---------------------------------------------------------------------------

type d1Conn struct {
	cfg    *d1Config
	client *http.Client

	mu sync.Mutex
	tx *d1Tx // non-nil when inside a transaction
}

// Ping implements driver.Pinger.
func (c *d1Conn) Ping(ctx context.Context) error {
	_, err := c.doQuery(ctx, "SELECT 1", nil)
	return err
}

// Prepare implements driver.Conn.
func (c *d1Conn) Prepare(query string) (driver.Stmt, error) {
	return &d1Stmt{conn: c, query: query}, nil
}

// Close implements driver.Conn.
func (c *d1Conn) Close() error { return nil }

// Begin implements driver.Conn.
func (c *d1Conn) Begin() (driver.Tx, error) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.tx != nil {
		return nil, fmt.Errorf("d1: nested transactions are not supported")
	}
	tx := &d1Tx{conn: c}
	c.tx = tx
	return tx, nil
}

// ExecContext implements driver.ExecerContext.
func (c *d1Conn) ExecContext(ctx context.Context, query string, args []driver.NamedValue) (driver.Result, error) {
	params := namedValuesToSlice(args)

	c.mu.Lock()
	tx := c.tx
	c.mu.Unlock()

	if tx != nil {
		tx.mu.Lock()
		tx.stmts = append(tx.stmts, queryRequest{SQL: query, Params: params})
		tx.mu.Unlock()
		return &d1Result{}, nil
	}

	result, err := c.doQuery(ctx, query, params)
	if err != nil {
		return nil, err
	}
	return &d1Result{changes: result.Meta.Changes, lastInsertID: result.Meta.LastRowID}, nil
}

// QueryContext implements driver.QueryerContext.
// SELECTs always execute immediately (even inside a transaction).
func (c *d1Conn) QueryContext(ctx context.Context, query string, args []driver.NamedValue) (driver.Rows, error) {
	params := namedValuesToSlice(args)
	result, err := c.doQuery(ctx, query, params)
	if err != nil {
		return nil, err
	}
	return newD1Rows(result), nil
}

// doQuery sends a single SQL statement to the D1 /query endpoint.
func (c *d1Conn) doQuery(ctx context.Context, sqlStr string, params []interface{}) (*queryResult, error) {
	body, err := json.Marshal(queryRequest{SQL: sqlStr, Params: params})
	if err != nil {
		return nil, err
	}

	apiURL := fmt.Sprintf(
		"https://api.cloudflare.com/client/v4/accounts/%s/d1/database/%s/query",
		c.cfg.AccountID, c.cfg.DatabaseID,
	)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, apiURL, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+c.cfg.APIToken)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("d1: HTTP request failed: %w", err)
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("d1: failed to read response: %w", err)
	}

	var apiResp apiResponse
	if err := json.Unmarshal(respBytes, &apiResp); err != nil {
		return nil, fmt.Errorf("d1: failed to parse response: %w", err)
	}
	if !apiResp.Success || len(apiResp.Errors) > 0 {
		if len(apiResp.Errors) > 0 {
			return nil, fmt.Errorf("d1: API error %d: %s", apiResp.Errors[0].Code, apiResp.Errors[0].Message)
		}
		return nil, fmt.Errorf("d1: API request failed (HTTP %d)", resp.StatusCode)
	}
	if len(apiResp.Result) == 0 {
		return &queryResult{Success: true}, nil
	}
	return &apiResp.Result[0], nil
}

// doBatch sends multiple statements atomically via the D1 /batch endpoint.
func (c *d1Conn) doBatch(ctx context.Context, stmts []queryRequest) error {
	if len(stmts) == 0 {
		return nil
	}
	body, err := json.Marshal(batchRequest{Statements: stmts})
	if err != nil {
		return err
	}

	apiURL := fmt.Sprintf(
		"https://api.cloudflare.com/client/v4/accounts/%s/d1/database/%s/batch",
		c.cfg.AccountID, c.cfg.DatabaseID,
	)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, apiURL, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+c.cfg.APIToken)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.client.Do(req)
	if err != nil {
		return fmt.Errorf("d1: batch HTTP request failed: %w", err)
	}
	defer resp.Body.Close()

	var apiResp apiResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		return fmt.Errorf("d1: failed to parse batch response: %w", err)
	}
	if !apiResp.Success || len(apiResp.Errors) > 0 {
		if len(apiResp.Errors) > 0 {
			return fmt.Errorf("d1: batch API error %d: %s", apiResp.Errors[0].Code, apiResp.Errors[0].Message)
		}
		return fmt.Errorf("d1: batch API request failed (HTTP %d)", resp.StatusCode)
	}
	return nil
}

// ---------------------------------------------------------------------------
// Tx
// ---------------------------------------------------------------------------

// d1Tx buffers DML statements and sends them atomically via the /batch
// endpoint on Commit. SELECTs are still executed immediately through the
// connection and are not transactionally isolated.
type d1Tx struct {
	conn  *d1Conn
	mu    sync.Mutex
	stmts []queryRequest
	done  atomic.Bool
}

func (t *d1Tx) Commit() error {
	if !t.done.CompareAndSwap(false, true) {
		return fmt.Errorf("d1: transaction already completed")
	}
	t.conn.mu.Lock()
	t.conn.tx = nil
	t.conn.mu.Unlock()

	t.mu.Lock()
	stmts := t.stmts
	t.mu.Unlock()

	return t.conn.doBatch(context.Background(), stmts)
}

func (t *d1Tx) Rollback() error {
	if !t.done.CompareAndSwap(false, true) {
		return nil // already committed or rolled back
	}
	t.conn.mu.Lock()
	t.conn.tx = nil
	t.conn.mu.Unlock()
	// Buffered statements are discarded — effectively a no-op rollback.
	return nil
}

// ---------------------------------------------------------------------------
// Stmt
// ---------------------------------------------------------------------------

type d1Stmt struct {
	conn  *d1Conn
	query string
}

func (s *d1Stmt) Close() error  { return nil }
func (s *d1Stmt) NumInput() int { return -1 }

func (s *d1Stmt) Exec(args []driver.Value) (driver.Result, error) {
	return s.conn.ExecContext(context.Background(), s.query, valuesToNamedValues(args))
}

func (s *d1Stmt) Query(args []driver.Value) (driver.Rows, error) {
	return s.conn.QueryContext(context.Background(), s.query, valuesToNamedValues(args))
}

// ---------------------------------------------------------------------------
// Rows
// ---------------------------------------------------------------------------

type d1Rows struct {
	result *queryResult
	pos    int
	cols   []string
}

func newD1Rows(r *queryResult) *d1Rows {
	rows := &d1Rows{result: r}
	if r != nil && len(r.Results) > 0 {
		rows.cols = r.Results[0].cols
	}
	return rows
}

func (r *d1Rows) Columns() []string {
	return r.cols
}

func (r *d1Rows) Close() error { return nil }

func (r *d1Rows) Next(dest []driver.Value) error {
	if r.result == nil || r.pos >= len(r.result.Results) {
		return io.EOF
	}
	row := r.result.Results[r.pos]
	r.pos++
	for i, v := range row.vals {
		if i >= len(dest) {
			break
		}
		dest[i] = convertJSONValue(v)
	}
	return nil
}

// ---------------------------------------------------------------------------
// Result
// ---------------------------------------------------------------------------

type d1Result struct {
	changes      int64
	lastInsertID int64
}

func (r *d1Result) LastInsertId() (int64, error) { return r.lastInsertID, nil }
func (r *d1Result) RowsAffected() (int64, error) { return r.changes, nil }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

func namedValuesToSlice(args []driver.NamedValue) []interface{} {
	s := make([]interface{}, len(args))
	for i, a := range args {
		s[i] = a.Value
	}
	return s
}

func valuesToNamedValues(args []driver.Value) []driver.NamedValue {
	named := make([]driver.NamedValue, len(args))
	for i, v := range args {
		named[i] = driver.NamedValue{Ordinal: i + 1, Value: v}
	}
	return named
}

// convertJSONValue converts a value decoded from D1's JSON response to a
// type that database/sql can handle.
func convertJSONValue(v interface{}) driver.Value {
	if v == nil {
		return nil
	}
	switch val := v.(type) {
	case json.Number:
		// Try integer first to preserve precision.
		if i, err := val.Int64(); err == nil {
			return i
		}
		if f, err := val.Float64(); err == nil {
			return f
		}
		return val.String()
	case string:
		return val
	case bool:
		if val {
			return int64(1)
		}
		return int64(0)
	default:
		return fmt.Sprintf("%v", v)
	}
}
