import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  BookOpen,
  Search,
  FileText,
  Code,
  Rocket,
  Database,
  Shield,
  Activity,
  Box,
  Settings,
  ExternalLink,
  ChevronRight,
  Video,
  Lightbulb,
  GraduationCap,
  Zap,
  Info,
} from "lucide-react";

const quickStartGuides = [
  { title: "Getting Started", description: "Learn the basics", icon: Rocket, time: "5 min", tip: "Introduction to platform features" },
  { title: "Your First Model", description: "Train and deploy", icon: Box, time: "15 min", tip: "End-to-end model workflow" },
  { title: "Data Integration", description: "Connect data sources", icon: Database, time: "10 min", tip: "Data pipelines and integrations" },
  { title: "Experiment Tracking", description: "Track experiments", icon: Activity, time: "8 min", tip: "MLflow-style tracking" },
];

const apiDocs = [
  { title: "Authentication", endpoint: "/auth", methods: ["POST", "GET"] },
  { title: "Models API", endpoint: "/api/v1/models", methods: ["GET", "POST", "PUT", "DELETE"] },
  { title: "Experiments API", endpoint: "/api/v1/experiments", methods: ["GET", "POST"] },
  { title: "Datasets API", endpoint: "/api/v1/datasets", methods: ["GET", "POST"] },
];

const modelCards = [
  { name: "Fraud Detector v4.2", project: "Fraud Detection", status: "complete" },
  { name: "Churn Predictor v2.1", project: "Customer Churn", status: "complete" },
  { name: "LSTM Forecaster", project: "Time Series", status: "draft" },
  { name: "Sentiment Analyzer", project: "Sentiment", status: "complete" },
];

const tutorials = [
  { title: "Production ML Pipelines", type: "video", duration: "45 min", level: "Advanced" },
  { title: "Feature Engineering", type: "article", duration: "20 min", level: "Intermediate" },
  { title: "Model Monitoring", type: "video", duration: "30 min", level: "Advanced" },
  { title: "Deploying at Scale", type: "video", duration: "60 min", level: "Advanced" },
];

