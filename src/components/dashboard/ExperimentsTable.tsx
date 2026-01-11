import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Play, Eye } from "lucide-react";

interface Experiment {
  id: string;
  name: string;
  model: string;
  status: "running" | "completed" | "failed" | "queued";
  accuracy: number;
  duration: string;
  updatedAt: string;
}

const experiments: Experiment[] = [
  {
    id: "exp-001",
    name: "Fed-BERT-v3.2",
    model: "Transformer",
    status: "running",
    accuracy: 0.934,
    duration: "2h 34m",
    updatedAt: "2 min ago"
  },
  {
    id: "exp-002",
    name: "Privacy-CNN-ResNet",
    model: "CNN",
    status: "completed",
    accuracy: 0.921,
    duration: "5h 12m",
    updatedAt: "1 hour ago"
  },
  {
    id: "exp-003",
    name: "Secure-LSTM-Agg",
    model: "RNN",
    status: "completed",
    accuracy: 0.897,
    duration: "3h 45m",
    updatedAt: "3 hours ago"
  },
  {
    id: "exp-004",
    name: "DP-GPT-Fine",
    model: "LLM",
    status: "queued",
    accuracy: 0,
    duration: "--",
    updatedAt: "5 hours ago"
  },
  {
    id: "exp-005",
    name: "Fed-XGBoost-v2",
    model: "Ensemble",
    status: "failed",
    accuracy: 0.845,
    duration: "1h 23m",
    updatedAt: "8 hours ago"
  }
];

const statusConfig = {
  running: { variant: "status" as const, label: "Running", pulse: true },
  completed: { variant: "success" as const, label: "Completed", pulse: false },
  failed: { variant: "destructive" as const, label: "Failed", pulse: false },
  queued: { variant: "secondary" as const, label: "Queued", pulse: false }
};

const ExperimentsTable = () => {
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Recent Experiments</h3>
            <p className="text-sm text-muted-foreground">Track your federated learning runs</p>
          </div>
          <Button variant="glass" size="sm">
            View All
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30">
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">
                Experiment
              </th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">
                Model
              </th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">
                Status
              </th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">
                Accuracy
              </th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">
                Duration
              </th>
              <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {experiments.map((exp) => {
              const status = statusConfig[exp.status];
              return (
                <tr key={exp.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-foreground">{exp.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{exp.id}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-muted-foreground">{exp.model}</span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={status.variant} className={status.pulse ? "animate-pulse-slow" : ""}>
                      {status.label}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm text-foreground">
                      {exp.accuracy > 0 ? `${(exp.accuracy * 100).toFixed(1)}%` : "--"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-muted-foreground">{exp.duration}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExperimentsTable;
