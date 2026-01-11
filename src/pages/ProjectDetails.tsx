import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  ArrowLeft,
  Settings,
  GitBranch,
  Star,
  FlaskConical,
  Box,
  Rocket,
  Clock,
  Plus,
  ExternalLink,
  Database,
  DollarSign,
  Leaf,
  Cpu,
  Info,
  Users,
  Activity,
  PlayCircle,
  PauseCircle,
  CheckCircle,
  XCircle,
  Workflow,
  MemoryStick,
  HardDrive,
  Zap,
  Tag,
  Calendar,
  TrendingUp,
  BarChart3,
  Layers,
  GitCommit,
  FileCode,
  AlertTriangle,
} from "lucide-react";
import { 
  getProjectById, 
  getModelsByProject, 
  getExperimentsByProject,
  getDatasetsByProject,
  getDeploymentsByProject,
  getPipelinesByProject,
  Pipeline,
} from "@/data/platformData";
import { DeployModelDialog } from "@/components/dialogs/DeployModelDialog";
import { NewExperimentDialog } from "@/components/dialogs/NewExperimentDialog";
import { CreatePipelineDialog } from "@/components/dialogs/CreatePipelineDialog";
import { InviteMemberDialog } from "@/components/dialogs/InviteMemberDialog";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const ITEMS_PER_PAGE = 4;

