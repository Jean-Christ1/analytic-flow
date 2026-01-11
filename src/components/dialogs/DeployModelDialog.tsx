import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Rocket, 
  Server, 
  Shield, 
  Globe, 
  Clock, 
  ShieldAlert, 
  Check,
  Settings,
  Eye,
  Box,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { models, projects } from "@/data/platformData";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { cn } from "@/lib/utils";
import { WizardLayout, WizardStep } from "@/components/ui/wizard-layout";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DeployModelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const environments = [
  { value: "staging", label: "Staging", color: "warning", desc: "Pre-production testing" },
  { value: "production", label: "Production", color: "success", desc: "Live environment" },
  { value: "canary", label: "Canary (10%)", color: "info", desc: "Gradual rollout" },
];

const regions = [
  { value: "us-east-1", label: "US East (Virginia)" },
  { value: "us-west-2", label: "US West (Oregon)" },
  { value: "eu-west-1", label: "EU West (Ireland)" },
  { value: "eu-central-1", label: "EU Central (Frankfurt)" },
  { value: "ap-northeast-1", label: "Asia Pacific (Tokyo)" },
];

const steps: WizardStep[] = [
  { id: 1, name: "Model Selection", icon: Box },
  { id: 2, name: "Configuration", icon: Settings },
  { id: 3, name: "Security", icon: Shield },
  { id: 4, name: "Summary", icon: Eye },
];

