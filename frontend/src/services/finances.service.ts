import { CashVoucher, FinancialEntry } from "@/types/finance.types";
import { apiClient } from "@/lib/apiClient";

export const financesService = {
  getVouchers: async (campusId?: string | null): Promise<CashVoucher[]> => {
    try {
      const response = await apiClient.get('/finances/vouchers/');
      let vouchers = response.data;
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
    data: Omit<CashVoucher, "id" | "voucher_number" | "created_at" | "audit_trail" | "status">
  ): Promise<CashVoucher> => {
    try {
      // Adapting frontend naming to backend naming if necessary
      const payload = {
        title: `Pièce de caisse - ${data.campus_id}`, // Backend title logic if needed
        description: data.purpose,
        amount: data.amount,
        register: 1, // Defaulting to register 1 since the frontend doesn't supply it yet
        campus: data.campus_id ? parseInt(data.campus_id) : 1,
        requester: 1, // Defaulting to user 1 for now (admin)
        status: 'PENDING'
      };
      
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

  getJournalEntries: async (campusId?: string | null): Promise<FinancialEntry[]> => {
    try {
      const response = await apiClient.get('/finances/transactions/');
      let entries = response.data;
      if (campusId && campusId !== "all") {
        entries = entries.filter((e: any) => e.campus === parseInt(campusId));
      }
      return entries;
    } catch (error) {
      console.error("Error fetching journal entries:", error);
      return [];
    }
  },
};
