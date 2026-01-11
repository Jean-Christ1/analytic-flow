import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  FolderKanban, 
  Plus, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Info,
  ChevronDown,
  Building2,
  Layers,
  Sparkles,
  RefreshCw,
  Shield,
  Database,
  Terminal,
  Cpu,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const teams = [
  "Risk Analytics",
  "Growth Team",
  "AI Research",
  "Product Team",
  "Data Engineering",
  "ML Engineering",
];

const frameworks = [
  "TensorFlow",
  "PyTorch",
  "Scikit-learn",
  "XGBoost",
  "Transformers",
  "JAX",
];

const steps = [
  { id: 1, name: "Identification", icon: FolderKanban },
  { id: 2, name: "Team & Stack", icon: Building2 },
  { id: 3, name: "Summary", icon: Sparkles },
];

// ML Taxonomy for optional context
const mlTaxonomy = {
  domains: ["Computer Vision", "NLP", "Speech/Audio", "Time Series", "Recommender Systems", "Anomaly Detection", "Multimodal AI"],
  dataTypes: ["Structured (tabular)", "Unstructured (text/image/audio)", "Sequential", "Graphs", "Multimodal"],
  methods: ["Supervised", "Unsupervised", "Semi-supervised", "Reinforcement", "Self-supervised"],
  problems: ["Classification", "Regression", "Clustering", "Forecasting", "Anomaly Detection", "Ranking"],
  collection: ["Batch", "Streaming", "Hybrid"],
};

