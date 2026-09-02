"use client";

import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Backdrop } from "@/components/layout/Backdrop";
import { useSidebar } from "@/context/SidebarContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered } = useSidebar();

  const isWide = isExpanded || isHovered;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Backdrop />
      <Sidebar />

      <div
        className={`flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          isWide ? "xl:ml-[290px]" : "xl:ml-[90px]"
        } ml-0`}
      >
        <Header />
        <main className="flex-1 p-4 mx-auto w-full max-w-[1536px] md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
