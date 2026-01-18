package handlers

import (
	"encoding/json"
	"net/http"

	"iptables-web-manager/internal/version"
)

type SystemHandler struct{}

func NewSystemHandler() *SystemHandler {
	return &SystemHandler{}
}

func (h *SystemHandler) GetVersion(w http.ResponseWriter, r *http.Request) {
	response := map[string]string{
		"version":    version.Version,
		"commit":     version.Commit,
		"build_time": version.BuildTime,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
