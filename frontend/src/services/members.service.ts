import {
  Member,
  EcclesialFunctionCatalogItem,
  MemberStatusCatalogItem,
  MemberTransferRequest,
} from "@/types/member.types";
import { apiClient } from "@/lib/apiClient";
import { extractPaginatedResults } from "@/lib/utils";

export const DEFAULT_ECCLESIAL_FUNCTIONS: { code: string; label: string }[] = [
  { code: "APOTRE", label: "Apôtre" },
  { code: "PASTEUR", label: "Pasteur" },
  { code: "ANCIEN", label: "Ancien" },
  { code: "DIACRE", label: "Diacre" },
  { code: "BERGER", label: "Berger" },
  { code: "RESPONSABLE", label: "Responsable" },
  { code: "ADJOINT", label: "Adjoint" },
  { code: "OUVRIER", label: "Ouvrier" },
  { code: "MEMBRE", label: "Membre" },
];

export const DEFAULT_MEMBER_STATUSES: { code: string; label: string; color: string }[] = [
  { code: "NOUVEAU", label: "Nouveau", color: "info" },
  { code: "ACTIF", label: "Actif", color: "success" },
  { code: "INACTIF", label: "Inactif", color: "warning" },
  { code: "SUSPENDU", label: "Suspendu", color: "error" },
];

