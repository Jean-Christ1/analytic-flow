import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle,
  Clock,
  Cpu,
  Settings2,
  TrendingUp,
  Wrench,
  XCircle,
  Gauge,
  ThermometerSun,
  Vibrate,
  Factory,
  Info,
  Plus,
  RefreshCw,
  Download,
  Zap,
} from "lucide-react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";

// Mock equipment data
const equipment = [
  { 
    id: "eq-001", 
    name: "CNC Machine A1", 
    type: "CNC", 
    status: "healthy",
    healthScore: 94,
    vibrationLevel: 2.3,
    temperature: 45,
    hoursToFailure: 720,
    lastMaintenance: "15 days ago",
    nextMaintenance: "45 days",
  },
  { 
    id: "eq-002", 
    name: "Press Line B2", 
    type: "Press", 
    status: "warning",
    healthScore: 72,
    vibrationLevel: 4.8,
    temperature: 68,
    hoursToFailure: 168,
    lastMaintenance: "45 days ago",
    nextMaintenance: "7 days",
  },
  { 
    id: "eq-003", 
    name: "Conveyor C3", 
    type: "Conveyor", 
    status: "critical",
    healthScore: 45,
    vibrationLevel: 7.2,
    temperature: 78,
    hoursToFailure: 48,
    lastMaintenance: "90 days ago",
    nextMaintenance: "Urgent",
  },
  { 
    id: "eq-004", 
    name: "Robot Arm D4", 
    type: "Robot", 
    status: "healthy",
    healthScore: 98,
    vibrationLevel: 1.1,
    temperature: 38,
    hoursToFailure: 1200,
    lastMaintenance: "7 days ago",
    nextMaintenance: "53 days",
  },
  { 
    id: "eq-005", 
    name: "Motor E5", 
    type: "Motor", 
    status: "warning",
    healthScore: 68,
    vibrationLevel: 5.5,
    temperature: 72,
    hoursToFailure: 120,
    lastMaintenance: "60 days ago",
    nextMaintenance: "5 days",
  },
];

// Sensor time series data
const vibrationData = Array.from({ length: 48 }, (_, i) => ({
  time: `${Math.floor(i / 2).toString().padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`,
  "CNC Machine A1": 2.0 + Math.sin(i / 6) * 0.5 + Math.random() * 0.3,
  "Press Line B2": 4.2 + Math.sin(i / 4) * 0.8 + Math.random() * 0.5,
  "Conveyor C3": 6.5 + Math.sin(i / 3) * 1.2 + Math.random() * 0.8,
  threshold: 5.0,
}));

