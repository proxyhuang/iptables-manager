package executor

import (
	"bytes"
	"fmt"
	"os/exec"
	"strings"
)

// IPTablesExecutor handles iptables command execution
type IPTablesExecutor struct {
	validator *Validator
}

// NewIPTablesExecutor creates a new iptables executor
func NewIPTablesExecutor() *IPTablesExecutor {
	return &IPTablesExecutor{
		validator: NewValidator(),
	}
}

// ListRules lists all rules in a table
func (e *IPTablesExecutor) ListRules(table string) (string, error) {
	if err := e.validator.ValidateTable(table); err != nil {
		return "", err
	}

	cmd := exec.Command("iptables", "-t", table, "-L", "-n", "-v", "--line-numbers")
	var out bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr

	err := cmd.Run()
	if err != nil {
		return "", fmt.Errorf("failed to list rules: %v, stderr: %s", err, stderr.String())
	}

	return out.String(), nil
}

// GetCounters gets packet and byte counters with exact values
func (e *IPTablesExecutor) GetCounters(table string) (string, error) {
	if err := e.validator.ValidateTable(table); err != nil {
		return "", err
	}

	cmd := exec.Command("iptables", "-t", table, "-L", "-n", "-v", "-x", "--line-numbers")
	var out bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr

	err := cmd.Run()
	if err != nil {
		return "", fmt.Errorf("failed to get counters: %v, stderr: %s", err, stderr.String())
	}

	return out.String(), nil
}

// AddRule adds a new rule to a chain
func (e *IPTablesExecutor) AddRule(table, chain string, position int, ruleSpec []string) error {
	// Validate inputs
	if err := e.validator.ValidateTable(table); err != nil {
		return err
	}
	if err := e.validator.ValidateChain(chain); err != nil {
		return err
	}
	if err := e.validator.ValidateRuleSpec(ruleSpec); err != nil {
		return err
	}

	// Build command arguments
	var args []string
	args = append(args, "-t", table)

	if position > 0 {
		args = append(args, "-I", chain, fmt.Sprintf("%d", position))
	} else {
		args = append(args, "-A", chain)
	}

	args = append(args, ruleSpec...)

	// Execute command
	cmd := exec.Command("iptables", args...)
	var stderr bytes.Buffer
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("failed to add rule: %v, stderr: %s", err, stderr.String())
	}

	return nil
}

// DeleteRule deletes a rule by line number
func (e *IPTablesExecutor) DeleteRule(table, chain string, lineNumber int) error {
	// Validate inputs
	if err := e.validator.ValidateTable(table); err != nil {
		return err
	}
	if err := e.validator.ValidateChain(chain); err != nil {
		return err
	}
	if lineNumber < 1 {
		return fmt.Errorf("invalid line number: %d", lineNumber)
	}

	cmd := exec.Command("iptables", "-t", table, "-D", chain, fmt.Sprintf("%d", lineNumber))
	var stderr bytes.Buffer
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("failed to delete rule: %v, stderr: %s", err, stderr.String())
	}

	return nil
}

// ListAllTables lists rules from all tables
func (e *IPTablesExecutor) ListAllTables() (map[string]string, error) {
	tables := []string{"filter", "nat", "mangle", "raw"}
	result := make(map[string]string)

	for _, table := range tables {
		output, err := e.ListRules(table)
		if err != nil {
			// Skip tables that might not be loaded
			if strings.Contains(err.Error(), "can't initialize iptables") {
				continue
			}
			return nil, err
		}
		result[table] = output
	}

	return result, nil
}

// GetAllCounters gets counters from all tables
func (e *IPTablesExecutor) GetAllCounters() (map[string]string, error) {
	tables := []string{"filter", "nat", "mangle", "raw"}
	result := make(map[string]string)

	for _, table := range tables {
		output, err := e.GetCounters(table)
		if err != nil {
			// Skip tables that might not be loaded
			if strings.Contains(err.Error(), "can't initialize iptables") {
				continue
			}
			return nil, err
		}
		result[table] = output
	}

	return result, nil
}
