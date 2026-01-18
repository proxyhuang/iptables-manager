package handlers

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"iptables-web-manager/internal/models"
	"iptables-web-manager/internal/repository"
	"iptables-web-manager/internal/service"

	"github.com/gorilla/mux"
)

// RulesHandler handles rule-related HTTP requests
type RulesHandler struct {
	iptablesService *service.IPTablesService
	historyRepo     *repository.HistoryRepository
	scheduler       *service.RuleScheduler
}

// NewRulesHandler creates a new rules handler
func NewRulesHandler(
	iptablesService *service.IPTablesService,
	historyRepo *repository.HistoryRepository,
	scheduler *service.RuleScheduler,
) *RulesHandler {
	return &RulesHandler{
		iptablesService: iptablesService,
		historyRepo:     historyRepo,
		scheduler:       scheduler,
	}
}

// GetRules handles GET /api/v1/rules
func (h *RulesHandler) GetRules(w http.ResponseWriter, r *http.Request) {
	rules, err := h.iptablesService.GetAllRules()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(rules); err != nil {
		log.Printf("Failed to encode rules response: %v", err)
	}
}

// GetRulesByTable handles GET /api/v1/rules/{table}
func (h *RulesHandler) GetRulesByTable(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	table := vars["table"]

	rules, err := h.iptablesService.GetRulesByTable(table)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(rules); err != nil {
		log.Printf("Failed to encode rules response: %v", err)
	}
}

// AddRule handles POST /api/v1/rules
func (h *RulesHandler) AddRule(w http.ResponseWriter, r *http.Request) {
	var req models.RuleCreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Create history record
	history := &models.History{
		Action:      "ADD",
		Table:       req.Table,
		Chain:       req.Chain,
		RuleDetails: h.iptablesService.FormatRuleDetails(req),
		User:        "admin", // TODO: Get from authentication
		IPAddress:   r.RemoteAddr,
	}

	// Execute rule addition
	err := h.iptablesService.AddRule(req)
	if err != nil {
		history.Success = false
		history.ErrorMsg = err.Error()
		if createErr := h.historyRepo.Create(history); createErr != nil {
			log.Printf("Failed to create history record: %v", createErr)
		}

		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	history.Success = true
	if createErr := h.historyRepo.Create(history); createErr != nil {
		log.Printf("Failed to create history record: %v", createErr)
	}

	// Schedule auto-deletion if expires_in is set
	if req.ExpiresIn > 0 && h.scheduler != nil {
		ruleSpec := h.iptablesService.FormatRuleDetails(req)
		if err := h.scheduler.ScheduleRuleDeletion(req.Table, req.Chain, ruleSpec, req.ExpiresIn); err != nil {
			log.Printf("Failed to schedule rule expiry: %v", err)
		} else {
			log.Printf("Scheduled rule for auto-deletion in %d seconds", req.ExpiresIn)
		}
	}

	w.WriteHeader(http.StatusCreated)
	response := map[string]interface{}{
		"status":  "success",
		"message": "Rule added successfully",
	}
	if req.ExpiresIn > 0 {
		response["expires_in"] = req.ExpiresIn
		response["message"] = "Test rule added successfully (will auto-delete)"
	}
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Failed to encode response: %v", err)
	}
}

// DeleteRule handles DELETE /api/v1/rules
func (h *RulesHandler) DeleteRule(w http.ResponseWriter, r *http.Request) {
	var req models.RuleDeleteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	history := &models.History{
		Action:      "DELETE",
		Table:       req.Table,
		Chain:       req.Chain,
		RuleDetails: h.iptablesService.FormatDeleteDetails(req),
		User:        "admin",
		IPAddress:   r.RemoteAddr,
	}

	err := h.iptablesService.DeleteRule(req)
	if err != nil {
		history.Success = false
		history.ErrorMsg = err.Error()
		if createErr := h.historyRepo.Create(history); createErr != nil {
			log.Printf("Failed to create history record: %v", createErr)
		}

		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	history.Success = true
	if createErr := h.historyRepo.Create(history); createErr != nil {
		log.Printf("Failed to create history record: %v", createErr)
	}

	if err := json.NewEncoder(w).Encode(map[string]string{"status": "success", "message": "Rule deleted successfully"}); err != nil {
		log.Printf("Failed to encode response: %v", err)
	}
}

// SearchRules handles GET /api/v1/rules/search
func (h *RulesHandler) SearchRules(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		http.Error(w, "Query parameter 'q' is required", http.StatusBadRequest)
		return
	}

	rules, err := h.iptablesService.SearchRules(query)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(rules); err != nil {
		log.Printf("Failed to encode rules response: %v", err)
	}
}

// ExportRules handles GET /api/v1/rules/export/csv
func (h *RulesHandler) ExportRules(w http.ResponseWriter, r *http.Request) {
	rules, err := h.iptablesService.GetAllRules()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", "attachment; filename=\"iptables_rules.csv\"")

	writer := csv.NewWriter(w)
	defer writer.Flush()

	// Write header
	header := []string{"Table", "Chain", "Protocol", "Source", "Destination", "Target", "Options", "Packets", "Bytes"}
	if err := writer.Write(header); err != nil {
		log.Printf("Failed to write CSV header: %v", err)
		http.Error(w, "Failed to generate CSV", http.StatusInternalServerError)
		return
	}

	// Write data
	for _, rule := range rules {
		row := []string{
			rule.Table,
			rule.Chain,
			rule.Protocol,
			rule.Source,
			rule.Destination,
			rule.Target,
			rule.Options,
			fmt.Sprintf("%d", rule.Packets),
			fmt.Sprintf("%d", rule.Bytes),
		}
		if err := writer.Write(row); err != nil {
			log.Printf("Failed to write CSV row: %v", err)
			return
		}
	}
}
