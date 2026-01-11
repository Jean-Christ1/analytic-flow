import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Database,
  GitBranch,
  ArrowRight,
  Layers,
  Box,
  CheckCircle,
  Clock,
  FileText,
  RefreshCw,
  Eye,
  BarChart3,
  Activity,
  Workflow,
  Server,
} from "lucide-react";

const trainingLineage = {
  datasets: [
    {
      id: "ds-001",
      name: "ImageNet-1K",
      version: "2023.1",
      records: "1,281,167",
      size: "150 GB",
      source: "External",
      lastUpdated: "2024-06-15",
      validation: "passed",
    },
    {
      id: "ds-002",
      name: "Custom Retail Products",
      version: "3.2.0",
      records: "524,890",
      size: "45 GB",
      source: "Internal",
      lastUpdated: "2025-11-28",
      validation: "passed",
    },
    {
      id: "ds-003",
      name: "Augmentation Pipeline Output",
      version: "auto",
      records: "3,612,114",
      size: "280 GB",
      source: "Pipeline",
      lastUpdated: "2025-12-01",
      validation: "passed",
    },
  ],
  preprocessingSteps: [
    { step: "Image Resize", params: "224x224", duration: "2h 15m" },
    { step: "Normalization", params: "ImageNet mean/std", duration: "45m" },
    { step: "Random Augmentation", params: "AutoAugment-ImageNet", duration: "8h 30m" },
    { step: "Train/Val/Test Split", params: "80/10/10", duration: "30m" },
    { step: "TFRecord Conversion", params: "shards=1024", duration: "4h 10m" },
  ],
  featureSets: [
    {
      name: "Base Features",
      features: 2048,
      source: "ResNet-152 Backbone",
      created: "2025-10-01",
    },
    {
      name: "Custom Head Features",
      features: 512,
      source: "Trainable FC Layers",
      created: "2025-10-15",
    },
    {
      name: "Augmented Features",
      features: 256,
      source: "Feature Engineering",
      created: "2025-11-01",
    },
  ],
  trainingRuns: [
    {
      id: "run-001",
      name: "Initial Training",
      status: "completed",
      startTime: "2025-10-01 08:00",
      endTime: "2025-10-03 04:32",
      accuracy: "88.5%",
      epochs: 100,
    },
    {
      id: "run-002",
      name: "Fine-tuning v1",
      status: "completed",
      startTime: "2025-10-15 10:00",
      endTime: "2025-10-16 18:45",
      accuracy: "90.2%",
      epochs: 50,
    },
    {
      id: "run-003",
      name: "Fine-tuning v2 (Current)",
      status: "completed",
      startTime: "2025-12-01 09:00",
      endTime: "2025-12-03 09:32",
      accuracy: "91.2%",
      epochs: 50,
    },
  ],
  modelVersions: [
    { version: "1.0.0", parent: null, accuracy: "88.5%", date: "2025-10-03" },
    { version: "1.5.0", parent: "1.0.0", accuracy: "89.5%", date: "2025-10-20" },
    { version: "2.0.0", parent: "1.5.0", accuracy: "90.2%", date: "2025-11-15" },
    { version: "2.1.0", parent: "2.0.0", accuracy: "91.2%", date: "2025-12-05" },
  ],
};

