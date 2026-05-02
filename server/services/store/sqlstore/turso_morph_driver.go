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

// tursoMorphDriver implements morph's drivers.Driver for Turso (libsql HTTP).
//
// The stock morph sqlite driver pins a *sql.Conn via db.Conn() and reuses it
// for multiple queries. The Hrana v2 HTTP protocol marks a connection as
// "stream closed" after every autocommit statement, so the second query on a
// pinned connection always fails with ErrBadConn.
//
// This driver avoids the problem by using db.ExecContext / db.QueryContext
// (pool-level, never pinned) for non-transactional operations, and
// db.BeginTx for Apply() where the Hrana baton keeps the stream alive across
// the whole migration transaction.
type tursoMorphDriver struct {
	db             *sql.DB
	migrationsTable string
	timeoutSecs    int
	locked         int32
}

func newTursoMorphDriver(db *sql.DB, migrationsTable string) *tursoMorphDriver {
	table := migrationsTable
	if table == "" {
		table = "db_migrations"
	}
	return &tursoMorphDriver{
		db:              db,
		migrationsTable: table,
		timeoutSecs:     300,
	}
}

func (d *tursoMorphDriver) DriverName() string { return "sqlite" }

func (d *tursoMorphDriver) Ping() error {
	return d.db.Ping()
}

func (d *tursoMorphDriver) Close() error {
	// db lifetime is managed by the caller (sqlstore); do not close here.
	return nil
}

func (d *tursoMorphDriver) lock() error {
	if !atomic.CompareAndSwapInt32(&d.locked, 0, 1) {
		return &drivers.DatabaseError{
			Driver:  "sqlite",
			Message: "failed to obtain lock",
			Command: "lock_driver",
		}
	}
	return nil
}

func (d *tursoMorphDriver) unlock() {
	atomic.StoreInt32(&d.locked, 0)
}

func (d *tursoMorphDriver) SetConfig(key string, value interface{}) error {
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

func (d *tursoMorphDriver) ctx() (context.Context, context.CancelFunc) {
	return drivers.GetContext(d.timeoutSecs)
}

func (d *tursoMorphDriver) createTableIfNotExists() error {
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

func (d *tursoMorphDriver) AppliedMigrations() ([]*models.Migration, error) {
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

func (d *tursoMorphDriver) Apply(migration *models.Migration, saveVersion bool) error {
	if err := d.lock(); err != nil {
		return err
	}
	defer d.unlock()

	ctx, cancel := d.ctx()
	defer cancel()

	query := strings.TrimSpace(migration.Query())

	if query != "" {
		// Use a transaction so the Hrana v2 baton stays alive across all statements.
		// Within a transaction the WebSocket/HTTP stream remains open, allowing
		// multiple queries on the same connection.
		tx, err := d.db.BeginTx(ctx, nil)
		if err != nil {
			return &drivers.DatabaseError{
				Driver:  "sqlite",
				Message: "error while opening a transaction to the database",
				Command: "begin_transaction",
				OrigErr: err,
			}
		}

		if _, err := tx.ExecContext(ctx, query); err != nil {
			_ = tx.Rollback()
			return &drivers.DatabaseError{
				Driver:  "sqlite",
				Message: "failed when applying migration",
				Command: "apply_migration",
				OrigErr: err,
			}
		}

		if saveVersion {
			if _, err := tx.ExecContext(ctx, buildVersionQuery(d.migrationsTable, migration)); err != nil {
				_ = tx.Rollback()
				return &drivers.DatabaseError{
					Driver:  "sqlite",
					Message: "failed to save migration version",
					Command: "save_migration_version",
					OrigErr: err,
				}
			}
		}

		if err := tx.Commit(); err != nil {
			return &drivers.DatabaseError{
				Driver:  "sqlite",
				Message: "error while committing a transaction to the database",
				Command: "commit_transaction",
				OrigErr: err,
			}
		}
		return nil
	}

	// Empty query (postgres/mysql-only migration rendered for sqlite) — skip SQL,
	// but still record the version so morph doesn't retry it.
	if saveVersion {
		if _, err := d.db.ExecContext(ctx, buildVersionQuery(d.migrationsTable, migration)); err != nil {
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
