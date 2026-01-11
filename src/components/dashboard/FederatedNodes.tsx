import { Badge } from "@/components/ui/badge";
import { Server, Wifi, WifiOff } from "lucide-react";

interface Node {
  id: string;
  name: string;
  location: string;
  status: "online" | "offline" | "syncing";
  dataPoints: number;
  lastSync: string;
}

const nodes: Node[] = [
  { id: "node-1", name: "US-East-1", location: "Virginia, USA", status: "online", dataPoints: 125000, lastSync: "2 min ago" },
  { id: "node-2", name: "EU-West-1", location: "Frankfurt, DE", status: "syncing", dataPoints: 98000, lastSync: "1 min ago" },
  { id: "node-3", name: "AP-South-1", location: "Mumbai, IN", status: "online", dataPoints: 87000, lastSync: "5 min ago" },
  { id: "node-4", name: "US-West-2", location: "Oregon, USA", status: "offline", dataPoints: 0, lastSync: "2 hours ago" },
];

const FederatedNodes = () => {
  const onlineCount = nodes.filter(n => n.status === "online").length;
  
  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Federated Nodes</h3>
          <p className="text-sm text-muted-foreground">{onlineCount} of {nodes.length} nodes active</p>
        </div>
        <Badge variant="success">{onlineCount} Online</Badge>
      </div>
      
      <div className="space-y-3">
        {nodes.map((node) => (
          <div 
            key={node.id}
            className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
              node.status === "online" ? "bg-success/20" : 
              node.status === "syncing" ? "bg-primary/20" : 
              "bg-muted"
            }`}>
              {node.status === "offline" ? (
                <WifiOff className={`h-5 w-5 text-muted-foreground`} />
              ) : (
                <Server className={`h-5 w-5 ${
                  node.status === "online" ? "text-success" : "text-primary animate-pulse"
                }`} />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground text-sm">{node.name}</p>
                <span className={`h-2 w-2 rounded-full ${
                  node.status === "online" ? "bg-success" : 
                  node.status === "syncing" ? "bg-primary animate-pulse" : 
                  "bg-muted-foreground"
                }`} />
              </div>
              <p className="text-xs text-muted-foreground">{node.location}</p>
            </div>
            
            <div className="text-right">
              <p className="text-sm font-mono text-foreground">
                {node.dataPoints > 0 ? `${(node.dataPoints / 1000).toFixed(0)}K` : "--"}
              </p>
              <p className="text-xs text-muted-foreground">{node.lastSync}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FederatedNodes;
