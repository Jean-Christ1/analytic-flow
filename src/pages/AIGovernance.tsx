// ============================================================================
// AI Governance Dashboard Page
// MLOps Control Plane v3
// Author: Armand AMOUSSOU
// Date: 2026-01-04
// ============================================================================
//
// EU AI Act Compliance Dashboard for managing AI systems, model cards,
// risk assessments, compliance controls, and governance incidents.
//
// ============================================================================

import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Brain,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Scale,
  Eye,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  Download,
  Info,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  FileCheck,
  Gavel,
  BookOpen,
  Flag,
  Target,
  Users,
  ClipboardCheck,
  ShieldCheck,
  ShieldAlert,
  Activity,
  BarChart3,
  Layers,
  CircleDot,
  GitBranch,
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { format, formatDistanceToNow } from "date-fns";

// ============================================================================
// Governance Hooks Imports
// ============================================================================
import {
  // AI Systems
  useAISystems,
  useHighRiskAISystems,
  useAISystemComplianceSummary,
  useCreateAISystem,
  useClassifyAISystemRisk,
  type AIRiskClass,
  type AISystemStatus,
  // Model Cards
  useModelCards,
  useStaleModelCards,
  useCreateModelCard,
  // Risk Assessments
  useRiskAssessments,
  useRiskAssessmentsRequiringReview,
  useRiskAssessmentStats,
  useCreateRiskAssessment,
  type ResidualRiskLevel,
  // Compliance Controls
  useComplianceControls,
  useEUAIActControls,
  useComplianceStatus,
  EU_AI_ACT_CONTROLS,
  type ComplianceFramework,
  // Compliance Evidence
  useComplianceEvidence,
  usePendingEvidence,
  useComplianceGaps,
  useCreateComplianceEvidence,
  type ComplianceEvidenceStatus,
  // Governance Incidents
  useGovernanceIncidents,
  useOpenIncidents as useOpenGovernanceIncidents,
  useCriticalIncidents as useCriticalGovernanceIncidents,
  useIncidentStats,
  useIncidentTrends,
  useCreateGovernanceIncident,
  type GovernanceIncidentType,
} from "@/hooks/api/governance";

// ============================================================================
// Types
// ============================================================================
type RiskClassFilter = AIRiskClass | "all";
type StatusFilter = AISystemStatus | "all";

// ============================================================================
// Constants
// ============================================================================
const ITEMS_PER_PAGE = 5;

const RISK_CLASS_CONFIG: Record<AIRiskClass, { color: string; bgColor: string; label: string }> = {
  unacceptable: { color: "text-destructive", bgColor: "bg-destructive/10", label: "Unacceptable" },
  high: { color: "text-warning", bgColor: "bg-warning/10", label: "High Risk" },
  limited: { color: "text-info", bgColor: "bg-info/10", label: "Limited Risk" },
  minimal: { color: "text-success", bgColor: "bg-success/10", label: "Minimal Risk" },
};

const STATUS_CONFIG: Record<AISystemStatus, { color: string; icon: React.ElementType }> = {
  draft: { color: "secondary", icon: FileText },
  under_review: { color: "warning", icon: Clock },
  approved: { color: "success", icon: CheckCircle },
  deployed: { color: "info", icon: Activity },
  retired: { color: "secondary", icon: Shield },
};

const INCIDENT_TYPE_LABELS: Record<GovernanceIncidentType, string> = {
  bias_detected: "Bias Detected",
  performance_degradation: "Performance Degradation",
  data_breach: "Data Breach",
  model_failure: "Model Failure",
  compliance_violation: "Compliance Violation",
  safety_concern: "Safety Concern",
  user_complaint: "User Complaint",
  other: "Other",
};

// ============================================================================
// Helper Components
// ============================================================================
const LoadingCard = () => (
  <Card className="glass-card">
    <CardContent className="py-4 px-4">
      <Skeleton className="h-4 w-20 mb-2" />
      <Skeleton className="h-8 w-28 mb-1" />
      <Skeleton className="h-3 w-16" />
    </CardContent>
  </Card>
);

