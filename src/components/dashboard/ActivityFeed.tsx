import { cn } from "@/lib/utils";
import {
  FlaskConical,
  Rocket,
  Box,
  CheckCircle2,
  AlertTriangle,
  Code2,
} from "lucide-react";

interface ActivityItem {
  id: string;
  type: "experiment" | "deployment" | "model" | "workspace" | "alert";
  title: string;
  description: string;
  time: string;
  user: string;
  status?: "success" | "warning" | "error";
}

const activities: ActivityItem[] = [
  {
    id: "1",
    type: "deployment",
    title: "fraud-detection-v2.3",
    description: "Deployed to production with canary rollout",
    time: "2 minutes ago",
    user: "Sarah Chen",
    status: "success",
  },
  {
    id: "2",
    type: "experiment",
    title: "LLM Fine-tuning Run #847",
    description: "Completed with 94.7% accuracy",
    time: "15 minutes ago",
    user: "James Wilson",
    status: "success",
  },
  {
    id: "3",
    type: "alert",
    title: "Model Drift Detected",
    description: "credit-scoring-model showing 12% drift",
    time: "1 hour ago",
    user: "System",
    status: "warning",
  },
  {
    id: "4",
    type: "model",
    title: "recommendation-engine-v4",
    description: "Registered new model version",
    time: "2 hours ago",
    user: "Alex Morgan",
  },
  {
    id: "5",
    type: "workspace",
    title: "gpu-notebook-prod",
    description: "Started Jupyter workspace with A100 GPU",
    time: "3 hours ago",
    user: "Maria Garcia",
  },
];

const getIcon = (type: ActivityItem["type"]) => {
  switch (type) {
    case "experiment":
      return FlaskConical;
    case "deployment":
      return Rocket;
    case "model":
      return Box;
    case "workspace":
      return Code2;
    case "alert":
      return AlertTriangle;
    default:
      return CheckCircle2;
  }
};

const getIconColor = (type: ActivityItem["type"], status?: ActivityItem["status"]) => {
  if (status === "warning") return "text-warning bg-warning/10";
  if (status === "error") return "text-destructive bg-destructive/10";
  if (status === "success") return "text-success bg-success/10";

  switch (type) {
    case "experiment":
      return "text-info bg-info/10";
    case "deployment":
      return "text-success bg-success/10";
    case "model":
      return "text-primary bg-primary/10";
    case "workspace":
      return "text-muted-foreground bg-muted";
    default:
      return "text-muted-foreground bg-muted";
  }
};

export const ActivityFeed = () => {
  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display font-semibold text-lg text-foreground">
          Recent Activity
        </h3>
        <button className="text-sm text-primary hover:text-primary/80 font-medium transition-colors">
          View all
        </button>
      </div>

      <div className="space-y-4">
        {activities.map((activity, index) => {
          const Icon = getIcon(activity.type);
          const iconColor = getIconColor(activity.type, activity.status);

          return (
            <div
              key={activity.id}
              className={cn(
                "flex items-start gap-4 p-3 rounded-lg transition-colors duration-200 hover:bg-muted/30 cursor-pointer",
                "animate-fade-in"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={cn("p-2 rounded-lg flex-shrink-0", iconColor)}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm text-foreground truncate">
                    {activity.title}
                  </p>
                  {activity.status === "success" && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-success flex-shrink-0" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {activity.description}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground/60">
                    {activity.user}
                  </span>
                  <span className="text-xs text-muted-foreground/40">•</span>
                  <span className="text-xs text-muted-foreground/60">
                    {activity.time}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
