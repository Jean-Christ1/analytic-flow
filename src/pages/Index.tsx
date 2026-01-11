import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/dashboard/Header";
import MetricCard from "@/components/dashboard/MetricCard";
import PerformanceChart from "@/components/dashboard/PerformanceChart";
import ExperimentsTable from "@/components/dashboard/ExperimentsTable";
import FederatedNodes from "@/components/dashboard/FederatedNodes";
import { FlaskConical, Layers, Database, Cpu, TrendingUp, Clock } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <main className="ml-64">
        <Header />
        
        <div className="p-6 space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Active Experiments"
              value="12"
              change="+3 this week"
              changeType="positive"
              icon={FlaskConical}
            />
            <MetricCard
              title="Deployed Models"
              value="8"
              change="+1 today"
              changeType="positive"
              icon={Layers}
            />
            <MetricCard
              title="Total Data Points"
              value="2.4M"
              change="+156K"
              changeType="positive"
              icon={Database}
            />
            <MetricCard
              title="Compute Hours"
              value="847"
              change="This month"
              changeType="neutral"
              icon={Cpu}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <PerformanceChart />
            </div>
            <FederatedNodes />
          </div>

          {/* Experiments Table */}
          <ExperimentsTable />
        </div>
      </main>

      {/* Background Glow Effects */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-64 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
};

export default Index;
