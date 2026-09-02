export type AlertType = "SANTE" | "DEUIL" | "AIDE_MATERIELLE" | "DECROCHAGE";
export type AlertSeverity = "INFO" | "WARNING" | "CRITICAL";
export type AlertStatus = "OPEN" | "ASSIGNED" | "RESOLVED";

export interface PastoralAlert {
  id: string;
  member_name: string;
  member_phone: string;
  residential_area: string;
  campus_id: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  description: string;
  reported_by_name: string;
  assigned_pastor_name?: string | null;
  status: AlertStatus;
  created_at: string;
}
