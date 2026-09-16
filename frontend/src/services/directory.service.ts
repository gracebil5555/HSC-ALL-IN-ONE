import { apiClient } from "@/lib/apiClient";
import { BusinessProfile } from "@/types/directory.types";

export const directoryService = {
  async getBusinesses(campusId?: string | null): Promise<BusinessProfile[]> {
    try {
      const response = await apiClient.get<BusinessProfile[]>("/directory/businesses/");
      let data = response.data;
      if (campusId && campusId !== "all") {
        data = data.filter((b) => b.campus === parseInt(campusId));
      }
      return data;
    } catch (error) {
      console.error("Erreur lors du chargement de l'annuaire économique:", error);
      return [];
    }
  },

  async createBusiness(payload: {
    business_name: string;
    category: string;
    description: string;
    whatsapp_number: string;
    member: number;
    campus: number;
  }): Promise<BusinessProfile> {
    const response = await apiClient.post<BusinessProfile>("/directory/businesses/", payload);
    return response.data;
  },
};
