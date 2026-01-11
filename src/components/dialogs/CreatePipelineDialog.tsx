import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  GitBranch, 
  Clock, 
  Zap, 
  AlertTriangle,
  Box,
  Settings,
  Eye,
  Database,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { projects, datasets } from "@/data/platformData";
import { WizardLayout, WizardStep } from "@/components/ui/wizard-layout";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CreatePipelineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const pipelineTypes = [
  { value: "training", label: "Training Pipeline", desc: "End-to-end model training" },
  { value: "inference", label: "Inference Pipeline", desc: "Batch predictions" },
  { value: "etl", label: "ETL Pipeline", desc: "Data processing" },
  { value: "feature", label: "Feature Pipeline", desc: "Feature engineering" },
];

const scheduleOptions = [
  { value: "manual", label: "Manual trigger only" },
  { value: "hourly", label: "Every hour" },
  { value: "daily", label: "Daily at midnight" },
  { value: "weekly", label: "Weekly on Monday" },
  { value: "cron", label: "Custom cron expression" },
];

const orchestrators = [
  { value: "argo", label: "Argo Workflows" },
  { value: "airflow", label: "Apache Airflow" },
  { value: "kubeflow", label: "Kubeflow Pipelines" },
  { value: "prefect", label: "Prefect" },
];

const steps: WizardStep[] = [
  { id: 1, name: "Identification", icon: Box },
  { id: 2, name: "Configuration", icon: Settings },
  { id: 3, name: "Schedule", icon: Clock },
  { id: 4, name: "Summary", icon: Eye },
];

export const CreatePipelineDialog = ({ open, onOpenChange }: CreatePipelineDialogProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    pipelineName: "",
    description: "",
    projectId: "",
    pipelineType: "",
    orchestrator: "argo",
    schedule: "manual",
    cronExpression: "",
    inputDatasets: [] as string[],
    enableRetry: true,
    enableNotifications: true,
  });

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDatasetToggle = (datasetId: string) => {
    const newDatasets = formData.inputDatasets.includes(datasetId)
      ? formData.inputDatasets.filter((d) => d !== datasetId)
      : [...formData.inputDatasets, datasetId];
    updateFormData("inputDatasets", newDatasets);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!formData.pipelineName.trim() && !!formData.projectId;
      case 2:
        return !!formData.pipelineType;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      if (currentStep === 1) toast.error("Pipeline name and project are required");
      else if (currentStep === 2) toast.error("Please select a pipeline type");
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
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    toast.success(`Pipeline "${formData.pipelineName}" created successfully!`, {
      description: "You can now configure the workflow steps.",
    });
    onOpenChange(false);
    resetForm();
    setIsSubmitting(false);
  };

  const resetForm = () => {
    setFormData({
      pipelineName: "",
      description: "",
      projectId: "",
      pipelineType: "",
      orchestrator: "argo",
      schedule: "manual",
      cronExpression: "",
      inputDatasets: [],
      enableRetry: true,
      enableNotifications: true,
    });
    setCurrentStep(1);
  };

  const projectDatasets = datasets.filter((d) => d.projectId === formData.projectId);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Pipeline Name <span className="text-destructive">*</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-xs">Give your pipeline a descriptive name for easy identification</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  placeholder="e.g., daily-training-pipeline"
                  value={formData.pipelineName}
                  onChange={(e) => updateFormData("pipelineName", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Project <span className="text-destructive">*</span>
                </Label>
                <Select value={formData.projectId} onValueChange={(v) => updateFormData("projectId", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe the pipeline purpose and workflow..."
                value={formData.description}
                onChange={(e) => updateFormData("description", e.target.value)}
                rows={3}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Pipeline Type <span className="text-destructive">*</span>
                </Label>
                <Select value={formData.pipelineType} onValueChange={(v) => updateFormData("pipelineType", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {pipelineTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex flex-col">
                          <span>{type.label}</span>
                          <span className="text-xs text-muted-foreground">{type.desc}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Orchestrator</Label>
                <Select value={formData.orchestrator} onValueChange={(v) => updateFormData("orchestrator", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {orchestrators.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.projectId && projectDatasets.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Input Datasets
                </Label>
                <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-muted/30 border border-border/50">
                  {projectDatasets.map((dataset) => (
                    <Badge
                      key={dataset.id}
                      variant={formData.inputDatasets.includes(dataset.id) ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/20 transition-colors"
                      onClick={() => handleDatasetToggle(dataset.id)}
                    >
                      {dataset.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border/50">
              <h4 className="font-medium flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-warning" />
                Advanced Options
              </h4>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Automatic Retry</p>
                  <p className="text-xs text-muted-foreground">Retry failed steps up to 3 times</p>
                </div>
                <Switch checked={formData.enableRetry} onCheckedChange={(v) => updateFormData("enableRetry", v)} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Failure Notifications</p>
                  <p className="text-xs text-muted-foreground">Send alerts on pipeline failure</p>
                </div>
                <Switch checked={formData.enableNotifications} onCheckedChange={(v) => updateFormData("enableNotifications", v)} />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-5">
            <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border/50">
              <h4 className="font-medium flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-primary" />
                Schedule Configuration
              </h4>
              
              <div className="space-y-2">
                <Label>Run Schedule</Label>
                <Select value={formData.schedule} onValueChange={(v) => updateFormData("schedule", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {scheduleOptions.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.schedule === "cron" && (
                <div className="space-y-2">
                  <Label>Cron Expression</Label>
                  <Input
                    placeholder="0 0 * * *"
                    value={formData.cronExpression}
                    onChange={(e) => updateFormData("cronExpression", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Example: "0 0 * * *" runs daily at midnight
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <p className="text-sm text-warning">
                You can configure pipeline steps after creation.
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-border bg-muted/20">
              <h4 className="font-medium text-sm mb-3">Pipeline Summary</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Pipeline Name</p>
                  <p className="font-medium">{formData.pipelineName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Project</p>
                  <p className="font-medium">{projects.find(p => p.id === formData.projectId)?.name || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Type</p>
                  <Badge variant="secondary" className="text-xs">
                    {pipelineTypes.find(t => t.value === formData.pipelineType)?.label || "—"}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Orchestrator</p>
                  <p className="font-medium">{orchestrators.find(o => o.value === formData.orchestrator)?.label}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Schedule</p>
                  <p className="font-medium">{scheduleOptions.find(s => s.value === formData.schedule)?.label}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Options</p>
                  <div className="flex gap-1 mt-0.5">
                    {formData.enableRetry && <Badge variant="success" className="text-xs">Retry</Badge>}
                    {formData.enableNotifications && <Badge variant="info" className="text-xs">Alerts</Badge>}
                  </div>
                </div>
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
      title="Create Pipeline"
      description="Automated ML Workflow"
      icon={GitBranch}
      iconClassName="bg-primary/20 text-primary"
      steps={steps}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      canProceed={validateStep}
      onNext={handleNext}
      onPrev={handlePrev}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel="Create"
    >
      {renderStepContent()}
    </WizardLayout>
  );
};
