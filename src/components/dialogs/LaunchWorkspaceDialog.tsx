import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Code2, 
  Cpu, 
  HardDrive, 
  Zap, 
  Clock,
  Check,
  Settings,
  Eye,
  Layers,
  Box,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { projects } from "@/data/platformData";
import { cn } from "@/lib/utils";
import { WizardLayout, WizardStep } from "@/components/ui/wizard-layout";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface LaunchWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ideOptions = [
  { id: "vscode", name: "VS Code Server", description: "Full IDE for development", icon: "💻" },
  { id: "jupyter", name: "JupyterLab", description: "Interactive notebooks", icon: "🪐" },
  { id: "rstudio", name: "RStudio", description: "R analytics environment", icon: "📊" },
];

const gpuOptions = [
  { value: "none", label: "No GPU (CPU only)", cost: 0.5 },
  { value: "t4", label: "NVIDIA T4 (16GB)", cost: 2.5 },
  { value: "a10", label: "NVIDIA A10 (24GB)", cost: 4.0 },
  { value: "a100", label: "NVIDIA A100 (40GB)", cost: 8.0 },
  { value: "a100-80", label: "NVIDIA A100 (80GB)", cost: 12.0 },
];

const presetConfigs = [
  { name: "Light", cpu: 4, memory: 8, storage: 50, desc: "Basic development" },
  { name: "Standard", cpu: 8, memory: 32, storage: 100, desc: "ML experimentation" },
  { name: "Heavy", cpu: 16, memory: 64, storage: 250, desc: "Large model training" },
];

const steps: WizardStep[] = [
  { id: 1, name: "Identification", icon: Box },
  { id: 2, name: "Environment", icon: Code2 },
  { id: 3, name: "Resources", icon: Cpu },
  { id: 4, name: "Summary", icon: Eye },
];

