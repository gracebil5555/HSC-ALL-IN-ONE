export type VoucherStatus = "PENDING" | "APPROVED" | "DISBURSED";

export interface AuditLogEntry {
  user_name: string;
  action: string;
  from_status: VoucherStatus | null;
  to_status: VoucherStatus;
  timestamp: string;
  note?: string;
}

export interface CashVoucher {
  id: string;
  voucher_number: string; // Ex: "PC-2026-089"
  beneficiary: string;
  department_name: string;
  amount: number; // in FCFA
  purpose: string;
  status: VoucherStatus;
  campus_id: string;
  requested_by_name: string;
  created_at: string;
  approved_by_name?: string | null;
  approved_at?: string | null;
  disbursed_at?: string | null;
  receipt_attachment?: string | null;
  audit_trail: AuditLogEntry[];
}

export interface FinancialEntry {
  id: string;
  reference: string;
  entry_type: "DEBIT" | "CREDIT";
  category: "DIMES" | "OFFRANDES" | "DECAISSEMENT_PIECE" | "DON_SPECIAL";
  amount: number;
  description: string;
  campus_id: string;
  registered_by: string;
  created_at: string;
}
