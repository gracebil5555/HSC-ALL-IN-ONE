"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Campus } from "@/types/campus.types";
import { CurrentUser } from "@/types/auth.types";
import { MOCK_CAMPUSES, MOCK_USERS } from "@/mocks/campuses.mock";

interface TenantContextType {
  campuses: Campus[];
  currentCampus: Campus | null; // null represents Global Network (Réseau Mondial)
  currentCampusId: string; // "all" or specific campus id
  setCurrentCampusId: (id: string) => void;
  currentUser: CurrentUser;
  setCurrentUser: (user: CurrentUser) => void;
  isGlobalScope: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [campuses] = useState<Campus[]>(MOCK_CAMPUSES);
  const [currentUser, setCurrentUser] = useState<CurrentUser>(MOCK_USERS.apostle);
  const [currentCampusId, setCurrentCampusIdState] = useState<string>("all");

  useEffect(() => {
    // If the user has a specific local campus bound, lock to that campus unless super_super_admin
    if (currentUser.role !== "SUPER_SUPER_ADMIN" && currentUser.campus_id) {
      setCurrentCampusIdState(currentUser.campus_id);
    }
  }, [currentUser]);

  const setCurrentCampusId = (id: string) => {
    setCurrentCampusIdState(id);
    if (typeof window !== "undefined") {
      localStorage.setItem("hsc-active-campus", id);
    }
  };

  const currentCampus = currentCampusId === "all"
    ? null
    : campuses.find((c) => c.id === currentCampusId) || null;

  const isGlobalScope = currentCampusId === "all";

  return (
    <TenantContext.Provider
      value={{
        campuses,
        currentCampus,
        currentCampusId,
        setCurrentCampusId,
        currentUser,
        setCurrentUser,
        isGlobalScope,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}
