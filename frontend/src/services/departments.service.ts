import { apiClient } from "@/lib/apiClient";
import { extractPaginatedResults } from "@/lib/utils";

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
      const response = await apiClient.get<DepartmentItem[] | { results: DepartmentItem[] }>("/departments/", { params });
      return extractPaginatedResults(response.data);
    } catch (error) {
      console.warn("Erreur lors de la récupération des départements:", error);
      return [];
    }
  },

  async getCatalog(): Promise<DepartmentCatalogItem[]> {
    try {
      const response = await apiClient.get<DepartmentCatalogItem[] | { results: DepartmentCatalogItem[] }>("/departments/catalog/");
      return extractPaginatedResults(response.data);
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
    is_active?: boolean;
  }): Promise<DepartmentItem> {
    try {
      const response = await apiClient.post<DepartmentItem>("/departments/", payload);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la création du département:", error);
      throw error;
    }
  },

  async updateDepartment(
    id: number,
    payload: Partial<{
      name: string;
      code: string;
      description: string;
      admin: number | null;
      deputy: number | null;
      is_active: boolean;
    }>
  ): Promise<DepartmentItem> {
    const response = await apiClient.patch<DepartmentItem>(`/departments/${id}/`, payload);
    return response.data;
  },

  async deleteDepartment(id: number): Promise<void> {
    await apiClient.delete(`/departments/${id}/`);
  },

  async createCatalogItem(payload: {
    name: string;
    code: string;
    description?: string;
    icon?: string;
    is_default?: boolean;
  }): Promise<DepartmentCatalogItem> {
    const response = await apiClient.post<DepartmentCatalogItem>("/departments/catalog/", payload);
    return response.data;
  },
};