export const membersService = {
  getMembers: async (campusId?: string | null): Promise<Member[]> => {
    try {
      const response = await apiClient.get('/members/list/');
      let members = extractPaginatedResults<Member>(response.data);
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

  createMember: async (data: any): Promise<Member> => {
    try {
      const payload: Record<string, any> = {
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone || data.whatsapp || "",
        address: data.residential_area || data.address || "",
        campus: data.campus_id ? parseInt(String(data.campus_id)) : 1,
        status: data.status || "NOUVEAU",
        ecclesial_function: data.ecclesial_function || "MEMBRE",
        sms_opt_in: data.sms_opt_in !== undefined ? data.sms_opt_in : true,
        whatsapp_opt_in: data.whatsapp_opt_in !== undefined ? data.whatsapp_opt_in : true,
      };
      if (data.email) {
        payload.email = data.email;
      }
      if (data.brigade_id) {
        payload.brigade = parseInt(String(data.brigade_id));
      }
      if (data.department_id) {
        payload.department = parseInt(String(data.department_id));
      }
      const response = await apiClient.post('/members/list/', payload);
      return response.data;
    } catch (error) {
      console.error("Error creating member:", error);
      throw error;
    }
  },

  updateMember: async (id: string | number, payload: Record<string, any>): Promise<Member> => {
    const response = await apiClient.patch(`/members/list/${id}/`, payload);
    return response.data;
  },

  updateMemberStage: async (id: string, stage: Member["assimilation_stage"]): Promise<Member | null> => {
    try {
      const response = await apiClient.patch(`/members/list/${id}/assimilation-stage/`, { stage });
      return response.data;
    } catch (error) {
      console.error(`Error updating member ${id} stage:`, error);
      return null;
    }
  },

  getBrigades: async (campusId?: string | null): Promise<any[]> => {
    try {
      const response = await apiClient.get('/members/brigades/');
      let brigades = extractPaginatedResults<any>(response.data);
      if (campusId && campusId !== "all") {
        brigades = brigades.filter((b: any) => b.campus === parseInt(campusId));
      }
      return brigades;
    } catch (error) {
      console.error("Error fetching brigades:", error);
      return [];
    }
  },

  createBrigade: async (data: { name: string; neighborhood?: string; campus: number; leader?: number | null }): Promise<any> => {
    try {
      const response = await apiClient.post('/members/brigades/', data);
      return response.data;
    } catch (error) {
      console.error("Error creating brigade:", error);
      throw error;
    }
  },

  getEcclesialFunctions: async (activeOnly = true): Promise<EcclesialFunctionCatalogItem[]> => {
    try {
      const response = await apiClient.get('/members/ecclesial-functions/', {
        params: activeOnly ? { active_only: 'true' } : undefined,
      });
      return extractPaginatedResults<EcclesialFunctionCatalogItem>(response.data);
    } catch (error) {
      console.error("Error fetching ecclesial functions:", error);
      return [];
    }
  },

  createEcclesialFunction: async (data: { code: string; label: string; rank_order?: number; is_active?: boolean }) => {
    const response = await apiClient.post('/members/ecclesial-functions/', data);
    return response.data;
  },

  updateEcclesialFunction: async (id: number, data: Partial<EcclesialFunctionCatalogItem>) => {
    const response = await apiClient.patch(`/members/ecclesial-functions/${id}/`, data);
    return response.data;
  },

  deleteEcclesialFunction: async (id: number) => {
    await apiClient.delete(`/members/ecclesial-functions/${id}/`);
  },

  getMemberStatuses: async (activeOnly = true): Promise<MemberStatusCatalogItem[]> => {
    try {
      const response = await apiClient.get('/members/statuses/', {
        params: activeOnly ? { active_only: 'true' } : undefined,
      });
      return extractPaginatedResults<MemberStatusCatalogItem>(response.data);
    } catch (error) {
      console.error("Error fetching member statuses:", error);
      return [];
    }
  },

  createMemberStatus: async (data: { code: string; label: string; color?: string; is_active?: boolean }) => {
    const response = await apiClient.post('/members/statuses/', data);
    return response.data;
  },

  updateMemberStatus: async (id: number, data: Partial<MemberStatusCatalogItem>) => {
    const response = await apiClient.patch(`/members/statuses/${id}/`, data);
    return response.data;
  },

  deleteMemberStatus: async (id: number) => {
    await apiClient.delete(`/members/statuses/${id}/`);
  },

  getAlerts: async (campusId?: string | null): Promise<any[]> => {
    try {
      const params: Record<string, string> = {};
      if (campusId && campusId !== "all") {
        params.campus_id = campusId;
      }
      const response = await apiClient.get('/members/alerts/', { params });
      let alerts = extractPaginatedResults<any>(response.data);
      if (campusId && campusId !== "all") {
        alerts = alerts.filter((a: any) => String(a.campus) === String(campusId));
      }
      return alerts;
    } catch (error) {
      console.error("Error fetching alerts:", error);
      return [];
    }
  },

  createAlert: async (data: { member: number; title: string; description: string; campus?: number; assigned_pastor?: number | null }) => {
    const response = await apiClient.post('/members/alerts/', data);
    return response.data;
  },

  updateAlert: async (id: number | string, data: Record<string, any>) => {
    const response = await apiClient.patch(`/members/alerts/${id}/`, data);
    return response.data;
  },

  getTransfers: async (campusId?: string | null): Promise<MemberTransferRequest[]> => {
    const response = await apiClient.get('/members/transfers/');
    let transfers = extractPaginatedResults<MemberTransferRequest>(response.data);
    if (campusId && campusId !== "all") {
      const cid = parseInt(campusId, 10);
      transfers = transfers.filter((t) => t.from_campus === cid || t.to_campus === cid);
    }
    return transfers;
  },

  createTransfer: async (payload: {
    member: number;
    to_campus: number;
    reason?: string;
    preserve_assimilation?: boolean;
  }): Promise<MemberTransferRequest> => {
    const response = await apiClient.post('/members/transfers/', payload);
    return response.data;
  },

  approveTransfer: async (id: number | string, review_notes?: string): Promise<MemberTransferRequest> => {
    const response = await apiClient.post(`/members/transfers/${id}/approve/`, {
      review_notes: review_notes || "",
    });
    return response.data;
  },

  rejectTransfer: async (id: number | string, review_notes?: string): Promise<MemberTransferRequest> => {
    const response = await apiClient.post(`/members/transfers/${id}/reject/`, {
      review_notes: review_notes || "",
    });
    return response.data;
  },
};
