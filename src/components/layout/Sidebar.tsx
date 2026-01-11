import { 
  LayoutDashboard, 
  FlaskConical, 
  Database, 
  GitBranch, 
  Settings, 
  Users,
  BarChart3,
  Layers,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  badge?: string;
}

const NavItem = ({ icon: Icon, label, active, badge }: NavItemProps) => (
  <button
    className={cn(
      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
      active 
        ? "bg-primary/10 text-primary border border-primary/20" 
        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
    )}
  >
    <Icon className="h-4 w-4" />
    <span className="flex-1 text-left">{label}</span>
    {badge && (
      <span className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary">
        {badge}
      </span>
    )}
  </button>
);

const Sidebar = () => {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center glow-effect">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold text-foreground">FedAnalytic</h1>
            <p className="text-xs text-muted-foreground">MLOps Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <div className="mb-4">
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
            Overview
          </p>
          <NavItem icon={LayoutDashboard} label="Dashboard" active />
          <NavItem icon={BarChart3} label="Analytics" />
        </div>

        <div className="mb-4">
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
            ML Operations
          </p>
          <NavItem icon={FlaskConical} label="Experiments" badge="12" />
          <NavItem icon={Layers} label="Models" badge="8" />
          <NavItem icon={GitBranch} label="Pipelines" />
          <NavItem icon={Database} label="Datasets" />
        </div>

        <div>
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
            Settings
          </p>
          <NavItem icon={Users} label="Team" />
          <NavItem icon={Settings} label="Settings" />
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="glass-card rounded-lg p-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-xs font-semibold text-primary-foreground">
              JD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">John Doe</p>
              <p className="text-xs text-muted-foreground truncate">Admin</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
