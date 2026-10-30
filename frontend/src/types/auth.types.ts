// ──────────────────────────────────────────────────────────────────────────────
// Rôles techniques (correspondent aux ROLE_CHOICES du modèle Django User)
// ──────────────────────────────────────────────────────────────────────────────
export type UserRole =
  | "SUPER_SUPER_ADMIN" // Apôtre / Direction mondiale HSC
  | "SUPER_ADMIN"       // Pasteur / Directeur d'une église ou extension
  | "ADMIN_DEPT"        // Responsable de département
  | "ADJOINT"           // Délégué / Adjoint d'un responsable
  | "MEMBRE";           // Fidèle / Membre standard

// ──────────────────────────────────────────────────────────────────────────────
// Fonctions ecclésiales (distinctes du rôle technique)
// ──────────────────────────────────────────────────────────────────────────────
export type EcclesialFunction =
  | "APOTRE"
  | "PASTEUR"
  | "ANCIEN"
  | "DIACRE"
  | "EVANGELISTE"
  | "DOCTEUR"
  | "PROPHETE"
  | "BERGER"
  | "RESPONSABLE"
  | "ADJOINT_DEPT"
  | "OUVRIER"
  | "FIDELE";

// ──────────────────────────────────────────────────────────────────────────────
// Permissions granulaires pour la délégation aux adjoints (Section 15)
// ──────────────────────────────────────────────────────────────────────────────
export const GRANULAR_PERMISSIONS = [
  { key: "voir", label: "Voir & Consulter", desc: "Lecture des données du périmètre" },
  { key: "creer", label: "Créer", desc: "Création d'enregistrements (membres, présences, etc.)" },
  { key: "modifier", label: "Modifier", desc: "Mise à jour des informations" },
  { key: "valider", label: "Valider", desc: "Validation pastorale / financière" },
  { key: "supprimer", label: "Supprimer", desc: "Archivage ou suppression" },
  { key: "exporter", label: "Exporter", desc: "Export de listes et rapports PDF/Excel" },
  { key: "administrer", label: "Administrer", desc: "Configuration de la structure" },
] as const;

export type GranularPermissionKey = (typeof GRANULAR_PERMISSIONS)[number]["key"];

// ──────────────────────────────────────────────────────────────────────────────
// Profil utilisateur courant (retourné par /api/v1/users/me/)
// ──────────────────────────────────────────────────────────────────────────────
export interface CurrentUser {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;

  /** Titre honorifique libre (ex: "Apôtre", "Pasteur Dr.") */
  title: string;

  /** Rôle technique RBAC */
  role: UserRole;
  role_display: string;

  /** Fonction ecclésiale (distincte du rôle) */
  ecclesial_function: EcclesialFunction;
  ecclesial_function_display: string;

  /** Campus rattaché (null = global pour SUPER_SUPER_ADMIN) */
  campus_id: string | null;
  campus?: number | null;
  campus_name?: string;

  /** Système d'adjoint */
  is_deputy: boolean;
  deputy_of?: string | null;
  deputy_of_name?: string;
  delegated_permissions: string[];

  phone?: string;
  avatar?: string;
  is_active: boolean;
}

export interface CreateUserPayload {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  title?: string;
  role: UserRole;
  ecclesial_function: EcclesialFunction;
  campus?: number | null;
  phone?: string;
  password?: string;
}

export interface AssignDeputyPayload {
  deputy_id: number | string;
  delegated_permissions: string[];
}

