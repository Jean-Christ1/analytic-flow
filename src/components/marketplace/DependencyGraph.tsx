import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ZoomIn, ZoomOut, Maximize2, RefreshCw } from "lucide-react";

interface DependencyNode {
  id: string;
  name: string;
  icon: string;
  category: string;
  status: "running" | "installed" | "stopped" | "available";
  x?: number;
  y?: number;
}

interface DependencyEdge {
  from: string;
  to: string;
  type: "requires" | "optional" | "integrates";
  label?: string;
}

const nodes: DependencyNode[] = [
  { id: "grafana", name: "Grafana", icon: "📈", category: "Observability", status: "running" },
  { id: "prometheus", name: "Prometheus", icon: "🔥", category: "Observability", status: "running" },
  { id: "loki", name: "Loki", icon: "📝", category: "Observability", status: "running" },
  { id: "opentelemetry", name: "OpenTelemetry", icon: "🔭", category: "Observability", status: "installed" },
  { id: "mlflow", name: "MLflow", icon: "🚀", category: "MLOps", status: "running" },
  { id: "feast", name: "Feast", icon: "🍽️", category: "MLOps", status: "installed" },
  { id: "minio", name: "MinIO", icon: "📦", category: "Infrastructure", status: "running" },
  { id: "postgresql", name: "PostgreSQL", icon: "🐘", category: "Infrastructure", status: "running" },
  { id: "redis", name: "Redis", icon: "⚡", category: "Infrastructure", status: "running" },
  { id: "vault", name: "Vault", icon: "🔐", category: "Security", status: "running" },
  { id: "argocd", name: "ArgoCD", icon: "🔄", category: "CI/CD", status: "installed" },
  { id: "datahub", name: "DataHub", icon: "📊", category: "Data", status: "running" },
  { id: "trivy", name: "Trivy", icon: "🔒", category: "Security", status: "running" },
  { id: "opa", name: "OPA", icon: "🛡️", category: "Security", status: "installed" },
  { id: "jupyterhub", name: "JupyterHub", icon: "📓", category: "Development", status: "installed" },
  { id: "kubecost", name: "Kubecost", icon: "💰", category: "FinOps", status: "installed" },
];

const edges: DependencyEdge[] = [
  { from: "grafana", to: "prometheus", type: "requires", label: "metrics source" },
  { from: "grafana", to: "loki", type: "integrates", label: "logs source" },
  { from: "mlflow", to: "minio", type: "requires", label: "artifact storage" },
  { from: "mlflow", to: "postgresql", type: "requires", label: "metadata store" },
  { from: "feast", to: "redis", type: "requires", label: "online store" },
  { from: "feast", to: "postgresql", type: "requires", label: "registry" },
  { from: "datahub", to: "postgresql", type: "requires", label: "metadata" },
  { from: "datahub", to: "opentelemetry", type: "optional", label: "tracing" },
  { from: "argocd", to: "vault", type: "optional", label: "secrets" },
  { from: "loki", to: "minio", type: "requires", label: "log storage" },
  { from: "prometheus", to: "opentelemetry", type: "integrates", label: "metrics receiver" },
  { from: "jupyterhub", to: "postgresql", type: "requires", label: "user db" },
  { from: "jupyterhub", to: "vault", type: "optional", label: "secrets" },
  { from: "kubecost", to: "prometheus", type: "requires", label: "metrics" },
  { from: "trivy", to: "opa", type: "integrates", label: "policy checks" },
  { from: "mlflow", to: "prometheus", type: "optional", label: "metrics export" },
];

const categoryColors: Record<string, { bg: string; border: string; text: string }> = {
  Observability: { bg: "bg-orange-500/20", border: "border-orange-500/50", text: "text-orange-400" },
  MLOps: { bg: "bg-blue-500/20", border: "border-blue-500/50", text: "text-blue-400" },
  Infrastructure: { bg: "bg-purple-500/20", border: "border-purple-500/50", text: "text-purple-400" },
  Security: { bg: "bg-red-500/20", border: "border-red-500/50", text: "text-red-400" },
  "CI/CD": { bg: "bg-green-500/20", border: "border-green-500/50", text: "text-green-400" },
  Data: { bg: "bg-cyan-500/20", border: "border-cyan-500/50", text: "text-cyan-400" },
  Development: { bg: "bg-yellow-500/20", border: "border-yellow-500/50", text: "text-yellow-400" },
  FinOps: { bg: "bg-emerald-500/20", border: "border-emerald-500/50", text: "text-emerald-400" },
};

const statusColors: Record<string, string> = {
  running: "bg-green-500",
  installed: "bg-blue-500",
  stopped: "bg-muted",
  available: "bg-muted-foreground/30",
};

