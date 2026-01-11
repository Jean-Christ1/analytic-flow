import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

const data = [
  { name: "Jan", accuracy: 0.82, loss: 0.45, f1: 0.79 },
  { name: "Feb", accuracy: 0.85, loss: 0.38, f1: 0.82 },
  { name: "Mar", accuracy: 0.87, loss: 0.32, f1: 0.84 },
  { name: "Apr", accuracy: 0.86, loss: 0.35, f1: 0.83 },
  { name: "May", accuracy: 0.89, loss: 0.28, f1: 0.87 },
  { name: "Jun", accuracy: 0.91, loss: 0.24, f1: 0.89 },
  { name: "Jul", accuracy: 0.93, loss: 0.21, f1: 0.91 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card rounded-lg p-3 border border-border/50">
        <p className="text-sm font-medium text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div 
              className="h-2 w-2 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground capitalize">{entry.dataKey}:</span>
            <span className="text-foreground font-medium">
              {entry.dataKey === "loss" ? entry.value.toFixed(2) : `${(entry.value * 100).toFixed(1)}%`}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const PerformanceChart = () => {
  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Model Performance</h3>
          <p className="text-sm text-muted-foreground">Training metrics over time</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-muted-foreground">Accuracy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-success" />
            <span className="text-muted-foreground">F1 Score</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-warning" />
            <span className="text-muted-foreground">Loss</span>
          </div>
        </div>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(187, 85%, 53%)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(187, 85%, 53%)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="f1Gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142, 76%, 45%)" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="hsl(142, 76%, 45%)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 28%, 17%)" />
            <XAxis 
              dataKey="name" 
              stroke="hsl(215, 20%, 55%)" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="hsl(215, 20%, 55%)" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="accuracy" 
              stroke="hsl(187, 85%, 53%)" 
              strokeWidth={2}
              fill="url(#accuracyGradient)"
            />
            <Area 
              type="monotone" 
              dataKey="f1" 
              stroke="hsl(142, 76%, 45%)" 
              strokeWidth={2}
              fill="url(#f1Gradient)"
            />
            <Line 
              type="monotone" 
              dataKey="loss" 
              stroke="hsl(38, 92%, 50%)" 
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PerformanceChart;
