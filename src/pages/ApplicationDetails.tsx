import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { BackupRestoreDialog } from "@/components/marketplace/BackupRestoreDialog";
import { 
  ArrowLeft, Play, Square, RotateCcw, Trash2, Download,
  Terminal, Settings, TrendingUp, Package, Clock, Cpu, 
  HardDrive, Activity, AlertTriangle, CheckCircle, Info,
  Save, RefreshCw, ChevronUp, Archive
} from "lucide-react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const generateMetricsData = () => {
  return Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    cpu: Math.random() * 60 + 20,
    memory: Math.random() * 40 + 30,
    requests: Math.floor(Math.random() * 1000 + 200),
    latency: Math.random() * 50 + 10,
  }));
};

const generateLogs = () => {
  const levels = ['INFO', 'DEBUG', 'WARN', 'ERROR'];
  const messages = [
    'Application started successfully',
    'Processing incoming request',
    'Database connection established',
    'Cache hit for key: user_session_123',
    'Metrics exported to Prometheus',
    'Health check passed',
    'Configuration reloaded',
    'Worker thread spawned',
    'Request completed in 45ms',
    'Memory usage within limits',
    'Connection pool: 8/20 active',
    'Scheduled task executed',
  ];
  
  return Array.from({ length: 50 }, (_, i) => {
    const level = levels[Math.floor(Math.random() * levels.length)];
    const message = messages[Math.floor(Math.random() * messages.length)];
    const timestamp = new Date(Date.now() - (49 - i) * 60000).toISOString();
    return { id: i, timestamp, level, message };
  });
};

const appData: Record<string, any> = {
  'prometheus': {
    name: 'Prometheus',
    category: 'Observability',
    version: '2.48.0',
    availableVersions: ['2.48.0', '2.47.2', '2.47.1', '2.46.0', '2.45.0'],
    status: 'running',
    description: 'Open-source systems monitoring and alerting toolkit',
    config: `global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets: []

rule_files: []

scrape_configs:
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]

  - job_name: "node"
    static_configs:
      - targets: ["node-exporter:9100"]

  - job_name: "kubernetes-pods"
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true`,
    resources: { cpu: 45, memory: 62, storage: 15 },
    uptime: '15d 8h 32m',
    port: 9090,
    replicas: 2,
  },
  'grafana': {
    name: 'Grafana',
    category: 'Observability',
    version: '10.2.2',
    availableVersions: ['10.2.2', '10.2.1', '10.2.0', '10.1.5', '10.0.0'],
    status: 'running',
    description: 'Open-source analytics and interactive visualization platform',
    config: `[server]
protocol = http
http_port = 3000
domain = localhost

[database]
type = sqlite3
path = grafana.db

[security]
admin_user = \${GRAFANA_ADMIN_USER}
admin_password = \${GRAFANA_ADMIN_PASSWORD}
secret_key = \${GRAFANA_SECRET_KEY}

[users]
allow_sign_up = false

[auth.anonymous]
enabled = false

[alerting]
enabled = true
execute_alerts = true

[unified_alerting]
enabled = true`,
    resources: { cpu: 28, memory: 45, storage: 8 },
    uptime: '15d 8h 32m',
    port: 3000,
    replicas: 1,
  },
  'mlflow': {
    name: 'MLflow',
    category: 'MLOps',
    version: '2.8.1',
    availableVersions: ['2.8.1', '2.8.0', '2.7.1', '2.6.0', '2.5.0'],
    status: 'running',
    description: 'Open-source platform for ML lifecycle management',
    config: `artifact_location: s3://mlflow-artifacts
backend_store_uri: postgresql://mlflow:mlflow@postgres:5432/mlflow

server:
  host: 0.0.0.0
  port: 5000
  workers: 4

tracking:
  default_artifact_root: s3://mlflow-artifacts
  
registry:
  database_uri: postgresql://mlflow:mlflow@postgres:5432/mlflow

prometheus_exporter:
  enabled: true
  port: 8000`,
    resources: { cpu: 35, memory: 55, storage: 25 },
    uptime: '12d 4h 15m',
    port: 5000,
    replicas: 2,
  },
};

const ApplicationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [logs, setLogs] = useState(generateLogs());
  const [metricsData] = useState(generateMetricsData());
  const [config, setConfig] = useState('');
  const [selectedVersion, setSelectedVersion] = useState('');
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [configModified, setConfigModified] = useState(false);
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);

  const app = appData[id || 'prometheus'] || appData['prometheus'];

  useEffect(() => {
    setConfig(app.config);
    setSelectedVersion(app.version);
  }, [app]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newLog = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        level: ['INFO', 'DEBUG', 'INFO', 'INFO'][Math.floor(Math.random() * 4)],
        message: ['Health check passed', 'Request processed', 'Metrics exported', 'Cache updated'][Math.floor(Math.random() * 4)],
      };
      setLogs(prev => [...prev.slice(-49), newLog]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'text-red-400';
      case 'WARN': return 'text-amber-400';
      case 'DEBUG': return 'text-slate-400';
      default: return 'text-emerald-400';
    }
  };

  const getLogLevelIcon = (level: string) => {
    switch (level) {
      case 'ERROR': return <AlertTriangle className="h-3 w-3" />;
      case 'WARN': return <AlertTriangle className="h-3 w-3" />;
      case 'DEBUG': return <Info className="h-3 w-3" />;
      default: return <CheckCircle className="h-3 w-3" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/marketplace')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-foreground">{app.name}</h1>
                <Badge variant="success">{app.status}</Badge>
                <Badge variant="outline" className="font-mono">v{app.version}</Badge>
              </div>
              <p className="text-muted-foreground mt-1">{app.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setBackupDialogOpen(true)}>
              <Archive className="h-4 w-4 mr-2" />
              Backup
            </Button>
            <Button variant="outline" size="sm">
              <Square className="h-4 w-4 mr-2" />
              Stop
            </Button>
            <Button variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              Restart
            </Button>
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Uninstall
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-6 gap-4">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Cpu className="h-4 w-4" />
                <span>CPU</span>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-semibold text-foreground">{app.resources.cpu}%</span>
                <Progress value={app.resources.cpu} className="mt-2 h-1" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Activity className="h-4 w-4" />
                <span>Memory</span>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-semibold text-foreground">{app.resources.memory}%</span>
                <Progress value={app.resources.memory} className="mt-2 h-1" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <HardDrive className="h-4 w-4" />
                <span>Storage</span>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-semibold text-foreground">{app.resources.storage} GB</span>
                <Progress value={app.resources.storage} className="mt-2 h-1" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Clock className="h-4 w-4" />
                <span>Uptime</span>
              </div>
              <div className="mt-2">
                <span className="text-xl font-semibold text-foreground">{app.uptime}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Package className="h-4 w-4" />
                <span>Port</span>
              </div>
              <div className="mt-2">
                <span className="text-xl font-semibold text-foreground font-mono">{app.port}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <TrendingUp className="h-4 w-4" />
                <span>Replicas</span>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-semibold text-foreground">{app.replicas}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="logs" className="space-y-4">
          <TabsList className="bg-muted/30">
            <TabsTrigger value="logs" className="gap-2">
              <Terminal className="h-4 w-4" />
              Live Logs
            </TabsTrigger>
            <TabsTrigger value="metrics" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Metrics
            </TabsTrigger>
            <TabsTrigger value="config" className="gap-2">
              <Settings className="h-4 w-4" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="versions" className="gap-2">
              <Package className="h-4 w-4" />
              Versions
            </TabsTrigger>
          </TabsList>

          {/* Live Logs Tab */}
          <TabsContent value="logs">
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                  Live Logs
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setIsAutoScroll(!isAutoScroll)}
                    className={isAutoScroll ? 'text-primary' : ''}
                  >
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Auto-scroll
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setLogs([])}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px] bg-slate-950 rounded-b-lg font-mono text-xs">
                  <div className="p-4 space-y-1">
                    {logs.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 hover:bg-white/5 px-2 py-1 rounded">
                        <span className="text-slate-500 shrink-0">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span className={`flex items-center gap-1 shrink-0 w-16 ${getLogLevelColor(log.level)}`}>
                          {getLogLevelIcon(log.level)}
                          {log.level}
                        </span>
                        <span className="text-slate-300">{log.message}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Metrics Tab */}
          <TabsContent value="metrics">
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-card/50 border-border/50">
                <CardHeader className="py-3">
                  <CardTitle className="text-base">CPU Usage (%)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={metricsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Area type="monotone" dataKey="cpu" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.2)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/50">
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Memory Usage (%)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={metricsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Area type="monotone" dataKey="memory" stroke="#22c55e" fill="rgba(34, 197, 94, 0.2)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/50">
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Requests/min</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={metricsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Line type="monotone" dataKey="requests" stroke="#f59e0b" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/50">
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Latency (ms)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={metricsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Line type="monotone" dataKey="latency" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Configuration Tab */}
          <TabsContent value="config">
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <CardTitle className="text-base">Configuration Editor</CardTitle>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setConfig(app.config);
                      setConfigModified(false);
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Reset
                  </Button>
                  <Button 
                    size="sm"
                    disabled={!configModified}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save & Apply
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea 
                  value={config}
                  onChange={(e) => {
                    setConfig(e.target.value);
                    setConfigModified(true);
                  }}
                  className="font-mono text-sm h-[500px] bg-slate-950 border-border/50 resize-none"
                  placeholder="Configuration content..."
                />
                {configModified && (
                  <p className="text-amber-500 text-sm mt-2 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    Configuration has been modified. Save to apply changes.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Versions Tab */}
          <TabsContent value="versions">
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="py-3">
                <CardTitle className="text-base">Version Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-sm text-muted-foreground mb-2 block">Current Version</label>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-lg px-4 py-2">
                        v{app.version}
                      </Badge>
                      <Badge variant="success">Latest</Badge>
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="text-sm text-muted-foreground mb-2 block">Upgrade To</label>
                    <div className="flex items-center gap-2">
                      <Select value={selectedVersion} onValueChange={setSelectedVersion}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {app.availableVersions.map((v: string) => (
                            <SelectItem key={v} value={v}>
                              v{v} {v === app.version && '(current)'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        disabled={selectedVersion === app.version}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <ChevronUp className="h-4 w-4 mr-1" />
                        Upgrade
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-foreground mb-3">Version History</h4>
                  <div className="space-y-2">
                    {app.availableVersions.map((v: string, i: number) => (
                      <div 
                        key={v}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          v === app.version 
                            ? 'border-primary/50 bg-primary/5' 
                            : 'border-border/50 bg-muted/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant={v === app.version ? "default" : "outline"} className="font-mono">
                            v{v}
                          </Badge>
                          {v === app.version && <span className="text-sm text-muted-foreground">Currently installed</span>}
                          {i === 0 && v !== app.version && <Badge variant="success">Latest</Badge>}
                        </div>
                        <div className="flex items-center gap-2">
                          {v !== app.version && (
                            <>
                              <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                              <Button variant="outline" size="sm">
                                Install
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Backup Dialog */}
        <BackupRestoreDialog
          open={backupDialogOpen}
          onOpenChange={setBackupDialogOpen}
          appName={app.name}
        />
      </div>
    </DashboardLayout>
  );
};

export default ApplicationDetails;
