package oidc

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"fmt"

	gooidc "github.com/coreos/go-oidc/v3/oidc"
	"golang.org/x/oauth2"

	"github.com/mattermost/focalboard/server/services/config"
)

// Claims holds the OIDC id_token claims we care about.
type Claims struct {
	Sub      string `json:"sub"`
	Email    string `json:"email"`
	Name     string `json:"name"`
	Username string `json:"preferred_username"`
}

// Provider wraps go-oidc and oauth2 into a single helper.
type Provider struct {
	verifier    *gooidc.IDTokenVerifier
	oauthConfig oauth2.Config
}

// New initialises the OIDC provider by fetching the discovery document
// from cfg.ProviderURL.
func New(cfg *config.OIDCConfig) (*Provider, error) {
	ctx := context.Background()
	p, err := gooidc.NewProvider(ctx, cfg.ProviderURL)
	if err != nil {
		return nil, fmt.Errorf("oidc: failed to fetch provider %s: %w", cfg.ProviderURL, err)
	}

	scopes := cfg.Scopes
	if len(scopes) == 0 {
		scopes = []string{gooidc.ScopeOpenID, "profile", "email"}
	}

	return &Provider{
		verifier: p.Verifier(&gooidc.Config{ClientID: cfg.ClientID}),
		oauthConfig: oauth2.Config{
			ClientID:     cfg.ClientID,
			ClientSecret: cfg.ClientSecret,
			Endpoint:     p.Endpoint(),
			Scopes:       scopes,
		},
	}, nil
}

// AuthCodeURL builds the redirect URL for the authorization endpoint.
func (p *Provider) AuthCodeURL(state, redirectURL string) string {
	cfg := p.oauthConfig
	cfg.RedirectURL = redirectURL
	return cfg.AuthCodeURL(state)
}

// Exchange exchanges the authorization code for tokens and returns
// the verified claims from the id_token.
func (p *Provider) Exchange(ctx context.Context, code, redirectURL string) (*Claims, error) {
	cfg := p.oauthConfig
	cfg.RedirectURL = redirectURL

	token, err := cfg.Exchange(ctx, code)
	if err != nil {
		return nil, fmt.Errorf("oidc: code exchange failed: %w", err)
	}

	rawIDToken, ok := token.Extra("id_token").(string)
	if !ok {
		return nil, fmt.Errorf("oidc: no id_token in token response")
	}

	idToken, err := p.verifier.Verify(ctx, rawIDToken)
	if err != nil {
		return nil, fmt.Errorf("oidc: id_token verification failed: %w", err)
	}

	var claims Claims
	if err := idToken.Claims(&claims); err != nil {
		return nil, fmt.Errorf("oidc: failed to decode claims: %w", err)
	}

	return &claims, nil
}

// GenerateState returns a cryptographically random state string for
// CSRF protection during the OAuth2 flow.
func GenerateState() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}
