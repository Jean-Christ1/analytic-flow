import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { getProjectById, getModelById, getExperimentById, getDatasetById } from "@/data/platformData";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
  tooltip?: string;
}

const routeLabels: Record<string, { label: string; tooltip?: string }> = {
  "": { label: "Dashboard", tooltip: "Return to main dashboard" },
  "projects": { label: "Projects", tooltip: "View all ML projects" },
  "models": { label: "Model Registry", tooltip: "Manage model versions" },
  "experiments": { label: "Experiments", tooltip: "Track experiments" },
  "deployments": { label: "Deployments", tooltip: "Manage deployments" },
  "workspaces": { label: "Workspaces", tooltip: "Development environments" },
  "data-catalog": { label: "Data Catalog", tooltip: "Browse datasets and lineage" },
  "monitoring": { label: "Monitoring", tooltip: "System and model monitoring" },
  "finops": { label: "FinOps & Carbon", tooltip: "Cost and carbon tracking" },
  "marketplace": { label: "Marketplace", tooltip: "Browse applications" },
  "team": { label: "Team", tooltip: "Manage team members" },
  "settings": { label: "Settings", tooltip: "Platform settings" },
  "compliance": { label: "Compliance", tooltip: "Regulatory compliance" },
  "security": { label: "Security", tooltip: "Security settings" },
  "audit-logs": { label: "Audit Logs", tooltip: "Activity audit trail" },
  "documentation": { label: "Documentation", tooltip: "Platform docs" },
  "compare": { label: "Compare", tooltip: "Model comparison" },
};

export const Breadcrumb = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);

  const getBreadcrumbItems = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [
      { label: "Dashboard", href: "/", tooltip: "Return to main dashboard" },
    ];

    if (pathSegments.length === 0) {
      items[0].current = true;
      return items;
    }

    let currentPath = "";

    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;

      // Check if this is a dynamic segment (ID)
      if (segment.startsWith("proj-")) {
        const project = getProjectById(segment);
        items.push({
          label: project?.name || segment,
          href: isLast ? undefined : currentPath,
          current: isLast,
          tooltip: project ? `Project: ${project.name}` : undefined,
        });
      } else if (segment.startsWith("model-")) {
        const model = getModelById(segment);
        items.push({
          label: model?.name || segment,
          href: isLast ? undefined : currentPath,
          current: isLast,
          tooltip: model ? `Model: ${model.name}` : undefined,
        });
      } else if (segment.startsWith("exp-")) {
        const experiment = getExperimentById(segment);
        items.push({
          label: experiment?.name || segment,
          href: isLast ? undefined : currentPath,
          current: isLast,
          tooltip: experiment ? `Experiment: ${experiment.name}` : undefined,
        });
      } else if (segment.startsWith("dataset-")) {
        const dataset = getDatasetById(segment);
        items.push({
          label: dataset?.name || segment,
          href: isLast ? undefined : currentPath,
          current: isLast,
          tooltip: dataset ? `Dataset: ${dataset.name}` : undefined,
        });
      } else {
        // Regular route segment
        const routeInfo = routeLabels[segment] || { 
          label: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ") 
        };
        items.push({
          label: routeInfo.label,
          href: isLast ? undefined : currentPath,
          current: isLast,
          tooltip: routeInfo.tooltip,
        });
      }
    });

    return items;
  };

  const breadcrumbItems = getBreadcrumbItems();

  // Don't show breadcrumb on dashboard
  if (pathSegments.length === 0) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-1 text-xs mb-4" aria-label="Breadcrumb">
      {breadcrumbItems.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 mx-1 flex-shrink-0" />
          )}
          {item.href && !item.current ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-muted transition-colors",
                    index === 0 ? "text-muted-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {index === 0 && <Home className="h-3 w-3" />}
                  <span className="truncate max-w-[120px]">{item.label}</span>
                </Link>
              </TooltipTrigger>
              {item.tooltip && (
                <TooltipContent side="bottom" className="text-xs">
                  {item.tooltip}
                </TooltipContent>
              )}
            </Tooltip>
          ) : (
            <span
              className={cn(
                "flex items-center gap-1 px-1.5 py-0.5 truncate max-w-[180px]",
                item.current ? "text-foreground font-medium" : "text-muted-foreground"
              )}
            >
              {index === 0 && <Home className="h-3 w-3" />}
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
};