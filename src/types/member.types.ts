export type AssimilationStage =
  | "ACCUEIL"
  | "MODULE_1"
  | "MODULE_2"
  | "BAPTEME"
  | "INTEGRE";

export interface Member {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  whatsapp: string;
  residential_area: string; // Ex: "Mpita", "Ngoyo", "Tié-Tié", "Paka", "Centre-ville"
  campus_id: string;
  brigade_id: string | null; // OPTIONNELLE : null = "Non affecté"
  brigade_name?: string;
  department_id: string | null;
  department_name?: string;
  assimilation_stage: AssimilationStage;
  assimilation_progress: string; // Ex: "0/4", "3/4", "4/5"
  is_baptized: boolean;
  baptism_date?: string | null;
  joined_date: string;
  avatar?: string;
  notes?: string;
}
