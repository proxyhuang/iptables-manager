package models

import "time"

// History represents a history record of rule operations
type History struct {
	ID          int       `json:"id" db:"id"`
	Action      string    `json:"action" db:"action"`             // ADD, DELETE
	Table       string    `json:"table" db:"table_name"`
	Chain       string    `json:"chain" db:"chain"`
	RuleDetails string    `json:"rule_details" db:"rule_details"`
	User        string    `json:"user" db:"user"`
	IPAddress   string    `json:"ip_address" db:"ip_address"`
	Success     bool      `json:"success" db:"success"`
	ErrorMsg    string    `json:"error_msg,omitempty" db:"error_msg"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}
