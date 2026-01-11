import { cn } from "@/lib/utils";
import { Server, Database, Cpu, HardDrive, Wifi, Shield } from "lucide-react";

interface SystemMetric {
  id: string;
  name: string;
  status: "healthy" | "warning" | "critical";
  value: string;
  icon: React.ElementType;
}

const metrics: SystemMetric[] = [
  { id: "api", name: "API Gateway", status: "healthy", value: "99.99%", icon: Server },
  { id: "db", name: "Database", status: "healthy", value: "12ms", icon: Database },
  { id: "gpu", name: "GPU Cluster", status: "warning", value: "78%", icon: Cpu },
  { id: "storage", name: "Storage", status: "healthy", value: "4.2TB", icon: HardDrive },
  { id: "network", name: "Network", status: "healthy", value: "1.2Gbps", icon: Wifi },
  { id: "security", name: "Security", status: "healthy", value: "Protected", icon: Shield },
];

const statusColors = {
  healthy: "status-online",
  warning: "status-warning",
  critical: "status-error",
};

export const SystemStatus = () => {
  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display font-semibold text-lg text-foreground">
          System Status
        </h3>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full status-online animate-pulse-dot" />
          <span className="text-xs text-success font-medium">All Systems Operational</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.id}
              className={cn(
                "p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-default",
                "animate-fade-in"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <div className={cn("w-2 h-2 rounded-full", statusColors[metric.status])} />
              </div>
              <p className="text-xs text-muted-foreground">{metric.name}</p>
              <p className="text-sm font-semibold text-foreground">{metric.value}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
