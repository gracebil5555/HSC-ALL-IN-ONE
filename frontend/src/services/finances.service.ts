import { CashVoucher, FinancialEntry, VoucherStatus } from "@/types/finance.types";
import { MOCK_VOUCHERS, MOCK_FINANCIAL_JOURNAL } from "@/mocks/vouchers.mock";

let vouchersDb: CashVoucher[] = [...MOCK_VOUCHERS];
let journalDb: FinancialEntry[] = [...MOCK_FINANCIAL_JOURNAL];

export const financesService = {
  getVouchers: async (campusId?: string | null): Promise<CashVoucher[]> => {
    await new Promise((res) => setTimeout(res, 80));
    if (!campusId || campusId === "all") return [...vouchersDb];
    return vouchersDb.filter((v) => v.campus_id === campusId);
  },

  getVoucherById: async (id: string): Promise<CashVoucher | null> => {
    await new Promise((res) => setTimeout(res, 40));
    return vouchersDb.find((v) => v.id === id) || null;
  },

  createVoucher: async (
    data: Omit<CashVoucher, "id" | "voucher_number" | "created_at" | "audit_trail" | "status">
  ): Promise<CashVoucher> => {
    await new Promise((res) => setTimeout(res, 120));
    const count = vouchersDb.length + 90;
    const now = new Date().toISOString().replace("T", " ").slice(0, 16);
    const newVoucher: CashVoucher = {
      ...data,
      id: `vch-${Date.now().toString().slice(-4)}`,
      voucher_number: `PC-2026-0${count}`,
      status: "PENDING",
      created_at: now,
      audit_trail: [
        {
          user_name: data.requested_by_name,
          action: "Émission de la pièce de caisse",
          from_status: null,
          to_status: "PENDING",
          timestamp: now,
        },
      ],
    };
    vouchersDb = [newVoucher, ...vouchersDb];
    return newVoucher;
  },

  approveVoucher: async (id: string, approverName: string, note?: string): Promise<CashVoucher | null> => {
    await new Promise((res) => setTimeout(res, 100));
    const index = vouchersDb.findIndex((v) => v.id === id);
    if (index === -1) return null;

    const now = new Date().toISOString().replace("T", " ").slice(0, 16);
    const prev = vouchersDb[index];

    const updated: CashVoucher = {
      ...prev,
      status: "APPROVED",
      approved_by_name: approverName,
      approved_at: now,
      audit_trail: [
        ...prev.audit_trail,
        {
          user_name: approverName,
          action: "Validation pastorale",
          from_status: prev.status,
          to_status: "APPROVED",
          timestamp: now,
          note: note || "Validé par le Pasteur / Administrateur",
        },
      ],
    };

    vouchersDb[index] = updated;
    return updated;
  },

  disburseVoucher: async (id: string, disburserName: string, note?: string): Promise<CashVoucher | null> => {
    await new Promise((res) => setTimeout(res, 100));
    const index = vouchersDb.findIndex((v) => v.id === id);
    if (index === -1) return null;

    const now = new Date().toISOString().replace("T", " ").slice(0, 16);
    const prev = vouchersDb[index];

    const updated: CashVoucher = {
      ...prev,
      status: "DISBURSED",
      disbursed_at: now,
      receipt_attachment: `recu_${prev.voucher_number.toLowerCase()}.pdf`,
      audit_trail: [
        ...prev.audit_trail,
        {
          user_name: disburserName,
          action: "Décaissement et archivage reçu",
          from_status: prev.status,
          to_status: "DISBURSED",
          timestamp: now,
          note: note || "Fonds décaissés physiquement contre émargement",
        },
      ],
    };

    vouchersDb[index] = updated;

    // Automatically add debit entry to financial journal!
    journalDb = [
      {
        id: `jnl-${Date.now().toString().slice(-4)}`,
        reference: `DEC-${prev.voucher_number}`,
        entry_type: "DEBIT",
        category: "DECAISSEMENT_PIECE",
        amount: prev.amount,
        description: `Décaissement pièce ${prev.voucher_number} - ${prev.purpose.slice(0, 50)}...`,
        campus_id: prev.campus_id,
        registered_by: disburserName,
        created_at: now,
      },
      ...journalDb,
    ];

    return updated;
  },

  getJournalEntries: async (campusId?: string | null): Promise<FinancialEntry[]> => {
    await new Promise((res) => setTimeout(res, 60));
    if (!campusId || campusId === "all") return [...journalDb];
    return journalDb.filter((j) => j.campus_id === campusId);
  },
};
