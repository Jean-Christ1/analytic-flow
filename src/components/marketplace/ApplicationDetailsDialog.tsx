import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Package,
  Star,
  Download,
  Clock,
  Users,
  GitBranch,
  ExternalLink,
  CheckCircle2,
  Server,
  Cpu,
  MemoryStick,
  HardDrive,
  Activity,
  AlertTriangle,
  Info,
  FileText,
  Shield,
  Zap,
  Globe,
  Calendar,
  Tag,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ApplicationDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  app: {
    id: string;
    name: string;
    description: string;
    category: string;
    icon: string;
    version: string;
    status: string;
    tags: string[];
    stars: string;
    downloads?: string;
    lastUpdated?: string;
  } | null;
  onInstall?: () => void;
  onStart?: () => void;
  onStop?: () => void;
}

const usageData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  cpu: 20 + Math.random() * 30,
  memory: 30 + Math.random() * 25,
}));

const changelogData = [
  { version: "2.10.0", date: "2024-01-10", changes: ["Added new API endpoints", "Performance improvements", "Bug fixes"] },
  { version: "2.9.5", date: "2024-01-05", changes: ["Security patches", "Documentation updates"] },
  { version: "2.9.4", date: "2023-12-20", changes: ["Fixed memory leak", "Improved error handling"] },
  { version: "2.9.3", date: "2023-12-15", changes: ["New dashboard features", "UI improvements"] },
];

const dependencies = [
  { name: "PostgreSQL", version: "16.x", required: true },
  { name: "Redis", version: "7.x", required: false },
  { name: "MinIO", version: "latest", required: true },
];

