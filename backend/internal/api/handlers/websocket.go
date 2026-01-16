package handlers

import (
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"iptables-web-manager/internal/service"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // TODO: Implement proper origin checking in production
	},
}

// WSMessage represents a WebSocket message
type WSMessage struct {
	Type string      `json:"type"` // "stats", "rules", "error"
	Data interface{} `json:"data"`
	Time time.Time   `json:"time"`
}

// StatsWSHandler handles WebSocket connections for stats
type StatsWSHandler struct {
	statsService *service.StatsService
	authService  *service.AuthService
}

// NewStatsWSHandler creates a new stats WebSocket handler
func NewStatsWSHandler(statsService *service.StatsService, authService *service.AuthService) *StatsWSHandler {
	return &StatsWSHandler{statsService: statsService, authService: authService}
}

// HandleStatsWS handles WebSocket connection for stats
func (h *StatsWSHandler) HandleStatsWS(w http.ResponseWriter, r *http.Request) {
	// Authenticate before upgrading
	tokenString := r.URL.Query().Get("token")
	if tokenString == "" {
		http.Error(w, "Missing token", http.StatusUnauthorized)
		return
	}
	if _, err := h.authService.ValidateToken(tokenString); err != nil {
		http.Error(w, "Invalid token", http.StatusUnauthorized)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		http.Error(w, fmt.Sprintf("WebSocket upgrade error: %v", err), http.StatusInternalServerError)
		return
	}
	defer conn.Close()

	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		stats, err := h.statsService.GetTrafficStats()
		if err != nil {
			msg := WSMessage{
				Type: "error",
				Data: map[string]string{"error": err.Error()},
				Time: time.Now(),
			}
			if err := conn.WriteJSON(msg); err != nil {
				log.Printf("WebSocket write error: %v", err)
				return
			}
			continue
		}

		msg := WSMessage{
			Type: "stats",
			Data: stats,
			Time: time.Now(),
		}

		if err := conn.WriteJSON(msg); err != nil {
			log.Printf("WebSocket write error: %v", err)
			return
		}
	}
}

// RulesWSHandler handles WebSocket connections for rules
type RulesWSHandler struct {
	iptablesService *service.IPTablesService
	authService     *service.AuthService
}

// NewRulesWSHandler creates a new rules WebSocket handler
func NewRulesWSHandler(iptablesService *service.IPTablesService, authService *service.AuthService) *RulesWSHandler {
	return &RulesWSHandler{iptablesService: iptablesService, authService: authService}
}

// HandleRulesWS handles WebSocket connection for rules
func (h *RulesWSHandler) HandleRulesWS(w http.ResponseWriter, r *http.Request) {
	// Authenticate before upgrading
	tokenString := r.URL.Query().Get("token")
	if tokenString == "" {
		http.Error(w, "Missing token", http.StatusUnauthorized)
		return
	}
	if _, err := h.authService.ValidateToken(tokenString); err != nil {
		http.Error(w, "Invalid token", http.StatusUnauthorized)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		http.Error(w, fmt.Sprintf("WebSocket upgrade error: %v", err), http.StatusInternalServerError)
		return
	}
	defer conn.Close()

	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	var lastRulesHash string

	for range ticker.C {
		rules, err := h.iptablesService.GetAllRules()
		if err != nil {
			continue
		}

		// Calculate hash to detect changes
		rulesJSON, _ := json.Marshal(rules)
		currentHash := hashString(string(rulesJSON))

		if currentHash != lastRulesHash {
			lastRulesHash = currentHash

			msg := WSMessage{
				Type: "rules",
				Data: rules,
				Time: time.Now(),
			}

			if err := conn.WriteJSON(msg); err != nil {
				log.Printf("WebSocket write error: %v", err)
				return
			}
		}
	}
}

// hashString calculates SHA256 hash of a string
func hashString(s string) string {
	h := sha256.New()
	h.Write([]byte(s))
	return fmt.Sprintf("%x", h.Sum(nil))
}
