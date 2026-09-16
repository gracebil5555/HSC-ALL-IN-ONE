export type BusinessCategory =
  | "SERVICES"
  | "TRADE"
  | "TECH"
  | "HEALTH"
  | "ART"
  | "OTHER";

export interface BusinessProfile {
  id: number;
  campus: number;
  member: number;
  member_name: string;
  business_name: string;
  category: BusinessCategory;
  description: string;
  whatsapp_number: string;
  whatsapp_link: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}
