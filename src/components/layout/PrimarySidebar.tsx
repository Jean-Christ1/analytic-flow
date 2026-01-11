import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/SidebarContext";
import {
  LayoutGrid,
  FolderKanban,
  Database,
  Box,
  Server,
  Activity,
  Shield,
  Store,
  Bell,
  Settings,
  User,
  Pin,
  PinOff,
  Zap,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface PrimaryNavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href?: string;
  hasContextual: boolean;
}

export const primaryNavItems: PrimaryNavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid, href: "/dashboard", hasContextual: false },
  { id: "projects", label: "Projects", icon: FolderKanban, href: "/projects", hasContextual: true },
  { id: "data", label: "Data", icon: Database, href: "/data-catalog", hasContextual: true },
  { id: "models", label: "Models", icon: Box, href: "/models", hasContextual: true },
  { id: "compute", label: "Compute", icon: Server, href: "/workspaces", hasContextual: true },
  { id: "monitor", label: "Monitor", icon: Activity, href: "/monitoring", hasContextual: true },
  { id: "governance", label: "Governance", icon: Shield, href: "/compliance", hasContextual: true },
];

export const secondaryNavItems: PrimaryNavItem[] = [
  { id: "marketplace", label: "Marketplace", icon: Store, href: "/marketplace", hasContextual: false },
];

// Mock notifications data
const notifications = [
  { id: 1, title: "Deployment Complete", message: "Model v2.1 deployed to production", time: "2m ago", read: false },
  { id: 2, title: "Training Finished", message: "Experiment #42 completed successfully", time: "15m ago", read: false },
  { id: 3, title: "Alert Triggered", message: "High latency detected in API", time: "1h ago", read: true },
];

export const PrimarySidebar = () => {
  const { activeContext, setActiveContext, pinned, togglePin } = useSidebar();
  const { user, signOut } = useAuth();
  const { role, isLoading: isRoleLoading } = useCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (item: PrimaryNavItem) => {
    if (item.hasContextual) {
      setActiveContext(item.id);
    } else {
      setActiveContext(null);
    }
    if (item.href) {
      navigate(item.href);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Successfully signed out");
    navigate("/auth");
  };

  const getUserInitials = () => {
    if (user?.user_metadata?.full_name) {
      const names = user.user_metadata.full_name.split(" ");
      return names.map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  const isActive = (item: PrimaryNavItem) => {
    if (item.hasContextual && activeContext === item.id) return true;
    if (item.href && location.pathname.startsWith(item.href)) return true;
    return false;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <aside className="fixed left-0 top-0 h-screen w-14 bg-sidebar border-r border-sidebar-border z-50 flex flex-col">
      {/* Logo */}
      <div className="flex items-center justify-center h-14 border-b border-sidebar-border">
        <Link to="/" className="flex items-center justify-center">
          <div className="w-8 h-8 rounded-lg bg-gradient-gold flex items-center justify-center shadow-lg">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
        </Link>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 py-3 px-2 flex flex-col gap-1">
        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          
          return (
            <Tooltip key={item.id} delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleNavClick(item)}
                  className={cn(
                    "relative w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200",
                    "hover:bg-sidebar-accent hover:shadow-[0_0_12px_hsl(var(--primary)/0.15)]",
                    active
                      ? "bg-sidebar-accent text-primary shadow-[0_0_16px_hsl(var(--primary)/0.2)]"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
                  )}
                  <Icon className={cn("h-5 w-5", active && "text-primary")} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        })}

        {/* Separator */}
        <div className="h-px bg-sidebar-border my-2" />

        {/* Secondary Navigation */}
        {secondaryNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          
          return (
            <Tooltip key={item.id} delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleNavClick(item)}
                  className={cn(
                    "relative w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200",
                    "hover:bg-sidebar-accent hover:shadow-[0_0_12px_hsl(var(--primary)/0.15)]",
                    active
                      ? "bg-sidebar-accent text-primary shadow-[0_0_16px_hsl(var(--primary)/0.2)]"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
                  )}
                  <Icon className={cn("h-5 w-5", active && "text-primary")} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      {/* System Controls - Bottom */}
      <div className="p-2 border-t border-sidebar-border flex flex-col gap-1">
        {/* Theme Toggle */}
        <div className="flex justify-center">
          <ThemeToggle />
        </div>

        {/* Notifications Popover */}
        <Popover>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative w-10 h-10 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              Notifications
            </TooltipContent>
          </Tooltip>
          <PopoverContent side="right" align="end" className="w-80 p-0" sideOffset={8}>
            <div className="p-3 border-b border-border">
              <h4 className="font-semibold text-sm">Notifications</h4>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-3 border-b border-border/50 last:border-0 hover:bg-muted/50 cursor-pointer",
                    !notification.read && "bg-primary/5"
                  )}
                >
                  <div className="flex items-start gap-2">
                    {!notification.read && (
                      <span className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{notification.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-2 border-t border-border">
              <Button variant="ghost" size="sm" className="w-full text-xs">
                View All Notifications
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Settings */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/settings")}
              className={cn(
                "w-10 h-10 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                location.pathname === "/settings" && "bg-sidebar-accent text-primary"
              )}
            >
              <Settings className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            Settings
          </TooltipContent>
        </Tooltip>

        {/* Pin Toggle */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePin}
              className={cn(
                "w-10 h-10 rounded-lg",
                pinned
                  ? "bg-primary/10 text-primary"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              {pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {pinned ? "Unpin contextual panel" : "Pin contextual panel"}
          </TooltipContent>
        </Tooltip>

        {/* User Profile */}
        <DropdownMenu>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-10 h-10 rounded-lg hover:bg-sidebar-accent"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user?.email || 'user'}`} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              Profile
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent side="right" align="end" className="w-56" sideOffset={8}>
            <DropdownMenuLabel className="text-xs">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"}</span>
                  {!isRoleLoading && role && (
                    <Badge 
                      variant={role === "admin" ? "default" : role === "moderator" ? "secondary" : "outline"}
                      className="text-[10px] px-1.5 py-0 h-4 capitalize"
                    >
                      {role}
                    </Badge>
                  )}
                </div>
                <span className="text-muted-foreground font-normal">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-sm cursor-pointer" onClick={() => navigate("/settings")}>
              <User className="h-4 w-4 mr-2" />
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="text-sm cursor-pointer" onClick={() => navigate("/settings?tab=api")}>
              API Keys
            </DropdownMenuItem>
            <DropdownMenuItem className="text-sm cursor-pointer" onClick={() => navigate("/settings?tab=billing")}>
              Billing
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive text-sm cursor-pointer"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
};
