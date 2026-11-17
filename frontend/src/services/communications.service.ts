import { apiClient } from "@/lib/apiClient";
import { extractPaginatedResults } from "@/lib/utils";

export interface MessageTemplateItem {
  id: number;
  campus: number | null;
  campus_name?: string | null;
  name: string;
  category: string;
  category_display?: string;
  channel: "SMS" | "WHATSAPP" | "BOTH";
  channel_display?: string;
  body: string;
  is_active: boolean;
  is_auto_welcome: boolean;
  created_at: string;
}

export interface CommunicationCampaignItem {
  id: number;
  campus: number;
  campus_name?: string;
  title: string;
  template: number | null;
  template_name?: string;
  channel: "SMS" | "WHATSAPP" | "BOTH";
  custom_body: string;
  audience_type: string;
  audience_display?: string;
  target_status?: string;
  target_ecclesial_function?: string;
  target_department?: number | null;
  department_name?: string;
  include_deputies: boolean;
  status: string;
  status_display?: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  sent_at: string | null;
  created_at: string;
}

export interface MessageLogItem {
  id: number;
  campus: number;
  campus_name?: string;
  campaign: number | null;
  campaign_title?: string;
  recipient_name: string;
  recipient_phone: string;
  channel: "SMS" | "WHATSAPP";
  status: "QUEUED" | "SENT" | "DELIVERED" | "FAILED" | "SIMULATED";
  status_display?: string;
  rendered_content: string;
  provider_message_id: string;
  error_message: string;
  sent_at: string;
}

export const communicationsService = {
  getTemplates: async (campusId?: string | null): Promise<MessageTemplateItem[]> => {
    try {
      const response = await apiClient.get("/communications/templates/", {
        params: campusId && campusId !== "all" ? { campus_id: campusId } : undefined,
      });
      return extractPaginatedResults<MessageTemplateItem>(response.data);
    } catch (error) {
      console.error("Error fetching message templates:", error);
      return [];
    }
  },

  createTemplate: async (data: Partial<MessageTemplateItem>): Promise<MessageTemplateItem> => {
    const response = await apiClient.post("/communications/templates/", data);
    return response.data;
  },

  updateTemplate: async (id: number, data: Partial<MessageTemplateItem>): Promise<MessageTemplateItem> => {
    const response = await apiClient.patch(`/communications/templates/${id}/`, data);
    return response.data;
  },

  deleteTemplate: async (id: number): Promise<void> => {
    await apiClient.delete(`/communications/templates/${id}/`);
  },

  getCampaigns: async (campusId?: string | null): Promise<CommunicationCampaignItem[]> => {
    try {
      const response = await apiClient.get("/communications/campaigns/", {
        params: campusId && campusId !== "all" ? { campus_id: campusId } : undefined,
      });
      return extractPaginatedResults<CommunicationCampaignItem>(response.data);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      return [];
    }
  },

  createCampaign: async (data: Record<string, any>): Promise<CommunicationCampaignItem> => {
    const response = await apiClient.post("/communications/campaigns/", data);
    return response.data;
  },

  getLogs: async (campusId?: string | null): Promise<MessageLogItem[]> => {
    try {
      const response = await apiClient.get("/communications/logs/", {
        params: campusId && campusId !== "all" ? { campus_id: campusId } : undefined,
      });
      return extractPaginatedResults<MessageLogItem>(response.data);
    } catch (error) {
      console.error("Error fetching message logs:", error);
      return [];
    }
  },
};
