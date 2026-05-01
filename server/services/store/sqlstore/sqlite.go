//go:build sqlite3

package sqlstore

import (
	_ "github.com/mattn/go-sqlite3"                      // sqlite driver
	_ "github.com/tursodatabase/libsql-client-go/libsql" // libsql (Turso) driver
)
