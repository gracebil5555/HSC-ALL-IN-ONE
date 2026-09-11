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
      // Assuming 'assimilation_stage' is tracked via the assimilation profiles API
      // Since our Member model doesn't have assimilation_stage directly, we might need a separate endpoint
      // Or if it's meant to update status:
      const payload = { status: stage }; // Temporarily mapped to status for frontend demo
      const response = await apiClient.patch(`/members/list/${id}/`, payload);
      return response.data;
    } catch (error) {
      console.error(`Error updating member ${id} stage:`, error);
      return null;
    }
  },
};
