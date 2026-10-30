/**
 * useRole — hook centralisé pour les vérifications de rôle RBAC côté frontend.
 *
 * Hiérarchie :
 *   SUPER_SUPER_ADMIN > SUPER_ADMIN > ADMIN_DEPT > ADJOINT > MEMBRE
 *
 * Usage :
 *   const { isSuperSuperAdmin, canManageMembers } = useRole();
 */
import { useTenant } from "@/context/TenantContext";
import type { UserRole } from "@/types/auth.types";

export function useRole() {
  const { currentUser } = useTenant();
  const role: UserRole | null = (currentUser?.role as UserRole) ?? null;
  const delegated: string[] = currentUser?.delegated_permissions ?? [];

  // ── Niveau 1 ────────────────────────────────────────────────────────────────
  /** Apôtre / Direction mondiale */
  const isSuperSuperAdmin = role === "SUPER_SUPER_ADMIN";

  // ── Niveau 2 ────────────────────────────────────────────────────────────────
  /** Pasteur / Directeur d'église ou d'extension */
  const isSuperAdmin = role === "SUPER_ADMIN";

  /** Niveau ≥ Super Admin */
  const isSuperAdminOrAbove = isSuperSuperAdmin || isSuperAdmin;

  // ── Niveau 3 ────────────────────────────────────────────────────────────────
  /** Responsable de département */
  const isAdminDept = role === "ADMIN_DEPT";

  /** Niveau ≥ Admin Département */
  const isAdminOrAbove = isSuperAdminOrAbove || isAdminDept;

  // ── Niveau 4 ────────────────────────────────────────────────────────────────
  /** Adjoint / délégué */
  const isAdjoint = role === "ADJOINT";

  /** Niveau ≥ Adjoint */
  const isAdjointOrAbove = isAdminOrAbove || isAdjoint;

  // ── Niveau 5 ────────────────────────────────────────────────────────────────
  /** Fidèle / Membre standard */
  const isMembre = role === "MEMBRE";

  // ── Scope vue ───────────────────────────────────────────────────────────────
  /**
   * `true` si l'utilisateur doit voir la vue globale multi-sites.
   * Seul le SUPER_SUPER_ADMIN peut basculer en vue Réseau.
   */
  const hasGlobalScope = isSuperSuperAdmin;

  // ── Permissions fonctionnelles ───────────────────────────────────────────────

  /** Peut créer / modifier des membres */
  const canManageMembers =
    isAdminOrAbove ||
    (isAdjoint && delegated.includes("manage_members"));

  /** Peut valider / créer des pièces de caisse */
  const canManageFinances =
    isSuperAdminOrAbove ||
    (isAdminDept && delegated.includes("manage_finances")) ||
    (isAdjoint && delegated.includes("manage_finances"));

  /** Peut gérer les départements (créer, assigner) */
  const canManageDepartments =
    isSuperAdminOrAbove ||
    (isAdminDept && delegated.includes("manage_departments"));

  /** Peut voir les rapports et statistiques réseau */
  const canViewNetworkReports = isSuperSuperAdmin;

  /** Peut voir les rapports campus */
  const canViewCampusReports = isSuperAdminOrAbove;

  /** Peut inviter / gérer des utilisateurs */
  const canManageUsers = isSuperAdminOrAbove;

  /** Peut voir les alertes pastorales */
  const canViewAlerts = isAdminOrAbove;

  /** Vérifie une permission déléguée spécifique */
  const hasPermission = (perm: string): boolean => {
    if (isAdminOrAbove) return true;
    return delegated.includes(perm);
  };

  return {
    role,
    // Booléens de niveau
    isSuperSuperAdmin,
    isSuperAdmin,
    isSuperAdminOrAbove,
    isAdminDept,
    isAdminOrAbove,
    isAdjoint,
    isAdjointOrAbove,
    isMembre,
    // Scope
    hasGlobalScope,
    // Permissions fonctionnelles
    canManageMembers,
    canManageFinances,
    canManageDepartments,
    canViewNetworkReports,
    canViewCampusReports,
    canManageUsers,
    canViewAlerts,
    hasPermission,
  };
}
