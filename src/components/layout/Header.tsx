import { useState } from "react";
import { Bell, Search, Plus, ChevronDown, Coins, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  NewExperimentDialog,
  DeployModelDialog,
  LaunchWorkspaceDialog,
} from "@/components/dialogs";
import { CreateProjectWizard } from "@/components/dialogs/CreateProjectWizard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const Header = () => {
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const { currency, getSymbol } = useCurrency();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Successfully signed out");
    navigate("/auth");
  };

  // Get user initials from email or metadata
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

  const getUserName = () => {
    return user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  };

  return (
    <>
      <header className="sticky top-0 z-40 h-14 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="flex items-center justify-between h-full px-5">
          {/* Search */}
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search projects, models, experiments..."
              className="pl-10 h-9 bg-muted/50 border-border/50 focus:bg-card focus:border-primary/50 transition-all duration-200 text-sm"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Quick create */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="premium" size="sm" className="gap-1.5 h-8 text-xs">
                  <Plus className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Create</span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-xs">Quick Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setOpenDialog("project")} className="text-sm">New Project</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setOpenDialog("experiment")} className="text-sm">New Experiment</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setOpenDialog("workspace")} className="text-sm">New Workspace</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setOpenDialog("deploy")} className="text-sm">Deploy Model</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Currency indicator */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-2 gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => navigate("/settings?tab=preferences")}
                >
                  <Coins className="h-3.5 w-3.5" />
                  <span>{currency}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Currency: {getSymbol()} ({currency})</p>
                <p className="text-xs text-muted-foreground">Click to change</p>
              </TooltipContent>
            </Tooltip>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-lg border border-border/50 bg-card/50 hover:bg-accent hover:border-primary/30 transition-all duration-300">
              <Bell className="h-3.5 w-3.5" />
              <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground flex items-center justify-center">
                3
              </span>
            </Button>

            {/* Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 pl-2 h-8">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user?.email || 'user'}`} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:flex flex-col items-start">
                    <span className="text-xs font-medium">{getUserName()}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {user?.email?.split("@")[1] || "Enterprise"}
                    </span>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="text-xs">
                  <div className="flex flex-col gap-1">
                    <span>{getUserName()}</span>
                    <span className="text-muted-foreground font-normal">{user?.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-sm" onClick={() => navigate("/settings")}>Profile Settings</DropdownMenuItem>
                <DropdownMenuItem className="text-sm" onClick={() => navigate("/settings?tab=api")}>API Keys</DropdownMenuItem>
                <DropdownMenuItem className="text-sm" onClick={() => navigate("/settings?tab=billing")}>Billing</DropdownMenuItem>
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
        </div>
      </header>

      {/* Dialogs */}
      <CreateProjectWizard open={openDialog === "project"} onOpenChange={(open) => !open && setOpenDialog(null)} />
      <NewExperimentDialog open={openDialog === "experiment"} onOpenChange={(open) => !open && setOpenDialog(null)} />
      <LaunchWorkspaceDialog open={openDialog === "workspace"} onOpenChange={(open) => !open && setOpenDialog(null)} />
      <DeployModelDialog open={openDialog === "deploy"} onOpenChange={(open) => !open && setOpenDialog(null)} />
    </>
  );
};
