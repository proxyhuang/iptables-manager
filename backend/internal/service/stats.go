package service

import (
	"iptables-web-manager/internal/models"
	"sort"
	"time"
)

// StatsService handles statistics calculations
type StatsService struct {
	iptablesService *IPTablesService
}

// NewStatsService creates a new stats service
func NewStatsService(iptablesService *IPTablesService) *StatsService {
	return &StatsService{
		iptablesService: iptablesService,
	}
}

// GetTrafficStats calculates traffic statistics
func (s *StatsService) GetTrafficStats() (*models.TrafficStats, error) {
	rules, err := s.iptablesService.GetAllRules()
	if err != nil {
		return nil, err
	}

	stats := &models.TrafficStats{
		Timestamp: time.Now(),
		ByChain:   make(map[string]models.Chain),
	}

	chainStats := make(map[string]*models.Chain)

	for _, rule := range rules {
		stats.TotalPackets += rule.Packets
		stats.TotalBytes += rule.Bytes

		chainKey := rule.Table + ":" + rule.Chain
		if _, exists := chainStats[chainKey]; !exists {
			chainStats[chainKey] = &models.Chain{
				Name:    rule.Chain,
				Packets: 0,
				Bytes:   0,
			}
		}

		chainStats[chainKey].Packets += rule.Packets
		chainStats[chainKey].Bytes += rule.Bytes
	}

	for key, chain := range chainStats {
		stats.ByChain[key] = *chain
	}

	return stats, nil
}

// GetRuleStats calculates rule statistics
func (s *StatsService) GetRuleStats() (*models.RuleStats, error) {
	rules, err := s.iptablesService.GetAllRules()
	if err != nil {
		return nil, err
	}

	stats := &models.RuleStats{
		RulesByTable: make(map[string]int),
		RulesByChain: make(map[string]int),
	}

	stats.TotalRules = len(rules)

	for _, rule := range rules {
		stats.RulesByTable[rule.Table]++
		stats.RulesByChain[rule.Chain]++
	}

	// Get top 10 rules by bytes
	stats.TopRulesByBytes = s.getTopRulesByBytes(rules, 10)

	return stats, nil
}

// getTopRulesByBytes returns top N rules sorted by bytes
func (s *StatsService) getTopRulesByBytes(rules []models.Rule, limit int) []models.Rule {
	// Create a copy to avoid modifying original
	sorted := make([]models.Rule, len(rules))
	copy(sorted, rules)

	// Sort by bytes in descending order
	sort.Slice(sorted, func(i, j int) bool {
		return sorted[i].Bytes > sorted[j].Bytes
	})

	if len(sorted) > limit {
		sorted = sorted[:limit]
	}

	return sorted
}
