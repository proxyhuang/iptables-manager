export interface Rule {
  id: number;
  table: string;
  chain: string;
  line_number: number;
  target: string;
  protocol: string;
  source: string;
  destination: string;
  sport: string;
  dport: string;
  packets: number;
  bytes: number;
  options: string;
  raw_rule: string;
  created_at: string;
}

export interface RuleCreateRequest {
  table: string;
  chain: string;
  protocol?: string;
  source?: string;
  destination?: string;
  sport?: string;
  dport?: string;
  target: string;
  position?: number;
  comment?: string;
}

export interface RuleDeleteRequest {
  table: string;
  chain: string;
  line_number: number;
}
