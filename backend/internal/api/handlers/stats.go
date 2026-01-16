package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"iptables-web-manager/internal/service"
)

// StatsHandler handles statistics-related HTTP requests
type StatsHandler struct {
	statsService *service.StatsService
}

// NewStatsHandler creates a new stats handler
func NewStatsHandler(statsService *service.StatsService) *StatsHandler {
	return &StatsHandler{
		statsService: statsService,
	}
}

// GetTrafficStats handles GET /api/v1/stats/traffic
func (h *StatsHandler) GetTrafficStats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.statsService.GetTrafficStats()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(stats); err != nil {
		log.Printf("Failed to encode stats response: %v", err)
	}
}

// GetRuleStats handles GET /api/v1/stats/rules
func (h *StatsHandler) GetRuleStats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.statsService.GetRuleStats()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(stats); err != nil {
		log.Printf("Failed to encode stats response: %v", err)
	}
}
