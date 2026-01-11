import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  GitCompare,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Clock,
  Zap,
  Target,
  BarChart3,
  LineChart as LineChartIcon,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  RefreshCw,
  PieChart,
  Layers,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  BarChart,
  Bar,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";
import { models } from "@/data/platformData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Mock version data for comparison
const modelVersions = [
  {
    id: "v2.1.0",
    modelId: "model-001",
    version: "2.1.0",
    stage: "Production",
    createdAt: "2025-12-10",
    accuracy: 91.2,
    precision: 89.5,
    recall: 92.8,
    f1Score: 91.1,
    latency: 23,
    throughput: 1250,
    auc: 0.945,
    mse: 0.042,
    status: "validated",
  },
  {
    id: "v2.0.0",
    modelId: "model-001",
    version: "2.0.0",
    stage: "Archived",
    createdAt: "2025-11-15",
    accuracy: 88.7,
    precision: 86.2,
    recall: 90.1,
    f1Score: 88.1,
    latency: 28,
    throughput: 1100,
    auc: 0.912,
    mse: 0.058,
    status: "validated",
  },
  {
    id: "v1.9.0",
    modelId: "model-001",
    version: "1.9.0",
    stage: "Archived",
    createdAt: "2025-10-20",
    accuracy: 85.3,
    precision: 83.8,
    recall: 86.9,
    f1Score: 85.3,
    latency: 35,
    throughput: 950,
    auc: 0.878,
    mse: 0.072,
    status: "validated",
  },
];

const trainingHistory = Array.from({ length: 50 }, (_, i) => ({
  epoch: i + 1,
  v210_loss: 0.8 * Math.exp(-i / 15) + 0.05 + Math.random() * 0.02,
  v200_loss: 0.85 * Math.exp(-i / 18) + 0.08 + Math.random() * 0.02,
  v190_loss: 0.9 * Math.exp(-i / 20) + 0.12 + Math.random() * 0.02,
  v210_accuracy: 50 + 41.2 * (1 - Math.exp(-i / 12)) + Math.random() * 2,
  v200_accuracy: 50 + 38.7 * (1 - Math.exp(-i / 14)) + Math.random() * 2,
  v190_accuracy: 50 + 35.3 * (1 - Math.exp(-i / 16)) + Math.random() * 2,
}));

// Scatter data for latency vs accuracy
const scatterData = modelVersions.map((v) => ({
  name: `v${v.version}`,
  accuracy: v.accuracy,
  latency: v.latency,
  throughput: v.throughput,
}));

// Confusion matrix data
const confusionMatrixData = {
  v210: { tp: 92, fp: 4, fn: 3, tn: 91 },
  v200: { tp: 88, fp: 6, fn: 5, tn: 87 },
};

