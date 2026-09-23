import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/SidebarContext";
import { useState, useMemo } from "react";
import {
  Plus,
  FolderKanban,
  Clock,
  Star,
  Layout,
  FlaskConical,
  Box,
  Rocket,
  GitCompare,
  Database,
  LineChart,
  Network,
  FileText,
  Server,
  Code2,
  Cpu,
  Layers,
  Activity,
  AlertTriangle,
  Gauge,
  BarChart3,
  Shield,
  ClipboardList,
  DollarSign,
  Lock,
  Users,
  BookOpen,
  ChevronRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  NewExperimentDialog,
  DeployModelDialog,
  LaunchWorkspaceDialog,
} from "@/components/dialogs";
import { CreateProjectWizard } from "@/components/dialogs/CreateProjectWizard";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface ContextualNavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  badge?: string;
  badgeVariant?: "default" | "success" | "warning" | "info";
}

interface ContextualSection {
  title?: string;
  items: ContextualNavItem[];
  requiredPermission?: "iam" | "audit" | "security" | "compliance";
}

// Define contextual navigation for each primary domain
const contextualNav: Record<string, { title: string; createLabel?: string; createAction?: string; sections: ContextualSection[] }> = {
  projects: {
    title: "Projects",
    createLabel: "New Project",
    createAction: "project",
    sections: [
      {
      items: [
          { label: "All Projects", icon: FolderKanban, href: "/projects" },
          { label: "Recent", icon: Clock, href: "/projects?filter=recent" },
          { label: "Favorites", icon: Star, href: "/projects?filter=favorites" },
          { label: "Templates", icon: Layout, href: "/projects/templates" },
        ],
      },
    ],
  },
  data: {
    title: "Data",
    sections: [
      {
        items: [
          { label: "Data Catalog", icon: Database, href: "/data-catalog" },
          { label: "Lineage", icon: Network, href: "/data-catalog?tab=lineage" },
          { label: "Quality", icon: Gauge, href: "/data-catalog?tab=quality" },
          { label: "Datasets", icon: FileText, href: "/data-catalog?tab=datasets" },
        ],
      },
    ],
  },
  models: {
    title: "Models",
    createLabel: "New Model",
    createAction: "deploy",
    sections: [
      {
        items: [
          { label: "Registry", icon: Box, href: "/models" },
          { label: "Experiments", icon: FlaskConical, href: "/experiments" },
          { label: "Deployments", icon: Rocket, href: "/deployments", badge: "Live", badgeVariant: "success" },
          { label: "Compare", icon: GitCompare, href: "/models/compare" },
        ],
      },
    ],
  },
  compute: {
    title: "Compute",
    createLabel: "New Workspace",
    createAction: "workspace",
    sections: [
      {
        items: [
          { label: "Workspaces", icon: Code2, href: "/workspaces" },
          { label: "Clusters", icon: Server, href: "/workspaces?tab=clusters" },
          { label: "Jobs", icon: Cpu, href: "/workspaces?tab=jobs" },
          { label: "Resources", icon: Layers, href: "/workspaces?tab=resources" },
        ],
      },
    ],
  },
  monitor: {
    title: "Monitor",
    sections: [
      {
        items: [
          { label: "Overview", icon: Activity, href: "/monitoring" },
          { label: "Alerts", icon: AlertTriangle, href: "/monitoring?tab=alerts", badge: "3", badgeVariant: "warning" },
          { label: "Metrics", icon: BarChart3, href: "/monitoring?tab=metrics" },
          { label: "FinOps", icon: DollarSign, href: "/finops" },
          { label: "Energy", icon: Gauge, href: "/energy" },
          { label: "Quality Control", icon: LineChart, href: "/quality-control" },
          { label: "Predictive Maint.", icon: Cpu, href: "/predictive-maintenance" },
        ],
      },
    ],
  },
  governance: {
    title: "Governance",
    sections: [
      {
        title: "Compliance",
        requiredPermission: "compliance",
        items: [
          { label: "Overview", icon: Shield, href: "/compliance" },
          { label: "Regulations", icon: ClipboardList, href: "/compliance?tab=regulations" },
          { label: "AI Act / AI Systems", icon: Shield, href: "/ai-governance" },
        ],
      },
      {
        title: "Security",
        requiredPermission: "security",
        items: [
          { label: "Settings", icon: Lock, href: "/security" },
          { label: "Sessions", icon: Activity, href: "/security?tab=sessions" },
        ],
      },
      {
        title: "IAM",
        requiredPermission: "iam",
        items: [
          { label: "Users", icon: Users, href: "/governance/users" },
          { label: "Roles", icon: Shield, href: "/governance/roles" },
          { label: "Permissions", icon: Lock, href: "/governance/permissions" },
        ],
      },
      {
        title: "Audit",
        requiredPermission: "audit",
        items: [
          { label: "Logs", icon: ClipboardList, href: "/audit-logs" },
          { label: "Team", icon: Users, href: "/team" },
          { label: "Docs", icon: BookOpen, href: "/documentation" },
        ],
      },
    ],
  },
};

