import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { WizardLayout, WizardStep } from "@/components/ui/wizard-layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Play, 
  Cpu, 
  Zap, 
  Database,
  Box,
  Layers,
  Eye,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { projects } from "@/data/platformData";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/contexts/CurrencyContext";

interface RunExperimentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const applicationDomains = [
  "Computer Vision",
  "Natural Language Processing (NLP)",
  "Speech / Audio",
  "Time Series / Sequential Data",
  "Recommender Systems",
  "Anomaly Detection",
  "Multimodal AI",
];

const learningMethods = ["Supervised", "Unsupervised", "Semi-supervised", "Reinforcement Learning"];
const problemTypes = ["Classification", "Regression", "Clustering", "Forecasting", "Anomaly Detection"];

const gpuOptions = [
  { value: "none", label: "No GPU (CPU only)", cost: 0.5 },
  { value: "t4", label: "NVIDIA T4 (1x)", cost: 2.5 },
  { value: "a100-1", label: "NVIDIA A100 (1x)", cost: 8.0 },
  { value: "a100-4", label: "NVIDIA A100 (4x)", cost: 32.0 },
];

const steps: WizardStep[] = [
  { id: 1, name: "Identification", icon: Box },
  { id: 2, name: "ML Context", icon: Layers },
  { id: 3, name: "Resources", icon: Cpu },
  { id: 4, name: "Summary", icon: Eye },
];

export const RunExperimentDialog = ({ open, onOpenChange }: RunExperimentDialogProps) => {
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    experimentName: "",
    projectId: "",
    applicationDomain: "",
    learningMethod: "",
    problemType: "",
    gpu: "t4",
    enableAutoTuning: true,
    enableLogging: true,
  });

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const canProceed = (step: number): boolean => {
    if (step === 1) return !!formData.experimentName.trim() && !!formData.projectId;
    return true;
  };

  const handleNext = () => {
    if (!canProceed(currentStep)) {
      toast.error("Please fill required fields");
      return;
    }
    if (currentStep < steps.length) setCurrentStep(prev => prev + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!canProceed(1)) {
      toast.error("Please fill required fields");
      return;
    }
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    toast.success(`Experiment "${formData.experimentName}" started!`, {
      description: "Track progress in the Experiments tab.",
    });
    onOpenChange(false);
    resetForm();
    setIsSubmitting(false);
    navigate("/experiments");
  };

  const resetForm = () => {
    setFormData({
      experimentName: "",
      projectId: "",
      applicationDomain: "",
      learningMethod: "",
      problemType: "",
      gpu: "t4",
      enableAutoTuning: true,
      enableLogging: true,
    });
    setCurrentStep(1);
  };

  const selectedGpu = gpuOptions.find((g) => g.value === formData.gpu);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Experiment Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="e.g., baseline-v1"
                  value={formData.experimentName}
                  onChange={(e) => updateFormData("experimentName", e.target.value)}
                  className={cn(!formData.experimentName.trim() && "border-destructive/50")}
                />
                <p className="text-xs text-muted-foreground">Descriptive name for your experiment</p>
              </div>

              <div className="space-y-2">
                <Label>
                  Project <span className="text-destructive">*</span>
                </Label>
                <Select value={formData.projectId} onValueChange={(v) => updateFormData("projectId", v)}>
                  <SelectTrigger className={cn(!formData.projectId && "border-destructive/50")}>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Link to a project</p>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-2">Optional ML context for tracking and categorization</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Application Domain
                  <Tooltip><TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                    <TooltipContent>The domain your model will be applied to</TooltipContent>
                  </Tooltip>
                </Label>
                <Select value={formData.applicationDomain} onValueChange={(v) => updateFormData("applicationDomain", v)}>
                  <SelectTrigger><SelectValue placeholder="Select domain" /></SelectTrigger>
                  <SelectContent>
                    {applicationDomains.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Learning Method</Label>
                <Select value={formData.learningMethod} onValueChange={(v) => updateFormData("learningMethod", v)}>
                  <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                  <SelectContent>
                    {learningMethods.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Problem Type</Label>
              <Select value={formData.problemType} onValueChange={(v) => updateFormData("problemType", v)}>
                <SelectTrigger><SelectValue placeholder="Select problem type" /></SelectTrigger>
                <SelectContent>
                  {problemTypes.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary" />
                GPU Configuration
                <Tooltip><TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent>Select compute resources for training</TooltipContent>
                </Tooltip>
              </Label>
              <Select value={formData.gpu} onValueChange={(v) => updateFormData("gpu", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {gpuOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center justify-between w-full gap-4">
                        <span>{opt.label}</span>
                        <Badge variant="secondary" className="text-xs">{formatCurrency(opt.cost)}/h</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border/50">
              <h4 className="font-medium flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-warning" />Advanced Options
              </h4>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Hyperparameter Auto-Tuning</p>
                  <p className="text-xs text-muted-foreground">Automatic optimization</p>
                </div>
                <Switch checked={formData.enableAutoTuning} onCheckedChange={(v) => updateFormData("enableAutoTuning", v)} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Experiment Logging</p>
                  <p className="text-xs text-muted-foreground">Track metrics and artifacts</p>
                </div>
                <Switch checked={formData.enableLogging} onCheckedChange={(v) => updateFormData("enableLogging", v)} />
              </div>
            </div>

            {formData.gpu !== "none" && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-info/10 border border-info/20">
                <Database className="h-4 w-4 text-info" />
                <p className="text-sm text-info">
                  Estimated cost: ~{formatCurrency(selectedGpu?.cost || 0)}/hour
                </p>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-border bg-muted/20">
              <h4 className="font-medium text-sm mb-3">Experiment Summary</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Experiment Name</p>
                  <p className="font-medium">{formData.experimentName || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Project</p>
                  <p className="font-medium">{projects.find(p => p.id === formData.projectId)?.name || "—"}</p>
                </div>
                {formData.applicationDomain && (
                  <div>
                    <p className="text-muted-foreground text-xs">Domain</p>
                    <p className="font-medium">{formData.applicationDomain}</p>
                  </div>
                )}
                {formData.problemType && (
                  <div>
                    <p className="text-muted-foreground text-xs">Problem Type</p>
                    <Badge variant="secondary" className="text-xs">{formData.problemType}</Badge>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground text-xs">GPU</p>
                  <p className="font-medium">{selectedGpu?.label}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Options</p>
                  <div className="flex gap-1 mt-0.5">
                    {formData.enableAutoTuning && <Badge variant="success" className="text-xs">Auto-Tuning</Badge>}
                    {formData.enableLogging && <Badge variant="info" className="text-xs">Logging</Badge>}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div>
                <p className="font-medium">Estimated Cost</p>
                <p className="text-sm text-muted-foreground">Based on GPU selection</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">{formatCurrency(selectedGpu?.cost || 0)}</p>
                <p className="text-xs text-muted-foreground">per hour</p>
              </div>
            </div>
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
      title="Run Experiment"
      description="Training Configuration"
      icon={Play}
      iconClassName="bg-success/20 text-success"
      steps={steps}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      canProceed={canProceed}
      onNext={handleNext}
      onPrev={handlePrev}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel="Run Experiment"
    >
      {renderStepContent()}
    </WizardLayout>
  );
};
