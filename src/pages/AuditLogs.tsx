import { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  History,
  Search,
  Download,
  User,
  Database,
  Box,
  Rocket,
  FolderKanban,
  Shield,
  Key,
  Clock,
  FileText,
  Activity,
  Info,
  ChevronLeft,
  ChevronRight,
  Settings,
} from "lucide-react";
import { projects } from "@/data/platformData";

const auditLogs = [
  { id: 1, timestamp: "2024-01-12 14:32:05", user: "alice.johnson@company.com", action: "model.deploy", resource: "fraud-detector-v4.2", resourceType: "model", project: "Fraud Detection", status: "success", ip: "10.0.1.45", details: "Deployed to production" },
  { id: 2, timestamp: "2024-01-12 14:28:12", user: "bob.smith@company.com", action: "dataset.access", resource: "customer-transactions-q4", resourceType: "dataset", project: "Fraud Detection", status: "success", ip: "10.0.1.89", details: "Downloaded dataset" },
  { id: 3, timestamp: "2024-01-12 14:15:33", user: "carol.white@company.com", action: "experiment.create", resource: "exp-hyperparameter-sweep", resourceType: "experiment", project: "Time Series", status: "success", ip: "10.0.1.23", details: "Created experiment" },
  { id: 4, timestamp: "2024-01-12 13:58:47", user: "david.lee@company.com", action: "user.invite", resource: "emma.wilson@company.com", resourceType: "user", project: null, status: "success", ip: "10.0.1.67", details: "Invited team member" },
  { id: 5, timestamp: "2024-01-12 13:45:21", user: "alice.johnson@company.com", action: "secret.rotate", resource: "aws-credentials-prod", resourceType: "secret", project: null, status: "success", ip: "10.0.1.45", details: "Rotated credentials" },
  { id: 6, timestamp: "2024-01-12 13:22:09", user: "system", action: "pipeline.complete", resource: "data-ingestion-daily", resourceType: "pipeline", project: "Customer Churn", status: "success", ip: "internal", details: "Pipeline completed" },
  { id: 7, timestamp: "2024-01-12 12:55:18", user: "bob.smith@company.com", action: "model.retrain", resource: "churn-predictor-v2", resourceType: "model", project: "Customer Churn", status: "success", ip: "10.0.1.89", details: "Initiated retraining" },
  { id: 8, timestamp: "2024-01-12 11:48:33", user: "unknown@external.com", action: "api.access", resource: "/api/v1/models", resourceType: "api", project: null, status: "blocked", ip: "185.234.12.34", details: "Access blocked" },
  { id: 9, timestamp: "2024-01-12 11:15:27", user: "david.lee@company.com", action: "workspace.create", resource: "jupyter-gpu-workspace", resourceType: "workspace", project: "Sentiment", status: "success", ip: "10.0.1.67", details: "Created workspace" },
  { id: 10, timestamp: "2024-01-12 10:30:44", user: "carol.white@company.com", action: "policy.update", resource: "data-retention-policy", resourceType: "policy", project: null, status: "success", ip: "10.0.1.23", details: "Updated policy" },
];

const ITEMS_PER_PAGE = 6;

const AuditLogs = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const getResourceIcon = (resourceType: string) => {
    switch (resourceType) {
      case "model": return <Box className="h-3.5 w-3.5" />;
      case "dataset": return <Database className="h-3.5 w-3.5" />;
      case "experiment": return <Activity className="h-3.5 w-3.5" />;
      case "user": return <User className="h-3.5 w-3.5" />;
      case "secret": return <Key className="h-3.5 w-3.5" />;
      case "pipeline": return <Settings className="h-3.5 w-3.5" />;
      case "policy": return <Shield className="h-3.5 w-3.5" />;
      case "workspace": return <FolderKanban className="h-3.5 w-3.5" />;
      case "api": return <Rocket className="h-3.5 w-3.5" />;
      default: return <FileText className="h-3.5 w-3.5" />;
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = searchQuery === "" || 
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = selectedProject === "all" || 
      (log.project && projects.find(p => p.id === selectedProject)?.name === log.project);
    const matchesTab = activeTab === "all" || 
      (activeTab === "success" && log.status === "success") ||
      (activeTab === "blocked" && log.status === "blocked") ||
      (activeTab === "security" && ["secret", "policy", "user"].includes(log.resourceType));
    return matchesSearch && matchesProject && matchesTab;
  });

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <DashboardLayout>
      <div className="space-y-4 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
              Audit Logs
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">Complete audit trail of all platform activities with 7-year retention for compliance.</p>
                </TooltipContent>
              </Tooltip>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="premium" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Report
            </Button>
          </div>
        </div>

        {/* Stats compacts */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total Events (24h)", value: "1,247", icon: History, tip: "All events in last 24 hours" },
            { label: "Unique Users", value: "48", icon: User, color: "text-success", tip: "Distinct users with activity" },
            { label: "Security Events", value: "12", icon: Shield, color: "text-warning", tip: "Security-related actions" },
            { label: "Blocked Actions", value: "3", icon: Shield, color: "text-destructive", tip: "Unauthorized attempts blocked" },
          ].map((stat, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      {stat.label}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent><p className="text-xs">{stat.tip}</p></TooltipContent>
                      </Tooltip>
                    </p>
                    <p className="text-xl font-bold font-display">{stat.value}</p>
                  </div>
                  <stat.icon className={`h-5 w-5 ${stat.color || "text-primary"}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs + Filters */}
        <div className="flex items-center justify-between gap-4">
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setCurrentPage(1); }}>
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="success">Success</TabsTrigger>
              <TabsTrigger value="blocked">Blocked</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-2">
            <div className="relative w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="pl-10 h-9"
              />
            </div>
            <Select value={selectedProject} onValueChange={(v) => { setSelectedProject(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-40 h-9">
                <SelectValue placeholder="Project" />
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

        {/* Logs List */}
        <Card className="glass-card">
          <CardContent className="p-3">
            <div className="space-y-2">
              {paginatedLogs.map((log) => (
                <div key={log.id} className="p-3 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded ${log.status === "blocked" ? "bg-destructive/20" : "bg-primary/20"}`}>
                        {getResourceIcon(log.resourceType)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-medium">{log.action}</span>
                          <Badge variant={log.status === "success" ? "success" : "destructive"} className="text-xs h-5">
                            {log.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {log.resource} • {log.details}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {log.timestamp.split(" ")[1]}
                      </div>
                      <p className="text-xs text-muted-foreground truncate max-w-32">{log.user}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredLogs.length)} of {filteredLogs.length}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => (
                  <Button
                    key={i + 1}
                    variant={currentPage === i + 1 ? "default" : "outline"}
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AuditLogs;