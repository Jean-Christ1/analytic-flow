import { cn } from "@/lib/utils";
import { Rocket, TrendingUp, Clock, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Deployment {
  id: string;
  name: string;
  version: string;
  status: "live" | "canary" | "staging";
  requests: string;
  latency: string;
  successRate: number;
  traffic: number;
}

const deployments: Deployment[] = [
  {
    id: "1",
    name: "fraud-detection",
    version: "v2.3.1",
    status: "live",
    requests: "12.4K/min",
    latency: "23ms",
    successRate: 99.8,
    traffic: 100,
  },
  {
    id: "2",
    name: "recommendation-engine",
    version: "v4.0.0",
    status: "canary",
    requests: "8.2K/min",
    latency: "45ms",
    successRate: 99.2,
    traffic: 25,
  },
  {
    id: "3",
    name: "nlp-classifier",
    version: "v1.8.2",
    status: "live",
    requests: "5.1K/min",
    latency: "67ms",
    successRate: 98.9,
    traffic: 100,
  },
];

const statusStyles = {
  live: "bg-success/20 text-success border-success/30",
  canary: "bg-warning/20 text-warning border-warning/30",
  staging: "bg-info/20 text-info border-info/30",
};

export const DeploymentsOverview = () => {
  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-success/10">
            <Rocket className="h-5 w-5 text-success" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-lg text-foreground">
              Live Deployments
            </h3>
            <p className="text-sm text-muted-foreground">
              3 models serving traffic
            </p>
          </div>
        </div>
        <button className="text-sm text-primary hover:text-primary/80 font-medium transition-colors">
          Manage
        </button>
      </div>

      <div className="space-y-4">
        {deployments.map((deployment, index) => (
          <div
            key={deployment.id}
            className={cn(
              "p-4 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer",
              "animate-fade-in"
            )}
            style={{ animationDelay: `${index * 75}ms` }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-foreground">
                  {deployment.name}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {deployment.version}
                </span>
                <span
                  className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full border capitalize",
                    statusStyles[deployment.status]
                  )}
                >
                  {deployment.status}
                </span>
              </div>
              <span className="text-sm font-semibold text-success">
                {deployment.successRate}%
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-3">
              <div className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Requests</p>
                  <p className="text-sm font-medium text-foreground">
                    {deployment.requests}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-info" />
                <div>
                  <p className="text-xs text-muted-foreground">Latency</p>
                  <p className="text-sm font-medium text-foreground">
                    {deployment.latency}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5 text-success" />
                <div>
                  <p className="text-xs text-muted-foreground">Traffic</p>
                  <p className="text-sm font-medium text-foreground">
                    {deployment.traffic}%
                  </p>
                </div>
              </div>
            </div>

            {deployment.status === "canary" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Canary rollout</span>
                  <span className="text-warning font-medium">{deployment.traffic}%</span>
                </div>
                <Progress value={deployment.traffic} className="h-1" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
