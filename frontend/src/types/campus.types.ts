export type CampusType = "HQ" | "EXTENSION" | "FOYER";

export interface Campus {
  id: string;
  name: string;
  campus_type: CampusType;
  country: string;
  city: string;
  lead_pastor_name: string;
  enable_brigades: boolean;
  enable_patrimoine: boolean;
  enable_finances: boolean;
  enable_ai_voice: boolean;
  is_active: boolean;
  member_count: number;
}
