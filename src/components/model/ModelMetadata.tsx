import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Box,
  FileCode,
  Cpu,
  MemoryStick,
  HardDrive,
  GitBranch,
  Calendar,
  User,
  Tag,
  FileText,
  Download,
  ExternalLink,
  Clock,
  Zap,
  Target,
  Layers,
  Settings,
  Shield,
  Activity,
} from "lucide-react";
import {
  BarChart,
  Bar,
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
} from "recharts";

const modelMetadata = {
  // Basic Info
  name: "cv-classifier-production",
  description: "Production image classifier for retail products with high accuracy and low latency inference.",
  framework: "PyTorch",
  version: "2.1.0",
  stage: "Production",
  author: "Sarah Chen",
  team: "Computer Vision Team",
  createdAt: "2025-10-15",
  updatedAt: "2025-12-05",
  
  // Technical Details
  algorithm: "ResNet-152 + Custom Head",
  inputShape: "[batch, 3, 224, 224]",
  outputShape: "[batch, 1000]",
  parameters: "60.2M",
  modelSize: "234 MB",
  
  // Training Info
  trainingDataset: "ImageNet-1K + Custom Retail (500K images)",
  trainingDuration: "48h 32m",
  trainingCost: "$1,245.00",
  epochs: 150,
  batchSize: 128,
  learningRate: "1e-4 → 1e-6 (cosine)",
  optimizer: "AdamW",
  lossFunction: "CrossEntropyLoss",
  
  // Performance
  accuracy: 91.2,
  precision: 90.8,
  recall: 91.5,
  f1Score: 91.1,
  auc: 0.968,
  latencyP50: "18ms",
  latencyP95: "28ms",
  latencyP99: "45ms",
  throughput: "1,200 req/s",
  
  // Resources
  gpuRequired: "NVIDIA T4 / A10G",
  cpuRequired: "4 vCPU",
  memoryRequired: "8 GB",
  
  // Tags & Labels
  tags: ["computer-vision", "classification", "retail", "production", "high-accuracy"],
  labels: {
    "env": "production",
    "team": "cv-team",
    "priority": "high",
    "compliance": "gdpr-compliant",
  },
  
  // Artifacts
  artifacts: [
    { name: "model.pt", type: "PyTorch Model", size: "234 MB" },
    { name: "config.yaml", type: "Configuration", size: "4 KB" },
    { name: "requirements.txt", type: "Dependencies", size: "1 KB" },
    { name: "preprocessing.py", type: "Preprocessing", size: "12 KB" },
    { name: "inference.py", type: "Inference Script", size: "8 KB" },
    { name: "model_card.md", type: "Documentation", size: "15 KB" },
  ],
};

const performanceMetrics = [
  { metric: "Accuracy", value: 91.2, benchmark: 89.5 },
  { metric: "Precision", value: 90.8, benchmark: 88.2 },
  { metric: "Recall", value: 91.5, benchmark: 89.0 },
  { metric: "F1 Score", value: 91.1, benchmark: 88.5 },
  { metric: "AUC-ROC", value: 96.8, benchmark: 94.2 },
];

const radarData = [
  { subject: "Accuracy", A: 91.2, B: 89.5, fullMark: 100 },
  { subject: "Precision", A: 90.8, B: 88.2, fullMark: 100 },
  { subject: "Recall", A: 91.5, B: 89.0, fullMark: 100 },
  { subject: "Latency", A: 85, B: 75, fullMark: 100 },
  { subject: "Throughput", A: 88, B: 82, fullMark: 100 },
  { subject: "Efficiency", A: 92, B: 85, fullMark: 100 },
];

const featureImportance = [
  { feature: "color_histogram", importance: 0.23 },
  { feature: "edge_detection", importance: 0.19 },
  { feature: "texture_pattern", importance: 0.17 },
  { feature: "shape_descriptor", importance: 0.15 },
  { feature: "spatial_pyramid", importance: 0.12 },
  { feature: "object_context", importance: 0.08 },
  { feature: "background_sep", importance: 0.06 },
];

const hyperparameters = [
  { name: "learning_rate", value: "1e-4", tuned: true },
  { name: "batch_size", value: "128", tuned: true },
  { name: "weight_decay", value: "0.01", tuned: true },
  { name: "dropout", value: "0.3", tuned: true },
  { name: "warmup_steps", value: "1000", tuned: false },
  { name: "gradient_clip", value: "1.0", tuned: false },
  { name: "label_smoothing", value: "0.1", tuned: true },
  { name: "mixup_alpha", value: "0.2", tuned: false },
];

