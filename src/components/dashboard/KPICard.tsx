import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface KPICardProps {
  title: string;
  value: string;
  change?: {
    value: string;
    trend: "up" | "down" | "neutral";
  };
  icon: LucideIcon;
  iconColor?: string;
  className?: string;
  tooltip?: string;
}

export const KPICard = ({
  title,
  value,
  change,
  icon: Icon,
  iconColor = "text-primary",
  className,
  tooltip,
}: KPICardProps) => {
  return (
    <div
      className={cn(
        "glass-card rounded-xl p-5 hover-lift group cursor-default transition-all duration-300",
        "hover:shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.25)]",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
              {title}
            </p>
            {tooltip && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground/60 cursor-help shrink-0" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <p className="text-2xl font-display font-bold text-foreground truncate">{value}</p>
          {change && (
            <div className="flex items-center gap-1.5">
              <div
                className={cn(
                  "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium",
                  change.trend === "up"
                    ? "bg-success/10 text-success"
                    : change.trend === "down"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {change.trend === "up" ? (
                  <TrendingUp className="h-3 w-3" />
                ) : change.trend === "down" ? (
                  <TrendingDown className="h-3 w-3" />
                ) : null}
                <span>{change.value}</span>
              </div>
              <span className="text-xs text-muted-foreground">vs last month</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "p-2.5 rounded-lg bg-gradient-to-br from-muted/80 to-muted/40 group-hover:scale-110 transition-transform duration-300 shrink-0 ml-3",
            iconColor
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};
