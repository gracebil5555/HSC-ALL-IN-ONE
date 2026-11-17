import {
  CashVoucher,
  FinancialEntry,
  ExchangeRate,
  AccountingPeriodClose,
  CurrencyCode,
} from "@/types/finance.types";
import { apiClient } from "@/lib/apiClient";
import { extractPaginatedResults } from "@/lib/utils";

export const financesService = {
  getVouchers: async (campusId?: string | null): Promise<CashVoucher[]> => {
    try {
      const response = await apiClient.get('/finances/vouchers/');
      let vouchers = extractPaginatedResults<CashVoucher>(response.data);
      if (campusId && campusId !== "all") {
        vouchers = vouchers.filter((v: any) => v.campus === parseInt(campusId));
      }
      return vouchers;
    } catch (error) {
      console.error("Error fetching vouchers:", error);
      return [];
    }
  },

  getVoucherById: async (id: string): Promise<CashVoucher | null> => {
    try {
      const response = await apiClient.get(`/finances/vouchers/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching voucher ${id}:`, error);
      return null;
    }
  },

  createVoucher: async (
    data: Omit<CashVoucher, "id" | "voucher_number" | "created_at" | "audit_trail" | "status" | "receipt_file"> & {
      receipt_file?: File | null;
    }
  ): Promise<CashVoucher> => {
    try {
      if (data.receipt_file) {
        const formData = new FormData();
        formData.append("title", data.beneficiary || "Pièce de caisse");
        formData.append("description", data.purpose);
        formData.append("amount", String(data.amount));
        if (data.campus_id && !isNaN(Number(data.campus_id))) {
          formData.append("campus", String(Number(data.campus_id)));
        }
        formData.append("receipt_file", data.receipt_file);

        const response = await apiClient.post('/finances/vouchers/', formData);
        return response.data;
      }

      const payload: Record<string, any> = {
        title: data.beneficiary || `Pièce de caisse`,
        description: data.purpose,
        amount: data.amount,
      };
      if (data.campus_id && !isNaN(Number(data.campus_id))) {
        payload.campus = Number(data.campus_id);
      }

      const response = await apiClient.post('/finances/vouchers/', payload);
      return response.data;
    } catch (error) {
      console.error("Error creating voucher:", error);
      throw error;
    }
  },

  approveVoucher: async (id: string, approverName: string, note?: string): Promise<CashVoucher | null> => {
    try {
      const payload = { note: note || "Validé par le Pasteur / Administrateur" };
      const response = await apiClient.post(`/finances/vouchers/${id}/approve/`, payload);
      return response.data;
    } catch (error) {
      console.error(`Error approving voucher ${id}:`, error);
      return null;
    }
  },

  disburseVoucher: async (id: string, disburserName: string, note?: string): Promise<CashVoucher | null> => {
    try {
      const payload = { note: note || "Fonds décaissés physiquement contre émargement" };
      const response = await apiClient.post(`/finances/vouchers/${id}/disburse/`, payload);
      return response.data;
    } catch (error) {
      console.error(`Error disbursing voucher ${id}:`, error);
      return null;
    }
  },

  getJournalEntries: async (
    campusId?: string | null,
    filters?: { date_from?: string; date_to?: string; entry_type?: string }
  ): Promise<FinancialEntry[]> => {
    try {
      const params: Record<string, string> = {};
      if (campusId && campusId !== "all") params.campus_id = campusId;
      if (filters?.date_from) params.date_from = filters.date_from;
      if (filters?.date_to) params.date_to = filters.date_to;
      if (filters?.entry_type && filters.entry_type !== "ALL") params.entry_type = filters.entry_type;

      const response = await apiClient.get('/finances/transactions/', { params });
      let entries = extractPaginatedResults<FinancialEntry>(response.data);
      if (campusId && campusId !== "all") {
        entries = entries.filter((e: any) => e.campus === parseInt(campusId));
      }
      return entries;
    } catch (error) {
      console.error("Error fetching journal entries:", error);
      return [];
    }
  },

  createTransaction: async (data: {
    entry_type: "CREDIT" | "DEBIT";
    category: string;
    amount: number;
    description: string;
    reference?: string;
    campus?: number;
    register?: number | null;
  }): Promise<FinancialEntry> => {
    const response = await apiClient.post('/finances/transactions/', data);
    return response.data;
  },

  getRegisters: async (campusId?: string | null): Promise<any[]> => {
    try {
      const response = await apiClient.get('/finances/registers/');
      let regs = extractPaginatedResults<any>(response.data);
      if (campusId && campusId !== "all") {
        regs = regs.filter((r: any) => r.campus === parseInt(campusId));
      }
      return regs;
    } catch (error) {
      console.error("Error fetching registers:", error);
      return [];
    }
  },

  getExchangeRates: async (): Promise<ExchangeRate[]> => {
    const response = await apiClient.get('/finances/exchange-rates/');
    return extractPaginatedResults<ExchangeRate>(response.data);
  },

  createExchangeRate: async (payload: {
    from_currency: CurrencyCode;
    to_currency: CurrencyCode;
    rate: string | number;
    effective_date: string;
    is_active?: boolean;
  }): Promise<ExchangeRate> => {
    const response = await apiClient.post('/finances/exchange-rates/', payload);
    return response.data;
  },

  updateExchangeRate: async (
    id: number | string,
    payload: Partial<{
      from_currency: CurrencyCode;
      to_currency: CurrencyCode;
      rate: string | number;
      effective_date: string;
      is_active: boolean;
    }>
  ): Promise<ExchangeRate> => {
    const response = await apiClient.patch(`/finances/exchange-rates/${id}/`, payload);
    return response.data;
  },

  getPeriodCloses: async (campusId?: string | null): Promise<AccountingPeriodClose[]> => {
    const params: Record<string, string> = {};
    if (campusId && campusId !== "all") {
      params.campus_id = campusId;
    }
    const response = await apiClient.get('/finances/period-closes/', { params });
    return extractPaginatedResults<AccountingPeriodClose>(response.data);
  },

  closePeriod: async (payload: {
    campus?: number;
    year: number;
    month: number;
    notes?: string;
  }): Promise<AccountingPeriodClose> => {
    const response = await apiClient.post('/finances/period-closes/', payload);
    return response.data;
  },

  reopenPeriod: async (id: number | string): Promise<AccountingPeriodClose> => {
    const response = await apiClient.post(`/finances/period-closes/${id}/reopen/`, {});
    return response.data;
  },
};
