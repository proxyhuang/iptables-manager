package executor

import (
	"fmt"
	"regexp"
	"strings"
)

// Validator provides input validation for iptables commands
type Validator struct {
	validTables  map[string]bool
	validChains  map[string]bool
	validTargets map[string]bool
}

// NewValidator creates a new validator instance
func NewValidator() *Validator {
	return &Validator{
		validTables: map[string]bool{
			"filter":   true,
			"nat":      true,
			"mangle":   true,
			"raw":      true,
			"security": true,
		},
		validChains: map[string]bool{
			"INPUT":        true,
			"OUTPUT":       true,
			"FORWARD":      true,
			"PREROUTING":   true,
			"POSTROUTING":  true,
		},
		validTargets: map[string]bool{
			"ACCEPT":     true,
			"DROP":       true,
			"REJECT":     true,
			"LOG":        true,
			"MASQUERADE": true,
			"SNAT":       true,
			"DNAT":       true,
			"RETURN":     true,
		},
	}
}

// ValidateTable checks if table name is valid
func (v *Validator) ValidateTable(table string) error {
	if !v.validTables[table] {
		return fmt.Errorf("invalid table: %s", table)
	}
	return nil
}

// ValidateChain checks if chain name is valid
func (v *Validator) ValidateChain(chain string) error {
	// Standard chains
	if v.validChains[chain] {
		return nil
	}

	// Custom chains: alphanumeric, underscore, dash
	matched, err := regexp.MatchString("^[a-zA-Z0-9_-]+$", chain)
	if err != nil || !matched {
		return fmt.Errorf("invalid chain: %s", chain)
	}

	return nil
}

// ValidateTarget checks if target is valid
func (v *Validator) ValidateTarget(target string) error {
	// Standard targets
	if v.validTargets[target] {
		return nil
	}

	// Custom chains can also be targets
	matched, err := regexp.MatchString("^[a-zA-Z0-9_-]+$", target)
	if err != nil || !matched {
		return fmt.Errorf("invalid target: %s", target)
	}

	return nil
}

// ValidateRuleSpec checks rule specifications for dangerous characters
func (v *Validator) ValidateRuleSpec(ruleSpec []string) error {
	// Dangerous characters that could be used for command injection
	dangerousPatterns := []string{";", "|", "&", "`", "$", "(", ")", "<", ">", "\n", "\r"}

	for _, spec := range ruleSpec {
		for _, pattern := range dangerousPatterns {
			if strings.Contains(spec, pattern) {
				return fmt.Errorf("dangerous character detected in rule spec: %s", pattern)
			}
		}
	}

	return nil
}

// ValidateIPAddress checks if an IP address or CIDR is valid
func (v *Validator) ValidateIPAddress(ip string) error {
	if ip == "" || ip == "0.0.0.0/0" || ip == "::/0" {
		return nil
	}

	// Basic IP/CIDR validation
	ipRegex := regexp.MustCompile(`^(\d{1,3}\.){3}\d{1,3}(/\d{1,2})?$`)
	ipv6Regex := regexp.MustCompile(`^([0-9a-fA-F:]+)(/\d{1,3})?$`)

	if !ipRegex.MatchString(ip) && !ipv6Regex.MatchString(ip) {
		return fmt.Errorf("invalid IP address or CIDR: %s", ip)
	}

	return nil
}

// ValidatePort checks if port or port range is valid
func (v *Validator) ValidatePort(port string) error {
	if port == "" {
		return nil
	}

	// Port can be a single port, range (80:443), or comma-separated
	portRegex := regexp.MustCompile(`^[\d:,]+$`)
	if !portRegex.MatchString(port) {
		return fmt.Errorf("invalid port specification: %s", port)
	}

	return nil
}
