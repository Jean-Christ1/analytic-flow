import { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Progress } from "@/components/ui/progress";
import {
  Eye,
  Target,
  TrendingUp,
  BarChart3,
  Layers,
  Box,
  Info,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Percent,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ScatterChart,
  Scatter,
  Cell,
} from "recharts";

// Quality Control Models Data
const qualityModels = [
  {
    id: "model-011",
    name: "defect-detector-cnn",
    version: "3.1.0",
    stage: "Production",
    accuracy: 99.2,
    precision: 98.7,
    recall: 97.8,
    f1Score: 98.25,
    latency: 25,
    throughput: 890000,
    falsePositiveRate: 1.3,
    falseNegativeRate: 2.2,
    confusionMatrix: { tp: 9820, fp: 130, fn: 220, tn: 89830 },
    defectTypes: [
      { type: "Micro-cracks", precision: 99.1, recall: 98.2, count: 3420 },
      { type: "Surface scratches", precision: 98.5, recall: 97.5, count: 2810 },
      { type: "Dents", precision: 99.4, recall: 98.9, count: 1980 },
      { type: "Discoloration", precision: 97.8, recall: 96.4, count: 1450 },
      { type: "Contamination", precision: 98.9, recall: 97.1, count: 890 },
    ],
  },
  {
    id: "model-012",
    name: "dimensional-analyzer",
    version: "1.2.0",
    stage: "Staging",
    accuracy: 98.5,
    precision: 97.9,
    recall: 96.8,
    f1Score: 97.35,
    latency: 45,
    throughput: 50000,
    falsePositiveRate: 2.1,
    falseNegativeRate: 3.2,
    confusionMatrix: { tp: 4840, fp: 105, fn: 160, tn: 44895 },
    defectTypes: [
      { type: "Length deviation", precision: 98.2, recall: 97.1, count: 1820 },
      { type: "Width deviation", precision: 97.5, recall: 96.4, count: 1540 },
      { type: "Thickness variance", precision: 98.8, recall: 97.8, count: 980 },
      { type: "Angle misalignment", precision: 97.2, recall: 95.9, count: 720 },
    ],
  },
];

const performanceTrend = Array.from({ length: 30 }, (_, i) => ({
  day: `Dec ${i + 1}`,
  "defect-detector-cnn": 98.5 + Math.random() * 1.5,
  "dimensional-analyzer": 97.0 + Math.random() * 2,
}));

const precisionRecallData = [
  { threshold: 0.1, precision: 85, recall: 99.5 },
  { threshold: 0.2, precision: 89, recall: 98.8 },
  { threshold: 0.3, precision: 92, recall: 98.2 },
  { threshold: 0.4, precision: 95, recall: 97.5 },
  { threshold: 0.5, precision: 97, recall: 96.8 },
  { threshold: 0.6, precision: 98.2, recall: 95.5 },
  { threshold: 0.7, precision: 98.8, recall: 93.2 },
  { threshold: 0.8, precision: 99.2, recall: 89.5 },
  { threshold: 0.9, precision: 99.5, recall: 82.1 },
];

const radarData = [
  { metric: "Accuracy", "defect-detector-cnn": 99.2, "dimensional-analyzer": 98.5 },
  { metric: "Precision", "defect-detector-cnn": 98.7, "dimensional-analyzer": 97.9 },
  { metric: "Recall", "defect-detector-cnn": 97.8, "dimensional-analyzer": 96.8 },
  { metric: "F1 Score", "defect-detector-cnn": 98.25, "dimensional-analyzer": 97.35 },
  { metric: "Speed", "defect-detector-cnn": 95, "dimensional-analyzer": 85 },
  { metric: "Reliability", "defect-detector-cnn": 99.1, "dimensional-analyzer": 97.5 },
];

const confusionColors = {
  tp: "hsl(var(--success))",
  fp: "hsl(var(--warning))",
  fn: "hsl(var(--destructive))",
  tn: "hsl(var(--muted))",
};