export default function DependencyGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});

  useEffect(() => {
    // Calculate node positions in a force-directed-like layout
    const width = 900;
    const height = 600;
    const centerX = width / 2;
    const centerY = height / 2;

    // Group nodes by category
    const categories = [...new Set(nodes.map(n => n.category))];
    const angleStep = (2 * Math.PI) / categories.length;

    const newPositions: Record<string, { x: number; y: number }> = {};
    
    categories.forEach((category, catIndex) => {
      const categoryNodes = nodes.filter(n => n.category === category);
      const baseAngle = catIndex * angleStep - Math.PI / 2;
      const radius = 220;
      
      categoryNodes.forEach((node, nodeIndex) => {
        const spreadAngle = 0.4;
        const nodeAngle = baseAngle + (nodeIndex - (categoryNodes.length - 1) / 2) * spreadAngle * 0.3;
        const nodeRadius = radius + (nodeIndex % 2) * 60;
        
        newPositions[node.id] = {
          x: centerX + Math.cos(nodeAngle) * nodeRadius,
          y: centerY + Math.sin(nodeAngle) * nodeRadius,
        };
      });
    });

    setPositions(newPositions);
  }, []);

  const filteredNodes = filter === "all" 
    ? nodes 
    : nodes.filter(n => n.category === filter);

  const filteredEdges = edges.filter(e => {
    if (filter === "all") return true;
    const fromNode = nodes.find(n => n.id === e.from);
    const toNode = nodes.find(n => n.id === e.to);
    return fromNode?.category === filter || toNode?.category === filter;
  });

  const getEdgeColor = (type: DependencyEdge["type"]) => {
    switch (type) {
      case "requires": return "hsl(var(--primary))";
      case "optional": return "hsl(var(--muted-foreground))";
      case "integrates": return "hsl(142 76% 36%)";
    }
  };

  const getEdgeStroke = (type: DependencyEdge["type"]) => {
    switch (type) {
      case "requires": return "4,0";
      case "optional": return "8,4";
      case "integrates": return "2,2";
    }
  };

  const connectedNodes = selectedNode 
    ? new Set([
        selectedNode,
        ...edges.filter(e => e.from === selectedNode || e.to === selectedNode)
          .flatMap(e => [e.from, e.to])
      ])
    : null;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48 bg-card border-border">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.keys(categoryColors).map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedNode && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSelectedNode(null)}
              className="text-muted-foreground"
            >
              Clear Selection
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
            className="bg-card border-border"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setZoom(z => Math.min(2, z + 0.1))}
            className="bg-card border-border"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setZoom(1)}
            className="bg-card border-border"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Legend */}
      <Card className="bg-card/50 border-border">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground font-medium">EDGE TYPES:</span>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-primary" />
                <span className="text-xs text-muted-foreground">Required</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 border-t-2 border-dashed border-muted-foreground" />
                <span className="text-xs text-muted-foreground">Optional</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 border-t-2 border-dotted border-green-500" />
                <span className="text-xs text-muted-foreground">Integrates</span>
              </div>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground font-medium">STATUS:</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs text-muted-foreground">Running</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-xs text-muted-foreground">Installed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-muted" />
                <span className="text-xs text-muted-foreground">Stopped</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Graph */}
      <Card className="bg-card/50 border-border overflow-hidden">
        <CardContent className="p-0">
          <div 
            ref={containerRef}
            className="relative w-full h-[600px] overflow-hidden bg-gradient-to-br from-background via-background to-muted/10"
          >
            {/* Grid pattern */}
            <svg className="absolute inset-0 w-full h-full opacity-20">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-border" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            <svg 
              ref={svgRef}
              className="w-full h-full"
              style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon 
                    points="0 0, 10 3.5, 0 7" 
                    fill="hsl(var(--primary))" 
                    opacity="0.7"
                  />
                </marker>
                <marker
                  id="arrowhead-muted"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon 
                    points="0 0, 10 3.5, 0 7" 
                    fill="hsl(var(--muted-foreground))" 
                    opacity="0.5"
                  />
                </marker>
                <marker
                  id="arrowhead-green"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon 
                    points="0 0, 10 3.5, 0 7" 
                    fill="hsl(142 76% 36%)" 
                    opacity="0.7"
                  />
                </marker>
              </defs>

              {/* Edges */}
              <g className="edges">
                {filteredEdges.map((edge, idx) => {
                  const from = positions[edge.from];
                  const to = positions[edge.to];
                  if (!from || !to) return null;

                  const isHighlighted = !selectedNode || 
                    (connectedNodes?.has(edge.from) && connectedNodes?.has(edge.to));
                  
                  // Calculate control points for curved lines
                  const midX = (from.x + to.x) / 2;
                  const midY = (from.y + to.y) / 2;
                  const dx = to.x - from.x;
                  const dy = to.y - from.y;
                  const offset = 30;
                  const controlX = midX - dy * 0.15;
                  const controlY = midY + dx * 0.15;

                  const markerId = edge.type === "requires" 
                    ? "arrowhead" 
                    : edge.type === "integrates" 
                    ? "arrowhead-green" 
                    : "arrowhead-muted";

                  return (
                    <g key={idx} opacity={isHighlighted ? 1 : 0.15}>
                      <path
                        d={`M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`}
                        stroke={getEdgeColor(edge.type)}
                        strokeWidth={edge.type === "requires" ? 2 : 1.5}
                        strokeDasharray={getEdgeStroke(edge.type)}
                        fill="none"
                        markerEnd={`url(#${markerId})`}
                        className="transition-opacity duration-300"
                      />
                      {edge.label && isHighlighted && (
                        <text
                          x={controlX}
                          y={controlY - 8}
                          textAnchor="middle"
                          className="text-[10px] fill-muted-foreground"
                        >
                          {edge.label}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>

              {/* Nodes */}
              <g className="nodes">
                {filteredNodes.map(node => {
                  const pos = positions[node.id];
                  if (!pos) return null;

                  const colors = categoryColors[node.category] || categoryColors.Infrastructure;
                  const isHighlighted = !selectedNode || connectedNodes?.has(node.id);
                  const isSelected = selectedNode === node.id;

                  return (
                    <g 
                      key={node.id} 
                      transform={`translate(${pos.x}, ${pos.y})`}
                      className="cursor-pointer transition-all duration-300"
                      opacity={isHighlighted ? 1 : 0.25}
                      onClick={() => setSelectedNode(prev => prev === node.id ? null : node.id)}
                    >
                      {/* Glow effect for selected */}
                      {isSelected && (
                        <circle
                          r="50"
                          fill="none"
                          stroke="hsl(var(--primary))"
                          strokeWidth="2"
                          opacity="0.3"
                          className="animate-pulse"
                        />
                      )}
                      
                      {/* Node background */}
                      <circle
                        r="36"
                        className={`${colors.bg} ${colors.border} transition-all duration-200 ${
                          isSelected ? "stroke-2" : "stroke-1"
                        }`}
                        fill="hsl(var(--card))"
                        stroke={isSelected ? "hsl(var(--primary))" : undefined}
                      />
                      
                      {/* Status indicator */}
                      <circle
                        cx="24"
                        cy="-24"
                        r="6"
                        className={`${statusColors[node.status]}`}
                        stroke="hsl(var(--card))"
                        strokeWidth="2"
                      />
                      
                      {/* Icon */}
                      <text
                        textAnchor="middle"
                        dominantBaseline="middle"
                        y="-4"
                        className="text-2xl"
                      >
                        {node.icon}
                      </text>
                      
                      {/* Name */}
                      <text
                        textAnchor="middle"
                        y="20"
                        className={`text-[10px] font-medium fill-foreground`}
                      >
                        {node.name}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>
        </CardContent>
      </Card>

      {/* Selected Node Details */}
      {selectedNode && (
        <Card className="bg-card/50 border-border border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-3">
              <span className="text-2xl">
                {nodes.find(n => n.id === selectedNode)?.icon}
              </span>
              {nodes.find(n => n.id === selectedNode)?.name}
              <Badge variant="outline" className={`${
                categoryColors[nodes.find(n => n.id === selectedNode)?.category || ""]?.text
              }`}>
                {nodes.find(n => n.id === selectedNode)?.category}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Dependencies (requires)</h4>
                <div className="space-y-2">
                  {edges
                    .filter(e => e.from === selectedNode && e.type === "requires")
                    .map((e, idx) => {
                      const target = nodes.find(n => n.id === e.to);
                      return (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <span>{target?.icon}</span>
                          <span>{target?.name}</span>
                          <span className="text-muted-foreground">— {e.label}</span>
                        </div>
                      );
                    })}
                  {edges.filter(e => e.from === selectedNode && e.type === "requires").length === 0 && (
                    <span className="text-sm text-muted-foreground">No dependencies</span>
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Dependents (used by)</h4>
                <div className="space-y-2">
                  {edges
                    .filter(e => e.to === selectedNode)
                    .map((e, idx) => {
                      const source = nodes.find(n => n.id === e.from);
                      return (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <span>{source?.icon}</span>
                          <span>{source?.name}</span>
                          <span className="text-muted-foreground">— {e.label}</span>
                        </div>
                      );
                    })}
                  {edges.filter(e => e.to === selectedNode).length === 0 && (
                    <span className="text-sm text-muted-foreground">No dependents</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
