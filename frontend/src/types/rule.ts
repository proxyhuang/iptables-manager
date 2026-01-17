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
  expires_in?: number; // seconds until auto-delete (0 = permanent)
}

// Predefined expiry options for test rules
export const EXPIRY_OPTIONS = [
  { label: 'Permanent', value: 0 },
  { label: '30 seconds', value: 30 },
  { label: '1 minute', value: 60 },
  { label: '2 minutes', value: 120 },
  { label: '5 minutes', value: 300 },
] as const;

export interface RuleDeleteRequest {
  table: string;
  chain: string;
  line_number: number;
}
