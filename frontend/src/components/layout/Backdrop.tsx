"use client";

import React from "react";
import { useSidebar } from "@/context/SidebarContext";

export const Backdrop: React.FC = () => {
  const { isMobileOpen, setMobileOpen } = useSidebar();

  if (!isMobileOpen) return null;

  return (
    <div
      onClick={() => setMobileOpen(false)}
      className="fixed inset-0 z-9999 bg-gray-900/50 backdrop-blur-xs transition-opacity xl:hidden"
    />
  );
};
