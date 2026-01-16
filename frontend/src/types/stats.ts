import { Rule } from './rule';

export interface Chain {
  name: string;
  packets: number;
  bytes: number;
}

export interface TrafficStats {
  timestamp: string;
  total_packets: number;
  total_bytes: number;
  by_chain: Record<string, Chain>;
}

export interface RuleStats {
  total_rules: number;
  rules_by_table: Record<string, number>;
  rules_by_chain: Record<string, number>;
  top_rules_by_bytes: Rule[];
}
