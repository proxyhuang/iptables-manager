package api

import (
	"iptables-web-manager/internal/api/handlers"
	"iptables-web-manager/internal/api/middleware"
	"iptables-web-manager/internal/service"

	"github.com/gorilla/mux"
)

// NewRouter creates and configures the application router
func NewRouter(
	rulesHandler *handlers.RulesHandler,
	statsHandler *handlers.StatsHandler,
	historyHandler *handlers.HistoryHandler,
	statsWSHandler *handlers.StatsWSHandler,
	rulesWSHandler *handlers.RulesWSHandler,
	authHandler *handlers.AuthHandler,
	systemHandler *handlers.SystemHandler,
	authService *service.AuthService,
) *mux.Router {
	r := mux.NewRouter()

	// Apply global middlewares
	r.Use(middleware.CORS)
	r.Use(middleware.Logger)
	
	// Create subrouter for login, which should not have auth middleware
	authRouter := r.PathPrefix("/api/v1/auth").Subrouter()
	authRouter.HandleFunc("/login", authHandler.Login).Methods("POST")

	// System endpoints (public)
	r.HandleFunc("/api/v1/version", systemHandler.GetVersion).Methods("GET")

	// Create a subrouter for all other API endpoints and apply auth middleware
	api := r.PathPrefix("/api/v1").Subrouter()
	api.Use(middleware.AuthMiddleware(authService))

	// Rules endpoints
	api.HandleFunc("/rules", rulesHandler.GetRules).Methods("GET")
	api.HandleFunc("/rules/search", rulesHandler.SearchRules).Methods("GET")
	api.HandleFunc("/rules/export/csv", rulesHandler.ExportRules).Methods("GET")
	api.HandleFunc("/rules/{table}", rulesHandler.GetRulesByTable).Methods("GET")
	api.HandleFunc("/rules", rulesHandler.AddRule).Methods("POST")
	api.HandleFunc("/rules", rulesHandler.DeleteRule).Methods("DELETE")

	// Statistics endpoints
	api.HandleFunc("/stats/traffic", statsHandler.GetTrafficStats).Methods("GET")
	api.HandleFunc("/stats/rules", statsHandler.GetRuleStats).Methods("GET")

	// History endpoints
	api.HandleFunc("/history", historyHandler.GetHistory).Methods("GET")
	api.HandleFunc("/history/{id}", historyHandler.GetHistoryByID).Methods("GET")

	// WebSocket endpoints (These are not under /api/v1 and will need separate auth handling)
	r.HandleFunc("/ws/stats", statsWSHandler.HandleStatsWS)
	r.HandleFunc("/ws/rules", rulesWSHandler.HandleRulesWS)

	return r
}
