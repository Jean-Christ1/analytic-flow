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
  Shield,
  CheckCircle,
  AlertTriangle,
  Clock,
  Download,
  Eye,
  Scale,
  Brain,
  Lock,
  FileCheck,
  AlertCircle,
  ClipboardCheck,
  Info,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const aiActRequirements = [
  { id: 1, category: "Risk Assessment", requirement: "High-risk AI classification", status: "compliant", priority: "critical" },
  { id: 2, category: "Transparency", requirement: "Model explainability docs", status: "compliant", priority: "critical" },
  { id: 3, category: "Human Oversight", requirement: "Human-in-the-loop controls", status: "compliant", priority: "high" },
  { id: 4, category: "Data Governance", requirement: "Training data bias assessment", status: "in-progress", priority: "critical" },
  { id: 5, category: "Documentation", requirement: "Technical documentation (Model Cards)", status: "compliant", priority: "high" },
  { id: 6, category: "Robustness", requirement: "Accuracy & cybersecurity measures", status: "compliant", priority: "high" },
];

const gdprRequirements = [
  { id: 1, category: "Data Subject Rights", requirement: "Right to access personal data", status: "compliant" },
  { id: 2, category: "Data Subject Rights", requirement: "Right to erasure", status: "compliant" },
  { id: 3, category: "Consent Management", requirement: "Explicit consent tracking", status: "compliant" },
  { id: 4, category: "Data Protection", requirement: "Encryption at rest & transit", status: "compliant" },
  { id: 5, category: "Privacy by Design", requirement: "Privacy Impact Assessments", status: "in-progress" },
  { id: 6, category: "DPO", requirement: "Data Protection Officer", status: "compliant" },
];

const certifications = [
  { name: "SOC 2 Type II", status: "certified", validUntil: "2025-06-15" },
  { name: "ISO 27001", status: "certified", validUntil: "2025-03-20" },
  { name: "HIPAA", status: "certified", validUntil: "2025-08-01" },
  { name: "PCI DSS", status: "in-progress", validUntil: null },
];

const ITEMS_PER_PAGE = 4;

