package repository

import (
	"database/sql"
	"iptables-web-manager/internal/models"
)

// HistoryRepository handles history data access
type HistoryRepository struct {
	db *sql.DB
}

// NewHistoryRepository creates a new history repository
func NewHistoryRepository(db *sql.DB) *HistoryRepository {
	return &HistoryRepository{db: db}
}

// Create inserts a new history record
func (r *HistoryRepository) Create(history *models.History) error {
	query := `
		INSERT INTO history (action, table_name, chain, rule_details, user, ip_address, success, error_msg)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`

	result, err := r.db.Exec(query,
		history.Action,
		history.Table,
		history.Chain,
		history.RuleDetails,
		history.User,
		history.IPAddress,
		history.Success,
		history.ErrorMsg,
	)

	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}

	history.ID = int(id)
	return nil
}

// GetAll retrieves all history records with pagination
func (r *HistoryRepository) GetAll(limit, offset int) ([]models.History, error) {
	query := `
		SELECT id, action, table_name, chain, rule_details, user, ip_address, success, error_msg, created_at
		FROM history
		ORDER BY created_at DESC
		LIMIT ? OFFSET ?
	`

	rows, err := r.db.Query(query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var histories []models.History
	for rows.Next() {
		var h models.History
		err := rows.Scan(
			&h.ID, &h.Action, &h.Table, &h.Chain, &h.RuleDetails,
			&h.User, &h.IPAddress, &h.Success, &h.ErrorMsg, &h.CreatedAt,
		)
		if err != nil {
			continue
		}
		histories = append(histories, h)
	}

	return histories, nil
}

// GetByID retrieves a single history record by ID
func (r *HistoryRepository) GetByID(id int) (*models.History, error) {
	query := `
		SELECT id, action, table_name, chain, rule_details, user, ip_address, success, error_msg, created_at
		FROM history
		WHERE id = ?
	`

	var h models.History
	err := r.db.QueryRow(query, id).Scan(
		&h.ID, &h.Action, &h.Table, &h.Chain, &h.RuleDetails,
		&h.User, &h.IPAddress, &h.Success, &h.ErrorMsg, &h.CreatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &h, nil
}

// Count returns total number of history records
func (r *HistoryRepository) Count() (int, error) {
	var count int
	err := r.db.QueryRow("SELECT COUNT(*) FROM history").Scan(&count)
	return count, err
}
