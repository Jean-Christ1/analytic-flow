import { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Search,
  Plus,
  Database,
  Shield,
  Clock,
  Download,
  Eye,
  GitBranch,
  AlertTriangle,
  CheckCircle,
  Lock,
  FolderKanban,
  Box,
  Info,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { datasets, getProjectById, getModelById } from "@/data/platformData";
import { DataLineageGraph } from "@/components/data-catalog/DataLineageGraph";

const ITEMS_PER_PAGE = 5;

const DataCatalog = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case "Public": return "success";
      case "Sensitive": return "warning";
      case "Regulated": return "destructive";
      case "Restricted": return "info";
      default: return "secondary";
    }
  };

  const filteredAssets = datasets.filter((asset) =>
    asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.schema.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredAssets.length / ITEMS_PER_PAGE);
  const paginatedAssets = filteredAssets.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const avgQuality = Math.round(datasets.reduce((sum, d) => sum + d.quality, 0) / datasets.length);
  const piiCount = datasets.filter(d => d.pii).length;

  return (
    <DashboardLayout>
      <div className="space-y-4 animate-fade-in">
        {/* Header - Compact */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold">Data Catalog</h1>
            <p className="text-sm text-muted-foreground">Discover and govern your data assets</p>
          </div>
          <Button variant="premium" size="sm">
            <Plus className="h-3.5 w-3.5 mr-1" />Register Asset
          </Button>
        </div>

        {/* Stats - Compact */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total Assets", value: datasets.length.toString(), icon: Database, tooltip: "Registered data assets" },
            { label: "PII Detected", value: piiCount.toString(), icon: Shield, color: "text-warning", tooltip: "Assets containing personal data" },
            { label: "Data Quality", value: `${avgQuality}%`, icon: CheckCircle, color: "text-success", tooltip: "Average quality score" },
            { label: "Pending Review", value: "3", icon: AlertTriangle, color: "text-warning", tooltip: "Assets awaiting validation" },
          ].map((stat, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <Tooltip><TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                        <TooltipContent>{stat.tooltip}</TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-xl font-bold mt-0.5">{stat.value}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-primary/10">
                    <stat.icon className={`h-4 w-4 ${stat.color || "text-primary"}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="catalog" className="space-y-3">
          <div className="flex items-center justify-between">
            <TabsList className="h-9">
              <TabsTrigger value="catalog" className="text-xs">Catalog</TabsTrigger>
              <TabsTrigger value="lineage" className="text-xs">Data Lineage</TabsTrigger>
              <TabsTrigger value="policies" className="text-xs">Policies</TabsTrigger>
            </TabsList>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="pl-9 w-56 h-9 bg-muted/50"
              />
            </div>
          </div>

          <TabsContent value="catalog">
            <Card className="glass-card">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead className="text-xs">Asset</TableHead>
                      <TableHead className="text-xs">Project</TableHead>
                      <TableHead className="text-xs">Classification</TableHead>
                      <TableHead className="text-xs">Quality</TableHead>
                      <TableHead className="text-xs">Updated</TableHead>
                      <TableHead className="text-xs text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedAssets.map((asset) => {
                      const project = getProjectById(asset.projectId);
                      return (
                        <TableRow key={asset.id} className="border-border/50">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Database className="h-4 w-4 text-primary" />
                              <div>
                                <p className="font-mono text-xs font-medium">{asset.name}</p>
                                <p className="text-[10px] text-muted-foreground">{asset.schema} • v{asset.version}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Link to={`/projects/${asset.projectId}`}>
                              <Badge variant="outline" className="font-normal gap-1 text-[10px] hover:bg-muted/50">
                                <FolderKanban className="h-2.5 w-2.5" />
                                {project?.name?.split(" ")[0] || asset.projectId}
                              </Badge>
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Tooltip>
                              <TooltipTrigger className="flex items-center gap-1">
                                <Badge variant={getClassificationColor(asset.classification)} className="text-[10px]">
                                  {asset.classification}
                                </Badge>
                                {asset.pii && <Lock className="h-3 w-3 text-warning" />}
                              </TooltipTrigger>
                              <TooltipContent>{asset.pii ? "Contains PII data" : "No PII detected"}</TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Tooltip>
                              <TooltipTrigger className="flex items-center gap-1.5">
                                <div className="w-12 h-1 rounded-full bg-muted overflow-hidden">
                                  <div className="h-full bg-success rounded-full" style={{ width: `${asset.quality}%` }} />
                                </div>
                                <span className="text-[10px]">{asset.quality}%</span>
                              </TooltipTrigger>
                              <TooltipContent>Data quality score based on completeness, accuracy, consistency</TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell className="text-[10px] text-muted-foreground">{asset.lastUpdated}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedDataset(asset.id)}>
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <GitBranch className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-muted-foreground">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredAssets.length)} of {filteredAssets.length}
                </p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <Button key={i + 1} variant={currentPage === i + 1 ? "secondary" : "ghost"} size="icon" className="h-7 w-7 text-xs" onClick={() => setCurrentPage(i + 1)}>
                      {i + 1}
                    </Button>
                  ))}
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* Dataset Details Panel */}
            {selectedDataset && (() => {
              const dataset = datasets.find(d => d.id === selectedDataset);
              if (!dataset) return null;
              const project = getProjectById(dataset.projectId);
              
              return (
                <Card className="glass-card mt-3">
                  <CardHeader className="py-2 px-4 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Database className="h-4 w-4 text-primary" />
                      {dataset.name}
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelectedDataset(null)}>Close</Button>
                  </CardHeader>
                  <CardContent className="py-2 px-4">
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-muted-foreground uppercase text-[10px]">Metadata</h4>
                        <div className="space-y-1">
                          <div className="flex justify-between"><span className="text-muted-foreground">Format</span><span>{dataset.format}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Size</span><span>{dataset.size}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Records</span><span>{dataset.records}</span></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-muted-foreground uppercase text-[10px]">Relationships</h4>
                        <div className="p-2 rounded-lg bg-muted/30">
                          <p className="text-[10px] text-muted-foreground mb-1">Project</p>
                          <Link to={`/projects/${dataset.projectId}`} className="flex items-center gap-1 hover:text-primary">
                            <FolderKanban className="h-3 w-3" />{project?.name}
                          </Link>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-muted-foreground uppercase text-[10px]">Consuming Models</h4>
                        <div className="flex flex-wrap gap-1">
                          {dataset.lineage.consumers.map((consumer, i) => {
                            const model = getModelById(consumer);
                            return (
                              <Link key={i} to={`/models/${consumer}`}>
                                <Badge variant="outline" className="gap-1 text-[10px] hover:bg-muted/50">
                                  <Box className="h-2.5 w-2.5" />{model?.name || consumer}
                                </Badge>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
          </TabsContent>

          <TabsContent value="lineage">
            <DataLineageGraph />
          </TabsContent>

          <TabsContent value="policies">
            <Card className="glass-card">
              <CardHeader className="py-2 px-4 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">Data Policies</CardTitle>
                <Button variant="outline" size="sm" className="h-7 text-xs">
                  <Plus className="h-3 w-3 mr-1" />Add Policy
                </Button>
              </CardHeader>
              <CardContent className="pb-3 px-4">
                <div className="space-y-2">
                  {[
                    { name: "GDPR Retention Policy", type: "Retention", assets: datasets.filter(d => d.classification === "Regulated").length, status: "active" },
                    { name: "PII Masking Policy", type: "Masking", assets: piiCount, status: "active" },
                    { name: "Financial Data Access", type: "Access Control", assets: 2, status: "active" },
                    { name: "ML Training Data Policy", type: "Usage", assets: datasets.filter(d => d.type === "Dataset").length, status: "draft" },
                  ].map((policy, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-3">
                        <Shield className="h-4 w-4 text-primary" />
                        <div>
                          <p className="font-medium text-sm">{policy.name}</p>
                          <p className="text-[10px] text-muted-foreground">{policy.type} • {policy.assets} assets</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={policy.status === "active" ? "success" : "secondary"} className="text-[10px]">{policy.status}</Badge>
                        <Button variant="ghost" size="sm" className="h-7 text-xs">Edit</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default DataCatalog;
