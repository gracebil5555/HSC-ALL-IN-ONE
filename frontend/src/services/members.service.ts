import { Member } from "@/types/member.types";
import { apiClient } from "@/lib/apiClient";

export const membersService = {
  getMembers: async (campusId?: string | null): Promise<Member[]> => {
    try {
      const response = await apiClient.get('/members/list/');
      let members = response.data;
      if (campusId && campusId !== "all") {
        members = members.filter((m: any) => m.campus === parseInt(campusId));
      }
      return members;
    } catch (error) {
      console.error("Error fetching members:", error);
      return [];
    }
  },

  getMemberById: async (id: string): Promise<Member | null> => {
    try {
      const response = await apiClient.get(`/members/list/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching member ${id}:`, error);
      return null;
    }
  },

  createMember: async (data: Omit<Member, "id" | "joined_date">): Promise<Member> => {
    try {
      const payload = {
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        campus: data.campus_id ? parseInt(data.campus_id) : 1,
        status: 'NOUVEAU', // Default status for backend
      };
      const response = await apiClient.post('/members/list/', payload);
      return response.data;
    } catch (error) {
      console.error("Error creating member:", error);
      throw error;
    }
  },

  updateMemberStage: async (id: string, stage: Member["assimilation_stage"]): Promise<Member | null> => {
    try {
      const payload = { status: stage };
      const response = await apiClient.patch(`/members/list/${id}/`, payload);
      return response.data;
    } catch (error) {
      console.error(`Error updating member ${id} stage:`, error);
      return null;
    }
  },

  getBrigades: async (campusId?: string | null): Promise<any[]> => {
    try {
      const response = await apiClient.get('/members/brigades/');
      let brigades = response.data;
      if (campusId && campusId !== "all") {
        brigades = brigades.filter((b: any) => b.campus === parseInt(campusId));
      }
      return brigades;
    } catch (error) {
      console.error("Error fetching brigades:", error);
      return [];
    }
  },

  createBrigade: async (data: { name: string; neighborhood?: string; campus: number }): Promise<any> => {
    try {
      const response = await apiClient.post('/members/brigades/', data);
      return response.data;
    } catch (error) {
      console.error("Error creating brigade:", error);
      throw error;
    }
  },
};
