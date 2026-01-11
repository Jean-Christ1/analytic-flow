import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { WizardLayout, WizardStep } from "@/components/ui/wizard-layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import {
  FlaskConical,
  Terminal,
  Database,
  Sparkles,
  Info,
  ChevronDown,
  Box,
  Cpu,
  HardDrive,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { projects, datasets } from "@/data/platformData";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface NewExperimentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
}

type IDEType = "jupyter" | "vscode" | "rstudio";
type MaturityLevel = "exploratory" | "candidate" | "baseline";

const ideOptions: { id: IDEType; name: string; description: string }[] = [
  { id: "vscode", name: "VS Code Server", description: "Full IDE" },
  { id: "jupyter", name: "JupyterLab", description: "Notebooks" },
  { id: "rstudio", name: "RStudio", description: "R analytics" },
];

const maturityLevels: { id: MaturityLevel; label: string; color: string }[] = [
  { id: "exploratory", label: "Exploratory", color: "info" },
  { id: "candidate", label: "Candidate", color: "warning" },
  { id: "baseline", label: "Baseline", color: "success" },
];

const mlTaxonomy = {
  domains: ["Computer Vision", "NLP", "Speech/Audio", "Time Series", "Recommender Systems", "Anomaly Detection"],
  dataTypes: ["Structured (tabular)", "Unstructured", "Sequential", "Graphs", "Multimodal"],
  methods: ["Supervised", "Unsupervised", "Semi-supervised", "Reinforcement", "Self-supervised"],
  problems: ["Classification", "Regression", "Clustering", "Forecasting", "Anomaly Detection"],
};

const steps: WizardStep[] = [
  { id: 1, name: "Identification", icon: FlaskConical },
  { id: 2, name: "Environment", icon: Terminal },
  { id: 3, name: "Data & Tracking", icon: Database },
  { id: 4, name: "Summary", icon: Sparkles },
];

