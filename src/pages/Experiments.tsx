import { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  GitCompare, 
  MoreHorizontal, 
  Play, 
  Trash2, 
  Eye,
  TrendingUp,
  TrendingDown,
  Clock,
  Beaker,
  Plus,
  Check,
  FolderKanban,
  ChevronLeft,
  ChevronRight,
  Info,
  LayoutGrid,
  List,
  ChevronDown,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { LineChart, Line, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { cn } from "@/lib/utils";
import { experiments, projects, getProjectById } from "@/data/platformData";
import { NewExperimentDialog } from "@/components/dialogs";

// Mini sparkline component for accuracy trend
const AccuracySparkline = ({ data }: { data: { accuracy: number; name: string }[] }) => {
  if (data.length < 2) return null;
  
  return (
    <div className="w-24 h-8">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <RechartsTooltip 
            contentStyle={{ 
              background: 'hsl(var(--card))', 
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
              fontSize: '10px',
              padding: '4px 8px'
            }}
            labelStyle={{ display: 'none' }}
            formatter={(value: number) => [`${value.toFixed(1)}%`, 'Accuracy']}
          />
          <Line 
            type="monotone" 
            dataKey="accuracy" 
            stroke="hsl(var(--primary))" 
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, fill: 'hsl(var(--primary))' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const ITEMS_PER_PAGE = 4;

const statusConfig = {
  completed: { label: "Completed", variant: "success" as const, icon: Check },
  running: { label: "Running", variant: "info" as const, icon: Play },
  failed: { label: "Failed", variant: "destructive" as const, icon: Trash2 },
  queued: { label: "Queued", variant: "warning" as const, icon: Clock },
};

const Experiments = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showNewExperiment, setShowNewExperiment] = useState(false);
  const [viewMode, setViewMode] = useState<"project" | "table">("project");
  const [expandedProjects, setExpandedProjects] = useState<string[]>([]);

  const projectOptions = [...new Set(experiments.map(e => e.projectId))].map(pid => {
    const proj = getProjectById(pid);
    return { id: pid, name: proj?.name || pid };
  });

  const filteredExperiments = experiments.filter(exp => {
    const project = getProjectById(exp.projectId);
    const matchesSearch = exp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || exp.status === statusFilter;
    const matchesProject = projectFilter === "all" || exp.projectId === projectFilter;
    return matchesSearch && matchesStatus && matchesProject;
  });

  const totalPages = Math.ceil(filteredExperiments.length / ITEMS_PER_PAGE);
  const paginatedExperiments = filteredExperiments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const statusCounts = {
    all: experiments.length,
    completed: experiments.filter(e => e.status === "completed").length,
    running: experiments.filter(e => e.status === "running").length,
    failed: experiments.filter(e => e.status === "failed").length,
  };

  // Group experiments by project
  const experimentsByProject = filteredExperiments.reduce((acc, exp) => {
    if (!acc[exp.projectId]) acc[exp.projectId] = [];
    acc[exp.projectId].push(exp);
    return acc;
  }, {} as Record<string, typeof experiments>);

  // Pagination for project view
  const projectEntries = Object.entries(experimentsByProject);
  const totalProjectPages = Math.ceil(projectEntries.length / ITEMS_PER_PAGE);
  const paginatedProjectEntries = projectEntries.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId) 
        : [...prev, projectId]
    );
  };

  const MetricCell = ({ value, format = "number" }: { value: number | null; format?: "number" | "percent" | "loss" }) => {
    if (value === null) return <span className="text-muted-foreground">-</span>;
    const isGood = format === "loss" ? value < 0.1 : value > 90;
    const TrendIcon = isGood ? TrendingUp : TrendingDown;
    return (
      <div className="flex items-center gap-1">
        <span className={isGood ? "text-success" : "text-muted-foreground"}>
          {format === "percent" ? `${value}%` : format === "loss" ? value.toFixed(4) : value.toFixed(1)}
        </span>
        <TrendIcon className={`h-3 w-3 ${isGood ? "text-success" : "text-destructive"}`} />
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 animate-fade-in">
        {/* Header - Compact */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">Experiments</h1>
            <p className="text-sm text-muted-foreground">Track and compare ML experiments</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/model-comparison">
              <Button variant="outline" size="sm" className="gap-2">
                <GitCompare className="h-3.5 w-3.5" />
                Compare
              </Button>
            </Link>
            <Button variant="premium" size="sm" className="gap-2" onClick={() => setShowNewExperiment(true)}>
              <Plus className="h-3.5 w-3.5" />
              New Experiment
            </Button>
          </div>
        </div>

        <NewExperimentDialog open={showNewExperiment} onOpenChange={setShowNewExperiment} />

        {/* Stats Row - Compact with all tooltips */}
        <div className="grid grid-cols-4 gap-3">
          <Card className="glass-card">
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <Tooltip>
                      <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                      <TooltipContent>All experiments in your workspace</TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-xl font-bold">{statusCounts.all}</p>
                </div>
                <div className="p-2 rounded-lg bg-primary/10">
                  <Beaker className="h-4 w-4 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-xs text-muted-foreground">Completed</p>
                    <Tooltip>
                      <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                      <TooltipContent>Successfully finished experiments</TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-xl font-bold text-success">{statusCounts.completed}</p>
                </div>
                <div className="p-2 rounded-lg bg-success/10">
                  <Check className="h-4 w-4 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-xs text-muted-foreground">Running</p>
                    <Tooltip>
                      <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                      <TooltipContent>Currently executing experiments</TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-xl font-bold text-info">{statusCounts.running}</p>
                </div>
                <div className="p-2 rounded-lg bg-info/10">
                  <Play className="h-4 w-4 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-xs text-muted-foreground">Failed</p>
                    <Tooltip>
                      <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                      <TooltipContent>Experiments with errors requiring attention</TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-xl font-bold text-destructive">{statusCounts.failed}</p>
                </div>
                <div className="p-2 rounded-lg bg-destructive/10">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters - Compact in Card */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search experiments..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-9 h-9 bg-muted/50"
            />
          </div>
          <Tabs value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
            <TabsList className="h-9">
              <TabsTrigger value="all" className="text-xs">All ({statusCounts.all})</TabsTrigger>
              <TabsTrigger value="completed" className="text-xs">Done ({statusCounts.completed})</TabsTrigger>
              <TabsTrigger value="running" className="text-xs">Running ({statusCounts.running})</TabsTrigger>
              <TabsTrigger value="failed" className="text-xs">Failed ({statusCounts.failed})</TabsTrigger>
            </TabsList>
          </Tabs>
          <Select value={projectFilter} onValueChange={(v) => { setProjectFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-[160px] h-9 bg-muted/50">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projectOptions.map(proj => (
                <SelectItem key={proj.id} value={proj.id}>{proj.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center border rounded-lg p-0.5 bg-muted/50 ml-auto">
            <Button 
              variant={viewMode === "project" ? "secondary" : "ghost"} 
              size="sm" 
              className="h-7 gap-1.5 text-xs"
              onClick={() => setViewMode("project")}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              By Project
            </Button>
            <Button 
              variant={viewMode === "table" ? "secondary" : "ghost"} 
              size="sm" 
              className="h-7 gap-1.5 text-xs"
              onClick={() => setViewMode("table")}
            >
              <List className="h-3.5 w-3.5" />
              Table
            </Button>
          </div>
        </div>

        {/* By Project View */}
        {viewMode === "project" && (
          <div className="space-y-2">
            {paginatedProjectEntries.map(([projectId, projectExperiments]) => {
              const project = getProjectById(projectId);
              const bestAccuracy = Math.max(...projectExperiments.map(e => e.accuracy || 0));
              const isExpanded = expandedProjects.includes(projectId);
              
              // Prepare sparkline data sorted by date
              const sparklineData = projectExperiments
                .filter(e => e.accuracy !== null)
                .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                .map(e => ({ accuracy: e.accuracy || 0, name: e.name }));
              
              return (
                <Collapsible key={projectId} open={isExpanded} onOpenChange={() => toggleProject(projectId)}>
                  <Card className="glass-card overflow-hidden">
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FolderKanban className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <Link 
                                to={`/projects/${projectId}`}
                                className="font-semibold text-sm hover:text-primary transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {project?.name || projectId}
                              </Link>
                              <Badge variant="secondary" className="text-[10px] h-5">
                                {projectExperiments.length} exp
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5 max-w-xl truncate">
                              {project?.description || "No description"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="hidden sm:block">
                            <AccuracySparkline data={sparklineData} />
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-muted-foreground">Best</p>
                            <p className="text-sm font-semibold text-success">{bestAccuracy.toFixed(1)}%</p>
                          </div>
                          <ChevronDown className={cn(
                            "h-4 w-4 text-muted-foreground transition-transform",
                            isExpanded && "rotate-180"
                          )} />
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="border-t border-border/50">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-border/50 hover:bg-transparent">
                              <TableHead className="w-[220px] py-2">Experiment</TableHead>
                              <TableHead className="py-2">Status</TableHead>
                              <TableHead className="text-right py-2">Accuracy</TableHead>
                              <TableHead className="text-right py-2">Loss</TableHead>
                              <TableHead className="py-2">Duration</TableHead>
                              <TableHead className="w-8 py-2"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {projectExperiments.slice(0, 3).map(experiment => {
                              const status = statusConfig[experiment.status as keyof typeof statusConfig];
                              const StatusIcon = status.icon;
                              return (
                                <TableRow key={experiment.id} className="border-border/30">
                                  <TableCell className="py-2">
                                    <Link to={`/experiments/${experiment.id}`}>
                                      <div className="flex items-center gap-2">
                                        <Beaker className="h-3.5 w-3.5 text-primary" />
                                        <span className="font-medium text-xs hover:text-primary transition-colors">{experiment.name}</span>
                                      </div>
                                    </Link>
                                  </TableCell>
                                  <TableCell className="py-2">
                                    <Badge variant={status.variant} className="gap-1 text-[10px] h-5">
                                      <StatusIcon className="h-2.5 w-2.5" />
                                      {status.label}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right font-mono text-xs py-2">
                                    <MetricCell value={experiment.accuracy} format="percent" />
                                  </TableCell>
                                  <TableCell className="text-right font-mono text-xs py-2">
                                    <MetricCell value={experiment.loss} format="loss" />
                                  </TableCell>
                                  <TableCell className="py-2">
                                    <span className="text-xs text-muted-foreground">{experiment.duration}</span>
                                  </TableCell>
                                  <TableCell className="py-2">
                                    <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                                      <Link to={`/experiments/${experiment.id}`}><Eye className="h-3 w-3" /></Link>
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                        {projectExperiments.length > 3 && (
                          <div className="px-3 py-2 border-t border-border/30 text-center">
                            <Link to={`/projects/${projectId}`} className="text-xs text-primary hover:underline">
                              View all {projectExperiments.length} experiments →
                            </Link>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}
          </div>
        )}

        {/* Table View */}
        {viewMode === "table" && (
          <Card className="glass-card">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="w-[250px]">Experiment</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">
                    <Tooltip>
                      <TooltipTrigger className="flex items-center gap-1 justify-end">Accuracy <Info className="h-3 w-3" /></TooltipTrigger>
                      <TooltipContent>Model accuracy on validation set</TooltipContent>
                    </Tooltip>
                  </TableHead>
                <TableHead className="text-right">Loss</TableHead>
                <TableHead className="text-right">F1</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedExperiments.map(experiment => {
                const status = statusConfig[experiment.status as keyof typeof statusConfig];
                const StatusIcon = status.icon;
                const project = getProjectById(experiment.projectId);

                return (
                  <TableRow key={experiment.id} className="border-border/30">
                    <TableCell>
                      <Link to={`/experiments/${experiment.id}`}>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center">
                            <Beaker className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm hover:text-primary transition-colors">{experiment.name}</p>
                            <p className="text-[10px] text-muted-foreground">{experiment.author}</p>
                          </div>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link to={`/projects/${experiment.projectId}`}>
                        <Badge variant="outline" className="font-normal gap-1 text-xs hover:bg-muted/50">
                          <FolderKanban className="h-2.5 w-2.5" />
                          {project?.name || experiment.projectId}
                        </Badge>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant} className="gap-1 text-xs">
                        <StatusIcon className="h-2.5 w-2.5" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      <MetricCell value={experiment.accuracy} format="percent" />
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      <MetricCell value={experiment.loss} format="loss" />
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      <MetricCell value={experiment.f1Score} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground text-xs">
                        <Clock className="h-3 w-3" />
                        {experiment.duration}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{experiment.createdAt}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem className="gap-2 text-xs" asChild>
                            <Link to={`/experiments/${experiment.id}`}><Eye className="h-3.5 w-3.5" />View</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-xs"><GitCompare className="h-3.5 w-3.5" />Compare</DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-destructive text-xs"><Trash2 className="h-3.5 w-3.5" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
        )}

        {/* Pagination */}
        {((viewMode === "project" && totalProjectPages > 1) || (viewMode === "table" && totalPages > 1)) && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              {viewMode === "project" 
                ? `Showing ${(currentPage - 1) * ITEMS_PER_PAGE + 1}-${Math.min(currentPage * ITEMS_PER_PAGE, projectEntries.length)} of ${projectEntries.length} projects`
                : `Showing ${(currentPage - 1) * ITEMS_PER_PAGE + 1}-${Math.min(currentPage * ITEMS_PER_PAGE, filteredExperiments.length)} of ${filteredExperiments.length}`
              }
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              {Array.from({ length: viewMode === "project" ? totalProjectPages : totalPages }, (_, i) => (
                <Button
                  key={i + 1}
                  variant={currentPage === i + 1 ? "secondary" : "ghost"}
                  size="icon"
                  className="h-7 w-7 text-xs"
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCurrentPage(p => Math.min(viewMode === "project" ? totalProjectPages : totalPages, p + 1))} disabled={currentPage === (viewMode === "project" ? totalProjectPages : totalPages)}>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Experiments;
