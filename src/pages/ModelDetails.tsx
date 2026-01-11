import { useState } from "react";
import { Link, useParams } from "react-router-dom";
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
  ArrowLeft,
  Rocket,
  GitBranch,
  Activity,
  Download,
  ExternalLink,
  Box,
  TrendingUp,
  BarChart3,
  Database,
  FolderKanban,
  FlaskConical,
  Info,
  Layers,
  AlertTriangle,
  Eye,
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
} from "recharts";
import { 
  getModelById, 
  getProjectById, 
  getExperimentById,
  getDatasetById,
  getDeploymentsByModel,
} from "@/data/platformData";
import { DatasetPreviewDialog } from "@/components/dialogs";

const performanceData = Array.from({ length: 12 }, (_, i) => ({
  hour: `${i * 2}:00`,
  accuracy: 90 + Math.random() * 2,
  latency: 20 + Math.random() * 10,
}));

const driftData = Array.from({ length: 7 }, (_, i) => ({
  day: `Day ${i + 1}`,
  featureDrift: Math.random() * 0.05,
  threshold: 0.1,
}));

const ModelDetails = () => {
  const { id } = useParams();
  const model = getModelById(id || "");
  const [selectedDataset, setSelectedDataset] = useState<any>(null);
  const [datasetDialogOpen, setDatasetDialogOpen] = useState(false);
  
  if (!model) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-xl font-bold text-foreground">Model Not Found</h2>
            <p className="text-muted-foreground mt-2">The model with ID {id} does not exist.</p>
            <Link to="/models"><Button className="mt-4">Back to Models</Button></Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const project = getProjectById(model.projectId);
  const deployments = getDeploymentsByModel(model.id);
  const datasets = model.datasetIds.map(id => getDatasetById(id)).filter(Boolean);
  const experiments = model.experimentIds.map(id => getExperimentById(id)).filter(Boolean);

  const handleDatasetClick = (ds: any) => {
    setSelectedDataset(ds);
    setDatasetDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy": case "Production": case "active": return "success";
      case "degraded": case "Staging": case "paused": return "warning";
      case "failed": return "destructive";
      default: return "secondary";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 animate-fade-in">
        {/* Compact Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Link to="/models">
              <Button variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft className="h-4 w-4" /></Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-display font-bold text-foreground">{model.name}</h1>
                <Badge variant={getStatusColor(model.stage)} className="text-[10px]">{model.stage}</Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><GitBranch className="h-3 w-3" />v{model.latestVersion}</span>
                <span className="flex items-center gap-1"><Box className="h-3 w-3" />{model.framework}</span>
                <span>by {model.author}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm"><Download className="h-3 w-3 mr-1" />Download</Button>
            <Button variant="premium" size="sm"><Rocket className="h-3 w-3 mr-1" />Deploy</Button>
          </div>
        </div>

        {/* Project Context */}
        <Card className="glass-card border-primary/20">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FolderKanban className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Parent Project</p>
                  <Link to={`/projects/${model.projectId}`} className="font-semibold text-sm hover:text-primary">
                    {project?.name || "Unknown Project"}
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span><FlaskConical className="h-3 w-3 inline mr-1" />{experiments.length} Experiments</span>
                <span><Database className="h-3 w-3 inline mr-1" />{datasets.length} Datasets</span>
                <span><Rocket className="h-3 w-3 inline mr-1" />{deployments.length} Deployments</span>
                <Link to={`/projects/${model.projectId}`}>
                  <Button variant="outline" size="sm" className="h-7 text-xs">View Project<ExternalLink className="h-3 w-3 ml-1" /></Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compact Stats */}
        <div className="grid grid-cols-5 gap-2">
          {[
            { label: "Accuracy", value: model.accuracy, icon: TrendingUp, color: "text-success", tooltip: "Model prediction accuracy" },
            { label: "Latency", value: model.latency, icon: Activity, color: "text-primary", tooltip: "Average inference latency" },
            { label: "Requests/Day", value: model.requests, icon: BarChart3, color: "text-info", tooltip: "Daily inference requests" },
            { label: "Versions", value: model.versions.toString(), icon: GitBranch, tooltip: "Total model versions" },
            { label: "Endpoints", value: model.endpoints.length.toString(), icon: Rocket, color: "text-gold", tooltip: "Active deployment endpoints" },
          ].map((stat, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="py-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 cursor-help">
                      <stat.icon className={`h-4 w-4 ${stat.color || "text-muted-foreground"}`} />
                      <div>
                        <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                        <p className="text-lg font-bold font-display">{stat.value}</p>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>{stat.tooltip}</TooltipContent>
                </Tooltip>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="performance" className="space-y-3">
          <TabsList className="bg-muted/50 p-1 h-auto flex-wrap">
            <TabsTrigger value="performance" className="text-xs gap-1"><Activity className="h-3 w-3" />Performance</TabsTrigger>
            <TabsTrigger value="relationships" className="text-xs gap-1"><Layers className="h-3 w-3" />Relationships</TabsTrigger>
            <TabsTrigger value="versions" className="text-xs gap-1"><GitBranch className="h-3 w-3" />Versions</TabsTrigger>
            <TabsTrigger value="drift" className="text-xs gap-1"><AlertTriangle className="h-3 w-3" />Drift</TabsTrigger>
            <TabsTrigger value="endpoints" className="text-xs gap-1"><Rocket className="h-3 w-3" />Endpoints</TabsTrigger>
          </TabsList>

          <TabsContent value="performance">
            <div className="grid grid-cols-2 gap-3">
              <Card className="glass-card">
                <CardHeader className="py-2"><CardTitle className="text-sm">Accuracy Over Time</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={performanceData}>
                        <defs>
                          <linearGradient id="accuracyGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} domain={[85, 95]} />
                        <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                        <Area type="monotone" dataKey="accuracy" stroke="hsl(var(--success))" fill="url(#accuracyGrad)" name="Accuracy %" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardHeader className="py-2"><CardTitle className="text-sm">Latency (ms)</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                        <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                        <Line type="monotone" dataKey="latency" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Latency" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="relationships">
            <div className="grid grid-cols-2 gap-3">
              <Card className="glass-card">
                <CardHeader className="py-2"><CardTitle className="text-sm flex items-center gap-2"><Database className="h-4 w-4" />Datasets ({datasets.length})</CardTitle></CardHeader>
                <CardContent className="pb-3">
                  {datasets.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No datasets linked</p>
                  ) : (
                    <div className="space-y-2">
                      {datasets.slice(0, 3).map((ds) => ds && (
                        <div 
                          key={ds.id} 
                          className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors group"
                          onClick={() => handleDatasetClick(ds)}
                        >
                          <div className="flex items-center gap-2">
                            <Database className="h-3 w-3 text-info" />
                            <div>
                              <p className="font-medium text-sm group-hover:text-info transition-colors">{ds.name}</p>
                              <p className="text-xs text-muted-foreground">{ds.records} records</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={ds.quality > 95 ? "success" : "warning"} className="text-[10px]">{ds.quality}%</Badge>
                            <Eye className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardHeader className="py-2"><CardTitle className="text-sm flex items-center gap-2"><FlaskConical className="h-4 w-4" />Experiments ({experiments.length})</CardTitle></CardHeader>
                <CardContent className="pb-3">
                  {experiments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No experiments linked</p>
                  ) : (
                    <div className="space-y-2">
                      {experiments.slice(0, 3).map((exp) => exp && (
                        <Link key={exp.id} to={`/experiments/${exp.id}`}>
                          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-2">
                              <FlaskConical className="h-3 w-3 text-gold" />
                              <div>
                                <p className="font-medium text-sm">{exp.name}</p>
                                <p className="text-xs text-muted-foreground">{exp.author}</p>
                              </div>
                            </div>
                            <Badge variant={exp.status === "completed" ? "success" : "secondary"} className="text-[10px]">{exp.status}</Badge>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="versions">
            <Card className="glass-card">
              <CardHeader className="py-2"><CardTitle className="text-sm">Version History</CardTitle></CardHeader>
              <CardContent className="pb-3">
                <div className="space-y-2">
                  {Array.from({ length: Math.min(4, model.versions) }, (_, i) => {
                    const version = Number(model.latestVersion) - i;
                    return (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2">
                          <GitBranch className="h-3 w-3 text-primary" />
                          <div>
                            <p className="font-medium text-sm">v{version}</p>
                            <p className="text-xs text-muted-foreground">{i === 0 ? "Latest" : `${i * 7} days ago`}</p>
                          </div>
                        </div>
                        <Badge variant={i === 0 ? "success" : "secondary"} className="text-[10px]">{i === 0 ? "Current" : "Archived"}</Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="drift">
            <Card className="glass-card">
              <CardHeader className="py-2"><CardTitle className="text-sm">Feature Drift Detection</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={driftData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                      <Line type="monotone" dataKey="featureDrift" stroke="hsl(var(--warning))" strokeWidth={2} name="Feature Drift" />
                      <Line type="monotone" dataKey="threshold" stroke="hsl(var(--destructive))" strokeDasharray="5 5" name="Threshold" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="endpoints">
            <Card className="glass-card">
              <CardHeader className="py-2"><CardTitle className="text-sm">Deployment Endpoints</CardTitle></CardHeader>
              <CardContent className="pb-3">
                {model.endpoints.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No endpoints configured</p>
                ) : (
                  <div className="space-y-2">
                    {model.endpoints.map((endpoint, i) => {
                      const endpointUrl = typeof endpoint === 'string' ? endpoint : (endpoint as any).name || String(endpoint);
                      return (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                          <div className="flex items-center gap-2">
                            <Rocket className="h-3 w-3 text-success" />
                            <code className="text-xs bg-muted px-2 py-1 rounded">{endpointUrl}</code>
                          </div>
                          <Button variant="ghost" size="sm" className="h-7"><ExternalLink className="h-3 w-3" /></Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <DatasetPreviewDialog
        open={datasetDialogOpen}
        onOpenChange={setDatasetDialogOpen}
        dataset={selectedDataset}
      />
    </DashboardLayout>
  );
};

export default ModelDetails;
