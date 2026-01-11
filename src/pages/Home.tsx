import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  FolderKanban,
  FlaskConical,
  Box,
  Rocket,
  Database,
  Activity,
  DollarSign,
  Store,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Shield,
  Zap,
  Clock,
  CheckCircle,
  LogIn,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Quick access card component
const QuickAccessCard = ({
  icon: Icon,
  iconColor,
  bgColor,
  title,
  description,
  stats,
  href,
  badge,
}: {
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  title: string;
  description: string;
  stats?: string;
  href: string;
  badge?: { text: string; variant: "success" | "warning" | "default" };
}) => {
  const navigate = useNavigate();
  
  return (
    <Card 
      className="glass-card border-border/50 hover:border-primary/40 cursor-pointer group transition-all duration-300 hover:shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.3)]"
      onClick={() => navigate(href)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={cn("p-2.5 rounded-xl transition-transform duration-300 group-hover:scale-110", bgColor)}>
            <Icon className={cn("h-5 w-5", iconColor)} />
          </div>
          {badge && (
            <Badge 
              variant={badge.variant === "success" ? "default" : badge.variant === "warning" ? "secondary" : "outline"}
              className={cn(
                "text-xs",
                badge.variant === "success" && "bg-success/20 text-success border-success/30",
                badge.variant === "warning" && "bg-warning/20 text-warning border-warning/30"
              )}
            >
              {badge.text}
            </Badge>
          )}
        </div>
        <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground mb-2">{description}</p>
        {stats && (
          <p className="text-sm font-bold text-foreground">{stats}</p>
        )}
        <div className="flex items-center gap-1 text-xs text-primary mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span>Access</span>
          <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
        </div>
      </CardContent>
    </Card>
  );
};

// Stat highlight component
const StatHighlight = ({
  icon: Icon,
  label,
  value,
  trend,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  trend?: "up" | "down";
}) => (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30">
    <div className="p-2 rounded-lg bg-primary/10">
      <Icon className="h-4 w-4 text-primary" />
    </div>
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center gap-1.5">
        <p className="text-lg font-bold text-foreground">{value}</p>
        {trend && (
          <TrendingUp className={cn("h-3.5 w-3.5", trend === "up" ? "text-success" : "text-destructive rotate-180")} />
        )}
      </div>
    </div>
  </div>
);

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const getUserName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name.split(" ")[0];
    }
    if (user?.email) {
      return user.email.split("@")[0];
    }
    return "Guest";
  };

  return (
    <DashboardLayout>
      {/* Welcome Section */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="font-display text-2xl font-bold text-foreground">
                Welcome back, <span className="text-gradient-gold">{getUserName()}</span>
              </h1>
              <Sparkles className="h-5 w-5 text-warning animate-pulse" />
            </div>
            <p className="text-sm text-muted-foreground">
              Your ML platform is running smoothly. Here's a quick overview.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!user && (
              <Button 
                onClick={() => navigate("/auth")}
                variant="outline"
                className="gap-2"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Button>
            )}
            <Button 
              onClick={() => navigate("/dashboard")}
              className="gap-2"
            >
              <LayoutDashboard className="h-4 w-4" />
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Platform Status Bar */}
      <Card className="glass-card border-border/50 mb-6">
        <CardContent className="py-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-success animate-pulse" />
                <span className="text-sm font-medium text-foreground">Platform Status: Operational</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Uptime: 99.99%
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5" />
                  Latency: 45ms
                </span>
                <span className="flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5" />
                  Security: Active
                </span>
              </div>
            </div>
            <Badge variant="outline" className="text-success border-success/30">
              <CheckCircle className="h-3 w-3 mr-1" />
              All Systems Go
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        <StatHighlight icon={Box} label="Active Models" value="127" trend="up" />
        <StatHighlight icon={FlaskConical} label="Experiments" value="1,847" trend="up" />
        <StatHighlight icon={Rocket} label="Deployments" value="34" trend="up" />
        <StatHighlight icon={Database} label="Datasets" value="89" />
        <StatHighlight icon={Activity} label="API Calls/min" value="12.4K" trend="up" />
      </div>

      {/* Quick Access Grid */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          Quick Access
        </h2>
        <div className="grid grid-cols-4 gap-3">
          <QuickAccessCard
            icon={LayoutDashboard}
            iconColor="text-primary"
            bgColor="bg-primary/10"
            title="Dashboard"
            description="Full analytics & metrics"
            stats="Live monitoring"
            href="/dashboard"
          />
          <QuickAccessCard
            icon={FolderKanban}
            iconColor="text-info"
            bgColor="bg-info/10"
            title="Projects"
            description="Manage ML projects"
            stats="8 active projects"
            href="/projects"
            badge={{ text: "2 new", variant: "success" }}
          />
          <QuickAccessCard
            icon={FlaskConical}
            iconColor="text-warning"
            bgColor="bg-warning/10"
            title="Experiments"
            description="Run & track experiments"
            stats="12 running"
            href="/experiments"
            badge={{ text: "Running", variant: "warning" }}
          />
          <QuickAccessCard
            icon={Box}
            iconColor="text-success"
            bgColor="bg-success/10"
            title="Models"
            description="Model registry & versions"
            stats="127 models"
            href="/models"
          />
        </div>
      </div>

      {/* Secondary Access Grid */}
      <div className="grid grid-cols-5 gap-3">
        <QuickAccessCard
          icon={Rocket}
          iconColor="text-success"
          bgColor="bg-success/10"
          title="Deployments"
          description="Endpoints & inference"
          stats="34 active"
          href="/deployments"
          badge={{ text: "Live", variant: "success" }}
        />
        <QuickAccessCard
          icon={Database}
          iconColor="text-info"
          bgColor="bg-info/10"
          title="Data Catalog"
          description="Datasets & lineage"
          stats="89 datasets"
          href="/data-catalog"
        />
        <QuickAccessCard
          icon={Activity}
          iconColor="text-warning"
          bgColor="bg-warning/10"
          title="Monitoring"
          description="Performance & alerts"
          stats="3 alerts"
          href="/monitoring"
          badge={{ text: "3 alerts", variant: "warning" }}
        />
        <QuickAccessCard
          icon={DollarSign}
          iconColor="text-success"
          bgColor="bg-success/10"
          title="FinOps"
          description="Costs & optimization"
          stats="€12.4K/mo"
          href="/finops"
        />
        <QuickAccessCard
          icon={Store}
          iconColor="text-primary"
          bgColor="bg-primary/10"
          title="Marketplace"
          description="Apps & integrations"
          stats="50+ apps"
          href="/marketplace"
        />
      </div>
    </DashboardLayout>
  );
};

export default Home;
