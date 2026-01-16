package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"iptables-web-manager/internal/service"
)

type contextKey string

const userContextKey = contextKey("username")

// AuthMiddleware creates a middleware for authentication
func AuthMiddleware(authService *service.AuthService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				http.Error(w, "Authorization header required", http.StatusUnauthorized)
				return
			}

			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
				http.Error(w, "Invalid Authorization header format", http.StatusUnauthorized)
				return
			}

			tokenString := parts[1]
			token, err := authService.ValidateToken(tokenString)
			if err != nil {
				http.Error(w, "Invalid token", http.StatusUnauthorized)
				return
			}

			claims, ok := token.Claims.(jwt.MapClaims)
			if !ok || !token.Valid {
				http.Error(w, "Invalid token claims", http.StatusUnauthorized)
				return
			}

			username, ok := claims["username"].(string)
			if !ok {
				http.Error(w, "Invalid username in token", http.StatusUnauthorized)
				return
			}
			
			// Add username to context
			ctx := context.WithValue(r.Context(), userContextKey, username)
			r = r.WithContext(ctx)

			next.ServeHTTP(w, r)
		})
	}
}
