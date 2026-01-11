import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  GitBranch,
  ArrowUp,
  ArrowDown,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Rocket,
  FlaskConical,
  Code,
  MoreHorizontal,
  History,
  Shield,
  BarChart3,
  User,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface ModelVersion {
  id: string;
  version: string;
  stage: "Production" | "Staging" | "Development" | "Archived";
  accuracy: number;
  latency: string;
  createdAt: string;
  author: string;
  commit: string;
  status: "active" | "pending" | "deprecated";
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  };
  validations: {
    dataQuality: boolean;
    biasCheck: boolean;
    performanceTest: boolean;
    securityScan: boolean;
  };
}

// Mock data for model versions
const mockVersions: ModelVersion[] = [
  {
    id: "v1",
    version: "2.1.0",
    stage: "Production",
    accuracy: 94.5,
    latency: "12ms",
    createdAt: "2024-01-15",
    author: "Sarah Chen",
    commit: "a1b2c3d",
    status: "active",
    metrics: { accuracy: 94.5, precision: 93.2, recall: 95.1, f1Score: 94.1 },
    validations: { dataQuality: true, biasCheck: true, performanceTest: true, securityScan: true },
  },
  {
    id: "v2",
    version: "2.2.0-rc1",
    stage: "Staging",
    accuracy: 95.2,
    latency: "11ms",
    createdAt: "2024-01-18",
    author: "Alex Kim",
    commit: "e4f5g6h",
    status: "pending",
    metrics: { accuracy: 95.2, precision: 94.5, recall: 95.8, f1Score: 95.1 },
    validations: { dataQuality: true, biasCheck: true, performanceTest: true, securityScan: false },
  },
  {
    id: "v3",
    version: "2.2.0-dev",
    stage: "Development",
    accuracy: 93.8,
    latency: "15ms",
    createdAt: "2024-01-20",
    author: "Maria Garcia",
    commit: "i7j8k9l",
    status: "active",
    metrics: { accuracy: 93.8, precision: 92.1, recall: 94.5, f1Score: 93.3 },
    validations: { dataQuality: true, biasCheck: false, performanceTest: false, securityScan: false },
  },
  {
    id: "v4",
    version: "2.0.3",
    stage: "Archived",
    accuracy: 91.2,
    latency: "18ms",
    createdAt: "2024-01-05",
    author: "John Smith",
    commit: "m0n1o2p",
    status: "deprecated",
    metrics: { accuracy: 91.2, precision: 90.5, recall: 91.8, f1Score: 91.1 },
    validations: { dataQuality: true, biasCheck: true, performanceTest: true, securityScan: true },
  },
];

const stageConfig = {
  Production: { icon: Rocket, color: "success", order: 0 },
  Staging: { icon: FlaskConical, color: "warning", order: 1 },
  Development: { icon: Code, color: "info", order: 2 },
  Archived: { icon: History, color: "secondary", order: 3 },
};