const Compliance = () => {
  const [aiActPage, setAiActPage] = useState(1);
  const [gdprPage, setGdprPage] = useState(1);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "compliant":
      case "certified":
        return <Badge variant="success" className="gap-1 text-xs"><CheckCircle className="h-3 w-3" />OK</Badge>;
      case "in-progress":
        return <Badge variant="warning" className="gap-1 text-xs"><Clock className="h-3 w-3" />Progress</Badge>;
      case "pending":
        return <Badge variant="secondary" className="gap-1 text-xs"><Clock className="h-3 w-3" />Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const aiActCompliance = Math.round((aiActRequirements.filter(r => r.status === "compliant").length / aiActRequirements.length) * 100);
  const gdprCompliance = Math.round((gdprRequirements.filter(r => r.status === "compliant").length / gdprRequirements.length) * 100);

  const paginatedAiAct = aiActRequirements.slice((aiActPage - 1) * ITEMS_PER_PAGE, aiActPage * ITEMS_PER_PAGE);
  const paginatedGdpr = gdprRequirements.slice((gdprPage - 1) * ITEMS_PER_PAGE, gdprPage * ITEMS_PER_PAGE);

  return (
    <DashboardLayout>
      <div className="space-y-4 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
              Compliance & Regulations
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">AI Act, GDPR, and regulatory compliance management with audit trails.</p>
                </TooltipContent>
              </Tooltip>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="premium" size="sm">
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Assessment
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <Card className="glass-card border-primary/20">
            <CardContent className="py-3">
              <div className="flex items-center justify-between mb-1">
                <Brain className="h-5 w-5 text-primary" />
                <Badge variant="success" className="text-xs">Active</Badge>
              </div>
              <p className="text-2xl font-bold font-display">{aiActCompliance}%</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                AI Act Compliance
                <Tooltip>
                  <TooltipTrigger asChild><Info className="h-3 w-3 cursor-help" /></TooltipTrigger>
                  <TooltipContent><p className="text-xs">EU AI Act compliance status</p></TooltipContent>
                </Tooltip>
              </p>
              <Progress value={aiActCompliance} className="h-1 mt-1" />
            </CardContent>
          </Card>

          <Card className="glass-card border-success/20">
            <CardContent className="py-3">
              <div className="flex items-center justify-between mb-1">
                <Shield className="h-5 w-5 text-success" />
                <Badge variant="success" className="text-xs">Active</Badge>
              </div>
              <p className="text-2xl font-bold font-display">{gdprCompliance}%</p>
              <p className="text-xs text-muted-foreground">GDPR Compliance</p>
              <Progress value={gdprCompliance} className="h-1 mt-1" />
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="py-3">
              <FileCheck className="h-5 w-5 text-gold mb-1" />
              <p className="text-2xl font-bold font-display">3/4</p>
              <p className="text-xs text-muted-foreground">Certifications</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="py-3">
              <AlertCircle className="h-5 w-5 text-warning mb-1" />
              <p className="text-2xl font-bold font-display">2</p>
              <p className="text-xs text-muted-foreground">Pending Actions</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="ai-act" className="space-y-3">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="ai-act" className="gap-1 text-xs">
              <Brain className="h-3.5 w-3.5" />AI Act
            </TabsTrigger>
            <TabsTrigger value="gdpr" className="gap-1 text-xs">
              <Shield className="h-3.5 w-3.5" />GDPR
            </TabsTrigger>
            <TabsTrigger value="certifications" className="gap-1 text-xs">
              <FileCheck className="h-3.5 w-3.5" />Certifications
            </TabsTrigger>
            <TabsTrigger value="risk" className="gap-1 text-xs">
              <Scale className="h-3.5 w-3.5" />Risk Assessment
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai-act" className="space-y-3">
            <Card className="glass-card">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  EU AI Act Requirements
                  <Tooltip>
                    <TooltipTrigger asChild><Info className="h-3 w-3 text-muted-foreground cursor-help" /></TooltipTrigger>
                    <TooltipContent><p className="text-xs">High-risk AI system compliance requirements</p></TooltipContent>
                  </Tooltip>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <div className="space-y-2">
                  {paginatedAiAct.map((req) => (
                    <div key={req.id} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <Badge variant="outline" className="text-xs">{req.category}</Badge>
                          {req.priority === "critical" && <Badge variant="destructive" className="text-xs">Critical</Badge>}
                          <span className="text-sm">{req.requirement}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(req.status)}
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Pagination */}
                <div className="flex items-center justify-between pt-3 mt-2 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">{aiActRequirements.length} requirements</p>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => setAiActPage(p => Math.max(1, p - 1))} disabled={aiActPage === 1}>
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                    <span className="text-xs px-2">{aiActPage}/{Math.ceil(aiActRequirements.length / ITEMS_PER_PAGE)}</span>
                    <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => setAiActPage(p => Math.min(Math.ceil(aiActRequirements.length / ITEMS_PER_PAGE), p + 1))} disabled={aiActPage >= Math.ceil(aiActRequirements.length / ITEMS_PER_PAGE)}>
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gdpr" className="space-y-3">
            <Card className="glass-card">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4 text-success" />
                  GDPR Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <div className="space-y-2">
                  {paginatedGdpr.map((req) => (
                    <div key={req.id} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <Badge variant="outline" className="text-xs">{req.category}</Badge>
                          <span className="text-sm">{req.requirement}</span>
                        </div>
                        {getStatusBadge(req.status)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-3 mt-2 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">{gdprRequirements.length} requirements</p>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => setGdprPage(p => Math.max(1, p - 1))} disabled={gdprPage === 1}>
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                    <span className="text-xs px-2">{gdprPage}/{Math.ceil(gdprRequirements.length / ITEMS_PER_PAGE)}</span>
                    <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => setGdprPage(p => Math.min(Math.ceil(gdprRequirements.length / ITEMS_PER_PAGE), p + 1))} disabled={gdprPage >= Math.ceil(gdprRequirements.length / ITEMS_PER_PAGE)}>
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="certifications" className="space-y-3">
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  {certifications.map((cert, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{cert.name}</span>
                        {getStatusBadge(cert.status)}
                      </div>
                      {cert.validUntil && (
                        <p className="text-xs text-muted-foreground">Valid until: {cert.validUntil}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="risk" className="space-y-3">
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="space-y-2">
                  {[
                    { project: "Fraud Detection", models: 3, risk: "high", controls: "Enhanced monitoring, human review" },
                    { project: "Customer Churn", models: 2, risk: "limited", controls: "Standard monitoring" },
                    { project: "Sentiment Analysis", models: 2, risk: "minimal", controls: "Basic logging" },
                    { project: "Time Series", models: 4, risk: "limited", controls: "Standard monitoring" },
                  ].map((item, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{item.project}</span>
                        <Badge variant={item.risk === "high" ? "destructive" : item.risk === "limited" ? "warning" : "success"} className="text-xs">
                          {item.risk} risk
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{item.models} models • {item.controls}</p>
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

export default Compliance;