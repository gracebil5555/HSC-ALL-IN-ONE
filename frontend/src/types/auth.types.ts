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

/**
 * 6 Profils Opérationnels Officiels
 * Source : Dossier d'Architecture Système Complète HSC — Section 1 : Matrice des Rôles & Gouvernance Multi-Sites (RBAC)
 */
export interface OperationalProfile {
  id: string;
  label: string;
  role: UserRole;
  function: EcclesialFunction;
  defaultTitle: string;
  badge: string;
  desc: string;
  support: string;
  scope: string;
  features: string[];
  requiresSuperSuperAdmin?: boolean;
}

export const OPERATIONAL_PROFILES: OperationalProfile[] = [
  {
    id: "PASTEUR_CAMPUS",
    label: "Super Admin Campus (Pasteur Principal Local)",
    role: "SUPER_ADMIN",
    function: "PASTEUR",
    defaultTitle: "Pasteur",
    badge: "Super Admin",
    desc: "Gestion intégrale d'un campus local, validation des dépenses de caisse et gouvernance des comptes locaux.",
    support: "Web Desktop",
    scope: "Extension / Campus Local (ex: Ngoyo, Mpaka, Moungali, Canada)",
    features: [
      "Dashboard consolidé & alertes du campus",
      "Gestion des membres & pipeline d'assimilation",
      "Supervision des brigades & animateurs GDC",
      "Validation pastorale des pièces de caisse (décaissements)",
      "Création & affectation des comptes locaux de l'église",
      "Gestion du patrimoine & inventaires du campus",
    ],
    requiresSuperSuperAdmin: true, // Seul le Visionnaire nomme des Pasteurs
  },
  {
    id: "GESTIONNAIRE_CAISSE",
    label: "Gestionnaire Caisse & Trésorerie",
    role: "ADMIN_DEPT",
    function: "RESPONSABLE",
    defaultTitle: "Gestionnaire Caisse",
    badge: "Finances & Caisse",
    desc: "Émission et décaissement des pièces de caisse avec justificatifs, suivi des dîmes, offrandes et Mobile Money.",
    support: "Web Desktop",
    scope: "Trésorerie Locale de l'Église",
    features: [
      "Émission et décaissement des pièces de caisse",
      "Justificatifs, reçus et factures acquittées",
      "Enregistrement des dîmes & offrandes (espèces & Mobile Money)",
      "Journal financier & rapprochement en temps réel",
      "Annuaire d'entraide économique",
    ],
  },
  {
    id: "RESP_PATRIMOINE",
    label: "Responsable Patrimoine & Logistique",
    role: "ADMIN_DEPT",
    function: "RESPONSABLE",
    defaultTitle: "Resp. Patrimoine",
    badge: "Patrimoine & Logistique",
    desc: "Gestion du parc matériel (son, vidéo, mobilier, groupe électrogène), stocks consommables et inventaires mensuels.",
    support: "Web & Mobile",
    scope: "Campus Local",
    features: [
      "Référentiel du parc matériel avec QR Codes imprimables",
      "Gestion des stocks consommables (enveloppes, livrets, huile)",
      "Bons d'entrée (achats/dons) et bons de sortie (cultes)",
      "Alertes automatiques de seuil critique",
      "Comptage physique & clôture d'inventaire mensuel",
    ],
  },
  {
    id: "CHEF_BRIGADE",
    label: "Chef de Brigade / Animateur GDC",
    role: "ADJOINT",
    function: "BERGER",
    defaultTitle: "Berger",
    badge: "Brigade PWA",
    desc: "Pointage dominical en un clic ou par mémo vocal IA (Voice-to-Data), et transmission directe des urgences pastorales.",
    support: "Mobile PWA & Web",
    scope: "Unité Pastorale de Proximité (20-40 fidèles)",
    features: [
      "Pointage dominical des présences (un clic)",
      "Mémos vocaux WhatsApp / Voice-to-Action (IA Whisper)",
      "Signalement direct des alertes (santé, hospitalisation, deuil)",
      "Suivi de proximité des âmes de la brigade",
    ],
  },
  {
    id: "RESP_DEPARTEMENT",
    label: "Responsable de Département Ministériel",
    role: "ADMIN_DEPT",
    function: "RESPONSABLE",
    defaultTitle: "Responsable",
    badge: "Département",
    desc: "Gestion des effectifs de service (Chantres, Protocole, Médias...), scan OCR des feuilles d'émargement et demandes de caisse.",
    support: "Mobile PWA & Web",
    scope: "Département Ministériel Spécifique",
    features: [
      "Gestion de l'équipe et planning des répétitions/services",
      "Scan photo OCR des feuilles d'émargement manuscrites",
      "Formulation des demandes de pièces de caisse pour le département",
    ],
  },
  {
    id: "FIDELE_MEMBRE",
    label: "Fidèle / Entrepreneur Communautaire",
    role: "MEMBRE",
    function: "FIDELE",
    defaultTitle: "Frère / Sœur",
    badge: "Membre Actif",
    desc: "Membre de la communauté : accès à l'annuaire économique d'entraide et suivi de son parcours d'assimilation.",
    support: "Web & Mobile",
    scope: "Communauté HSC",
    features: [
      "Répertoire économique des métiers & compétences",
      "Mise en relation directe par WhatsApp et téléphone",
      "Consultation de son parcours spirituel (Pipeline d'assimilation)",
    ],
  },
];

