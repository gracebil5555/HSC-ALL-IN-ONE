"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { useTenant } from "@/context/TenantContext";
import { useRole } from "@/hooks/useRole";
import {
  LayoutDashboard,
  Users,
  GitMerge,
  ShieldAlert,
  Boxes,
  Receipt,
  UserCheck,
  Briefcase,
  Church,
  Mic,
  ScanLine,
  ChevronDown,
  X,
  Package,
  Layers,
  MessageSquare,
  ArrowLeftRight,
  FileText,
} from "lucide-react";

interface MenuItem {
  name: string;
  path?: string;
  icon: React.ReactNode;
  badge?: string;
  subItems?: { name: string; path: string }[];
  visible?: boolean;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

export const Sidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setHovered, setMobileOpen } = useSidebar();
  const { currentUser } = useTenant();
  const {
    isSuperSuperAdmin,
    isSuperAdminOrAbove,
    isAdminDept,
    canViewMembers,
    canViewBrigades,
    canViewFinances,
    canViewPatrimoine,
    canViewAlerts,
    isFinanceDept,
    isPatrimoineDept,
    isChoraleDept,
    isAccueilSocialSecDept,
    isBrigadeDept,
    departmentCodes,
    hasPermission,
  } = useRole();
  const canViewCommunications =
    (isSuperAdminOrAbove ||
      departmentCodes.some((c) => ["ACCUEIL", "SECRETARIAT", "COMMUNICATION"].includes(c))) &&
    hasPermission("voir");
  const pathname = usePathname();
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  const toggleSubmenu = (key: string) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const isSSA = isSuperSuperAdmin;

  // Définition des menus strictement adaptés au rôle et au département (Sections 9, 15, 20)
  const allMenuGroups: MenuGroup[] = [
    {
      title: "Gouvernance & Fidèles",
      items: [
        {
          name: "Dashboard",
          path: "/dashboard",
          icon: <LayoutDashboard className="w-5 h-5" />,
          visible: true,
        },
        {
          name: "Départements & Structures",
          path: "/departments",
          icon: <Layers className="w-5 h-5" />,
          badge: isSSA ? "Catalogue" : "Église",
          visible: isSuperAdminOrAbove || isAdminDept,
        },
        {
          name: "Membres & Fidèles",
          path: "/members",
          icon: <Users className="w-5 h-5" />,
          visible: canViewMembers,
        },
        {
          name: "Transferts Inter-Églises",
          path: "/members/transfers",
          icon: <ArrowLeftRight className="w-5 h-5" />,
          visible: (isSuperAdminOrAbove || isAccueilSocialSecDept) && hasPermission("voir"),
        },
        {
          name: "Pipeline d'Assimilation",
          path: "/assimilation",
          icon: <GitMerge className="w-5 h-5" />,
          badge: "Kanban",
          visible: isSuperAdminOrAbove || isAccueilSocialSecDept || isChoraleDept || isBrigadeDept,
        },
        {
          name: "Brigades & GDC",
          path: "/brigades",
          icon: <Church className="w-5 h-5" />,
          visible: canViewBrigades,
        },
        {
          name: "Utilisateurs & Rôles",
          path: "/users",
          icon: <UserCheck className="w-5 h-5" />,
          badge: isSSA ? "Réseau" : "Adjoints",
          visible: isSuperAdminOrAbove || isAdminDept,
        },
        {
          name: "Journal d'Audit",
          path: "/audit-logs",
          icon: <FileText className="w-5 h-5" />,
          badge: "Immuable",
          visible: isSuperAdminOrAbove && hasPermission("voir"),
        },
      ],
    },
    {
      title: "Intendance & Finances",
      items: [
        {
          name: "Patrimoine & Actifs",
          path: "/patrimoine/assets",
          icon: <Boxes className="w-5 h-5" />,
          visible: canViewPatrimoine,
        },
        {
          name: "Stocks Consommables",
          path: "/patrimoine/stocks",
          icon: <Package className="w-5 h-5" />,
          visible: canViewPatrimoine,
        },
        {
          name: "Finances & Caisse",
          icon: <Receipt className="w-5 h-5" />,
          visible: canViewFinances,
          subItems: [
            { name: "Pièces de Caisse", path: "/finances/vouchers" },
            { name: "Journal Financier", path: "/finances/journal" },
            { name: "Taux & Clôtures", path: "/finances/governance" },
          ],
        },
      ],
    },
    {
      title: "Communauté & Pastorale",
      items: [
        {
          name: "Annuaire Économique",
          path: "/directory",
          icon: <Briefcase className="w-5 h-5" />,
          visible: true,
        },
        {
          name: "Alertes Pastorales",
          path: "/alerts",
          icon: <ShieldAlert className="w-5 h-5" />,
          visible: canViewAlerts,
        },
        {
          name: "SMS & WhatsApp",
          path: "/communications",
          icon: <MessageSquare className="w-5 h-5" />,
          badge: "Marketing",
          visible: canViewCommunications,
        },
      ],
    },
    {
      title: "Moteur d'IA (Assistant)",
      items: [
        {
          name: "Voice-to-Action",
          path: "/ai/voice-to-action",
          icon: <Mic className="w-5 h-5" />,
          badge: "Whisper",
          visible: isSuperAdminOrAbove || isBrigadeDept,
        },
        {
          name: "OCR Émargement",
          path: "/ai/ocr-vision",
          icon: <ScanLine className="w-5 h-5" />,
          badge: "Vision",
          visible: isSuperAdminOrAbove || (isAdminDept && !isFinanceDept && !isPatrimoineDept),
        },
      ],
    },
  ];

  // Filtrage dynamique des groupes de menu selon le rôle et le département
  const menuGroups = allMenuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.visible !== false),
    }))
    .filter((group) => group.items.length > 0);

  const showExpanded = isExpanded || isHovered || isMobileOpen;

  return (
    <aside
      id="sidebar"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`fixed top-0 left-0 z-99999 h-screen flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out ${
        showExpanded ? "w-[290px]" : "w-[90px]"
      } ${
        isMobileOpen
          ? "translate-x-0"
          : "-translate-x-full xl:translate-x-0"
      }`}
    >
      {/* Brand Header */}
      <div
        className={`flex items-center h-18 px-5 border-b border-gray-100 dark:border-gray-800 ${
          showExpanded ? "justify-between" : "justify-center"
        }`}
      >
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex items-center justify-center w-11 h-11 rounded-2xl overflow-hidden bg-white p-1 shadow-theme-xs border border-gray-100 dark:border-gray-800 shrink-0">
            <img
              src="/logo-hsc.jpg"
              alt="Logo HSC"
              className="w-full h-full object-contain"
            />
          </div>
          {showExpanded && (
            <div className="flex flex-col">
              <span className="font-bold text-base text-gray-900 dark:text-white leading-tight tracking-tight">
                HSC PLATFORM
              </span>
              <span className="text-[10px] text-gray-400 font-medium tracking-wide">
                Hauts Standards pour Christ
              </span>
            </div>
          )}
        </Link>

        {/* Mobile Close Button */}
        {isMobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 xl:hidden rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-4 py-5 no-scrollbar space-y-6">
        {menuGroups.map((group, groupIdx) => (
          <div key={groupIdx}>
            {showExpanded ? (
              <h4 className="mb-2.5 px-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                {group.title}
              </h4>
            ) : (
              <div className="h-4 border-b border-gray-100 dark:border-gray-800 mb-2" />
            )}

            <ul className="space-y-1">
              {group.items.map((item, itemIdx) => {
                const isActive = item.path ? pathname === item.path : false;
                const hasSubItems = Boolean(item.subItems && item.subItems.length > 0);
                const isSubmenuOpen = openSubmenus[item.name];

                if (hasSubItems) {
                  return (
                    <li key={itemIdx}>
                      <button
                        onClick={() => toggleSubmenu(item.name)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                          isSubmenuOpen
                            ? "bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="shrink-0">{item.icon}</span>
                          {showExpanded && <span>{item.name}</span>}
                        </div>
                        {showExpanded && (
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ${
                              isSubmenuOpen ? "rotate-180" : ""
                            }`}
                          />
                        )}
                      </button>

                      {showExpanded && isSubmenuOpen && (
                        <ul className="mt-1 pl-9 pr-2 space-y-1">
                          {item.subItems?.map((sub, subIdx) => {
                            const isSubActive = pathname === sub.path;
                            return (
                              <li key={subIdx}>
                                <Link
                                  href={sub.path}
                                  className={`block px-3 py-1.5 rounded-lg text-xs transition-colors ${
                                    isSubActive
                                      ? "font-semibold text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-500/10"
                                      : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                                  }`}
                                >
                                  {sub.name}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  );
                }

                return (
                  <li key={itemIdx}>
                    <Link
                      href={item.path || "#"}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors relative ${
                        isActive
                          ? "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400 font-semibold"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      {isActive && (
                        <span
                          className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full bg-hsc-orange-500"
                          aria-hidden="true"
                        />
                      )}
                      <span className="shrink-0">{item.icon}</span>
                      {showExpanded && (
                        <div className="flex-1 flex items-center justify-between">
                          <span>{item.name}</span>
                          {item.badge && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300 uppercase">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Role Badge Footer */}
      {showExpanded && (
        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400 flex items-center justify-center shrink-0 font-bold text-xs">
              {currentUser?.first_name?.[0] || "H"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 dark:text-white truncate">
                {currentUser?.first_name} {currentUser?.last_name}
              </p>
              <p className="text-[10px] text-gray-400 truncate">
                {isSSA ? "Supervision Mondiale" : currentUser?.campus_name || "Campus Local"}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
