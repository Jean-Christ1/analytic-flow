import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Database,
  Download,
  Search,
  Filter,
  Copy,
  Link2,
  Eye,
  ImageIcon,
  FileText,
  Music,
  LineChart as LineChartIcon,
  Network,
  Workflow,
  Table2,
} from "lucide-react";

interface DatasetPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dataset: {
    id: string;
    name: string;
    classification?: string;
    format?: string;
    size?: string;
    version?: string;
    records?: string;
  } | null;
}

type DataType = "tabular" | "images" | "text" | "timeseries" | "audio" | "graph";

// Determine data type from format
const getDataType = (format?: string): DataType => {
  if (!format) return "tabular";
  const f = format.toLowerCase();
  if (f.includes("image") || f.includes("jpg") || f.includes("png")) return "images";
  if (f.includes("json") || f.includes("txt") || f.includes("text")) return "text";
  if (f.includes("csv") || f.includes("time") || f.includes("series")) return "timeseries";
  if (f.includes("wav") || f.includes("mp3") || f.includes("audio")) return "audio";
  if (f.includes("graph") || f.includes("neo4j") || f.includes("graphml")) return "graph";
  return "tabular";
};

// Mock data generators
const generateTabularData = () => Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  feature1: (Math.random() * 100).toFixed(2),
  feature2: (Math.random() * 50).toFixed(2),
  feature3: ["cat_a", "cat_b", "cat_c", "cat_d"][Math.floor(Math.random() * 4)],
  feature4: (Math.random() * 1000).toFixed(0),
  feature5: (Math.random() * 200 - 100).toFixed(3),
  target: Math.random() > 0.5 ? 1 : 0,
}));

