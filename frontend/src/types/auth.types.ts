export type UserRole =
  | "SUPER_SUPER_ADMIN"
  | "SUPER_ADMIN_CAMPUS"
  | "GESTIONNAIRE_CAISSE"
  | "RESPONSABLE_PATRIMOINE"
  | "CHEF_BRIGADE"
  | "RESPONSABLE_DEPARTEMENT"
  | "FIDELE";

export interface CurrentUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  title: string; // Ex: "Apôtre", "Pasteur", "Diacre"
  role: UserRole;
  campus_id: string | null; // null for Super-Super Admin (global scope)
  avatar?: string;
}
