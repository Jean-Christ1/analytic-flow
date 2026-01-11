import { cn } from "@/lib/utils";
import { FolderKanban, Users, GitBranch, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";

interface Project {
  id: string;
  name: string;
  description: string;
  team: string;
  models: number;
  experiments: number;
  deployments: number;
  progress: number;
  status: "active" | "paused" | "completed";
  lastUpdated: string;
}

const projects: Project[] = [
  {
    id: "1",
    name: "Fraud Detection System",
    description: "Real-time transaction fraud detection using ensemble ML models",
    team: "Risk Analytics",
    models: 8,
    experiments: 47,
    deployments: 3,
    progress: 78,
    status: "active",
    lastUpdated: "2 hours ago",
  },
  {
    id: "2",
    name: "Customer Churn Prediction",
    description: "Predictive modeling for customer retention strategies",
    team: "Growth Team",
    models: 5,
    experiments: 23,
    deployments: 1,
    progress: 92,
    status: "active",
    lastUpdated: "5 hours ago",
  },
  {
    id: "3",
    name: "NLP Document Processing",
    description: "Automated document classification and entity extraction",
    team: "AI Research",
    models: 12,
    experiments: 89,
    deployments: 4,
    progress: 65,
    status: "active",
    lastUpdated: "1 day ago",
  },
  {
    id: "4",
    name: "Recommendation Engine",
    description: "Personalized product recommendations using collaborative filtering",
    team: "Product Team",
    models: 6,
    experiments: 34,
    deployments: 2,
    progress: 100,
    status: "completed",
    lastUpdated: "3 days ago",
  },
];

const statusStyles = {
  active: "bg-success/20 text-success",
  paused: "bg-warning/20 text-warning",
  completed: "bg-primary/20 text-primary",
};

export const ProjectsGrid = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-semibold text-lg text-foreground">
            Active Projects
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage your ML projects and workflows
          </p>
        </div>
        <Button variant="outline-gold" size="sm">
          View All Projects
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {projects.map((project, index) => (
          <div
            key={project.id}
            className={cn(
              "glass-card rounded-xl p-5 hover-lift group cursor-pointer",
              "animate-fade-in"
            )}
            style={{ animationDelay: `${index * 75}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <FolderKanban className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {project.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {project.team}
                    </span>
                  </div>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Open Project</DropdownMenuItem>
                  <DropdownMenuItem>View Experiments</DropdownMenuItem>
                  <DropdownMenuItem>Deploy Model</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {project.description}
            </p>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-xs text-muted-foreground">
                  {project.models} models
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <GitBranch className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {project.experiments} experiments
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium text-foreground">{project.progress}%</span>
              </div>
              <Progress value={project.progress} className="h-1.5" />
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
              <span
                className={cn(
                  "text-xs font-medium px-2 py-1 rounded-full capitalize",
                  statusStyles[project.status]
                )}
              >
                {project.status}
              </span>
              <span className="text-xs text-muted-foreground">
                Updated {project.lastUpdated}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
