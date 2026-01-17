package models

import "time"

// Rule represents an iptables rule
type Rule struct {
	ID          int       `json:"id"`
	Table       string    `json:"table"`        // filter, nat, mangle, raw
	Chain       string    `json:"chain"`        // INPUT, OUTPUT, FORWARD, etc
	LineNumber  int       `json:"line_number"`
	Target      string    `json:"target"`       // ACCEPT, DROP, REJECT, etc
	Protocol    string    `json:"protocol"`     // tcp, udp, icmp, etc
	Source      string    `json:"source"`
	Destination string    `json:"destination"`
	Sport       string    `json:"sport"`        // source port
	Dport       string    `json:"dport"`        // destination port
	Packets     int64     `json:"packets"`
	Bytes       int64     `json:"bytes"`
	Options     string    `json:"options"`      // other options
	RawRule     string    `json:"raw_rule"`     // original rule string
	CreatedAt   time.Time `json:"created_at"`
}

// RuleCreateRequest represents a request to create a new rule
type RuleCreateRequest struct {
	Table       string `json:"table" binding:"required"`
	Chain       string `json:"chain" binding:"required"`
	Protocol    string `json:"protocol"`
	Source      string `json:"source"`
	Destination string `json:"destination"`
	Sport       string `json:"sport"`
	Dport       string `json:"dport"`
	Target      string `json:"target" binding:"required"`
	Position    int    `json:"position"`   // insertion position
	Comment     string `json:"comment"`
	ExpiresIn   int    `json:"expires_in"` // seconds until auto-delete (0 = permanent)
}

// RuleDeleteRequest represents a request to delete a rule
type RuleDeleteRequest struct {
	Table      string `json:"table" binding:"required"`
	Chain      string `json:"chain" binding:"required"`
	LineNumber int    `json:"line_number" binding:"required"`
}

// TemporaryRule tracks rules that will auto-expire
type TemporaryRule struct {
	ID        int64     `json:"id"`
	Table     string    `json:"table"`
	Chain     string    `json:"chain"`
	RuleSpec  string    `json:"rule_spec"` // rule specification for matching
	ExpiresAt time.Time `json:"expires_at"`
	CreatedAt time.Time `json:"created_at"`
}
