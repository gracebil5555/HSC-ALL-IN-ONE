import { apiClient } from "@/lib/apiClient";
import { CurrentUser, CreateUserPayload, AssignDeputyPayload } from "@/types/auth.types";
import { MOCK_USERS_LIST } from "@/mocks/campuses.mock";

export const usersService = {
  async getUsers(campusId?: string, role?: string): Promise<CurrentUser[]> {
    try {
      const params: Record<string, string> = {};
      if (campusId && campusId !== "all") {
        params.campus_id = campusId;
      }
      if (role && role !== "ALL") {
        params.role = role;
      }
      const response = await apiClient.get<CurrentUser[]>("/users/", { params });
      return response.data;
    } catch (error) {
      console.warn("Utilisation des utilisateurs de secours (fallback mock):", error);
      let list = [...MOCK_USERS_LIST];
      if (campusId && campusId !== "all") {
        list = list.filter((u) => u.campus_id === campusId);
      }
      if (role && role !== "ALL") {
        list = list.filter((u) => u.role === role);
      }
      return list;
    }
  },

  async getContacts(campusId?: string): Promise<CurrentUser[]> {
    try {
      const params: Record<string, string> = {};
      if (campusId && campusId !== "all") {
        params.campus_id = campusId;
      }
      const response = await apiClient.get<CurrentUser[]>("/users/contacts/", { params });
      return response.data;
    } catch (error) {
      console.warn("Utilisation des contacts de secours (fallback mock):", error);
      let list = [...MOCK_USERS_LIST];
      if (campusId && campusId !== "all") {
        list = list.filter((u) => u.campus_id === campusId);
      }
      return list;
    }
  },

  async createUser(payload: CreateUserPayload): Promise<CurrentUser> {
    try {
      const response = await apiClient.post<CurrentUser>("/users/", payload);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la création de l'utilisateur:", error);
      throw error;
    }
  },

  async updateUser(id: string, payload: Partial<CreateUserPayload>): Promise<CurrentUser> {
    try {
      const response = await apiClient.patch<CurrentUser>(`/users/${id}/`, payload);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
      throw error;
    }
  },

  async deleteUser(id: string): Promise<void> {
    try {
      await apiClient.delete(`/users/${id}/`);
    } catch (error) {
      console.error("Erreur lors de la suppression de l'utilisateur:", error);
      throw error;
    }
  },

  async assignDeputy(titulaireId: string, payload: AssignDeputyPayload): Promise<any> {
    try {
      const response = await apiClient.post(`/users/${titulaireId}/assign-deputy/`, payload);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de l'assignation de l'adjoint:", error);
      throw error;
    }
  },

  async revokeDeputy(deputyId: string): Promise<any> {
    try {
      const response = await apiClient.post(`/users/${deputyId}/revoke-deputy/`);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la révocation de l'adjoint:", error);
      throw error;
    }
  },
};
