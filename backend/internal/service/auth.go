package service

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// TODO: Move this to a secure environment variable
var jwtSecret = []byte("a_very_secret_key")

// AuthService provides authentication services
type AuthService struct{}

// NewAuthService creates a new AuthService
func NewAuthService() *AuthService {
	return &AuthService{}
}

// GenerateToken generates a new JWT for a given username
func (s *AuthService) GenerateToken(username string) (string, error) {
	// Create a new token object, specifying signing method and the claims
	claims := jwt.MapClaims{
		"username": username,
		"exp":      time.Now().Add(time.Hour * 72).Unix(),
		"iat":      time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign and get the complete encoded token as a string using the secret
	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		return "", fmt.Errorf("failed to sign token: %w", err)
	}

	return tokenString, nil
}

// ValidateToken validates a given JWT string
func (s *AuthService) ValidateToken(tokenString string) (*jwt.Token, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Don't forget to validate the alg is what you expect:
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return jwtSecret, nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %w", err)
	}

	if !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	return token, nil
}
