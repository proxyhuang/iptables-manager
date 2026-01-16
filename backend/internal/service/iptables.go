package service

import (
	"fmt"
	"iptables-web-manager/internal/executor"
	"iptables-web-manager/internal/models"
	"regexp"
	"strconv"
	"strings"
)

// IPTablesService handles iptables business logic
type IPTablesService struct {
	executor *executor.IPTablesExecutor
}

// NewIPTablesService creates a new iptables service
func NewIPTablesService() *IPTablesService {
	return &IPTablesService{
		executor: executor.NewIPTablesExecutor(),
	}
}

// GetAllRules retrieves all iptables rules from all tables
func (s *IPTablesService) GetAllRules() ([]models.Rule, error) {
	tablesOutput, err := s.executor.ListAllTables()
	if err != nil {
		return nil, err
	}

	var allRules []models.Rule
	for table, output := range tablesOutput {
		rules := s.parseIPTablesOutput(output, table)
		allRules = append(allRules, rules...)
	}

	return allRules, nil
}

// GetRulesByTable retrieves rules from a specific table
func (s *IPTablesService) GetRulesByTable(table string) ([]models.Rule, error) {
	output, err := s.executor.ListRules(table)
	if err != nil {
		return nil, err
	}

	return s.parseIPTablesOutput(output, table), nil
}

// parseIPTablesOutput parses iptables command output into Rule structures
func (s *IPTablesService) parseIPTablesOutput(output, table string) []models.Rule {
	var rules []models.Rule
	lines := strings.Split(output, "\n")

	var currentChain string
	// Example line: 1    12345 67890 ACCEPT     tcp  --  *      *       0.0.0.0/0            0.0.0.0/0            tcp dpt:22
	ruleRegex := regexp.MustCompile(`^\s*(\d+)\s+(\d+)\s+(\d+)\s+(\S+)\s+(\S+)\s+--\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s*(.*)$`)

	for _, line := range lines {
		// Detect chain header
		if strings.HasPrefix(line, "Chain ") {
			parts := strings.Fields(line)
			if len(parts) >= 2 {
				currentChain = parts[1]
			}
			continue
		}

		// Skip header lines
		if strings.HasPrefix(line, "num ") || strings.HasPrefix(line, "pkts") || strings.TrimSpace(line) == "" {
			continue
		}

		// Parse rule line
		matches := ruleRegex.FindStringSubmatch(line)
		if len(matches) > 0 {
			lineNum, _ := strconv.Atoi(matches[1])
			packets, _ := strconv.ParseInt(matches[2], 10, 64)
			bytes, _ := strconv.ParseInt(matches[3], 10, 64)

			rule := models.Rule{
				Table:       table,
				Chain:       currentChain,
				LineNumber:  lineNum,
				Packets:     packets,
				Bytes:       bytes,
				Target:      matches[4],
				Protocol:    matches[5],
				Source:      matches[8],
				Destination: matches[9],
				Options:     strings.TrimSpace(matches[10]),
				RawRule:     line,
			}

			// Parse port information from options
			s.parsePortInfo(&rule, matches[10])

			rules = append(rules, rule)
		}
	}

	return rules
}

// parsePortInfo extracts port information from options string
func (s *IPTablesService) parsePortInfo(rule *models.Rule, options string) {
	// Parse source port: spt:1234
	sportRegex := regexp.MustCompile(`spt:(\d+)`)
	if matches := sportRegex.FindStringSubmatch(options); len(matches) > 1 {
		rule.Sport = matches[1]
	}

	// Parse destination port: dpt:80
	dportRegex := regexp.MustCompile(`dpt:(\d+)`)
	if matches := dportRegex.FindStringSubmatch(options); len(matches) > 1 {
		rule.Dport = matches[1]
	}
}

// AddRule adds a new iptables rule
func (s *IPTablesService) AddRule(req models.RuleCreateRequest) error {
	ruleSpec := s.buildRuleSpec(req)
	return s.executor.AddRule(req.Table, req.Chain, req.Position, ruleSpec)
}

// buildRuleSpec builds rule specification array from request
func (s *IPTablesService) buildRuleSpec(req models.RuleCreateRequest) []string {
	var spec []string

	if req.Protocol != "" {
		spec = append(spec, "-p", req.Protocol)
	}
	if req.Source != "" {
		spec = append(spec, "-s", req.Source)
	}
	if req.Destination != "" {
		spec = append(spec, "-d", req.Destination)
	}
	if req.Sport != "" {
		spec = append(spec, "--sport", req.Sport)
	}
	if req.Dport != "" {
		spec = append(spec, "--dport", req.Dport)
	}
	if req.Target != "" {
		spec = append(spec, "-j", req.Target)
	}
	if req.Comment != "" {
		spec = append(spec, "-m", "comment", "--comment", req.Comment)
	}

	return spec
}

// DeleteRule deletes an iptables rule
func (s *IPTablesService) DeleteRule(req models.RuleDeleteRequest) error {
	return s.executor.DeleteRule(req.Table, req.Chain, req.LineNumber)
}

// SearchRules searches for rules matching the query
func (s *IPTablesService) SearchRules(query string) ([]models.Rule, error) {
	allRules, err := s.GetAllRules()
	if err != nil {
		return nil, err
	}

	var results []models.Rule
	query = strings.ToLower(query)

	for _, rule := range allRules {
		if s.matchesQuery(rule, query) {
			results = append(results, rule)
		}
	}

	return results, nil
}

// matchesQuery checks if a rule matches the search query
func (s *IPTablesService) matchesQuery(rule models.Rule, query string) bool {
	searchFields := []string{
		rule.Table,
		rule.Chain,
		rule.Target,
		rule.Protocol,
		rule.Source,
		rule.Destination,
		rule.Sport,
		rule.Dport,
		rule.Options,
		rule.RawRule,
	}

	for _, field := range searchFields {
		if strings.Contains(strings.ToLower(field), query) {
			return true
		}
	}

	return false
}

// FormatRuleDetails formats rule details for history logging
func (s *IPTablesService) FormatRuleDetails(req models.RuleCreateRequest) string {
	return fmt.Sprintf("Protocol: %s, Source: %s, Dest: %s, DPort: %s, Target: %s",
		req.Protocol, req.Source, req.Destination, req.Dport, req.Target)
}

// FormatDeleteDetails formats delete details for history logging
func (s *IPTablesService) FormatDeleteDetails(req models.RuleDeleteRequest) string {
	return fmt.Sprintf("Line: %d", req.LineNumber)
}
