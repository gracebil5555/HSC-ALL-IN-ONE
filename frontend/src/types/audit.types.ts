export interface SystemAuditLog {
  id: number;
  actor: number | null;
  actor_username: string;
  actor_name: string;
  campus: number | null;
  campus_name?: string | null;
  action: string;
  target_model: string;
  target_id: string;
  description: string;
  metadata: Record<string, unknown> & {
    before_snapshot?: unknown;
    after_snapshot?: unknown;
  };
  ip_address?: string | null;
  created_at: string;
}
