import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Package, Search, Plus, ExternalLink, CheckCircle, 
  AlertTriangle, Loader2, GitBranch, Server
} from "lucide-react";

interface HelmImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const popularRepos = [
  { name: 'Bitnami', url: 'https://charts.bitnami.com/bitnami', charts: 250 },
  { name: 'Prometheus Community', url: 'https://prometheus-community.github.io/helm-charts', charts: 45 },
  { name: 'Grafana', url: 'https://grafana.github.io/helm-charts', charts: 28 },
  { name: 'Elastic', url: 'https://helm.elastic.co', charts: 12 },
  { name: 'Apache', url: 'https://apache.github.io/airflow-helm-chart', charts: 8 },
  { name: 'HashiCorp', url: 'https://helm.releases.hashicorp.com', charts: 15 },
];

const sampleCharts = [
  { name: 'redis', version: '18.4.0', appVersion: '7.2.3', description: 'Redis is an open source, advanced key-value store.' },
  { name: 'postgresql', version: '13.2.24', appVersion: '16.1.0', description: 'PostgreSQL is a powerful, open source object-relational database.' },
  { name: 'nginx', version: '15.4.4', appVersion: '1.25.3', description: 'NGINX Open Source is a web server for various workloads.' },
  { name: 'kafka', version: '26.6.2', appVersion: '3.6.1', description: 'Apache Kafka is a distributed streaming platform.' },
  { name: 'mongodb', version: '14.4.3', appVersion: '7.0.4', description: 'MongoDB is a cross-platform document-oriented NoSQL database.' },
  { name: 'rabbitmq', version: '12.5.6', appVersion: '3.12.10', description: 'RabbitMQ is an open source message broker software.' },
];

const HelmImportDialog = ({ open, onOpenChange }: HelmImportDialogProps) => {
  const [activeTab, setActiveTab] = useState('browse');
  const [repoUrl, setRepoUrl] = useState('');
  const [chartName, setChartName] = useState('');
  const [chartVersion, setChartVersion] = useState('');
  const [releaseName, setReleaseName] = useState('');
  const [namespace, setNamespace] = useState('default');
  const [environment, setEnvironment] = useState('');
  const [valuesYaml, setValuesYaml] = useState('');
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedChart, setSelectedChart] = useState<typeof sampleCharts[0] | null>(null);

  const filteredCharts = sampleCharts.filter(chart => 
    chart.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chart.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeploy = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onOpenChange(false);
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Import Helm Chart
          </DialogTitle>
          <DialogDescription>
            Deploy applications from Helm repositories to your infrastructure
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="browse">Browse Repositories</TabsTrigger>
            <TabsTrigger value="custom">Custom Chart</TabsTrigger>
            <TabsTrigger value="configure" disabled={!selectedChart && !chartName}>Configure</TabsTrigger>
          </TabsList>

          {/* Browse Tab */}
          <TabsContent value="browse" className="space-y-4 mt-4">
            <div className="grid grid-cols-3 gap-4">
              {/* Repositories List */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Popular Repositories</Label>
                <ScrollArea className="h-[300px] border border-border/50 rounded-lg">
                  <div className="p-2 space-y-1">
                    {popularRepos.map((repo) => (
                      <button
                        key={repo.url}
                        onClick={() => setSelectedRepo(repo.url)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          selectedRepo === repo.url 
                            ? 'bg-primary/10 border border-primary/30' 
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        <div className="font-medium text-sm">{repo.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{repo.url}</div>
                        <Badge variant="outline" className="mt-1 text-xs">{repo.charts} charts</Badge>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
                <Button variant="outline" size="sm" className="w-full">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Repository
                </Button>
              </div>

              {/* Charts List */}
              <div className="col-span-2 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search charts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <ScrollArea className="h-[300px] border border-border/50 rounded-lg">
                  <div className="p-2 space-y-1">
                    {filteredCharts.map((chart) => (
                      <button
                        key={chart.name}
                        onClick={() => {
                          setSelectedChart(chart);
                          setActiveTab('configure');
                        }}
                        className={`w-full text-left p-3 rounded-lg transition-colors hover:bg-muted/50 ${
                          selectedChart?.name === chart.name ? 'bg-primary/10 border border-primary/30' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-sm">{chart.name}</div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono text-xs">v{chart.version}</Badge>
                            <Badge variant="secondary" className="text-xs">App: {chart.appVersion}</Badge>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{chart.description}</p>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>

          {/* Custom Chart Tab */}
          <TabsContent value="custom" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Repository URL</Label>
                  <Input
                    placeholder="https://charts.example.com"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Chart Name</Label>
                  <Input
                    placeholder="my-chart"
                    value={chartName}
                    onChange={(e) => setChartName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Chart Version (optional)</Label>
                  <Input
                    placeholder="latest"
                    value={chartVersion}
                    onChange={(e) => setChartVersion(e.target.value)}
                  />
                </div>
                <Button 
                  className="w-full"
                  disabled={!repoUrl || !chartName}
                  onClick={() => setActiveTab('configure')}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Fetch Chart
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Or paste Chart.yaml</Label>
                <Textarea
                  placeholder={`apiVersion: v2
name: my-chart
version: 1.0.0
description: My custom Helm chart
...`}
                  className="h-[220px] font-mono text-sm"
                />
              </div>
            </div>
          </TabsContent>

          {/* Configure Tab */}
          <TabsContent value="configure" className="space-y-4 mt-4">
            {selectedChart && (
              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border border-border/50">
                <Package className="h-10 w-10 text-primary" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{selectedChart.name}</span>
                    <Badge variant="outline" className="font-mono">v{selectedChart.version}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedChart.description}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('browse')}>
                  Change
                </Button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Release Name</Label>
                  <Input
                    placeholder="my-release"
                    value={releaseName}
                    onChange={(e) => setReleaseName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Namespace</Label>
                  <Input
                    placeholder="default"
                    value={namespace}
                    onChange={(e) => setNamespace(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Target Environment</Label>
                  <Select value={environment} onValueChange={setEnvironment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select environment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="production">
                        <div className="flex items-center gap-2">
                          <Server className="h-4 w-4" />
                          Production Cluster
                        </div>
                      </SelectItem>
                      <SelectItem value="staging">
                        <div className="flex items-center gap-2">
                          <Server className="h-4 w-4" />
                          Staging Cluster
                        </div>
                      </SelectItem>
                      <SelectItem value="development">
                        <div className="flex items-center gap-2">
                          <Server className="h-4 w-4" />
                          Development Cluster
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Values Override (YAML)</Label>
                <Textarea
                  placeholder={`# Override default values
replicaCount: 2
image:
  tag: latest
resources:
  requests:
    memory: "256Mi"
    cpu: "100m"`}
                  value={valuesYaml}
                  onChange={(e) => setValuesYaml(e.target.value)}
                  className="h-[180px] font-mono text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <GitBranch className="h-4 w-4" />
                  <span>Helm 3.12</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span>Chart verified</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleDeploy}
                  disabled={isLoading || !releaseName || !environment}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deploying...
                    </>
                  ) : (
                    <>
                      <Package className="h-4 w-4 mr-2" />
                      Deploy Chart
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default HelmImportDialog;
