import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Database,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Layers,
  Activity,
} from "lucide-react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";

// Mock data for data quality metrics
const dataQualityMetrics = {
  completeness: 98.5,
  accuracy: 96.2,
  consistency: 99.1,
  timeliness: 94.8,
  validity: 97.3,
  uniqueness: 99.8,
};

const dataQualityTrend = Array.from({ length: 30 }, (_, i) => ({
  day: `Day ${i + 1}`,
  completeness: 95 + Math.random() * 5,
  accuracy: 93 + Math.random() * 7,
  consistency: 96 + Math.random() * 4,
}));

const schemaChanges = [
  { date: "Dec 10, 2025", change: "Added column: user_segment", type: "addition", impact: "low" },
  { date: "Dec 8, 2025", change: "Modified type: age INT → FLOAT", type: "modification", impact: "medium" },
  { date: "Dec 5, 2025", change: "Removed column: legacy_id", type: "removal", impact: "high" },
  { date: "Dec 1, 2025", change: "Added index: idx_timestamp", type: "addition", impact: "low" },
];

const featureStats = [
  { name: "age", type: "numeric", nullRate: 0.2, mean: 34.5, std: 12.3, min: 18, max: 85, drift: 0.012 },
  { name: "income", type: "numeric", nullRate: 1.5, mean: 65000, std: 25000, min: 15000, max: 500000, drift: 0.045 },
  { name: "category", type: "categorical", nullRate: 0.0, uniqueValues: 12, topValue: "retail", drift: 0.008 },
  { name: "timestamp", type: "datetime", nullRate: 0.0, earliestDate: "2024-01-01", latestDate: "2025-12-10", drift: 0.003 },
  { name: "region", type: "categorical", nullRate: 0.5, uniqueValues: 8, topValue: "US-East", drift: 0.021 },
  { name: "score", type: "numeric", nullRate: 0.1, mean: 72.4, std: 15.8, min: 0, max: 100, drift: 0.067 },
];

const dataVolumeHistory = Array.from({ length: 14 }, (_, i) => ({
  date: `Dec ${i + 1}`,
  records: Math.floor(50000 + Math.random() * 30000),
  size: Math.floor(500 + Math.random() * 200),
}));

const validationRules = [
  { name: "non_null_id", status: "passed", lastCheck: "2 min ago", passRate: 100 },
  { name: "valid_email_format", status: "passed", lastCheck: "2 min ago", passRate: 99.8 },
  { name: "age_range_check", status: "warning", lastCheck: "2 min ago", passRate: 98.2 },
  { name: "unique_transaction_id", status: "passed", lastCheck: "2 min ago", passRate: 100 },
  { name: "date_not_future", status: "failed", lastCheck: "2 min ago", passRate: 94.5 },
  { name: "category_in_list", status: "passed", lastCheck: "2 min ago", passRate: 99.9 },
];

const dataDistribution = [
  { name: "0-20", value: 15 },
  { name: "21-35", value: 35 },
  { name: "36-50", value: 28 },
  { name: "51-65", value: 15 },
  { name: "65+", value: 7 },
];

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--info))",
  "hsl(var(--gold))",
];

export const DataMonitoring = () => {
  return (
    <div className="space-y-6">
      {/* Data Quality Overview */}
      <div className="grid grid-cols-6 gap-3">
        {Object.entries(dataQualityMetrics).map(([key, value]) => (
          <Card key={key} className="glass-card">
            <CardContent className="py-4">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground capitalize">{key}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold font-display">{value}%</span>
                  {value >= 98 ? (
                    <CheckCircle className="h-4 w-4 text-success" />
                  ) : value >= 95 ? (
                    <TrendingUp className="h-4 w-4 text-warning" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  )}
                </div>
                <Progress value={value} className="h-1" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Data Quality Trend */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Data Quality Trend (30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dataQualityTrend}>
                  <defs>
                    <linearGradient id="completenessGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="accuracyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={10} interval={4} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} domain={[90, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Area type="monotone" dataKey="completeness" stroke="hsl(var(--success))" fill="url(#completenessGrad)" name="Completeness" />
                  <Area type="monotone" dataKey="accuracy" stroke="hsl(var(--primary))" fill="url(#accuracyGrad)" name="Accuracy" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Data Volume */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Database className="h-4 w-4 text-info" />
              Data Volume History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataVolumeHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="records" fill="hsl(var(--primary))" name="Records" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Statistics */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Layers className="h-4 w-4 text-gold" />
              Feature Statistics & Drift
            </CardTitle>
            <Badge variant="outline">{featureStats.length} Features</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Feature</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Type</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Null %</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Statistics</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Drift</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {featureStats.map((feature, i) => (
                  <tr key={i} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-2 font-mono text-foreground">{feature.name}</td>
                    <td className="py-3 px-2">
                      <Badge variant="secondary" className="text-xs">{feature.type}</Badge>
                    </td>
                    <td className="py-3 px-2">
                      <span className={feature.nullRate > 1 ? "text-warning" : "text-muted-foreground"}>
                        {feature.nullRate}%
                      </span>
                    </td>
                    <td className="py-3 px-2 text-xs text-muted-foreground">
                      {feature.type === "numeric" ? (
                        <span>μ={feature.mean?.toLocaleString()} σ={feature.std?.toLocaleString()}</span>
                      ) : feature.type === "categorical" ? (
                        <span>{feature.uniqueValues} values, top: {feature.topValue}</span>
                      ) : (
                        <span>{feature.earliestDate} → {feature.latestDate}</span>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <Progress value={feature.drift * 1000} className="h-1 w-16" />
                        <span className={feature.drift > 0.05 ? "text-warning text-xs" : "text-muted-foreground text-xs"}>
                          {(feature.drift * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      {feature.drift < 0.03 ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : feature.drift < 0.05 ? (
                        <AlertTriangle className="h-4 w-4 text-warning" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Validation Rules & Schema Changes */}
      <div className="grid grid-cols-2 gap-4">
        {/* Validation Rules */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                Data Validation Rules
              </CardTitle>
              <Badge variant="success">{validationRules.filter(r => r.status === "passed").length}/{validationRules.length} Passed</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {validationRules.map((rule, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
                  <div className="flex items-center gap-3">
                    {rule.status === "passed" ? (
                      <CheckCircle className="h-4 w-4 text-success" />
                    ) : rule.status === "warning" ? (
                      <AlertTriangle className="h-4 w-4 text-warning" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                    <div>
                      <p className="text-sm font-mono">{rule.name}</p>
                      <p className="text-xs text-muted-foreground">{rule.lastCheck}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${rule.passRate === 100 ? "text-success" : rule.passRate >= 98 ? "text-warning" : "text-destructive"}`}>
                      {rule.passRate}%
                    </p>
                    <p className="text-xs text-muted-foreground">pass rate</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Schema Changes */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-info" />
              Schema Change Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {schemaChanges.map((change, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border/30">
                  <div className={`p-1.5 rounded-md ${
                    change.type === "addition" ? "bg-success/20" :
                    change.type === "modification" ? "bg-warning/20" : "bg-destructive/20"
                  }`}>
                    {change.type === "addition" ? (
                      <TrendingUp className="h-3 w-3 text-success" />
                    ) : change.type === "modification" ? (
                      <Activity className="h-3 w-3 text-warning" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-destructive" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{change.change}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{change.date}</span>
                      <Badge variant={change.impact === "high" ? "destructive" : change.impact === "medium" ? "warning" : "secondary"} className="text-xs">
                        {change.impact} impact
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DataMonitoring;
