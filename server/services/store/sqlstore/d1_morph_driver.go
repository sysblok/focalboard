package sqlstore

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"sync/atomic"

	"github.com/mattermost/morph/drivers"
	"github.com/mattermost/morph/models"
)

// d1MorphDriver implements morph's drivers.Driver for Cloudflare D1.
//
// D1's REST API accepts one SQL statement per /query request. Migrations that
// contain multiple semicolon-separated statements must be split and sent via
// the /batch endpoint (exposed as a database/sql transaction by the d1driver
// package). Empty migrations (postgres/mysql-only SQL rendered for sqlite) are
// skipped but still record the version so morph does not retry them.
type d1MorphDriver struct {
	db              *sql.DB
	migrationsTable string
	timeoutSecs     int
	locked          int32
}

func newD1MorphDriver(db *sql.DB, migrationsTable string) *d1MorphDriver {
	table := migrationsTable
	if table == "" {
		table = "db_migrations"
	}
	return &d1MorphDriver{
		db:              db,
		migrationsTable: table,
		timeoutSecs:     300,
	}
}

func (d *d1MorphDriver) DriverName() string { return "sqlite" }
func (d *d1MorphDriver) Ping() error        { return d.db.Ping() }
func (d *d1MorphDriver) Close() error       { return nil }

func (d *d1MorphDriver) lock() error {
	if !atomic.CompareAndSwapInt32(&d.locked, 0, 1) {
		return &drivers.DatabaseError{
			Driver:  "sqlite",
			Message: "failed to obtain lock",
			Command: "lock_driver",
		}
	}
	return nil
}

func (d *d1MorphDriver) unlock() {
	atomic.StoreInt32(&d.locked, 0)
}

func (d *d1MorphDriver) SetConfig(key string, value interface{}) error {
	switch key {
	case "StatementTimeoutInSecs":
		if n, ok := value.(int); ok {
			d.timeoutSecs = n
			return nil
		}
		return fmt.Errorf("incorrect value type for %s", key)
	case "MigrationsTable":
		if s, ok := value.(string); ok {
			d.migrationsTable = s
			return nil
		}
		return fmt.Errorf("incorrect value type for %s", key)
	}
	return fmt.Errorf("unknown config key %q", key)
}

func (d *d1MorphDriver) ctx() (context.Context, context.CancelFunc) {
	return drivers.GetContext(d.timeoutSecs)
}

func (d *d1MorphDriver) createTableIfNotExists() error {
	ctx, cancel := d.ctx()
	defer cancel()

	q := fmt.Sprintf(
		"CREATE TABLE IF NOT EXISTS %s (Version bigint not null primary key, Name varchar not null)",
		d.migrationsTable,
	)
	if _, err := d.db.ExecContext(ctx, q); err != nil {
		return &drivers.DatabaseError{
			Driver:  "sqlite",
			Message: "failed while executing query",
			Command: "create_migrations_table_if_not_exists",
			OrigErr: err,
			Query:   []byte(q),
		}
	}
	return nil
}

func (d *d1MorphDriver) AppliedMigrations() ([]*models.Migration, error) {
	if err := d.lock(); err != nil {
		return nil, err
	}
	defer d.unlock()

	if err := d.createTableIfNotExists(); err != nil {
		return nil, err
	}

	ctx, cancel := d.ctx()
	defer cancel()

	q := fmt.Sprintf("SELECT version, name FROM %s", d.migrationsTable)
	rows, err := d.db.QueryContext(ctx, q)
	if err != nil {
		return nil, &drivers.DatabaseError{
			Driver:  "sqlite",
			Message: "failed to fetch applied migrations",
			Command: "select_applied_migrations",
			OrigErr: err,
			Query:   []byte(q),
		}
	}
	defer rows.Close()

	var migrations []*models.Migration
	for rows.Next() {
		var version uint32
		var name string
		if err := rows.Scan(&version, &name); err != nil {
			return nil, &drivers.DatabaseError{
				Driver:  "sqlite",
				Message: "failed to scan applied migration row",
				Command: "scan_applied_migrations",
				OrigErr: err,
			}
		}
		migrations = append(migrations, &models.Migration{
			Name:      name,
			Version:   version,
			Direction: models.Up,
		})
	}
	return migrations, rows.Err()
}

// splitSQLStatements splits a multi-statement SQL string into individual
// statements. Comment-only lines (starting with --) are stripped first so
// that semicolons inside comments are not treated as statement terminators.
// This is intentionally simple: it does not handle semicolons inside string
// literals, but Focalboard migrations do not contain that pattern.
func splitSQLStatements(sql string) []string {
	var lines []string
	for _, line := range strings.Split(sql, "\n") {
		if t := strings.TrimSpace(line); t != "" && !strings.HasPrefix(t, "--") {
			lines = append(lines, line)
		}
	}

	var stmts []string
	for _, part := range strings.Split(strings.Join(lines, "\n"), ";") {
		if s := strings.TrimSpace(part); s != "" {
			stmts = append(stmts, s)
		}
	}
	return stmts
}

func (d *d1MorphDriver) Apply(migration *models.Migration, saveVersion bool) error {
	if err := d.lock(); err != nil {
		return err
	}
	defer d.unlock()

	ctx, cancel := d.ctx()
	defer cancel()

	// D1's REST API has no batch/transaction endpoint; execute each statement
	// individually via /query. There is no server-side rollback on failure.
	for _, stmt := range splitSQLStatements(migration.Query()) {
		if _, err := d.db.ExecContext(ctx, stmt); err != nil {
			return &drivers.DatabaseError{
				Driver:  "sqlite",
				Message: "failed when applying migration",
				Command: "apply_migration",
				OrigErr: err,
				Query:   []byte(stmt),
			}
		}
	}

	if saveVersion {
		vq := buildVersionQuery(d.migrationsTable, migration)
		if _, err := d.db.ExecContext(ctx, vq); err != nil {
			return &drivers.DatabaseError{
				Driver:  "sqlite",
				Message: "failed to save migration version",
				Command: "save_migration_version",
				OrigErr: err,
			}
		}
	}
	return nil
}