export const ContextualSidebar = () => {
  const { activeContext, setActiveContext, pinned } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const { canViewIAM, canViewAudit, canViewSecurity, canViewCompliance } = useCurrentUser();

  const context = activeContext ? contextualNav[activeContext] : null;

  // Filter sections based on user permissions
  const filteredSections = useMemo(() => {
    if (!context) return [];
    
    return context.sections.filter((section) => {
      if (!section.requiredPermission) return true;
      
      switch (section.requiredPermission) {
        case "iam":
          return canViewIAM;
        case "audit":
          return canViewAudit;
        case "security":
          return canViewSecurity;
        case "compliance":
          return canViewCompliance;
        default:
          return true;
      }
    });
  }, [context, canViewIAM, canViewAudit, canViewSecurity, canViewCompliance]);

  const handleClose = () => {
    if (!pinned) {
      setActiveContext(null);
    }
  };

  const handleCreateClick = () => {
    if (context?.createAction) {
      setOpenDialog(context.createAction);
    }
  };

  if (!context || !activeContext) return null;

  return (
    <>
      <aside
        className={cn(
          "fixed left-14 top-0 h-screen w-56 bg-sidebar border-r border-sidebar-border z-40",
          "flex flex-col transition-all duration-300 ease-out",
          "animate-fade-in"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-sm">{context.title}</span>
          </div>
          {!pinned && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Create Action */}
        {context.createLabel && (
          <div className="px-3 pt-3">
            <Button
              variant="premium"
              size="sm"
              className="w-full justify-start gap-2 text-xs"
              onClick={handleCreateClick}
            >
              <Plus className="h-3.5 w-3.5" />
              {context.createLabel}
            </Button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-3">
          {filteredSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="space-y-1">
              {section.title && (
                <p className="px-2 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                  {section.title}
                </p>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const currentFullPath = location.pathname + location.search;
                const isActive = currentFullPath === item.href || 
                  (location.pathname === item.href && !item.href.includes("?"));

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      "hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground",
                      isActive
                        ? "bg-sidebar-accent text-primary"
                        : "text-sidebar-foreground/70"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 flex-shrink-0", isActive && "text-primary")} />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && (
                      <span
                        className={cn(
                          "px-1.5 py-0.5 text-[10px] font-semibold rounded-full",
                          item.badgeVariant === "success"
                            ? "bg-success/20 text-success"
                            : item.badgeVariant === "warning"
                            ? "bg-warning/20 text-warning"
                            : item.badgeVariant === "info"
                            ? "bg-info/20 text-info"
                            : "bg-primary/20 text-primary"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* Dialogs */}
      <CreateProjectWizard open={openDialog === "project"} onOpenChange={(open) => !open && setOpenDialog(null)} />
      <NewExperimentDialog open={openDialog === "experiment"} onOpenChange={(open) => !open && setOpenDialog(null)} />
      <LaunchWorkspaceDialog open={openDialog === "workspace"} onOpenChange={(open) => !open && setOpenDialog(null)} />
      <DeployModelDialog open={openDialog === "deploy"} onOpenChange={(open) => !open && setOpenDialog(null)} />
    </>
  );
};
