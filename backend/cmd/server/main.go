package main

import (
	"iptables-web-manager/internal/api"
	"iptables-web-manager/internal/api/handlers"
	"iptables-web-manager/internal/repository"
	"iptables-web-manager/internal/service"
	"log"
	"net/http"
	"os"
)

func main() {
	// Check root permissions
	if os.Geteuid() != 0 {
		log.Fatal("This application must be run as root to access iptables")
	}

	// Initialize database
	dbPath := "./iptables.db"
	if err := repository.InitDatabase(dbPath); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer repository.Close()

	log.Println("Database initialized successfully")

	// Initialize services
	iptablesService := service.NewIPTablesService()
	statsService := service.NewStatsService(iptablesService)
	historyRepo := repository.NewHistoryRepository(repository.DB)
	tempRuleRepo := repository.NewTempRuleRepository(repository.DB)
	authService := service.NewAuthService() // Initialize AuthService

	// Initialize scheduler for temporary rules
	scheduler := service.NewRuleScheduler(iptablesService, tempRuleRepo, historyRepo)
	scheduler.Start()
	defer scheduler.Stop()

	// Initialize handlers
	rulesHandler := handlers.NewRulesHandler(iptablesService, historyRepo, scheduler)
	statsHandler := handlers.NewStatsHandler(statsService)
	historyHandler := handlers.NewHistoryHandler(historyRepo)
	statsWSHandler := handlers.NewStatsWSHandler(statsService, authService)
	rulesWSHandler := handlers.NewRulesWSHandler(iptablesService, authService)
	authHandler := handlers.NewAuthHandler(authService)
	systemHandler := handlers.NewSystemHandler()

	// Create router
	router := api.NewRouter(
		rulesHandler,
		statsHandler,
		historyHandler,
		statsWSHandler,
		rulesWSHandler,
		authHandler,
		systemHandler,
		authService,
	)

	// Start server
	addr := ":8080"
	log.Printf("Server starting on %s", addr)
	log.Printf("API endpoints: http://localhost%s/api/v1", addr)
	log.Printf("WebSocket endpoints: ws://localhost%s/ws/{stats|rules}", addr)

	if err := http.ListenAndServe(addr, router); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