const generateImageData = () => Array.from({ length: 30 }, (_, i) => ({
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

const generateTextData = () => Array.from({ length: 30 }, (_, i) => ({
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

const generateTimeseriesData = () => Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  timestamp: new Date(2024, 0, 1, 0, i * 15).toISOString().slice(0, 19).replace("T", " "),
  value: (100 + Math.sin(i * 0.3) * 30 + Math.random() * 10).toFixed(2),
  feature_1: (Math.random() * 50).toFixed(2),
  feature_2: (Math.random() * 100).toFixed(2),
  anomaly: Math.random() > 0.9 ? 1 : 0,
  window_id: Math.floor(i / 10) + 1,
}));

const generateAudioData = () => Array.from({ length: 30 }, (_, i) => ({
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

const generateGraphData = () => ({
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
});

export function DatasetPreviewDialog({ open, onOpenChange, dataset }: DatasetPreviewDialogProps) {
  const [search, setSearch] = useState("");
  
  const dataType = dataset ? getDataType(dataset.format) : "tabular";
  
  // Generate mock data based on type
  const tabularData = useMemo(() => generateTabularData(), []);
  const imageData = useMemo(() => generateImageData(), []);
  const textData = useMemo(() => generateTextData(), []);
  const timeseriesData = useMemo(() => generateTimeseriesData(), []);
  const audioData = useMemo(() => generateAudioData(), []);
  const graphData = useMemo(() => generateGraphData(), []);

  if (!dataset) return null;

  const getDataTypeIcon = () => {
    switch (dataType) {
      case "images": return <ImageIcon className="h-3 w-3 mr-1" />;
      case "text": return <FileText className="h-3 w-3 mr-1" />;
      case "timeseries": return <LineChartIcon className="h-3 w-3 mr-1" />;
      case "audio": return <Music className="h-3 w-3 mr-1" />;
      case "graph": return <Network className="h-3 w-3 mr-1" />;
      default: return <Table2 className="h-3 w-3 mr-1" />;
    }
  };

  const getDataTypeLabel = () => {
    switch (dataType) {
      case "images": return "Images";
      case "text": return "Text";
      case "timeseries": return "Time Series";
      case "audio": return "Audio";
      case "graph": return "Graph";
      default: return "Tabular";
    }
  };

  const getPreviewCount = () => {
    switch (dataType) {
      case "tabular": return `${tabularData.filter(r => !search || r.feature3.toLowerCase().includes(search.toLowerCase())).length} rows`;
      case "images": return `${imageData.filter(r => !search || r.filename.includes(search) || r.label.includes(search)).length} images`;
      case "text": return `${textData.filter(r => !search || r.text.toLowerCase().includes(search.toLowerCase())).length} documents`;
      case "timeseries": return `${timeseriesData.filter(r => !search || r.timestamp.includes(search)).length} records`;
      case "audio": return `${audioData.filter(r => !search || r.filename.includes(search) || r.label.includes(search)).length} files`;
      case "graph": return `${graphData.nodes.length} nodes, ${graphData.edges.length} edges`;
    }
  };

  const getStats = () => {
    switch (dataType) {
      case "tabular": return { samples: dataset.records || "45,000", features: "6", size: dataset.size || "2.4 GB", format: "Parquet" };
      case "images": return { samples: dataset.records || "45,000", features: "3", size: "12.8 GB", format: "JPEG/PNG" };
      case "text": return { samples: dataset.records || "30,000", features: "4", size: "890 MB", format: "TXT/JSON" };
      case "timeseries": return { samples: "1,250,000", features: "6", size: "3.2 GB", format: "CSV/Parquet" };
      case "audio": return { samples: "15,420", features: "8", size: "45.2 GB", format: "WAV/MP3" };
      case "graph": return { samples: `${graphData.nodes.length} nodes`, features: `${graphData.edges.length} edges`, size: "890 MB", format: "GraphML" };
    }
  };

  const stats = getStats();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] w-full overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-info" />
              {dataset.name}
              <Badge variant="info" className="ml-2 text-[10px]">
                {dataset.classification || "PUBLIC"}
              </Badge>
              <Badge variant="outline" className="text-[10px] capitalize flex items-center">
                {getDataTypeIcon()}
                {getDataTypeLabel()}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search data..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
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
                  <p className="text-lg font-bold">{stats.samples}</p>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="py-3 text-center">
                  <p className="text-xs text-muted-foreground">{dataType === "graph" ? "Edges" : "Features"}</p>
                  <p className="text-lg font-bold">{stats.features}</p>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="py-3 text-center">
                  <p className="text-xs text-muted-foreground">Size</p>
                  <p className="text-lg font-bold">{stats.size}</p>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="py-3 text-center">
                  <p className="text-xs text-muted-foreground">Format</p>
                  <p className="text-lg font-bold">{stats.format}</p>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="py-3 text-center">
                  <p className="text-xs text-muted-foreground">Version</p>
                  <p className="text-lg font-bold">v{dataset.version || "1.2"}</p>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="py-3 text-center">
                  <p className="text-xs text-muted-foreground">Storage</p>
                  <p className="text-xs font-mono text-primary truncate">s3://datasets/</p>
                </CardContent>
              </Card>
            </div>

            {/* Data Preview */}
            <Card className="glass-card">
              <CardHeader className="py-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Data Preview ({getPreviewCount()})
                  </span>
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    <Download className="h-3 w-3 mr-1" />Export Sample
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                {/* Tabular Data View */}
                {dataType === "tabular" && (
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
                        {tabularData
                          .filter(row => !search || row.feature3.toLowerCase().includes(search.toLowerCase()) || row.id.toString().includes(search))
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
                              <Badge variant={row.target === 1 ? "success" : "secondary"} className="text-[10px]">{row.target}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <ScrollBar orientation="vertical" />
                  </ScrollArea>
                )}

                {/* Image Data View */}
                {dataType === "images" && (
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
                        {imageData
                          .filter(row => !search || row.filename.toLowerCase().includes(search.toLowerCase()) || row.label.toLowerCase().includes(search.toLowerCase()))
                          .map((row) => (
                          <TableRow key={row.id} className="hover:bg-muted/20">
                            <TableCell className="py-1">
                              <img src={row.thumbnail} alt={row.filename} className="w-12 h-12 rounded object-cover border border-border/50" />
                            </TableCell>
                            <TableCell className="text-xs py-2 font-mono">{row.filename}</TableCell>
                            <TableCell className="text-xs py-2">
                              <Badge variant="info" className="text-[10px]">{row.label}</Badge>
                            </TableCell>
                            <TableCell className="text-xs py-2">{row.width}x{row.height}</TableCell>
                            <TableCell className="text-xs py-2">{row.size}</TableCell>
                            <TableCell className="text-xs py-2">
                              <Badge variant={row.split === "train" ? "success" : row.split === "val" ? "warning" : "secondary"} className="text-[10px]">{row.split}</Badge>
                            </TableCell>
                            <TableCell className="text-xs py-2">
                              <div className="flex items-center gap-1.5">
                                <Link2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                <code className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded truncate max-w-[220px]">{row.url}</code>
                                <Button variant="ghost" size="icon" className="h-5 w-5 flex-shrink-0"><Copy className="h-3 w-3" /></Button>
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
                {dataType === "text" && (
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
                        {textData
                          .filter(row => !search || row.text.toLowerCase().includes(search.toLowerCase()) || row.label.toLowerCase().includes(search.toLowerCase()))
                          .map((row) => (
                          <TableRow key={row.id} className="hover:bg-muted/20">
                            <TableCell className="text-xs py-2 font-mono">{row.id}</TableCell>
                            <TableCell className="text-xs py-2">
                              <p className="line-clamp-2 text-muted-foreground">{row.text}</p>
                            </TableCell>
                            <TableCell className="text-xs py-2">
                              <Badge variant={row.label === "positive" ? "success" : row.label === "negative" ? "destructive" : "secondary"} className="text-[10px]">{row.label}</Badge>
                            </TableCell>
                            <TableCell className="text-xs py-2 font-mono">{row.tokens}</TableCell>
                            <TableCell className="text-xs py-2">
                              <Badge variant="outline" className="text-[10px]">{row.source}</Badge>
                            </TableCell>
                            <TableCell className="text-xs py-2">
                              <div className="flex items-center gap-1.5">
                                <Link2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                <code className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded truncate max-w-[180px]">{row.url}</code>
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
                {dataType === "timeseries" && (
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
                        {timeseriesData
                          .filter(row => !search || row.timestamp.includes(search))
                          .map((row) => (
                          <TableRow key={row.id} className="hover:bg-muted/20">
                            <TableCell className="text-xs py-2 font-mono">{row.id}</TableCell>
                            <TableCell className="text-xs py-2 font-mono text-muted-foreground">{row.timestamp}</TableCell>
                            <TableCell className="text-xs py-2 font-medium">{row.value}</TableCell>
                            <TableCell className="text-xs py-2">{row.feature_1}</TableCell>
                            <TableCell className="text-xs py-2">{row.feature_2}</TableCell>
                            <TableCell className="text-xs py-2">
                              <Badge variant={row.anomaly === 1 ? "destructive" : "success"} className="text-[10px]">{row.anomaly === 1 ? "Yes" : "No"}</Badge>
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
                {dataType === "audio" && (
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
                        {audioData
                          .filter(row => !search || row.filename.toLowerCase().includes(search.toLowerCase()) || row.label.toLowerCase().includes(search.toLowerCase()))
                          .map((row) => (
                          <TableRow key={row.id} className="hover:bg-muted/20">
                            <TableCell className="text-xs py-2 font-mono">{row.id}</TableCell>
                            <TableCell className="text-xs py-2 font-mono">{row.filename}</TableCell>
                            <TableCell className="text-xs py-2">{row.duration}</TableCell>
                            <TableCell className="text-xs py-2">{row.sampleRate} Hz</TableCell>
                            <TableCell className="text-xs py-2">
                              <Badge variant="outline" className="text-[10px]">{row.channels === 1 ? "Mono" : "Stereo"}</Badge>
                            </TableCell>
                            <TableCell className="text-xs py-2">
                              <Badge variant="info" className="text-[10px]">{row.label}</Badge>
                            </TableCell>
                            <TableCell className="text-xs py-2">
                              {row.speaker ? <span className="font-mono text-muted-foreground">{row.speaker}</span> : <span className="text-muted-foreground/50">-</span>}
                            </TableCell>
                            <TableCell className="text-xs py-2">{row.size}</TableCell>
                            <TableCell className="text-xs py-2">
                              <div className="flex items-center gap-1.5">
                                <Link2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                <code className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded truncate max-w-[180px]">{row.url}</code>
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
                {dataType === "graph" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-medium mb-2 flex items-center gap-1.5">
                          <Network className="h-3 w-3 text-primary" />Nodes ({graphData.nodes.length})
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
                              {graphData.nodes.map((node) => (
                                <TableRow key={node.id} className="hover:bg-muted/20">
                                  <TableCell className="text-[10px] py-1 font-mono">{node.id}</TableCell>
                                  <TableCell className="text-[10px] py-1">
                                    <Badge variant="outline" className="text-[9px]">{node.type}</Badge>
                                  </TableCell>
                                  <TableCell className="text-[10px] py-1">{node.features}</TableCell>
                                  <TableCell className="text-[10px] py-1">{node.degree}</TableCell>
                                  <TableCell className="text-[10px] py-1">
                                    <Badge variant={node.label === "positive" ? "success" : "secondary"} className="text-[9px]">{node.label}</Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          <ScrollBar orientation="vertical" />
                        </ScrollArea>
                      </div>
                      <div>
                        <p className="text-xs font-medium mb-2 flex items-center gap-1.5">
                          <Workflow className="h-3 w-3 text-info" />Edges ({graphData.edges.length})
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
                              {graphData.edges.map((edge) => (
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

            {/* Schema and Statistics */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="glass-card">
                <CardHeader className="py-2">
                  <CardTitle className="text-sm">Schema</CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <ScrollArea className="h-[120px]">
                    <div className="space-y-1.5 font-mono text-xs pr-3">
                      {dataType === "tabular" && [
                        { name: "feature_1", type: "float64" },
                        { name: "feature_2", type: "float64" },
                        { name: "feature_3", type: "string" },
                        { name: "feature_4", type: "int64" },
                        { name: "target", type: "int32" },
                      ].map((col, i) => (
                        <div key={i} className="flex items-center justify-between p-1.5 rounded bg-muted/30">
                          <span className="text-foreground">{col.name}</span>
                          <Badge variant="outline" className="text-[10px]">{col.type}</Badge>
                        </div>
                      ))}
                      {dataType === "images" && [
                        { name: "filename", type: "string" },
                        { name: "label", type: "string" },
                        { name: "width", type: "int32" },
                        { name: "height", type: "int32" },
                        { name: "url", type: "string" },
                      ].map((col, i) => (
                        <div key={i} className="flex items-center justify-between p-1.5 rounded bg-muted/30">
                          <span className="text-foreground">{col.name}</span>
                          <Badge variant="outline" className="text-[10px]">{col.type}</Badge>
                        </div>
                      ))}
                      {dataType === "text" && [
                        { name: "text", type: "string" },
                        { name: "label", type: "string" },
                        { name: "tokens", type: "int32" },
                        { name: "source", type: "string" },
                      ].map((col, i) => (
                        <div key={i} className="flex items-center justify-between p-1.5 rounded bg-muted/30">
                          <span className="text-foreground">{col.name}</span>
                          <Badge variant="outline" className="text-[10px]">{col.type}</Badge>
                        </div>
                      ))}
                      {dataType === "timeseries" && [
                        { name: "timestamp", type: "datetime64" },
                        { name: "value", type: "float64" },
                        { name: "feature_1", type: "float64" },
                        { name: "anomaly", type: "int32" },
                      ].map((col, i) => (
                        <div key={i} className="flex items-center justify-between p-1.5 rounded bg-muted/30">
                          <span className="text-foreground">{col.name}</span>
                          <Badge variant="outline" className="text-[10px]">{col.type}</Badge>
                        </div>
                      ))}
                      {dataType === "audio" && [
                        { name: "filename", type: "string" },
                        { name: "duration", type: "float64" },
                        { name: "sample_rate", type: "int32" },
                        { name: "label", type: "string" },
                      ].map((col, i) => (
                        <div key={i} className="flex items-center justify-between p-1.5 rounded bg-muted/30">
                          <span className="text-foreground">{col.name}</span>
                          <Badge variant="outline" className="text-[10px]">{col.type}</Badge>
                        </div>
                      ))}
                      {dataType === "graph" && [
                        { name: "node_id", type: "string" },
                        { name: "features", type: "tensor" },
                        { name: "edge_source", type: "string" },
                        { name: "edge_target", type: "string" },
                      ].map((col, i) => (
                        <div key={i} className="flex items-center justify-between p-1.5 rounded bg-muted/30">
                          <span className="text-foreground">{col.name}</span>
                          <Badge variant="outline" className="text-[10px]">{col.type}</Badge>
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
                  <ScrollArea className="h-[120px]">
                    <div className="space-y-1.5 text-xs pr-3">
                      {dataType === "tabular" && [
                        { label: "Missing Values", value: "0.2%", status: "success" },
                        { label: "Duplicate Rows", value: "0", status: "success" },
                        { label: "Class Balance", value: "52% / 48%", status: "success" },
                        { label: "Outliers", value: "124", status: "warning" },
                      ].map((stat, i) => (
                        <div key={i} className="flex items-center justify-between p-1.5 rounded bg-muted/30">
                          <span className="text-muted-foreground">{stat.label}</span>
                          <Badge variant={stat.status as any} className="text-[10px]">{stat.value}</Badge>
                        </div>
                      ))}
                      {dataType === "images" && [
                        { label: "Total Images", value: "45,000", status: "info" },
                        { label: "Avg Resolution", value: "384x384", status: "info" },
                        { label: "Classes", value: "6", status: "info" },
                        { label: "Train/Val/Test", value: "70/15/15", status: "success" },
                      ].map((stat, i) => (
                        <div key={i} className="flex items-center justify-between p-1.5 rounded bg-muted/30">
                          <span className="text-muted-foreground">{stat.label}</span>
                          <Badge variant={stat.status as any} className="text-[10px]">{stat.value}</Badge>
                        </div>
                      ))}
                      {dataType === "text" && [
                        { label: "Documents", value: "30,000", status: "info" },
                        { label: "Avg Tokens", value: "58", status: "info" },
                        { label: "Vocabulary", value: "25,432", status: "info" },
                        { label: "Classes", value: "3", status: "info" },
                      ].map((stat, i) => (
                        <div key={i} className="flex items-center justify-between p-1.5 rounded bg-muted/30">
                          <span className="text-muted-foreground">{stat.label}</span>
                          <Badge variant={stat.status as any} className="text-[10px]">{stat.value}</Badge>
                        </div>
                      ))}
                      {dataType === "timeseries" && [
                        { label: "Records", value: "1,250,000", status: "info" },
                        { label: "Time Range", value: "365 days", status: "info" },
                        { label: "Frequency", value: "15 min", status: "info" },
                        { label: "Anomaly Rate", value: "2.3%", status: "warning" },
                      ].map((stat, i) => (
                        <div key={i} className="flex items-center justify-between p-1.5 rounded bg-muted/30">
                          <span className="text-muted-foreground">{stat.label}</span>
                          <Badge variant={stat.status as any} className="text-[10px]">{stat.value}</Badge>
                        </div>
                      ))}
                      {dataType === "audio" && [
                        { label: "Total Files", value: "15,420", status: "info" },
                        { label: "Total Duration", value: "156 hrs", status: "info" },
                        { label: "Avg Duration", value: "36.5 sec", status: "info" },
                        { label: "Speakers", value: "234", status: "success" },
                      ].map((stat, i) => (
                        <div key={i} className="flex items-center justify-between p-1.5 rounded bg-muted/30">
                          <span className="text-muted-foreground">{stat.label}</span>
                          <Badge variant={stat.status as any} className="text-[10px]">{stat.value}</Badge>
                        </div>
                      ))}
                      {dataType === "graph" && [
                        { label: "Total Nodes", value: "125,432", status: "info" },
                        { label: "Total Edges", value: "892,156", status: "info" },
                        { label: "Avg Degree", value: "14.2", status: "info" },
                        { label: "Node Types", value: "4", status: "info" },
                      ].map((stat, i) => (
                        <div key={i} className="flex items-center justify-between p-1.5 rounded bg-muted/30">
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
  );
}