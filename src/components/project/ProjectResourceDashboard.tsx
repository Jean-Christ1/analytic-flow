import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Cpu,
  MemoryStick,
  HardDrive,
  DollarSign,
  Zap,
  TrendingUp,
  TrendingDown,
  Server,
  Activity,
  Layers,
  Maximize2,
} from "lucide-react";
import {
  AreaChart,
  Area,
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

interface EnvironmentResources {
  name: string;
  cpu: { used: number; total: number };
  gpu: { used: number; total: number };
  memory: { used: number; total: number };
  storage: { used: number; total: number };
  cost: {
    current: number;
    projected: number;
    trend: number;
  };
  status: "healthy" | "warning" | "critical";
}

// Mock data for environments
const environmentData: Record<string, EnvironmentResources> = {
  DEV: {
    name: "Development",
    cpu: { used: 4.2, total: 8 },
    gpu: { used: 1, total: 2 },
    memory: { used: 12.5, total: 32 },
    storage: { used: 45, total: 100 },
    cost: { current: 285.50, projected: 310.00, trend: 8.5 },
    status: "healthy",
  },
  STAGING: {
    name: "Staging",
    cpu: { used: 6.8, total: 16 },
    gpu: { used: 2, total: 4 },
    memory: { used: 28.5, total: 64 },
    storage: { used: 120, total: 250 },
    cost: { current: 520.00, projected: 545.00, trend: 4.8 },
    status: "healthy",
  },
  PROD: {
    name: "Production",
    cpu: { used: 24.5, total: 32 },
    gpu: { used: 6, total: 8 },
    memory: { used: 98.5, total: 128 },
    storage: { used: 380, total: 500 },
    cost: { current: 1850.00, projected: 1920.00, trend: 3.8 },
    status: "warning",
  },
};

// Generate mock history data
const generateHistoryData = (hours: number) =>
  Array.from({ length: hours }, (_, i) => ({
    time: `${i}:00`,
    cpu: 40 + Math.random() * 40,
    memory: 50 + Math.random() * 30,
    gpu: 30 + Math.random() * 50,
  }));

const costBreakdown = [
  { name: "Compute (CPU)", value: 45, color: "hsl(var(--primary))" },
  { name: "GPU Instances", value: 30, color: "hsl(var(--info))" },
  { name: "Storage", value: 15, color: "hsl(var(--warning))" },
  { name: "Network", value: 10, color: "hsl(var(--muted-foreground))" },
];

interface ProjectResourceDashboardProps {
  projectId?: string;
}

export const ProjectResourceDashboard = ({ projectId }: ProjectResourceDashboardProps) => {
  const [costDialogOpen, setCostDialogOpen] = useState(false);
  const [selectedEnvName, setSelectedEnvName] = useState("Production");
  
  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 80) return "destructive";
    if (percentage >= 60) return "warning";
    return "success";
  };

  const getStatusBadge = (status: EnvironmentResources["status"]) => {
    const config = {
      healthy: { variant: "success" as const, label: "Healthy" },
      warning: { variant: "warning" as const, label: "Warning" },
      critical: { variant: "destructive" as const, label: "Critical" },
    };
    return config[status];
  };

  const renderResourceCard = (
    label: string,
    used: number,
    total: number,
    unit: string,
    icon: React.ReactNode,
    iconBgClass: string
  ) => {
    const percentage = (used / total) * 100;
    const variant = getUtilizationColor(percentage);

    return (
      <Card className="glass-card">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2 rounded-lg ${iconBgClass}`}>{icon}</div>
            <Badge variant={variant}>{percentage.toFixed(0)}%</Badge>
          </div>
          <p className="text-2xl font-bold font-display">
            {used}/{total}
          </p>
          <p className="text-xs text-muted-foreground">{label} ({unit})</p>
          <Progress value={percentage} className="h-1.5 mt-2" />
        </CardContent>
      </Card>
    );
  };

  const totalCost = Object.values(environmentData).reduce(
    (sum, env) => sum + env.cost.current,
    0
  );

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <Cpu className="h-5 w-5 text-primary" />
              <Badge variant="outline">Total</Badge>
            </div>
            <p className="text-2xl font-bold font-display">35.5/56</p>
            <p className="text-xs text-muted-foreground">CPU Cores</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <Zap className="h-5 w-5 text-info" />
              <Badge variant="outline">Total</Badge>
            </div>
            <p className="text-2xl font-bold font-display">9/14</p>
            <p className="text-xs text-muted-foreground">GPUs</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <MemoryStick className="h-5 w-5 text-warning" />
              <Badge variant="outline">Total</Badge>
            </div>
            <p className="text-2xl font-bold font-display">139.5/224</p>
            <p className="text-xs text-muted-foreground">Memory (GB)</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <HardDrive className="h-5 w-5 text-muted-foreground" />
              <Badge variant="outline">Total</Badge>
            </div>
            <p className="text-2xl font-bold font-display">545/850</p>
            <p className="text-xs text-muted-foreground">Storage (GB)</p>
          </CardContent>
        </Card>
        <Card className="glass-card bg-gradient-to-br from-gold/10 to-gold/5 border-gold/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-5 w-5 text-gold" />
              <div className="flex items-center gap-1 text-xs">
                <TrendingUp className="h-3 w-3 text-destructive" />
                <span className="text-destructive">+5.2%</span>
              </div>
            </div>
            <p className="text-2xl font-bold font-display text-gold">
              ${totalCost.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">Monthly Cost</p>
          </CardContent>
        </Card>
      </div>

      {/* Environment Tabs */}
      <Tabs defaultValue="PROD" className="space-y-4">
        <TabsList className="bg-muted/50">
          {Object.entries(environmentData).map(([key, env]) => {
            const statusConfig = getStatusBadge(env.status);
            return (
              <TabsTrigger
                key={key}
                value={key}
                className="flex items-center gap-2"
              >
                <Layers className="h-4 w-4" />
                {key}
                <Badge variant={statusConfig.variant} className="text-xs ml-1">
                  {statusConfig.label}
                </Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {Object.entries(environmentData).map(([key, env]) => (
          <TabsContent key={key} value={key} className="space-y-4">
            {/* Resource Cards */}
            <div className="grid grid-cols-4 gap-4">
              {renderResourceCard(
                "CPU",
                env.cpu.used,
                env.cpu.total,
                "cores",
                <Cpu className="h-5 w-5 text-primary" />,
                "bg-primary/10"
              )}
              {renderResourceCard(
                "GPU",
                env.gpu.used,
                env.gpu.total,
                "units",
                <Zap className="h-5 w-5 text-info" />,
                "bg-info/10"
              )}
              {renderResourceCard(
                "Memory",
                env.memory.used,
                env.memory.total,
                "GB",
                <MemoryStick className="h-5 w-5 text-warning" />,
                "bg-warning/10"
              )}
              {renderResourceCard(
                "Storage",
                env.storage.used,
                env.storage.total,
                "GB",
                <HardDrive className="h-5 w-5 text-muted-foreground" />,
                "bg-muted/30"
              )}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Resource Utilization Chart */}
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    Resource Utilization (24h) - {env.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={generateHistoryData(24)}>
                        <defs>
                          <linearGradient id={`cpuGrad-${key}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id={`memGrad-${key}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--warning))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id={`gpuGrad-${key}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--info))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--info))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={10} interval={3} />
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
                        <Area type="monotone" dataKey="cpu" stroke="hsl(var(--primary))" fill={`url(#cpuGrad-${key})`} name="CPU" />
                        <Area type="monotone" dataKey="memory" stroke="hsl(var(--warning))" fill={`url(#memGrad-${key})`} name="Memory" />
                        <Area type="monotone" dataKey="gpu" stroke="hsl(var(--info))" fill={`url(#gpuGrad-${key})`} name="GPU" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Cost Breakdown */}
              <Card 
                className="glass-card cursor-pointer hover:border-gold/40 transition-colors group"
                onClick={() => {
                  setSelectedEnvName(env.name);
                  setCostDialogOpen(true);
                }}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gold" />
                      Cost Breakdown - {env.name}
                    </span>
                    <Maximize2 className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex items-center gap-6">
                    {/* Pie Chart - Left Side */}
                    <div className="w-[180px] h-[200px] flex-shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={costBreakdown}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
                              const RADIAN = Math.PI / 180;
                              const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                              const x = cx + radius * Math.cos(-midAngle * RADIAN);
                              const y = cy + radius * Math.sin(-midAngle * RADIAN);
                              return (
                                <text
                                  x={x}
                                  y={y}
                                  fill="white"
                                  textAnchor="middle"
                                  dominantBaseline="central"
                                  fontSize={10}
                                  fontWeight="bold"
                                >
                                  {`${value}%`}
                                </text>
                              );
                            }}
                            labelLine={false}
                          >
                            {costBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                            formatter={(value: number) => [`${value}%`, "Share"]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Vertical Legend - Right Side */}
                    <div className="flex flex-col gap-3">
                      {costBreakdown.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-sm flex-shrink-0" 
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="text-xs text-foreground whitespace-nowrap">{entry.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Cost Summary */}
            <Card className="glass-card border-gold/20 bg-gold/5">
              <CardContent className="py-4">
                <div className="grid grid-cols-4 gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      Current Month
                    </p>
                    <p className="text-2xl font-bold font-display text-gold mt-1">
                      ${env.cost.current.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      Projected
                    </p>
                    <p className="text-2xl font-bold font-display mt-1">
                      ${env.cost.projected.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      Trend
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {env.cost.trend > 0 ? (
                        <TrendingUp className="h-5 w-5 text-destructive" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-success" />
                      )}
                      <span
                        className={`text-2xl font-bold font-display ${
                          env.cost.trend > 0 ? "text-destructive" : "text-success"
                        }`}
                      >
                        {env.cost.trend > 0 ? "+" : ""}
                        {env.cost.trend}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      Budget Status
                    </p>
                    <Badge
                      variant={env.cost.trend > 10 ? "destructive" : "success"}
                      className="mt-2"
                    >
                      {env.cost.trend > 10 ? "Over Budget" : "Within Budget"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Cost Breakdown Dialog */}
      <Dialog open={costDialogOpen} onOpenChange={setCostDialogOpen}>
        <DialogContent className="max-w-[90vw] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-gold" />
              Cost Breakdown - {selectedEnvName}
            </DialogTitle>
          </DialogHeader>
          <div className="h-[70vh] flex items-center">
            <div className="flex-1 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={costBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={140}
                    outerRadius={220}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      return (
                        <text
                          x={x}
                          y={y}
                          fill="white"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={18}
                          fontWeight="bold"
                        >
                          {`${value}%`}
                        </text>
                      );
                    }}
                    labelLine={false}
                  >
                    {costBreakdown.map((entry, index) => (
                      <Cell key={`cell-dialog-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                    formatter={(value: number) => [`${value}%`, "Share"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Custom Vertical Legend */}
            <div className="flex flex-col gap-4 pl-8 min-w-[180px]">
              {costBreakdown.map((entry, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div 
                    className="w-5 h-5 rounded-sm flex-shrink-0" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <div>
                    <span className="text-sm font-medium">{entry.name}</span>
                    <span className="text-sm text-muted-foreground ml-2">{entry.value}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
