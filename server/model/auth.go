package model

import (
	"encoding/json"
	"fmt"
	"io"
	"strings"

	"github.com/mattermost/focalboard/server/services/auth"
)

const (
	MinimumPasswordLength = 8
)

func NewErrAuthParam(msg string) *ErrAuthParam {
	return &ErrAuthParam{
		msg: msg,
	}
}

type ErrAuthParam struct {
	msg string
}

func (pe *ErrAuthParam) Error() string {
	return pe.msg
}

// LoginRequest is a login request
// swagger:model
type LoginRequest struct {
	// Type of login, currently must be set to "normal"
	// required: true
	Type string `json:"type"`

	// If specified, login using username
	// required: false
	Username string `json:"username"`

	// If specified, login using email
	// required: false
	Email string `json:"email"`

	// Password
	// required: true
	Password string `json:"password"`

	// MFA token
	// required: false
	// swagger:ignore
	MfaToken string `json:"mfa_token"`
}

// LoginResponse is a login response
// swagger:model
type LoginResponse struct {
	// Session token
	// required: true
	Token string `json:"token"`
}

func LoginResponseFromJSON(data io.Reader) (*LoginResponse, error) {
	var resp LoginResponse
	if err := json.NewDecoder(data).Decode(&resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

// RegisterRequest is a user registration request
// swagger:model
type RegisterRequest struct {
	// User name
	// required: true
	Username string `json:"username"`

	// User's email
	// required: true
	Email string `json:"email"`

	// Password
	// required: true
	Password string `json:"password"`

	// Registration authorization token
	// required: true
	Token string `json:"token"`
}

func (rd *RegisterRequest) IsValid() error {
	if strings.TrimSpace(rd.Username) == "" {
		return NewErrAuthParam("username is required")
	}
	if strings.TrimSpace(rd.Email) == "" {
		return NewErrAuthParam("email is required")
	}
	if !auth.IsEmailValid(rd.Email) {
		return NewErrAuthParam("invalid email format")
	}
	if rd.Password == "" {
		return NewErrAuthParam("password is required")
	}
	return isValidPassword(rd.Password)
}

// ChangePasswordRequest is a user password change request
// swagger:model
type ChangePasswordRequest struct {
	// Old password
	// required: true
	OldPassword string `json:"oldPassword"`

	// New password
	// required: true
	NewPassword string `json:"newPassword"`
}

// IsValid validates a password change request.
func (rd *ChangePasswordRequest) IsValid() error {
	if rd.OldPassword == "" {
		return NewErrAuthParam("old password is required")
	}
	if rd.NewPassword == "" {
		return NewErrAuthParam("new password is required")
	}
	return isValidPassword(rd.NewPassword)
}

func isValidPassword(password string) error {
	if len(password) < MinimumPasswordLength {
		return NewErrAuthParam(fmt.Sprintf("password must be at least %d characters", MinimumPasswordLength))
	}
	return nil
}

// ChangeEmailRequest is a user email change request
// swagger:model
type ChangeEmailRequest struct {
	// Password
	// required: true
	Password string `json:"password"`

	// New email
	// required: true
	NewEmail string `json:"newEmail"`
}

// IsValid validates a password change request.
func (rd *ChangeEmailRequest) IsValid() error {
	if strings.TrimSpace(rd.Password) == "" {
		return NewErrAuthParam("password is required")
	}
	if strings.TrimSpace(rd.NewEmail) == "" {
		return NewErrAuthParam("new email is required")
	}
	return isValidEmail(rd.NewEmail)
}

func isValidEmail(email string) error {
	if !auth.IsEmailValid(email) {
		return NewErrAuthParam("invalid email format")
	}
	return nil
}

// ChangeUsernameRequest is a username change request
// swagger:model
type ChangeUsernameRequest struct {
	// Password
	// required: true
	Password string `json:"password"`

	// New username
	// required: true
	NewUsername string `json:"newUsername"`
}

// IsValid validates a password change request.
func (rd *ChangeUsernameRequest) IsValid() error {
	if strings.TrimSpace(rd.Password) == "" {
		return NewErrAuthParam("password is required")
	}
	if strings.TrimSpace(rd.NewUsername) == "" {
		return NewErrAuthParam("new username is required")
	}
	return isValidUsername(rd.NewUsername)
}

func isValidUsername(username string) error {
	// TODO: reconsider, always valid
	return nil
}
