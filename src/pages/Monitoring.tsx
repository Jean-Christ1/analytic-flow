import { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle,
  Cpu,
  Plus,
  TrendingUp,
  Zap,
  XCircle,
  Clock,
  Server,
  Eye,
  Box,
  Terminal,
  Network,
  Info,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { projects, models, getModelsByProject } from "@/data/platformData";

const modelMetrics = Array.from({ length: 12 }, (_, i) => ({
  hour: `${i * 2}:00`,
  accuracy: 90 + Math.random() * 5,
  latency: 20 + Math.random() * 15,
  throughput: 1000 + Math.random() * 500,
}));

const clusterMetrics = Array.from({ length: 12 }, (_, i) => ({
  hour: `${i * 2}:00`,
  cpu: 40 + Math.random() * 30,
  memory: 50 + Math.random() * 25,
  gpu: 60 + Math.random() * 30,
}));

const driftMetrics = Array.from({ length: 12 }, (_, i) => ({
  hour: `${i * 2}:00`,
  psi: 0.05 + Math.random() * 0.15,
  ks: 0.03 + Math.random() * 0.1,
}));

const alerts = [
  { id: 1, severity: "critical", message: "Model fraud-detector latency exceeded 100ms", time: "2 min ago", status: "firing", model: "fraud-detector" },
  { id: 2, severity: "warning", message: "GPU cluster utilization above 85%", time: "15 min ago", status: "firing", model: "cv-classifier" },
  { id: 3, severity: "info", message: "Scheduled maintenance in 2 hours", time: "1h ago", status: "pending", model: "system" },
  { id: 4, severity: "warning", message: "Data drift detected in sentiment-analyzer", time: "2h ago", status: "resolved", model: "sentiment-analyzer" },
  { id: 5, severity: "critical", message: "High error rate on recommendation-engine", time: "5 min ago", status: "firing", model: "recommendation-engine" },
  { id: 6, severity: "warning", message: "Memory pressure on training cluster", time: "30 min ago", status: "firing", model: "training-cluster" },
];

const dataQualityMetrics = [
  { metric: "Completeness", value: 98.5, threshold: 95, status: "healthy" },
  { metric: "Accuracy", value: 96.2, threshold: 90, status: "healthy" },
  { metric: "Consistency", value: 94.8, threshold: 92, status: "healthy" },
  { metric: "Timeliness", value: 88.3, threshold: 85, status: "warning" },
  { metric: "Validity", value: 99.1, threshold: 98, status: "healthy" },
  { metric: "Uniqueness", value: 97.6, threshold: 95, status: "healthy" },
];

const modelPerformance = [
  { model: "fraud-detector", accuracy: 98.7, latency: "8ms", drift: 0.02, requests: "5.4M/day", status: "healthy" },
  { model: "sentiment-analyzer", accuracy: 94.5, latency: "15ms", drift: 0.08, requests: "850K/day", status: "warning" },
  { model: "cv-classifier", accuracy: 91.2, latency: "23ms", drift: 0.03, requests: "1.2M/day", status: "healthy" },
  { model: "recommendation-engine", accuracy: 87.1, latency: "32ms", drift: 0.05, requests: "2.1M/day", status: "healthy" },
];

const Monitoring = () => {
  const [selectedProject, setSelectedProject] = useState<string>("all");

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "destructive";
      case "warning": return "warning";
      case "info": return "info";
      default: return "secondary";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical": return <XCircle className="h-3.5 w-3.5" />;
      case "warning": return <AlertTriangle className="h-3.5 w-3.5" />;
      default: return <Bell className="h-3.5 w-3.5" />;
    }
  };

  const filteredAlerts = selectedProject === "all" ? alerts : alerts;
  const projectModels = selectedProject === "all" ? models : getModelsByProject(selectedProject);
  const firingAlerts = filteredAlerts.filter(a => a.status === "firing").length;

  return (
    <DashboardLayout>
      <div className="space-y-4 animate-fade-in">
        {/* Header - Compact */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold">Monitoring & Observability</h1>
            <p className="text-sm text-muted-foreground">Full-stack monitoring for models & infrastructure</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-[160px] h-9 bg-muted/50">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((proj) => (
                  <SelectItem key={proj.id} value={proj.id}>{proj.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm"><Bell className="h-3.5 w-3.5 mr-1" />Alerts</Button>
            <Button variant="premium" size="sm"><Plus className="h-3.5 w-3.5 mr-1" />Dashboard</Button>
          </div>
        </div>

        {/* Stats - Compact */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: "System Health", value: "98.5%", icon: Activity, color: "text-success", tooltip: "Overall platform health score" },
            { label: "Active Alerts", value: firingAlerts.toString(), icon: AlertTriangle, color: firingAlerts > 0 ? "text-warning" : "text-success", tooltip: "Currently firing alerts" },
            { label: "Avg Latency", value: "24ms", icon: TrendingUp, tooltip: "P50 inference latency" },
            { label: "Uptime", value: "99.99%", icon: CheckCircle, color: "text-success", tooltip: "30-day availability" },
            { label: "Active Models", value: projectModels.length.toString(), icon: Box, tooltip: "Models in production" },
          ].map((stat, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <Tooltip><TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                        <TooltipContent>{stat.tooltip}</TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-xl font-bold mt-0.5">{stat.value}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-primary/10">
                    <stat.icon className={`h-4 w-4 ${stat.color || "text-primary"}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="models" className="space-y-3">
          <TabsList className="h-9">
            <TabsTrigger value="models" className="text-xs gap-1"><Box className="h-3 w-3" />Models</TabsTrigger>
            <TabsTrigger value="drift" className="text-xs gap-1"><AlertTriangle className="h-3 w-3" />Data Drift</TabsTrigger>
            <TabsTrigger value="quality" className="text-xs gap-1"><CheckCircle className="h-3 w-3" />Data Quality</TabsTrigger>
            <TabsTrigger value="infrastructure" className="text-xs gap-1"><Server className="h-3 w-3" />Infrastructure</TabsTrigger>
            <TabsTrigger value="traces" className="text-xs gap-1"><Network className="h-3 w-3" />Traces</TabsTrigger>
            <TabsTrigger value="alerts" className="text-xs gap-1"><Bell className="h-3 w-3" />Alerts ({firingAlerts})</TabsTrigger>
          </TabsList>

          <TabsContent value="models" className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Card className="glass-card">
                <CardHeader className="py-2 px-4">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    Model Accuracy
                    <Tooltip><TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                      <TooltipContent>Accuracy trend over last 24 hours</TooltipContent>
                    </Tooltip>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3 px-4">
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={modelMetrics}>
                        <defs>
                          <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} domain={[85, 100]} />
                        <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} />
                        <Area type="monotone" dataKey="accuracy" stroke="hsl(var(--success))" fill="url(#accGrad)" name="Accuracy %" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader className="py-2 px-4">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    Inference Latency
                    <Tooltip><TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                      <TooltipContent>P50 latency in milliseconds</TooltipContent>
                    </Tooltip>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3 px-4">
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={modelMetrics}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                        <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} />
                        <Line type="monotone" dataKey="latency" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Latency (ms)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Data Drift Tab */}
          <TabsContent value="drift" className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Card className="glass-card">
                <CardHeader className="py-2 px-4">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    Population Stability Index (PSI)
                    <Tooltip><TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                      <TooltipContent>PSI measures distribution shift. {">"} 0.2 indicates significant drift</TooltipContent>
                    </Tooltip>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3 px-4">
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={driftMetrics}>
                        <defs>
                          <linearGradient id="psiGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--warning))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} domain={[0, 0.3]} />
                        <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} />
                        <Area type="monotone" dataKey="psi" stroke="hsl(var(--warning))" fill="url(#psiGrad)" name="PSI Score" />
                        <Line type="monotone" dataKey={() => 0.2} stroke="hsl(var(--destructive))" strokeDasharray="5 5" name="Threshold" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader className="py-2 px-4">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    Model Drift Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3 px-4">
                  <div className="space-y-2">
                    {modelPerformance.map((model, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/50">
                        <div className="flex items-center gap-3">
                          <Box className="h-4 w-4 text-primary" />
                          <div>
                            <p className="font-medium text-xs">{model.model}</p>
                            <p className="text-[10px] text-muted-foreground">{model.requests}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-xs font-mono">PSI: {model.drift.toFixed(2)}</p>
                          </div>
                          <Badge variant={model.drift < 0.05 ? "success" : model.drift < 0.1 ? "warning" : "destructive"} className="text-[10px]">
                            {model.drift < 0.05 ? "Stable" : model.drift < 0.1 ? "Minor Drift" : "Significant"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Data Quality Tab */}
          <TabsContent value="quality" className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              {dataQualityMetrics.map((metric, i) => (
                <Card key={i} className="glass-card">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">{metric.metric}</span>
                      <Badge variant={metric.status === "healthy" ? "success" : "warning"} className="text-[10px]">
                        {metric.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xl font-bold">{metric.value}%</p>
                      <span className="text-[10px] text-muted-foreground">/ {metric.threshold}% min</span>
                    </div>
                    <div className="mt-2">
                      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${metric.value >= metric.threshold ? 'bg-success' : 'bg-warning'}`}
                          style={{ width: `${metric.value}%` }} 
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card className="glass-card">
              <CardHeader className="py-2 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary" />
                  Data Validation Rules
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3 px-4">
                <div className="space-y-2">
                  {[
                    { rule: "Schema validation", dataset: "retail_product_images", status: "passing", checks: 12 },
                    { rule: "Null check", dataset: "customer_feedback", status: "passing", checks: 8 },
                    { rule: "Range validation", dataset: "transaction_fraud", status: "warning", checks: 15 },
                    { rule: "Uniqueness check", dataset: "user_interactions", status: "passing", checks: 6 },
                    { rule: "Freshness check", dataset: "demand_history", status: "failing", checks: 4 },
                  ].map((rule, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-3">
                        {rule.status === "passing" ? <CheckCircle className="h-4 w-4 text-success" /> : 
                         rule.status === "warning" ? <AlertTriangle className="h-4 w-4 text-warning" /> :
                         <XCircle className="h-4 w-4 text-destructive" />}
                        <div>
                          <p className="font-medium text-xs">{rule.rule}</p>
                          <p className="text-[10px] text-muted-foreground">{rule.dataset}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">{rule.checks} checks</span>
                        <Badge variant={rule.status === "passing" ? "success" : rule.status === "warning" ? "warning" : "destructive"} className="text-[10px]">
                          {rule.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="infrastructure" className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Card className="glass-card">
                <CardHeader className="py-2 px-4">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-primary" />CPU & Memory
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3 px-4">
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={clusterMetrics}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} domain={[0, 100]} />
                        <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} />
                        <Legend wrapperStyle={{ fontSize: "10px" }} />
                        <Area type="monotone" dataKey="cpu" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.2)" name="CPU %" />
                        <Area type="monotone" dataKey="memory" stroke="hsl(var(--gold))" fill="hsl(var(--gold)/0.2)" name="Memory %" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader className="py-2 px-4">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4 text-gold" />GPU Utilization
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3 px-4">
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={clusterMetrics}>
                        <defs>
                          <linearGradient id="gpuGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--gold))" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="hsl(var(--gold))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} domain={[0, 100]} />
                        <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} />
                        <Area type="monotone" dataKey="gpu" stroke="hsl(var(--gold))" fill="url(#gpuGrad)" name="GPU %" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="traces" className="space-y-3">
            <Card className="glass-card">
              <CardHeader className="py-2 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Network className="h-4 w-4 text-primary" />Distributed Traces
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3 px-4">
                <div className="space-y-2">
                  {[
                    { trace: "inference-001", service: "fraud-detector", duration: "45ms", status: "success", spans: 12 },
                    { trace: "inference-002", service: "sentiment-analyzer", duration: "23ms", status: "success", spans: 8 },
                    { trace: "training-001", service: "model-trainer", duration: "2.3s", status: "running", spans: 24 },
                    { trace: "inference-003", service: "recommendation-engine", duration: "78ms", status: "error", spans: 15 },
                  ].map((trace, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-3">
                        <Terminal className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-mono text-xs">{trace.trace}</p>
                          <p className="text-[10px] text-muted-foreground">{trace.service}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">{trace.spans} spans</span>
                        <span className="font-mono text-xs">{trace.duration}</span>
                        <Badge variant={trace.status === "success" ? "success" : trace.status === "error" ? "destructive" : "warning"} className="text-[10px]">
                          {trace.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-3">
            <Card className="glass-card">
              <CardHeader className="py-2 px-4">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span>Active Alerts</span>
                  <Badge variant={firingAlerts > 0 ? "destructive" : "success"} className="text-xs">{firingAlerts} firing</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3 px-4">
                <div className="space-y-2">
                  {filteredAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-3">
                        {getSeverityIcon(alert.severity)}
                        <div>
                          <p className="text-xs font-medium">{alert.message}</p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />{alert.time}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getSeverityColor(alert.severity)} className="text-[10px]">{alert.severity}</Badge>
                        <Badge variant={alert.status === "firing" ? "destructive" : alert.status === "resolved" ? "success" : "secondary"} className="text-[10px]">
                          {alert.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Monitoring;
