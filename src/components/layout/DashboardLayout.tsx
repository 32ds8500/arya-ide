"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden md:block">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onCommandPalette={() => {}} />

        <main className="flex-1 overflow-auto p-6 pb-20 md:pb-6">
          <div className={cn("mx-auto w-full max-w-7xl", className)}>
            {children}
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
