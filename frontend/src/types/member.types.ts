export type AssimilationStage =
  | "ACCUEIL"
  | "MODULE_1"
  | "MODULE_2"
  | "BAPTEME"
  | "INTEGRE";

export interface EcclesialFunctionCatalogItem {
  id: number;
  code: string;
  label: string;
  rank_order: number;
  is_active: boolean;
}

export interface MemberStatusCatalogItem {
  id: number;
  code: string;
  label: string;
  color: string;
  is_active: boolean;
}

export interface Member {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  whatsapp: string;
  email?: string;
  residential_area: string; // Ex: "Mpita", "Ngoyo", "Tié-Tié", "Paka", "Centre-ville"
  status?: string;
  status_display?: string;
  ecclesial_function?: string;
  ecclesial_function_display?: string;
  date_of_birth?: string | null;
  campus?: number;
  campus_id: string;
  campus_name?: string;
  brigade?: number | null;
  brigade_id: string | null; // OPTIONNELLE : null = "Non affecté"
  brigade_name?: string;
  department?: number | null;
  department_id: string | null;
  department_name?: string;
  assimilation_stage: AssimilationStage;
  assimilation_progress: string; // Ex: "0/4", "3/4", "4/5"
  is_baptized: boolean;
  baptism_date?: string | null;
  joined_date: string;
  avatar?: string;
  notes?: string;
  sms_opt_in?: boolean;
  whatsapp_opt_in?: boolean;
  unsubscribed_at?: string | null;
}

export type MemberTransferStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface MemberTransferRequest {
  id: number;
  member: number;
  member_name?: string;
  from_campus: number;
  from_campus_name?: string;
  to_campus: number;
  to_campus_name?: string;
  requested_by?: number | null;
  requested_by_name?: string | null;
  reviewed_by?: number | null;
  reviewed_by_name?: string | null;
  status: MemberTransferStatus;
  reason: string;
  review_notes: string;
  preserve_assimilation: boolean;
  created_at: string;
  reviewed_at?: string | null;
}