export const CreateProjectDialog = ({ open, onOpenChange }: CreateProjectDialogProps) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMLContext, setShowMLContext] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    team: "",
    selectedFrameworks: [] as string[],
    // ML Context (optional)
    mlDomain: "",
    mlDataType: "",
    mlMethod: "",
    mlProblem: "",
    mlCollection: "",
  });

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setValidationErrors([]);
  };

  const handleFrameworkToggle = (framework: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedFrameworks: prev.selectedFrameworks.includes(framework)
        ? prev.selectedFrameworks.filter((f) => f !== framework)
        : [...prev.selectedFrameworks, framework],
    }));
  };

  const validateStep = (step: number): string[] => {
    const errors: string[] = [];

    switch (step) {
      case 1:
        if (!formData.name.trim()) errors.push("Project name is required");
        if (formData.name.length > 100) errors.push("Name must be less than 100 characters");
        break;
      case 2:
        if (!formData.team) errors.push("Team selection is required");
        break;
    }

    return errors;
  };

  const canProceed = (step: number): boolean => {
    return validateStep(step).length === 0;
  };

  const nextStep = () => {
    const errors = validateStep(currentStep);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
      setValidationErrors([]);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setValidationErrors([]);
    }
  };

  const handleSubmit = async () => {
    const errors = validateStep(currentStep);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    toast.success(`Project "${formData.name}" created successfully!`);
    onOpenChange(false);
    resetForm();
    
    // Navigate to new project
    navigate("/projects/proj-new");
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      team: "",
      selectedFrameworks: [],
      mlDomain: "",
      mlDataType: "",
      mlMethod: "",
      mlProblem: "",
      mlCollection: "",
    });
    setCurrentStep(1);
    setIsSubmitting(false);
    setShowMLContext(false);
    setValidationErrors([]);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-5">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="project-name">
                Project Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="project-name"
                placeholder="e.g., Fraud Detection System"
                value={formData.name}
                onChange={(e) => updateFormData("name", e.target.value)}
                className={cn(
                  validationErrors.length > 0 && !formData.name.trim() ? "border-destructive" : ""
                )}
              />
              <p className="text-xs text-muted-foreground">Clear, descriptive name for the project</p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the project goals and objectives..."
                value={formData.description}
                onChange={(e) => updateFormData("description", e.target.value)}
                rows={3}
              />
            </div>

            {/* ML Context - Collapsible */}
            <Collapsible open={showMLContext} onOpenChange={setShowMLContext}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between h-9 text-sm">
                  <span className="flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    ML Problem Context (optional)
                  </span>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", showMLContext && "rotate-180")} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3">
                <div className="grid grid-cols-3 gap-3 p-3 rounded-lg border border-border bg-muted/20">
                  <div className="space-y-1">
                    <Label className="text-xs">Domain</Label>
                    <Select value={formData.mlDomain} onValueChange={(v) => updateFormData("mlDomain", v)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {mlTaxonomy.domains.map((d) => (
                          <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Data Type</Label>
                    <Select value={formData.mlDataType} onValueChange={(v) => updateFormData("mlDataType", v)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {mlTaxonomy.dataTypes.map((d) => (
                          <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Method</Label>
                    <Select value={formData.mlMethod} onValueChange={(v) => updateFormData("mlMethod", v)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {mlTaxonomy.methods.map((m) => (
                          <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Problem Type</Label>
                    <Select value={formData.mlProblem} onValueChange={(v) => updateFormData("mlProblem", v)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {mlTaxonomy.problems.map((p) => (
                          <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Collection Mode</Label>
                    <Select value={formData.mlCollection} onValueChange={(v) => updateFormData("mlCollection", v)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {mlTaxonomy.collection.map((c) => (
                          <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                        ))}
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
          <div className="space-y-5">
            {/* Team Selection */}
            <div className="space-y-2">
              <Label>Team <span className="text-destructive">*</span></Label>
              <Select value={formData.team} onValueChange={(v) => updateFormData("team", v)}>
                <SelectTrigger className={cn(
                  validationErrors.length > 0 && !formData.team ? "border-destructive" : ""
                )}>
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((t) => (
                    <SelectItem key={t} value={t}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        <span>{t}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Team responsible for this project</p>
            </div>

            {/* ML Frameworks */}
            <div className="space-y-2">
              <Label>ML Frameworks</Label>
              <p className="text-xs text-muted-foreground mb-2">Select frameworks used in this project</p>
              <div className="flex flex-wrap gap-2">
                {frameworks.map((framework) => (
                  <Badge
                    key={framework}
                    variant={formData.selectedFrameworks.includes(framework) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/20 transition-colors"
                    onClick={() => handleFrameworkToggle(framework)}
                  >
                    {formData.selectedFrameworks.includes(framework) && (
                      <X className="h-3 w-3 mr-1" />
                    )}
                    {framework}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            {/* Project Card */}
            <div className="p-4 rounded-lg border border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-gradient-gold">
                  <FolderKanban className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">{formData.name || "—"}</h3>
                  <p className="text-xs text-muted-foreground">New Project</p>
                </div>
              </div>

              {formData.description && (
                <p className="text-sm text-muted-foreground mb-4">{formData.description}</p>
              )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-border bg-muted/20">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">Team</span>
                </div>
                <div className="space-y-1 text-xs">
                  <p><span className="text-muted-foreground">Team:</span> {formData.team || "—"}</p>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-border bg-muted/20">
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">Frameworks</span>
                </div>
                <div className="space-y-1 text-xs">
                  <p><span className="text-muted-foreground">Selected:</span> {formData.selectedFrameworks.length || 0}</p>
                  {formData.selectedFrameworks.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {formData.selectedFrameworks.map((f) => (
                        <Badge key={f} variant="outline" className="text-xs py-0">{f}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ML Context */}
            {(formData.mlDomain || formData.mlDataType || formData.mlMethod) && (
              <div className="p-3 rounded-lg border border-border bg-muted/20">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">ML Context</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {formData.mlDomain && <Badge variant="outline" className="text-xs">{formData.mlDomain}</Badge>}
                  {formData.mlDataType && <Badge variant="outline" className="text-xs">{formData.mlDataType}</Badge>}
                  {formData.mlMethod && <Badge variant="outline" className="text-xs">{formData.mlMethod}</Badge>}
                  {formData.mlProblem && <Badge variant="outline" className="text-xs">{formData.mlProblem}</Badge>}
                  {formData.mlCollection && <Badge variant="outline" className="text-xs">{formData.mlCollection}</Badge>}
                </div>
              </div>
            )}

            {/* Governance */}
            <div className="p-3 rounded-lg border border-success/30 bg-success/5">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-success" />
                <span className="font-semibold text-xs">Auto-provisioning</span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div className="flex items-center gap-1">
                  <Check className="h-3 w-3 text-success" />
                  <span>DEV environment</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check className="h-3 w-3 text-success" />
                  <span>STAGING environment</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check className="h-3 w-3 text-success" />
                  <span>PROD environment</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check className="h-3 w-3 text-success" />
                  <span>CI/CD pipelines</span>
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0 overflow-hidden">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-52 border-r border-border bg-muted/30 p-4 shrink-0">
            <DialogHeader className="pb-3">
              <DialogTitle className="flex items-center gap-2 text-base">
                <div className="p-1.5 rounded-lg bg-gradient-gold">
                  <FolderKanban className="h-4 w-4 text-primary-foreground" />
                </div>
                New Project
              </DialogTitle>
              <DialogDescription className="text-xs">
                Create ML project
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-1 mt-3">
              {steps.map((step) => {
                const Icon = step.icon;
                const isActive = step.id === currentStep;
                const isCompleted = step.id < currentStep;

                return (
                  <button
                    key={step.id}
                    onClick={() => {
                      if (isCompleted || (step.id === currentStep + 1 && canProceed(currentStep))) {
                        setCurrentStep(step.id);
                      }
                    }}
                    className={cn(
                      "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all text-sm",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : isCompleted
                        ? "text-foreground hover:bg-muted cursor-pointer"
                        : "text-muted-foreground/60"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-xs",
                      isActive
                        ? "bg-primary-foreground text-primary"
                        : isCompleted
                        ? "bg-success text-success-foreground"
                        : "bg-muted"
                    )}>
                      {isCompleted ? <Check className="h-3 w-3" /> : step.id}
                    </div>
                    <span className="truncate text-xs">{step.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4">
              <Progress value={(currentStep / steps.length) * 100} className="h-1" />
              <p className="text-xs text-muted-foreground mt-1.5">
                Step {currentStep} of {steps.length}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-[calc(85vh-80px)] px-5 py-4">
                <div className="mb-3">
                  <h2 className="text-lg font-semibold">{steps[currentStep - 1].name}</h2>
                </div>
                {validationErrors.length > 0 && (
                  <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                    <p className="text-sm text-destructive font-medium">Please fix the following:</p>
                    <ul className="text-sm text-destructive mt-1 list-disc list-inside">
                      {validationErrors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {renderStepContent()}
              </ScrollArea>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border p-3 bg-background shrink-0">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <div className="flex items-center gap-2">
                {currentStep > 1 && (
                  <Button variant="outline" size="sm" onClick={prevStep}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                )}
                {currentStep < steps.length ? (
                  <Button variant="premium" size="sm" onClick={nextStep}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button 
                    variant="premium" 
                    size="sm"
                    onClick={handleSubmit} 
                    disabled={isSubmitting || !formData.name.trim()}
                    className="min-w-28"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-1" />
                        Create
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
