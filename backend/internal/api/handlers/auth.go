package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"iptables-web-manager/internal/service"
)

// AuthHandler handles authentication requests
type AuthHandler struct {
	authService *service.AuthService
}

// NewAuthHandler creates a new AuthHandler
func NewAuthHandler(authService *service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

// LoginRequest represents the login request body
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// LoginResponse represents the login response body
type LoginResponse struct {
	Token string `json:"token"`
}

// Login handles user login requests
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// For now, hardcode credentials
	if req.Username != "admin" || req.Password != "proxyhuang" {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	token, err := h.authService.GenerateToken(req.Username)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	resp := LoginResponse{Token: token}
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		log.Printf("Failed to encode login response: %v", err)
	}
}