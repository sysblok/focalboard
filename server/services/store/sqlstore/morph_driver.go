package sqlstore

import (
	"fmt"

	"github.com/mattermost/morph/drivers"
	sqlite "github.com/mattermost/morph/drivers/sqlite"

	"github.com/mattermost/focalboard/server/model"
)

// newMorphDriver returns the morph migration driver for the configured database
// type. postgres and mysql use morph's built-in drivers (returned as nil here;
// migrate.go selects them via getMigrationConnection). sqlite, libsql (Turso),
// and d1 each have custom drivers that work over database/sql.
func (s *SQLStore) newMorphDriver() (drivers.Driver, error) {
	switch s.dbType {
	case model.D1DBType:
		return newD1MorphDriver(s.db, fmt.Sprintf("%sschema_migrations", s.tablePrefix)), nil
	case model.TursoDBType:
		return newTursoMorphDriver(s.db, fmt.Sprintf("%sschema_migrations", s.tablePrefix)), nil
	case model.SqliteDBType:
		return sqlite.WithInstance(s.db)
	}
	return nil, nil
}
