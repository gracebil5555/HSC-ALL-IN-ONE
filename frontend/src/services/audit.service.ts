import { SystemAuditLog } from "@/types/audit.types";
import { apiClient } from "@/lib/apiClient";
import { extractPaginatedResults } from "@/lib/utils";

export interface AuditLogFilters {
  campus_id?: string | null;
  action?: string;
  target_model?: string;
  search?: string;
}

export const auditService = {
  getAuditLogs: async (filters?: AuditLogFilters): Promise<SystemAuditLog[]> => {
    try {
      const params: Record<string, string> = {};
      if (filters?.campus_id && filters.campus_id !== "all") {
        params.campus_id = filters.campus_id;
      }
      if (filters?.action && filters.action !== "ALL") {
        params.action = filters.action;
      }
      if (filters?.target_model && filters.target_model !== "ALL") {
        params.target_model = filters.target_model;
      }
      if (filters?.search && filters.search.trim()) {
        params.search = filters.search.trim();
      }
      const response = await apiClient.get("/core/audit-logs/", { params });
      return extractPaginatedResults<SystemAuditLog>(response.data);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      throw error;
    }
  },
};