const temperatureData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i.toString().padStart(2, '0')}:00`,
  "CNC Machine A1": 42 + Math.sin(i / 4) * 5 + Math.random() * 3,
  "Press Line B2": 62 + Math.sin(i / 3) * 8 + Math.random() * 4,
  "Conveyor C3": 72 + Math.sin(i / 2) * 6 + Math.random() * 5,
  threshold: 70,
}));

const healthTrend = Array.from({ length: 30 }, (_, i) => ({
  day: `Dec ${i + 1}`,
  "CNC Machine A1": 95 - i * 0.1 + Math.random() * 2,
  "Press Line B2": 85 - i * 0.4 + Math.random() * 3,
  "Conveyor C3": 75 - i * 1.0 + Math.random() * 4,
}));

// Alerts data
const alerts = [
  { id: 1, equipment: "Conveyor C3", type: "critical", message: "Bearing failure imminent - vibration 7.2mm/s", time: "5 min ago", acknowledged: false },
  { id: 2, equipment: "Press Line B2", type: "warning", message: "Temperature exceeding normal range", time: "15 min ago", acknowledged: false },
  { id: 3, equipment: "Motor E5", type: "warning", message: "Vibration anomaly detected", time: "1 hour ago", acknowledged: true },
  { id: 4, equipment: "CNC Machine A1", type: "info", message: "Scheduled maintenance in 45 days", time: "2 hours ago", acknowledged: true },
];

// Alert thresholds configuration
const defaultThresholds = {
  vibration: { warning: 4.0, critical: 6.0 },
  temperature: { warning: 65, critical: 75 },
  healthScore: { warning: 70, critical: 50 },
};

const PredictiveMaintenanceDashboard = () => {
  const [selectedEquipment, setSelectedEquipment] = useState<string>("all");
  const [thresholds, setThresholds] = useState(defaultThresholds);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [showConfigDialog, setShowConfigDialog] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy": return "success";
      case "warning": return "warning";
      case "critical": return "destructive";
      default: return "secondary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy": return <CheckCircle className="h-4 w-4 text-success" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-warning" />;
      case "critical": return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const criticalCount = equipment.filter(e => e.status === "critical").length;
  const warningCount = equipment.filter(e => e.status === "warning").length;
  const healthyCount = equipment.filter(e => e.status === "healthy").length;
  const avgHealth = Math.round(equipment.reduce((acc, e) => acc + e.healthScore, 0) / equipment.length);

  return (
    <DashboardLayout>
      <div className="space-y-4 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold">Predictive Maintenance Dashboard</h1>
            <p className="text-sm text-muted-foreground">Real-time equipment monitoring with configurable alerts</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
              <SelectTrigger className="w-[180px] h-9 bg-muted/50">
                <Factory className="h-3.5 w-3.5 mr-2" />
                <SelectValue placeholder="All Equipment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Equipment</SelectItem>
                {equipment.map((eq) => (
                  <SelectItem key={eq.id} value={eq.id}>{eq.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm"><Settings2 className="h-3.5 w-3.5 mr-1" />Thresholds</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Settings2 className="h-5 w-5" />
                    Alert Thresholds Configuration
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  {/* Alerts Enable/Disable */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      <Label>Enable Alerts</Label>
                    </div>
                    <Switch checked={alertsEnabled} onCheckedChange={setAlertsEnabled} />
                  </div>

                  {/* Vibration Thresholds */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Vibrate className="h-4 w-4 text-primary" />
                      <Label className="font-medium">Vibration (mm/s)</Label>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Warning threshold</span>
                        <span className="text-xs font-mono bg-warning/10 px-2 py-0.5 rounded">{thresholds.vibration.warning} mm/s</span>
                      </div>
                      <Slider
                        value={[thresholds.vibration.warning]}
                        onValueChange={([v]) => setThresholds(prev => ({ ...prev, vibration: { ...prev.vibration, warning: v } }))}
                        min={1}
                        max={8}
                        step={0.5}
                        className="w-full"
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Critical threshold</span>
                        <span className="text-xs font-mono bg-destructive/10 px-2 py-0.5 rounded">{thresholds.vibration.critical} mm/s</span>
                      </div>
                      <Slider
                        value={[thresholds.vibration.critical]}
                        onValueChange={([v]) => setThresholds(prev => ({ ...prev, vibration: { ...prev.vibration, critical: v } }))}
                        min={3}
                        max={10}
                        step={0.5}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Temperature Thresholds */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <ThermometerSun className="h-4 w-4 text-warning" />
                      <Label className="font-medium">Temperature (°C)</Label>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Warning threshold</span>
                        <span className="text-xs font-mono bg-warning/10 px-2 py-0.5 rounded">{thresholds.temperature.warning}°C</span>
                      </div>
                      <Slider
                        value={[thresholds.temperature.warning]}
                        onValueChange={([v]) => setThresholds(prev => ({ ...prev, temperature: { ...prev.temperature, warning: v } }))}
                        min={40}
                        max={80}
                        step={5}
                        className="w-full"
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Critical threshold</span>
                        <span className="text-xs font-mono bg-destructive/10 px-2 py-0.5 rounded">{thresholds.temperature.critical}°C</span>
                      </div>
                      <Slider
                        value={[thresholds.temperature.critical]}
                        onValueChange={([v]) => setThresholds(prev => ({ ...prev, temperature: { ...prev.temperature, critical: v } }))}
                        min={50}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Health Score Thresholds */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-info" />
                      <Label className="font-medium">Health Score (%)</Label>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Warning below</span>
                        <span className="text-xs font-mono bg-warning/10 px-2 py-0.5 rounded">{thresholds.healthScore.warning}%</span>
                      </div>
                      <Slider
                        value={[thresholds.healthScore.warning]}
                        onValueChange={([v]) => setThresholds(prev => ({ ...prev, healthScore: { ...prev.healthScore, warning: v } }))}
                        min={50}
                        max={90}
                        step={5}
                        className="w-full"
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Critical below</span>
                        <span className="text-xs font-mono bg-destructive/10 px-2 py-0.5 rounded">{thresholds.healthScore.critical}%</span>
                      </div>
                      <Slider
                        value={[thresholds.healthScore.critical]}
                        onValueChange={([v]) => setThresholds(prev => ({ ...prev, healthScore: { ...prev.healthScore, critical: v } }))}
                        min={20}
                        max={70}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <Button className="w-full" onClick={() => setShowConfigDialog(false)}>Save Configuration</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" size="sm"><RefreshCw className="h-3.5 w-3.5 mr-1" />Refresh</Button>
            <Button variant="premium" size="sm"><Download className="h-3.5 w-3.5 mr-1" />Report</Button>
          </div>
        </div>

        {/* KPI Stats */}
        <div className="grid grid-cols-5 gap-3">
          <Card className="glass-card">
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Avg Health Score</p>
                  <p className="text-xl font-bold mt-0.5">{avgHealth}%</p>
                </div>
                <div className="p-2 rounded-lg bg-success/10">
                  <Activity className="h-4 w-4 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Healthy</p>
                  <p className="text-xl font-bold mt-0.5 text-success">{healthyCount}</p>
                </div>
                <div className="p-2 rounded-lg bg-success/10">
                  <CheckCircle className="h-4 w-4 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Warnings</p>
                  <p className="text-xl font-bold mt-0.5 text-warning">{warningCount}</p>
                </div>
                <div className="p-2 rounded-lg bg-warning/10">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Critical</p>
                  <p className="text-xl font-bold mt-0.5 text-destructive">{criticalCount}</p>
                </div>
                <div className="p-2 rounded-lg bg-destructive/10">
                  <XCircle className="h-4 w-4 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Active Alerts</p>
                  <p className="text-xl font-bold mt-0.5">{alerts.filter(a => !a.acknowledged).length}</p>
                </div>
                <div className="p-2 rounded-lg bg-primary/10">
                  <Bell className="h-4 w-4 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-3">
          <TabsList className="h-9">
            <TabsTrigger value="overview" className="text-xs gap-1"><Factory className="h-3 w-3" />Equipment</TabsTrigger>
            <TabsTrigger value="vibration" className="text-xs gap-1"><Vibrate className="h-3 w-3" />Vibration</TabsTrigger>
            <TabsTrigger value="temperature" className="text-xs gap-1"><ThermometerSun className="h-3 w-3" />Temperature</TabsTrigger>
            <TabsTrigger value="health" className="text-xs gap-1"><TrendingUp className="h-3 w-3" />Health Trend</TabsTrigger>
            <TabsTrigger value="alerts" className="text-xs gap-1"><Bell className="h-3 w-3" />Alerts ({alerts.filter(a => !a.acknowledged).length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-3">
            <div className="grid grid-cols-1 gap-3">
              {equipment.map((eq) => (
                <Card key={eq.id} className={`glass-card border-l-4 ${
                  eq.status === 'critical' ? 'border-l-destructive' : 
                  eq.status === 'warning' ? 'border-l-warning' : 'border-l-success'
                }`}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {getStatusIcon(eq.status)}
                        <div>
                          <p className="font-medium text-sm">{eq.name}</p>
                          <p className="text-xs text-muted-foreground">{eq.type}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-8">
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground">Health</p>
                          <p className={`text-lg font-bold ${
                            eq.healthScore >= thresholds.healthScore.warning ? 'text-success' :
                            eq.healthScore >= thresholds.healthScore.critical ? 'text-warning' : 'text-destructive'
                          }`}>{eq.healthScore}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground">Vibration</p>
                          <p className={`text-lg font-bold ${
                            eq.vibrationLevel <= thresholds.vibration.warning ? 'text-success' :
                            eq.vibrationLevel <= thresholds.vibration.critical ? 'text-warning' : 'text-destructive'
                          }`}>{eq.vibrationLevel} <span className="text-xs">mm/s</span></p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground">Temperature</p>
                          <p className={`text-lg font-bold ${
                            eq.temperature <= thresholds.temperature.warning ? 'text-success' :
                            eq.temperature <= thresholds.temperature.critical ? 'text-warning' : 'text-destructive'
                          }`}>{eq.temperature}°C</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground">Time to Failure</p>
                          <p className={`text-lg font-bold ${
                            eq.hoursToFailure > 336 ? 'text-success' :
                            eq.hoursToFailure > 72 ? 'text-warning' : 'text-destructive'
                          }`}>{eq.hoursToFailure}h</p>
                        </div>
                        <div className="text-center min-w-[100px]">
                          <p className="text-[10px] text-muted-foreground">Next Maintenance</p>
                          <Badge variant={getStatusColor(eq.status)} className="text-[10px]">
                            {eq.nextMaintenance}
                          </Badge>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Wrench className="h-3.5 w-3.5 mr-1" />Schedule
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="vibration" className="space-y-3">
            <Card className="glass-card">
              <CardHeader className="py-2 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Vibrate className="h-4 w-4 text-primary" />
                  Vibration Levels (24h)
                  <Tooltip><TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                    <TooltipContent>Real-time vibration monitoring with anomaly detection</TooltipContent>
                  </Tooltip>
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3 px-4">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={vibrationData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} domain={[0, 10]} unit=" mm/s" />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} 
                      />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                      <ReferenceLine y={thresholds.vibration.warning} stroke="hsl(var(--warning))" strokeDasharray="5 5" label={{ value: 'Warning', fontSize: 10, fill: 'hsl(var(--warning))' }} />
                      <ReferenceLine y={thresholds.vibration.critical} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label={{ value: 'Critical', fontSize: 10, fill: 'hsl(var(--destructive))' }} />
                      <Line type="monotone" dataKey="CNC Machine A1" stroke="hsl(var(--success))" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="Press Line B2" stroke="hsl(var(--warning))" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="Conveyor C3" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="temperature" className="space-y-3">
            <Card className="glass-card">
              <CardHeader className="py-2 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ThermometerSun className="h-4 w-4 text-warning" />
                  Temperature Monitoring (24h)
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3 px-4">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={temperatureData}>
                      <defs>
                        <linearGradient id="tempGradA" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="tempGradB" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--warning))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="tempGradC" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} domain={[30, 90]} unit="°C" />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} 
                      />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                      <ReferenceLine y={thresholds.temperature.warning} stroke="hsl(var(--warning))" strokeDasharray="5 5" />
                      <ReferenceLine y={thresholds.temperature.critical} stroke="hsl(var(--destructive))" strokeDasharray="5 5" />
                      <Area type="monotone" dataKey="CNC Machine A1" stroke="hsl(var(--success))" fill="url(#tempGradA)" />
                      <Area type="monotone" dataKey="Press Line B2" stroke="hsl(var(--warning))" fill="url(#tempGradB)" />
                      <Area type="monotone" dataKey="Conveyor C3" stroke="hsl(var(--destructive))" fill="url(#tempGradC)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="health" className="space-y-3">
            <Card className="glass-card">
              <CardHeader className="py-2 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-success" />
                  Health Score Trend (30 days)
                  <Badge variant="info" className="text-[10px] ml-2">ML Predicted</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3 px-4">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={healthTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} domain={[0, 100]} unit="%" />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} 
                      />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                      <ReferenceLine y={thresholds.healthScore.warning} stroke="hsl(var(--warning))" strokeDasharray="5 5" />
                      <ReferenceLine y={thresholds.healthScore.critical} stroke="hsl(var(--destructive))" strokeDasharray="5 5" />
                      <Line type="monotone" dataKey="CNC Machine A1" stroke="hsl(var(--success))" strokeWidth={2} />
                      <Line type="monotone" dataKey="Press Line B2" stroke="hsl(var(--warning))" strokeWidth={2} />
                      <Line type="monotone" dataKey="Conveyor C3" stroke="hsl(var(--destructive))" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-3">
            <Card className="glass-card">
              <CardHeader className="py-2 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" />
                  Active Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3 px-4">
                <div className="space-y-2">
                  {alerts.map((alert) => (
                    <div 
                      key={alert.id} 
                      className={`p-3 rounded-lg border flex items-center justify-between ${
                        alert.type === 'critical' ? 'bg-destructive/5 border-destructive/20' :
                        alert.type === 'warning' ? 'bg-warning/5 border-warning/20' : 'bg-muted/30 border-border/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {alert.type === 'critical' && <XCircle className="h-4 w-4 text-destructive" />}
                        {alert.type === 'warning' && <AlertTriangle className="h-4 w-4 text-warning" />}
                        {alert.type === 'info' && <Info className="h-4 w-4 text-info" />}
                        <div>
                          <p className="text-sm font-medium">{alert.equipment}</p>
                          <p className="text-xs text-muted-foreground">{alert.message}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">{alert.time}</span>
                        {alert.acknowledged ? (
                          <Badge variant="secondary" className="text-[10px]">Acknowledged</Badge>
                        ) : (
                          <Button variant="outline" size="sm" className="h-7 text-xs">Acknowledge</Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default PredictiveMaintenanceDashboard;
