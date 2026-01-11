import { Button } from "@/components/ui/button";
import { Bell, Search, Plus } from "lucide-react";

const Header = () => {
  return (
    <header className="h-16 border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-foreground">Dashboard</h2>
          <span className="text-sm text-muted-foreground">Welcome back, John</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search experiments..."
              className="h-9 w-64 pl-9 pr-4 rounded-lg bg-muted/50 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
            />
          </div>
          
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
          </Button>
          
          <Button variant="glow" size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New Experiment
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
