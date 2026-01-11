import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
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
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Leaf,
  Zap,
  ArrowRight,
  CheckCircle,
  FolderKanban,
  Box,
  Cpu,
  Gauge,
  Info,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { projects, models } from "@/data/platformData";
import { useCurrency } from "@/contexts/CurrencyContext";

const costTrend = Array.from({ length: 14 }, (_, i) => ({
  day: `Dec ${i + 1}`,
  compute: 800 + Math.random() * 200,
  storage: 200 + Math.random() * 50,
  gpu: 1500 + Math.random() * 500,
}));

const carbonData = Array.from({ length: 6 }, (_, i) => ({
  month: ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i],
  emissions: 2500 - i * 100 + Math.random() * 200,
  target: 2500 - i * 150,
}));

const recommendations = [
  { id: 1, type: "Reserved Instances", description: "Switch 5 on-demand GPU instances to reserved", savings: 2450, impact: "high" },
  { id: 2, type: "Spot Instances", description: "Use spot instances for training workloads", savings: 1890, impact: "high" },
  { id: 3, type: "Rightsizing", description: "Downsize 3 over-provisioned workspaces", savings: 650, impact: "medium" },
  { id: 4, type: "Storage Optimization", description: "Move cold data to Glacier tier", savings: 340, impact: "medium" },
];

const ITEMS_PER_PAGE = 3;

