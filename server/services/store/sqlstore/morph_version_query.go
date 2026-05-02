package sqlstore

import (
	"fmt"

	"github.com/mattermost/morph/models"
)

// buildVersionQuery returns the SQL to record or remove a migration version
// from the migrations tracking table.
func buildVersionQuery(table string, m *models.Migration) string {
	if m.Direction == models.Down {
		return fmt.Sprintf("DELETE FROM %s WHERE (Version=%d AND NAME='%s')",
			table, m.Version, m.Name)
	}
	return fmt.Sprintf("INSERT INTO %s (Version, Name) VALUES (%d, '%s')",
		table, m.Version, m.Name)
}