export const NewExperimentDialog = ({ open, onOpenChange, projectId }: NewExperimentDialogProps) => {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLaunching, setIsLaunching] = useState(false);
  const [showMLContext, setShowMLContext] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projectId || "");

  const selectedProject = selectedProjectId ? projects.find(p => p.id === selectedProjectId) : null;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    tags: [] as string[],
    maturityLevel: "exploratory" as MaturityLevel,
    mlDomain: "",
    mlMethod: "",
    mlProblem: "",
    ideType: "vscode" as IDEType,
    pythonVersion: "3.11",
    cpuCores: 4,
    gpuEnabled: false,
    ramGB: 16,
    storageGB: 50,
    autoStopMinutes: 60,
    selectedDatasets: [] as string[],
    enableTracking: true,
  });

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const canProceed = (step: number): boolean => {
    if (step === 1) return !!selectedProjectId && !!formData.name.trim();
    return true;
  };

  const handleNext = () => {
    if (!canProceed(currentStep)) {
      toast.error(currentStep === 1 ? "Please fill required fields" : "Complete this step first");
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
    setIsLaunching(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success(`Experiment "${formData.name}" launched!`, {
      description: `${ideOptions.find(i => i.id === formData.ideType)?.name} starting...`
    });
    onOpenChange(false);
    setCurrentStep(1);
    setIsLaunching(false);
    navigate("/experiments");
  };

  const projectDatasets = datasets.filter(d => d.projectId === selectedProject?.id);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            {/* Project Selection */}
            <div className="space-y-2">
              <Label>Project <span className="text-destructive">*</span></Label>
              <div className="flex items-center gap-2">
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger className={cn("flex-1", !selectedProjectId && "border-destructive/50")}>
                    <SelectValue placeholder="Select a project..." />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        <div className="flex items-center gap-2">
                          <Box className="h-3.5 w-3.5 text-primary" />
                          <span>{project.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Badge variant="info">DEV</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Experiments are created in DEV environment</p>
            </div>

            {/* Name & Description */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="e.g., LSTM Feature Extraction v2"
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  className={cn(!formData.name.trim() && "border-destructive/50")}
                />
              </div>
              <div className="space-y-2">
                <Label>Maturity Level</Label>
                <Select value={formData.maturityLevel} onValueChange={(v: MaturityLevel) => updateFormData("maturityLevel", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {maturityLevels.map((level) => (
                      <SelectItem key={level.id} value={level.id}>
                        <Badge variant={level.color as any} className="text-xs">{level.label}</Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe the experiment objective..."
                value={formData.description}
                onChange={(e) => updateFormData("description", e.target.value)}
                rows={2}
              />
            </div>

            {/* Author */}
            <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
              </div>
              <div>
                <p className="text-sm font-medium">{user?.name || 'Current User'}</p>
                <p className="text-xs text-muted-foreground">{user?.role || 'Data Scientist'}</p>
              </div>
            </div>

            {/* ML Context - Collapsible */}
            <Collapsible open={showMLContext} onOpenChange={setShowMLContext}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between h-8 text-xs">
                  <span className="flex items-center gap-2">
                    <Info className="h-3.5 w-3.5" />ML Context (optional)
                  </span>
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showMLContext && "rotate-180")} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <div className="grid grid-cols-3 gap-2 p-3 rounded-lg border bg-muted/20">
                  <div className="space-y-1">
                    <Label className="text-xs">Domain</Label>
                    <Select value={formData.mlDomain} onValueChange={(v) => updateFormData("mlDomain", v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        {mlTaxonomy.domains.map((d) => <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Method</Label>
                    <Select value={formData.mlMethod} onValueChange={(v) => updateFormData("mlMethod", v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        {mlTaxonomy.methods.map((m) => <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Problem</Label>
                    <Select value={formData.mlProblem} onValueChange={(v) => updateFormData("mlProblem", v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        {mlTaxonomy.problems.map((p) => <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            {/* IDE Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Development Environment
                <Tooltip><TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent>Choose your preferred development environment</TooltipContent>
                </Tooltip>
              </Label>
              <div className="grid grid-cols-3 gap-2">
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
                    <p className="font-medium text-sm">{ide.name}</p>
                    <p className="text-xs text-muted-foreground">{ide.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Python Version */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Python Version</Label>
                <Select value={formData.pythonVersion} onValueChange={(v) => updateFormData("pythonVersion", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["3.12", "3.11", "3.10", "3.9"].map((v) => (
                      <SelectItem key={v} value={v}>Python {v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Auto-stop (min)</Label>
                <Select value={formData.autoStopMinutes.toString()} onValueChange={(v) => updateFormData("autoStopMinutes", parseInt(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[30, 60, 120, 240].map((m) => (
                      <SelectItem key={m} value={m.toString()}>{m} minutes</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Resources */}
            <div className="space-y-3 p-3 rounded-lg border bg-muted/20">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary" />Resources
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>CPU Cores</span><span className="font-medium">{formData.cpuCores}</span>
                  </div>
                  <Slider value={[formData.cpuCores]} onValueChange={([v]) => updateFormData("cpuCores", v)} min={1} max={16} step={1} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>RAM</span><span className="font-medium">{formData.ramGB} GB</span>
                  </div>
                  <Slider value={[formData.ramGB]} onValueChange={([v]) => updateFormData("ramGB", v)} min={4} max={64} step={4} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Storage: {formData.storageGB} GB</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">GPU</span>
                  <Switch checked={formData.gpuEnabled} onCheckedChange={(v) => updateFormData("gpuEnabled", v)} />
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            {/* Datasets */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Available Datasets
                <Tooltip><TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent>Select datasets to use in this experiment</TooltipContent>
                </Tooltip>
              </Label>
              {projectDatasets.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {projectDatasets.map((dataset) => (
                    <div
                      key={dataset.id}
                      className={cn(
                        "p-2 rounded-lg border cursor-pointer transition-all",
                        formData.selectedDatasets.includes(dataset.id)
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      )}
                      onClick={() => {
                        const newDatasets = formData.selectedDatasets.includes(dataset.id)
                          ? formData.selectedDatasets.filter(d => d !== dataset.id)
                          : [...formData.selectedDatasets, dataset.id];
                        updateFormData("selectedDatasets", newDatasets);
                      }}
                    >
                      <p className="font-medium text-xs">{dataset.name}</p>
                      <p className="text-[10px] text-muted-foreground">{dataset.size}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground p-3 border rounded-lg bg-muted/20">
                  {selectedProject ? "No datasets available for this project" : "Select a project first"}
                </p>
              )}
            </div>

            {/* Tracking */}
            <div className="p-3 rounded-lg border bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Automatic Tracking</p>
                  <p className="text-xs text-muted-foreground">Track metrics, parameters, and artifacts</p>
                </div>
                <Switch checked={formData.enableTracking} onCheckedChange={(v) => updateFormData("enableTracking", v)} />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-lg border bg-muted/20">
              <h4 className="font-medium text-sm mb-3">Experiment Summary</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="font-medium">{formData.name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Project</p>
                  <p className="font-medium">{selectedProject?.name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Environment</p>
                  <p className="font-medium">{ideOptions.find(i => i.id === formData.ideType)?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Resources</p>
                  <p className="font-medium">{formData.cpuCores} CPU, {formData.ramGB}GB RAM{formData.gpuEnabled ? ", GPU" : ""}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Datasets</p>
                  <p className="font-medium">{formData.selectedDatasets.length || "None selected"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tracking</p>
                  <Badge variant={formData.enableTracking ? "success" : "secondary"} className="text-xs">
                    {formData.enableTracking ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div>
                <p className="font-medium text-sm">Estimated Cost</p>
                <p className="text-xs text-muted-foreground">Based on resource allocation</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-primary">~€{((formData.cpuCores * 0.1) + (formData.ramGB * 0.05) + (formData.gpuEnabled ? 2 : 0)).toFixed(2)}</p>
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
      title="New Experiment"
      description="Create a new ML experiment"
      icon={FlaskConical}
      iconClassName="bg-primary/20 text-primary"
      steps={steps}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      canProceed={canProceed}
      onNext={handleNext}
      onPrev={handlePrev}
      onSubmit={handleSubmit}
      isSubmitting={isLaunching}
      submitLabel="Launch Experiment"
    >
      {renderStepContent()}
    </WizardLayout>
  );
};
