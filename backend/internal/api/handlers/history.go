package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"iptables-web-manager/internal/repository"

	"github.com/gorilla/mux"
)

// HistoryHandler handles history-related HTTP requests
type HistoryHandler struct {
	historyRepo *repository.HistoryRepository
}

// NewHistoryHandler creates a new history handler
func NewHistoryHandler(historyRepo *repository.HistoryRepository) *HistoryHandler {
	return &HistoryHandler{
		historyRepo: historyRepo,
	}
}

// GetHistory handles GET /api/v1/history
func (h *HistoryHandler) GetHistory(w http.ResponseWriter, r *http.Request) {
	// Parse pagination parameters
	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")

	limit := 50 // default
	offset := 0

	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil {
			limit = l
		}
	}
	if offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil {
			offset = o
		}
	}

	histories, err := h.historyRepo.GetAll(limit, offset)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(histories); err != nil {
		log.Printf("Failed to encode history response: %v", err)
	}
}

// GetHistoryByID handles GET /api/v1/history/{id}
func (h *HistoryHandler) GetHistoryByID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	history, err := h.historyRepo.GetByID(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if history == nil {
		http.Error(w, "History not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(history); err != nil {
		log.Printf("Failed to encode history response: %v", err)
	}
}