export const DeployModelDialog = ({ open, onOpenChange }: DeployModelDialogProps) => {
  const navigate = useNavigate();
  const { canDeploy } = useCurrentUser();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    modelId: "",
    endpointName: "",
    environment: "staging",
    region: "us-east-1",
    replicas: 2,
    enableAutoScaling: true,
    enableAuth: true,
    enableMonitoring: true,
  });

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setValidationErrors([]);
  };

  const selectedModel = models.find((m) => m.id === formData.modelId);

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!formData.modelId;
      case 2:
        return !!formData.endpointName.trim();
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      if (currentStep === 1 && !formData.modelId) {
        toast.error("Please select a model");
      } else if (currentStep === 2 && !formData.endpointName.trim()) {
        toast.error("Endpoint name is required");
      }
      return;
    }
    if (currentStep < steps.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!canDeploy) {
      toast.error("Admin access required for deployment");
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    toast.success(`Model deployed to ${formData.environment}!`, {
      description: `Endpoint: ${formData.endpointName}.api.fed.io`,
    });
    onOpenChange(false);
    resetForm();
    setIsSubmitting(false);
    navigate("/deployments");
  };

  const resetForm = () => {
    setFormData({
      modelId: "",
      endpointName: "",
      environment: "staging",
      region: "us-east-1",
      replicas: 2,
      enableAutoScaling: true,
      enableAuth: true,
      enableMonitoring: true,
    });
    setCurrentStep(1);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-5">
            {!canDeploy && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-destructive text-sm">Admin Access Required</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Deployments are managed via CI/CD pipelines. Contact your administrator.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Select Model <span className="text-destructive">*</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">Choose the model version you want to deploy as an API endpoint</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Select 
                value={formData.modelId} 
                onValueChange={(v) => updateFormData("modelId", v)} 
                disabled={!canDeploy}
              >
                <SelectTrigger className={cn(!canDeploy && "opacity-50", !formData.modelId && validationErrors.length > 0 && "border-destructive")}>
                  <SelectValue placeholder="Choose a model to deploy" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((m) => {
                    const project = projects.find((p) => p.id === m.projectId);
                    return (
                      <SelectItem key={m.id} value={m.id}>
                        <div className="flex items-center gap-2">
                          <span>{m.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {m.versions?.[0] || "v1.0"}
                          </Badge>
                          <span className="text-muted-foreground text-xs">
                            ({project?.name})
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {selectedModel && (
              <div className="p-3 rounded-lg border border-primary/30 bg-primary/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-gold">
                    <Box className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{selectedModel.name}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">{selectedModel.framework}</Badge>
                      <Badge variant="outline" className="text-xs">{selectedModel.algorithm}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Endpoint Name <span className="text-destructive">*</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-xs">This will be the URL of your API endpoint</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  placeholder="e.g., fraud-detection-api"
                  value={formData.endpointName}
                  onChange={(e) => updateFormData("endpointName", e.target.value)}
                />
                {formData.endpointName && (
                  <p className="text-xs text-muted-foreground">
                    URL: https://{formData.endpointName}.api.fed.io/predict
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Region</Label>
                <Select value={formData.region} onValueChange={(v) => updateFormData("region", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        <div className="flex items-center gap-2">
                          <Globe className="h-3 w-3" />
                          {r.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Deployment Environment</Label>
              <div className="grid grid-cols-3 gap-3">
                {environments.map((env) => (
                  <div
                    key={env.value}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all",
                      formData.environment === env.value
                        ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => updateFormData("environment", env.value)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{env.label}</span>
                      {formData.environment === env.value && <Check className="h-4 w-4 text-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{env.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border/50">
              <h4 className="font-medium flex items-center gap-2 text-sm">
                <Server className="h-4 w-4 text-primary" />
                Scaling Configuration
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Initial Replicas</Label>
                  <Badge variant="outline">{formData.replicas}</Badge>
                </div>
                <Slider
                  value={[formData.replicas]}
                  onValueChange={(v) => updateFormData("replicas", v[0])}
                  max={10}
                  min={1}
                  step={1}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Auto-Scaling</p>
                  <p className="text-xs text-muted-foreground">Scale based on traffic load</p>
                </div>
                <Switch 
                  checked={formData.enableAutoScaling} 
                  onCheckedChange={(v) => updateFormData("enableAutoScaling", v)} 
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-5">
            <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border/50">
              <h4 className="font-medium flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-success" />
                Security & Monitoring
              </h4>
              
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-sm">API Authentication</p>
                  <p className="text-xs text-muted-foreground">Require API key for access</p>
                </div>
                <Switch 
                  checked={formData.enableAuth} 
                  onCheckedChange={(v) => updateFormData("enableAuth", v)} 
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-sm">Model Monitoring</p>
                  <p className="text-xs text-muted-foreground">Track drift and performance</p>
                </div>
                <Switch 
                  checked={formData.enableMonitoring} 
                  onCheckedChange={(v) => updateFormData("enableMonitoring", v)} 
                />
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-info/10 border border-info/20">
              <Clock className="h-4 w-4 text-info" />
              <p className="text-sm text-info">
                Estimated deployment time: ~3-5 minutes
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-border bg-muted/20">
              <h4 className="font-medium text-sm mb-3">Deployment Summary</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Model</p>
                  <p className="font-medium">{selectedModel?.name || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Endpoint</p>
                  <p className="font-medium">{formData.endpointName || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Environment</p>
                  <Badge variant={environments.find(e => e.value === formData.environment)?.color as any} className="text-xs">
                    {environments.find(e => e.value === formData.environment)?.label}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Region</p>
                  <p className="font-medium">{regions.find(r => r.value === formData.region)?.label}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Replicas</p>
                  <p className="font-medium">{formData.replicas} {formData.enableAutoScaling && "(Auto-scaling)"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Security</p>
                  <div className="flex gap-1 mt-0.5">
                    {formData.enableAuth && <Badge variant="success" className="text-xs">Auth</Badge>}
                    {formData.enableMonitoring && <Badge variant="info" className="text-xs">Monitoring</Badge>}
                  </div>
                </div>
              </div>
            </div>

            {formData.environment === "production" && (
              <div className="p-3 rounded-lg bg-warning/10 border border-warning/30 flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <p className="text-xs text-warning">
                  You are about to deploy to PRODUCTION. This will affect live traffic.
                </p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <WizardLayout
      open={open}
      onOpenChange={onOpenChange}
      title="Deploy Model"
      description="REST API Endpoint"
      icon={Rocket}
      iconClassName="bg-warning/20 text-warning"
      steps={steps}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      canProceed={validateStep}
      onNext={handleNext}
      onPrev={handlePrev}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel="Deploy"
    >
      {renderStepContent()}
    </WizardLayout>
  );
};
