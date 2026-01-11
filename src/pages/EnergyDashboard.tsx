import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Zap,
  TrendingDown,
  TrendingUp,
  Leaf,
  DollarSign,
  Calendar,
  ArrowDown,
  ArrowUp,
  Factory,
  ThermometerSun,
  Gauge,
  Info,
  Download,
  RefreshCw,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
} from "recharts";
import { useCurrency } from "@/contexts/CurrencyContext";

// Mock data for energy consumption
const hourlyConsumption = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i.toString().padStart(2, '0')}:00`,
  actual: 150 + Math.sin(i / 4) * 40 + Math.random() * 20,
  predicted: 145 + Math.sin(i / 4) * 38 + Math.random() * 10,
  baseline: 180,
}));

const dailyConsumption = Array.from({ length: 30 }, (_, i) => ({
  day: `Dec ${i + 1}`,
  consumption: 3500 + Math.sin(i / 5) * 800 + Math.random() * 300,
  predicted: 3400 + Math.sin(i / 5) * 750,
  savings: 200 + Math.random() * 150,
  target: 3200,
}));

const monthlyTrend = [
  { month: "Jul", consumption: 95000, cost: 14250, savings: 4500, co2: 52.2 },
  { month: "Aug", consumption: 102000, cost: 15300, savings: 5100, co2: 56.1 },
  { month: "Sep", consumption: 88000, cost: 13200, savings: 6200, co2: 48.4 },
  { month: "Oct", consumption: 92000, cost: 13800, savings: 5800, co2: 50.6 },
  { month: "Nov", consumption: 85000, cost: 12750, savings: 7500, co2: 46.8 },
  { month: "Dec", consumption: 78000, cost: 11700, savings: 9200, co2: 42.9 },
];

const consumptionByZone = [
  { zone: "Production Hall A", consumption: 45000, percentage: 35, efficiency: 92 },
  { zone: "Production Hall B", consumption: 32000, percentage: 25, efficiency: 88 },
  { zone: "HVAC Systems", consumption: 25000, percentage: 20, efficiency: 85 },
  { zone: "Lighting", consumption: 12000, percentage: 9, efficiency: 95 },
  { zone: "Office Areas", consumption: 8000, percentage: 6, efficiency: 91 },
  { zone: "Other", consumption: 6000, percentage: 5, efficiency: 78 },
];

const savingsBreakdown = [
  { name: "HVAC Optimization", value: 35, savings: 3220, color: "hsl(var(--success))" },
  { name: "Load Shifting", value: 25, savings: 2300, color: "hsl(var(--info))" },
  { name: "Peak Shaving", value: 20, savings: 1840, color: "hsl(var(--primary))" },
  { name: "Equipment Scheduling", value: 15, savings: 1380, color: "hsl(var(--warning))" },
  { name: "Standby Reduction", value: 5, savings: 460, color: "hsl(var(--muted-foreground))" },
];

const forecastData = Array.from({ length: 7 }, (_, i) => ({
  day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
  predicted: 3200 + Math.random() * 600,
  optimized: 2800 + Math.random() * 400,
  potential: 2500 + Math.random() * 300,
}));

const EnergyDashboard = () => {
  const [timeRange, setTimeRange] = useState<string>("24h");
  const [facility, setFacility] = useState<string>("all");
  const { formatCurrency } = useCurrency();

  const totalConsumption = 78000; // kWh
  const totalSavings = 9200; // €
  const co2Reduction = 42.9; // tonnes
  const efficiencyScore = 89.5;

  return (
    <DashboardLayout>
      <div className="space-y-4 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold">Energy Consumption Optimization</h1>
            <p className="text-sm text-muted-foreground">Real-time energy monitoring with ML-powered forecasts and savings</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={facility} onValueChange={setFacility}>
              <SelectTrigger className="w-[160px] h-9 bg-muted/50">
                <Factory className="h-3.5 w-3.5 mr-2" />
                <SelectValue placeholder="All Facilities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Facilities</SelectItem>
                <SelectItem value="factory-1">Factory 1</SelectItem>
                <SelectItem value="factory-2">Factory 2</SelectItem>
                <SelectItem value="warehouse">Warehouse</SelectItem>
              </SelectContent>
            </Select>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[120px] h-9 bg-muted/50">
                <Calendar className="h-3.5 w-3.5 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm"><RefreshCw className="h-3.5 w-3.5 mr-1" />Refresh</Button>
            <Button variant="premium" size="sm"><Download className="h-3.5 w-3.5 mr-1" />Export</Button>
          </div>
        </div>

        {/* KPI Stats */}
        <div className="grid grid-cols-4 gap-3">
          <Card className="glass-card gradient-border">
            <CardContent className="py-4 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Consumption</p>
                  <p className="text-2xl font-bold mt-1">{(totalConsumption / 1000).toFixed(1)} MWh</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingDown className="h-3 w-3 text-success" />
                    <span className="text-xs text-success">-12.4% vs last month</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-primary/10">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card gradient-border">
            <CardContent className="py-4 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Cost Savings</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(totalSavings)}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3 text-success" />
                    <span className="text-xs text-success">+22.7% improvement</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-success/10">
                  <DollarSign className="h-5 w-5 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card gradient-border">
            <CardContent className="py-4 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">CO₂ Reduction</p>
                  <p className="text-2xl font-bold mt-1">{co2Reduction} tonnes</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Leaf className="h-3 w-3 text-success" />
                    <span className="text-xs text-success">-15.2% emissions</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-success/10">
                  <Leaf className="h-5 w-5 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card gradient-border">
            <CardContent className="py-4 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Efficiency Score</p>
                  <p className="text-2xl font-bold mt-1">{efficiencyScore}%</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3 text-success" />
                    <span className="text-xs text-success">+3.2 pts this month</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-info/10">
                  <Gauge className="h-5 w-5 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="realtime" className="space-y-3">
          <TabsList className="h-9">
            <TabsTrigger value="realtime" className="text-xs gap-1"><Zap className="h-3 w-3" />Real-time</TabsTrigger>
            <TabsTrigger value="forecast" className="text-xs gap-1"><TrendingUp className="h-3 w-3" />Forecast</TabsTrigger>
            <TabsTrigger value="savings" className="text-xs gap-1"><DollarSign className="h-3 w-3" />Savings</TabsTrigger>
            <TabsTrigger value="zones" className="text-xs gap-1"><Factory className="h-3 w-3" />By Zone</TabsTrigger>
          </TabsList>

          <TabsContent value="realtime" className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Card className="glass-card">
                <CardHeader className="py-2 px-4">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    Real-time vs Predicted Consumption
                    <Tooltip><TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                      <TooltipContent>Actual consumption compared to ML predictions</TooltipContent>
                    </Tooltip>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3 px-4">
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={hourlyConsumption}>
                        <defs>
                          <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} unit=" kW" />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} 
                        />
                        <Legend wrapperStyle={{ fontSize: "11px" }} />
                        <Area type="monotone" dataKey="actual" stroke="hsl(var(--primary))" fill="url(#actualGrad)" name="Actual (kW)" />
                        <Line type="monotone" dataKey="predicted" stroke="hsl(var(--success))" strokeDasharray="5 5" strokeWidth={2} dot={false} name="Predicted (kW)" />
                        <Line type="monotone" dataKey="baseline" stroke="hsl(var(--destructive))" strokeDasharray="3 3" strokeWidth={1} dot={false} name="Baseline (kW)" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader className="py-2 px-4">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <ThermometerSun className="h-4 w-4 text-warning" />
                    Daily Consumption Trend
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3 px-4">
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dailyConsumption.slice(-14)}>
                        <defs>
                          <linearGradient id="consumptionGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--info))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--info))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} unit=" kWh" />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} 
                        />
                        <Legend wrapperStyle={{ fontSize: "11px" }} />
                        <Area type="monotone" dataKey="consumption" stroke="hsl(var(--info))" fill="url(#consumptionGrad)" name="Consumption (kWh)" />
                        <Line type="monotone" dataKey="target" stroke="hsl(var(--success))" strokeDasharray="5 5" strokeWidth={2} dot={false} name="Target (kWh)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="forecast" className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <Card className="glass-card col-span-2">
                <CardHeader className="py-2 px-4">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-success" />
                    7-Day Energy Forecast
                    <Badge variant="info" className="text-[10px] ml-2">ML Powered</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3 px-4">
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={forecastData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} unit=" kWh" />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} 
                        />
                        <Legend wrapperStyle={{ fontSize: "11px" }} />
                        <Bar dataKey="predicted" fill="hsl(var(--muted-foreground))" name="Predicted" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="optimized" fill="hsl(var(--info))" name="With Optimization" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="potential" fill="hsl(var(--success))" name="Max Potential" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader className="py-2 px-4">
                  <CardTitle className="text-sm font-medium">Forecast Accuracy</CardTitle>
                </CardHeader>
                <CardContent className="pb-3 px-4">
                  <div className="space-y-4">
                    {[
                      { period: "1-Day", accuracy: 96.8, trend: "up" },
                      { period: "3-Day", accuracy: 94.2, trend: "up" },
                      { period: "7-Day", accuracy: 89.5, trend: "stable" },
                      { period: "30-Day", accuracy: 82.1, trend: "down" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                        <span className="text-sm font-medium">{item.period}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{item.accuracy}%</span>
                          {item.trend === "up" && <ArrowUp className="h-3 w-3 text-success" />}
                          {item.trend === "down" && <ArrowDown className="h-3 w-3 text-destructive" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="savings" className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <Card className="glass-card col-span-2">
                <CardHeader className="py-2 px-4">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-success" />
                    Monthly Savings Trend
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3 px-4">
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={monthlyTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                        <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                        <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} 
                        />
                        <Legend wrapperStyle={{ fontSize: "11px" }} />
                        <Bar yAxisId="left" dataKey="cost" fill="hsl(var(--muted-foreground))" name="Cost (€)" radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="left" dataKey="savings" fill="hsl(var(--success))" name="Savings (€)" radius={[4, 4, 0, 0]} />
                        <Line yAxisId="right" type="monotone" dataKey="co2" stroke="hsl(var(--info))" strokeWidth={2} name="CO₂ (tonnes)" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader className="py-2 px-4">
                  <CardTitle className="text-sm font-medium">Savings Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="pb-3 px-4">
                  <div className="h-[140px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={savingsBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={55}
                          dataKey="value"
                          paddingAngle={2}
                        >
                          {savingsBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1.5 mt-2">
                    {savingsBreakdown.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-muted-foreground">{item.name}</span>
                        </div>
                        <span className="font-medium">{formatCurrency(item.savings)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="zones" className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Card className="glass-card">
                <CardHeader className="py-2 px-4">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Factory className="h-4 w-4 text-primary" />
                    Consumption by Zone
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3 px-4">
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={consumptionByZone} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={10} unit=" kWh" />
                        <YAxis dataKey="zone" type="category" stroke="hsl(var(--muted-foreground))" fontSize={10} width={100} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} 
                        />
                        <Bar dataKey="consumption" fill="hsl(var(--primary))" name="Consumption (kWh)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader className="py-2 px-4">
                  <CardTitle className="text-sm font-medium">Zone Efficiency Scores</CardTitle>
                </CardHeader>
                <CardContent className="pb-3 px-4">
                  <div className="space-y-3">
                    {consumptionByZone.map((zone, i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">{zone.zone}</span>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={zone.efficiency >= 90 ? "success" : zone.efficiency >= 80 ? "warning" : "destructive"} 
                              className="text-[10px]"
                            >
                              {zone.efficiency}%
                            </Badge>
                          </div>
                        </div>
                        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              zone.efficiency >= 90 ? 'bg-success' : zone.efficiency >= 80 ? 'bg-warning' : 'bg-destructive'
                            }`}
                            style={{ width: `${zone.efficiency}%` }} 
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {zone.consumption.toLocaleString()} kWh ({zone.percentage}% of total)
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default EnergyDashboard;
