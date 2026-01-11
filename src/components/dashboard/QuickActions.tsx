import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Plus,
  Play,
  Upload,
  Rocket,
  Code2,
  GitBranch,
  ArrowRight,
} from "lucide-react";
import {
  RunExperimentDialog,
  UploadModelDialog,
  DeployModelDialog,
  LaunchWorkspaceDialog,
  CreatePipelineDialog,
} from "@/components/dialogs";
import { CreateProjectWizard } from "@/components/dialogs/CreateProjectWizard";

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const quickActions: QuickAction[] = [
  {
    id: "new-project",
    label: "New Project",
    description: "Create a new ML project",
    icon: Plus,
    color: "text-primary",
    bgColor: "bg-primary/10 group-hover:bg-primary/20",
  },
  {
    id: "run-experiment",
    label: "Run Experiment",
    description: "Start a new training run",
    icon: Play,
    color: "text-success",
    bgColor: "bg-success/10 group-hover:bg-success/20",
  },
  {
    id: "upload-model",
    label: "Upload Model",
    description: "Register a new model",
    icon: Upload,
    color: "text-info",
    bgColor: "bg-info/10 group-hover:bg-info/20",
  },
  {
    id: "deploy",
    label: "Deploy Model",
    description: "Create new endpoint",
    icon: Rocket,
    color: "text-warning",
    bgColor: "bg-warning/10 group-hover:bg-warning/20",
  },
  {
    id: "workspace",
    label: "Launch IDE",
    description: "Open Jupyter/VS Code",
    icon: Code2,
    color: "text-muted-foreground",
    bgColor: "bg-muted group-hover:bg-muted/80",
  },
  {
    id: "pipeline",
    label: "Create Pipeline",
    description: "Build workflow DAG",
    icon: GitBranch,
    color: "text-primary",
    bgColor: "bg-primary/10 group-hover:bg-primary/20",
  },
];

export const QuickActions = () => {
  const [openDialog, setOpenDialog] = useState<string | null>(null);

  const handleActionClick = (actionId: string) => {
    setOpenDialog(actionId);
  };

  return (
    <>
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-semibold text-lg text-foreground">
            Quick Actions
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => handleActionClick(action.id)}
                className={cn(
                  "group flex flex-col items-center p-4 rounded-xl transition-all duration-200",
                  "hover:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20",
                  "animate-fade-in"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div
                  className={cn(
                    "p-3 rounded-xl mb-3 transition-colors duration-200",
                    action.bgColor
                  )}
                >
                  <Icon className={cn("h-5 w-5", action.color)} />
                </div>
                <span className="text-sm font-medium text-foreground text-center">
                  {action.label}
                </span>
                <span className="text-xs text-muted-foreground text-center mt-0.5">
                  {action.description}
                </span>
              </button>
            );
          })}
        </div>

        <button className="w-full mt-4 py-2.5 flex items-center justify-center gap-2 text-sm text-primary font-medium hover:text-primary/80 transition-colors group">
          View all actions
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Dialogs */}
      <CreateProjectWizard open={openDialog === "new-project"} onOpenChange={(open) => !open && setOpenDialog(null)} />
      <RunExperimentDialog open={openDialog === "run-experiment"} onOpenChange={(open) => !open && setOpenDialog(null)} />
      <UploadModelDialog open={openDialog === "upload-model"} onOpenChange={(open) => !open && setOpenDialog(null)} />
      <DeployModelDialog open={openDialog === "deploy"} onOpenChange={(open) => !open && setOpenDialog(null)} />
      <LaunchWorkspaceDialog open={openDialog === "workspace"} onOpenChange={(open) => !open && setOpenDialog(null)} />
      <CreatePipelineDialog open={openDialog === "pipeline"} onOpenChange={(open) => !open && setOpenDialog(null)} />
    </>
  );
};
