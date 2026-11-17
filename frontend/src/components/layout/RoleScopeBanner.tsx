"use client";

import React from "react";
import { Globe2, Building2, Layers, UserCheck } from "lucide-react";
import { useTenant } from "@/context/TenantContext";
import { useRole } from "@/hooks/useRole";

export const RoleScopeBanner: React.FC = () => {
  const { currentUser, currentCampus } = useTenant();
  const {
    isSuperSuperAdmin,
    isSuperAdmin,
    isAdminDept,
    isAdjoint,
    departmentCodes,
  } = useRole();
  const delegatedPermissions: string[] = currentUser?.delegated_permissions ?? [];

  if (!currentUser) return null;

  let scopeLabel = "Espace Membre";
  let scopeDesc = "Accès personnel HSC";
  let scopeIcon = <Building2 className="w-4 h-4" />;
  let bannerClasses =
    "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200";
  let pillClasses = "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300";

  if (isSuperSuperAdmin) {
    scopeLabel = "Vue Mondiale — Super Super Admin";
    scopeDesc = currentCampus
      ? `Focus actif : ${currentCampus.name} (${currentCampus.currency || "XAF"})`
      : "Consolidation multi-pays (Congo • Canada • Extensions)";
    scopeIcon = <Globe2 className="w-4 h-4 text-gold-400" />;
    bannerClasses =
      "bg-gradient-to-r from-brand-950 via-brand-900 to-brand-800 border-brand-800 text-white shadow-theme-xs";
    pillClasses = "bg-gold-500/20 text-gold-100 border border-gold-400/30";
  } else if (isSuperAdmin) {
    scopeLabel = `Vue Église — ${currentUser.campus_name || currentCampus?.name || "Campus"}`;
    scopeDesc = "Gouvernance locale & validation pastorale";
    scopeIcon = <Building2 className="w-4 h-4 text-brand-600 dark:text-brand-400" />;
    bannerClasses =
      "bg-brand-25/80 dark:bg-brand-950/40 border-brand-200/80 dark:border-brand-800/60 text-brand-950 dark:text-brand-100";
    pillClasses = "bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300";
  } else if (isAdminDept) {
    const deptLabel = departmentCodes.length > 0 ? departmentCodes.join(" • ") : "Département";
    scopeLabel = `Admin Département — ${deptLabel}`;
    scopeDesc = `Périmètre : ${currentUser.campus_name || "Église locale"}`;
    scopeIcon = <Layers className="w-4 h-4 text-brand-600 dark:text-brand-400" />;
    bannerClasses =
      "bg-white dark:bg-white/[0.03] border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white";
    pillClasses = "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300";
  }

  return (
    <div className="mb-5 space-y-2">
      <div
        className={`relative flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-2.5 transition-colors ${bannerClasses}`}
      >
        {/* Discreet HSC Orange hairline accent on left */}
        <span
          className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-full bg-hsc-orange-500/85"
          aria-hidden="true"
        />
        <div className="flex items-center gap-2.5 pl-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-black/5 dark:bg-white/10 shrink-0">
            {scopeIcon}
          </div>
          <div>
            <p className="text-theme-sm font-semibold leading-tight">{scopeLabel}</p>
            <p className="text-theme-xs opacity-80">{scopeDesc}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${pillClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-hsc-orange-400" aria-hidden="true" />
          {currentUser.ecclesial_function_display || currentUser.role_display || currentUser.role}
        </span>
      </div>

      {isAdjoint && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-hsc-orange-500/25 bg-hsc-orange-50/70 dark:bg-hsc-orange-500/10 px-4 py-2 text-theme-xs text-gray-800 dark:text-hsc-orange-100">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-hsc-orange-500 shrink-0" />
            <span className="font-semibold">Mode Adjoint Délégué</span>
            <span className="text-gray-600 dark:text-gray-300">
              — Agit par délégation de{" "}
              <strong className="font-semibold">
                {currentUser.deputy_of_name || "Titulaire"}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {delegatedPermissions.map((perm: string) => (
              <span
                key={perm}
                className="rounded-full bg-white/80 dark:bg-gray-900/60 border border-hsc-orange-500/20 px-2 py-0.5 text-[11px] font-medium capitalize text-hsc-orange-600 dark:text-hsc-orange-400"
              >
                {perm}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
