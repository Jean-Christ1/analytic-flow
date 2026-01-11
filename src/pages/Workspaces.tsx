import { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const workspaces = [
  {
    id: "ws-001",
    name: "CV Model Development",
    type: "JupyterLab",
    status: "running",
    gpu: "NVIDIA A100",
    gpuCount: 2,
    cpu: 16,
    memory: 64,
    storage: 500,
    cpuUsage: 45,
    memoryUsage: 72,
    gpuUsage: 85,
    uptime: "4h 23m",
    owner: "Sarah Chen",
    lastAccess: "Active now",
  },
  {
    id: "ws-002",
    name: "NLP Experiments",
    type: "VS Code",
    status: "running",
    gpu: "NVIDIA T4",
    gpuCount: 1,
    cpu: 8,
    memory: 32,
    storage: 250,
    cpuUsage: 32,
    memoryUsage: 58,
    gpuUsage: 60,
    uptime: "2h 15m",
    owner: "John Doe",
    lastAccess: "5 min ago",
  },
  {
    id: "ws-003",
    name: "Data Analysis",
    type: "RStudio",
    status: "running",
    gpu: null,
    gpuCount: 0,
    cpu: 4,
    memory: 16,
    storage: 100,
    cpuUsage: 25,
    memoryUsage: 40,
    gpuUsage: 0,
    uptime: "1h 45m",
    owner: "Maria Kim",
    lastAccess: "30 min ago",
  },
  {
    id: "ws-004",
    name: "LLM Fine-tuning",
    type: "JupyterLab",
    status: "stopped",
    gpu: "NVIDIA A100",
    gpuCount: 4,
    cpu: 32,
    memory: 128,
    storage: 1000,
    cpuUsage: 0,
    memoryUsage: 0,
    gpuUsage: 0,
    uptime: "-",
    owner: "Alex Lee",
    lastAccess: "2 days ago",
  },
  {
    id: "ws-005",
    name: "Feature Engineering",
    type: "VS Code",
    status: "paused",
    gpu: null,
    gpuCount: 0,
    cpu: 8,
    memory: 32,
    storage: 200,
    cpuUsage: 0,
    memoryUsage: 15,
    gpuUsage: 0,
    uptime: "Paused",
    owner: "John Doe",
    lastAccess: "1 hour ago",
  },
];

const Workspaces = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredWorkspaces = workspaces.filter((ws) =>
    ws.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "success";
      case "paused":
        return "warning";
      case "stopped":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "JupyterLab":
        return "🪐";
      case "VS Code":
        return "💻";
      case "RStudio":
        return "📊";
      default:
        return "💻";
    }
  };

  const runningCount = workspaces.filter((ws) => ws.status === "running").length;
  const totalGPUs = workspaces.filter((ws) => ws.status === "running").reduce((acc, ws) => acc + ws.gpuCount, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Workspaces</h1>
            <p className="text-muted-foreground mt-1">
              Development environments for ML experimentation
            </p>
          </div>
          <Button variant="premium">
            <Plus className="h-4 w-4 mr-2" />
            New Workspace
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Workspaces", value: workspaces.length, icon: Code2 },
            { label: "Running", value: runningCount, icon: Play, color: "text-success" },
            { label: "Active GPUs", value: totalGPUs, icon: Zap, color: "text-gold" },
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
                    <stat.icon className={`h-5 w-5 ${stat.color || "text-primary"}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search workspaces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted/50"
            />
          </div>
        </div>

        {/* Workspaces Grid */}
        <div className="grid grid-cols-2 gap-4">
          {filteredWorkspaces.map((workspace, index) => (
            <Card
              key={workspace.id}
              className="glass-card hover:border-primary/30 transition-all duration-300 group"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-gold flex items-center justify-center text-xl">
                      {getTypeIcon(workspace.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{workspace.name}</h3>
                        <Badge variant={getStatusColor(workspace.status)} className="capitalize text-xs">
                          {workspace.status === "running" && (
                            <span className="mr-1 h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                          )}
                          {workspace.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {workspace.type} • {workspace.owner}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Open IDE</DropdownMenuItem>
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Clone Workspace</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {workspace.status === "running" ? (
                        <>
                          <DropdownMenuItem>Pause</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Stop</DropdownMenuItem>
                        </>
                      ) : (
                        <DropdownMenuItem>Start</DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Resources */}
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">CPU</p>
                    <p className="text-sm font-semibold">{workspace.cpu} cores</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Memory</p>
                    <p className="text-sm font-semibold">{workspace.memory} GB</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Storage</p>
                    <p className="text-sm font-semibold">{workspace.storage} GB</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">GPU</p>
                    <p className="text-sm font-semibold">{workspace.gpuCount > 0 ? `${workspace.gpuCount}x` : "None"}</p>
                  </div>
                </div>

                {/* Usage Bars */}
                {workspace.status === "running" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Cpu className="h-3 w-3" />
                        CPU Usage
                      </span>
                      <span>{workspace.cpuUsage}%</span>
                    </div>
                    <Progress value={workspace.cpuUsage} className="h-1" />
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Monitor className="h-3 w-3" />
                        Memory Usage
                      </span>
                      <span>{workspace.memoryUsage}%</span>
                    </div>
                    <Progress value={workspace.memoryUsage} className="h-1" />

                    {workspace.gpuCount > 0 && (
                      <>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            GPU Usage
                          </span>
                          <span>{workspace.gpuUsage}%</span>
                        </div>
                        <Progress value={workspace.gpuUsage} className="h-1" />
                      </>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {workspace.uptime !== "-" ? `Up ${workspace.uptime}` : "Stopped"}
                    </span>
                    <span>{workspace.lastAccess}</span>
                  </div>
                  {workspace.status === "running" ? (
                    <Button variant="premium" size="sm">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Open IDE
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm">
                      <Play className="h-3 w-3 mr-1" />
                      Start
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Workspaces;
