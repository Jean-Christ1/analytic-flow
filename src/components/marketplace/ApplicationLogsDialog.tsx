import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Search,
  Download,
  RefreshCw,
  Pause,
  Play,
  Filter,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  Terminal,
  Clock,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface ApplicationLogsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appName: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  source: string;
}

const generateMockLogs = (): LogEntry[] => {
  const messages = [
    { level: "info", message: "Server started on port 5000", source: "main" },
    { level: "info", message: "Database connection established", source: "db" },
    { level: "debug", message: "Processing request GET /api/v1/experiments", source: "api" },
    { level: "info", message: "Experiment 'exp-001' logged successfully", source: "tracking" },
    { level: "warn", message: "High memory usage detected (85%)", source: "monitor" },
    { level: "info", message: "Model artifact uploaded to S3", source: "artifacts" },
    { level: "error", message: "Failed to connect to Redis cache", source: "cache" },
    { level: "info", message: "Metrics endpoint accessed", source: "metrics" },
    { level: "debug", message: "Authenticating user: admin@company.com", source: "auth" },
    { level: "info", message: "Run 'run-abc123' completed successfully", source: "tracking" },
    { level: "warn", message: "Deprecated API endpoint called: /v1/runs", source: "api" },
    { level: "info", message: "Health check passed", source: "health" },
    { level: "debug", message: "Cache miss for key: model_registry_latest", source: "cache" },
    { level: "info", message: "New model version registered: v2.1.0", source: "registry" },
    { level: "error", message: "Connection timeout to external service", source: "external" },
    { level: "info", message: "Batch job 'cleanup' started", source: "jobs" },
    { level: "info", message: "Batch job 'cleanup' completed in 2.3s", source: "jobs" },
    { level: "debug", message: "WebSocket connection established", source: "ws" },
  ];

  return Array.from({ length: 100 }, (_, i) => {
    const msg = messages[i % messages.length];
    const now = new Date();
    now.setMinutes(now.getMinutes() - (100 - i));
    
    return {
      id: `log-${i}`,
      timestamp: now.toISOString().replace("T", " ").slice(0, 19),
      level: msg.level as LogEntry["level"],
      message: msg.message,
      source: msg.source,
    };
  });
};

export const ApplicationLogsDialog = ({
  open,
  onOpenChange,
  appName,
}: ApplicationLogsDialogProps) => {
  const [logs, setLogs] = useState<LogEntry[]>(generateMockLogs());
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [isLive, setIsLive] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.source.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = levelFilter === "all" || log.level === levelFilter;
    const matchesSource = sourceFilter === "all" || log.source === sourceFilter;
    return matchesSearch && matchesLevel && matchesSource;
  });

  const sources = [...new Set(logs.map(l => l.source))];

  useEffect(() => {
    if (isLive && open) {
      const interval = setInterval(() => {
        const newLog: LogEntry = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
          level: ["info", "debug", "warn"][Math.floor(Math.random() * 3)] as LogEntry["level"],
          message: `New log entry - ${Math.random().toString(36).slice(2, 8)}`,
          source: sources[Math.floor(Math.random() * sources.length)],
        };
        setLogs(prev => [...prev.slice(-199), newLog]);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isLive, open]);

  useEffect(() => {
    if (scrollRef.current && isLive) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isLive]);

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "error": return <AlertCircle className="h-4 w-4 text-destructive" />;
      case "warn": return <AlertTriangle className="h-4 w-4 text-warning" />;
      case "info": return <Info className="h-4 w-4 text-info" />;
      case "debug": return <CheckCircle2 className="h-4 w-4 text-muted-foreground" />;
      default: return null;
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "error": return "destructive";
      case "warn": return "warning";
      case "info": return "info";
      case "debug": return "secondary";
      default: return "outline";
    }
  };

  const handleDownload = () => {
    const content = filteredLogs.map(l => `[${l.timestamp}] [${l.level.toUpperCase()}] [${l.source}] ${l.message}`).join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${appName}-logs-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    toast.success("Logs downloaded");
  };

  const handleClearLogs = () => {
    setLogs([]);
    toast.success("Logs cleared");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-primary" />
            Application Logs - {appName}
          </DialogTitle>
          <DialogDescription>
            View and search application logs in real-time
          </DialogDescription>
        </DialogHeader>

        {/* Controls */}
        <div className="flex items-center gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-32 h-9">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="warn">Warning</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="debug">Debug</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-32 h-9">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {sources.map(source => (
                <SelectItem key={source} value={source}>{source}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant={isLive ? "default" : "outline"}
            size="sm"
            onClick={() => setIsLive(!isLive)}
            className="h-9"
          >
            {isLive ? (
              <>
                <Pause className="h-4 w-4 mr-1" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-1" />
                Resume
              </>
            )}
          </Button>

          <Button variant="outline" size="sm" onClick={handleDownload} className="h-9">
            <Download className="h-4 w-4" />
          </Button>

          <Button variant="outline" size="sm" onClick={handleClearLogs} className="h-9">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Log Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {filteredLogs.length} logs
          </span>
          <span className="flex items-center gap-1 text-destructive">
            <AlertCircle className="h-3 w-3" />
            {logs.filter(l => l.level === "error").length} errors
          </span>
          <span className="flex items-center gap-1 text-warning">
            <AlertTriangle className="h-3 w-3" />
            {logs.filter(l => l.level === "warn").length} warnings
          </span>
          {isLive && (
            <span className="flex items-center gap-1 text-success">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
              Live
            </span>
          )}
        </div>

        {/* Logs Display */}
        <div className="border border-border rounded-lg bg-background/50 overflow-hidden">
          <ScrollArea className="h-[400px]" ref={scrollRef}>
            <div className="font-mono text-xs p-2 space-y-0.5">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className={`flex items-start gap-2 p-1.5 rounded hover:bg-muted/50 transition-colors ${
                    log.level === "error" ? "bg-destructive/5" :
                    log.level === "warn" ? "bg-warning/5" : ""
                  }`}
                >
                  <span className="text-muted-foreground whitespace-nowrap flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {log.timestamp}
                  </span>
                  <Badge variant={getLevelBadge(log.level) as any} className="text-[10px] px-1.5 py-0">
                    {log.level.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
                    {log.source}
                  </Badge>
                  <span className={`flex-1 ${
                    log.level === "error" ? "text-destructive" :
                    log.level === "warn" ? "text-warning" : "text-foreground"
                  }`}>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApplicationLogsDialog;
