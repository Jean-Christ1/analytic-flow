import { ReactNode } from "react";
import { Info, LucideIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface FormSectionProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  tooltip?: string;
  children: ReactNode;
  className?: string;
  variant?: "default" | "card" | "compact";
}

export const FormSection = ({
  title,
  description,
  icon: Icon,
  tooltip,
  children,
  className,
  variant = "default",
}: FormSectionProps) => {
  const wrapperStyles = {
    default: "space-y-4",
    card: "p-4 rounded-lg border border-border bg-muted/20 space-y-4",
    compact: "space-y-3",
  };

  return (
    <div className={cn(wrapperStyles[variant], className)}>
      {(title || description) && (
        <div className="flex items-start gap-2">
          {Icon && (
            <div className="p-1.5 rounded-md bg-primary/10 shrink-0 mt-0.5">
              <Icon className="h-4 w-4 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            {title && (
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm">{title}</h4>
                {tooltip && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <p className="text-xs">{tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            )}
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
        </div>
      )}
      {children}
    </div>
  );
};

interface FormFieldProps {
  label: string;
  required?: boolean;
  tooltip?: string;
  error?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export const FormField = ({
  label,
  required,
  tooltip,
  error,
  description,
  children,
  className,
}: FormFieldProps) => {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center gap-1.5">
        <label className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </label>
        {tooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="text-xs">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      {children}
      {description && !error && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
};

interface FormRowProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export const FormRow = ({ children, columns = 2, className }: FormRowProps) => {
  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {children}
    </div>
  );
};

interface SelectableCardProps {
  selected: boolean;
  onClick: () => void;
  icon?: ReactNode;
  title: string;
  description?: string;
  badge?: ReactNode;
  className?: string;
  disabled?: boolean;
}

export const SelectableCard = ({
  selected,
  onClick,
  icon,
  title,
  description,
  badge,
  className,
  disabled,
}: SelectableCardProps) => {
  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={cn(
        "p-3 rounded-lg border cursor-pointer transition-all",
        selected
          ? "border-primary bg-primary/10 ring-1 ring-primary/30"
          : "border-border hover:border-primary/50",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-sm">{title}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {badge}
          {selected && (
            <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-primary-foreground" fill="currentColor" viewBox="0 0 12 12">
                <path d="M10.28 2.28L4 8.56l-2.28-2.28-1.44 1.44L4 11.44l7.72-7.72z"/>
              </svg>
            </div>
          )}
        </div>
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
};