const QualityControlComparison = () => {
  const [selectedModel, setSelectedModel] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("30d");

  return (
    <DashboardLayout>
      <div className="space-y-4 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold">Quality Control Model Comparison</h1>
            <p className="text-sm text-muted-foreground">Performance analysis with precision, recall and F1-score metrics</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-[180px] h-9 bg-muted/50">
                <Box className="h-3.5 w-3.5 mr-2" />
                <SelectValue placeholder="All Models" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Models</SelectItem>
                {qualityModels.map((model) => (
                  <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm"><RefreshCw className="h-3.5 w-3.5 mr-1" />Refresh</Button>
            <Button variant="premium" size="sm"><Download className="h-3.5 w-3.5 mr-1" />Export Report</Button>
          </div>
        </div>

        {/* Model Comparison Cards */}
        <div className="grid grid-cols-2 gap-4">
          {qualityModels.map((model) => (
            <Card key={model.id} className="glass-card gradient-border">
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Eye className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">{model.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">v{model.version}</span>
                        <Badge variant={model.stage === "Production" ? "success" : "warning"} className="text-[10px]">
                          {model.stage}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Link to={`/models/${model.id}`}>
                    <Button variant="ghost" size="sm">View Details <ArrowRight className="h-3 w-3 ml-1" /></Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="pb-4 px-4">
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {[
                    { label: "Accuracy", value: model.accuracy, icon: Target, color: "text-success" },
                    { label: "Precision", value: model.precision, icon: CheckCircle, color: "text-info" },
                    { label: "Recall", value: model.recall, icon: TrendingUp, color: "text-warning" },
                    { label: "F1 Score", value: model.f1Score, icon: BarChart3, color: "text-primary" },
                  ].map((metric, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-1.5 mb-1">
                        <metric.icon className={`h-3.5 w-3.5 ${metric.color}`} />
                        <span className="text-[10px] text-muted-foreground">{metric.label}</span>
                      </div>
                      <p className="text-lg font-bold">{metric.value}%</p>
                    </div>
                  ))}
                </div>

                {/* Confusion Matrix Summary */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  <div className="p-2 rounded-md bg-success/10 text-center">
                    <p className="text-[10px] text-muted-foreground">True Pos</p>
                    <p className="text-sm font-bold text-success">{model.confusionMatrix.tp.toLocaleString()}</p>
                  </div>
                  <div className="p-2 rounded-md bg-warning/10 text-center">
                    <p className="text-[10px] text-muted-foreground">False Pos</p>
                    <p className="text-sm font-bold text-warning">{model.confusionMatrix.fp.toLocaleString()}</p>
                  </div>
                  <div className="p-2 rounded-md bg-destructive/10 text-center">
                    <p className="text-[10px] text-muted-foreground">False Neg</p>
                    <p className="text-sm font-bold text-destructive">{model.confusionMatrix.fn.toLocaleString()}</p>
                  </div>
                  <div className="p-2 rounded-md bg-muted/50 text-center">
                    <p className="text-[10px] text-muted-foreground">True Neg</p>
                    <p className="text-sm font-bold">{model.confusionMatrix.tn.toLocaleString()}</p>
                  </div>
                </div>

                {/* Defect Types */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Defect Type Performance</p>
                  {model.defectTypes.slice(0, 3).map((defect, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs w-24 truncate">{defect.type}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-info to-success"
                          style={{ width: `${defect.precision}%` }} 
                        />
                      </div>
                      <span className="text-xs font-mono w-12">P: {defect.precision}%</span>
                      <span className="text-xs font-mono w-12">R: {defect.recall}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="comparison" className="space-y-3">
          <TabsList className="h-9">
            <TabsTrigger value="comparison" className="text-xs gap-1"><Layers className="h-3 w-3" />Comparison</TabsTrigger>
            <TabsTrigger value="pr-curve" className="text-xs gap-1"><TrendingUp className="h-3 w-3" />Precision-Recall</TabsTrigger>
            <TabsTrigger value="trend" className="text-xs gap-1"><BarChart3 className="h-3 w-3" />Trend</TabsTrigger>
            <TabsTrigger value="defects" className="text-xs gap-1"><AlertTriangle className="h-3 w-3" />Defect Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="comparison" className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Card className="glass-card">
                <CardHeader className="py-2 px-4">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    Radar Comparison
                    <Tooltip><TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                      <TooltipContent>Multi-dimensional model comparison</TooltipContent>
                    </Tooltip>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3 px-4">
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                        <PolarRadiusAxis angle={30} domain={[80, 100]} tick={{ fontSize: 9 }} />
                        <Radar name="defect-detector-cnn" dataKey="defect-detector-cnn" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                        <Radar name="dimensional-analyzer" dataKey="dimensional-analyzer" stroke="hsl(var(--info))" fill="hsl(var(--info))" fillOpacity={0.3} />
                        <Legend wrapperStyle={{ fontSize: "11px" }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader className="py-2 px-4">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-info" />
                    Metrics Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3 px-4">
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={[
                          { metric: "Accuracy", "defect-detector-cnn": 99.2, "dimensional-analyzer": 98.5 },
                          { metric: "Precision", "defect-detector-cnn": 98.7, "dimensional-analyzer": 97.9 },
                          { metric: "Recall", "defect-detector-cnn": 97.8, "dimensional-analyzer": 96.8 },
                          { metric: "F1 Score", "defect-detector-cnn": 98.25, "dimensional-analyzer": 97.35 },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="metric" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                        <YAxis domain={[95, 100]} stroke="hsl(var(--muted-foreground))" fontSize={10} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} 
                        />
                        <Legend wrapperStyle={{ fontSize: "11px" }} />
                        <Bar dataKey="defect-detector-cnn" fill="hsl(var(--primary))" name="Defect Detector CNN" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="dimensional-analyzer" fill="hsl(var(--info))" name="Dimensional Analyzer" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="pr-curve" className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <Card className="glass-card col-span-2">
                <CardHeader className="py-2 px-4">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-success" />
                    Precision-Recall Curve
                    <Badge variant="info" className="text-[10px] ml-2">Threshold Analysis</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3 px-4">
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={precisionRecallData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis 
                          dataKey="threshold" 
                          stroke="hsl(var(--muted-foreground))" 
                          fontSize={10}
                          label={{ value: 'Threshold', position: 'insideBottom', offset: -5, fontSize: 10 }}
                        />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} domain={[75, 100]} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} 
                        />
                        <Legend wrapperStyle={{ fontSize: "11px" }} />
                        <Line type="monotone" dataKey="precision" stroke="hsl(var(--primary))" strokeWidth={2} name="Precision %" dot />
                        <Line type="monotone" dataKey="recall" stroke="hsl(var(--success))" strokeWidth={2} name="Recall %" dot />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader className="py-2 px-4">
                  <CardTitle className="text-sm font-medium">Optimal Threshold</CardTitle>
                </CardHeader>
                <CardContent className="pb-3 px-4">
                  <div className="space-y-4">
                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <p className="text-xs text-muted-foreground">Recommended Threshold</p>
                      <p className="text-2xl font-bold text-primary">0.5</p>
                      <p className="text-xs text-muted-foreground mt-1">Best F1 balance</p>
                    </div>
                    
                    <div className="space-y-2">
                      {[
                        { label: "High Precision (0.8)", desc: "Less false alarms, may miss defects", icon: CheckCircle },
                        { label: "Balanced (0.5)", desc: "Optimal precision-recall trade-off", icon: Target },
                        { label: "High Recall (0.3)", desc: "Catch all defects, more false alarms", icon: AlertTriangle },
                      ].map((item, i) => (
                        <div key={i} className="p-2 rounded-lg bg-muted/30 flex items-start gap-2">
                          <item.icon className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-xs font-medium">{item.label}</p>
                            <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trend" className="space-y-3">
            <Card className="glass-card">
              <CardHeader className="py-2 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-success" />
                  30-Day Accuracy Trend
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3 px-4">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} domain={[95, 100]} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} 
                      />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                      <Line type="monotone" dataKey="defect-detector-cnn" stroke="hsl(var(--primary))" strokeWidth={2} name="Defect Detector CNN" dot={false} />
                      <Line type="monotone" dataKey="dimensional-analyzer" stroke="hsl(var(--info))" strokeWidth={2} name="Dimensional Analyzer" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="defects" className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {qualityModels.map((model) => (
                <Card key={model.id} className="glass-card">
                  <CardHeader className="py-2 px-4">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                      {model.name} - Defect Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3 px-4">
                    <div className="space-y-3">
                      {model.defectTypes.map((defect, i) => (
                        <div key={i} className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium">{defect.type}</span>
                            <Badge variant="secondary" className="text-[10px]">{defect.count.toLocaleString()} samples</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-muted-foreground">Precision</span>
                                <span className="text-xs font-mono">{defect.precision}%</span>
                              </div>
                              <Progress value={defect.precision} className="h-1.5" />
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-muted-foreground">Recall</span>
                                <span className="text-xs font-mono">{defect.recall}%</span>
                              </div>
                              <Progress value={defect.recall} className="h-1.5" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default QualityControlComparison;
