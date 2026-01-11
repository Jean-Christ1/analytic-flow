import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Cpu,
  MemoryStick,
  HardDrive,
  DollarSign,
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Server,
  Zap,
  BarChart3,
} from "lucide-react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// Aggregated resource data from all installed applications
const resourceSummary = {
  totalCpu: { used: 8.5, total: 16, unit: "cores" },
  totalMemory: { used: 24.5, total: 64, unit: "GB" },
  totalStorage: { used: 156, total: 500, unit: "GB" },
  totalGpu: { used: 2, total: 4, unit: "GPUs" },
  
  // Cost estimates
  monthlyCost: 1245.50,
  projectedCost: 1380.00,
  costTrend: 8.5, // percentage increase
  
  // Performance
  avgCpuUtilization: 53,
  avgMemoryUtilization: 38,
  avgStorageUtilization: 31,
};

const applicationResources = [
  { name: "MLflow", cpu: 1.0, memory: 2.0, storage: 5, status: "running", cost: 85.50 },
  { name: "Prometheus", cpu: 0.5, memory: 2.0, storage: 20, status: "running", cost: 45.00 },
  { name: "Grafana", cpu: 0.5, memory: 1.0, storage: 5, status: "running", cost: 35.00 },
  { name: "DataHub", cpu: 2.0, memory: 4.0, storage: 10, status: "running", cost: 125.00 },
  { name: "Vault", cpu: 0.5, memory: 1.0, storage: 2, status: "running", cost: 28.00 },
  { name: "Trivy", cpu: 0.3, memory: 0.5, storage: 1, status: "running", cost: 15.00 },
  { name: "Feast", cpu: 0.5, memory: 1.0, storage: 2, status: "installed", cost: 32.00 },
  { name: "Loki", cpu: 0.5, memory: 1.0, storage: 50, status: "running", cost: 65.00 },
  { name: "OpenTelemetry", cpu: 0.2, memory: 0.25, storage: 0.05, status: "installed", cost: 12.00 },
  { name: "dbt Core", cpu: 0.2, memory: 0.5, storage: 0.1, status: "installed", cost: 8.00 },
  { name: "OPA", cpu: 0.2, memory: 0.25, storage: 0.1, status: "installed", cost: 10.00 },
  { name: "Iceberg", cpu: 0.5, memory: 1.0, storage: 0.05, status: "installed", cost: 18.00 },
  { name: "Gitleaks", cpu: 0.1, memory: 0.125, storage: 0.05, status: "installed", cost: 5.00 },
];

const resourceHistory = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  cpu: 40 + Math.random() * 30,
  memory: 30 + Math.random() * 20,
  storage: 28 + Math.random() * 8,
}));

const costHistory = Array.from({ length: 30 }, (_, i) => ({
  day: `Day ${i + 1}`,
  cost: 35 + Math.random() * 15,
  projected: 40 + Math.random() * 10,
}));

const categoryBreakdown = [
  { name: "MLOps", value: 242.5, color: "hsl(var(--primary))" },
  { name: "Observability", value: 145.0, color: "hsl(var(--success))" },
  { name: "Data Engineering", value: 143.0, color: "hsl(var(--info))" },
  { name: "Security", value: 58.0, color: "hsl(var(--warning))" },
  { name: "Other", value: 25.0, color: "hsl(var(--muted-foreground))" },
];

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--success))",
  "hsl(var(--info))",
  "hsl(var(--warning))",
  "hsl(var(--gold))",
];

