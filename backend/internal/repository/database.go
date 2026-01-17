package repository

import (
	"database/sql"
	"fmt"

	_ "modernc.org/sqlite"
)

var DB *sql.DB

// InitDatabase initializes the SQLite database
func InitDatabase(dbPath string) error {
	var err error
	DB, err = sql.Open("sqlite", dbPath)
	if err != nil {
		return fmt.Errorf("failed to open database: %w", err)
	}

	// Test connection
	if err := DB.Ping(); err != nil {
		return fmt.Errorf("failed to ping database: %w", err)
	}

	// Create tables
	if err := createTables(); err != nil {
		return fmt.Errorf("failed to create tables: %w", err)
	}

	return nil
}

// createTables creates necessary database tables
func createTables() error {
	createTableSQL := `
	CREATE TABLE IF NOT EXISTS history (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		action TEXT NOT NULL,
		table_name TEXT NOT NULL,
		chain TEXT NOT NULL,
		rule_details TEXT NOT NULL,
		user TEXT,
		ip_address TEXT,
		success BOOLEAN NOT NULL,
		error_msg TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE INDEX IF NOT EXISTS idx_created_at ON history(created_at DESC);
	CREATE INDEX IF NOT EXISTS idx_action ON history(action);
	CREATE INDEX IF NOT EXISTS idx_success ON history(success);

	CREATE TABLE IF NOT EXISTS temp_rules (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		table_name TEXT NOT NULL,
		chain TEXT NOT NULL,
		rule_spec TEXT NOT NULL,
		expires_at DATETIME NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE INDEX IF NOT EXISTS idx_temp_rules_expires ON temp_rules(expires_at);
	`

	_, err := DB.Exec(createTableSQL)
	return err
}

// Close closes the database connection
func Close() error {
	if DB != nil {
		return DB.Close()
	}
	return nil
}
