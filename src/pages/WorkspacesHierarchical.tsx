import { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Plus,
  Code2,
  Play,
  Square,
  MoreHorizontal,
  Clock,
  Cpu,
  HardDrive,
  Monitor,
  Zap,
  ExternalLink,
  FolderKanban,
  GitBranch,
  ChevronRight,
  ChevronDown,
  Folder,
  FileCode,
  Box,
  Activity,
  Eye,
  FlaskConical,
  Cog,
  Info,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { hierarchicalProjects, repositoryDescriptions, RepositoryType } from "@/data/hierarchicalModel";

type IDEType = "vscode" | "jupyter" | "rstudio";

const ideOptions: { id: IDEType; name: string; icon: string; recommended?: boolean }[] = [
  { id: "vscode", name: "VS Code", icon: "💻", recommended: true },
  { id: "jupyter", name: "JupyterLab", icon: "🪐" },
  { id: "rstudio", name: "RStudio", icon: "📊" },
];

const repoIcons: Record<RepositoryType, typeof Box> = {
  "ml-core": Box,
  "ml-training": FlaskConical,
  "ml-inference": Zap,
  "ml-monitoring": Activity,
  "ci-cd-shared": Cog,
  "docs": FileCode,
};

// Helper to get IDE info by type
const getIDEInfo = (ideType: IDEType) => {
  return ideOptions.find(i => i.id === ideType) || ideOptions[0];
};

const WorkspacesHierarchical = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedProjects, setExpandedProjects] = useState<string[]>(["hproj-001"]);
  const [expandedApproaches, setExpandedApproaches] = useState<string[]>(["approach-001"]);
  const [showStructureInfo, setShowStructureInfo] = useState(false);

  const toggleProject = (id: string) => {
    setExpandedProjects(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const toggleApproach = (id: string) => {
    setExpandedApproaches(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const filteredProjects = hierarchicalProjects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Workspaces</h1>
            <p className="text-muted-foreground mt-1">
              Hierarchical development environments organized by Project → Approach → Repository
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => setShowStructureInfo(!showStructureInfo)}>
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View structure explanation</TooltipContent>
            </Tooltip>
            <Button variant="premium">
              <Plus className="h-4 w-4 mr-2" />
              New Workspace
            </Button>
          </div>
        </div>

        {/* Structure Info Panel */}
        {showStructureInfo && (
          <Card className="glass-card border-gold/30 bg-gold/5">
            <CardContent className="py-4">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-gold/20">
                  <Layers className="h-5 w-5 text-gold" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-2">Workspace Organization Structure</h3>
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <FolderKanban className="h-4 w-4" />
                        <span className="font-medium">Project (Group)</span>
                      </div>
                      <p className="text-muted-foreground">Main usecase or business problem</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Folder className="h-4 w-4" />
                        <span className="font-medium">Approach (Sub-group)</span>
                      </div>
                      <p className="text-muted-foreground">Specific methodology or sub-problem</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <GitBranch className="h-4 w-4" />
                        <span className="font-medium">Repository</span>
                      </div>
                      <p className="text-muted-foreground">ml-core, ml-training, ml-inference, ml-monitoring</p>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowStructureInfo(false)}>
                  ✕
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Projects", value: hierarchicalProjects.length, icon: FolderKanban },
            { label: "Total Approaches", value: hierarchicalProjects.reduce((acc, p) => acc + p.approaches.length, 0), icon: Folder },
            { label: "Active Repositories", value: hierarchicalProjects.reduce((acc, p) => acc + p.approaches.reduce((a, app) => a + app.repositories.length, 0), 0), icon: GitBranch },
            { label: "Total Storage", value: "2.05 TB", icon: HardDrive },
          ].map((stat, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                    <p className="text-2xl font-bold font-display mt-1">{stat.value}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/10">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Project IDE Legend */}
        <Card className="glass-card">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Code2 className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Available IDEs:</span>
                <div className="flex items-center gap-2">
                  {ideOptions.map((ide) => (
                    <Badge key={ide.id} variant="outline" className="gap-2">
                      <span>{ide.icon}</span>
                      {ide.name}
                      {ide.recommended && (
                        <span className="text-[10px] text-gold">(Recommended)</span>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Each project uses its configured IDE (set during project creation)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted/50"
            />
          </div>
        </div>

        {/* Hierarchical Tree View */}
        <div className="space-y-4">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="glass-card overflow-hidden">
              {/* Project Level (Group) */}
              <Collapsible
                open={expandedProjects.includes(project.id)}
                onOpenChange={() => toggleProject(project.id)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-gold">
                          <FolderKanban className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Link 
                              to={`/projects/${project.id}`} 
                              className="font-semibold text-lg hover:text-primary hover:underline transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {project.name}
                            </Link>
                            <Badge variant="outline" className="text-xs">{project.code}</Badge>
                            <Badge variant={project.status === "active" ? "success" : "secondary"}>
                              {project.status}
                            </Badge>
                            <Badge variant="secondary" className="gap-1 text-xs">
                              <span>{getIDEInfo(project.preferredIDE).icon}</span>
                              {getIDEInfo(project.preferredIDE).name}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {project.approaches.length} approaches • {project.domain} / {project.subdomain}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right text-xs text-muted-foreground">
                          <p>Last activity: {project.lastActivity}</p>
                        </div>
                        {expandedProjects.includes(project.id) ? (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0 pb-4">
                    {/* Shared Repositories */}
                    <div className="mb-4 pl-6 border-l-2 border-gold/30">
                      <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Shared Resources</p>
                      <div className="flex items-center gap-2">
                        {[project.sharedRepository, project.docsRepository].map((repo) => (
                          <Tooltip key={repo.id}>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="sm" className="gap-2">
                                <GitBranch className="h-3 w-3" />
                                {repo.name}
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-medium">{repositoryDescriptions[repo.type].name}</p>
                              <p className="text-xs text-muted-foreground">{repo.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    </div>

                    <Separator className="my-4" />

                    {/* Approaches (Sub-groups) */}
                    <div className="space-y-3">
                      {project.approaches.map((approach) => (
                        <Collapsible
                          key={approach.id}
                          open={expandedApproaches.includes(approach.id)}
                          onOpenChange={() => toggleApproach(approach.id)}
                        >
                          <CollapsibleTrigger asChild>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="p-1.5 rounded bg-primary/10">
                                  <Folder className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{approach.name}</span>
                                    <Badge variant={
                                      approach.environment === "production" ? "success" :
                                      approach.environment === "staging" ? "warning" : "info"
                                    } className="text-[10px]">
                                      {approach.environment.toUpperCase()}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground">{approach.description}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {approach.repositories.length} repos
                                </span>
                                {expandedApproaches.includes(approach.id) ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                            </div>
                          </CollapsibleTrigger>

                          <CollapsibleContent>
                            <div className="mt-2 pl-8 grid grid-cols-2 gap-2">
                              {approach.repositories.map((repo) => {
                                const RepoIcon = repoIcons[repo.type] || GitBranch;
                                const repoInfo = repositoryDescriptions[repo.type];
                                
                                return (
                                  <div
                                    key={repo.id}
                                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-background hover:border-primary/30 transition-colors group"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="p-1.5 rounded bg-secondary">
                                        <RepoIcon className="h-4 w-4 text-muted-foreground" />
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium text-sm">{repo.name}</span>
                                          <Tooltip>
                                            <TooltipTrigger>
                                              <Info className="h-3 w-3 text-muted-foreground" />
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-xs">
                                              <p className="font-medium">{repoInfo.name}</p>
                                              <p className="text-xs text-muted-foreground">{repoInfo.description}</p>
                                              <div className="mt-2 text-xs">
                                                <p className="font-medium">Folders:</p>
                                                <p className="text-muted-foreground">{repoInfo.folders.join(", ")}</p>
                                              </div>
                                            </TooltipContent>
                                          </Tooltip>
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate max-w-48">
                                          {repo.lastCommit}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                          {repo.lastCommitAuthor} • {repo.lastCommitDate}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-7 w-7">
                                            <ExternalLink className="h-3 w-3" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Open in GitLab</TooltipContent>
                                      </Tooltip>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button variant="premium" size="icon" className="h-7 w-7">
                                            <Code2 className="h-3 w-3" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Open in {getIDEInfo(project.preferredIDE).name}</TooltipContent>
                                      </Tooltip>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default WorkspacesHierarchical;
