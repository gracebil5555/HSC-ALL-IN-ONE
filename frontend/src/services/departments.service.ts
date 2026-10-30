import { apiClient } from "@/lib/apiClient";

export interface DepartmentCatalogItem {
  id: number;
  name: string;
  code: string;
  description: string;
  icon: string;
  is_default: boolean;
}

export interface DepartmentItem {
  id: number;
  campus: number;
  campus_name?: string;
  name: string;
  code?: string;
  description?: string;
  icon?: string;
  admin?: number | null;
  admin_name?: string;
  deputy?: number | null;
  deputy_name?: string;
  is_active: boolean;
}

export const departmentsService = {
  async getDepartments(campusId?: string): Promise<DepartmentItem[]> {
    try {
      const params: Record<string, string> = {};
      if (campusId && campusId !== "all") {
        params.campus_id = campusId;
      }
      const response = await apiClient.get<DepartmentItem[]>("/departments/", { params });
      return response.data;
    } catch (error) {
      console.warn("Erreur lors de la récupération des départements:", error);
      return [];
    }
  },

  async getCatalog(): Promise<DepartmentCatalogItem[]> {
    try {
      const response = await apiClient.get<DepartmentCatalogItem[]>("/departments/catalog/");
      return response.data;
    } catch (error) {
      console.warn("Erreur lors de la récupération du catalogue:", error);
      return [];
    }
  },

  async createDepartment(payload: {
    campus: number;
    name: string;
    code?: string;
    description?: string;
    icon?: string;
    admin?: number | null;
    deputy?: number | null;
    catalog_item?: number | null;
  }): Promise<DepartmentItem> {
    try {
      const response = await apiClient.post<DepartmentItem>("/departments/", payload);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la création du département:", error);
      throw error;
    }
  },
};