const ModelComparison = () => {
  const [selectedModel, setSelectedModel] = useState("model-001");
  const [version1, setVersion1] = useState("v2.1.0");
  const [version2, setVersion2] = useState("v2.0.0");
  const [showV190, setShowV190] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const v1 = modelVersions.find((v) => v.id === version1);
  const v2 = modelVersions.find((v) => v.id === version2);
  const v3 = modelVersions.find((v) => v.id === "v1.9.0");

  const model = models.find((m) => m.id === selectedModel);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Data refreshed successfully");
    }, 1000);
  };

  const handleExport = () => {
    const exportData = {
      model: model?.name,
      comparison: {
        version1: { version: v1?.version, metrics: v1 },
        version2: { version: v2?.version, metrics: v2 },
      },
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `model-comparison-${selectedModel}-${Date.now()}.json`;
    a.click();
    toast.success("Comparison exported successfully");
  };

  const getComparisonIndicator = (val1: number, val2: number, higherIsBetter = true) => {
    const diff = val1 - val2;
    const percentDiff = ((diff / val2) * 100).toFixed(1);
    
    if (Math.abs(diff) < 0.01) {
      return { icon: Minus, color: "text-muted-foreground", text: "Same" };
    }
    
    const isImprovement = higherIsBetter ? diff > 0 : diff < 0;
    
    return {
      icon: isImprovement ? TrendingUp : TrendingDown,
      color: isImprovement ? "text-success" : "text-destructive",
      text: `${diff > 0 ? "+" : ""}${percentDiff}%`,
    };
  };

  const radarData = [
    { metric: "Accuracy", v1: v1?.accuracy || 0, v2: v2?.accuracy || 0, v3: v3?.accuracy || 0, fullMark: 100 },
    { metric: "Precision", v1: v1?.precision || 0, v2: v2?.precision || 0, v3: v3?.precision || 0, fullMark: 100 },
    { metric: "Recall", v1: v1?.recall || 0, v2: v2?.recall || 0, v3: v3?.recall || 0, fullMark: 100 },
    { metric: "F1 Score", v1: v1?.f1Score || 0, v2: v2?.f1Score || 0, v3: v3?.f1Score || 0, fullMark: 100 },
    { metric: "AUC", v1: (v1?.auc || 0) * 100, v2: (v2?.auc || 0) * 100, v3: (v3?.auc || 0) * 100, fullMark: 100 },
  ];

  const barChartData = [
    { name: "Accuracy", v1: v1?.accuracy, v2: v2?.accuracy, v3: showV190 ? v3?.accuracy : undefined },
    { name: "Precision", v1: v1?.precision, v2: v2?.precision, v3: showV190 ? v3?.precision : undefined },
    { name: "Recall", v1: v1?.recall, v2: v2?.recall, v3: showV190 ? v3?.recall : undefined },
    { name: "F1 Score", v1: v1?.f1Score, v2: v2?.f1Score, v3: showV190 ? v3?.f1Score : undefined },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">{/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Link to="/models">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-3">
                  <GitCompare className="h-6 w-6 text-primary" />
                  Model Version Comparison
                </h1>
                <p className="text-muted-foreground mt-1">
                  Compare metrics and performance between model versions side-by-side
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Model & Version Selection */}
        <Card className="glass-card">
          <CardContent className="py-4">
            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Model</label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Version A (Base)</label>
                <Select value={version1} onValueChange={setVersion1}>
                  <SelectTrigger className="border-primary/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {modelVersions.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        v{v.version} - {v.stage}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Version B (Compare)</label>
                <Select value={version2} onValueChange={setVersion2}>
                  <SelectTrigger className="border-secondary/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {modelVersions.filter((v) => v.id !== version1).map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        v{v.version} - {v.stage}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Comparison Summary */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Version A", version: v1, color: "primary" },
            { label: "Version B", version: v2, color: "secondary" },
          ].map((item) => (
            <Card key={item.label} className={cn("glass-card", item.color === "primary" && "border-primary/30")}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
                  <Badge variant={item.version?.stage === "Production" ? "success" : "secondary"}>
                    {item.version?.stage}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold font-display">v{item.version?.version}</div>
                  <div className="flex-1 grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Accuracy</p>
                      <p className="font-semibold">{item.version?.accuracy}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Latency</p>
                      <p className="font-semibold">{item.version?.latency}ms</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Throughput</p>
                      <p className="font-semibold">{item.version?.throughput}/s</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Created</p>
                      <p className="font-semibold">{item.version?.createdAt}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs for different comparison views */}
        <Tabs defaultValue="metrics" className="space-y-4">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="metrics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Metrics Comparison
            </TabsTrigger>
            <TabsTrigger value="training" className="flex items-center gap-2">
              <LineChartIcon className="h-4 w-4" />
              Training History
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="metrics" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Radar Chart */}
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    Performance Radar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="metric" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                        <Radar name={`v${v1?.version}`} dataKey="v1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                        <Radar name={`v${v2?.version}`} dataKey="v2" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary))" fillOpacity={0.3} />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Bar Chart */}
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Metrics Bar Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis domain={[70, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar dataKey="v1" name={`v${v1?.version}`} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="v2" name={`v${v2?.version}`} fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                        <Legend />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Metrics Table */}
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Detailed Metrics Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Metric</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-primary">v{v1?.version}</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">v{v2?.version}</th>
                        <th className="text-center py-3 px-4 text-sm font-medium">Difference</th>
                        <th className="text-center py-3 px-4 text-sm font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: "Accuracy", v1: v1?.accuracy, v2: v2?.accuracy, unit: "%", higherIsBetter: true },
                        { name: "Precision", v1: v1?.precision, v2: v2?.precision, unit: "%", higherIsBetter: true },
                        { name: "Recall", v1: v1?.recall, v2: v2?.recall, unit: "%", higherIsBetter: true },
                        { name: "F1 Score", v1: v1?.f1Score, v2: v2?.f1Score, unit: "%", higherIsBetter: true },
                        { name: "AUC", v1: v1?.auc, v2: v2?.auc, unit: "", higherIsBetter: true },
                        { name: "MSE", v1: v1?.mse, v2: v2?.mse, unit: "", higherIsBetter: false },
                        { name: "Latency", v1: v1?.latency, v2: v2?.latency, unit: "ms", higherIsBetter: false },
                        { name: "Throughput", v1: v1?.throughput, v2: v2?.throughput, unit: "/s", higherIsBetter: true },
                      ].map((metric) => {
                        const comparison = getComparisonIndicator(metric.v1 || 0, metric.v2 || 0, metric.higherIsBetter);
                        const CompIcon = comparison.icon;
                        const isImprovement = comparison.color === "text-success";
                        
                        return (
                          <tr key={metric.name} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="py-3 px-4 font-medium">{metric.name}</td>
                            <td className="py-3 px-4 text-center font-mono text-primary">
                              {metric.v1}{metric.unit}
                            </td>
                            <td className="py-3 px-4 text-center font-mono text-muted-foreground">
                              {metric.v2}{metric.unit}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className={cn("flex items-center justify-center gap-1", comparison.color)}>
                                <CompIcon className="h-4 w-4" />
                                <span className="font-mono text-sm">{comparison.text}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {isImprovement ? (
                                <CheckCircle2 className="h-5 w-5 text-success mx-auto" />
                              ) : comparison.text === "Same" ? (
                                <AlertCircle className="h-5 w-5 text-muted-foreground mx-auto" />
                              ) : (
                                <XCircle className="h-5 w-5 text-destructive mx-auto" />
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="training" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {/* Loss Chart */}
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    Training Loss Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trainingHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="epoch" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Line type="monotone" dataKey="v210_loss" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="v2.1.0" />
                        <Line type="monotone" dataKey="v200_loss" stroke="hsl(var(--secondary))" strokeWidth={2} dot={false} name="v2.0.0" />
                        <Line type="monotone" dataKey="v190_loss" stroke="hsl(var(--muted-foreground))" strokeWidth={1} strokeDasharray="5 5" dot={false} name="v1.9.0" />
                        <Legend />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Accuracy Chart */}
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-success" />
                    Training Accuracy Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trainingHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="epoch" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis domain={[50, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Line type="monotone" dataKey="v210_accuracy" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="v2.1.0" />
                        <Line type="monotone" dataKey="v200_accuracy" stroke="hsl(var(--secondary))" strokeWidth={2} dot={false} name="v2.0.0" />
                        <Line type="monotone" dataKey="v190_accuracy" stroke="hsl(var(--muted-foreground))" strokeWidth={1} strokeDasharray="5 5" dot={false} name="v1.9.0" />
                        <Legend />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Latency", icon: Clock, v1: v1?.latency, v2: v2?.latency, unit: "ms", higherIsBetter: false },
                { label: "Throughput", icon: Zap, v1: v1?.throughput, v2: v2?.throughput, unit: " req/s", higherIsBetter: true },
                { label: "AUC Score", icon: Target, v1: v1?.auc, v2: v2?.auc, unit: "", higherIsBetter: true },
              ].map((metric) => {
                const comparison = getComparisonIndicator(metric.v1 || 0, metric.v2 || 0, metric.higherIsBetter);
                const CompIcon = comparison.icon;
                
                return (
                  <Card key={metric.label} className="glass-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <metric.icon className="h-4 w-4 text-primary" />
                        {metric.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">v{v1?.version}</p>
                            <p className="text-2xl font-bold font-mono text-primary">{metric.v1}{metric.unit}</p>
                          </div>
                          <div className={cn("flex items-center gap-1 px-2 py-1 rounded", comparison.color, comparison.color === "text-success" ? "bg-success/10" : comparison.color === "text-destructive" ? "bg-destructive/10" : "bg-muted")}>
                            <CompIcon className="h-4 w-4" />
                            <span className="text-sm font-medium">{comparison.text}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">v{v2?.version}</p>
                            <p className="text-2xl font-bold font-mono text-muted-foreground">{metric.v2}{metric.unit}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Performance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-lg bg-success/10 border border-success/30">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-success shrink-0" />
                    <div>
                      <h4 className="font-semibold text-success">Version {v1?.version} shows overall improvement</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Compared to v{v2?.version}, this version shows {((((v1?.accuracy || 0) - (v2?.accuracy || 0)) / (v2?.accuracy || 1)) * 100).toFixed(1)}% higher accuracy, 
                        {((((v2?.latency || 0) - (v1?.latency || 0)) / (v2?.latency || 1)) * 100).toFixed(1)}% lower latency, 
                        and {((((v1?.throughput || 0) - (v2?.throughput || 0)) / (v2?.throughput || 1)) * 100).toFixed(1)}% higher throughput.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ModelComparison;
