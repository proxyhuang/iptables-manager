package repository

import (
	"database/sql"
	"time"

	"iptables-web-manager/internal/models"
)

// TempRuleRepository handles CRUD operations for temporary rules
type TempRuleRepository struct {
	db *sql.DB
}

// NewTempRuleRepository creates a new TempRuleRepository
func NewTempRuleRepository(db *sql.DB) *TempRuleRepository {
	return &TempRuleRepository{db: db}
}

// Create adds a new temporary rule to the database
func (r *TempRuleRepository) Create(rule *models.TemporaryRule) error {
	query := `INSERT INTO temp_rules (table_name, chain, rule_spec, expires_at, created_at)
              VALUES (?, ?, ?, ?, ?)`
	result, err := r.db.Exec(query, rule.Table, rule.Chain, rule.RuleSpec,
		rule.ExpiresAt, rule.CreatedAt)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}
	rule.ID = id
	return nil
}

// GetExpired returns all rules that have expired
func (r *TempRuleRepository) GetExpired() ([]models.TemporaryRule, error) {
	query := `SELECT id, table_name, chain, rule_spec, expires_at, created_at
              FROM temp_rules WHERE expires_at <= ?`
	rows, err := r.db.Query(query, time.Now())
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var rules []models.TemporaryRule
	for rows.Next() {
		var rule models.TemporaryRule
		if err := rows.Scan(&rule.ID, &rule.Table, &rule.Chain, &rule.RuleSpec,
			&rule.ExpiresAt, &rule.CreatedAt); err != nil {
			return nil, err
		}
		rules = append(rules, rule)
	}
	return rules, rows.Err()
}

// Delete removes a temporary rule by ID
func (r *TempRuleRepository) Delete(id int64) error {
	_, err := r.db.Exec("DELETE FROM temp_rules WHERE id = ?", id)
	return err
}

// GetAll returns all temporary rules (for debugging/monitoring)
func (r *TempRuleRepository) GetAll() ([]models.TemporaryRule, error) {
	query := `SELECT id, table_name, chain, rule_spec, expires_at, created_at
              FROM temp_rules ORDER BY expires_at ASC`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var rules []models.TemporaryRule
	for rows.Next() {
		var rule models.TemporaryRule
		if err := rows.Scan(&rule.ID, &rule.Table, &rule.Chain, &rule.RuleSpec,
			&rule.ExpiresAt, &rule.CreatedAt); err != nil {
			return nil, err
		}
		rules = append(rules, rule)
	}
	return rules, rows.Err()
}
