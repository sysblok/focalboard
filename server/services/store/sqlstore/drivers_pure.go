//go:build !sqlite3

package sqlstore

import (
	"database/sql"

	sqlite "modernc.org/sqlite"

	_ "github.com/mattermost/focalboard/server/services/store/d1driver" // registers "d1"
	_ "github.com/tursodatabase/libsql-client-go/libsql"                // registers "libsql"
)

func init() {
	// modernc.org/sqlite's own init registers it as "sqlite".
	// Also register it as "sqlite3" so DBType="sqlite3" in config works without CGO.
	sql.Register("sqlite3", &sqlite.Driver{})
}
