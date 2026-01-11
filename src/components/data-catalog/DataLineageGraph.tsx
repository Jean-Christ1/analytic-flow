import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Database, 
  Box, 
  GitBranch, 
  ArrowRight, 
  Layers,
  FileText,
  Zap,
  Server,
  Eye,
  ZoomIn,
  ZoomOut,
  Maximize2
} from "lucide-react";
import { datasets, models, pipelines, getProjectById } from "@/data/platformData";
import { Link } from "react-router-dom";

interface LineageNode {
  id: string;
  type: "source" | "dataset" | "pipeline" | "model" | "endpoint";
  name: string;
  status?: string;
  projectId?: string;
}

interface LineageEdge {
  from: string;
  to: string;
  label?: string;
}

export const DataLineageGraph = () => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Build lineage data from actual platform data
  const lineageNodes: LineageNode[] = [
    // Source systems
    { id: "src-pos", type: "source", name: "POS Systems" },
    { id: "src-web", type: "source", name: "Web App" },
    { id: "src-mobile", type: "source", name: "Mobile App" },
    { id: "src-payments", type: "source", name: "Payment Gateway" },
    { id: "src-cameras", type: "source", name: "Store Cameras" },
    
    // Datasets
    ...datasets.map(d => ({
      id: d.id,
      type: "dataset" as const,
      name: d.name,
      status: d.quality > 95 ? "healthy" : "warning",
      projectId: d.projectId,
    })),
    
    // Pipelines
    ...pipelines.map(p => ({
      id: p.id,
      type: "pipeline" as const,
      name: p.name,
      status: p.status,
      projectId: p.projectId,
    })),
    
    // Models
    ...models.map(m => ({
      id: m.id,
      type: "model" as const,
      name: m.name,
      status: m.stage === "Production" ? "healthy" : m.stage === "Staging" ? "warning" : "info",
      projectId: m.projectId,
    })),
    
    // Endpoints
    { id: "ep-prod-us", type: "endpoint", name: "prod-us-east-1" },
    { id: "ep-prod-eu", type: "endpoint", name: "prod-eu-west-1" },
    { id: "ep-prod-ap", type: "endpoint", name: "prod-ap-south-1" },
  ];

  const lineageEdges: LineageEdge[] = [
    // Source to Dataset connections
    { from: "src-cameras", to: "dataset-001", label: "Raw Images" },
    { from: "src-cameras", to: "dataset-004", label: "Inventory" },
    { from: "src-web", to: "dataset-002", label: "Feedback" },
    { from: "src-payments", to: "dataset-003", label: "Transactions" },
    { from: "src-web", to: "dataset-007", label: "Events" },
    { from: "src-mobile", to: "dataset-007", label: "Events" },
    { from: "src-pos", to: "dataset-006", label: "Sales" },
    
    // Dataset to Pipeline connections
    { from: "dataset-001", to: "pipeline-001", label: "Training Data" },
    { from: "dataset-004", to: "pipeline-001", label: "Validation" },
    { from: "dataset-002", to: "pipeline-002", label: "Text Data" },
    { from: "dataset-003", to: "pipeline-003", label: "Transactions" },
    { from: "dataset-005", to: "pipeline-003", label: "Labels" },
    { from: "dataset-004", to: "pipeline-004", label: "Images" },
    { from: "dataset-006", to: "pipeline-005", label: "Time Series" },
    { from: "dataset-007", to: "pipeline-006", label: "User Events" },
    
    // Pipeline to Model connections
    { from: "pipeline-001", to: "model-001", label: "Train" },
    { from: "pipeline-002", to: "model-002", label: "Fine-tune" },
    { from: "pipeline-003", to: "model-003", label: "Update" },
    { from: "pipeline-004", to: "model-006", label: "Train" },
    { from: "pipeline-005", to: "model-004", label: "Forecast" },
    { from: "pipeline-006", to: "model-005", label: "Features" },
    
    // Model to Endpoint connections
    { from: "model-001", to: "ep-prod-us", label: "Deploy" },
    { from: "model-001", to: "ep-prod-eu", label: "Deploy" },
    { from: "model-003", to: "ep-prod-us", label: "Deploy" },
    { from: "model-003", to: "ep-prod-eu", label: "Deploy" },
    { from: "model-003", to: "ep-prod-ap", label: "Deploy" },
  ];

  const getNodeIcon = (type: string) => {
    switch (type) {
      case "source": return <Server className="h-4 w-4" />;
      case "dataset": return <Database className="h-4 w-4" />;
      case "pipeline": return <GitBranch className="h-4 w-4" />;
      case "model": return <Box className="h-4 w-4" />;
      case "endpoint": return <Zap className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getNodeColor = (type: string, status?: string) => {
    if (status === "healthy") return "border-success/50 bg-success/5";
    if (status === "warning") return "border-warning/50 bg-warning/5";
    if (status === "failed") return "border-destructive/50 bg-destructive/5";
    
    switch (type) {
      case "source": return "border-muted-foreground/50 bg-muted/30";
      case "dataset": return "border-info/50 bg-info/5";
      case "pipeline": return "border-primary/50 bg-primary/5";
      case "model": return "border-gold/50 bg-gold/5";
      case "endpoint": return "border-success/50 bg-success/5";
      default: return "border-border bg-muted/30";
    }
  };

  const getSelectedNodeDetails = () => {
    if (!selectedNode) return null;
    
    const node = lineageNodes.find(n => n.id === selectedNode);
    if (!node) return null;
    
    const incomingEdges = lineageEdges.filter(e => e.to === selectedNode);
    const outgoingEdges = lineageEdges.filter(e => e.from === selectedNode);
    
    return { node, incomingEdges, outgoingEdges };
  };

  const nodeDetails = getSelectedNodeDetails();

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded border border-muted-foreground/50 bg-muted/30" />
              <span>Source</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded border border-info/50 bg-info/5" />
              <span>Dataset</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded border border-primary/50 bg-primary/5" />
              <span>Pipeline</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded border border-gold/50 bg-gold/5" />
              <span>Model</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded border border-success/50 bg-success/5" />
              <span>Endpoint</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.1))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
          <Button variant="outline" size="icon" onClick={() => setZoomLevel(z => Math.min(1.5, z + 0.1))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setZoomLevel(1)}>
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {/* Lineage Graph Visualization */}
        <Card className="glass-card col-span-3">
          <CardContent className="p-6">
            <div 
              className="relative overflow-auto"
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: "top left" }}
            >
              {/* Layered visualization */}
              <div className="flex gap-8 min-w-[1200px]">
                {/* Sources Layer */}
                <div className="flex flex-col gap-3 min-w-[150px]">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Sources
                  </div>
                  {lineageNodes.filter(n => n.type === "source").map(node => (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNode(node.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-105 ${
                        getNodeColor(node.type, node.status)
                      } ${selectedNode === node.id ? "ring-2 ring-primary" : ""}`}
                    >
                      <div className="flex items-center gap-2">
                        {getNodeIcon(node.type)}
                        <span className="text-xs font-medium truncate">{node.name}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Arrow */}
                <div className="flex items-center">
                  <ArrowRight className="h-6 w-6 text-muted-foreground" />
                </div>

                {/* Datasets Layer */}
                <div className="flex flex-col gap-3 min-w-[180px]">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Datasets
                  </div>
                  {lineageNodes.filter(n => n.type === "dataset").map(node => {
                    const project = node.projectId ? getProjectById(node.projectId) : null;
                    return (
                      <div
                        key={node.id}
                        onClick={() => setSelectedNode(node.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-105 ${
                          getNodeColor(node.type, node.status)
                        } ${selectedNode === node.id ? "ring-2 ring-primary" : ""}`}
                      >
                        <div className="flex items-center gap-2">
                          {getNodeIcon(node.type)}
                          <span className="text-xs font-medium truncate">{node.name}</span>
                        </div>
                        {project && (
                          <div className="mt-1 text-[10px] text-muted-foreground truncate">
                            {project.name}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Arrow */}
                <div className="flex items-center">
                  <ArrowRight className="h-6 w-6 text-muted-foreground" />
                </div>

                {/* Pipelines Layer */}
                <div className="flex flex-col gap-3 min-w-[180px]">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Pipelines
                  </div>
                  {lineageNodes.filter(n => n.type === "pipeline").map(node => {
                    const project = node.projectId ? getProjectById(node.projectId) : null;
                    return (
                      <div
                        key={node.id}
                        onClick={() => setSelectedNode(node.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-105 ${
                          getNodeColor(node.type, node.status)
                        } ${selectedNode === node.id ? "ring-2 ring-primary" : ""}`}
                      >
                        <div className="flex items-center gap-2">
                          {getNodeIcon(node.type)}
                          <span className="text-xs font-medium truncate">{node.name}</span>
                        </div>
                        {project && (
                          <div className="mt-1 text-[10px] text-muted-foreground truncate">
                            {project.name}
                          </div>
                        )}
                        <Badge 
                          variant={node.status === "active" ? "success" : node.status === "paused" ? "warning" : "secondary"}
                          className="mt-1 text-[10px]"
                        >
                          {node.status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>

                {/* Arrow */}
                <div className="flex items-center">
                  <ArrowRight className="h-6 w-6 text-muted-foreground" />
                </div>

                {/* Models Layer */}
                <div className="flex flex-col gap-3 min-w-[180px]">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Models
                  </div>
                  {lineageNodes.filter(n => n.type === "model").map(node => {
                    const project = node.projectId ? getProjectById(node.projectId) : null;
                    return (
                      <Link 
                        key={node.id}
                        to={`/models/${node.id}`}
                        onClick={(e) => { e.stopPropagation(); setSelectedNode(node.id); }}
                        className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-105 block ${
                          getNodeColor(node.type, node.status)
                        } ${selectedNode === node.id ? "ring-2 ring-primary" : ""}`}
                      >
                        <div className="flex items-center gap-2">
                          {getNodeIcon(node.type)}
                          <span className="text-xs font-medium truncate">{node.name}</span>
                        </div>
                        {project && (
                          <div className="mt-1 text-[10px] text-muted-foreground truncate">
                            {project.name}
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>

                {/* Arrow */}
                <div className="flex items-center">
                  <ArrowRight className="h-6 w-6 text-muted-foreground" />
                </div>

                {/* Endpoints Layer */}
                <div className="flex flex-col gap-3 min-w-[150px]">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Endpoints
                  </div>
                  {lineageNodes.filter(n => n.type === "endpoint").map(node => (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNode(node.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-105 ${
                        getNodeColor(node.type, "healthy")
                      } ${selectedNode === node.id ? "ring-2 ring-primary" : ""}`}
                    >
                      <div className="flex items-center gap-2">
                        {getNodeIcon(node.type)}
                        <span className="text-xs font-medium truncate">{node.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Node Details Panel */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              Node Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nodeDetails ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {getNodeIcon(nodeDetails.node.type)}
                    <span className="font-semibold">{nodeDetails.node.name}</span>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {nodeDetails.node.type}
                  </Badge>
                </div>

                {nodeDetails.node.projectId && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Project</p>
                    <Link 
                      to={`/projects/${nodeDetails.node.projectId}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {getProjectById(nodeDetails.node.projectId)?.name}
                    </Link>
                  </div>
                )}

                {nodeDetails.incomingEdges.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Upstream ({nodeDetails.incomingEdges.length})</p>
                    <div className="space-y-1">
                      {nodeDetails.incomingEdges.map((edge, i) => {
                        const sourceNode = lineageNodes.find(n => n.id === edge.from);
                        return (
                          <div key={i} className="text-xs p-2 rounded bg-muted/30 flex items-center gap-2">
                            {sourceNode && getNodeIcon(sourceNode.type)}
                            <span className="truncate">{sourceNode?.name}</span>
                            {edge.label && (
                              <span className="text-muted-foreground">({edge.label})</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {nodeDetails.outgoingEdges.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Downstream ({nodeDetails.outgoingEdges.length})</p>
                    <div className="space-y-1">
                      {nodeDetails.outgoingEdges.map((edge, i) => {
                        const targetNode = lineageNodes.find(n => n.id === edge.to);
                        return (
                          <div key={i} className="text-xs p-2 rounded bg-muted/30 flex items-center gap-2">
                            {targetNode && getNodeIcon(targetNode.type)}
                            <span className="truncate">{targetNode?.name}</span>
                            {edge.label && (
                              <span className="text-muted-foreground">({edge.label})</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Select a node to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
