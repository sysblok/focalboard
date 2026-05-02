//go:build sqlite3

package sqlstore

import (
	_ "github.com/mattn/go-sqlite3"                      // registers "sqlite3" (CGO)
	_ "github.com/tursodatabase/libsql-client-go/libsql" // registers "libsql"
)
