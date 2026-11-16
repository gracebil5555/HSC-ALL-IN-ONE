/**
 * useRole — hook centralisé pour les vérifications de rôle RBAC, périmètre
 * et délégation d'adjoint côté frontend (Sections 4 à 11, 15, 20).
 *
 * Hiérarchie à 3 niveaux + Adjoint à chaque niveau :
 *   1. Global    : SUPER_SUPER_ADMIN (+ son Adjoint)
 *   2. Église    : SUPER_ADMIN       (+ son Adjoint)
 *   3. Structure : ADMIN_DEPT        (+ son Adjoint)
 *   4. Membre    : MEMBRE
 */
import { useTenant } from "@/context/TenantContext";
import type { UserRole, GranularPermissionKey } from "@/types/auth.types";

export function useRole() {
  const { currentUser } = useTenant();
  const role: UserRole | null = (currentUser?.role as UserRole) ?? null;
  const isDeputyAccount = Boolean(currentUser?.is_deputy || role === "ADJOINT");
  const effectiveRole: UserRole | null =
    currentUser?.effective_role ??
    (isDeputyAccount && currentUser?.deputy_of_role
      ? currentUser.deputy_of_role
      : role);

  const delegated: string[] = currentUser?.delegated_permissions ?? [];

  // ── Niveaux directs et effectifs (incluant l'héritage de périmètre pour l'Adjoint) ──
  const isSuperSuperAdmin = effectiveRole === "SUPER_SUPER_ADMIN";
  const isSuperAdmin = effectiveRole === "SUPER_ADMIN";
  const isSuperAdminOrAbove = isSuperSuperAdmin || isSuperAdmin;
  const isAdminDept = effectiveRole === "ADMIN_DEPT";
  const isAdminOrAbove = isSuperAdminOrAbove || isAdminDept;
  const isAdjoint = isDeputyAccount;
  const isAdjointOrAbove = isAdminOrAbove || isAdjoint;
  const isMembre = role === "MEMBRE" && !isDeputyAccount;

  // ── Vérification des permissions granulaires (Section 15) ───────────────────
  // Clés officielles : 'voir' | 'creer' | 'modifier' | 'valider' | 'supprimer' | 'exporter' | 'administrer'
  const hasPermission = (perm: GranularPermissionKey | string): boolean => {
    if (!currentUser) return false;
    // Un titulaire (non-adjoint) possède toutes les permissions sur son propre périmètre
    if (!isDeputyAccount && isAdminOrAbove) {
      return true;
    }
    if (delegated.includes("administrer")) return true;
    return delegated.includes(perm);
  };

  // ── Résolution des Départements gérés par l'Admin Dept / Adjoint (Sections 8 & 9) ──
  const rawCodes = currentUser?.department_codes ?? [];
  const deptCodesFromList = (currentUser?.administered_departments ?? [])
    .map((d) => (d.code || "").toUpperCase())
    .filter(Boolean);
  const titleLower = (currentUser?.title || "").toLowerCase();

  const resolvedDeptCodes = new Set<string>([
    ...rawCodes.map((c) => c.toUpperCase()),
    ...deptCodesFromList,
  ]);
  if (resolvedDeptCodes.size === 0 && isAdminDept) {
    if (titleLower.includes("caisse") || titleLower.includes("financ") || titleLower.includes("trésor")) {
      resolvedDeptCodes.add("FINANCES");
    }
    if (titleLower.includes("patrimoine") || titleLower.includes("logist") || titleLower.includes("stock")) {
      resolvedDeptCodes.add("PATRIMOINE");
    }
    if (titleLower.includes("chorale") || titleLower.includes("louange") || titleLower.includes("musique")) {
      resolvedDeptCodes.add("CHORALE");
    }
    if (titleLower.includes("accueil") || titleLower.includes("protocole")) {
      resolvedDeptCodes.add("ACCUEIL");
    }
    if (titleLower.includes("social") || titleLower.includes("diacon")) {
      resolvedDeptCodes.add("SOCIAL");
    }
    if (titleLower.includes("secrétariat") || titleLower.includes("secretariat")) {
      resolvedDeptCodes.add("SECRETARIAT");
    }
    if (titleLower.includes("brigade") || titleLower.includes("gdc") || titleLower.includes("berger")) {
      resolvedDeptCodes.add("BRIGADE");
    }
  }
  const departmentCodes = Array.from(resolvedDeptCodes);

  const isFinanceDept = departmentCodes.includes("FINANCES");
  const isPatrimoineDept = departmentCodes.includes("PATRIMOINE");
  const isChoraleDept = departmentCodes.includes("CHORALE");
  const isAccueilSocialSecDept = departmentCodes.some((c) =>
    ["ACCUEIL", "SOCIAL", "SECRETARIAT", "EVANGELISATION", "JEUNESSE", "COMMUNICATION"].includes(c)
  );
  const isBrigadeDept =
    departmentCodes.some((c) => ["BRIGADE", "GDC"].includes(c)) ||
    currentUser?.ecclesial_function === "BERGER";

  // Si un Admin Dept gère uniquement Finance ou uniquement Patrimoine, il ne doit pas voir les autres départements (Section 20)
  const isStrictlyFinanceOrPatrimoine =
    isAdminDept &&
    (isFinanceDept || isPatrimoineDept) &&
    !isChoraleDept &&
    !isAccueilSocialSecDept &&
    !isBrigadeDept;

  // ── Scope vue ───────────────────────────────────────────────────────────────
  const hasGlobalScope = isSuperSuperAdmin;

  // ── Permissions fonctionnelles par module (Sections 9, 10, 11, 15, 20) ──────
  const canCreateExtension =
    isSuperSuperAdmin && (!isDeputyAccount || hasPermission("creer") || hasPermission("administrer"));

  const canManageDepartments =
    isSuperAdminOrAbove && (hasPermission("creer") || hasPermission("modifier") || hasPermission("administrer"));

  const canAssignDeputy =
    !isDeputyAccount && (isSuperSuperAdmin || isSuperAdmin || isAdminDept);

  const canViewMembers =
    (isSuperAdminOrAbove || (isAdminDept && !isStrictlyFinanceOrPatrimoine)) &&
    hasPermission("voir");

  const canManageMembers =
    (isSuperAdminOrAbove || (isAdminDept && !isStrictlyFinanceOrPatrimoine)) &&
    (hasPermission("creer") || hasPermission("modifier"));

  const canViewFinances =
    (isSuperAdminOrAbove || isFinanceDept) && hasPermission("voir");

  const canManageFinances =
    (isSuperAdminOrAbove || isFinanceDept) &&
    (hasPermission("creer") || hasPermission("modifier") || hasPermission("valider"));

  const canApproveVouchers =
    isSuperAdminOrAbove && hasPermission("valider");

  const canDisburseVouchers =
    (isSuperAdminOrAbove || isFinanceDept) && hasPermission("valider");

  const canViewPatrimoine =
    (isSuperAdminOrAbove || isPatrimoineDept) && hasPermission("voir");

  const canManagePatrimoine =
    (isSuperAdminOrAbove || isPatrimoineDept) &&
    (hasPermission("creer") || hasPermission("modifier"));

  const canViewBrigades =
    (isSuperAdminOrAbove || isBrigadeDept || isAccueilSocialSecDept) && hasPermission("voir");

  const canViewNetworkReports = isSuperSuperAdmin && hasPermission("voir");
  const canViewCampusReports = isSuperAdminOrAbove && hasPermission("voir");
  const canManageUsers =
    isSuperAdminOrAbove && (hasPermission("creer") || hasPermission("administrer"));
  const canViewAlerts =
    (isSuperAdminOrAbove || (isAdminDept && !isStrictlyFinanceOrPatrimoine)) &&
    hasPermission("voir");

  return {
    role,
    effectiveRole,
    isDeputyAccount,
    // Booléens de niveau
    isSuperSuperAdmin,
    isSuperAdmin,
    isSuperAdminOrAbove,
    isAdminDept,
    isAdminOrAbove,
    isAdjoint,
    isAdjointOrAbove,
    isMembre,
    // Départements spécifiques
    departmentCodes,
    isFinanceDept,
    isPatrimoineDept,
    isChoraleDept,
    isAccueilSocialSecDept,
    isBrigadeDept,
    // Scope
    hasGlobalScope,
    // Permissions fonctionnelles
    canCreateExtension,
    canManageDepartments,
    canAssignDeputy,
    canViewMembers,
    canManageMembers,
    canViewFinances,
    canManageFinances,
    canApproveVouchers,
    canDisburseVouchers,
    canViewPatrimoine,
    canManagePatrimoine,
    canViewBrigades,
    canViewNetworkReports,
    canViewCampusReports,
    canManageUsers,
    canViewAlerts,
    hasPermission,
  };
}