export const ResourceDashboard = () => {
  const getUtilizationColor = (value: number) => {
    if (value >= 80) return "text-destructive";
    if (value >= 60) return "text-warning";
    return "text-success";
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Cpu className="h-5 w-5 text-primary" />
              </div>
              <Badge variant={resourceSummary.avgCpuUtilization >= 60 ? "warning" : "success"}>
                {resourceSummary.avgCpuUtilization}%
              </Badge>
            </div>
            <p className="text-2xl font-bold font-display">
              {resourceSummary.totalCpu.used}/{resourceSummary.totalCpu.total}
            </p>
            <p className="text-xs text-muted-foreground">CPU Cores</p>
            <Progress value={(resourceSummary.totalCpu.used / resourceSummary.totalCpu.total) * 100} className="h-1 mt-2" />
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-info/10">
                <MemoryStick className="h-5 w-5 text-info" />
              </div>
              <Badge variant={resourceSummary.avgMemoryUtilization >= 60 ? "warning" : "success"}>
                {resourceSummary.avgMemoryUtilization}%
              </Badge>
            </div>
            <p className="text-2xl font-bold font-display">
              {resourceSummary.totalMemory.used}/{resourceSummary.totalMemory.total}
            </p>
            <p className="text-xs text-muted-foreground">Memory (GB)</p>
            <Progress value={(resourceSummary.totalMemory.used / resourceSummary.totalMemory.total) * 100} className="h-1 mt-2" />
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <HardDrive className="h-5 w-5 text-warning" />
              </div>
              <Badge variant={resourceSummary.avgStorageUtilization >= 60 ? "warning" : "success"}>
                {resourceSummary.avgStorageUtilization}%
              </Badge>
            </div>
            <p className="text-2xl font-bold font-display">
              {resourceSummary.totalStorage.used}/{resourceSummary.totalStorage.total}
            </p>
            <p className="text-xs text-muted-foreground">Storage (GB)</p>
            <Progress value={(resourceSummary.totalStorage.used / resourceSummary.totalStorage.total) * 100} className="h-1 mt-2" />
          </CardContent>
        </Card>

        <Card className="glass-card bg-gradient-to-br from-gold/10 to-gold/5 border-gold/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-gold/20">
                <DollarSign className="h-5 w-5 text-gold" />
              </div>
              <div className="flex items-center gap-1 text-xs">
                {resourceSummary.costTrend > 0 ? (
                  <>
                    <TrendingUp className="h-3 w-3 text-destructive" />
                    <span className="text-destructive">+{resourceSummary.costTrend}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-3 w-3 text-success" />
                    <span className="text-success">{resourceSummary.costTrend}%</span>
                  </>
                )}
              </div>
            </div>
            <p className="text-2xl font-bold font-display text-gold">
              ${resourceSummary.monthlyCost.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">Monthly Cost</p>
            <p className="text-xs text-muted-foreground mt-1">
              Projected: ${resourceSummary.projectedCost.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Resource Utilization Over Time */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Resource Utilization (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={resourceHistory}>
                  <defs>
                    <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--info))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--info))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={10} interval={3} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value.toFixed(1)}%`, ""]}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="cpu" stroke="hsl(var(--primary))" fill="url(#cpuGrad)" name="CPU" />
                  <Area type="monotone" dataKey="memory" stroke="hsl(var(--info))" fill="url(#memGrad)" name="Memory" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Cost by Category */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-gold" />
              Cost by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, "Cost"]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cost Trend */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gold" />
            Daily Cost Trend (30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={costHistory}>
                <defs>
                  <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--gold))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--gold))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={10} interval={4} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, ""]}
                />
                <Area type="monotone" dataKey="cost" stroke="hsl(var(--gold))" fill="url(#costGrad)" name="Actual Cost" />
                <Line type="monotone" dataKey="projected" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" name="Projected" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Application Resources Table */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Server className="h-4 w-4 text-primary" />
              Application Resource Usage
            </CardTitle>
            <Badge variant="outline">{applicationResources.length} Applications</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Application</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Status</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">CPU</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">Memory</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">Storage</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">Est. Cost</th>
                </tr>
              </thead>
              <tbody>
                {applicationResources.map((app, i) => (
                  <tr key={i} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-2 font-medium">{app.name}</td>
                    <td className="py-3 px-2">
                      <Badge variant={app.status === "running" ? "success" : "secondary"} className="text-xs">
                        {app.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-xs">{app.cpu} cores</td>
                    <td className="py-3 px-2 text-right font-mono text-xs">{app.memory} GB</td>
                    <td className="py-3 px-2 text-right font-mono text-xs">{app.storage} GB</td>
                    <td className="py-3 px-2 text-right font-mono text-xs text-gold">${app.cost.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/30 font-semibold">
                  <td className="py-3 px-2">Total</td>
                  <td className="py-3 px-2"></td>
                  <td className="py-3 px-2 text-right font-mono text-xs">{resourceSummary.totalCpu.used} cores</td>
                  <td className="py-3 px-2 text-right font-mono text-xs">{resourceSummary.totalMemory.used} GB</td>
                  <td className="py-3 px-2 text-right font-mono text-xs">{resourceSummary.totalStorage.used} GB</td>
                  <td className="py-3 px-2 text-right font-mono text-xs text-gold">${resourceSummary.monthlyCost.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="glass-card border-warning/30 bg-warning/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Zap className="h-4 w-4 text-warning" />
            Cost Optimization Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-background/50 border border-border/30">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span className="font-medium text-sm">Underutilized Resources</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                OpenTelemetry and Gitleaks are using minimal resources. Consider scaling down.
              </p>
              <p className="text-sm font-semibold text-success">Potential savings: $12/mo</p>
            </div>
            <div className="p-4 rounded-lg bg-background/50 border border-border/30">
              <div className="flex items-center gap-2 mb-2">
                <HardDrive className="h-4 w-4 text-info" />
                <span className="font-medium text-sm">Storage Optimization</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                Loki storage can be optimized with better retention policies.
              </p>
              <p className="text-sm font-semibold text-success">Potential savings: $25/mo</p>
            </div>
            <div className="p-4 rounded-lg bg-background/50 border border-border/30">
              <div className="flex items-center gap-2 mb-2">
                <Server className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Reserved Instances</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                Consider reserved instances for Prometheus and Grafana.
              </p>
              <p className="text-sm font-semibold text-success">Potential savings: $45/mo</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResourceDashboard;