export const ModelVersionRegistry = () => {
  const { isAdmin, canDeploy } = useCurrentUser();
  const [versions, setVersions] = useState<ModelVersion[]>(mockVersions);
  const [promotionDialog, setPromotionDialog] = useState<{
    open: boolean;
    version: ModelVersion | null;
    targetStage: string;
  }>({ open: false, version: null, targetStage: "" });
  const [promotionReason, setPromotionReason] = useState("");

  const getStageVersions = (stage: ModelVersion["stage"]) => {
    return versions.filter((v) => v.stage === stage);
  };

  const handlePromote = (version: ModelVersion, targetStage: string) => {
    setPromotionDialog({ open: true, version, targetStage });
  };

  const confirmPromotion = () => {
    if (!promotionDialog.version) return;

    setVersions((prev) =>
      prev.map((v) =>
        v.id === promotionDialog.version!.id
          ? { ...v, stage: promotionDialog.targetStage as ModelVersion["stage"] }
          : v
      )
    );

    toast.success(
      `Model ${promotionDialog.version.version} promoted to ${promotionDialog.targetStage}`,
      {
        description: "CI/CD pipeline triggered for deployment",
      }
    );

    setPromotionDialog({ open: false, version: null, targetStage: "" });
    setPromotionReason("");
  };

  const handleDemote = (version: ModelVersion, targetStage: string) => {
    setVersions((prev) =>
      prev.map((v) =>
        v.id === version.id ? { ...v, stage: targetStage as ModelVersion["stage"] } : v
      )
    );

    toast.info(`Model ${version.version} demoted to ${targetStage}`);
  };

  const renderVersionCard = (version: ModelVersion) => {
    const StageIcon = stageConfig[version.stage].icon;
    const allValidationsPassed = Object.values(version.validations).every(Boolean);

    return (
      <Card
        key={version.id}
        className="glass-card hover:border-primary/30 transition-all duration-300"
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg bg-${stageConfig[version.stage].color}/10`}
              >
                <StageIcon
                  className={`h-4 w-4 text-${stageConfig[version.stage].color}`}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">
                    v{version.version}
                  </span>
                  <Badge
                    variant={stageConfig[version.stage].color as any}
                    className="text-xs"
                  >
                    {version.stage}
                  </Badge>
                  {version.status === "pending" && (
                    <Badge variant="outline" className="text-xs animate-pulse">
                      Pending Review
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <GitBranch className="h-3 w-3" />
                  <span>{version.commit}</span>
                  <span>•</span>
                  <User className="h-3 w-3" />
                  <span>{version.author}</span>
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>View Details</DropdownMenuItem>
                <DropdownMenuItem>Compare Versions</DropdownMenuItem>
                <DropdownMenuItem>View Logs</DropdownMenuItem>
                <DropdownMenuSeparator />
                {canDeploy && version.stage !== "Production" && (
                  <DropdownMenuItem
                    onClick={() => handlePromote(version, "Production")}
                    disabled={!allValidationsPassed}
                  >
                    Promote to Production
                  </DropdownMenuItem>
                )}
                {canDeploy && version.stage === "Production" && (
                  <DropdownMenuItem
                    onClick={() => handleDemote(version, "Staging")}
                    className="text-warning"
                  >
                    Rollback to Staging
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  Archive Version
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            <div className="text-center p-2 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground">Accuracy</p>
              <p className="text-sm font-semibold text-success">
                {version.metrics.accuracy}%
              </p>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground">Precision</p>
              <p className="text-sm font-semibold">{version.metrics.precision}%</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground">Recall</p>
              <p className="text-sm font-semibold">{version.metrics.recall}%</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground">Latency</p>
              <p className="text-sm font-semibold">{version.latency}</p>
            </div>
          </div>

          {/* Validations */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-muted-foreground">Validations:</span>
            <div className="flex items-center gap-1">
              {Object.entries(version.validations).map(([key, passed]) => (
                <div
                  key={key}
                  className={`p-1 rounded ${
                    passed ? "bg-success/10" : "bg-destructive/10"
                  }`}
                  title={key.replace(/([A-Z])/g, " $1").trim()}
                >
                  {passed ? (
                    <CheckCircle2 className="h-3 w-3 text-success" />
                  ) : (
                    <AlertTriangle className="h-3 w-3 text-destructive" />
                  )}
                </div>
              ))}
            </div>
            {allValidationsPassed ? (
              <Badge variant="success" className="text-xs ml-auto">
                Ready
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-xs ml-auto">
                Pending Checks
              </Badge>
            )}
          </div>

          {/* Promotion Buttons */}
          {canDeploy && (
            <div className="flex items-center gap-2 pt-3 border-t border-border/50">
              {version.stage === "Development" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handlePromote(version, "Staging")}
                >
                  <ArrowUp className="h-3 w-3 mr-1" />
                  Promote to Staging
                </Button>
              )}
              {version.stage === "Staging" && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleDemote(version, "Development")}
                  >
                    <ArrowDown className="h-3 w-3 mr-1" />
                    Demote
                  </Button>
                  <Button
                    size="sm"
                    variant="premium"
                    className="flex-1"
                    onClick={() => handlePromote(version, "Production")}
                    disabled={!allValidationsPassed}
                  >
                    <Rocket className="h-3 w-3 mr-1" />
                    Deploy to Prod
                  </Button>
                </>
              )}
              {version.stage === "Production" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-warning border-warning/50 hover:bg-warning/10"
                  onClick={() => handleDemote(version, "Staging")}
                >
                  <ArrowDown className="h-3 w-3 mr-1" />
                  Rollback
                </Button>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {version.createdAt}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stage Lanes */}
      <div className="grid grid-cols-4 gap-4">
        {(["Production", "Staging", "Development", "Archived"] as const).map(
          (stage) => {
            const StageIcon = stageConfig[stage].icon;
            const stageVersions = getStageVersions(stage);

            return (
              <div key={stage} className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                  <div
                    className={`p-1.5 rounded bg-${stageConfig[stage].color}/10`}
                  >
                    <StageIcon
                      className={`h-4 w-4 text-${stageConfig[stage].color}`}
                    />
                  </div>
                  <h3 className="font-semibold text-sm">{stage}</h3>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {stageVersions.length}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {stageVersions.map(renderVersionCard)}
                  {stageVersions.length === 0 && (
                    <div className="p-4 text-center text-sm text-muted-foreground border border-dashed border-border/50 rounded-lg">
                      No versions in {stage}
                    </div>
                  )}
                </div>
              </div>
            );
          }
        )}
      </div>

      {/* Promotion Dialog */}
      <Dialog
        open={promotionDialog.open}
        onOpenChange={(open) =>
          setPromotionDialog({ ...promotionDialog, open })
        }
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              Promote Model Version
            </DialogTitle>
            <DialogDescription>
              Promoting{" "}
              <span className="font-semibold">
                v{promotionDialog.version?.version}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-primary">
                {promotionDialog.targetStage}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {promotionDialog.version && (
              <>
                <div className="p-3 rounded-lg bg-muted/30 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Current Stage</span>
                    <Badge
                      variant={
                        stageConfig[promotionDialog.version.stage].color as any
                      }
                    >
                      {promotionDialog.version.stage}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Target Stage</span>
                    <Badge variant="success">{promotionDialog.targetStage}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Accuracy</span>
                    <span className="font-semibold text-success">
                      {promotionDialog.version.metrics.accuracy}%
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Promotion Reason (optional)
                  </label>
                  <Textarea
                    placeholder="Describe why this version is being promoted..."
                    value={promotionReason}
                    onChange={(e) => setPromotionReason(e.target.value)}
                    rows={3}
                  />
                </div>

                {promotionDialog.targetStage === "Production" && (
                  <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
                    <div className="flex items-center gap-2 text-warning mb-2">
                      <Shield className="h-4 w-4" />
                      <span className="font-medium text-sm">
                        Production Deployment
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This will trigger the CI/CD pipeline and deploy the model
                      to production endpoints. Ensure all validations have
                      passed.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setPromotionDialog({ open: false, version: null, targetStage: "" })
              }
            >
              Cancel
            </Button>
            <Button variant="premium" onClick={confirmPromotion}>
              <Rocket className="h-4 w-4 mr-2" />
              Confirm Promotion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
