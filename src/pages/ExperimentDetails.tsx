import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Play,
  Square,
  RotateCcw,
  Download,
  Copy,
  ExternalLink,
  FileCode,
  Clock,
  Cpu,
  Zap,
  TrendingUp,
  TrendingDown,
  Activity,
  FolderKanban,
  Box,
  Database,
  User,
  Info,
  Terminal,
  AlertCircle,
  CheckCircle,
  XCircle,
  HardDrive,
  Server,
  Calendar,
  Code,
  Tag,
  Eye,
  X,
  Image,
  FileText,
  Link2,
  ImageIcon,
  FileAudio,
  Music,
  LineChart as LineChartIcon,
  Network,
  Workflow,
  BarChart3,
  Table2,
  Grid3X3,
  List,
  Search,
  Filter,
  GitCompare,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { getExperimentById, getProjectById, getModelById, getDatasetById } from "@/data/platformData";

const metricsHistory = Array.from({ length: 30 }, (_, i) => ({
  epoch: i + 1,
  train_loss: Math.max(0.1, 2.5 - i * 0.07 + Math.random() * 0.1),
  val_loss: Math.max(0.15, 2.6 - i * 0.065 + Math.random() * 0.12),
  train_accuracy: Math.min(98, 45 + i * 1.8 + Math.random() * 2),
  val_accuracy: Math.min(95, 42 + i * 1.7 + Math.random() * 2.5),
}));

