"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Receipt, Boxes, Mic } from "lucide-react";
import { useRole } from "@/hooks/useRole";

export const BottomActionBar: React.FC = () => {
  const pathname = usePathname();
  const {
    canViewMembers,
    canViewFinances,
    canViewPatrimoine,
    isSuperAdminOrAbove,
    isBrigadeDept,
  } = useRole();

  const items = [
    {
      label: "Accueil",
      href: "/dashboard",
      icon: <LayoutDashboard className="w-4 h-4" />,
      visible: true,
    },
    {
      label: "Membres",
      href: "/members",
      icon: <Users className="w-4 h-4" />,
      visible: canViewMembers,
    },
    {
      label: "Finances",
      href: "/finances",
      icon: <Receipt className="w-4 h-4" />,
      visible: canViewFinances,
    },
    {
      label: "Actifs",
      href: "/patrimoine",
      icon: <Boxes className="w-4 h-4" />,
      visible: canViewPatrimoine,
    },
    {
      label: "IA Voix",
      href: "/ai/voice-report",
      icon: <Mic className="w-4 h-4" />,
      visible: isSuperAdminOrAbove || isBrigadeDept,
    },
  ].filter((i) => i.visible);

  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Navigation rapide mobile"
      className="fixed bottom-0 inset-x-0 z-40 xl:hidden border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md px-2 py-1.5 shadow-theme-lg"
    >
      <div className="flex items-center justify-around">
        {items.slice(0, 5).map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl text-[11px] font-medium transition-colors ${
                active
                  ? "text-brand-600 dark:text-brand-400 bg-brand-50/70 dark:bg-brand-500/10"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {active && (
                <span
                  className="absolute top-0.5 w-4 h-0.5 rounded-full bg-hsc-orange-500"
                  aria-hidden="true"
                />
              )}
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