const FinOps = () => {
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const { formatCurrency } = useCurrency();
  
  const totalCost = projects.reduce((sum, p) => sum + p.resources.monthlyCost, 0);
  const totalCarbon = projects.reduce((sum, p) => sum + p.resources.carbonEmissions, 0);
  const totalSavings = recommendations.reduce((sum, r) => sum + r.savings, 0);

  const costByProject = projects.map((p, i) => ({
    name: p.name.split(" ")[0],
    value: p.resources.monthlyCost,
    color: ["hsl(var(--primary))", "hsl(var(--gold))", "hsl(var(--success))", "hsl(var(--info))", "hsl(var(--warning))"][i % 5],
  }));

  const filteredProjects = selectedProject === "all" ? projects : projects.filter(p => p.id === selectedProject);
  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  const paginatedProjects = filteredProjects.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <DashboardLayout>
      <div className="space-y-4 animate-fade-in">
        {/* Header - Compact */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold">FinOps & Sustainability</h1>
            <p className="text-sm text-muted-foreground">Cost optimization & carbon tracking</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedProject} onValueChange={(v) => { setSelectedProject(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[160px] h-9 bg-muted/50">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((proj) => (
                  <SelectItem key={proj.id} value={proj.id}>{proj.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="premium" size="sm">Download Report</Button>
          </div>
        </div>

        {/* Stats - Compact */}
        <div className="grid grid-cols-5 gap-3">
          <Card className="glass-card">
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-xs text-muted-foreground">Monthly Cost</p>
                    <Tooltip><TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                      <TooltipContent>Total infrastructure spend this month</TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-xl font-bold mt-0.5">{formatCurrency(totalCost)}</p>
                  <p className="text-[10px] text-success flex items-center gap-0.5">
                    <TrendingDown className="h-2.5 w-2.5" />-8.3%
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-primary/10">
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-xs text-muted-foreground">CO₂ Emissions</p>
                    <Tooltip><TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                      <TooltipContent>Monthly carbon footprint from compute</TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-xl font-bold mt-0.5">{totalCarbon} kg</p>
                  <p className="text-[10px] text-success flex items-center gap-0.5">
                    <TrendingDown className="h-2.5 w-2.5" />-12.5%
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-success/10">
                  <Leaf className="h-4 w-4 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Energy (kWh)</p>
                  <p className="text-xl font-bold mt-0.5">{(totalCarbon * 2.5).toFixed(0)}</p>
                </div>
                <div className="p-2 rounded-lg bg-info/10">
                  <Zap className="h-4 w-4 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-xs text-muted-foreground">Potential Savings</p>
                    <Tooltip><TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                      <TooltipContent>{recommendations.length} optimization recommendations</TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-xl font-bold mt-0.5 text-gold">{formatCurrency(totalSavings)}</p>
                </div>
                <div className="p-2 rounded-lg bg-gold/10">
                  <TrendingUp className="h-4 w-4 text-gold" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Budget Used</p>
                  <p className="text-xl font-bold mt-0.5">68%</p>
                  <Progress value={68} className="h-1 mt-1 w-20" />
                </div>
                <div className="p-2 rounded-lg bg-warning/10">
                  <Gauge className="h-4 w-4 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs - Compact */}
        <Tabs defaultValue="costs" className="space-y-3">
          <TabsList className="h-9">
            <TabsTrigger value="costs" className="text-xs gap-1"><DollarSign className="h-3 w-3" />Overview</TabsTrigger>
            <TabsTrigger value="by-project" className="text-xs gap-1"><FolderKanban className="h-3 w-3" />By Project</TabsTrigger>
            <TabsTrigger value="recommendations" className="text-xs gap-1"><TrendingUp className="h-3 w-3" />Savings</TabsTrigger>
            <TabsTrigger value="carbon" className="text-xs gap-1"><Leaf className="h-3 w-3" />Carbon</TabsTrigger>
          </TabsList>

          <TabsContent value="costs" className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              {/* Cost Trend */}
              <Card className="glass-card col-span-2">
                <CardHeader className="py-2 px-4">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    Cost Trend (14 days)
                    <Tooltip><TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                      <TooltipContent>Daily breakdown by resource type</TooltipContent>
                    </Tooltip>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3 px-4">
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={costTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(v) => `$${v}`} />
                        <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                        <Legend wrapperStyle={{ fontSize: "10px" }} />
                        <Area type="monotone" dataKey="gpu" stackId="1" stroke="hsl(var(--gold))" fill="hsl(var(--gold)/0.3)" name="GPU" />
                        <Area type="monotone" dataKey="compute" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.3)" name="Compute" />
                        <Area type="monotone" dataKey="storage" stackId="1" stroke="hsl(var(--info))" fill="hsl(var(--info)/0.3)" name="Storage" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Cost by Project - Pie */}
              <Card className="glass-card">
                <CardHeader className="py-2 px-4">
                  <CardTitle className="text-sm font-medium">Cost by Project</CardTitle>
                </CardHeader>
                <CardContent className="pb-3 px-4">
                  <div className="h-[140px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={costByProject} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                          {costByProject.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                        <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1 mt-2">
                    {costByProject.slice(0, 3).map((project, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }} />
                          <span className="text-muted-foreground truncate max-w-[80px]">{project.name}</span>
                        </div>
                        <span className="font-mono">{formatCurrency(project.value)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="by-project" className="space-y-3">
            <div className="space-y-2">
              {paginatedProjects.map((project) => (
                <Card key={project.id} className="glass-card">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FolderKanban className="h-4 w-4 text-primary" />
                        <div>
                          <span className="font-medium text-sm">{project.name}</span>
                          <Badge variant={project.status === "active" ? "success" : "secondary"} className="ml-2 text-[10px]">{project.status}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <Tooltip>
                          <TooltipTrigger className="text-right">
                            <p className="text-sm font-bold">{formatCurrency(project.resources.monthlyCost)}</p>
                            <p className="text-[10px] text-muted-foreground">Monthly</p>
                          </TooltipTrigger>
                          <TooltipContent>Infrastructure cost for this project</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger className="text-right">
                            <p className="text-sm font-bold text-success">{project.resources.carbonEmissions} kg</p>
                            <p className="text-[10px] text-muted-foreground">CO₂</p>
                          </TooltipTrigger>
                          <TooltipContent>Carbon footprint estimate</TooltipContent>
                        </Tooltip>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Cpu className="h-3 w-3" />{project.resources.totalGpu}</span>
                          <span className="flex items-center gap-1"><Box className="h-3 w-3" />{project.modelIds.length} models</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Page {currentPage} of {totalPages}</p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-3">
            <Card className="glass-card">
              <CardHeader className="py-2 px-4">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span>Optimization Recommendations</span>
                  <Badge variant="warning" className="text-xs">Save {formatCurrency(totalSavings)}/mo</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3 px-4">
                <div className="space-y-2">
                  {recommendations.map((rec) => (
                    <div key={rec.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-4 w-4 text-success" />
                        <div>
                          <p className="font-medium text-sm">{rec.type}</p>
                          <p className="text-xs text-muted-foreground">{rec.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={rec.impact === "high" ? "success" : "warning"} className="text-[10px]">{rec.impact} impact</Badge>
                        <span className="font-bold text-success text-sm">{formatCurrency(rec.savings)}/mo</span>
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          Apply <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="carbon" className="space-y-3">
            <Card className="glass-card">
              <CardHeader className="py-2 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  Carbon Emissions Trend
                  <Tooltip><TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                    <TooltipContent>Monthly CO₂ emissions vs sustainability target</TooltipContent>
                  </Tooltip>
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3 px-4">
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={carbonData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} />
                      <Legend wrapperStyle={{ fontSize: "10px" }} />
                      <Bar dataKey="emissions" fill="hsl(var(--warning))" name="Actual (kg)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="target" fill="hsl(var(--success))" name="Target (kg)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default FinOps;