export const LaunchWorkspaceDialog = ({ open, onOpenChange }: LaunchWorkspaceDialogProps) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLaunching, setIsLaunching] = useState(false);

  const [formData, setFormData] = useState({
    workspaceName: "",
    projectId: "",
    ideType: "vscode",
    preset: "Standard",
    cpu: 8,
    memory: 32,
    storage: 100,
    gpu: "none",
    autoShutdown: true,
  });

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePresetChange = (presetName: string) => {
    const config = presetConfigs.find((p) => p.name === presetName);
    if (config) {
      setFormData(prev => ({
        ...prev,
        preset: presetName,
        cpu: config.cpu,
        memory: config.memory,
        storage: config.storage,
      }));
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!formData.workspaceName.trim();
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      toast.error("Workspace name is required");
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
    setIsLaunching(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    toast.success(`Workspace "${formData.workspaceName}" is launching!`, {
      description: "You'll be redirected when it's ready.",
    });
    onOpenChange(false);
    resetForm();
    setIsLaunching(false);
    navigate("/workspaces");
  };

  const resetForm = () => {
    setFormData({
      workspaceName: "",
      projectId: "",
      ideType: "vscode",
      preset: "Standard",
      cpu: 8,
      memory: 32,
      storage: 100,
      gpu: "none",
      autoShutdown: true,
    });
    setCurrentStep(1);
  };

  const selectedGpu = gpuOptions.find((g) => g.value === formData.gpu);
  const estimatedCost = (0.5 + (formData.cpu * 0.02) + (formData.memory * 0.01) + (selectedGpu?.cost || 0)).toFixed(2);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Workspace Name <span className="text-destructive">*</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">Give your workspace a descriptive name for easy identification</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                placeholder="e.g., cv-model-dev"
                value={formData.workspaceName}
                onChange={(e) => updateFormData("workspaceName", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Project (Optional)</Label>
              <Select value={formData.projectId} onValueChange={(v) => updateFormData("projectId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Link to project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Optionally link to an existing project</p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-5">
            <div className="space-y-3">
              <Label className="font-semibold">Development Environment</Label>
              <div className="grid grid-cols-3 gap-3">
                {ideOptions.map((ide) => (
                  <div
                    key={ide.id}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all text-center",
                      formData.ideType === ide.id
                        ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => updateFormData("ideType", ide.id)}
                  >
                    <span className="text-xl block mb-2">{ide.icon}</span>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <span className="font-medium text-sm">{ide.name}</span>
                      {formData.ideType === ide.id && <Check className="h-3.5 w-3.5 text-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{ide.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="font-semibold">Resource Preset</Label>
              <div className="grid grid-cols-3 gap-3">
                {presetConfigs.map((p) => (
                  <div
                    key={p.name}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all",
                      formData.preset === p.name
                        ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => handlePresetChange(p.name)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{p.name}</span>
                      {formData.preset === p.name && <Check className="h-3.5 w-3.5 text-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{p.desc}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {p.cpu} CPU / {p.memory}GB RAM
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-5">
            <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border/50">
              <h4 className="font-medium text-sm">Custom Resources</h4>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-1.5 text-xs">
                      <Cpu className="h-3.5 w-3.5" />
                      CPU Cores
                    </Label>
                    <Badge variant="outline" className="text-xs">{formData.cpu}</Badge>
                  </div>
                  <Slider
                    value={[formData.cpu]}
                    onValueChange={(v) => updateFormData("cpu", v[0])}
                    max={32}
                    min={2}
                    step={2}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-1.5 text-xs">
                      <Layers className="h-3.5 w-3.5" />
                      Memory (GB)
                    </Label>
                    <Badge variant="outline" className="text-xs">{formData.memory}</Badge>
                  </div>
                  <Slider
                    value={[formData.memory]}
                    onValueChange={(v) => updateFormData("memory", v[0])}
                    max={128}
                    min={4}
                    step={4}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-1.5 text-xs">
                      <HardDrive className="h-3.5 w-3.5" />
                      Storage (GB)
                    </Label>
                    <Badge variant="outline" className="text-xs">{formData.storage}</Badge>
                  </div>
                  <Slider
                    value={[formData.storage]}
                    onValueChange={(v) => updateFormData("storage", v[0])}
                    max={500}
                    min={20}
                    step={10}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-warning" />
                GPU Accelerator
              </Label>
              <Select value={formData.gpu} onValueChange={(v) => updateFormData("gpu", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {gpuOptions.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      <div className="flex items-center justify-between w-full gap-4">
                        <span>{g.label}</span>
                        <Badge variant="secondary" className="text-xs">${g.cost.toFixed(2)}/h</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Auto-shutdown after 4h idle</p>
                  <p className="text-xs text-muted-foreground">Save costs when not in use</p>
                </div>
              </div>
              <Switch 
                checked={formData.autoShutdown} 
                onCheckedChange={(v) => updateFormData("autoShutdown", v)} 
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-border bg-muted/20">
              <h4 className="font-medium text-sm mb-3">Workspace Summary</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Workspace Name</p>
                  <p className="font-medium">{formData.workspaceName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Project</p>
                  <p className="font-medium">
                    {formData.projectId && formData.projectId !== "none" 
                      ? projects.find(p => p.id === formData.projectId)?.name 
                      : "No project linked"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">IDE</p>
                  <p className="font-medium">{ideOptions.find(i => i.id === formData.ideType)?.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Preset</p>
                  <Badge variant="secondary" className="text-xs">{formData.preset}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Resources</p>
                  <p className="font-medium text-xs">{formData.cpu} CPU / {formData.memory}GB RAM / {formData.storage}GB</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">GPU</p>
                  <p className="font-medium text-sm">{selectedGpu?.label}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div>
                <p className="font-medium text-sm">Estimated Cost</p>
                <p className="text-xs text-muted-foreground">Based on current configuration</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-primary">${estimatedCost}</p>
                <p className="text-xs text-muted-foreground">per hour</p>
              </div>
            </div>

            {formData.autoShutdown && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20">
                <Check className="h-4 w-4 text-success" />
                <p className="text-xs text-success">
                  Auto-shutdown enabled: workspace will stop after 4h of inactivity
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
      title="Launch Workspace"
      description="Development Environment"
      icon={Code2}
      iconClassName="bg-muted text-foreground"
      steps={steps}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      canProceed={validateStep}
      onNext={handleNext}
      onPrev={handlePrev}
      onSubmit={handleSubmit}
      isSubmitting={isLaunching}
      submitLabel="Launch"
    >
      {renderStepContent()}
    </WizardLayout>
  );
};
