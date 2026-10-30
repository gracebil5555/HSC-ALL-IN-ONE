import { Campus } from "@/types/campus.types";
import { apiClient } from "@/lib/apiClient";

export const campusesService = {
  async getCampuses(): Promise<Campus[]> {
    try {
      const response = await apiClient.get<Campus[]>("/campuses/");
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération des campus:", error);
      return [];
    }
  },

  async createCampus(payload: Partial<Campus> & { name: string; country: string; city: string; parent?: number | string | null }): Promise<Campus> {
    try {
      const response = await apiClient.post<Campus>("/campuses/", payload);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la création de l'extension:", error);
      throw error;
    }
  },
};

