import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/SidebarContext";
import {
  Home,
  LayoutDashboard,
  FolderKanban,
  FlaskConical,
  Box,
  Rocket,
  Code2,
  Database,
  Activity,
  DollarSign,
  Store,
  Settings,
  Users,
  Zap,
  Shield,
  ClipboardList,
  BookOpen,
  Pin,
  PinOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  badge?: string;
  badgeVariant?: "default" | "success" | "warning";
}

const mainNavItems: NavItem[] = [
  { label: "Home", icon: Home, href: "/" },
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Projects", icon: FolderKanban, href: "/projects" },
  { label: "Experiments", icon: FlaskConical, href: "/experiments" },
  { label: "Models", icon: Box, href: "/models", badge: "12", badgeVariant: "default" },
  { label: "Deployments", icon: Rocket, href: "/deployments", badge: "Live", badgeVariant: "success" },
  { label: "Workspaces", icon: Code2, href: "/workspaces" },
];

const governanceNavItems: NavItem[] = [
  { label: "Data Catalog", icon: Database, href: "/data-catalog" },
  { label: "Monitoring", icon: Activity, href: "/monitoring" },
  { label: "FinOps", icon: DollarSign, href: "/finops" },
  { label: "Compliance", icon: Shield, href: "/compliance" },
  { label: "Security", icon: Zap, href: "/security" },
  { label: "Audit Logs", icon: ClipboardList, href: "/audit-logs" },
];

const marketplaceNavItems: NavItem[] = [
  { label: "Marketplace", icon: Store, href: "/marketplace" },
  { label: "Documentation", icon: BookOpen, href: "/documentation" },
];

const adminNavItems: NavItem[] = [
  { label: "Team", icon: Users, href: "/team" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

interface NavSectionProps {
  title?: string;
  items: NavItem[];
  collapsed: boolean;
  currentPath: string;
}

const NavSection = ({ title, items, collapsed, currentPath }: NavSectionProps) => (
  <div className="mb-6">
    {title && !collapsed && (
      <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
        {title}
      </p>
    )}
    {title && collapsed && (
      <div className="h-px bg-sidebar-border mx-3 mb-3" />
    )}
    <nav className="space-y-1">
      {items.map((item) => {
        const isActive = currentPath === item.href;
        const Icon = item.icon;

        const linkContent = (
          <Link
            to={item.href}
            className={cn(
              "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              "hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground hover:shadow-[0_0_12px_hsl(var(--primary)/0.15)]",
              collapsed && "justify-center px-2",
              isActive
                ? "bg-sidebar-accent text-primary shadow-[0_0_16px_hsl(var(--primary)/0.2)]"
                : "text-sidebar-foreground/70"
            )}
          >
            {/* Active indicator bar */}
            {isActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_8px_hsl(var(--primary)/0.5)]" />
            )}
            <Icon className={cn(
              "h-5 w-5 flex-shrink-0 transition-transform duration-200",
              isActive && "text-primary",
              !isActive && "group-hover:scale-110"
            )} />
            {!collapsed && (
              <>
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span
                    className={cn(
                      "px-2 py-0.5 text-xs font-semibold rounded-full",
                      item.badgeVariant === "success"
                        ? "bg-success/20 text-success"
                        : item.badgeVariant === "warning"
                        ? "bg-warning/20 text-warning"
                        : "bg-primary/20 text-primary"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </Link>
        );

        if (collapsed) {
          return (
            <Tooltip key={item.href} delayDuration={0}>
              <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
              <TooltipContent side="right" className="flex items-center gap-2">
                {item.label}
                {item.badge && (
                  <span
                    className={cn(
                      "px-1.5 py-0.5 text-xs font-semibold rounded-full",
                      item.badgeVariant === "success"
                        ? "bg-success/20 text-success"
                        : "bg-primary/20 text-primary"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </TooltipContent>
            </Tooltip>
          );
        }

        return <div key={item.href}>{linkContent}</div>;
      })}
    </nav>
  </div>
);

export const Sidebar = () => {
  const { collapsed, setCollapsed, pinned, togglePin } = useSidebar();
  const location = useLocation();

  const handleMouseEnter = () => {
    if (!pinned) {
      setCollapsed(false);
    }
  };

  const handleMouseLeave = () => {
    if (!pinned) {
      setCollapsed(true);
    }
  };

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border z-50",
        "flex flex-col transition-all duration-300 ease-out",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Logo - Links to Home */}
      <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-gold flex items-center justify-center shadow-lg">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-display font-bold text-foreground text-lg leading-tight">
                FED
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
                Analytic
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        <NavSection items={mainNavItems} collapsed={collapsed} currentPath={location.pathname} />
        <NavSection title="Governance" items={governanceNavItems} collapsed={collapsed} currentPath={location.pathname} />
        <NavSection title="Marketplace" items={marketplaceNavItems} collapsed={collapsed} currentPath={location.pathname} />
        <NavSection title="Admin" items={adminNavItems} collapsed={collapsed} currentPath={location.pathname} />
      </div>

      {/* Pin toggle */}
      <div className="p-3 border-t border-sidebar-border">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePin}
              className={cn(
                "w-full justify-center",
                pinned && "bg-primary/10 text-primary"
              )}
            >
              {pinned ? (
                <>
                  <PinOff className="h-4 w-4" />
                  {!collapsed && <span className="ml-2">Unpin</span>}
                </>
              ) : (
                <>
                  <Pin className="h-4 w-4" />
                  {!collapsed && <span className="ml-2">Pin sidebar</span>}
                </>
              )}
            </Button>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right">
              {pinned ? "Unpin sidebar" : "Pin sidebar"}
            </TooltipContent>
          )}
        </Tooltip>
      </div>
    </aside>
  );
};
