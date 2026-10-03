import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useNavigate, Link } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Box,
  FlaskConical,
  Rocket,
  Cpu,
  Coins,
  TrendingUp,
  TrendingDown,
  Info,
  Activity,
  Database,
  Shield,
  Zap,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  GitBranch,
  FolderKanban,
  ChevronRight,
  Users,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboardData, timeAgo } from "@/hooks/useDashboardData";

// Compact stat component
const StatItem = ({ 
  label, 
  value, 
  trend, 
  trendValue, 
  tooltip 
}: { 
  label: string; 
  value: string; 
  trend?: "up" | "down"; 
  trendValue?: string;
  tooltip?: string;
}) => (
  <div className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      {tooltip && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-3 w-3 text-muted-foreground/50 cursor-help" />
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="text-xs">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold text-foreground">{value}</span>
      {trend && trendValue && (
        <span className={cn(
          "text-xs flex items-center gap-0.5",
          trend === "up" ? "text-success" : "text-destructive"
        )}>
          {trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {trendValue}
        </span>
      )}
    </div>
  </div>
);

// Main KPI Card component
const MainKPI = ({ 
  icon: Icon, 
  iconColor, 
  title, 
  value, 
  trend, 
  trendValue, 
  children,
  tooltip 
}: { 
  icon: React.ElementType; 
  iconColor: string; 
  title: string; 
  value: string; 
  trend?: "up" | "down"; 
  trendValue?: string;
  children?: React.ReactNode;
  tooltip?: string;
}) => (
  <Card className="glass-card border-border/50 hover:border-primary/30 transition-all duration-300">
    <CardHeader className="pb-2 pt-3 px-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("p-1.5 rounded-lg bg-muted/50", iconColor)}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-1">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </CardTitle>
            {tooltip && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground/50 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
        {trend && trendValue && (
          <Badge variant={trend === "up" ? "default" : "destructive"} className="text-xs px-1.5 py-0">
            {trend === "up" ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
            {trendValue}
          </Badge>
        )}
      </div>
    </CardHeader>
    <CardContent className="px-4 pb-3">
      <p className="text-2xl font-display font-bold text-foreground mb-2">{value}</p>
      {children && <div className="space-y-0">{children}</div>}
    </CardContent>
  </Card>
);


const Dashboard = () => {
  const { formatCurrency } = useCurrency();
  const navigate = useNavigate();
  const [projectPage, setProjectPage] = useState(0);
  const PROJECTS_PER_PAGE = 4;
  const { data: d, dataUpdatedAt } = useDashboardData();
  const fmt = (n?: number) => String(n ?? 0);
  const activities = (d?.activity ?? []).map((a: any) => ({
    id: a.id,
    action: a.action,
    project: a.resource_name ?? a.resource_type ?? "",
    user: a.actor_type === "service" ? "System" : "User",
    time: timeAgo(a.created_at),
    type: /deploy/i.test(a.action) ? "deploy" : /run|experiment/i.test(a.action) ? "experiment" : /pipeline/i.test(a.action) ? "pipeline" : a.status === "failure" ? "alert" : /model/i.test(a.action) ? "model" : "other",
  }));
  const projects = d?.projects ?? [];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "deploy": return <Rocket className="h-3 w-3 text-success" />;
      case "experiment": return <FlaskConical className="h-3 w-3 text-info" />;
      case "pipeline": return <GitBranch className="h-3 w-3 text-primary" />;
      case "alert": return <AlertTriangle className="h-3 w-3 text-warning" />;
      case "model": return <Box className="h-3 w-3 text-primary" />;
      default: return <Activity className="h-3 w-3 text-muted-foreground" />;
    }
  };

  return (
    <DashboardLayout>
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="font-display text-lg font-bold text-foreground">
            Dashboard <span className="text-muted-foreground font-normal text-sm">/ Overview</span>
          </h1>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>Last updated: {dataUpdatedAt ? timeAgo(new Date(dataUpdatedAt).toISOString()) : "…"}</span>
        </div>
      </div>

      {/* Main Content with Tabs */}
      <Tabs defaultValue="overview" className="space-y-3">
        <TabsList className="bg-muted/50 p-0.5 h-8">
          <TabsTrigger value="overview" className="gap-1.5 text-xs h-7 px-3">
            <BarChart3 className="h-3.5 w-3.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="projects" className="gap-1.5 text-xs h-7 px-3">
            <FolderKanban className="h-3.5 w-3.5" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-1.5 text-xs h-7 px-3">
            <Activity className="h-3.5 w-3.5" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="resources" className="gap-1.5 text-xs h-7 px-3">
            <Cpu className="h-3.5 w-3.5" />
            Resources
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab - Hierarchical KPIs */}
        <TabsContent value="overview" className="mt-2 space-y-3">
          {/* Level 1: Macro KPIs */}
          <div className="grid grid-cols-4 gap-3">
            <MainKPI
              icon={Box}
              iconColor="text-primary"
              title="Models"
              value={fmt(d?.models.total)}
              tooltip="Total models across all environments"
            >
              <StatItem label="Approved versions" value={fmt(d?.models.approved)} tooltip="Versions approved for production" />
              <StatItem label="Draft versions" value={fmt(d?.models.draft)} tooltip="Versions awaiting approval" />
              <StatItem label="Deprecated" value={fmt(d?.models.deprecated)} tooltip="Retired versions" />
            </MainKPI>

            <MainKPI
              icon={FlaskConical}
              iconColor="text-info"
              title="Runs"
              value={fmt(d?.runs.total)}
              tooltip="Total training runs"
            >
              <StatItem label="Running" value={fmt(d?.runs.running)} tooltip="Currently executing" />
              <StatItem label="Completed" value={fmt(d?.runs.succeeded)} tooltip="Successfully finished" />
              <StatItem label="Failed" value={fmt(d?.runs.failed)} tooltip="Errors encountered" />
            </MainKPI>

            <MainKPI
              icon={Rocket}
              iconColor="text-success"
              title="Deployments"
              value={fmt(d?.deployments.total)}
              tooltip="Active model endpoints"
            >
              <StatItem label="Healthy" value={fmt(d?.deployments.healthy)} tooltip="No issues detected" />
              <StatItem label="Degraded" value={fmt(d?.deployments.degraded)} tooltip="Performance issues" />
              <StatItem label="Failed" value={fmt(d?.deployments.failed)} tooltip="Immediate attention" />
            </MainKPI>

            <MainKPI
              icon={Coins}
              iconColor="text-warning"
              title="Monthly Cost"
              value={formatCurrency(d?.cost.total ?? 0, { compact: true })}
              tooltip="Platform costs since the 1st of this month"
            >
              <StatItem label="Compute" value={formatCurrency(d?.cost.compute ?? 0, { compact: true })} tooltip="CPU/GPU costs" />
              <StatItem label="Storage" value={formatCurrency(d?.cost.storage ?? 0, { compact: true })} tooltip="Data storage" />
              <StatItem label="Network" value={formatCurrency(d?.cost.network ?? 0, { compact: true })} tooltip="Data transfer" />
            </MainKPI>
          </div>

          {/* Level 2: Secondary Metrics */}
          <div className="grid grid-cols-3 gap-3">
            {/* GPU & Pipelines */}
            <Card className="glass-card border-border/50">
              <CardHeader className="pb-1 pt-2.5 px-3">
                <div className="flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-medium">Infrastructure</span>
                </div>
              </CardHeader>
              <CardContent className="px-3 pb-2.5">
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>GPU (78%)</span>
                      <span>4,291h / 5,500h</span>
                    </div>
                    <Progress value={78} className="h-1.5" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Storage (72%)</span>
                      <span>72TB / 100TB</span>
                    </div>
                    <Progress value={72} className="h-1.5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pipelines Status */}
            <Card className="glass-card border-border/50">
              <CardHeader className="pb-1 pt-2.5 px-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <GitBranch className="h-3.5 w-3.5 text-info" />
                    <span className="text-xs font-medium">Pipelines</span>
                  </div>
                  <span className="text-sm font-bold">{fmt(d?.pipelines.total)}</span>
                </div>
              </CardHeader>
              <CardContent className="px-3 pb-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-success" />
                    <span>{fmt(d?.pipelines.ok)} OK</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-warning" />
                    <span>{fmt(d?.pipelines.pending)} Pending</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-destructive" />
                    <span>{fmt(d?.pipelines.failed)} Failed</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Health */}
            <Card className="glass-card border-border/50">
              <CardHeader className="pb-1 pt-2.5 px-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-success" />
                    <span className="text-xs font-medium">System Health</span>
                  </div>
                  <Badge variant="outline" className="text-xs text-success border-success/30 px-1.5 py-0">
                    {d?.dbHealthy === false ? "Degraded" : "Healthy"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="px-3 pb-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span><Database className="h-3 w-3 inline mr-1 text-success" />DB: {d?.dbHealthy === false ? "Issues" : "OK"}</span>
                  <span><Zap className="h-3 w-3 inline mr-1 text-success" />Clusters: {fmt(d?.clusters.ready)}/{fmt(d?.clusters.total)}</span>
                  <span><Activity className="h-3 w-3 inline mr-1 text-warning" />Degraded: {fmt(d?.clusters.degraded)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Level 3: Quick Insights */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="glass-card border-border/50">
              <CardHeader className="pb-1.5 pt-2.5 px-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Recent Projects</span>
                  <Button variant="ghost" size="sm" className="h-5 text-xs px-1.5" onClick={() => navigate("/projects")}>
                    View all <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-3 pb-2.5 space-y-1">
                {projects.length === 0 && <p className="text-xs text-muted-foreground">No projects yet</p>}
                {projects.slice(0, 3).map((p: any) => (
                  <Link key={p.id} to={`/projects/${p.id}`} className="flex items-center justify-between text-xs hover:text-primary">
                    <span className="text-foreground truncate">{p.name}</span>
                    <span className="text-muted-foreground">{p.lifecycle_status}</span>
                  </Link>
                ))}
              </CardContent>
            </Card>

            <Card className="glass-card border-border/50">
              <CardHeader className="pb-1.5 pt-2.5 px-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Recent Activity</span>
                  <Button variant="ghost" size="sm" className="h-5 text-xs px-1.5" onClick={() => navigate("/audit-logs")}>
                    View all <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-3 pb-2.5 space-y-1">
                {activities.length === 0 && <p className="text-xs text-muted-foreground">No activity yet</p>}
                {activities.slice(0, 3).map((a) => (
                  <div key={a.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      {getActivityIcon(a.type)}
                      <span className="truncate">{a.action}</span>
                    </div>
                    <span className="text-muted-foreground">{a.time}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="glass-card border-border/50">
              <CardHeader className="pb-1.5 pt-2.5 px-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Active Alerts</span>
                  <Badge variant="destructive" className="text-xs px-1.5 py-0">{d?.alerts.length ?? 0}</Badge>
                </div>
              </CardHeader>
              <CardContent className="px-3 pb-2.5 space-y-1">
                {(d?.alerts ?? []).length === 0 && <p className="text-xs text-muted-foreground">No active alerts</p>}
                {(d?.alerts ?? []).slice(0, 3).map((al: any) => (
                  <div key={al.id} className="flex items-center justify-between text-xs">
                    <span className={cn("truncate", al.level === "crit" ? "text-destructive" : al.level === "warn" ? "text-warning" : "text-muted-foreground")}>{al.label}</span>
                    <Badge variant={al.level === "crit" ? "destructive" : al.level === "warn" ? "outline" : "secondary"} className="px-1 py-0 text-xs">{al.level === "crit" ? "Crit" : al.level === "warn" ? "Warn" : "Info"}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="mt-2">
          <Card className="glass-card border-border/50">
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FolderKanban className="h-4 w-4 text-primary" />
                  Active Projects
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground/50 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent><p className="text-xs">All ML projects in the platform</p></TooltipContent>
                  </Tooltip>
                </CardTitle>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => navigate("/projects")}>
                  View All <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="space-y-2">
                {projects.length === 0 && <p className="text-xs text-muted-foreground">No projects yet. Create one from the Projects page.</p>}
                {projects.map((project: any) => (
                  <div key={project.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => navigate(`/projects/${project.id}`)}>
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-primary/10"><FolderKanban className="h-4 w-4 text-primary" /></div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{project.name}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-md">{project.description ?? `Criticality: ${project.criticality}`}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={project.lifecycle_status === "active" ? "default" : "secondary"} className="text-xs">{project.lifecycle_status}</Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="mt-2">
          <Card className="glass-card border-border/50">
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4 text-info" />
                  Recent Activity
                </CardTitle>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => navigate("/audit-logs")}>
                  View All Logs <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="space-y-2">
                {activities.length === 0 && <p className="text-xs text-muted-foreground">No activity recorded yet</p>}
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-muted/50">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.project} • by {activity.user}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="mt-2">
          <div className="grid grid-cols-4 gap-3">
            <Card className="glass-card border-border/50">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-primary" />
                  Compute
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>CPU Usage</span>
                    <span>65%</span>
                  </div>
                  <Progress value={65} className="h-1.5" />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>GPU Usage</span>
                    <span>78%</span>
                  </div>
                  <Progress value={78} className="h-1.5" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-border/50">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Database className="h-4 w-4 text-info" />
                  Storage
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Data Storage</span>
                    <span>72%</span>
                  </div>
                  <Progress value={72} className="h-1.5" />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Artifacts</span>
                    <span>45%</span>
                  </div>
                  <Progress value={45} className="h-1.5" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-border/50">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-warning" />
                  Memory
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>RAM Usage</span>
                    <span>58%</span>
                  </div>
                  <Progress value={58} className="h-1.5" />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Cache</span>
                    <span>34%</span>
                  </div>
                  <Progress value={34} className="h-1.5" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-border/50">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4 text-success" />
                  Network
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Bandwidth</span>
                    <span>42%</span>
                  </div>
                  <Progress value={42} className="h-1.5" />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>API Calls</span>
                    <span>67%</span>
                  </div>
                  <Progress value={67} className="h-1.5" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Dashboard;
