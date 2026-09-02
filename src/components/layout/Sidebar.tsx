"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import {
  LayoutDashboard,
  Users,
  GitMerge,
  ShieldAlert,
  Boxes,
  Package,
  Receipt,
  BookOpen,
  Briefcase,
  Mic,
  ScanLine,
  ChevronDown,
  Church,
  X,
  History,
} from "lucide-react";

interface MenuItem {
  name: string;
  path?: string;
  icon: React.ReactNode;
  badge?: string;
  subItems?: { name: string; path: string }[];
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

export const Sidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setHovered, setMobileOpen } = useSidebar();
  const pathname = usePathname();
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  const toggleSubmenu = (key: string) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const menuGroups: MenuGroup[] = [
    {
      title: "Gouvernance & Fidèles",
      items: [
        {
          name: "Dashboard",
          path: "/dashboard",
          icon: <LayoutDashboard className="w-5 h-5" />,
        },
        {
          name: "Membres & Fidèles",
          path: "/members",
          icon: <Users className="w-5 h-5" />,
        },
        {
          name: "Pipeline d'Assimilation",
          path: "/assimilation",
          icon: <GitMerge className="w-5 h-5" />,
          badge: "Kanban",
        },
        {
          name: "Brigades & GDC",
          path: "/brigades",
          icon: <Church className="w-5 h-5" />,
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
        },
        {
          name: "Stocks Consommables",
          path: "/patrimoine/stocks",
          icon: <Package className="w-5 h-5" />,
        },
        {
          name: "Finances & Caisse",
          icon: <Receipt className="w-5 h-5" />,
          subItems: [
            { name: "Pièces de Caisse", path: "/finances/vouchers" },
            { name: "Journal Financier", path: "/finances/journal" },
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
        },
        {
          name: "Alertes Pastorales",
          path: "/alerts",
          icon: <ShieldAlert className="w-5 h-5" />,
        },
      ],
    },
    {
      title: "Moteur d'IA (Simulations)",
      items: [
        {
          name: "Voice-to-Action",
          path: "/ai/voice-to-action",
          icon: <Mic className="w-5 h-5" />,
          badge: "Whisper",
        },
        {
          name: "OCR Émargement",
          path: "/ai/ocr-vision",
          icon: <ScanLine className="w-5 h-5" />,
          badge: "Vision",
        },
      ],
    },
  ];

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
              <div className="h-4" />
            )}

            <ul className="space-y-1">
              {group.items.map((item, itemIdx) => {
                const isSubmenu = Boolean(item.subItems && item.subItems.length > 0);
                const isItemActive = item.path
                  ? pathname === item.path || (item.path !== "/dashboard" && pathname.startsWith(item.path))
                  : item.subItems?.some((sub) => pathname === sub.path);

                const submenuKey = `${groupIdx}-${itemIdx}`;
                const isOpen = openSubmenus[submenuKey] || isItemActive;

                if (isSubmenu) {
                  return (
                    <li key={itemIdx}>
                      <button
                        onClick={() => toggleSubmenu(submenuKey)}
                        className={`flex items-center w-full gap-3 px-3 py-2.5 font-medium rounded-lg text-theme-sm transition-colors ${
                          isItemActive
                            ? "bg-brand-50 text-brand-600 dark:bg-brand-500/12 dark:text-brand-400"
                            : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                        } ${!showExpanded ? "justify-center px-0" : ""}`}
                      >
                        <span className={isItemActive ? "text-brand-500" : "text-gray-500 dark:text-gray-400"}>
                          {item.icon}
                        </span>

                        {showExpanded && (
                          <>
                            <span className="flex-1 text-left">{item.name}</span>
                            <ChevronDown
                              className={`w-4 h-4 text-gray-400 transition-transform ${
                                isOpen ? "rotate-180 text-brand-500" : ""
                              }`}
                            />
                          </>
                        )}
                      </button>

                      {/* Submenu items */}
                      {showExpanded && isOpen && item.subItems && (
                        <ul className="mt-1 pl-9 space-y-1">
                          {item.subItems.map((sub, subIdx) => {
                            const isSubActive = pathname === sub.path;
                            return (
                              <li key={subIdx}>
                                <Link
                                  href={sub.path}
                                  onClick={() => setMobileOpen(false)}
                                  className={`block px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                                    isSubActive
                                      ? "text-brand-600 bg-brand-50/70 font-semibold dark:bg-brand-500/15 dark:text-brand-400"
                                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-white/5"
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
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 font-medium rounded-lg text-theme-sm transition-colors group ${
                        isItemActive
                          ? "bg-brand-50 text-brand-600 dark:bg-brand-500/12 dark:text-brand-400"
                          : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                      } ${!showExpanded ? "justify-center px-0" : ""}`}
                    >
                      <span className={isItemActive ? "text-brand-500" : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200"}>
                        {item.icon}
                      </span>

                      {showExpanded && (
                        <>
                          <span className="flex-1">{item.name}</span>
                          {item.badge && (
                            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Footer / System Version */}
      {showExpanded && (
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 text-center">
          <p className="text-[11px] text-gray-400">HSC Platform v1.0 · Phase 1</p>
          <p className="text-[10px] text-gray-400 font-light">Siège Mpita & Multi-Sites</p>
        </div>
      )}
    </aside>
  );
};
