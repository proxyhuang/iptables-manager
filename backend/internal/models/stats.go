package models

import "time"

// TrafficStats represents traffic statistics
type TrafficStats struct {
	Timestamp    time.Time        `json:"timestamp"`
	TotalPackets int64            `json:"total_packets"`
	TotalBytes   int64            `json:"total_bytes"`
	ByChain      map[string]Chain `json:"by_chain"`
}

// Chain represents statistics for a specific chain
type Chain struct {
	Name    string `json:"name"`
	Packets int64  `json:"packets"`
	Bytes   int64  `json:"bytes"`
}

// RuleStats represents rule statistics
type RuleStats struct {
	TotalRules      int            `json:"total_rules"`
	RulesByTable    map[string]int `json:"rules_by_table"`
	RulesByChain    map[string]int `json:"rules_by_chain"`
	TopRulesByBytes []Rule         `json:"top_rules_by_bytes"`
}
