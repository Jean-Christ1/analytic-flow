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
import { 
  projects as platformProjects, 
  models, 
  experiments, 
  deployments, 
  datasets,
  pipelines 
} from "@/data/platformData";

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

// Real activities from platform data
const activities = [
  { id: 1, action: "Model deployed", project: "Fraud Detection System", user: "Maria Kim", time: "2m ago", type: "deploy", projectId: "proj-003" },
  { id: 2, action: "Experiment completed", project: "NLP Sentiment Analysis", user: "Tom Wilson", time: "15m ago", type: "experiment", projectId: "proj-002" },
  { id: 3, action: "Pipeline triggered", project: "Computer Vision Pipeline", user: "Sarah Chen", time: "1h ago", type: "pipeline", projectId: "proj-001" },
  { id: 4, action: "Data drift detected", project: "Tire Regulation Analysis", user: "System", time: "2h ago", type: "alert", projectId: "proj-006" },
  { id: 5, action: "New model registered", project: "Recommendation Engine", user: "John Doe", time: "3h ago", type: "model", projectId: "proj-005" },
  { id: 6, action: "Training completed", project: "Time Series Forecasting", user: "Alex Lee", time: "4h ago", type: "experiment", projectId: "proj-004" },
];

const Dashboard = () => {
  const { formatCurrency } = useCurrency();
  const navigate = useNavigate();
  const [projectPage, setProjectPage] = useState(0);
  const PROJECTS_PER_PAGE = 4;

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
          <span>Last updated: 2 min ago</span>
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
              value={models.length.toString()}
              trend="up"
              trendValue="+12%"
              tooltip="Total models across all environments"
            >
              <StatItem label="Production" value={models.filter(m => m.stage === "Production").length.toString()} tooltip="Models in PROD" />
              <StatItem label="Staging" value={models.filter(m => m.stage === "Staging").length.toString()} tooltip="Models in STAGING" />
              <StatItem label="Development" value={models.filter(m => m.stage === "Development").length.toString()} tooltip="Models in DEV" />
            </MainKPI>

            <MainKPI
              icon={FlaskConical}
              iconColor="text-info"
              title="Experiments"
              value={experiments.length.toString()}
              trend="up"
              trendValue="+23%"
              tooltip="Total experiments this month"
            >
              <StatItem label="Running" value={experiments.filter(e => e.status === "running").length.toString()} tooltip="Currently executing" />
              <StatItem label="Completed" value={experiments.filter(e => e.status === "completed").length.toString()} tooltip="Successfully finished" />
              <StatItem label="Failed" value={experiments.filter(e => e.status === "failed").length.toString()} tooltip="Errors encountered" />
            </MainKPI>

            <MainKPI
              icon={Rocket}
              iconColor="text-success"
              title="Deployments"
              value={deployments.length.toString()}
              trend="up"
              trendValue="+8%"
              tooltip="Active model endpoints"
            >
              <StatItem label="Healthy" value={deployments.filter(d => d.status === "healthy").length.toString()} tooltip="No issues detected" />
              <StatItem label="Degraded" value={deployments.filter(d => d.status === "degraded").length.toString()} tooltip="Performance issues" />
              <StatItem label="Failed" value={deployments.filter(d => d.status === "failed").length.toString()} tooltip="Immediate attention" />
            </MainKPI>

            <MainKPI
              icon={Coins}
              iconColor="text-warning"
              title="Monthly Cost"
              value={formatCurrency(platformProjects.reduce((sum, p) => sum + p.resources.monthlyCost, 0), { compact: true })}
              trend="down"
              trendValue="-8%"
              tooltip="Total platform costs"
            >
              <StatItem label="Compute" value={formatCurrency(platformProjects.reduce((sum, p) => sum + p.resources.monthlyCost, 0) * 0.58, { compact: true })} tooltip="CPU/GPU costs" />
              <StatItem label="Storage" value={formatCurrency(platformProjects.reduce((sum, p) => sum + p.resources.monthlyCost, 0) * 0.25, { compact: true })} tooltip="Data storage" />
              <StatItem label="Network" value={formatCurrency(platformProjects.reduce((sum, p) => sum + p.resources.monthlyCost, 0) * 0.17, { compact: true })} tooltip="Data transfer" />
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
                  <span className="text-sm font-bold">{pipelines.length}</span>
                </div>
              </CardHeader>
              <CardContent className="px-3 pb-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-success" />
                    <span>{pipelines.filter(p => p.status === "active" || p.status === "completed").length} OK</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-warning" />
                    <span>{pipelines.filter(p => p.status === "paused").length} Paused</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-destructive" />
                    <span>{pipelines.filter(p => p.status === "failed").length} Failed</span>
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
                    Healthy
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="px-3 pb-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span><Database className="h-3 w-3 inline mr-1 text-success" />DB: OK</span>
                  <span><Zap className="h-3 w-3 inline mr-1 text-success" />API: 99.9%</span>
                  <span><Activity className="h-3 w-3 inline mr-1 text-success" />45ms</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Level 3: Quick Insights */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="glass-card border-border/50">
              <CardHeader className="pb-1.5 pt-2.5 px-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Top Performing</span>
                  <Button variant="ghost" size="sm" className="h-5 text-xs px-1.5" onClick={() => navigate("/projects")}>
                    View all <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-3 pb-2.5 space-y-1">
                {platformProjects.filter(p => p.status === "active").slice(0, 3).map((p) => (
                  <Link key={p.id} to={`/projects/${p.id}`} className="flex items-center justify-between text-xs hover:text-primary">
                    <span className="text-foreground truncate">{p.name}</span>
                    <span className="text-success">{p.progress}%</span>
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
                  <Badge variant="destructive" className="text-xs px-1.5 py-0">3</Badge>
                </div>
              </CardHeader>
              <CardContent className="px-3 pb-2.5 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-destructive truncate">High latency detected</span>
                  <Badge variant="destructive" className="px-1 py-0 text-xs">Crit</Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-warning truncate">Data drift warning</span>
                  <Badge variant="outline" className="px-1 py-0 text-xs text-warning border-warning/30">Warn</Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground truncate">GPU quota 80%</span>
                  <Badge variant="secondary" className="px-1 py-0 text-xs">Info</Badge>
                </div>
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
                {platformProjects.map((project) => (
                  <div 
                    key={project.id} 
                    className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-primary/10">
                        <FolderKanban className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{project.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{project.modelIds.length} models</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {project.team.length}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-success">{project.progress}%</p>
                        <p className="text-xs text-muted-foreground">progress</p>
                      </div>
                      <Badge variant={project.status === "active" ? "default" : "secondary"} className="text-xs">
                        {project.status}
                      </Badge>
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
