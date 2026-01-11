import { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Search,
  Plus,
  Upload,
  Box,
  TrendingUp,
  Clock,
  Activity,
  Rocket,
  MoreHorizontal,
  ArrowUpRight,
  GitBranch,
  FolderKanban,
  Layers,
  LayoutGrid,
  GitCompare,
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
import { models, getProjectById } from "@/data/platformData";
import { ModelVersionRegistry } from "@/components/model/ModelVersionRegistry";

const ITEMS_PER_PAGE = 4;

const Models = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStage, setActiveStage] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "registry">("grid");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredModels = models.filter((model) => {
    const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = activeStage === "all" || model.stage.toLowerCase() === activeStage.toLowerCase();
    return matchesSearch && matchesStage;
  });

  const totalPages = Math.ceil(filteredModels.length / ITEMS_PER_PAGE);
  const paginatedModels = filteredModels.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "Production": return "success";
      case "Staging": return "warning";
      case "Development": return "info";
      default: return "secondary";
    }
  };

  const stageCounts = {
    all: models.length,
    production: models.filter((m) => m.stage === "Production").length,
    staging: models.filter((m) => m.stage === "Staging").length,
    development: models.filter((m) => m.stage === "Development").length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 animate-fade-in">
        {/* Header - Compact */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">Model Registry</h1>
            <p className="text-sm text-muted-foreground">Manage ML models</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-0.5 bg-muted/50 rounded-lg">
              <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("grid")} className="h-7 text-xs">
                <LayoutGrid className="h-3.5 w-3.5 mr-1" />Grid
              </Button>
              <Button variant={viewMode === "registry" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("registry")} className="h-7 text-xs">
                <Layers className="h-3.5 w-3.5 mr-1" />Registry
              </Button>
            </div>
            <Link to="/models/compare">
              <Button variant="outline" size="sm" className="h-8">
                <GitCompare className="h-3.5 w-3.5 mr-1" />Compare
              </Button>
            </Link>
            <Button variant="outline" size="sm" className="h-8">
              <Upload className="h-3.5 w-3.5 mr-1" />Import
            </Button>
            <Button variant="premium" size="sm" className="h-8">
              <Plus className="h-3.5 w-3.5 mr-1" />Register
            </Button>
          </div>
        </div>

        {/* Stats - Compact */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total Models", value: models.length, icon: Box, tooltip: "All registered models" },
            { label: "In Production", value: stageCounts.production, icon: Rocket, tooltip: "Models serving traffic" },
            { label: "Daily Requests", value: "7.4M", icon: Activity, tooltip: "Inference requests per day" },
            { label: "Avg Latency", value: "15ms", icon: TrendingUp, tooltip: "P50 inference latency" },
          ].map((stat, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <Tooltip>
                        <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                        <TooltipContent>{stat.tooltip}</TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-xl font-bold mt-0.5">{stat.value}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-primary/10">
                    <stat.icon className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {viewMode === "grid" ? (
          <>
            {/* Filters - Compact */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search models..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="pl-9 h-9 bg-muted/50"
                />
              </div>
              <Tabs value={activeStage} onValueChange={(v) => { setActiveStage(v); setCurrentPage(1); }}>
                <TabsList className="h-9">
                  <TabsTrigger value="all" className="text-xs">All ({stageCounts.all})</TabsTrigger>
                  <TabsTrigger value="production" className="text-xs">Prod ({stageCounts.production})</TabsTrigger>
                  <TabsTrigger value="staging" className="text-xs">Stage ({stageCounts.staging})</TabsTrigger>
                  <TabsTrigger value="development" className="text-xs">Dev ({stageCounts.development})</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Models Grid */}
            <div className="grid grid-cols-2 gap-3">
              {paginatedModels.map((model, index) => {
                const project = getProjectById(model.projectId);
                
                return (
                  <Link key={model.id} to={`/models/${model.id}`}>
                    <Card className="glass-card hover:border-primary/30 transition-all cursor-pointer group h-full">
                      <CardHeader className="pb-2 pt-4 px-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-gradient-gold">
                              <Box className="h-4 w-4 text-primary-foreground" />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                                  {model.name}
                                </h3>
                                <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <Badge variant={getStageColor(model.stage)} className="text-[10px] h-4">
                                  {model.stage}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                  <GitBranch className="h-2.5 w-2.5" />v{model.latestVersion}
                                </span>
                              </div>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>View Details</DropdownMenuItem>
                              <DropdownMenuItem>Compare Versions</DropdownMenuItem>
                              <DropdownMenuItem>Deploy Model</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">Archive</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 px-4 pb-4">
                        <p className="text-xs text-muted-foreground line-clamp-1">{model.description}</p>

                        {/* Project Link */}
                        <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-muted/30">
                          <FolderKanban className="h-3 w-3 text-primary" />
                          <span className="text-xs font-medium">{project?.name || 'Unknown'}</span>
                        </div>

                        {/* Metrics */}
                        <div className="grid grid-cols-4 gap-2">
                          <Tooltip>
                            <TooltipTrigger className="text-center p-1.5 rounded-lg bg-muted/30">
                              <p className="text-[10px] text-muted-foreground">Accuracy</p>
                              <p className="text-xs font-semibold text-success">{model.accuracy}</p>
                            </TooltipTrigger>
                            <TooltipContent>Model accuracy on test set</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger className="text-center p-1.5 rounded-lg bg-muted/30">
                              <p className="text-[10px] text-muted-foreground">Latency</p>
                              <p className="text-xs font-semibold">{model.latency}</p>
                            </TooltipTrigger>
                            <TooltipContent>P50 inference latency</TooltipContent>
                          </Tooltip>
                          <div className="text-center p-1.5 rounded-lg bg-muted/30">
                            <p className="text-[10px] text-muted-foreground">Versions</p>
                            <p className="text-xs font-semibold">{model.versions}</p>
                          </div>
                          <div className="text-center p-1.5 rounded-lg bg-muted/30">
                            <p className="text-[10px] text-muted-foreground">Deploys</p>
                            <p className="text-xs font-semibold">{model.deployments}</p>
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Box className="h-2.5 w-2.5" />{model.framework}
                          </span>
                          <span>by {model.author}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />{model.lastUpdated}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredModels.length)} of {filteredModels.length}
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
          </>
        ) : (
          <ModelVersionRegistry />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Models;
