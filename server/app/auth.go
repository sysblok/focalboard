package app

import (
	"fmt"
	"strings"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/auth"
	"github.com/mattermost/focalboard/server/utils"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"

	"github.com/pkg/errors"
)

const (
	DaysPerMonth     = 30
	DaysPerWeek      = 7
	HoursPerDay      = 24
	MinutesPerHour   = 60
	SecondsPerMinute = 60
)

// GetSession Get a user active session and refresh the session if is needed.
func (a *App) GetSession(token string) (*model.Session, error) {
	return a.auth.GetSession(token)
}

// IsValidReadToken validates the read token for a block.
func (a *App) IsValidReadToken(boardID string, readToken string) (bool, error) {
	return a.auth.IsValidReadToken(boardID, readToken)
}

// GetRegisteredUserCount returns the number of registered users.
func (a *App) GetRegisteredUserCount() (int, error) {
	return a.store.GetRegisteredUserCount()
}

// GetDailyActiveUsers returns the number of daily active users.
func (a *App) GetDailyActiveUsers() (int, error) {
	secondsAgo := int64(SecondsPerMinute * MinutesPerHour * HoursPerDay)
	return a.store.GetActiveUserCount(secondsAgo)
}

// GetWeeklyActiveUsers returns the number of weekly active users.
func (a *App) GetWeeklyActiveUsers() (int, error) {
	secondsAgo := int64(SecondsPerMinute * MinutesPerHour * HoursPerDay * DaysPerWeek)
	return a.store.GetActiveUserCount(secondsAgo)
}

// GetMonthlyActiveUsers returns the number of monthly active users.
func (a *App) GetMonthlyActiveUsers() (int, error) {
	secondsAgo := int64(SecondsPerMinute * MinutesPerHour * HoursPerDay * DaysPerMonth)
	return a.store.GetActiveUserCount(secondsAgo)
}

// GetUser gets an existing active user by id.
func (a *App) GetUser(id string) (*model.User, error) {
	if len(id) < 1 {
		return nil, errors.New("no user ID")
	}

	user, err := a.store.GetUserByID(id)
	if err != nil {
		return nil, errors.Wrap(err, "unable to find user")
	}
	return user, nil
}

func (a *App) GetUsersList(userIDs []string) ([]*model.User, error) {
	if len(userIDs) == 0 {
		return nil, errors.New("No User IDs")
	}

	users, err := a.store.GetUsersList(userIDs, a.config.ShowEmailAddress, a.config.ShowFullName)
	if err != nil {
		return nil, errors.Wrap(err, "unable to find users")
	}
	return users, nil
}

// Login create a new user session if the authentication data is valid.
func (a *App) Login(username, email, password, mfaToken string) (string, error) {
	var user *model.User
	if username != "" {
		var err error
		user, err = a.store.GetUserByUsername(username)
		if err != nil && !model.IsErrNotFound(err) {
			a.metrics.IncrementLoginFailCount(1)
			return "", errors.Wrap(err, "invalid username or password")
		}
	}

	if user == nil && email != "" {
		var err error
		user, err = a.store.GetUserByEmail(email)
		if err != nil && model.IsErrNotFound(err) {
			a.metrics.IncrementLoginFailCount(1)
			return "", errors.Wrap(err, "invalid username or password")
		}
	}

	if user == nil {
		a.metrics.IncrementLoginFailCount(1)
		return "", errors.New("invalid username or password")
	}

	if !auth.ComparePassword(user.Password, password) {
		a.metrics.IncrementLoginFailCount(1)
		a.logger.Debug("Invalid password for user", mlog.String("userID", user.ID))
		return "", errors.New("invalid username or password")
	}

	authService := user.AuthService
	if authService == "" {
		authService = "native"
	}

	session := model.Session{
		ID:          utils.NewID(utils.IDTypeSession),
		Token:       utils.NewID(utils.IDTypeToken),
		UserID:      user.ID,
		AuthService: authService,
		Props:       map[string]interface{}{},
	}
	err := a.store.CreateSession(&session)
	if err != nil {
		return "", errors.Wrap(err, "unable to create session")
	}

	a.metrics.IncrementLoginCount(1)

	// TODO: MFA verification
	return session.Token, nil
}