export const ApplicationDetailsDialog = ({
  open,
  onOpenChange,
  app,
  onInstall,
  onStart,
  onStop,
}: ApplicationDetailsDialogProps) => {
  const [activeTab, setActiveTab] = useState("overview");

  if (!app) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <span className="text-4xl">{app.icon}</span>
            <div className="flex-1">
              <DialogTitle className="flex items-center gap-2">
                {app.name}
                <Badge variant={app.status === "running" ? "success" : app.status === "installed" ? "info" : "secondary"}>
                  {app.status}
                </Badge>
              </DialogTitle>
              <DialogDescription className="mt-1">
                {app.description}
              </DialogDescription>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-gold text-gold" />
                  {app.stars}
                </span>
                <span className="flex items-center gap-1">
                  <Download className="h-3 w-3" />
                  {app.downloads || "1.2M"}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Updated: {app.lastUpdated || "2024-01-10"}
                </span>
                <span className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  v{app.version}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-1" />
                Docs
              </Button>
              {app.status === "available" ? (
                <Button size="sm" variant="premium" onClick={onInstall}>
                  <Download className="h-4 w-4 mr-1" />
                  Install
                </Button>
              ) : app.status === "running" ? (
                <Button size="sm" variant="outline" onClick={onStop}>
                  Stop
                </Button>
              ) : (
                <Button size="sm" onClick={onStart}>
                  Start
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="overview" className="text-xs">
              <Info className="h-3 w-3 mr-1" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="resources" className="text-xs">
              <Activity className="h-3 w-3 mr-1" />
              Resources
            </TabsTrigger>
            <TabsTrigger value="dependencies" className="text-xs">
              <Package className="h-3 w-3 mr-1" />
              Dependencies
            </TabsTrigger>
            <TabsTrigger value="changelog" className="text-xs">
              <GitBranch className="h-3 w-3 mr-1" />
              Changelog
            </TabsTrigger>
            <TabsTrigger value="security" className="text-xs">
              <Shield className="h-3 w-3 mr-1" />
              Security
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px] mt-4">
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4 pr-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="glass-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Application Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category</span>
                      <Badge variant="outline">{app.category}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Version</span>
                      <span className="font-mono">{app.version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">License</span>
                      <span>Apache 2.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Maintainer</span>
                      <span>Official</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Requirements</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Cpu className="h-3 w-3" /> CPU
                      </span>
                      <span>0.5 - 2 cores</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <MemoryStick className="h-3 w-3" /> Memory
                      </span>
                      <span>1 - 4 GB</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <HardDrive className="h-3 w-3" /> Storage
                      </span>
                      <span>5 - 20 GB</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Globe className="h-3 w-3" /> Network
                      </span>
                      <span>HTTP/HTTPS</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {["Experiment Tracking", "Model Registry", "Artifact Storage", "REST API", "Dashboard UI", "Multi-user Support", "Authentication", "RBAC"].map((feature, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {app.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                    <Badge variant="secondary" className="text-xs">MLOps</Badge>
                    <Badge variant="secondary" className="text-xs">Open Source</Badge>
                    <Badge variant="secondary" className="text-xs">Python</Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Resources Tab */}
            <TabsContent value="resources" className="space-y-4 pr-4">
              <div className="grid grid-cols-3 gap-3">
                <Card className="glass-card">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Cpu className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">CPU Usage</span>
                    </div>
                    <p className="text-2xl font-bold">0.8 cores</p>
                    <p className="text-xs text-muted-foreground">of 2 cores allocated</p>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MemoryStick className="h-4 w-4 text-info" />
                      <span className="text-sm font-medium">Memory</span>
                    </div>
                    <p className="text-2xl font-bold">1.8 GB</p>
                    <p className="text-xs text-muted-foreground">of 4 GB allocated</p>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <HardDrive className="h-4 w-4 text-warning" />
                      <span className="text-sm font-medium">Storage</span>
                    </div>
                    <p className="text-2xl font-bold">8.5 GB</p>
                    <p className="text-xs text-muted-foreground">of 20 GB allocated</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    Resource Usage (24h)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={usageData}>
                        <defs>
                          <linearGradient id="cpuGradDetail" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="memGradDetail" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--info))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--info))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={10} interval={3} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => [`${value.toFixed(1)}%`, ""]}
                        />
                        <Area type="monotone" dataKey="cpu" stroke="hsl(var(--primary))" fill="url(#cpuGradDetail)" name="CPU" />
                        <Area type="monotone" dataKey="memory" stroke="hsl(var(--info))" fill="url(#memGradDetail)" name="Memory" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Dependencies Tab */}
            <TabsContent value="dependencies" className="space-y-4 pr-4">
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Required Dependencies</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dependencies.map((dep, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                        <div className="flex items-center gap-3">
                          <Package className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium text-sm">{dep.name}</p>
                            <p className="text-xs text-muted-foreground">Version: {dep.version}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {dep.required ? (
                            <Badge variant="destructive" className="text-xs">Required</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Optional</Badge>
                          )}
                          <Badge variant="success" className="text-xs">Installed</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-warning/30">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Dependency Check</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        All required dependencies are installed and running. The application is ready to use.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Changelog Tab */}
            <TabsContent value="changelog" className="space-y-4 pr-4">
              {changelogData.map((release, i) => (
                <Card key={i} className="glass-card">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <GitBranch className="h-4 w-4 text-primary" />
                        v{release.version}
                      </CardTitle>
                      <span className="text-xs text-muted-foreground">{release.date}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {release.changes.map((change, j) => (
                        <li key={j} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-3 w-3 text-success" />
                          {change}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-4 pr-4">
              <Card className="glass-card border-success/30">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-success mt-0.5" />
                    <div>
                      <p className="font-medium text-sm text-success">Security Scan Passed</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        No vulnerabilities detected. Last scan: 2024-01-15
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Card className="glass-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Security Features</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <span>TLS 1.3 Encryption</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <span>RBAC Support</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <span>Audit Logging</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <span>Secret Management</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Compliance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <span>SOC 2 Compatible</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <span>GDPR Ready</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <span>HIPAA Compatible</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <span>AI Act Ready</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">CVE Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-3 text-center">
                    <div className="p-3 rounded-lg bg-success/10">
                      <p className="text-2xl font-bold text-success">0</p>
                      <p className="text-xs text-muted-foreground">Critical</p>
                    </div>
                    <div className="p-3 rounded-lg bg-success/10">
                      <p className="text-2xl font-bold text-success">0</p>
                      <p className="text-xs text-muted-foreground">High</p>
                    </div>
                    <div className="p-3 rounded-lg bg-warning/10">
                      <p className="text-2xl font-bold text-warning">2</p>
                      <p className="text-xs text-muted-foreground">Medium</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30">
                      <p className="text-2xl font-bold text-muted-foreground">5</p>
                      <p className="text-xs text-muted-foreground">Low</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ApplicationDetailsDialog;
