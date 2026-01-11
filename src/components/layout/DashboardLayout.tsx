import { ReactNode } from "react";
import { PrimarySidebar } from "./PrimarySidebar";
import { ContextualSidebar } from "./ContextualSidebar";
import { MinimalHeader } from "./MinimalHeader";
import { Breadcrumb } from "./Breadcrumb";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { activeContext } = useSidebar();

  // Calculate left padding based on sidebars
  // Primary sidebar: 56px (w-14)
  // Contextual sidebar: 224px (w-56) when active
  const leftPadding = activeContext ? "pl-[280px]" : "pl-14";

  return (
    <div className="min-h-screen bg-background">
      <PrimarySidebar />
      <ContextualSidebar />
      <div
        className={cn(
          "transition-all duration-300 ease-out flex flex-col min-h-screen",
          leftPadding
        )}
      >
        <MinimalHeader />
        <main className="flex-1 p-6">
          <Breadcrumb />
          {children}
        </main>
      </div>
    </div>
  );
};
