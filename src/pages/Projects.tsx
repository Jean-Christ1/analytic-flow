import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Search,
  Grid3X3,
  List,
  MoreHorizontal,
  FolderKanban,
  GitBranch,
  Users,
  Clock,
  FlaskConical,
  Box,
  Rocket,
  Star,
  DollarSign,
  Leaf,
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
import { projects } from "@/data/platformData";
import { useCurrency } from "@/contexts/CurrencyContext";

const ITEMS_PER_PAGE = 3;

const Projects = () => {
  const [searchParams] = useSearchParams();
  const filterParam = searchParams.get("filter");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const { formatCurrency } = useCurrency();

  // Apply filter from URL params
  const baseFilteredProjects = useMemo(() => {
    let filtered = [...projects];
    
    switch (filterParam) {
      case "recent":
        // Sort by last activity (most recent first)
        filtered = filtered.sort((a, b) => {
          const parseTime = (time: string) => {
            const num = parseInt(time);
            if (time.includes("hour")) return num;
            if (time.includes("day")) return num * 24;
            if (time.includes("week")) return num * 24 * 7;
            return num * 24 * 30; // months
          };
          return parseTime(a.lastActivity) - parseTime(b.lastActivity);
        }).slice(0, 6);
        break;
      case "favorites":
        filtered = filtered.filter(p => p.starred);
        break;
      case "templates":
        // For demo: show paused/completed projects as templates
        filtered = filtered.filter(p => p.status === "completed" || p.progress === 100);
        break;
    }
    
    return filtered;
  }, [filterParam]);

  const filteredProjects = baseFilteredProjects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "success";
      case "paused": return "warning";
      case "completed": return "info";
      default: return "secondary";
    }
  };

  const statusCounts = {
    all: projects.length,
    active: projects.filter(p => p.status === "active").length,
    paused: projects.filter(p => p.status === "paused").length,
    completed: projects.filter(p => p.status === "completed").length,
  };

  const totalCost = projects.reduce((sum, p) => sum + p.resources.monthlyCost, 0);
  const totalCarbon = projects.reduce((sum, p) => sum + p.resources.carbonEmissions, 0);

  return (
    <DashboardLayout>
      <div className="space-y-4 animate-fade-in">
        {/* Header - Compact */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">
              {filterParam === "recent" ? "Recent Projects" : 
               filterParam === "favorites" ? "Favorite Projects" : 
               filterParam === "templates" ? "Project Templates" : "Projects"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {filterParam === "recent" ? "Your recently accessed projects" : 
               filterParam === "favorites" ? "Your starred projects" : 
               filterParam === "templates" ? "Reusable project templates" : "Manage your ML projects"}
            </p>
          </div>
        </div>

        {/* Stats Row - Compact */}
        <div className="grid grid-cols-4 gap-3">
          <Card className="glass-card">
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <Tooltip>
                      <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                      <TooltipContent>All projects in your workspace</TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-xl font-bold">{projects.length}</p>
                </div>
                <div className="p-2 rounded-lg bg-primary/10">
                  <FolderKanban className="h-4 w-4 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Active</p>
                  <p className="text-xl font-bold text-success">{statusCounts.active}</p>
                </div>
                <div className="p-2 rounded-lg bg-success/10">
                  <Rocket className="h-4 w-4 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-xs text-muted-foreground">Monthly Cost</p>
                    <Tooltip>
                      <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                      <TooltipContent>Total infrastructure cost across all projects</TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-xl font-bold">{formatCurrency(totalCost)}</p>
                </div>
                <div className="p-2 rounded-lg bg-gold/10">
                  <DollarSign className="h-4 w-4 text-gold" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-xs text-muted-foreground">CO₂</p>
                    <Tooltip>
                      <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                      <TooltipContent>Monthly carbon emissions estimate</TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-xl font-bold">{totalCarbon} kg</p>
                </div>
                <div className="p-2 rounded-lg bg-success/10">
                  <Leaf className="h-4 w-4 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters - Compact */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-9 h-9 bg-muted/50"
            />
          </div>
          <Tabs value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
            <TabsList className="h-9">
              <TabsTrigger value="all" className="text-xs">All ({statusCounts.all})</TabsTrigger>
              <TabsTrigger value="active" className="text-xs">Active ({statusCounts.active})</TabsTrigger>
              <TabsTrigger value="paused" className="text-xs">Paused ({statusCounts.paused})</TabsTrigger>
              <TabsTrigger value="completed" className="text-xs">Done ({statusCounts.completed})</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center border rounded-lg p-0.5 bg-muted/50 ml-auto">
            <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" className="h-7 w-7" onClick={() => setViewMode("grid")}>
              <Grid3X3 className="h-3.5 w-3.5" />
            </Button>
            <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" className="h-7 w-7" onClick={() => setViewMode("list")}>
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Projects Grid - Limited Height */}
        <div className={viewMode === "grid" ? "grid grid-cols-3 gap-3" : "space-y-2"}>
          {paginatedProjects.map((project, index) => (
            <Link key={project.id} to={`/projects/${project.id}`}>
              <Card className="glass-card hover:border-primary/30 transition-all cursor-pointer group h-full">
                <CardContent className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-gradient-gold">
                        <FolderKanban className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-1">
                            {project.name}
                          </h3>
                          {project.starred && <Star className="h-3 w-3 text-gold fill-gold" />}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant={getStatusColor(project.status)} className="capitalize text-[10px] h-4">
                            {project.status}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <GitBranch className="h-2.5 w-2.5" />
                            {project.gitBranch}
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
                        <DropdownMenuItem>Edit Project</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">Archive</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>

                  {/* Stats */}
                  <div className="flex items-center gap-3 text-xs">
                    <Tooltip>
                      <TooltipTrigger className="flex items-center gap-1 text-muted-foreground">
                        <FlaskConical className="h-3 w-3" />
                        <span>{project.experimentIds.length}</span>
                      </TooltipTrigger>
                      <TooltipContent>Experiments</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger className="flex items-center gap-1 text-muted-foreground">
                        <Box className="h-3 w-3" />
                        <span>{project.modelIds.length}</span>
                      </TooltipTrigger>
                      <TooltipContent>Models</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger className="flex items-center gap-1 text-muted-foreground">
                        <Rocket className="h-3 w-3" />
                        <span>{project.deploymentIds.length}</span>
                      </TooltipTrigger>
                      <TooltipContent>Deployments</TooltipContent>
                    </Tooltip>
                    <span className="text-muted-foreground ml-auto">{formatCurrency(project.resources.monthlyCost)}/mo</span>
                  </div>

                  {/* Progress */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-1" />
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <div className="flex -space-x-1.5">
                        {project.team.slice(0, 3).map((member, i) => (
                          <div key={i} className="w-5 h-5 rounded-full bg-primary/20 border border-card flex items-center justify-center text-[8px] font-medium">
                            {member.initials}
                          </div>
                        ))}
                        {project.team.length > 3 && (
                          <div className="w-5 h-5 rounded-full bg-muted border border-card flex items-center justify-center text-[8px]">
                            +{project.team.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {project.lastActivity}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredProjects.length)} of {filteredProjects.length}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => (
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

export default Projects;