export const TrainingLineage = () => {
  return (
    <div className="space-y-6">
      {/* Data Lineage Flow */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Workflow className="h-4 w-4 text-primary" />
            Data Flow & Lineage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20 overflow-x-auto">
            {/* Sources */}
            <div className="flex flex-col gap-2 min-w-[150px]">
              <span className="text-xs text-muted-foreground font-medium mb-1">Data Sources</span>
              {trainingLineage.datasets.slice(0, 2).map((ds, i) => (
                <div key={i} className="p-2 rounded bg-primary/10 border border-primary/20 text-xs">
                  <Database className="h-3 w-3 text-primary inline mr-1" />
                  {ds.name}
                </div>
              ))}
            </div>
            
            <ArrowRight className="h-5 w-5 text-muted-foreground mx-2 flex-shrink-0" />
            
            {/* Preprocessing */}
            <div className="flex flex-col gap-2 min-w-[150px]">
              <span className="text-xs text-muted-foreground font-medium mb-1">Preprocessing</span>
              <div className="p-2 rounded bg-warning/10 border border-warning/20 text-xs">
                <RefreshCw className="h-3 w-3 text-warning inline mr-1" />
                5 Steps Pipeline
              </div>
            </div>
            
            <ArrowRight className="h-5 w-5 text-muted-foreground mx-2 flex-shrink-0" />
            
            {/* Feature Store */}
            <div className="flex flex-col gap-2 min-w-[150px]">
              <span className="text-xs text-muted-foreground font-medium mb-1">Feature Store</span>
              <div className="p-2 rounded bg-info/10 border border-info/20 text-xs">
                <Layers className="h-3 w-3 text-info inline mr-1" />
                2,816 Features
              </div>
            </div>
            
            <ArrowRight className="h-5 w-5 text-muted-foreground mx-2 flex-shrink-0" />
            
            {/* Training */}
            <div className="flex flex-col gap-2 min-w-[150px]">
              <span className="text-xs text-muted-foreground font-medium mb-1">Training</span>
              <div className="p-2 rounded bg-success/10 border border-success/20 text-xs">
                <Activity className="h-3 w-3 text-success inline mr-1" />
                3 Runs
              </div>
            </div>
            
            <ArrowRight className="h-5 w-5 text-muted-foreground mx-2 flex-shrink-0" />
            
            {/* Model */}
            <div className="flex flex-col gap-2 min-w-[150px]">
              <span className="text-xs text-muted-foreground font-medium mb-1">Model</span>
              <div className="p-2 rounded bg-gold/10 border border-gold/20 text-xs">
                <Box className="h-3 w-3 text-gold inline mr-1" />
                v2.1.0 Production
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Training Datasets */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Database className="h-4 w-4 text-info" />
            Training Datasets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {trainingLineage.datasets.map((ds, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-muted/20 border border-border/30">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-info/10">
                    <Database className="h-5 w-5 text-info" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{ds.name}</span>
                      <Badge variant="outline" className="text-xs">v{ds.version}</Badge>
                      <Badge variant={ds.source === "Internal" ? "default" : ds.source === "External" ? "secondary" : "outline"} className="text-xs">
                        {ds.source}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {ds.records} records • {ds.size} • Updated {ds.lastUpdated}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-xs text-success">Validated</span>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preprocessing & Feature Sets */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-warning" />
              Preprocessing Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {trainingLineage.preprocessingSteps.map((step, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-warning/20 flex items-center justify-center text-xs font-medium text-warning">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{step.step}</p>
                      <p className="text-xs text-muted-foreground font-mono">{step.params}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {step.duration}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Layers className="h-4 w-4 text-gold" />
              Feature Sets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trainingLineage.featureSets.map((fs, i) => (
                <div key={i} className="p-4 rounded-lg bg-muted/20 border border-border/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{fs.name}</span>
                    <Badge variant="outline" className="font-mono">{fs.features} features</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Source: {fs.source} • Created: {fs.created}
                  </p>
                </div>
              ))}
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Features</span>
                  <span className="text-lg font-bold text-primary">2,816</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Training Runs & Model Versions */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-success" />
              Training Runs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trainingLineage.trainingRuns.map((run, i) => (
                <div key={i} className={`p-4 rounded-lg border ${i === trainingLineage.trainingRuns.length - 1 ? "bg-success/5 border-success/20" : "bg-muted/20 border-border/30"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{run.name}</span>
                      {i === trainingLineage.trainingRuns.length - 1 && (
                        <Badge variant="success" className="text-xs">Latest</Badge>
                      )}
                    </div>
                    <span className="text-lg font-bold text-success">{run.accuracy}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {run.startTime} → {run.endTime}
                    </span>
                    <span>{run.epochs} epochs</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-primary" />
              Model Version Tree
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative pl-6">
              {trainingLineage.modelVersions.map((version, i) => (
                <div key={i} className="relative pb-4 last:pb-0">
                  {/* Vertical line */}
                  {i < trainingLineage.modelVersions.length - 1 && (
                    <div className="absolute left-[-18px] top-4 w-0.5 h-full bg-border" />
                  )}
                  {/* Node */}
                  <div className="absolute left-[-22px] top-1 w-3 h-3 rounded-full border-2 border-primary bg-background" />
                  
                  <div className={`p-3 rounded-lg ${i === trainingLineage.modelVersions.length - 1 ? "bg-primary/10 border border-primary/30" : "bg-muted/20"}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium">v{version.version}</span>
                        {i === trainingLineage.modelVersions.length - 1 && (
                          <Badge variant="default" className="text-xs">Current</Badge>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-success">{version.accuracy}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{version.date}</span>
                      {version.parent && (
                        <>
                          <span>•</span>
                          <span>from v{version.parent}</span>
                        </>
                      )}
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

export default TrainingLineage;
