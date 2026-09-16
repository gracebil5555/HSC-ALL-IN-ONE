"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSidebar } from "@/context/SidebarContext";
import { useTheme } from "@/context/ThemeContext";
import { useTenant } from "@/context/TenantContext";
import { CampusSelector } from "@/components/layout/CampusSelector";
import {
  Menu,
  Moon,
  Sun,
  Bell,
  Search,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  User,
  LogOut,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";
import { MOCK_USERS } from "@/mocks/campuses.mock";

export const Header: React.FC = () => {
  const { isExpanded, toggleExpanded, toggleMobileOpen } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const { currentUser, setCurrentUser } = useTenant();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setIsUserOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const notifications = [
    {
      id: 1,
      type: "alert",
      title: "Urgence Hospitalisation",
      desc: "Maman Koumba (Brigade David - Mpita)",
      time: "Il y a 10 min",
      icon: <AlertTriangle className="w-4 h-4 text-error-500" />,
      bg: "bg-error-50 dark:bg-error-500/10",
    },
    {
      id: 2,
      type: "voucher",
      title: "Pièce de caisse en attente",
      desc: "Achat carburant groupe (85 000 FCFA)",
      time: "Il y a 45 min",
      icon: <Receipt className="w-4 h-4 text-warning-500" />,
      bg: "bg-warning-50 dark:bg-warning-500/10",
    },
    {
      id: 3,
      type: "stock",
      title: "Alerte seuil stock",
      desc: "Enveloppes dîmes restantes : 35 (seuil 50)",
      time: "Il y a 2 h",
      icon: <CheckCircle2 className="w-4 h-4 text-brand-500" />,
      bg: "bg-brand-50 dark:bg-brand-500/10",
    },
  ];

  return (
    <header className="sticky top-0 z-9999 flex w-full items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900 md:px-6 h-18">
      {/* Left side: Toggles, Brand on Mobile & Campus Selector */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Desktop Sidebar Toggle */}
        <button
          onClick={toggleExpanded}
          className="hidden xl:flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-white/5 transition-colors"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMobileOpen}
          className="flex xl:hidden items-center justify-center w-10 h-10 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-white/5 transition-colors"
          aria-label="Toggle Mobile Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Multi-Tenant Campus Selector */}
        <CampusSelector />
      </div>

      {/* Center / Search Bar (Desktop) */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un fidèle, brigade, pièce, actif... (⌘K)"
            className="w-full h-10 rounded-lg border border-gray-200 bg-gray-50/50 pl-10 pr-12 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:bg-white focus:ring-3 focus:ring-brand-500/10 focus:outline-hidden dark:border-gray-800 dark:bg-gray-800/40 dark:text-white/90 dark:placeholder:text-gray-500 transition-colors shadow-theme-xs"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex items-center px-1.5 py-0.5 rounded border border-gray-200 bg-white text-[10px] font-medium text-gray-400 dark:border-gray-700 dark:bg-gray-800">
            ⌘K
          </span>
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle Dark Mode"
          className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white transition-colors shadow-theme-xs"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-warning-400" />
          ) : (
            <Moon className="w-4 h-4 text-gray-600" />
          )}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-white/5 transition-colors shadow-theme-xs"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-error-500 ring-2 ring-white dark:ring-gray-900 animate-pulse" />
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900 z-99999 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                  Notifications Pastorales & Caisse
                </h4>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400">
                  3 nouvelles
                </span>
              </div>

              <div className="mt-2 divide-y divide-gray-100 dark:divide-gray-800">
                {notifications.map((n) => (
                  <div key={n.id} className="py-2.5 flex items-start gap-3 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] rounded-lg px-2 transition-colors cursor-pointer">
                    <div className={`p-2 rounded-xl ${n.bg} shrink-0 mt-0.5`}>
                      {n.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 dark:text-white/90 truncate">
                        {n.title}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                        {n.desc}
                      </p>
                      <span className="text-[10px] text-gray-400">{n.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown & Role Switcher */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setIsUserOpen(!isUserOpen)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-brand-100 border border-brand-200 dark:border-brand-800 shrink-0">
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={`${currentUser.first_name || ""} ${currentUser.last_name || ""}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-brand-600 font-bold text-xs">
                  {currentUser?.first_name?.[0] || "H"}
                  {currentUser?.last_name?.[0] || "S"}
                </div>
              )}
            </div>

            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-semibold text-gray-800 dark:text-white/90 leading-tight">
                {currentUser ? `${currentUser.title || ""} ${currentUser.last_name || ""}`.trim() : "Utilisateur"}
              </span>
              <span className="text-[10px] text-gray-400 leading-tight">
                {currentUser?.role === "SUPER_SUPER_ADMIN"
                  ? "Réseau Mondial"
                  : currentUser?.role || "Membre"}
              </span>
            </div>

            <ChevronDown className="hidden lg:block w-3.5 h-3.5 text-gray-400" />
          </button>

          {isUserOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900 z-99999 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800 mb-2">
                <p className="text-xs font-semibold text-gray-800 dark:text-white/90">
                  {currentUser ? `${currentUser.title || ""} ${currentUser.first_name || ""} ${currentUser.last_name || ""}`.trim() : "Non connecté"}
                </p>
                <p className="text-[11px] text-gray-400 truncate">{currentUser?.email || "session locale"}</p>
                <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-brand-600 dark:text-brand-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Rôle actif : {currentUser?.role || "Invité"}</span>
                </div>
              </div>

              {/* Persona Switcher for pair programming / testing */}
              <div className="px-3 py-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Changer de Rôle (Test RBAC)
                </p>
                <div className="space-y-1">
                  {Object.entries(MOCK_USERS).map(([key, user]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setCurrentUser(user);
                        setIsUserOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        currentUser?.id === user.id
                          ? "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400 font-medium"
                          : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5"
                      }`}
                    >
                      <span className="truncate">
                        {user.title} {user.last_name}
                      </span>
                      <span className="text-[9px] text-gray-400 uppercase">
                        {user.role.replace("SUPER_SUPER_ADMIN", "GLOBAL").slice(0, 8)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="my-1 border-t border-gray-100 dark:border-gray-800" />

              <a
                href="/login"
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-500/10 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Se déconnecter</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
