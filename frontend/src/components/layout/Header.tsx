"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { useTheme } from "@/context/ThemeContext";
import { useTenant } from "@/context/TenantContext";
import { CampusSelector } from "@/components/layout/CampusSelector";
import { authService } from "@/services/auth.service";
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
  UserCheck,
  UserPlus,
  Shield,
  Building2,
} from "lucide-react";

export const Header: React.FC = () => {
  const router = useRouter();
  const { isExpanded, toggleExpanded, toggleMobileOpen } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const { currentUser } = useTenant();

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

  const handleLogout = () => {
    authService.logout();
    window.location.href = "/login";
  };

  const isSuperSuperAdmin = currentUser?.role === "SUPER_SUPER_ADMIN";
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN" || isSuperSuperAdmin;

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-18 px-4 lg:px-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-colors">
      {/* Left: Sidebar toggle & Campus selector */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleExpanded}
          className="hidden xl:flex items-center justify-center w-10 h-10 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          onClick={toggleMobileOpen}
          className="xl:hidden flex items-center justify-center w-10 h-10 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Multi-Tenant Campus Selector */}
        <CampusSelector />
      </div>

      {/* Center: Quick Search Bar */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un membre, une brigade, une transaction..."
            className="w-full h-10 pl-10 pr-4 text-xs bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 rounded-xl text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          />
        </div>
      </div>

      {/* Right Actions: Theme, Notifications, User */}
      <div className="flex items-center gap-2">
        {/* Direct Action: Créer / Gérer les Comptes (Admins) */}
        {isSuperAdmin && (
          <Link
            href="/users"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-theme-xs transition-colors shrink-0"
            title="Gouvernance : Créer des comptes et gérer les rôles"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isSuperSuperAdmin ? "+ Nommer / Créer Compte" : "+ Créer un Compte"}
            </span>
          </Link>
        )}

        {/* Dark/Light toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center w-10 h-10 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          aria-label="Basculer le thème"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative flex items-center justify-center w-10 h-10 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-error-500 ring-2 ring-white dark:ring-gray-900" />
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900 z-99999 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 dark:border-gray-800 px-1">
                <span className="text-xs font-semibold text-gray-800 dark:text-white">Alertes Pastorales & Système</span>
                <span className="text-[10px] bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400 px-1.5 py-0.5 rounded-full font-bold">
                  2 nouvelles
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-warning-50 dark:bg-warning-500/15 text-warning-600 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 dark:text-white truncate">Absence prolongée détectée</p>
                    <p className="text-[11px] text-gray-400 truncate">Brigade David · Frère David M. (3 dimanches)</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-info-50 dark:bg-info-500/15 text-info-600 flex items-center justify-center shrink-0">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 dark:text-white truncate">Pièce de caisse en attente</p>
                    <p className="text-[11px] text-gray-400 truncate">PC-2026-004 · Achat carburant groupe</p>
                  </div>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 text-center">
                <Link
                  href="/alerts"
                  onClick={() => setIsNotifOpen(false)}
                  className="text-[11px] text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium"
                >
                  Voir toutes les alertes →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative ml-2" ref={userRef}>
          <button
            onClick={() => setIsUserOpen(!isUserOpen)}
            className="flex items-center gap-2.5 p-1.5 pl-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            aria-label="Menu profil"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-brand-100 dark:bg-brand-500/20 shrink-0 border border-brand-200 dark:border-brand-500/30">
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.username}
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
                {currentUser ? `${currentUser.title || ""} ${currentUser.last_name || currentUser.username}`.trim() : "Utilisateur"}
              </span>
              <span className="text-[10px] text-gray-400 leading-tight">
                {isSuperSuperAdmin
                  ? "Réseau Mondial (Visionnaire)"
                  : currentUser?.campus_name || currentUser?.role || "Membre"}
              </span>
            </div>

            <ChevronDown className="hidden lg:block w-3.5 h-3.5 text-gray-400" />
          </button>

          {isUserOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900 z-99999 animate-in fade-in zoom-in-95 duration-100">
              {/* Profile Details */}
              <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800 mb-2">
                <p className="text-xs font-semibold text-gray-800 dark:text-white/90">
                  {currentUser ? `${currentUser.title || ""} ${currentUser.first_name || ""} ${currentUser.last_name || currentUser.username}`.trim() : "Non connecté"}
                </p>
                <p className="text-[11px] text-gray-400 truncate">{currentUser?.email || "compte actif"}</p>
                
                <div className="mt-2 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-[10px] text-brand-600 dark:text-brand-400 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>Rôle : {currentUser?.role_display || currentUser?.role}</span>
                  </div>
                  {currentUser?.campus_name && (
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400">
                      <Building2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Campus : {currentUser.campus_name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Administrative Actions */}
              <div className="px-1 py-1 space-y-1">
                {isSuperAdmin && (
                  <Link
                    href="/users"
                    onClick={() => setIsUserOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/15 dark:hover:text-brand-400 transition-colors"
                  >
                    <UserCheck className="w-4 h-4 text-brand-500" />
                    <div className="flex flex-col text-left">
                      <span>Comptes & Gouvernance</span>
                      <span className="text-[10px] text-gray-400 font-normal">
                        {isSuperSuperAdmin ? "Créer des Super Admins & gérer le réseau" : "Gérer les comptes de l'église"}
                      </span>
                    </div>
                  </Link>
                )}

                <Link
                  href="/alerts"
                  onClick={() => setIsUserOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <AlertTriangle className="w-4 h-4 text-warning-500" />
                  <span>Alertes Pastorales</span>
                </Link>
              </div>

              <div className="my-1 border-t border-gray-100 dark:border-gray-800" />

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-500/10 rounded-lg transition-colors text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Se déconnecter</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
