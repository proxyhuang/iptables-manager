export interface History {
  id: number;
  action: string;
  table: string;
  chain: string;
  rule_details: string;
  user: string;
  ip_address: string;
  success: boolean;
  error_msg?: string;
  created_at: string;
}