const ExperimentDetails = () => {
  const { id } = useParams();
  const experiment = getExperimentById(id || "");
  
  if (!experiment) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-xl font-bold text-foreground">Experiment Not Found</h2>
            <p className="text-muted-foreground mt-2">The experiment with ID {id} does not exist.</p>
            <Link to="/experiments"><Button className="mt-4">Back to Experiments</Button></Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const project = getProjectById(experiment.projectId);
  const model = experiment.modelId ? getModelById(experiment.modelId) : null;
  const dataset = getDatasetById(experiment.datasetId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running": return "info";
      case "completed": return "success";
      case "failed": return "destructive";
      case "queued": return "warning";
      default: return "secondary";
    }
  };

  const progress = experiment.status === "completed" ? 100 : experiment.status === "running" ? 67 : 0;

  const artifacts = experiment.artifacts.map((name) => ({
    name,
    type: name.endsWith('.pt') || name.endsWith('.h5') ? "model" : name.endsWith('.json') ? "config" : "other",
    size: Math.random() > 0.5 ? `${(Math.random() * 2).toFixed(1)} GB` : `${Math.floor(Math.random() * 500)} KB`,
  }));

  // Mock logs data
  const logs = [
    { time: "00:00:01", level: "info", message: "Initializing experiment environment..." },
    { time: "00:00:02", level: "info", message: "Loading dataset: " + (dataset?.name || experiment.datasetId) },
    { time: "00:00:05", level: "info", message: "Dataset loaded successfully. 45,000 samples." },
    { time: "00:00:06", level: "info", message: "Initializing model architecture..." },
    { time: "00:00:08", level: "info", message: "Model parameters: 125,432,576" },
    { time: "00:00:10", level: "info", message: "Starting training loop..." },
    { time: "00:01:23", level: "info", message: "Epoch 1/30 - Loss: 2.4521 - Accuracy: 45.2%" },
    { time: "00:02:45", level: "info", message: "Epoch 2/30 - Loss: 2.1034 - Accuracy: 52.8%" },
    { time: "00:04:12", level: "warning", message: "GPU memory usage high: 89%" },
    { time: "00:05:38", level: "info", message: "Epoch 3/30 - Loss: 1.8765 - Accuracy: 58.4%" },
    { time: "00:07:01", level: "info", message: "Epoch 4/30 - Loss: 1.6234 - Accuracy: 63.1%" },
    { time: "00:08:25", level: "info", message: "Checkpoint saved: model_epoch_4.pt" },
    { time: "00:09:48", level: "info", message: "Epoch 5/30 - Loss: 1.4521 - Accuracy: 67.5%" },
    { time: "00:11:12", level: "warning", message: "Learning rate adjusted: 0.001 -> 0.0005" },
    { time: "00:12:35", level: "info", message: "Epoch 6/30 - Loss: 1.2876 - Accuracy: 71.2%" },
    { time: "00:14:00", level: "error", message: "CUDA out of memory - reducing batch size" },
    { time: "00:14:05", level: "info", message: "Batch size reduced: 32 -> 16" },
    { time: "00:15:30", level: "info", message: "Epoch 7/30 - Loss: 1.1234 - Accuracy: 74.8%" },
    { time: "00:16:55", level: "info", message: "Validation metrics computed" },
    { time: "00:18:20", level: "success", message: "Best model checkpoint updated" },
  ];

  const [logFilter, setLogFilter] = useState<string>("all");
  const [datasetDialogOpen, setDatasetDialogOpen] = useState(false);
  const [datasetSearch, setDatasetSearch] = useState("");
  
  // Dataset type is determined by the experiment/project - not user selectable
  // This reflects real MLOps where each project has a specific data type
  const experimentDataType = dataset?.format === "ImageFolder" ? "images" 
    : dataset?.format === "JSON" ? "text"
    : dataset?.format === "CSV" ? "timeseries"
    : dataset?.format === "WAV" ? "audio"
    : dataset?.format === "GraphML" ? "graph"
    : "tabular"; // Default for most ML projects (classic ML)

  // Mock environment data for GPU/RAM/CPU charts
  const environmentData = Array.from({ length: 20 }, (_, i) => ({
    time: `${i * 3}m`,
    gpu: Math.min(95, 45 + Math.random() * 40 + i * 1.5),
    ram: Math.min(90, 35 + Math.random() * 30 + i * 1.2),
    cpu: Math.min(85, 25 + Math.random() * 35 + i * 0.8),
  }));

  // Hyperparameters with types for display
  const hyperparamsWithTypes = [
    { key: "batch_size", value: experiment.hyperparameters.batch_size || 32, type: "number" },
    { key: "optimizer", value: experiment.hyperparameters.optimizer || "Adam", type: "string" },
    { key: "weight_decay", value: experiment.hyperparameters.weight_decay || 0.0001, type: "number" },
    { key: "epochs", value: experiment.hyperparameters.epochs || experiment.epochs, type: "int" },
    { key: "learning_rate", value: experiment.hyperparameters.learning_rate || experiment.learningRate, type: "float" },
  ];

  // Metadata information
  const metadata = {
    framework: "PyTorch 2.1.0",
    pythonVersion: "3.11.5",
    hardware: "NVIDIA A100 40GB",
    cudaVersion: "12.1",
    createdAt: "2024-01-15 09:30:00",
    updatedAt: "2024-01-15 14:45:00",
    gitCommit: "a3f2b1c",
    branch: "feature/transformer-v2",
  };

  // Mock tabular dataset preview data (50 rows for scrolling)
  const tabularDataPreview = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    feature1: (Math.random() * 100).toFixed(2),
    feature2: (Math.random() * 50).toFixed(2),
    feature3: ["cat_a", "cat_b", "cat_c", "cat_d"][Math.floor(Math.random() * 4)],
    feature4: (Math.random() * 1000).toFixed(0),
    feature5: (Math.random() * 200 - 100).toFixed(3),
    target: Math.random() > 0.5 ? 1 : 0,
  }));

  // Mock image dataset preview data
  const imageDataPreview = Array.from({ length: 30 }, (_, i) => ({
    id: i + 1,
    filename: `img_${String(i + 1).padStart(5, "0")}.jpg`,
    thumbnail: `https://picsum.photos/seed/${i + 100}/80/80`,
    url: `s3://datasets/images/train/img_${String(i + 1).padStart(5, "0")}.jpg`,
    label: ["cat", "dog", "bird", "car", "plane", "ship"][Math.floor(Math.random() * 6)],
    width: [224, 256, 512, 640][Math.floor(Math.random() * 4)],
    height: [224, 256, 512, 480][Math.floor(Math.random() * 4)],
    size: `${(Math.random() * 500 + 50).toFixed(0)} KB`,
    split: ["train", "train", "train", "val", "test"][Math.floor(Math.random() * 5)],
  }));

  // Mock text dataset preview data
  const textDataPreview = Array.from({ length: 30 }, (_, i) => ({
    id: i + 1,
    text: [
      "The quick brown fox jumps over the lazy dog.",
      "Machine learning is transforming industries worldwide.",
      "Natural language processing enables computers to understand human language.",
      "Deep learning models achieve state-of-the-art results.",
      "Transfer learning reduces training time significantly.",
      "Attention mechanisms revolutionized sequence modeling.",
    ][i % 6] + ` Sample ${i + 1}.`,
    label: ["positive", "negative", "neutral"][Math.floor(Math.random() * 3)],
    tokens: Math.floor(Math.random() * 100 + 20),
    source: ["twitter", "news", "reviews", "wiki"][Math.floor(Math.random() * 4)],
    url: `s3://datasets/text/corpus_${String(i + 1).padStart(4, "0")}.txt`,
  }));

  // Mock time series dataset preview data
  const timeseriesDataPreview = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    timestamp: new Date(2024, 0, 1, 0, i * 15).toISOString().slice(0, 19).replace("T", " "),
    value: (100 + Math.sin(i * 0.3) * 30 + Math.random() * 10).toFixed(2),
    feature_1: (Math.random() * 50).toFixed(2),
    feature_2: (Math.random() * 100).toFixed(2),
    anomaly: Math.random() > 0.9 ? 1 : 0,
    window_id: Math.floor(i / 10) + 1,
  }));

  // Mock audio dataset preview data
  const audioDataPreview = Array.from({ length: 30 }, (_, i) => ({
    id: i + 1,
    filename: `audio_${String(i + 1).padStart(4, "0")}.wav`,
    duration: `${Math.floor(Math.random() * 10 + 1)}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
    sampleRate: [16000, 22050, 44100, 48000][Math.floor(Math.random() * 4)],
    channels: Math.random() > 0.7 ? 2 : 1,
    label: ["speech", "music", "noise", "silence", "ambient"][Math.floor(Math.random() * 5)],
    speaker: Math.random() > 0.5 ? `spk_${Math.floor(Math.random() * 100)}` : null,
    url: `s3://datasets/audio/audio_${String(i + 1).padStart(4, "0")}.wav`,
    size: `${(Math.random() * 20 + 1).toFixed(1)} MB`,
  }));

  // Mock graph/network dataset preview data
  const graphDataPreview = {
    nodes: Array.from({ length: 30 }, (_, i) => ({
      id: `node_${i + 1}`,
      type: ["user", "product", "category", "transaction"][Math.floor(Math.random() * 4)],
      features: Math.floor(Math.random() * 20 + 5),
      degree: Math.floor(Math.random() * 50 + 1),
      label: Math.random() > 0.5 ? "positive" : "negative",
    })),
    edges: Array.from({ length: 50 }, (_, i) => ({
      id: `edge_${i + 1}`,
      source: `node_${Math.floor(Math.random() * 30) + 1}`,
      target: `node_${Math.floor(Math.random() * 30) + 1}`,
      type: ["follows", "purchased", "viewed", "belongs_to"][Math.floor(Math.random() * 4)],
      weight: (Math.random()).toFixed(3),
    })),
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 animate-fade-in">
        {/* Compact Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Link to="/experiments">
              <Button variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft className="h-4 w-4" /></Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-display font-bold text-foreground">{experiment.name}</h1>
                <Badge variant={getStatusColor(experiment.status)} className="capitalize text-[10px]">
                  {experiment.status === "running" && <span className="mr-1 h-1.5 w-1.5 rounded-full bg-current animate-pulse" />}
                  {experiment.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{experiment.id} • by {experiment.author}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {experiment.status === "running" ? (
              <>
                <Button variant="outline" size="sm"><Square className="h-3 w-3 mr-1" />Stop</Button>
                <Button variant="outline" size="sm"><RotateCcw className="h-3 w-3 mr-1" />Restart</Button>
              </>
            ) : (
              <Button variant="outline" size="sm"><Play className="h-3 w-3 mr-1" />Re-run</Button>
            )}
            <Button variant="premium" size="sm"><Download className="h-3 w-3 mr-1" />Export</Button>
          </div>
        </div>

        {/* Context Cards - Compact */}
        <div className="grid grid-cols-4 gap-2">
          <Card className="glass-card border-primary/20">
            <CardContent className="py-3">
              <div className="flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground">Project</p>
                  <Link to={`/projects/${experiment.projectId}`} className="text-sm font-medium hover:text-primary truncate block">
                    {project?.name || experiment.projectId}
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="py-3">
              <div className="flex items-center gap-2">
                <Box className="h-4 w-4 text-gold" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground">Model</p>
                  {model ? (
                    <Link to={`/models/${model.id}`} className="text-sm font-medium hover:text-primary truncate block">{model.name}</Link>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not linked</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card 
            className="glass-card hover:border-info/30 transition-all cursor-pointer group"
            onClick={() => setDatasetDialogOpen(true)}
          >
            <CardContent className="py-3">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-info" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground">Dataset</p>
                  <p className="text-sm font-medium truncate group-hover:text-info transition-colors">
                    {dataset?.name || experiment.datasetId}
                  </p>
                </div>
                <Eye className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="py-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground">Author</p>
                  <p className="text-sm font-medium truncate">{experiment.author}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Metadata Section */}
        <Card className="glass-card">
          <CardContent className="py-3">
            <div className="grid grid-cols-8 gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 cursor-help">
                    <Code className="h-3.5 w-3.5 text-primary" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Framework</p>
                      <p className="text-xs font-medium">{metadata.framework}</p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>ML framework used</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 cursor-help">
                    <Terminal className="h-3.5 w-3.5 text-success" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Python</p>
                      <p className="text-xs font-medium">{metadata.pythonVersion}</p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Python version</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 cursor-help">
                    <HardDrive className="h-3.5 w-3.5 text-gold" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Hardware</p>
                      <p className="text-xs font-medium">{metadata.hardware}</p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>GPU hardware</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 cursor-help">
                    <Cpu className="h-3.5 w-3.5 text-info" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">CUDA</p>
                      <p className="text-xs font-medium">{metadata.cudaVersion}</p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>CUDA version</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 cursor-help">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Git Commit</p>
                      <p className="text-xs font-mono">{metadata.gitCommit}</p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Git commit hash</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 cursor-help">
                    <Tag className="h-3.5 w-3.5 text-warning" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Branch</p>
                      <p className="text-xs font-mono truncate max-w-[80px]">{metadata.branch}</p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>{metadata.branch}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 cursor-help">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Created</p>
                      <p className="text-xs font-medium">{metadata.createdAt.split(" ")[0]}</p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>{metadata.createdAt}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 cursor-help">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Updated</p>
                      <p className="text-xs font-medium">{metadata.updatedAt.split(" ")[0]}</p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>{metadata.updatedAt}</TooltipContent>
              </Tooltip>
            </div>
          </CardContent>
        </Card>

        {/* Progress Bar (running) */}
        {experiment.status === "running" && (
          <Card className="glass-card border-info/20">
            <CardContent className="py-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Training Progress</span>
                <span className="text-xs text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-1.5" />
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span><Clock className="h-3 w-3 inline mr-1" />{experiment.duration}</span>
                <span><Cpu className="h-3 w-3 inline mr-1" />Epoch {experiment.epochs}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Compact Stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Epochs", value: `${experiment.epochs}`, icon: Activity, tooltip: "Total training epochs" },
            { label: "Accuracy", value: experiment.accuracy ? `${experiment.accuracy}%` : "-", icon: TrendingUp, color: "text-success", tooltip: "Final validation accuracy" },
            { label: "Loss", value: experiment.loss?.toFixed(4) || "-", icon: TrendingDown, tooltip: "Final training loss" },
            { label: "LR", value: experiment.learningRate?.toString() || "-", icon: Zap, tooltip: "Learning rate" },
          ].map((stat, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="py-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center justify-between cursor-help">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">{stat.label}</p>
                        <p className={`text-lg font-bold font-display ${stat.color || ""}`}>{stat.value}</p>
                      </div>
                      <stat.icon className="h-4 w-4 text-primary" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>{stat.tooltip}</TooltipContent>
                </Tooltip>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="metrics" className="space-y-3">
          <TabsList className="bg-muted/50 p-1 h-auto">
            <TabsTrigger value="metrics" className="text-xs gap-1"><Activity className="h-3 w-3" />Metrics</TabsTrigger>
            <TabsTrigger value="parameters" className="text-xs gap-1"><Info className="h-3 w-3" />Parameters</TabsTrigger>
            <TabsTrigger value="artifacts" className="text-xs gap-1"><FileCode className="h-3 w-3" />Artifacts ({artifacts.length})</TabsTrigger>
            <TabsTrigger value="logs" className="text-xs gap-1"><Terminal className="h-3 w-3" />Logs</TabsTrigger>
            <TabsTrigger value="environment" className="text-xs gap-1"><Server className="h-3 w-3" />Environment</TabsTrigger>
            <TabsTrigger value="comparison" className="text-xs gap-1"><GitCompare className="h-3 w-3" />Comparison</TabsTrigger>
          </TabsList>

          <TabsContent value="metrics">
            <div className="grid grid-cols-2 gap-3">
              <Card className="glass-card">
                <CardHeader className="py-2"><CardTitle className="text-sm">Loss</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={metricsHistory}>
                        <defs>
                          <linearGradient id="trainLossGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="epoch" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                        <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                        <Legend wrapperStyle={{ fontSize: "10px" }} />
                        <Area type="monotone" dataKey="train_loss" stroke="hsl(var(--primary))" fill="url(#trainLossGrad)" name="Train" />
                        <Area type="monotone" dataKey="val_loss" stroke="hsl(var(--gold))" fill="transparent" name="Val" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardHeader className="py-2"><CardTitle className="text-sm">Accuracy</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={metricsHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="epoch" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} domain={[0, 100]} />
                        <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                        <Legend wrapperStyle={{ fontSize: "10px" }} />
                        <Line type="monotone" dataKey="train_accuracy" stroke="hsl(var(--success))" strokeWidth={2} dot={false} name="Train" />
                        <Line type="monotone" dataKey="val_accuracy" stroke="hsl(var(--info))" strokeWidth={2} dot={false} name="Val" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="parameters">
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <CardTitle className="text-sm">Hyperparameters</CardTitle>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-2">
                  <Copy className="h-3.5 w-3.5" />Copy All
                </Button>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="grid grid-cols-2 gap-3">
                  {hyperparamsWithTypes.map((param) => (
                    <div key={param.key} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/50">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-gold/10 flex items-center justify-center">
                          <FileCode className="h-4 w-4 text-gold" />
                        </div>
                        <div>
                          <p className="font-mono text-sm font-medium">{param.key}</p>
                          <p className="text-[10px] text-muted-foreground">{param.type}</p>
                        </div>
                      </div>
                      <span className="font-mono text-sm text-gold">
                        {typeof param.value === "string" ? `"${param.value}"` : param.value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="artifacts">
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <CardTitle className="text-sm">Experiment Artifacts</CardTitle>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-2">
                  <Download className="h-3.5 w-3.5" />Download All
                </Button>
              </CardHeader>
              <CardContent className="pb-4">
                {artifacts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No artifacts yet</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {artifacts.map((artifact, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/50">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-gold/10 flex items-center justify-center">
                            <FileCode className="h-4 w-4 text-gold" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{artifact.name}</p>
                            <p className="text-[10px] text-muted-foreground">{artifact.size}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs">
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between py-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Terminal className="h-4 w-4" />
                  Execution Logs
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-muted/50 rounded-md p-0.5">
                    <Button 
                      variant={logFilter === "all" ? "secondary" : "ghost"} 
                      size="sm" 
                      className="h-6 text-[10px] px-2"
                      onClick={() => setLogFilter("all")}
                    >
                      All
                    </Button>
                    <Button 
                      variant={logFilter === "info" ? "secondary" : "ghost"} 
                      size="sm" 
                      className="h-6 text-[10px] px-2"
                      onClick={() => setLogFilter("info")}
                    >
                      <CheckCircle className="h-2.5 w-2.5 mr-1 text-info" />Info
                    </Button>
                    <Button 
                      variant={logFilter === "warning" ? "secondary" : "ghost"} 
                      size="sm" 
                      className="h-6 text-[10px] px-2"
                      onClick={() => setLogFilter("warning")}
                    >
                      <AlertCircle className="h-2.5 w-2.5 mr-1 text-warning" />Warn
                    </Button>
                    <Button 
                      variant={logFilter === "error" ? "secondary" : "ghost"} 
                      size="sm" 
                      className="h-6 text-[10px] px-2"
                      onClick={() => setLogFilter("error")}
                    >
                      <XCircle className="h-2.5 w-2.5 mr-1 text-destructive" />Error
                    </Button>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    <Download className="h-3 w-3 mr-1" />Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="bg-background/80 rounded-lg border border-border/50 font-mono text-xs max-h-[280px] overflow-y-auto">
                  {logs
                    .filter(log => logFilter === "all" || log.level === logFilter)
                    .map((log, i) => (
                    <div 
                      key={i} 
                      className={`flex items-start gap-3 px-3 py-1.5 border-b border-border/20 last:border-0 ${
                        log.level === "error" ? "bg-destructive/5" : 
                        log.level === "warning" ? "bg-warning/5" : 
                        log.level === "success" ? "bg-success/5" : ""
                      }`}
                    >
                      <span className="text-muted-foreground shrink-0">{log.time}</span>
                      <span className={`shrink-0 uppercase text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        log.level === "info" ? "text-info bg-info/10" :
                        log.level === "warning" ? "text-warning bg-warning/10" :
                        log.level === "error" ? "text-destructive bg-destructive/10" :
                        log.level === "success" ? "text-success bg-success/10" : ""
                      }`}>
                        {log.level}
                      </span>
                      <span className="text-foreground">{log.message}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="environment">
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  Resource Utilization
                </CardTitle>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span className="text-muted-foreground">GPU</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-success" />
                    <span className="text-muted-foreground">RAM</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-info" />
                    <span className="text-muted-foreground">CPU</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="p-3 rounded-lg border border-border/50 bg-card/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">GPU Usage</span>
                      <HardDrive className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-2xl font-bold font-display text-primary">89%</p>
                    <p className="text-[10px] text-muted-foreground">NVIDIA A100 40GB</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border/50 bg-card/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">RAM Usage</span>
                      <Server className="h-4 w-4 text-success" />
                    </div>
                    <p className="text-2xl font-bold font-display text-success">67%</p>
                    <p className="text-[10px] text-muted-foreground">54.4 / 80 GB</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border/50 bg-card/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">CPU Usage</span>
                      <Cpu className="h-4 w-4 text-info" />
                    </div>
                    <p className="text-2xl font-bold font-display text-info">45%</p>
                    <p className="text-[10px] text-muted-foreground">8 / 16 vCPUs</p>
                  </div>
                </div>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={environmentData}>
                      <defs>
                        <linearGradient id="gpuGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="ramGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--info))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--info))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} domain={[0, 100]} unit="%" />
                      <RechartsTooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))", 
                          border: "1px solid hsl(var(--border))", 
                          borderRadius: "8px", 
                          fontSize: "12px" 
                        }} 
                        formatter={(value: number) => [`${value.toFixed(1)}%`]}
                      />
                      <Area type="monotone" dataKey="gpu" stroke="hsl(var(--primary))" fill="url(#gpuGrad)" name="GPU" strokeWidth={2} />
                      <Area type="monotone" dataKey="ram" stroke="hsl(var(--success))" fill="url(#ramGrad)" name="RAM" strokeWidth={2} />
                      <Area type="monotone" dataKey="cpu" stroke="hsl(var(--info))" fill="url(#cpuGrad)" name="CPU" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comparison">
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <GitCompare className="h-4 w-4" />
                  Compare Experiment Runs
                </CardTitle>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-2">
                  <Download className="h-3.5 w-3.5" />Export Comparison
                </Button>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="grid grid-cols-3 gap-4">
                  {/* Run Selection */}
                  <div className="col-span-3 mb-2">
                    <p className="text-xs text-muted-foreground mb-2">Select runs to compare:</p>
                    <div className="flex flex-wrap gap-2">
                      {["Run 1 (current)", "Run 2 (baseline)", "Run 3 (previous)"].map((run, i) => (
                        <Badge 
                          key={i} 
                          variant={i === 0 ? "default" : "outline"} 
                          className="cursor-pointer hover:bg-primary/20"
                        >
                          {run}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {/* Comparison Table */}
                  <div className="col-span-3">
                    <ScrollArea className="h-[280px] rounded-lg border border-border/50">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30 sticky top-0">
                            <TableHead className="text-xs font-semibold h-8">Metric / Param</TableHead>
                            <TableHead className="text-xs font-semibold h-8 text-center">Run 1 (current)</TableHead>
                            <TableHead className="text-xs font-semibold h-8 text-center">Run 2 (baseline)</TableHead>
                            <TableHead className="text-xs font-semibold h-8 text-center">Diff</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[
                            { name: "Accuracy", current: "94.2%", baseline: "92.8%", diff: "+1.4%", positive: true },
                            { name: "F1 Score", current: "0.923", baseline: "0.908", diff: "+0.015", positive: true },
                            { name: "Loss", current: "0.1823", baseline: "0.2145", diff: "-0.032", positive: true },
                            { name: "Precision", current: "0.941", baseline: "0.925", diff: "+0.016", positive: true },
                            { name: "Recall", current: "0.906", baseline: "0.892", diff: "+0.014", positive: true },
                            { name: "Training Time", current: "2h 15m", baseline: "2h 45m", diff: "-30m", positive: true },
                            { name: "batch_size", current: "32", baseline: "16", diff: "+16", positive: null },
                            { name: "learning_rate", current: "0.001", baseline: "0.0005", diff: "+0.0005", positive: null },
                            { name: "epochs", current: "30", baseline: "25", diff: "+5", positive: null },
                            { name: "optimizer", current: "Adam", baseline: "SGD", diff: "-", positive: null },
                            { name: "weight_decay", current: "0.0001", baseline: "0.0001", diff: "0", positive: null },
                          ].map((row, i) => (
                            <TableRow key={i} className="hover:bg-muted/20">
                              <TableCell className="text-xs py-2 font-medium">{row.name}</TableCell>
                              <TableCell className="text-xs py-2 text-center font-mono">{row.current}</TableCell>
                              <TableCell className="text-xs py-2 text-center font-mono text-muted-foreground">{row.baseline}</TableCell>
                              <TableCell className="text-xs py-2 text-center">
                                <Badge 
                                  variant={row.positive === true ? "success" : row.positive === false ? "destructive" : "secondary"}
                                  className="text-[10px]"
                                >
                                  {row.diff}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <ScrollBar orientation="vertical" />
                    </ScrollArea>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dataset Preview Dialog */}
      <Dialog open={datasetDialogOpen} onOpenChange={setDatasetDialogOpen}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] w-full overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-info" />
                {dataset?.name || experiment.datasetId}
                <Badge variant="info" className="ml-2 text-[10px]">
                  {dataset?.classification || "PUBLIC"}
                </Badge>
                <Badge variant="outline" className="text-[10px] capitalize">
                  {experimentDataType === "tabular" && <><Table2 className="h-3 w-3 mr-1" />Tabular</>}
                  {experimentDataType === "images" && <><ImageIcon className="h-3 w-3 mr-1" />Images</>}
                  {experimentDataType === "text" && <><FileText className="h-3 w-3 mr-1" />Text</>}
                  {experimentDataType === "timeseries" && <><LineChartIcon className="h-3 w-3 mr-1" />Time Series</>}
                  {experimentDataType === "audio" && <><Music className="h-3 w-3 mr-1" />Audio</>}
                  {experimentDataType === "graph" && <><Network className="h-3 w-3 mr-1" />Graph</>}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search data..."
                    value={datasetSearch}
                    onChange={(e) => setDatasetSearch(e.target.value)}
                    className="h-8 w-[200px] pl-8 text-xs"
                  />
                </div>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                  <Filter className="h-3.5 w-3.5" />Filter
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-4 pb-4">
              {/* Dataset Stats */}
              <div className="grid grid-cols-6 gap-3">
                <Card className="glass-card">
                  <CardContent className="py-3 text-center">
                    <p className="text-xs text-muted-foreground">Samples</p>
                    <p className="text-lg font-bold">
                      {experimentDataType === "graph" ? `${graphDataPreview.nodes.length} nodes` : dataset?.records || "45,000"}
                    </p>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardContent className="py-3 text-center">
                    <p className="text-xs text-muted-foreground">
                      {experimentDataType === "graph" ? "Edges" : "Features"}
                    </p>
                    <p className="text-lg font-bold">
                      {experimentDataType === "images" ? "3" : 
                       experimentDataType === "text" ? "4" : 
                       experimentDataType === "timeseries" ? "6" :
                       experimentDataType === "audio" ? "8" :
                       experimentDataType === "graph" ? `${graphDataPreview.edges.length}` : "6"}
                    </p>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardContent className="py-3 text-center">
                    <p className="text-xs text-muted-foreground">Size</p>
                    <p className="text-lg font-bold">
                      {experimentDataType === "images" ? "12.8 GB" : 
                       experimentDataType === "audio" ? "45.2 GB" :
                       experimentDataType === "graph" ? "890 MB" : dataset?.size || "2.4 GB"}
                    </p>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardContent className="py-3 text-center">
                    <p className="text-xs text-muted-foreground">Format</p>
                    <p className="text-lg font-bold">
                      {experimentDataType === "images" ? "JPEG/PNG" : 
                       experimentDataType === "text" ? "TXT/JSON" : 
                       experimentDataType === "timeseries" ? "CSV/Parquet" :
                       experimentDataType === "audio" ? "WAV/MP3" :
                       experimentDataType === "graph" ? "GraphML" : dataset?.format || "Parquet"}
                    </p>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardContent className="py-3 text-center">
                    <p className="text-xs text-muted-foreground">Version</p>
                    <p className="text-lg font-bold">v{dataset?.version || "1.2"}</p>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardContent className="py-3 text-center">
                    <p className="text-xs text-muted-foreground">Storage</p>
                    <p className="text-xs font-mono text-primary truncate">s3://datasets/</p>
                  </CardContent>
                </Card>
              </div>

              {/* Data Preview based on type */}
              <Card className="glass-card">
                <CardHeader className="py-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {experimentDataType === "images" ? <ImageIcon className="h-4 w-4" /> : 
                       experimentDataType === "text" ? <FileText className="h-4 w-4" /> : 
                       experimentDataType === "timeseries" ? <LineChartIcon className="h-4 w-4" /> :
                       experimentDataType === "audio" ? <Music className="h-4 w-4" /> :
                       experimentDataType === "graph" ? <Network className="h-4 w-4" /> :
                       <Eye className="h-4 w-4" />}
                      Data Preview ({experimentDataType === "tabular" ? `${tabularDataPreview.filter(r => datasetSearch ? r.feature3.toLowerCase().includes(datasetSearch.toLowerCase()) || r.id.toString().includes(datasetSearch) : true).length} rows` : 
                                      experimentDataType === "images" ? `${imageDataPreview.filter(r => datasetSearch ? r.filename.includes(datasetSearch) || r.label.includes(datasetSearch) : true).length} images` : 
                                      experimentDataType === "text" ? `${textDataPreview.filter(r => datasetSearch ? r.text.toLowerCase().includes(datasetSearch.toLowerCase()) : true).length} documents` :
                                      experimentDataType === "timeseries" ? `${timeseriesDataPreview.filter(r => datasetSearch ? r.timestamp.includes(datasetSearch) : true).length} records` :
                                      experimentDataType === "audio" ? `${audioDataPreview.filter(r => datasetSearch ? r.filename.includes(datasetSearch) || r.label.includes(datasetSearch) : true).length} files` :
                                      experimentDataType === "graph" ? `${graphDataPreview.nodes.length} nodes, ${graphDataPreview.edges.length} edges` :
                                      "N/A"})
                    </span>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="h-7 text-xs">
                        <Download className="h-3 w-3 mr-1" />Export Sample
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  {/* Tabular Data View */}
                  {experimentDataType === "tabular" && (
                    <ScrollArea className="h-[300px] rounded-lg border border-border/50">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30 sticky top-0">
                            <TableHead className="text-xs font-semibold h-8">ID</TableHead>
                            <TableHead className="text-xs font-semibold h-8">feature_1</TableHead>
                            <TableHead className="text-xs font-semibold h-8">feature_2</TableHead>
                            <TableHead className="text-xs font-semibold h-8">feature_3</TableHead>
                            <TableHead className="text-xs font-semibold h-8">feature_4</TableHead>
                            <TableHead className="text-xs font-semibold h-8">feature_5</TableHead>
                            <TableHead className="text-xs font-semibold h-8">target</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tabularDataPreview
                            .filter(row => !datasetSearch || 
                              row.feature3.toLowerCase().includes(datasetSearch.toLowerCase()) ||
                              row.id.toString().includes(datasetSearch)
                            )
                            .map((row) => (
                            <TableRow key={row.id} className="hover:bg-muted/20">
                              <TableCell className="text-xs py-2 font-mono">{row.id}</TableCell>
                              <TableCell className="text-xs py-2">{row.feature1}</TableCell>
                              <TableCell className="text-xs py-2">{row.feature2}</TableCell>
                              <TableCell className="text-xs py-2">
                                <Badge variant="secondary" className="text-[10px]">{row.feature3}</Badge>
                              </TableCell>
                              <TableCell className="text-xs py-2">{row.feature4}</TableCell>
                              <TableCell className="text-xs py-2">{row.feature5}</TableCell>
                              <TableCell className="text-xs py-2">
                                <Badge variant={row.target === 1 ? "success" : "secondary"} className="text-[10px]">
                                  {row.target}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <ScrollBar orientation="vertical" />
                    </ScrollArea>
                  )}

                  {/* Image Data View */}
                  {experimentDataType === "images" && (
                    <ScrollArea className="h-[300px] rounded-lg border border-border/50">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30 sticky top-0">
                            <TableHead className="text-xs font-semibold h-8 w-20">Preview</TableHead>
                            <TableHead className="text-xs font-semibold h-8">Filename</TableHead>
                            <TableHead className="text-xs font-semibold h-8">Label</TableHead>
                            <TableHead className="text-xs font-semibold h-8">Dimensions</TableHead>
                            <TableHead className="text-xs font-semibold h-8">Size</TableHead>
                            <TableHead className="text-xs font-semibold h-8">Split</TableHead>
                            <TableHead className="text-xs font-semibold h-8 min-w-[250px]">Storage URL</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {imageDataPreview
                            .filter(row => !datasetSearch || 
                              row.filename.toLowerCase().includes(datasetSearch.toLowerCase()) ||
                              row.label.toLowerCase().includes(datasetSearch.toLowerCase())
                            )
                            .map((row) => (
                            <TableRow key={row.id} className="hover:bg-muted/20">
                              <TableCell className="py-1">
                                <img 
                                  src={row.thumbnail} 
                                  alt={row.filename}
                                  className="w-12 h-12 rounded object-cover border border-border/50"
                                />
                              </TableCell>
                              <TableCell className="text-xs py-2 font-mono">{row.filename}</TableCell>
                              <TableCell className="text-xs py-2">
                                <Badge variant="info" className="text-[10px]">{row.label}</Badge>
                              </TableCell>
                              <TableCell className="text-xs py-2">{row.width}x{row.height}</TableCell>
                              <TableCell className="text-xs py-2">{row.size}</TableCell>
                              <TableCell className="text-xs py-2">
                                <Badge variant={row.split === "train" ? "success" : row.split === "val" ? "warning" : "secondary"} className="text-[10px]">
                                  {row.split}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs py-2">
                                <div className="flex items-center gap-1.5">
                                  <Link2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                  <code className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded truncate max-w-[220px]">
                                    {row.url}
                                  </code>
                                  <Button variant="ghost" size="icon" className="h-5 w-5 flex-shrink-0">
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <ScrollBar orientation="vertical" />
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  )}

                  {/* Text Data View */}
                  {experimentDataType === "text" && (
                    <ScrollArea className="h-[300px] rounded-lg border border-border/50">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30 sticky top-0">
                            <TableHead className="text-xs font-semibold h-8 w-12">ID</TableHead>
                            <TableHead className="text-xs font-semibold h-8 min-w-[350px]">Text Content</TableHead>
                            <TableHead className="text-xs font-semibold h-8">Label</TableHead>
                            <TableHead className="text-xs font-semibold h-8">Tokens</TableHead>
                            <TableHead className="text-xs font-semibold h-8">Source</TableHead>
                            <TableHead className="text-xs font-semibold h-8 min-w-[200px]">Storage URL</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {textDataPreview
                            .filter(row => !datasetSearch || 
                              row.text.toLowerCase().includes(datasetSearch.toLowerCase()) ||
                              row.label.toLowerCase().includes(datasetSearch.toLowerCase())
                            )
                            .map((row) => (
                            <TableRow key={row.id} className="hover:bg-muted/20">
                              <TableCell className="text-xs py-2 font-mono">{row.id}</TableCell>
                              <TableCell className="text-xs py-2">
                                <p className="line-clamp-2 text-muted-foreground">{row.text}</p>
                              </TableCell>
                              <TableCell className="text-xs py-2">
                                <Badge variant={row.label === "positive" ? "success" : row.label === "negative" ? "destructive" : "secondary"} className="text-[10px]">
                                  {row.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs py-2 font-mono">{row.tokens}</TableCell>
                              <TableCell className="text-xs py-2">
                                <Badge variant="outline" className="text-[10px]">{row.source}</Badge>
                              </TableCell>
                              <TableCell className="text-xs py-2">
                                <div className="flex items-center gap-1.5">
                                  <Link2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                  <code className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded truncate max-w-[180px]">
                                    {row.url}
                                  </code>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <ScrollBar orientation="vertical" />
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  )}

                  {/* Time Series Data View */}
                  {experimentDataType === "timeseries" && (
                    <ScrollArea className="h-[300px] rounded-lg border border-border/50">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30 sticky top-0">
                            <TableHead className="text-xs font-semibold h-8">ID</TableHead>
                            <TableHead className="text-xs font-semibold h-8 min-w-[150px]">Timestamp</TableHead>
                            <TableHead className="text-xs font-semibold h-8">Value</TableHead>
                            <TableHead className="text-xs font-semibold h-8">feature_1</TableHead>
                            <TableHead className="text-xs font-semibold h-8">feature_2</TableHead>
                            <TableHead className="text-xs font-semibold h-8">Anomaly</TableHead>
                            <TableHead className="text-xs font-semibold h-8">Window</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {timeseriesDataPreview.map((row) => (
                            <TableRow key={row.id} className="hover:bg-muted/20">
                              <TableCell className="text-xs py-2 font-mono">{row.id}</TableCell>
                              <TableCell className="text-xs py-2 font-mono text-muted-foreground">{row.timestamp}</TableCell>
                              <TableCell className="text-xs py-2 font-medium">{row.value}</TableCell>
                              <TableCell className="text-xs py-2">{row.feature_1}</TableCell>
                              <TableCell className="text-xs py-2">{row.feature_2}</TableCell>
                              <TableCell className="text-xs py-2">
                                <Badge variant={row.anomaly === 1 ? "destructive" : "success"} className="text-[10px]">
                                  {row.anomaly === 1 ? "Yes" : "No"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs py-2">
                                <Badge variant="outline" className="text-[10px]">W{row.window_id}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <ScrollBar orientation="vertical" />
                    </ScrollArea>
                  )}

                  {/* Audio Data View */}
                  {experimentDataType === "audio" && (
                    <ScrollArea className="h-[300px] rounded-lg border border-border/50">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30 sticky top-0">
                            <TableHead className="text-xs font-semibold h-8">ID</TableHead>
                            <TableHead className="text-xs font-semibold h-8">Filename</TableHead>
                            <TableHead className="text-xs font-semibold h-8">Duration</TableHead>
                            <TableHead className="text-xs font-semibold h-8">Sample Rate</TableHead>
                            <TableHead className="text-xs font-semibold h-8">Channels</TableHead>
                            <TableHead className="text-xs font-semibold h-8">Label</TableHead>
                            <TableHead className="text-xs font-semibold h-8">Speaker</TableHead>
                            <TableHead className="text-xs font-semibold h-8">Size</TableHead>
                            <TableHead className="text-xs font-semibold h-8 min-w-[200px]">Storage URL</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {audioDataPreview.map((row) => (
                            <TableRow key={row.id} className="hover:bg-muted/20">
                              <TableCell className="text-xs py-2 font-mono">{row.id}</TableCell>
                              <TableCell className="text-xs py-2 font-mono">{row.filename}</TableCell>
                              <TableCell className="text-xs py-2">{row.duration}</TableCell>
                              <TableCell className="text-xs py-2">{row.sampleRate} Hz</TableCell>
                              <TableCell className="text-xs py-2">
                                <Badge variant="outline" className="text-[10px]">
                                  {row.channels === 1 ? "Mono" : "Stereo"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs py-2">
                                <Badge variant="info" className="text-[10px]">{row.label}</Badge>
                              </TableCell>
                              <TableCell className="text-xs py-2">
                                {row.speaker ? (
                                  <span className="font-mono text-muted-foreground">{row.speaker}</span>
                                ) : (
                                  <span className="text-muted-foreground/50">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-xs py-2">{row.size}</TableCell>
                              <TableCell className="text-xs py-2">
                                <div className="flex items-center gap-1.5">
                                  <Link2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                  <code className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded truncate max-w-[180px]">
                                    {row.url}
                                  </code>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <ScrollBar orientation="vertical" />
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  )}

                  {/* Graph Data View */}
                  {experimentDataType === "graph" && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        {/* Nodes Table */}
                        <div>
                          <p className="text-xs font-medium mb-2 flex items-center gap-1.5">
                            <Network className="h-3 w-3 text-primary" />Nodes ({graphDataPreview.nodes.length})
                          </p>
                          <ScrollArea className="h-[130px] rounded-lg border border-border/50">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-muted/30 sticky top-0">
                                  <TableHead className="text-xs font-semibold h-7">ID</TableHead>
                                  <TableHead className="text-xs font-semibold h-7">Type</TableHead>
                                  <TableHead className="text-xs font-semibold h-7">Features</TableHead>
                                  <TableHead className="text-xs font-semibold h-7">Degree</TableHead>
                                  <TableHead className="text-xs font-semibold h-7">Label</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {graphDataPreview.nodes.map((node) => (
                                  <TableRow key={node.id} className="hover:bg-muted/20">
                                    <TableCell className="text-[10px] py-1 font-mono">{node.id}</TableCell>
                                    <TableCell className="text-[10px] py-1">
                                      <Badge variant="outline" className="text-[9px]">{node.type}</Badge>
                                    </TableCell>
                                    <TableCell className="text-[10px] py-1">{node.features}</TableCell>
                                    <TableCell className="text-[10px] py-1">{node.degree}</TableCell>
                                    <TableCell className="text-[10px] py-1">
                                      <Badge variant={node.label === "positive" ? "success" : "secondary"} className="text-[9px]">
                                        {node.label}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                            <ScrollBar orientation="vertical" />
                          </ScrollArea>
                        </div>
                        {/* Edges Table */}
                        <div>
                          <p className="text-xs font-medium mb-2 flex items-center gap-1.5">
                            <Workflow className="h-3 w-3 text-info" />Edges ({graphDataPreview.edges.length})
                          </p>
                          <ScrollArea className="h-[130px] rounded-lg border border-border/50">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-muted/30 sticky top-0">
                                  <TableHead className="text-xs font-semibold h-7">ID</TableHead>
                                  <TableHead className="text-xs font-semibold h-7">Source</TableHead>
                                  <TableHead className="text-xs font-semibold h-7">Target</TableHead>
                                  <TableHead className="text-xs font-semibold h-7">Type</TableHead>
                                  <TableHead className="text-xs font-semibold h-7">Weight</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {graphDataPreview.edges.map((edge) => (
                                  <TableRow key={edge.id} className="hover:bg-muted/20">
                                    <TableCell className="text-[10px] py-1 font-mono">{edge.id}</TableCell>
                                    <TableCell className="text-[10px] py-1 font-mono text-primary">{edge.source}</TableCell>
                                    <TableCell className="text-[10px] py-1 font-mono text-info">{edge.target}</TableCell>
                                    <TableCell className="text-[10px] py-1">
                                      <Badge variant="outline" className="text-[9px]">{edge.type}</Badge>
                                    </TableCell>
                                    <TableCell className="text-[10px] py-1">{edge.weight}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                            <ScrollBar orientation="vertical" />
                          </ScrollArea>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Dataset Info - Schema and Statistics */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="glass-card">
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm">Schema</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <ScrollArea className="h-[150px]">
                      <div className="space-y-1.5 font-mono text-xs pr-3">
                        {experimentDataType === "tabular" && [
                          { name: "feature_1", type: "float64", nullable: false },
                          { name: "feature_2", type: "float64", nullable: false },
                          { name: "feature_3", type: "string", nullable: true },
                          { name: "feature_4", type: "int64", nullable: false },
                          { name: "feature_5", type: "float64", nullable: true },
                          { name: "target", type: "int32", nullable: false },
                        ].map((col, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/30">
                            <span className="text-foreground">{col.name}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px]">{col.type}</Badge>
                              {!col.nullable && <Badge variant="warning" className="text-[10px]">NOT NULL</Badge>}
                            </div>
                          </div>
                        ))}
                        {experimentDataType === "images" && [
                          { name: "filename", type: "string", nullable: false },
                          { name: "label", type: "string", nullable: false },
                          { name: "width", type: "int32", nullable: false },
                          { name: "height", type: "int32", nullable: false },
                          { name: "channels", type: "int32", nullable: false },
                          { name: "url", type: "string", nullable: false },
                        ].map((col, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/30">
                            <span className="text-foreground">{col.name}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px]">{col.type}</Badge>
                              {!col.nullable && <Badge variant="warning" className="text-[10px]">NOT NULL</Badge>}
                            </div>
                          </div>
                        ))}
                        {experimentDataType === "text" && [
                          { name: "text", type: "string", nullable: false },
                          { name: "label", type: "string", nullable: false },
                          { name: "tokens", type: "int32", nullable: false },
                          { name: "source", type: "string", nullable: true },
                          { name: "url", type: "string", nullable: false },
                        ].map((col, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/30">
                            <span className="text-foreground">{col.name}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px]">{col.type}</Badge>
                              {!col.nullable && <Badge variant="warning" className="text-[10px]">NOT NULL</Badge>}
                            </div>
                          </div>
                        ))}
                        {experimentDataType === "timeseries" && [
                          { name: "timestamp", type: "datetime64", nullable: false },
                          { name: "value", type: "float64", nullable: false },
                          { name: "feature_1", type: "float64", nullable: true },
                          { name: "feature_2", type: "float64", nullable: true },
                          { name: "anomaly", type: "int32", nullable: false },
                          { name: "window_id", type: "int32", nullable: false },
                        ].map((col, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/30">
                            <span className="text-foreground">{col.name}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px]">{col.type}</Badge>
                              {!col.nullable && <Badge variant="warning" className="text-[10px]">NOT NULL</Badge>}
                            </div>
                          </div>
                        ))}
                        {experimentDataType === "audio" && [
                          { name: "filename", type: "string", nullable: false },
                          { name: "duration", type: "float64", nullable: false },
                          { name: "sample_rate", type: "int32", nullable: false },
                          { name: "channels", type: "int32", nullable: false },
                          { name: "label", type: "string", nullable: false },
                          { name: "speaker", type: "string", nullable: true },
                          { name: "url", type: "string", nullable: false },
                        ].map((col, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/30">
                            <span className="text-foreground">{col.name}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px]">{col.type}</Badge>
                              {!col.nullable && <Badge variant="warning" className="text-[10px]">NOT NULL</Badge>}
                            </div>
                          </div>
                        ))}
                        {experimentDataType === "graph" && [
                          { name: "node_id", type: "string", nullable: false },
                          { name: "node_type", type: "string", nullable: false },
                          { name: "features", type: "tensor[float32]", nullable: false },
                          { name: "edge_source", type: "string", nullable: false },
                          { name: "edge_target", type: "string", nullable: false },
                          { name: "edge_type", type: "string", nullable: false },
                          { name: "weight", type: "float32", nullable: true },
                        ].map((col, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/30">
                            <span className="text-foreground">{col.name}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px]">{col.type}</Badge>
                              {!col.nullable && <Badge variant="warning" className="text-[10px]">NOT NULL</Badge>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm">Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <ScrollArea className="h-[150px]">
                      <div className="space-y-1.5 text-xs pr-3">
                        {experimentDataType === "tabular" && [
                          { label: "Missing Values", value: "0.2%", status: "success" },
                          { label: "Duplicate Rows", value: "0", status: "success" },
                          { label: "Class Balance", value: "52% / 48%", status: "success" },
                          { label: "Outliers Detected", value: "124", status: "warning" },
                          { label: "Last Validated", value: "2024-01-15", status: "info" },
                        ].map((stat, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/30">
                            <span className="text-muted-foreground">{stat.label}</span>
                            <Badge variant={stat.status as any} className="text-[10px]">{stat.value}</Badge>
                          </div>
                        ))}
                        {experimentDataType === "images" && [
                          { label: "Total Images", value: "45,000", status: "info" },
                          { label: "Avg Resolution", value: "384x384", status: "info" },
                          { label: "Classes", value: "6", status: "info" },
                          { label: "Train/Val/Test", value: "70/15/15", status: "success" },
                          { label: "Corrupted Files", value: "0", status: "success" },
                          { label: "Avg File Size", value: "245 KB", status: "info" },
                        ].map((stat, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/30">
                            <span className="text-muted-foreground">{stat.label}</span>
                            <Badge variant={stat.status as any} className="text-[10px]">{stat.value}</Badge>
                          </div>
                        ))}
                        {experimentDataType === "text" && [
                          { label: "Total Documents", value: "30,000", status: "info" },
                          { label: "Avg Tokens", value: "58", status: "info" },
                          { label: "Vocabulary Size", value: "25,432", status: "info" },
                          { label: "Classes", value: "3", status: "info" },
                          { label: "Max Length", value: "512", status: "warning" },
                          { label: "Language", value: "English", status: "success" },
                        ].map((stat, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/30">
                            <span className="text-muted-foreground">{stat.label}</span>
                            <Badge variant={stat.status as any} className="text-[10px]">{stat.value}</Badge>
                          </div>
                        ))}
                        {experimentDataType === "timeseries" && [
                          { label: "Total Records", value: "1,250,000", status: "info" },
                          { label: "Time Range", value: "365 days", status: "info" },
                          { label: "Frequency", value: "15 min", status: "info" },
                          { label: "Anomaly Rate", value: "2.3%", status: "warning" },
                          { label: "Missing Points", value: "0.1%", status: "success" },
                          { label: "Seasonality", value: "Daily", status: "info" },
                        ].map((stat, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/30">
                            <span className="text-muted-foreground">{stat.label}</span>
                            <Badge variant={stat.status as any} className="text-[10px]">{stat.value}</Badge>
                          </div>
                        ))}
                        {experimentDataType === "audio" && [
                          { label: "Total Files", value: "15,420", status: "info" },
                          { label: "Total Duration", value: "156 hrs", status: "info" },
                          { label: "Avg Duration", value: "36.5 sec", status: "info" },
                          { label: "Sample Rates", value: "16-48 kHz", status: "info" },
                          { label: "Classes", value: "5", status: "info" },
                          { label: "Speakers", value: "234", status: "success" },
                        ].map((stat, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/30">
                            <span className="text-muted-foreground">{stat.label}</span>
                            <Badge variant={stat.status as any} className="text-[10px]">{stat.value}</Badge>
                          </div>
                        ))}
                        {experimentDataType === "graph" && [
                          { label: "Total Nodes", value: "125,432", status: "info" },
                          { label: "Total Edges", value: "892,156", status: "info" },
                          { label: "Avg Degree", value: "14.2", status: "info" },
                          { label: "Node Types", value: "4", status: "info" },
                          { label: "Edge Types", value: "4", status: "info" },
                          { label: "Connected Components", value: "3", status: "success" },
                        ].map((stat, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/30">
                            <span className="text-muted-foreground">{stat.label}</span>
                            <Badge variant={stat.status as any} className="text-[10px]">{stat.value}</Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ExperimentDetails;
