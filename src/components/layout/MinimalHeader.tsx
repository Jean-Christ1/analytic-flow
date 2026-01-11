import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Button } from "@/components/ui/button";
import { Coins } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const MinimalHeader = () => {
  const { currency, getSymbol } = useCurrency();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 h-12 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="flex items-center justify-between h-full px-5">
        {/* Search */}
        <div className="relative w-full max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search projects, models, experiments..."
            className="pl-10 h-8 bg-muted/50 border-border/50 focus:bg-card focus:border-primary/50 transition-all duration-200 text-sm"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>

        {/* Minimal Actions */}
        <div className="flex items-center gap-2">
          {/* Currency indicator */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 px-2 gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
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
        </div>
      </div>
    </header>
  );
};