// Logout invalidates the user session.
func (a *App) Logout(sessionID string) error {
	err := a.store.DeleteSession(sessionID)
	if err != nil {
		return errors.Wrap(err, "unable to delete the session")
	}

	a.metrics.IncrementLogoutCount(1)

	return nil
}

// RegisterUser creates a new user if the provided data is valid.
func (a *App) RegisterUser(username, email, password string) error {
	var user *model.User
	if username != "" {
		var err error
		user, err = a.store.GetUserByUsername(username)
		if err != nil && !model.IsErrNotFound(err) {
			return err
		}
		if user != nil {
			return errors.New("The username already exists")
		}
	}

	if user == nil && email != "" {
		var err error
		user, err = a.store.GetUserByEmail(email)
		if err != nil && !model.IsErrNotFound(err) {
			return err
		}
		if user != nil {
			return errors.New("The email already exists")
		}
	}

	// TODO: Move this into the config
	passwordSettings := auth.PasswordSettings{
		MinimumLength: 6,
	}

	err := auth.IsPasswordValid(password, passwordSettings)
	if err != nil {
		return errors.Wrap(err, "Invalid password")
	}

	_, err = a.store.CreateUser(&model.User{
		ID:          utils.NewID(utils.IDTypeUser),
		Username:    username,
		Email:       email,
		Password:    auth.HashPassword(password),
		MfaSecret:   "",
		AuthService: a.config.AuthMode,
		AuthData:    "",
	})
	if err != nil {
		return errors.Wrap(err, "Unable to create the new user")
	}

	return nil
}

// RegisterOrFetchUser creates a new user if the provided data is valid.
func (a *App) RegisterOrFetchUser(username, email, password string) (string, error) {
	var user *model.User
	if username != "" {
		var err error
		user, err = a.store.GetUserByUsername(username)
		if err != nil && !model.IsErrNotFound(err) {
			return "", err
		}
		if user != nil {
			return user.ID, errors.New("The username already exists")
		}
	}

	if user == nil && email != "" {
		var err error
		user, err = a.store.GetUserByEmail(email)
		if err != nil && !model.IsErrNotFound(err) {
			return "", err
		}
		if user != nil {
			return user.ID, errors.New("The email already exists")
		}
	}

	// TODO: Move this into the config
	passwordSettings := auth.PasswordSettings{
		MinimumLength: 6,
	}

	err := auth.IsPasswordValid(password, passwordSettings)
	if err != nil {
		return "", errors.Wrap(err, "Invalid password")
	}

	user, err = a.store.CreateUser(&model.User{
		ID:          utils.NewID(utils.IDTypeUser),
		Username:    username,
		Email:       email,
		Password:    auth.HashPassword(password),
		MfaSecret:   "",
		AuthService: a.config.AuthMode,
		AuthData:    "",
	})
	if err != nil {
		return "", errors.Wrap(err, "Unable to create the new user")
	}

	return user.ID, nil
}

func (a *App) UpdateUserPassword(username, password string) error {
	err := a.store.UpdateUserPassword(username, auth.HashPassword(password))
	if err != nil {
		return err
	}

	return nil
}

func (a *App) UpdateUserPasswordByID(userID, password string) error {

	if userID == "" {
		return errors.New("userID is required")
	}

	user, err := a.store.GetUserByID(userID)
	if err != nil {
		return errors.Wrap(err, "user not found")
	}

	if user == nil {
		return errors.New("user not found")
	}

	if password == "" {
		return errors.New("password cannot be empty")
	}

	a.logger.Info("Admin password change initiated",
		mlog.String("targetUserID", userID),
		mlog.String("username", user.Username))

	err = a.store.UpdateUserPasswordByID(userID, auth.HashPassword(password))
	if err != nil {
		a.logger.Error("Failed to update user password",
			mlog.String("userID", userID),
			mlog.Err(err))
		return errors.Wrap(err, "unable to update password")
	}

	a.logger.Info("Admin password change completed successfully",
		mlog.String("targetUserID", userID),
		mlog.String("username", user.Username))
	return nil
}

