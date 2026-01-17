package service

import (
	"log"
	"strings"
	"sync"
	"time"

	"iptables-web-manager/internal/models"
	"iptables-web-manager/internal/repository"
)

// RuleScheduler manages automatic deletion of temporary rules
type RuleScheduler struct {
	iptablesService *IPTablesService
	tempRuleRepo    *repository.TempRuleRepository
	historyRepo     *repository.HistoryRepository
	mu              sync.Mutex
	stopChan        chan struct{}
	wg              sync.WaitGroup
}

// NewRuleScheduler creates a new RuleScheduler
func NewRuleScheduler(
	iptablesService *IPTablesService,
	tempRuleRepo *repository.TempRuleRepository,
	historyRepo *repository.HistoryRepository,
) *RuleScheduler {
	return &RuleScheduler{
		iptablesService: iptablesService,
		tempRuleRepo:    tempRuleRepo,
		historyRepo:     historyRepo,
		stopChan:        make(chan struct{}),
	}
}

// Start begins the scheduler cleanup loop
func (s *RuleScheduler) Start() {
	s.wg.Add(1)
	go s.cleanupLoop()
	log.Println("Rule scheduler started")
}

// Stop terminates the scheduler gracefully
func (s *RuleScheduler) Stop() {
	close(s.stopChan)
	s.wg.Wait()
	log.Println("Rule scheduler stopped")
}

// ScheduleRuleDeletion schedules a rule for automatic deletion
func (s *RuleScheduler) ScheduleRuleDeletion(table, chain, ruleSpec string, expiresIn int) error {
	tempRule := &models.TemporaryRule{
		Table:     table,
		Chain:     chain,
		RuleSpec:  ruleSpec,
		ExpiresAt: time.Now().Add(time.Duration(expiresIn) * time.Second),
		CreatedAt: time.Now(),
	}
	return s.tempRuleRepo.Create(tempRule)
}

// cleanupLoop periodically checks for and deletes expired rules
func (s *RuleScheduler) cleanupLoop() {
	defer s.wg.Done()

	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-s.stopChan:
			return
		case <-ticker.C:
			s.cleanupExpiredRules()
		}
	}
}

// cleanupExpiredRules finds and deletes all expired rules
func (s *RuleScheduler) cleanupExpiredRules() {
	s.mu.Lock()
	defer s.mu.Unlock()

	expired, err := s.tempRuleRepo.GetExpired()
	if err != nil {
		log.Printf("Error fetching expired rules: %v", err)
		return
	}

	for _, rule := range expired {
		// Find the current line number by matching the rule spec
		lineNumber := s.findRuleLineNumber(rule.Table, rule.Chain, rule.RuleSpec)

		if lineNumber > 0 {
			req := models.RuleDeleteRequest{
				Table:      rule.Table,
				Chain:      rule.Chain,
				LineNumber: lineNumber,
			}

			if err := s.iptablesService.DeleteRule(req); err != nil {
				log.Printf("Failed to auto-delete expired rule in %s/%s: %v", rule.Table, rule.Chain, err)
			} else {
				log.Printf("Auto-deleted expired rule in %s/%s (line %d)", rule.Table, rule.Chain, lineNumber)

				// Record in history
				history := &models.History{
					Action:      "AUTO_DELETE",
					Table:       rule.Table,
					Chain:       rule.Chain,
					RuleDetails: rule.RuleSpec,
					User:        "scheduler",
					IPAddress:   "localhost",
					Success:     true,
				}
				if err := s.historyRepo.Create(history); err != nil {
					log.Printf("Failed to create history record for auto-delete: %v", err)
				}
			}
		} else {
			log.Printf("Could not find expired rule in %s/%s, may have been manually deleted", rule.Table, rule.Chain)
		}

		// Remove from tracking regardless of whether deletion succeeded
		if err := s.tempRuleRepo.Delete(rule.ID); err != nil {
			log.Printf("Failed to remove temp rule from database: %v", err)
		}
	}
}

// findRuleLineNumber finds the current line number of a rule by matching its spec
func (s *RuleScheduler) findRuleLineNumber(table, chain, ruleSpec string) int {
	rules, err := s.iptablesService.GetRulesByTable(table)
	if err != nil {
		log.Printf("Error getting rules for table %s: %v", table, err)
		return 0
	}

	// Normalize the rule spec for comparison
	normalizedSpec := normalizeRuleSpec(ruleSpec)

	for _, rule := range rules {
		if rule.Chain != chain {
			continue
		}

		// Build a comparable string from the rule
		ruleString := buildRuleString(rule)
		if strings.Contains(normalizedSpec, ruleString) || strings.Contains(ruleString, normalizedSpec) {
			return rule.LineNumber
		}

		// Also try matching by key components
		if matchRuleByComponents(rule, ruleSpec) {
			return rule.LineNumber
		}
	}

	return 0
}

// normalizeRuleSpec normalizes a rule specification for comparison
func normalizeRuleSpec(spec string) string {
	spec = strings.ToLower(spec)
	spec = strings.ReplaceAll(spec, "  ", " ")
	return strings.TrimSpace(spec)
}

// buildRuleString builds a comparable string from a rule
func buildRuleString(rule models.Rule) string {
	parts := []string{}

	if rule.Protocol != "" && rule.Protocol != "all" {
		parts = append(parts, rule.Protocol)
	}
	if rule.Source != "" && rule.Source != "0.0.0.0/0" {
		parts = append(parts, rule.Source)
	}
	if rule.Destination != "" && rule.Destination != "0.0.0.0/0" {
		parts = append(parts, rule.Destination)
	}
	if rule.Dport != "" {
		parts = append(parts, rule.Dport)
	}
	if rule.Target != "" {
		parts = append(parts, rule.Target)
	}

	return strings.ToLower(strings.Join(parts, " "))
}

// matchRuleByComponents checks if a rule matches the spec by its key components
func matchRuleByComponents(rule models.Rule, spec string) bool {
	spec = strings.ToLower(spec)

	// Check target
	if rule.Target != "" && strings.Contains(spec, strings.ToLower(rule.Target)) {
		// Check protocol
		if rule.Protocol != "" && rule.Protocol != "all" {
			if !strings.Contains(spec, strings.ToLower(rule.Protocol)) {
				return false
			}
		}
		// Check destination port
		if rule.Dport != "" {
			if !strings.Contains(spec, rule.Dport) {
				return false
			}
		}
		return true
	}

	return false
}
