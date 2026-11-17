"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Backdrop } from "@/components/layout/Backdrop";
import { RoleScopeBanner } from "@/components/layout/RoleScopeBanner";
import { BottomActionBar } from "@/components/layout/BottomActionBar";
import { useSidebar, SidebarProvider } from "@/context/SidebarContext";
import { useTenant } from "@/context/TenantContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SidebarProvider>
  )
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isExpanded, isHovered } = useSidebar();
  const { currentUser } = useTenant();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) {
      router.replace("/login");
      return;
    }
    setIsCheckingAuth(false);
  }, [router, currentUser]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-xs text-gray-500">
        Vérification de la session…
      </div>
    );
  }

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
        <main className="flex-1 p-4 pb-24 mx-auto w-full max-w-[1536px] md:p-6 lg:p-8 xl:pb-8">
          <RoleScopeBanner />
          {children}
        </main>
        <BottomActionBar />
      </div>
    </div>
  );
}
