package app

import (
	"archive/zip"
	"encoding/json"
	"fmt"
	"io"

	"github.com/mattermost/focalboard/server/model"
	"github.com/wiggin77/merror"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

var (
	newline = []byte{'\n'}
)

func (a *App) ExportArchive(w io.Writer, opt model.ExportArchiveOptions) (errs error) {
	boards, err := a.getBoardsForArchive(opt.BoardIDs)
	if err != nil {
		return err
	}

	merr := merror.New()
	defer func() {
		errs = merr.ErrorOrNil()
	}()

	// wrap the writer in a zip.
	zw := zip.NewWriter(w)
	defer func() {
		merr.Append(zw.Close())
	}()

	if err := a.writeArchiveVersion(zw); err != nil {
		merr.Append(err)
		return
	}

	for _, board := range boards {
		if err := a.writeArchiveBoard(zw, board, opt); err != nil {
			merr.Append(fmt.Errorf("cannot export board %s: %w", board.ID, err))
			return
		}
	}
	return nil
}

// writeArchiveVersion writes a version file to the zip.
func (a *App) writeArchiveVersion(zw *zip.Writer) error {
	archiveHeader := model.ArchiveHeader{
		Version: archiveVersion,
		Date:    model.GetMillis(),
	}
	b, _ := json.Marshal(&archiveHeader)

	w, err := zw.Create("version.json")
	if err != nil {
		return fmt.Errorf("cannot write archive header: %w", err)
	}

	if _, err := w.Write(b); err != nil {
		return fmt.Errorf("cannot write archive header: %w", err)
	}
	return nil
}

// writeArchiveBoard writes a single board to the archive in a zip directory.
func (a *App) writeArchiveBoard(zw *zip.Writer, board model.Board, opt model.ExportArchiveOptions) error {
	// create a directory per board
	w, err := zw.Create(board.ID + "/board.jsonl")
	if err != nil {
		return err
	}

	// write the board block first
	if err = a.writeArchiveBoardLine(w, board); err != nil {
		return err
	}

	var files []string
	// write the board's blocks
	// TODO: paginate this
	blocks, err := a.GetBlocksForBoard(board.ID)
	if err != nil {
		return err
	}

	for _, block := range blocks {
		if err = a.writeArchiveBlockLine(w, block); err != nil {
			return err
		}
		if block.Type == model.TypeImage || block.Type == model.TypeAttachment {
			filename, err2 := extractFilename(block)
			if err2 != nil {
				return err2
			}
			files = append(files, filename)
		}
	}

	boardMembers, err := a.GetMembersForBoard(board.ID)
	if err != nil {
		return err
	}

	for _, boardMember := range boardMembers {
		if err = a.writeArchiveBoardMemberLine(w, boardMember); err != nil {
			return err
		}
	}

	// Export Users with Username Information
	// Collect all unique user IDs from the board
	userIDs := a.getUserIDsForBoard(board, blocks, boardMembers)

	a.logger.Debug("Exporting users for board",
		mlog.String("board_id", board.ID),
		mlog.Int("user_count", len(userIDs)),
	)
	// Fetch and export user data in batch for efficiency
	if len(userIDs) > 0 {
		users, err := a.GetUsersList(userIDs)
		if err != nil {
			// Log warning but don't fail the export
			a.logger.Warn("Could not fetch all users for export",
				mlog.String("board_id", board.ID),
				mlog.Err(err),
			)
		} else {
			// Write user lines
			for _, user := range users {
				if err = a.writeArchiveUserLine(w, user); err != nil {
					return fmt.Errorf("cannot write user %s to archive: %w", user.ID, err)
				}
			}
		}
	}

	// write the files
	for _, filename := range files {
		if err := a.writeArchiveFile(zw, filename, board.ID, opt); err != nil {
			return fmt.Errorf("cannot write file %s to archive: %w", filename, err)
		}
	}
	return nil
}

// writeArchiveBoardMemberLine writes a single boardMember to the archive.
func (a *App) writeArchiveBoardMemberLine(w io.Writer, boardMember *model.BoardMember) error {
	bm, err := json.Marshal(&boardMember)
	if err != nil {
		return err
	}
	line := model.ArchiveLine{
		Type: "boardMember",
		Data: bm,
	}

	bm, err = json.Marshal(&line)
	if err != nil {
		return err
	}

	_, err = w.Write(bm)
	if err != nil {
		return err
	}

	_, err = w.Write(newline)
	return err
}

// writeArchiveUserLine writes a single user to the archive.
func (a *App) writeArchiveUserLine(w io.Writer, user *model.User) error {
	// Create a simplified user export (without sensitive data)
	userExport := map[string]interface{}{
		"userId":    user.ID,
		"username":  user.Username,
		"email":     user.Email,
		"firstname": user.FirstName,
		"lastname":  user.LastName,
		"nickname":  user.Nickname,
	}

	u, err := json.Marshal(&userExport)
	if err != nil {
		return err
	}

	line := model.ArchiveLine{
		Type: "user",
		Data: u,
	}

	u, err = json.Marshal(&line)
	if err != nil {
		return err
	}

	_, err = w.Write(u)
	if err != nil {
		return err
	}

	_, err = w.Write(newline)
	return err
}

// writeArchiveBlockLine writes a single block to the archive.
func (a *App) writeArchiveBlockLine(w io.Writer, block *model.Block) error {
	b, err := json.Marshal(&block)
	if err != nil {
		return err
	}
	line := model.ArchiveLine{
		Type: "block",
		Data: b,
	}

	b, err = json.Marshal(&line)
	if err != nil {
		return err
	}

	_, err = w.Write(b)
	if err != nil {
		return err
	}

	// jsonl files need a newline
	_, err = w.Write(newline)
	return err
}

// writeArchiveBlockLine writes a single block to the archive.
func (a *App) writeArchiveBoardLine(w io.Writer, board model.Board) error {
	b, err := json.Marshal(&board)
	if err != nil {
		return err
	}
	line := model.ArchiveLine{
		Type: "board",
		Data: b,
	}

	b, err = json.Marshal(&line)
	if err != nil {
		return err
	}

	_, err = w.Write(b)
	if err != nil {
		return err
	}

	// jsonl files need a newline
	_, err = w.Write(newline)
	return err
}

// writeArchiveFile writes a single file to the archive.
func (a *App) writeArchiveFile(zw *zip.Writer, filename string, boardID string, opt model.ExportArchiveOptions) error {
	dest, err := zw.Create(boardID + "/" + filename)
	if err != nil {
		return err
	}

	_, fileReader, err := a.GetFile(opt.TeamID, boardID, filename)
	if err != nil && !model.IsErrNotFound(err) {
		return err
	}
	if err != nil {
		// just log this; image file is missing but we'll still export an equivalent board
		a.logger.Error("image file missing for export",
			mlog.String("filename", filename),
			mlog.String("team_id", opt.TeamID),
			mlog.String("board_id", boardID),
		)
		return nil
	}
	defer fileReader.Close()

	_, err = io.Copy(dest, fileReader)
	return err
}

// getBoardsForArchive fetches all the specified boards.
func (a *App) getBoardsForArchive(boardIDs []string) ([]model.Board, error) {
	boards := make([]model.Board, 0, len(boardIDs))

	for _, id := range boardIDs {
		b, err := a.GetBoard(id)
		if err != nil {
			return nil, fmt.Errorf("could not fetch board %s: %w", id, err)
		}

		boards = append(boards, *b)
	}
	return boards, nil
}

func extractFilename(block *model.Block) (string, error) {
	f, ok := block.Fields["fileId"]
	if !ok {
		f, ok = block.Fields["attachmentId"]
		if !ok {
			return "", model.ErrInvalidImageBlock
		}
	}

	filename, ok := f.(string)
	if !ok {
		return "", model.ErrInvalidImageBlock
	}
	return filename, nil
}

// getUserIDsForBoard collects all unique user IDs referenced in the board.
func (a *App) getUserIDsForBoard(board model.Board, blocks []*model.Block, boardMembers []*model.BoardMember) []string {
	userIDMap := make(map[string]bool)

	// Collect from board creator
	if board.CreatedBy != "" {
		userIDMap[board.CreatedBy] = true
	}
	if board.ModifiedBy != "" {
		userIDMap[board.ModifiedBy] = true
	}

	// Collect from board members
	for _, member := range boardMembers {
		if member.UserID != "" {
			userIDMap[member.UserID] = true
		}
	}

	// Get board properties to identify person/multiPerson types
	personPropertyIDs := make(map[string]bool)
	if board.CardProperties != nil {
		for _, propMap := range board.CardProperties {
			propType, typeOk := propMap["type"].(string) // Extract "type" field
			propID, idOk := propMap["userId"].(string)   // Extract "id" field
			propName, _ := propMap["name"].(string)      // Extract "name" field

			if typeOk && idOk && (propType == "person" || propType == "multiPerson") {
				personPropertyIDs[propID] = true
				a.logger.Debug("Found person property",
					mlog.String("property_id", propID),
					mlog.String("property_name", propName),
					mlog.String("property_type", propType),
				)
			}
		}
	}

	// Collect from blocks (cards, comments, etc.)
	for _, block := range blocks {
		// Created by
		if block.CreatedBy != "" {
			userIDMap[block.CreatedBy] = true
		}
		// Modified by
		if block.ModifiedBy != "" {
			userIDMap[block.ModifiedBy] = true
		}

		// Check card properties for person/multiPerson fields
		if block.Fields != nil {
			// Fields["properties"] contains card property values
			if props, ok := block.Fields["properties"].(map[string]interface{}); ok {
				for propID, value := range props {
					// Skip if not a person property
					if !personPropertyIDs[propID] {
						continue
					}
					// Handle single person (string - user ID)
					if userID, ok := value.(string); ok && len(userID) > 0 {
						userIDMap[userID] = true
						a.logger.Debug("Found user in person property",
							mlog.String("user_id", userID),
							mlog.String("property_id", propID),
						)
					}
					// Handle multiPerson (array of user IDs)
					if userIDs, ok := value.([]interface{}); ok {
						for _, uid := range userIDs {
							if userID, ok := uid.(string); ok && len(userID) >= 20 {
								userIDMap[userID] = true
								a.logger.Debug("Found user in multiPerson property",
									mlog.String("user_id", userID),
									mlog.String("property_id", propID),
								)
							}
						}
					}
				}
			}
		}
	}

	// Convert map to slice
	userIDs := make([]string, 0, len(userIDMap))
	for userID := range userIDMap {
		userIDs = append(userIDs, userID)
	}

	a.logger.Info("Collected user IDs for export",
		mlog.Int("total_users", len(userIDs)),
	)

	return userIDs
}