const EmptyState = ({ message, icon: Icon }: { message: string; icon: React.ElementType }) => (
  <div className="flex flex-col items-center justify-center py-8 text-center">
    <div className="p-3 rounded-full bg-muted/50 mb-3">
      <Icon className="h-6 w-6 text-muted-foreground" />
    </div>
    <p className="text-sm text-muted-foreground">{message}</p>
  </div>
);

const RiskBadge = ({ riskClass }: { riskClass: AIRiskClass }) => {
  const config = RISK_CLASS_CONFIG[riskClass];
  return (
    <Badge variant="outline" className={`${config.color} ${config.bgColor} text-[10px]`}>
      {config.label}
    </Badge>
  );
};

const ComplianceScore = ({ score, size = "md" }: { score: number; size?: "sm" | "md" | "lg" }) => {
  const getColor = (s: number) => {
    if (s >= 90) return "text-success";
    if (s >= 70) return "text-warning";
    return "text-destructive";
  };

  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };

  return (
    <span className={`font-bold ${sizeClasses[size]} ${getColor(score)}`}>
      {score.toFixed(0)}%
    </span>
  );
};

// ============================================================================
// Main Component
// ============================================================================
const AIGovernance = () => {
  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------
  const [riskFilter, setRiskFilter] = useState<RiskClassFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [frameworkFilter, setFrameworkFilter] = useState<ComplianceFramework | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddSystemDialogOpen, setIsAddSystemDialogOpen] = useState(false);
  const [isAddIncidentDialogOpen, setIsAddIncidentDialogOpen] = useState(false);

  // -------------------------------------------------------------------------
  // Data Fetching Hooks
  // -------------------------------------------------------------------------

  // AI Systems
  const {
    data: aiSystemsData,
    isLoading: isLoadingAISystems,
    refetch: refetchAISystems,
  } = useAISystems({
    pagination: { page: currentPage, pageSize: ITEMS_PER_PAGE },
  });

  // High Risk Systems
  const {
    data: highRiskSystems,
    isLoading: isLoadingHighRisk,
  } = useHighRiskAISystems();

  // Compliance Summary
  const {
    data: complianceSummary,
    isLoading: isLoadingComplianceSummary,
  } = useAISystemComplianceSummary();

  // Model Cards
  const {
    data: modelCardsData,
    isLoading: isLoadingModelCards,
  } = useModelCards({
    pagination: { page: 1, pageSize: 50 },
  });

  // Stale Model Cards
  const {
    data: staleModelCards,
    isLoading: isLoadingStaleCards,
  } = useStaleModelCards(90);

  // Risk Assessments
  const {
    data: riskAssessmentsData,
    isLoading: isLoadingRiskAssessments,
  } = useRiskAssessments({
    pagination: { page: 1, pageSize: 50 },
  });

  // Risk Assessments Requiring Review
  const {
    data: assessmentsRequiringReview,
    isLoading: isLoadingReviewRequired,
  } = useRiskAssessmentsRequiringReview();

  // Risk Assessment Stats
  const {
    data: riskStats,
    isLoading: isLoadingRiskStats,
  } = useRiskAssessmentStats();

  // Compliance Controls
  const {
    data: complianceControlsData,
    isLoading: isLoadingControls,
  } = useComplianceControls({
    pagination: { page: 1, pageSize: 100 },
  });

  // EU AI Act Controls
  const {
    data: euAIActControls,
    isLoading: isLoadingEUControls,
  } = useEUAIActControls();

  // Compliance Status
  const {
    data: overallComplianceStatus,
    isLoading: isLoadingComplianceStatus,
  } = useComplianceStatus();

  // Compliance Evidence
  const {
    data: evidenceData,
    isLoading: isLoadingEvidence,
  } = useComplianceEvidence({
    pagination: { page: 1, pageSize: 50 },
  });

  // Pending Evidence
  const {
    data: pendingEvidence,
    isLoading: isLoadingPendingEvidence,
  } = usePendingEvidence();

  // Compliance Gaps
  const {
    data: complianceGaps,
    isLoading: isLoadingGaps,
  } = useComplianceGaps();

  // Governance Incidents
  const {
    data: incidentsData,
    isLoading: isLoadingIncidents,
  } = useGovernanceIncidents({
    pagination: { page: 1, pageSize: 50 },
  });

  // Open Incidents
  const {
    data: openIncidents,
    isLoading: isLoadingOpenIncidents,
  } = useOpenGovernanceIncidents();

  // Critical Incidents
  const {
    data: criticalIncidents,
    isLoading: isLoadingCriticalIncidents,
  } = useCriticalGovernanceIncidents();

  // Incident Stats
  const {
    data: incidentStatsData,
    isLoading: isLoadingIncidentStats,
  } = useIncidentStats();

  // Incident Trends
  const {
    data: incidentTrends,
    isLoading: isLoadingIncidentTrends,
  } = useIncidentTrends("monthly", 6);

  // -------------------------------------------------------------------------
  // Mutations
  // -------------------------------------------------------------------------
  const createAISystem = useCreateAISystem({
    onSuccess: () => {
      setIsAddSystemDialogOpen(false);
      refetchAISystems();
    },
  });

  const createGovernanceIncident = useCreateGovernanceIncident({
    onSuccess: () => {
      setIsAddIncidentDialogOpen(false);
    },
  });

  // -------------------------------------------------------------------------
  // Computed Values
  // -------------------------------------------------------------------------
  const aiSystems = aiSystemsData?.data || [];
  const totalAISystems = aiSystemsData?.count || 0;
  const modelCards = modelCardsData?.data || [];
  const riskAssessments = riskAssessmentsData?.data || [];
  const complianceControls = complianceControlsData?.data || [];
  const evidence = evidenceData?.data || [];
  const incidents = incidentsData?.data || [];

  // Calculate compliance score
  const complianceScore = useMemo(() => {
    if (!overallComplianceStatus) return 0;
    const total = overallComplianceStatus.total_controls || 0;
    const compliant = overallComplianceStatus.compliant_controls || 0;
    return total > 0 ? (compliant / total) * 100 : 0;
  }, [overallComplianceStatus]);

  // Risk distribution for chart
  const riskDistribution = useMemo(() => {
    if (!complianceSummary) return [];
    return [
      { name: "High Risk", value: complianceSummary.high_risk_count || 0, color: "hsl(var(--warning))" },
      { name: "Limited", value: complianceSummary.limited_risk_count || 0, color: "hsl(var(--info))" },
      { name: "Minimal", value: complianceSummary.minimal_risk_count || 0, color: "hsl(var(--success))" },
    ].filter(item => item.value > 0);
  }, [complianceSummary]);

  // EU AI Act compliance by article
  const euActCompliance = useMemo(() => {
    if (!euAIActControls) return [];
    const articleGroups: Record<string, { total: number; compliant: number }> = {};

    euAIActControls.forEach(control => {
      const article = control.article || "General";
      if (!articleGroups[article]) {
        articleGroups[article] = { total: 0, compliant: 0 };
      }
      articleGroups[article].total++;
      if (control.status === "compliant") {
        articleGroups[article].compliant++;
      }
    });

    return Object.entries(articleGroups)
      .map(([article, data]) => ({
        article,
        compliance: data.total > 0 ? (data.compliant / data.total) * 100 : 0,
        total: data.total,
        compliant: data.compliant,
      }))
      .sort((a, b) => a.article.localeCompare(b.article))
      .slice(0, 8);
  }, [euAIActControls]);

  // Incident trend data for chart
  const incidentTrendData = useMemo(() => {
    return (incidentTrends || []).map(trend => ({
      period: trend.period,
      total: trend.total_incidents,
      resolved: trend.resolved_incidents,
      critical: trend.critical_incidents,
    }));
  }, [incidentTrends]);

  // Pagination
  const totalPages = Math.ceil(totalAISystems / ITEMS_PER_PAGE);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <DashboardLayout>
      <div className="space-y-4 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold flex items-center gap-2">
              AI Governance
              <Badge variant="info" className="text-[10px]">EU AI Act</Badge>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">Comprehensive AI governance dashboard for EU AI Act compliance, risk management, and responsible AI practices.</p>
                </TooltipContent>
              </Tooltip>
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage AI systems, model cards, risk assessments, and compliance
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={riskFilter} onValueChange={(v) => setRiskFilter(v as RiskClassFilter)}>
              <SelectTrigger className="w-[140px] h-9 bg-muted/50">
                <Scale className="h-3.5 w-3.5 mr-2" />
                <SelectValue placeholder="All Risk Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
                <SelectItem value="limited">Limited Risk</SelectItem>
                <SelectItem value="minimal">Minimal Risk</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="h-3.5 w-3.5 mr-1" />
              Export Report
            </Button>
            <Button variant="premium" size="sm" onClick={() => setIsAddSystemDialogOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Register AI System
            </Button>
          </div>
        </div>

        {/* KPI Stats */}
        <div className="grid grid-cols-6 gap-3">
          {/* Compliance Score */}
          {isLoadingComplianceStatus ? (
            <LoadingCard />
          ) : (
            <Card className="glass-card gradient-border">
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Compliance Score</p>
                    <ComplianceScore score={complianceScore} />
                    <Progress
                      value={complianceScore}
                      className={`h-1 mt-1 w-20 ${
                        complianceScore >= 90 ? '' :
                        complianceScore >= 70 ? '[&>div]:bg-warning' :
                        '[&>div]:bg-destructive'
                      }`}
                    />
                  </div>
                  <div className="p-2 rounded-lg bg-primary/10">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Systems */}
          {isLoadingAISystems ? (
            <LoadingCard />
          ) : (
            <Card className="glass-card">
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">AI Systems</p>
                    <p className="text-xl font-bold mt-0.5">{totalAISystems}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {(highRiskSystems?.length || 0)} high-risk
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-info/10">
                    <Brain className="h-4 w-4 text-info" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Model Cards */}
          {isLoadingModelCards ? (
            <LoadingCard />
          ) : (
            <Card className="glass-card">
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Model Cards</p>
                    <p className="text-xl font-bold mt-0.5">{modelCards.length}</p>
                    <p className="text-[10px] text-warning">
                      {(staleModelCards?.length || 0)} stale
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-success/10">
                    <FileText className="h-4 w-4 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Risk Assessments */}
          {isLoadingRiskAssessments ? (
            <LoadingCard />
          ) : (
            <Card className="glass-card">
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Risk Assessments</p>
                    <p className="text-xl font-bold mt-0.5">{riskAssessments.length}</p>
                    <p className="text-[10px] text-warning">
                      {(assessmentsRequiringReview?.length || 0)} need review
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-warning/10">
                    <Scale className="h-4 w-4 text-warning" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pending Evidence */}
          {isLoadingPendingEvidence ? (
            <LoadingCard />
          ) : (
            <Card className="glass-card">
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Pending Evidence</p>
                    <p className="text-xl font-bold mt-0.5">{pendingEvidence?.length || 0}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Awaiting review
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-gold/10">
                    <ClipboardCheck className="h-4 w-4 text-gold" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Open Incidents */}
          {isLoadingOpenIncidents ? (
            <LoadingCard />
          ) : (
            <Card className={`glass-card ${(criticalIncidents?.length || 0) > 0 ? 'border-destructive/50' : ''}`}>
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Open Incidents</p>
                    <p className="text-xl font-bold mt-0.5">{openIncidents?.length || 0}</p>
                    <p className={`text-[10px] ${(criticalIncidents?.length || 0) > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {(criticalIncidents?.length || 0)} critical
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg ${(criticalIncidents?.length || 0) > 0 ? 'bg-destructive/10' : 'bg-muted'}`}>
                    <AlertTriangle className={`h-4 w-4 ${(criticalIncidents?.length || 0) > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Critical Alerts */}
        {!isLoadingCriticalIncidents && criticalIncidents && criticalIncidents.length > 0 && (
          <Card className="glass-card border-destructive/50 bg-destructive/5">
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-3">
                <ShieldAlert className="h-5 w-5 text-destructive" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {criticalIncidents.length} critical governance incident{criticalIncidents.length > 1 ? 's' : ''} require immediate attention
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {criticalIncidents.slice(0, 3).map(i => i.title).join(", ")}
                  </p>
                </div>
                <Button variant="destructive" size="sm" onClick={() => setIsAddIncidentDialogOpen(true)}>
                  View All <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Compliance Gaps Alert */}
        {!isLoadingGaps && complianceGaps && complianceGaps.length > 0 && (
          <Card className="glass-card border-warning/50 bg-warning/5">
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-warning" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {complianceGaps.length} compliance gap{complianceGaps.length > 1 ? 's' : ''} identified
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Missing evidence for {complianceGaps.slice(0, 3).map(g => g.control_name).join(", ")}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Address Gaps <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-3">
          <TabsList className="h-9">
            <TabsTrigger value="overview" className="text-xs gap-1">
              <BarChart3 className="h-3 w-3" />Overview
            </TabsTrigger>
            <TabsTrigger value="systems" className="text-xs gap-1">
              <Brain className="h-3 w-3" />AI Systems
            </TabsTrigger>
            <TabsTrigger value="model-cards" className="text-xs gap-1">
              <FileText className="h-3 w-3" />Model Cards
            </TabsTrigger>
            <TabsTrigger value="risks" className="text-xs gap-1">
              <Scale className="h-3 w-3" />Risk Assessments
            </TabsTrigger>
            <TabsTrigger value="compliance" className="text-xs gap-1">
              <Shield className="h-3 w-3" />Compliance
            </TabsTrigger>
            <TabsTrigger value="incidents" className="text-xs gap-1">
              <AlertTriangle className="h-3 w-3" />Incidents
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              {/* Risk Distribution */}
              <Card className="glass-card">
                <CardHeader className="py-2 px-4">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    AI Systems by Risk Class
                    <Badge variant="outline" className="text-[10px]">EU AI Act</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3 px-4">
                  {isLoadingComplianceSummary ? (
                    <div className="h-[180px] flex items-center justify-center">
                      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : riskDistribution.length === 0 ? (
                    <EmptyState message="No AI systems registered" icon={Brain} />
                  ) : (
                    <>
                      <div className="h-[140px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={riskDistribution}
                              cx="50%"
                              cy="50%"
                              innerRadius={35}
                              outerRadius={55}
                              dataKey="value"
                              label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                              labelLine={false}
                            >
                              {riskDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <RechartsTooltip
                              contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px",
                                fontSize: "11px"
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-1 mt-2">
                        {riskDistribution.map((item, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                              <span className="text-muted-foreground">{item.name}</span>
                            </div>
                            <span className="font-bold">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* EU AI Act Compliance by Article */}
              <Card className="glass-card col-span-2">
                <CardHeader className="py-2 px-4">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    EU AI Act Compliance by Article
                    <Tooltip>
                      <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">Compliance percentage for each EU AI Act article requirement.</p>
                      </TooltipContent>
                    </Tooltip>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3 px-4">
                  {isLoadingEUControls ? (
                    <div className="h-[220px] flex items-center justify-center">
                      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : euActCompliance.length === 0 ? (
                    <EmptyState message="No EU AI Act controls configured" icon={Gavel} />
                  ) : (
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={euActCompliance} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                          <XAxis type="number" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(v) => `${v}%`} />
                          <YAxis type="category" dataKey="article" stroke="hsl(var(--muted-foreground))" fontSize={10} width={80} />
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                              fontSize: "11px"
                            }}
                            formatter={(value: number) => [`${value.toFixed(0)}%`, "Compliance"]}
                          />
                          <Bar dataKey="compliance" radius={[0, 4, 4, 0]}>
                            {euActCompliance.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.compliance >= 90 ? "hsl(var(--success))" : entry.compliance >= 70 ? "hsl(var(--warning))" : "hsl(var(--destructive))"}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Incident Trends */}
            <Card className="glass-card">
              <CardHeader className="py-2 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  Governance Incident Trends
                  <Badge variant="outline" className="text-[10px]">6 Months</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3 px-4">
                {isLoadingIncidentTrends ? (
                  <div className="h-[200px] flex items-center justify-center">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : incidentTrendData.length === 0 ? (
                  <EmptyState message="No incident data available" icon={AlertTriangle} />
                ) : (
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={incidentTrendData}>
                        <defs>
                          <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "11px"
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: "10px" }} />
                        <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fill="url(#totalGrad)" name="Total" />
                        <Area type="monotone" dataKey="resolved" stroke="hsl(var(--success))" fill="hsl(var(--success)/0.1)" name="Resolved" />
                        <Area type="monotone" dataKey="critical" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive)/0.1)" name="Critical" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Systems Tab */}
          <TabsContent value="systems" className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {totalAISystems} AI system{totalAISystems !== 1 ? 's' : ''} registered
              </p>
              <Dialog open={isAddSystemDialogOpen} onOpenChange={setIsAddSystemDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="premium" size="sm">
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Register System
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Register AI System</DialogTitle>
                    <DialogDescription>
                      Register a new AI system for EU AI Act compliance tracking.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>System Name</Label>
                      <Input placeholder="Fraud Detection Model v2" />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea placeholder="Describe the AI system's purpose and functionality..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Risk Class</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select risk class" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High Risk</SelectItem>
                            <SelectItem value="limited">Limited Risk</SelectItem>
                            <SelectItem value="minimal">Minimal Risk</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Intended Purpose</Label>
                        <Input placeholder="e.g., Credit scoring" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Deploying Organization</Label>
                      <Input placeholder="Organization name" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddSystemDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button variant="premium">Register System</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {isLoadingAISystems ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : aiSystems.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="py-8">
                  <EmptyState
                    message="No AI systems registered. Register your first AI system to start compliance tracking."
                    icon={Brain}
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {aiSystems.map((system) => (
                  <Card key={system.id} className="glass-card">
                    <CardContent className="py-3 px-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${RISK_CLASS_CONFIG[system.risk_class].bgColor}`}>
                            <Brain className={`h-4 w-4 ${RISK_CLASS_CONFIG[system.risk_class].color}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{system.name}</span>
                              <RiskBadge riskClass={system.risk_class} />
                              <Badge
                                variant={STATUS_CONFIG[system.status].color as any}
                                className="text-[10px]"
                              >
                                {system.status.replace("_", " ")}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {system.description || system.intended_purpose || "No description"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Version</p>
                            <p className="text-sm font-medium">{system.version || "1.0"}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Model Cards Tab */}
          <TabsContent value="model-cards" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  {modelCards.length} model card{modelCards.length !== 1 ? 's' : ''}
                </p>
                {(staleModelCards?.length || 0) > 0 && (
                  <Badge variant="warning" className="text-[10px]">
                    {staleModelCards?.length} stale
                  </Badge>
                )}
              </div>
              <Button variant="premium" size="sm">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Create Model Card
              </Button>
            </div>

            {isLoadingModelCards ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : modelCards.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="py-8">
                  <EmptyState
                    message="No model cards created yet. Create documentation for your ML models."
                    icon={FileText}
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {modelCards.slice(0, 6).map((card) => (
                  <Card key={card.id} className="glass-card">
                    <CardContent className="py-3 px-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          <span className="font-medium text-sm">{card.model_name}</span>
                          <Badge variant="outline" className="text-[10px]">
                            v{card.version}
                          </Badge>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {card.description || "No description provided"}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{card.model_type || "Unknown type"}</span>
                        <span>•</span>
                        <span>Updated {card.updated_at ? formatDistanceToNow(new Date(card.updated_at), { addSuffix: true }) : "N/A"}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Risk Assessments Tab */}
          <TabsContent value="risks" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  {riskAssessments.length} assessment{riskAssessments.length !== 1 ? 's' : ''}
                </p>
                {(assessmentsRequiringReview?.length || 0) > 0 && (
                  <Badge variant="warning" className="text-[10px]">
                    {assessmentsRequiringReview?.length} need review
                  </Badge>
                )}
              </div>
              <Button variant="premium" size="sm">
                <Plus className="h-3.5 w-3.5 mr-1" />
                New Assessment
              </Button>
            </div>

            {isLoadingRiskAssessments ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : riskAssessments.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="py-8">
                  <EmptyState
                    message="No risk assessments completed. Start by assessing your high-risk AI systems."
                    icon={Scale}
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {riskAssessments.slice(0, 5).map((assessment) => {
                  const riskLevel = assessment.residual_risk_level as ResidualRiskLevel;
                  const riskConfig = {
                    critical: { color: "text-destructive", bg: "bg-destructive/10" },
                    high: { color: "text-warning", bg: "bg-warning/10" },
                    medium: { color: "text-info", bg: "bg-info/10" },
                    low: { color: "text-success", bg: "bg-success/10" },
                    negligible: { color: "text-muted-foreground", bg: "bg-muted" },
                  }[riskLevel] || { color: "text-muted-foreground", bg: "bg-muted" };

                  return (
                    <Card key={assessment.id} className="glass-card">
                      <CardContent className="py-3 px-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${riskConfig.bg}`}>
                              <Scale className={`h-4 w-4 ${riskConfig.color}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{assessment.title}</span>
                                <Badge variant="outline" className={`text-[10px] ${riskConfig.color}`}>
                                  {riskLevel.replace("_", " ")} risk
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {assessment.hazards?.length || 0} hazards • {assessment.mitigations?.length || 0} mitigations
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Decision</p>
                              <Badge variant={
                                assessment.decision === "accept" ? "success" :
                                assessment.decision === "mitigate" ? "warning" :
                                assessment.decision === "avoid" ? "destructive" : "secondary"
                              } className="text-[10px]">
                                {assessment.decision || "Pending"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              {/* Overall Compliance Status */}
              <Card className="glass-card">
                <CardHeader className="py-2 px-4">
                  <CardTitle className="text-sm font-medium">Overall Compliance</CardTitle>
                </CardHeader>
                <CardContent className="pb-3 px-4">
                  {isLoadingComplianceStatus ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <ComplianceScore score={complianceScore} size="lg" />
                      <p className="text-xs text-muted-foreground mt-2">
                        {overallComplianceStatus?.compliant_controls || 0} of {overallComplianceStatus?.total_controls || 0} controls compliant
                      </p>
                      <Progress
                        value={complianceScore}
                        className={`h-2 mt-3 ${
                          complianceScore >= 90 ? '' :
                          complianceScore >= 70 ? '[&>div]:bg-warning' :
                          '[&>div]:bg-destructive'
                        }`}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* EU AI Act Controls */}
              <Card className="glass-card col-span-2">
                <CardHeader className="py-2 px-4">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    EU AI Act Control Status
                    <Badge variant="info" className="text-[10px]">
                      {EU_AI_ACT_CONTROLS.length} Controls
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3 px-4">
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {EU_AI_ACT_CONTROLS.map((control, i) => {
                        const dbControl = euAIActControls?.find(c => c.control_id === control.control_id);
                        const status = dbControl?.status || "not_started";

                        return (
                          <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                            <div className="flex items-center gap-2 flex-1">
                              <Badge variant="outline" className="text-[10px] shrink-0">
                                {control.article}
                              </Badge>
                              <span className="text-xs truncate">{control.name}</span>
                            </div>
                            <Badge
                              variant={
                                status === "compliant" ? "success" :
                                status === "in_progress" ? "warning" :
                                status === "non_compliant" ? "destructive" : "secondary"
                              }
                              className="text-[10px]"
                            >
                              {status === "compliant" && <CheckCircle className="h-3 w-3 mr-1" />}
                              {status === "in_progress" && <Clock className="h-3 w-3 mr-1" />}
                              {status === "non_compliant" && <AlertCircle className="h-3 w-3 mr-1" />}
                              {status.replace("_", " ")}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Evidence Management */}
            <Card className="glass-card">
              <CardHeader className="py-2 px-4">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    Compliance Evidence
                    <Badge variant="outline" className="text-[10px]">{evidence.length} items</Badge>
                  </span>
                  <Button variant="outline" size="sm">
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Evidence
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3 px-4">
                {isLoadingEvidence ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : evidence.length === 0 ? (
                  <EmptyState message="No evidence submitted yet" icon={ClipboardCheck} />
                ) : (
                  <div className="space-y-2">
                    {evidence.slice(0, 5).map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                        <div className="flex items-center gap-3">
                          <ClipboardCheck className="h-4 w-4 text-primary" />
                          <div>
                            <p className="text-sm font-medium">{item.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.entity_type} • {item.created_at ? format(new Date(item.created_at), "MMM d, yyyy") : "N/A"}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={
                            item.status === "validated" ? "success" :
                            item.status === "pending" ? "warning" :
                            item.status === "rejected" ? "destructive" : "secondary"
                          }
                          className="text-[10px]"
                        >
                          {item.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Incidents Tab */}
          <TabsContent value="incidents" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  {incidents.length} incident{incidents.length !== 1 ? 's' : ''} recorded
                </p>
                {(openIncidents?.length || 0) > 0 && (
                  <Badge variant="warning" className="text-[10px]">
                    {openIncidents?.length} open
                  </Badge>
                )}
                {(criticalIncidents?.length || 0) > 0 && (
                  <Badge variant="destructive" className="text-[10px]">
                    {criticalIncidents?.length} critical
                  </Badge>
                )}
              </div>
              <Dialog open={isAddIncidentDialogOpen} onOpenChange={setIsAddIncidentDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="premium" size="sm">
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Report Incident
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Report Governance Incident</DialogTitle>
                    <DialogDescription>
                      Report an AI governance incident for tracking and resolution.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Incident Title</Label>
                      <Input placeholder="Brief description of the incident" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Incident Type</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(INCIDENT_TYPE_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Severity</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select severity" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="critical">Critical</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea placeholder="Detailed description of the incident..." />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddIncidentDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button variant="premium">Report Incident</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {isLoadingIncidents ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : incidents.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="py-8">
                  <EmptyState
                    message="No governance incidents reported. That's a good sign!"
                    icon={CheckCircle}
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {incidents.slice(0, 5).map((incident) => {
                  const severityConfig = {
                    critical: { color: "text-destructive", bg: "bg-destructive/10", variant: "destructive" },
                    high: { color: "text-warning", bg: "bg-warning/10", variant: "warning" },
                    medium: { color: "text-info", bg: "bg-info/10", variant: "info" },
                    low: { color: "text-success", bg: "bg-success/10", variant: "success" },
                  }[incident.severity] || { color: "text-muted-foreground", bg: "bg-muted", variant: "secondary" };

                  return (
                    <Card key={incident.id} className={`glass-card ${incident.severity === 'critical' ? 'border-destructive/50' : ''}`}>
                      <CardContent className="py-3 px-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${severityConfig.bg}`}>
                              <AlertTriangle className={`h-4 w-4 ${severityConfig.color}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{incident.title}</span>
                                <Badge variant={severityConfig.variant as any} className="text-[10px]">
                                  {incident.severity}
                                </Badge>
                                <Badge variant="outline" className="text-[10px]">
                                  {INCIDENT_TYPE_LABELS[incident.incident_type] || incident.incident_type}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Reported {incident.created_at ? formatDistanceToNow(new Date(incident.created_at), { addSuffix: true }) : "N/A"}
                                {incident.assigned_to && ` • Assigned to ${incident.assigned_to}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge
                              variant={
                                incident.status === "closed" ? "success" :
                                incident.status === "resolved" ? "info" :
                                incident.status === "mitigating" ? "warning" : "secondary"
                              }
                              className="text-[10px]"
                            >
                              {incident.status}
                            </Badge>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AIGovernance;

// ============================================================================
// TODO: Future Enhancements
// ============================================================================
// TODO: Add AI system lifecycle visualization (draft -> review -> approved -> deployed -> retired)
// TODO: Implement model card comparison feature
// TODO: Add risk assessment workflow automation
// TODO: Create compliance dashboard PDF export
// TODO: Add EU AI Act article deep-linking to official documentation
// TODO: Implement conformity assessment checklist
// TODO: Add CE marking workflow for high-risk systems
// TODO: Create incident correlation analysis
// TODO: Add automatic risk classification suggestions using ML
// TODO: Implement bias detection dashboard integration
// TODO: Add explainability report generation
// TODO: Create audit trail visualization
// TODO: Add human oversight metrics dashboard
// TODO: Implement data governance tracking
// TODO: Add post-market monitoring integration
