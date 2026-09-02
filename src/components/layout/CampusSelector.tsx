"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTenant } from "@/context/TenantContext";
import { Building2, Globe2, ChevronDown, Check } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export const CampusSelector: React.FC = () => {
  const { campuses, currentCampus, currentCampusId, setCurrentCampusId, currentUser } = useTenant();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const canSwitchCampus = currentUser.role === "SUPER_SUPER_ADMIN";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => canSwitchCampus && setIsOpen(!isOpen)}
        disabled={!canSwitchCampus}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-white/5 transition-colors shadow-theme-xs ${
          !canSwitchCampus ? "cursor-default opacity-90" : "cursor-pointer"
        }`}
      >
        <div className="flex items-center justify-center w-6 h-6 rounded-md bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
          {currentCampus ? (
            <Building2 className="w-3.5 h-3.5" />
          ) : (
            <Globe2 className="w-3.5 h-3.5" />
          )}
        </div>

        <div className="flex flex-col text-left">
          <span className="text-xs font-semibold leading-tight line-clamp-1">
            {currentCampus ? currentCampus.name : "Réseau Mondial (Global)"}
          </span>
          <span className="text-[10px] text-gray-400 leading-none">
            {currentCampus ? `${currentCampus.city}, ${currentCampus.country}` : "Vue Consolidée"}
          </span>
        </div>

        {canSwitchCampus && (
          <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 rounded-xl border border-gray-200 bg-white p-2 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900 z-99999 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800 mb-1">
            Changer de Contexte Tenant
          </div>

          {/* Option: Global Scope */}
          <button
            onClick={() => {
              setCurrentCampusId("all");
              setIsOpen(false);
            }}
            className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
              currentCampusId === "all"
                ? "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400 font-medium"
                : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Globe2 className="w-4 h-4 text-brand-500" />
              <div>
                <p className="font-semibold text-xs">Réseau Mondial (Tous les sites)</p>
                <p className="text-[11px] text-gray-400">Vision consolidée & statistiques</p>
              </div>
            </div>
            {currentCampusId === "all" && <Check className="w-4 h-4 text-brand-500" />}
          </button>

          <div className="my-1 border-t border-gray-100 dark:border-gray-800" />

          {/* List of Individual Campuses */}
          <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1">
            {campuses.map((campus) => {
              const isSelected = currentCampusId === campus.id;
              return (
                <button
                  key={campus.id}
                  onClick={() => {
                    setCurrentCampusId(campus.id);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs transition-colors text-left ${
                    isSelected
                      ? "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400 font-medium"
                      : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-gray-400" />
                    <div>
                      <p className="font-semibold line-clamp-1">{campus.name}</p>
                      <p className="text-[10px] text-gray-400">
                        {campus.city}, {campus.country} · {campus.member_count} membres
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant="light"
                      color={
                        campus.campus_type === "HQ"
                          ? "primary"
                          : campus.campus_type === "EXTENSION"
                          ? "info"
                          : "warning"
                      }
                      size="sm"
                    >
                      {campus.campus_type}
                    </Badge>
                    {isSelected && <Check className="w-3.5 h-3.5 text-brand-500" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