export const ModelMetadata = () => {
  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="glass-card col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Box className="h-4 w-4 text-primary" />
              Model Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <FileCode className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Framework:</span>
                  <span className="font-medium">{modelMetadata.framework}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Algorithm:</span>
                  <span className="font-medium">{modelMetadata.algorithm}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Parameters:</span>
                  <span className="font-medium">{modelMetadata.parameters}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Model Size:</span>
                  <span className="font-medium">{modelMetadata.modelSize}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Author:</span>
                  <span className="font-medium">{modelMetadata.author}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium">{modelMetadata.createdAt}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <GitBranch className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Version:</span>
                  <Badge variant="outline">{modelMetadata.version}</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Stage:</span>
                  <Badge variant="success">{modelMetadata.stage}</Badge>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border/30">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Tags:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {modelMetadata.tags.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resource Requirements */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Cpu className="h-4 w-4 text-gold" />
              Resource Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="h-4 w-4 text-warning" />
                <span className="text-sm font-medium">GPU</span>
              </div>
              <p className="text-sm text-muted-foreground">{modelMetadata.gpuRequired}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
              <div className="flex items-center gap-2 mb-1">
                <Cpu className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">CPU</span>
              </div>
              <p className="text-sm text-muted-foreground">{modelMetadata.cpuRequired}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
              <div className="flex items-center gap-2 mb-1">
                <MemoryStick className="h-4 w-4 text-info" />
                <span className="text-sm font-medium">Memory</span>
              </div>
              <p className="text-sm text-muted-foreground">{modelMetadata.memoryRequired}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Training Information & Performance Comparison */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-success" />
              Training Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/20">
                <p className="text-xs text-muted-foreground">Dataset</p>
                <p className="text-sm font-medium">{modelMetadata.trainingDataset}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/20">
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="text-sm font-medium">{modelMetadata.trainingDuration}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/20">
                <p className="text-xs text-muted-foreground">Epochs</p>
                <p className="text-sm font-medium">{modelMetadata.epochs}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/20">
                <p className="text-xs text-muted-foreground">Batch Size</p>
                <p className="text-sm font-medium">{modelMetadata.batchSize}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/20">
                <p className="text-xs text-muted-foreground">Optimizer</p>
                <p className="text-sm font-medium">{modelMetadata.optimizer}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/20">
                <p className="text-xs text-muted-foreground">Loss Function</p>
                <p className="text-sm font-medium">{modelMetadata.lossFunction}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/20 col-span-2">
                <p className="text-xs text-muted-foreground">Learning Rate Schedule</p>
                <p className="text-sm font-medium">{modelMetadata.learningRate}</p>
              </div>
              <div className="p-3 rounded-lg bg-gold/10 border border-gold/30 col-span-2">
                <p className="text-xs text-muted-foreground">Training Cost</p>
                <p className="text-lg font-bold text-gold">{modelMetadata.trainingCost}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Radar */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Performance vs Benchmark
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="subject" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <Radar name="Current Model" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                  <Radar name="Benchmark" dataKey="B" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground))" fillOpacity={0.1} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hyperparameters & Feature Importance */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Settings className="h-4 w-4 text-info" />
              Hyperparameters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {hyperparameters.map((param, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{param.name}</span>
                    {param.tuned && (
                      <Badge variant="outline" className="text-xs text-success border-success/30">tuned</Badge>
                    )}
                  </div>
                  <span className="font-mono text-sm text-primary">{param.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Layers className="h-4 w-4 text-warning" />
              Feature Importance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={featureImportance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={10} domain={[0, 0.3]} />
                  <YAxis dataKey="feature" type="category" stroke="hsl(var(--muted-foreground))" fontSize={10} width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, "Importance"]}
                  />
                  <Bar dataKey="importance" fill="hsl(var(--gold))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Artifacts */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Model Artifacts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {modelMetadata.artifacts.map((artifact, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileCode className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-mono font-medium">{artifact.name}</p>
                    <p className="text-xs text-muted-foreground">{artifact.type} • {artifact.size}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModelMetadata;