const Documentation = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <DashboardLayout>
      <div className="space-y-4 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
              Documentation
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">Guides, API reference, model cards, and technical documentation.</p>
                </TooltipContent>
              </Tooltip>
            </h1>
          </div>
          <Button variant="premium" size="sm">
            <ExternalLink className="h-4 w-4 mr-2" />
            Developer Portal
          </Button>
        </div>

        {/* Search compact */}
        <Card className="glass-card">
          <CardContent className="py-3">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-9"
                />
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="cursor-pointer hover:bg-muted text-xs">Getting Started</Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-muted text-xs">API</Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-muted text-xs">Model Cards</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="guides" className="space-y-3">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="guides" className="gap-1 text-xs">
              <BookOpen className="h-3.5 w-3.5" />Quick Start
            </TabsTrigger>
            <TabsTrigger value="api" className="gap-1 text-xs">
              <Code className="h-3.5 w-3.5" />API Reference
            </TabsTrigger>
            <TabsTrigger value="model-cards" className="gap-1 text-xs">
              <FileText className="h-3.5 w-3.5" />Model Cards
            </TabsTrigger>
            <TabsTrigger value="tutorials" className="gap-1 text-xs">
              <GraduationCap className="h-3.5 w-3.5" />Tutorials
            </TabsTrigger>
            <TabsTrigger value="best-practices" className="gap-1 text-xs">
              <Lightbulb className="h-3.5 w-3.5" />Best Practices
            </TabsTrigger>
          </TabsList>

          <TabsContent value="guides" className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {quickStartGuides.map((guide, i) => (
                <Card key={i} className="glass-card hover:border-primary/30 transition-colors cursor-pointer">
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <guide.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-sm">{guide.title}</h3>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent><p className="text-xs">{guide.tip}</p></TooltipContent>
                          </Tooltip>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{guide.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{guide.time}</span>
                          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                            Read <ChevronRight className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="api" className="space-y-3">
            <Card className="glass-card">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Code className="h-4 w-4 text-primary" />
                  REST API Reference
                  <Tooltip>
                    <TooltipTrigger asChild><Info className="h-3 w-3 text-muted-foreground cursor-help" /></TooltipTrigger>
                    <TooltipContent><p className="text-xs">Complete API documentation for platform integration</p></TooltipContent>
                  </Tooltip>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <div className="space-y-2">
                  {apiDocs.map((api, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{api.title}</span>
                          <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{api.endpoint}</code>
                        </div>
                        <div className="flex items-center gap-1">
                          {api.methods.slice(0, 3).map((method, j) => (
                            <Badge 
                              key={j} 
                              variant={method === "GET" ? "success" : method === "POST" ? "info" : method === "DELETE" ? "destructive" : "warning"}
                              className="text-xs h-5"
                            >
                              {method}
                            </Badge>
                          ))}
                          {api.methods.length > 3 && <span className="text-xs text-muted-foreground">+{api.methods.length - 3}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="model-cards" className="space-y-3">
            <Card className="glass-card">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gold" />
                  Model Cards (AI Act Compliant)
                  <Tooltip>
                    <TooltipTrigger asChild><Info className="h-3 w-3 text-muted-foreground cursor-help" /></TooltipTrigger>
                    <TooltipContent><p className="text-xs">Technical documentation and transparency reports</p></TooltipContent>
                  </Tooltip>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <div className="space-y-2">
                  {modelCards.map((card, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Box className="h-4 w-4 text-primary" />
                          <div>
                            <span className="font-medium text-sm">{card.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">{card.project}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={card.status === "complete" ? "success" : "warning"} className="text-xs">
                            {card.status}
                          </Badge>
                          <Button variant="outline" size="sm" className="h-7 text-xs">View</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tutorials" className="space-y-3">
            <div className="space-y-2">
              {tutorials.map((tutorial, i) => (
                <Card key={i} className="glass-card hover:border-primary/30 transition-colors cursor-pointer">
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${tutorial.type === "video" ? "bg-destructive/10" : "bg-primary/10"}`}>
                          {tutorial.type === "video" ? (
                            <Video className="h-4 w-4 text-destructive" />
                          ) : (
                            <FileText className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-sm">{tutorial.title}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="text-xs">{tutorial.level}</Badge>
                            <span className="text-xs text-muted-foreground">{tutorial.duration}</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
                        {tutorial.type === "video" ? "Watch" : "Read"} <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="best-practices" className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[
                { title: "Model Versioning", description: "Best practices for versioning", icon: Box, tip: "Semantic versioning for ML models" },
                { title: "Data Quality", description: "Ensuring data quality", icon: Database, tip: "Data validation and monitoring" },
                { title: "Security Guidelines", description: "Security best practices", icon: Shield, tip: "Secure ML system design" },
                { title: "Performance", description: "Optimization tips", icon: Zap, tip: "Latency and throughput optimization" },
                { title: "Monitoring", description: "Alerting setup", icon: Activity, tip: "Drift detection and alerts" },
                { title: "CI/CD for ML", description: "Continuous deployment", icon: Settings, tip: "MLOps pipeline automation" },
              ].map((practice, i) => (
                <Card key={i} className="glass-card hover:border-primary/30 transition-colors cursor-pointer">
                  <CardContent className="py-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-gold/10">
                        <practice.icon className="h-4 w-4 text-gold" />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm flex items-center gap-1">
                          {practice.title}
                          <Tooltip>
                            <TooltipTrigger asChild><Info className="h-3 w-3 text-muted-foreground cursor-help" /></TooltipTrigger>
                            <TooltipContent><p className="text-xs">{practice.tip}</p></TooltipContent>
                          </Tooltip>
                        </h3>
                        <p className="text-xs text-muted-foreground">{practice.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Documentation;