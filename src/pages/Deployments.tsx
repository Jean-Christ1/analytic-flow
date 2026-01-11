import { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  Rocket,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Globe,
  Cpu,
  MoreHorizontal,
  ArrowUpRight,
  Zap,
  FolderKanban,
  Box,
  Info,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { deployments, getModelById, getProjectById, projects } from "@/data/platformData";

const ITEMS_PER_PAGE = 6;

const Deployments = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredDeployments = deployments.filter((d) => {
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = projectFilter === "all" || d.projectId === projectFilter;
    const matchesStatus = statusFilter === "all" || d.status === statusFilter;
    return matchesSearch && matchesProject && matchesStatus;
  });

  const totalPages = Math.ceil(filteredDeployments.length / ITEMS_PER_PAGE);
  const paginatedDeployments = filteredDeployments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-4 w-4 text-success" />;
      case "degraded":
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "deploying":
        return <Zap className="h-4 w-4 text-info" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return "success";
      case "degraded":
        return "warning";
      case "failed":
        return "destructive";
      case "deploying":
        return "info";
      default:
        return "secondary";
    }
  };

  const healthyCounts = deployments.filter((d) => d.status === "healthy").length;
  const degradedCounts = deployments.filter((d) => d.status === "degraded").length;
  const failedCounts = deployments.filter((d) => d.status === "failed").length;

  const totalRequests = deployments.reduce((sum, d) => {
    const match = d.requests.match(/(\d+\.?\d*)([KMB]?)/);
    if (!match) return sum;
    const num = parseFloat(match[1]);
    const unit = match[2];
    const multiplier = unit === 'K' ? 1000 : unit === 'M' ? 1000000 : unit === 'B' ? 1000000000 : 1;
    return sum + (num * multiplier);
  }, 0);
  
  const formatRequests = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  const avgLatency = Math.round(deployments.reduce((sum, d) => sum + parseInt(d.latency), 0) / deployments.length);

  return (
    <DashboardLayout>
      <div className="space-y-4 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">Deployments</h1>
            <p className="text-sm text-muted-foreground">
              Monitor and manage your model endpoints
            </p>
          </div>
          <Button variant="premium" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Deployment
          </Button>
        </div>

        {/* Quick Stats - Compact */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total Endpoints", value: deployments.length, icon: Rocket, tooltip: "Number of active deployment endpoints" },
            { label: "Healthy", value: healthyCounts, icon: CheckCircle, color: "text-success", tooltip: "Endpoints running without issues" },
            { label: "Requests/day", value: formatRequests(totalRequests), icon: Activity, tooltip: "Total API requests across all endpoints" },
            { label: "Avg Latency", value: `${avgLatency}ms`, icon: TrendingUp, tooltip: "Average response time" },
          ].map((stat, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1 cursor-help">
                            {stat.label}
                            <Info className="h-3 w-3" />
                          </p>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">{stat.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <p className="text-xl font-bold font-display mt-0.5">{stat.value}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-primary/10">
                    <stat.icon className={`h-4 w-4 ${stat.color || "text-primary"}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs for filtering by status */}
        <Tabs defaultValue="all" onValueChange={setStatusFilter} className="w-full">
          <div className="flex items-center justify-between gap-4">
            <TabsList className="h-9">
              <TabsTrigger value="all" className="text-xs">
                All ({deployments.length})
              </TabsTrigger>
              <TabsTrigger value="healthy" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1 text-success" />
                Healthy ({healthyCounts})
              </TabsTrigger>
              <TabsTrigger value="degraded" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1 text-warning" />
                Degraded ({degradedCounts})
              </TabsTrigger>
              <TabsTrigger value="failed" className="text-xs">
                <XCircle className="h-3 w-3 mr-1 text-destructive" />
                Failed ({failedCounts})
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search deployments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 bg-muted/50 text-sm"
                />
              </div>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-[180px] h-9 text-sm bg-muted/50">
                  <SelectValue placeholder="Filter by Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((proj) => (
                    <SelectItem key={proj.id} value={proj.id}>{proj.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value="all" className="mt-4">
            <DeploymentsList deployments={paginatedDeployments} getStatusIcon={getStatusIcon} getStatusBadge={getStatusBadge} />
          </TabsContent>
          <TabsContent value="healthy" className="mt-4">
            <DeploymentsList deployments={paginatedDeployments} getStatusIcon={getStatusIcon} getStatusBadge={getStatusBadge} />
          </TabsContent>
          <TabsContent value="degraded" className="mt-4">
            <DeploymentsList deployments={paginatedDeployments} getStatusIcon={getStatusIcon} getStatusBadge={getStatusBadge} />
          </TabsContent>
          <TabsContent value="failed" className="mt-4">
            <DeploymentsList deployments={paginatedDeployments} getStatusIcon={getStatusIcon} getStatusBadge={getStatusBadge} />
          </TabsContent>
        </Tabs>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-muted-foreground">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredDeployments.length)} of {filteredDeployments.length}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => (
                <Button key={i + 1} variant={currentPage === i + 1 ? "secondary" : "ghost"} size="icon" className="h-7 w-7 text-xs" onClick={() => setCurrentPage(i + 1)}>
                  {i + 1}
                </Button>
              ))}
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

const DeploymentsList = ({ 
  deployments, 
  getStatusIcon, 
  getStatusBadge 
}: { 
  deployments: typeof import("@/data/platformData").deployments;
  getStatusIcon: (status: string) => JSX.Element;
  getStatusBadge: (status: string) => string;
}) => {
  if (deployments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground text-sm">No deployments found matching your filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {deployments.map((deployment, index) => {
        const model = getModelById(deployment.modelId);
        const project = getProjectById(deployment.projectId);
        
        return (
          <Card
            key={deployment.id}
            className="glass-card hover:border-primary/30 transition-all duration-300 cursor-pointer group"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between">
                {/* Left: Status and Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {getStatusIcon(deployment.status)}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                        {deployment.name}
                      </h3>
                      <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      <Link to={`/models/${deployment.modelId}`} className="flex items-center gap-1 hover:text-primary">
                        <Box className="h-3 w-3" />
                        {model?.name || deployment.modelId}
                      </Link>
                      <span>•</span>
                      <Link to={`/projects/${deployment.projectId}`} className="flex items-center gap-1 hover:text-primary">
                        <FolderKanban className="h-3 w-3" />
                        {project?.name || deployment.projectId}
                      </Link>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {deployment.region}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Middle: Metrics */}
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm font-semibold">{deployment.requests}</p>
                    <p className="text-xs text-muted-foreground">Traffic</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold">{deployment.latency}</p>
                    <p className="text-xs text-muted-foreground">Latency</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold">{deployment.replicas}</p>
                    <p className="text-xs text-muted-foreground">Replicas</p>
                  </div>
                  <div className="w-24">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Cpu className="h-3 w-3" />
                        CPU
                      </span>
                      <span>{deployment.scaling.current}/{deployment.scaling.max}</span>
                    </div>
                    <Progress value={(deployment.scaling.current / deployment.scaling.max) * 100} className="h-1" />
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 ml-4">
                  <Badge variant={getStatusBadge(deployment.status) as any} className="text-xs capitalize">
                    {deployment.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {deployment.updatedAt}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/models/${deployment.modelId}`}>View Model</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={`/projects/${deployment.projectId}`}>View Project</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>View Logs</DropdownMenuItem>
                      <DropdownMenuItem>Scale Replicas</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Rollback</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Stop</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      
    </div>
  );
};

export default Deployments;