func (a *App) ChangePassword(userID, oldPassword, newPassword string) error {
	var user *model.User
	if userID != "" {
		var err error
		user, err = a.store.GetUserByID(userID)
		if err != nil {
			return errors.Wrap(err, "invalid username or password")
		}
	}

	if user == nil {
		return errors.New("invalid username or password")
	}

	if !auth.ComparePassword(user.Password, oldPassword) {
		a.logger.Debug("Invalid password for user", mlog.String("userID", user.ID))
		return errors.New("invalid username or password")
	}

	err := a.store.UpdateUserPasswordByID(userID, auth.HashPassword(newPassword))
	if err != nil {
		return errors.Wrap(err, "unable to update password")
	}

	return nil
}

func (a *App) ChangeEmail(userID, oldPassword, newEmail string) error {
	var user *model.User
	if userID != "" {
		var err error
		user, err = a.store.GetUserByID(userID)
		if err != nil {
			return errors.Wrap(err, "invalid username or password")
		}
	}

	if user == nil {
		return errors.New("invalid username or password")
	}

	if !auth.ComparePassword(user.Password, oldPassword) {
		a.logger.Debug("Invalid password for user", mlog.String("userID", user.ID))
		return errors.New("invalid username or password")
	}

	err := a.store.UpdateUserEmailByID(userID, newEmail)
	if err != nil {
		return errors.Wrap(err, "unable to update email")
	}

	return nil
}

// GetOrCreateOIDCUser finds or creates a focalboard user for an OIDC login.
// Lookup order: sub claim → email → auto-create.
func (a *App) GetOrCreateOIDCUser(sub, email, name, preferredUsername string) (*model.User, error) {
	// 1. Exact match by OIDC subject
	user, err := a.store.GetUserByAuthData("oidc", sub)
	if err == nil {
		return user, nil
	}
	if !model.IsErrNotFound(err) {
		return nil, errors.Wrap(err, "oidc: auth data lookup failed")
	}

	// 2. Existing user with matching email (link OIDC to it)
	if email != "" {
		user, err = a.store.GetUserByEmail(email)
		if err == nil {
			return user, nil
		}
		if !model.IsErrNotFound(err) {
			return nil, errors.Wrap(err, "oidc: email lookup failed")
		}
	}

	// 3. Auto-provision a new user
	username := preferredUsername
	if username == "" {
		username = strings.Split(email, "@")[0]
	}
	if username == "" {
		username = fmt.Sprintf("oidc_%s", sub[:8])
	}

	// Ensure uniqueness
	base := username
	for i := 1; ; i++ {
		_, lookupErr := a.store.GetUserByUsername(username)
		if model.IsErrNotFound(lookupErr) {
			break
		}
		if lookupErr != nil {
			return nil, errors.Wrap(lookupErr, "oidc: username uniqueness check failed")
		}
		username = fmt.Sprintf("%s_%d", base, i)
	}

	newUser, err := a.store.CreateUser(&model.User{
		ID:          utils.NewID(utils.IDTypeUser),
		Username:    username,
		Email:       email,
		AuthService: "oidc",
		AuthData:    sub,
	})
	if err != nil {
		return nil, errors.Wrap(err, "oidc: user creation failed")
	}
	return newUser, nil
}

// LoginOIDC creates a new session for an already-resolved OIDC user.
func (a *App) LoginOIDC(user *model.User) (string, error) {
	session := model.Session{
		ID:          utils.NewID(utils.IDTypeSession),
		Token:       utils.NewID(utils.IDTypeToken),
		UserID:      user.ID,
		AuthService: "oidc",
		Props:       map[string]interface{}{},
	}
	if err := a.store.CreateSession(&session); err != nil {
		return "", errors.Wrap(err, "oidc: session creation failed")
	}
	a.metrics.IncrementLoginCount(1)
	return session.Token, nil
}

func (a *App) ChangeUsername(userID, oldPassword, newUsername string) error {
	var user *model.User
	if userID != "" {
		var err error
		user, err = a.store.GetUserByID(userID)
		if err != nil {
			return errors.Wrap(err, "invalid username or password")
		}
	}

	if user == nil {
		return errors.New("invalid username or password")
	}

	if !auth.ComparePassword(user.Password, oldPassword) {
		a.logger.Debug("Invalid password for user", mlog.String("userID", user.ID))
		return errors.New("invalid username or password")
	}

	err := a.store.UpdateUserUsernameByID(userID, newUsername)
	if err != nil {
		return errors.Wrap(err, "unable to update username")
	}

	return nil
}