// Mock data for resource utilization charts
const generateResourceHistory = () =>
  Array.from({ length: 24 }, (_, i) => ({
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

const ProjectDetails = () => {
  const { id } = useParams();
  const { isAdmin, canDeploy } = useCurrentUser();
  const { formatCurrency } = useCurrency();
  const [deployDialogOpen, setDeployDialogOpen] = useState(false);
  const [experimentDialogOpen, setExperimentDialogOpen] = useState(false);
  const [pipelineDialogOpen, setPipelineDialogOpen] = useState(false);
  const [expPage, setExpPage] = useState(1);
  const [modelPage, setModelPage] = useState(1);
  const [pipelinePage, setPipelinePage] = useState(1);
  const [resourceEnv, setResourceEnv] = useState<"DEV" | "STAGING" | "PROD">("PROD");
  const [inviteMemberDialogOpen, setInviteMemberDialogOpen] = useState(false);
  const [activityChartDialogOpen, setActivityChartDialogOpen] = useState(false);
  
  const project = getProjectById(id || "");
  const models = getModelsByProject(id || "");
  const experiments = getExperimentsByProject(id || "");
  const datasets = getDatasetsByProject(id || "");
  const deployments = getDeploymentsByProject(id || "");
  const pipelines = getPipelinesByProject(id || "");

  if (!project) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-xl font-bold text-foreground">Project Not Found</h2>
            <p className="text-muted-foreground mt-2">The project with ID {id} does not exist.</p>
            <Link to="/projects"><Button className="mt-4">Back to Projects</Button></Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": case "healthy": case "completed": case "running": return "success";
      case "paused": case "degraded": case "staging": case "queued": return "warning";
      case "failed": return "destructive";
      default: return "secondary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": case "running": return <PlayCircle className="h-3 w-3" />;
      case "paused": return <PauseCircle className="h-3 w-3" />;
      case "completed": return <CheckCircle className="h-3 w-3" />;
      case "failed": return <XCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const expPages = Math.ceil(experiments.length / ITEMS_PER_PAGE);
  const modelPages = Math.ceil(models.length / ITEMS_PER_PAGE);
  const pipelinePages = Math.ceil(pipelines.length / ITEMS_PER_PAGE);
  const paginatedExp = experiments.slice((expPage - 1) * ITEMS_PER_PAGE, expPage * ITEMS_PER_PAGE);
  const paginatedModels = models.slice((modelPage - 1) * ITEMS_PER_PAGE, modelPage * ITEMS_PER_PAGE);
  const paginatedPipelines = pipelines.slice((pipelinePage - 1) * ITEMS_PER_PAGE, pipelinePage * ITEMS_PER_PAGE);

  // Environment resource data
  const envResources = {
    DEV: { cpu: { used: 4.2, total: 8 }, gpu: { used: 1, total: 2 }, memory: { used: 12.5, total: 32 }, storage: { used: 45, total: 100 }, cost: 285 },
    STAGING: { cpu: { used: 6.8, total: 16 }, gpu: { used: 2, total: 4 }, memory: { used: 28.5, total: 64 }, storage: { used: 120, total: 250 }, cost: 520 },
    PROD: { cpu: { used: 24.5, total: 32 }, gpu: { used: 6, total: 8 }, memory: { used: 98.5, total: 128 }, storage: { used: 380, total: 500 }, cost: 1850 },
  };

  const currentEnvResources = envResources[resourceEnv];

  const renderPaginationControls = (
    currentPage: number,
    totalPages: number,
    setPage: (page: number) => void
  ) => (
    totalPages > 1 && (
      <div className="flex justify-center mt-3">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setPage(Math.max(1, currentPage - 1))} 
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} 
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => (
              <PaginationItem key={i}>
                <PaginationLink 
                  onClick={() => setPage(i + 1)} 
                  isActive={currentPage === i + 1} 
                  className="cursor-pointer"
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext 
                onClick={() => setPage(Math.min(totalPages, currentPage + 1))} 
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} 
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    )
  );

  return (
    <DashboardLayout>
      <div className="space-y-4 animate-fade-in">
        {/* Compact Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Link to="/projects">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-display font-bold text-foreground">{project.name}</h1>
                {project.starred && <Star className="h-4 w-4 text-gold fill-gold" />}
                <Badge variant={getStatusColor(project.status)} className="capitalize text-[10px]">{project.status}</Badge>
                {/* Production Status Indicator */}
                {deployments.some(d => d.environment === 'production' && d.status === 'healthy') ? (
                  <Badge variant="success" className="text-[10px] gap-1">
                    <CheckCircle className="h-3 w-3" />
                    In Production
                  </Badge>
                ) : deployments.some(d => d.environment === 'staging') ? (
                  <Badge variant="warning" className="text-[10px] gap-1">
                    <Clock className="h-3 w-3" />
                    Staging
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] gap-1 text-muted-foreground">
                    <AlertTriangle className="h-3 w-3" />
                    DEV Only
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-1"><GitBranch className="h-3 w-3" />{project.gitBranch}</span>
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{project.createdAt}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{project.lastActivity}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm"><ExternalLink className="h-3 w-3 mr-1" />Repo</Button>
            <Link to={`/projects/${id}/settings`}>
              <Button variant="outline" size="sm"><Settings className="h-3 w-3 mr-1" />Settings</Button>
            </Link>
          </div>
        </div>

        {/* Progress Bar */}
        <Card className="glass-card">
          <CardContent className="py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Project Progress</span>
              </div>
              <span className="text-sm font-bold text-primary">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-2" />
          </CardContent>
        </Card>

        {/* Compact Stats - 8 columns */}
        <div className="grid grid-cols-8 gap-2">
          {[
            { label: "Experiments", value: experiments.length, icon: FlaskConical, color: "text-primary", tooltip: "Total experiments" },
            { label: "Models", value: models.length, icon: Box, color: "text-info", tooltip: "Registered models" },
            { label: "Deployments", value: deployments.length, icon: Rocket, color: "text-success", tooltip: "Active deployments" },
            { label: "Datasets", value: datasets.length, icon: Database, color: "text-warning", tooltip: "Linked datasets" },
            { label: "Pipelines", value: pipelines.length, icon: Workflow, color: "text-purple-400", tooltip: "CI/CD pipelines" },
            { label: "Team", value: project.team.length, icon: Users, color: "text-cyan-400", tooltip: "Team members" },
            { label: "Cost", value: formatCurrency(project.resources.monthlyCost), icon: DollarSign, color: "text-gold", tooltip: "Monthly cost" },
            { label: "CO₂", value: `${project.resources.carbonEmissions}kg`, icon: Leaf, color: "text-success", tooltip: "Carbon emissions" },
          ].map((stat, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="py-2 px-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col items-center cursor-help">
                      <stat.icon className={`h-4 w-4 ${stat.color} mb-1`} />
                      <p className="text-lg font-bold font-display">{stat.value}</p>
                      <p className="text-[9px] text-muted-foreground uppercase">{stat.label}</p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>{stat.tooltip}</TooltipContent>
                </Tooltip>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Resources Summary */}
        <Card className="glass-card">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Total Resources:</span>
              </div>
              <div className="flex items-center gap-6 text-xs">
                <span className="flex items-center gap-1"><Cpu className="h-3 w-3 text-primary" /><strong>CPU:</strong> {project.resources.totalCpu}</span>
                <span className="flex items-center gap-1"><MemoryStick className="h-3 w-3 text-warning" /><strong>Memory:</strong> {project.resources.totalMemory}</span>
                <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-info" /><strong>GPU:</strong> {project.resources.totalGpu}</span>
                <span className="flex items-center gap-1"><HardDrive className="h-3 w-3 text-muted-foreground" /><strong>Storage:</strong> {project.resources.totalStorage}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-3">
          <TabsList className="bg-muted/50 p-1 h-auto flex-wrap">
            <TabsTrigger value="overview" className="text-xs gap-1">
              <Layers className="h-3 w-3" />Overview
            </TabsTrigger>
            <TabsTrigger value="experiments" className="text-xs gap-1">
              <FlaskConical className="h-3 w-3" />Experiments ({experiments.length})
            </TabsTrigger>
            <TabsTrigger value="models" className="text-xs gap-1">
              <Box className="h-3 w-3" />Models ({models.length})
            </TabsTrigger>
            <TabsTrigger value="pipelines" className="text-xs gap-1">
              <Workflow className="h-3 w-3" />Pipelines ({pipelines.length})
            </TabsTrigger>
            <TabsTrigger value="datasets" className="text-xs gap-1">
              <Database className="h-3 w-3" />Datasets ({datasets.length})
            </TabsTrigger>
            <TabsTrigger value="deployments" className="text-xs gap-1">
              <Rocket className="h-3 w-3" />Deployments ({deployments.length})
            </TabsTrigger>
            <TabsTrigger value="resources" className="text-xs gap-1">
              <BarChart3 className="h-3 w-3" />Resources
            </TabsTrigger>
            <TabsTrigger value="team" className="text-xs gap-1">
              <Users className="h-3 w-3" />Team ({project.team.length})
            </TabsTrigger>
            <TabsTrigger value="about" className="text-xs gap-1">
              <Info className="h-3 w-3" />About
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="space-y-4">
              {/* Quick Stats Row */}
              <div className="grid grid-cols-4 gap-3">
                <Card className="glass-card">
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Active Experiments</p>
                        <p className="text-2xl font-bold font-display">{experiments.filter(e => e.status === 'running').length}</p>
                      </div>
                      <FlaskConical className="h-8 w-8 text-primary/30" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Production Models</p>
                        <p className="text-2xl font-bold font-display">{models.filter(m => m.stage === 'Production').length}</p>
                      </div>
                      <Box className="h-8 w-8 text-info/30" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Healthy Deployments</p>
                        <p className="text-2xl font-bold font-display">{deployments.filter(d => d.status === 'healthy').length}</p>
                      </div>
                      <Rocket className="h-8 w-8 text-success/30" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Monthly Cost</p>
                        <p className="text-2xl font-bold font-display">{formatCurrency(project.resources.monthlyCost)}</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-gold/30" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity & Best Model */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="glass-card">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      Recent Experiments
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="space-y-2">
                      {experiments.slice(0, 3).map((exp) => (
                        <Link key={exp.id} to={`/experiments/${exp.id}`}>
                          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-2">
                              <FlaskConical className="h-3 w-3 text-primary" />
                              <span className="text-sm truncate">{exp.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{exp.accuracy ? `${exp.accuracy}%` : '-'}</span>
                              <Badge variant={getStatusColor(exp.status)} className="text-[9px]">
                                {exp.status}
                              </Badge>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Star className="h-4 w-4 text-gold" />
                      Best Performing Model
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3">
                    {models.length > 0 ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Box className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{models[0].name}</p>
                            <p className="text-xs text-muted-foreground">{models[0].framework} • v{models[0].latestVersion}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="p-2 rounded bg-muted/30 text-center">
                            <p className="text-lg font-bold">{models[0].accuracy}</p>
                            <p className="text-[9px] text-muted-foreground">Accuracy</p>
                          </div>
                          <div className="p-2 rounded bg-muted/30 text-center">
                            <p className="text-lg font-bold">{models[0].deployments}</p>
                            <p className="text-[9px] text-muted-foreground">Deployments</p>
                          </div>
                          <div className="p-2 rounded bg-muted/30 text-center">
                            <p className="text-lg font-bold">{models[0].latency}</p>
                            <p className="text-[9px] text-muted-foreground">Latency</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">No models registered yet</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Project Description & Activity Side by Side */}
              <div className="grid grid-cols-2 gap-4">
                {/* Description */}
                <Card className="glass-card">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Project Description</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <p className="text-sm text-muted-foreground">{project.description}</p>
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {project.tags.map((tag, i) => (
                        <Badge key={i} variant="outline" className="text-[10px]">{tag}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Project Activity Chart - Clickable */}
                <Card 
                  className="glass-card cursor-pointer hover:ring-1 hover:ring-primary/50 transition-all"
                  onClick={() => setActivityChartDialogOpen(true)}
                >
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      Project Activity
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>Click to expand • Activity trends over 7 days</TooltipContent>
                      </Tooltip>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <ResponsiveContainer width="100%" height={100}>
                      <AreaChart data={[
                        { day: 'Mon', experiments: 4, models: 2, deployments: 1 },
                        { day: 'Tue', experiments: 6, models: 3, deployments: 2 },
                        { day: 'Wed', experiments: 8, models: 2, deployments: 1 },
                        { day: 'Thu', experiments: 5, models: 4, deployments: 3 },
                        { day: 'Fri', experiments: 9, models: 3, deployments: 2 },
                        { day: 'Sat', experiments: 3, models: 1, deployments: 1 },
                        { day: 'Sun', experiments: 2, models: 1, deployments: 0 },
                      ]}>
                        <defs>
                          <linearGradient id="colorExpSmall" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="experiments" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorExpSmall)" strokeWidth={2} />
                        <Area type="monotone" dataKey="models" stroke="hsl(var(--info))" fillOpacity={0.5} strokeWidth={1} />
                        <Area type="monotone" dataKey="deployments" stroke="hsl(var(--success))" fillOpacity={0.5} strokeWidth={1} />
                      </AreaChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-4 mt-1">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-[9px] text-muted-foreground">Exp</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-info" />
                        <span className="text-[9px] text-muted-foreground">Models</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-success" />
                        <span className="text-[9px] text-muted-foreground">Deploy</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Activity Chart Expanded Dialog */}
              <Dialog open={activityChartDialogOpen} onOpenChange={setActivityChartDialogOpen}>
                <DialogContent className="max-w-[90vw] max-h-[90vh]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary" />
                      Project Activity - Last 7 Days
                    </DialogTitle>
                  </DialogHeader>
                  <div className="h-[70vh]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[
                        { day: 'Monday', experiments: 4, models: 2, deployments: 1 },
                        { day: 'Tuesday', experiments: 6, models: 3, deployments: 2 },
                        { day: 'Wednesday', experiments: 8, models: 2, deployments: 1 },
                        { day: 'Thursday', experiments: 5, models: 4, deployments: 3 },
                        { day: 'Friday', experiments: 9, models: 3, deployments: 2 },
                        { day: 'Saturday', experiments: 3, models: 1, deployments: 1 },
                        { day: 'Sunday', experiments: 2, models: 1, deployments: 0 },
                      ]}>
                        <defs>
                          <linearGradient id="colorExperimentsLarge" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorModelsLarge" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--info))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--info))" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorDeploymentsLarge" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
                        <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
                        <RechartsTooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '13px'
                          }} 
                        />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="experiments" 
                          stroke="hsl(var(--primary))" 
                          fillOpacity={1} 
                          fill="url(#colorExperimentsLarge)" 
                          strokeWidth={3}
                          name="Experiments"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="models" 
                          stroke="hsl(var(--info))" 
                          fillOpacity={1} 
                          fill="url(#colorModelsLarge)" 
                          strokeWidth={3}
                          name="Models"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="deployments" 
                          stroke="hsl(var(--success))" 
                          fillOpacity={1} 
                          fill="url(#colorDeploymentsLarge)" 
                          strokeWidth={3}
                          name="Deployments"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </TabsContent>

          {/* Experiments Tab */}
          <TabsContent value="experiments">
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <CardTitle className="text-sm">Experiments</CardTitle>
                <Button variant="premium" size="sm" onClick={() => setExperimentDialogOpen(true)}>
                  <Plus className="h-3 w-3 mr-1" />New Experiment
                </Button>
              </CardHeader>
              <CardContent className="pb-3">
                {experiments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4 text-sm">No experiments yet</p>
                ) : (
                  <>
                    <div className="space-y-2">
                      {paginatedExp.map((exp) => (
                        <Link key={exp.id} to={`/experiments/${exp.id}`}>
                          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <FlaskConical className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{exp.name}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{exp.author}</span>
                                  <span>•</span>
                                  <span>{exp.duration}</span>
                                  <span>•</span>
                                  <span>{exp.epochs} epochs</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">Accuracy</p>
                                <p className="text-sm font-mono font-bold">{exp.accuracy ? `${exp.accuracy}%` : '-'}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">Loss</p>
                                <p className="text-sm font-mono">{exp.loss ?? '-'}</p>
                              </div>
                              <Badge variant={getStatusColor(exp.status)} className="text-[10px] gap-1">
                                {getStatusIcon(exp.status)}
                                {exp.status}
                              </Badge>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                    {renderPaginationControls(expPage, expPages, setExpPage)}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Models Tab */}
          <TabsContent value="models">
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <CardTitle className="text-sm">Models</CardTitle>
                <Button variant="premium" size="sm"><Plus className="h-3 w-3 mr-1" />Register Model</Button>
              </CardHeader>
              <CardContent className="pb-3">
                {models.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4 text-sm">No models yet</p>
                ) : (
                  <>
                    <div className="space-y-2">
                      {paginatedModels.map((model) => (
                        <Link key={model.id} to={`/models/${model.id}`}>
                          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-info/10">
                                <Box className="h-4 w-4 text-info" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{model.name}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>v{model.latestVersion}</span>
                                  <span>•</span>
                                  <span>{model.framework}</span>
                                  <span>•</span>
                                  <span>{model.algorithm}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">Accuracy</p>
                                <p className="text-sm font-mono font-bold">{model.accuracy}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">Latency</p>
                                <p className="text-sm font-mono">{model.latency}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">Requests</p>
                                <p className="text-sm font-mono">{model.requests}</p>
                              </div>
                              <Badge 
                                variant={model.stage === "Production" ? "success" : model.stage === "Staging" ? "warning" : "secondary"} 
                                className="text-[10px]"
                              >
                                {model.stage}
                              </Badge>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                    {renderPaginationControls(modelPage, modelPages, setModelPage)}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pipelines Tab */}
          <TabsContent value="pipelines">
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <CardTitle className="text-sm">Pipelines</CardTitle>
                <Button variant="premium" size="sm" onClick={() => setPipelineDialogOpen(true)}>
                  <Plus className="h-3 w-3 mr-1" />New Pipeline
                </Button>
              </CardHeader>
              <CardContent className="pb-3">
                {pipelines.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4 text-sm">No pipelines yet</p>
                ) : (
                  <>
                    <div className="space-y-2">
                      {paginatedPipelines.map((pipeline) => (
                        <div key={pipeline.id} className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-purple-500/10">
                                <Workflow className="h-4 w-4 text-purple-400" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{pipeline.name}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Badge variant="outline" className="text-[9px]">{pipeline.type}</Badge>
                                  <span>•</span>
                                  <span>{pipeline.tool} v{pipeline.toolVersion}</span>
                                  <span>•</span>
                                  <span>v{pipeline.version}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">Schedule</p>
                                <p className="text-xs font-mono">{pipeline.schedule}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">Last Run</p>
                                <p className="text-xs">{pipeline.lastRun}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">Duration</p>
                                <p className="text-xs font-mono">{pipeline.duration}</p>
                              </div>
                              <Badge variant={getStatusColor(pipeline.status)} className="text-[10px] gap-1">
                                {getStatusIcon(pipeline.status)}
                                {pipeline.status}
                              </Badge>
                            </div>
                          </div>
                          {/* Pipeline Steps */}
                          <div className="mt-3 flex items-center gap-2">
                            {pipeline.steps.map((step, idx) => (
                              <div key={idx} className="flex items-center">
                                <div className={`px-2 py-1 rounded text-[9px] ${
                                  step.status === "completed" ? "bg-success/20 text-success" :
                                  step.status === "running" ? "bg-primary/20 text-primary" :
                                  step.status === "failed" ? "bg-destructive/20 text-destructive" :
                                  "bg-muted text-muted-foreground"
                                }`}>
                                  {step.name}
                                </div>
                                {idx < pipeline.steps.length - 1 && (
                                  <div className="w-4 h-px bg-border mx-1" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    {renderPaginationControls(pipelinePage, pipelinePages, setPipelinePage)}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Datasets Tab */}
          <TabsContent value="datasets">
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <CardTitle className="text-sm">Datasets</CardTitle>
                <Button variant="premium" size="sm"><Plus className="h-3 w-3 mr-1" />Add Dataset</Button>
              </CardHeader>
              <CardContent className="pb-3">
                {datasets.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4 text-sm">No datasets linked</p>
                ) : (
                  <div className="space-y-2">
                    {datasets.map((ds) => (
                      <div key={ds.id} className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-warning/10">
                              <Database className="h-4 w-4 text-warning" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{ds.name}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant="outline" className="text-[9px]">{ds.type}</Badge>
                                <span>•</span>
                                <span>{ds.records} records</span>
                                <span>•</span>
                                <span>{ds.size}</span>
                                <span>•</span>
                                <span>v{ds.version}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge variant={ds.classification === "Restricted" ? "destructive" : ds.classification === "Regulated" ? "warning" : "secondary"} className="text-[9px]">
                              {ds.classification}
                            </Badge>
                            {ds.pii && (
                              <Badge variant="destructive" className="text-[9px]">
                                <AlertTriangle className="h-2.5 w-2.5 mr-1" />PII
                              </Badge>
                            )}
                            <Badge variant={ds.quality > 95 ? "success" : ds.quality > 85 ? "warning" : "destructive"} className="text-[10px]">
                              Quality: {ds.quality}%
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 ml-12">{ds.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deployments Tab */}
          <TabsContent value="deployments">
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <CardTitle className="text-sm">Deployments</CardTitle>
                <Button variant="premium" size="sm" onClick={() => setDeployDialogOpen(true)} disabled={!canDeploy}>
                  <Rocket className="h-3 w-3 mr-1" />Deploy Model
                </Button>
              </CardHeader>
              <CardContent className="pb-3">
                {deployments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4 text-sm">No deployments yet</p>
                ) : (
                  <div className="space-y-2">
                    {deployments.map((dep) => (
                      <div key={dep.id} className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-success/10">
                              <Rocket className="h-4 w-4 text-success" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{dep.name}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant="outline" className="text-[9px] capitalize">{dep.environment}</Badge>
                                <span>•</span>
                                <span>{dep.region}</span>
                                <span>•</span>
                                <span>v{dep.version}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Replicas</p>
                              <p className="text-sm font-mono">{dep.scaling.current}/{dep.scaling.max}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Traffic</p>
                              <p className="text-sm font-mono">{dep.traffic}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Latency</p>
                              <p className="text-sm font-mono">{dep.latency}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Requests</p>
                              <p className="text-sm font-mono">{dep.requests}</p>
                            </div>
                            <Badge variant={getStatusColor(dep.status)} className="text-[10px] gap-1">
                              {getStatusIcon(dep.status === "healthy" ? "completed" : dep.status)}
                              {dep.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources">
            <div className="space-y-4">
              {/* Environment Selector */}
              <div className="flex items-center gap-2">
                {(["DEV", "STAGING", "PROD"] as const).map((env) => (
                  <Button
                    key={env}
                    variant={resourceEnv === env ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setResourceEnv(env)}
                    className="gap-1"
                  >
                    <Layers className="h-3 w-3" />
                    {env}
                  </Button>
                ))}
              </div>

              {/* Resource Cards */}
              <div className="grid grid-cols-5 gap-3">
                {[
                  { label: "CPU", used: currentEnvResources.cpu.used, total: currentEnvResources.cpu.total, unit: "cores", icon: Cpu, color: "primary" },
                  { label: "GPU", used: currentEnvResources.gpu.used, total: currentEnvResources.gpu.total, unit: "units", icon: Zap, color: "info" },
                  { label: "Memory", used: currentEnvResources.memory.used, total: currentEnvResources.memory.total, unit: "GB", icon: MemoryStick, color: "warning" },
                  { label: "Storage", used: currentEnvResources.storage.used, total: currentEnvResources.storage.total, unit: "GB", icon: HardDrive, color: "muted-foreground" },
                  { label: "Cost", used: currentEnvResources.cost, total: currentEnvResources.cost * 1.2, unit: "€", icon: DollarSign, color: "gold" },
                ].map((res, i) => {
                  const percentage = (res.used / res.total) * 100;
                  return (
                    <Card key={i} className="glass-card">
                      <CardContent className="py-3">
                        <div className="flex items-center justify-between mb-2">
                          <res.icon className={`h-4 w-4 text-${res.color}`} />
                          <Badge variant={percentage > 80 ? "destructive" : percentage > 60 ? "warning" : "success"} className="text-[9px]">
                            {percentage.toFixed(0)}%
                          </Badge>
                        </div>
                        <p className="text-lg font-bold">{res.used}/{res.total}</p>
                        <p className="text-[10px] text-muted-foreground">{res.label} ({res.unit})</p>
                        <Progress value={percentage} className="h-1 mt-2" />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="glass-card">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      Resource Utilization (24h) - {resourceEnv}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={generateResourceHistory()}>
                          <defs>
                            <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--warning))" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="gpuGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--info))" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(var(--info))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                          <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={9} interval={5} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={9} domain={[0, 100]} />
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                              fontSize: "11px",
                            }}
                          />
                          <Area type="monotone" dataKey="cpu" stroke="hsl(var(--primary))" fill="url(#cpuGrad)" name="CPU" />
                          <Area type="monotone" dataKey="memory" stroke="hsl(var(--warning))" fill="url(#memGrad)" name="Memory" />
                          <Area type="monotone" dataKey="gpu" stroke="hsl(var(--info))" fill="url(#gpuGrad)" name="GPU" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gold" />
                      Cost Breakdown - {resourceEnv}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={costBreakdown}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={75}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {costBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                              fontSize: "11px",
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: "10px" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team">
            <div className="grid grid-cols-2 gap-4">
              {/* Hierarchical Team Structure */}
              <Card className="glass-card">
                <CardHeader className="py-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Team Hierarchy
                  </CardTitle>
                  <Button variant="premium" size="sm" onClick={() => setInviteMemberDialogOpen(true)}>
                    <Plus className="h-3 w-3 mr-1" />Invite Member
                  </Button>
                </CardHeader>
                <CardContent className="pb-3">
                  {/* Level 1: Leadership */}
                  <div className="space-y-3">
                    <div className="border-l-2 border-gold pl-4">
                      <p className="text-xs text-gold font-semibold uppercase tracking-wider mb-2">Leadership</p>
                      <div className="space-y-2">
                        {project.team.filter(m => 
                          ['Project Lead', 'Product Owner', 'Tech Lead', 'Lead Data Scientist'].includes(m.role)
                        ).map((member, i) => (
                          <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-gold/5 border border-gold/20">
                            <div className="h-9 w-9 rounded-full bg-gold/20 flex items-center justify-center text-xs font-bold text-gold">
                              {member.initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{member.name}</p>
                              <p className="text-xs text-gold truncate">{member.role}</p>
                            </div>
                          </div>
                        ))}
                        {project.team.filter(m => 
                          ['Project Lead', 'Product Owner', 'Tech Lead', 'Lead Data Scientist'].includes(m.role)
                        ).length === 0 && (
                          <p className="text-xs text-muted-foreground italic">No leadership assigned</p>
                        )}
                      </div>
                    </div>

                    {/* Level 2: Team Members */}
                    <div className="border-l-2 border-primary pl-4">
                      <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-2">Team Members</p>
                      <div className="space-y-2">
                        {project.team.filter(m => 
                          !['Project Lead', 'Product Owner', 'Tech Lead', 'Lead Data Scientist'].includes(m.role)
                        ).map((member, i) => (
                          <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                            <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                              {member.initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{member.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{member.role}</p>
                            </div>
                          </div>
                        ))}
                        {project.team.filter(m => 
                          !['Project Lead', 'Product Owner', 'Tech Lead', 'Lead Data Scientist'].includes(m.role)
                        ).length === 0 && (
                          <p className="text-xs text-muted-foreground italic">No team members assigned</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Team List with Contact */}
              <Card className="glass-card">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Contact Directory</CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <ScrollArea className="h-[300px] pr-3">
                    <div className="space-y-2">
                      {project.team.map((member, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">
                            {member.initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{member.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{member.role}</p>
                            <a href={`mailto:${member.email}`} className="text-xs text-primary hover:underline truncate block">
                              {member.email}
                            </a>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
                            <a href={`mailto:${member.email}`}>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about">
            <div className="grid grid-cols-2 gap-4">
              <Card className="glass-card">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Project Description</CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <p className="text-sm text-muted-foreground">{project.description}</p>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Project Details</CardTitle>
                </CardHeader>
                <CardContent className="pb-3 space-y-2">
                  <div className="flex items-center justify-between p-2 rounded bg-muted/30">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <GitBranch className="h-3 w-3" />Repository
                    </span>
                    <a href="#" className="text-primary hover:underline text-xs">{project.gitRepo}</a>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-muted/30">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <GitCommit className="h-3 w-3" />Branch
                    </span>
                    <Badge variant="secondary" className="text-[10px]">{project.gitBranch}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-muted/30">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />Created
                    </span>
                    <span className="text-xs">{project.createdAt}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-muted/30">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />Last Activity
                    </span>
                    <span className="text-xs">{project.lastActivity}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-muted/30">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Tag className="h-3 w-3" />Tags
                    </span>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {project.tags.map((tag, i) => (
                        <Badge key={i} variant="outline" className="text-[9px]">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <DeployModelDialog open={deployDialogOpen} onOpenChange={setDeployDialogOpen} />
      <NewExperimentDialog 
        open={experimentDialogOpen} 
        onOpenChange={setExperimentDialogOpen} 
        projectId={project.id}
      />
      <CreatePipelineDialog open={pipelineDialogOpen} onOpenChange={setPipelineDialogOpen} />
      <InviteMemberDialog open={inviteMemberDialogOpen} onOpenChange={setInviteMemberDialogOpen} />
    </DashboardLayout>
  );
};

export default ProjectDetails;
