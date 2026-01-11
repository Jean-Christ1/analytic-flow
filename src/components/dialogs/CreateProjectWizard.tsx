import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
import {
  FolderKanban,
  ChevronRight,
  ChevronLeft,
  Check,
  Info,
  AlertTriangle,
  Shield,
  Database,
  GitBranch,
  Cpu,
  Users,
  FileText,
  Activity,
  Lock,
  ChevronDown,
  Plus,
  X,
  Folder,
  File,
  Building2,
  Scale,
  Eye,
  Code2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  AIActRiskCategory,
  DataClassification,
  ProjectRole,
  aiActRiskLabels,
  dataClassificationLabels,
  projectRoleLabels,
  repositoryDescriptions,
} from "@/data/hierarchicalModel";
import { teamMembers } from "@/data/platformData";

interface CreateProjectWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const steps = [
  { id: 1, name: "General Information", icon: FolderKanban },
  { id: 2, name: "Environments", icon: Cpu },
  { id: 3, name: "Git Repositories", icon: GitBranch },
  { id: 4, name: "Data & Datasets", icon: Database },
  { id: 5, name: "Models & Pipelines", icon: Activity },
  { id: 6, name: "Monitoring", icon: Eye },
  { id: 7, name: "Documentation", icon: FileText },
  { id: 8, name: "Team & Access", icon: Users },
  { id: 9, name: "Governance & Compliance", icon: Shield },
];

const domains = [
  "Finance",
  "Healthcare",
  "Retail",
  "Manufacturing",
  "Technology",
  "Energy",
  "Transportation",
  "Telecommunications",
  "Other",
];

const frameworks = [
  "TensorFlow",
  "PyTorch",
  "Scikit-learn",
  "XGBoost",
  "LightGBM",
  "Transformers",
  "JAX",
  "ONNX",
  "Prophet",
  "Keras",
];

const complianceOptions = [
  { id: "gdpr", label: "GDPR", description: "General Data Protection Regulation" },
  { id: "hipaa", label: "HIPAA", description: "Health Insurance Portability and Accountability Act" },
  { id: "iso27001", label: "ISO 27001", description: "Information Security Management" },
  { id: "soc2", label: "SOC 2", description: "Service Organization Control 2" },
  { id: "pci-dss", label: "PCI-DSS", description: "Payment Card Industry Data Security Standard" },
  { id: "ccpa", label: "CCPA", description: "California Consumer Privacy Act" },
];

// ML Taxonomy - Informational only
const mlTaxonomy = {
  domains: ["Computer Vision", "NLP", "Speech/Audio", "Time Series", "Recommender Systems", "Anomaly Detection", "Multimodal AI"],
  dataTypes: ["Structured (tabular)", "Unstructured (text/image/audio)", "Sequential", "Graphs", "Multimodal"],
  methods: ["Supervised", "Unsupervised", "Semi-supervised", "Reinforcement", "Self-supervised"],
  problems: ["Classification", "Regression", "Clustering", "Forecasting", "Anomaly Detection", "Ranking"],
  collection: ["Batch", "Streaming", "Hybrid"],
};

type IDEType = "vscode" | "jupyter" | "rstudio";

const ideOptions: { id: IDEType; name: string; icon: string; recommended?: boolean }[] = [
  { id: "vscode", name: "VS Code", icon: "💻", recommended: true },
  { id: "jupyter", name: "JupyterLab", icon: "🪐" },
  { id: "rstudio", name: "RStudio", icon: "📊" },
];

export const CreateProjectWizard = ({ open, onOpenChange }: CreateProjectWizardProps) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRepoStructure, setShowRepoStructure] = useState(false);
  const [showFullStructure, setShowFullStructure] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showMLContext, setShowMLContext] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    // Step 1: General
    name: "",
    code: "",
    description: "",
    businessObjectives: "",
    owner: "",
    domain: "",
    subdomain: "",
    priority: "medium" as "critical" | "high" | "medium" | "low",
    sla: "99%",
    tags: [] as string[],
    aiActRiskCategory: "minimal" as AIActRiskCategory,
    
    // ML Context (optional/informational)
    mlDomain: "",
    mlDataType: "",
    mlMethod: "",
    mlProblem: "",
    mlCollection: "",
    
    // Step 2: Environments
    environments: {
      development: { enabled: true, cpu: 8, memory: 32, gpu: 1, storage: 100, python: "3.11" },
      staging: { enabled: true, cpu: 16, memory: 64, gpu: 2, storage: 250, python: "3.11" },
      production: { enabled: true, cpu: 32, memory: 128, gpu: 4, storage: 500, python: "3.11" },
      sandbox: { enabled: false, cpu: 4, memory: 16, gpu: 0, storage: 50, python: "3.11", justification: "", duration: "3" },
    },
    
    // Step 3: Repositories
    approaches: [{ name: "", description: "" }],
    preferredIDE: "vscode" as IDEType,
    
    // Step 4: Data
    dataClassification: "internal" as DataClassification,
    dataSources: [] as string[],
    anonymizationRequired: false,
    encryptionRequired: true,
    
    // Step 5: Models
    modelType: "",
    frameworks: [] as string[],
    
    // Step 6: Monitoring
    alertChannels: [] as string[],
    driftDetection: true,
    performanceMonitoring: true,
    
    // Step 7: Documentation
    readmeTemplate: true,
    apiDocs: true,
    onboardingGuide: true,
    
    // Step 8: Team
    team: [] as { id: string; role: ProjectRole }[],
    
    // Step 9: Compliance
    complianceRequirements: [] as string[],
    retentionPolicy: "5",
    auditLogging: true,
    mfaRequired: true,
  });

  // Validation function per step - validate on Next click, show errors
  const validateStep = (step: number): string[] => {
    const errors: string[] = [];
    
    switch (step) {
      case 1:
        if (!formData.name.trim()) errors.push("Project name is required");
        if (formData.name.length > 100) errors.push("Name must be less than 100 characters");
        if (!formData.code.trim()) errors.push("Project code is required");
        if (!formData.description.trim()) errors.push("Description is required");
        if (!formData.owner) errors.push("Project owner is required");
        if (!formData.domain) errors.push("Domain is required");
        break;
      case 2:
        if (formData.environments.sandbox.enabled && !formData.environments.sandbox.justification?.trim()) {
          errors.push("Sandbox justification is required when enabled");
        }
        break;
      case 3:
        if (formData.approaches.length === 0) errors.push("At least one approach is required");
        formData.approaches.forEach((approach, i) => {
          if (!approach.name.trim()) errors.push(`Approach ${i + 1} name is required`);
        });
        break;
      // Steps 4-9 have no mandatory fields
    }
    
    return errors;
  };

  const canProceed = (step: number): boolean => {
    return validateStep(step).length === 0;
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    const errors = validateStep(currentStep);
    if (errors.length > 0) {
      setValidationErrors(errors);
      toast.error(errors[0]);
      return;
    }
    setValidationErrors([]);
    if (currentStep < steps.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast.success(`Project "${formData.name}" created successfully with all resources!`);
    onOpenChange(false);
    setCurrentStep(1);
    setIsSubmitting(false);
    
    navigate("/projects");
  };

  const addApproach = () => {
    updateFormData("approaches", [...formData.approaches, { name: "", description: "" }]);
  };

  const removeApproach = (index: number) => {
    updateFormData("approaches", formData.approaches.filter((_, i) => i !== index));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name <span className="text-destructive">*</span></Label>
                <Input
                  id="name"
                  placeholder="e.g., Tire Regulation Analysis"
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Unique name for your project (usecase)</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Project Code <span className="text-destructive">*</span></Label>
                <Input
                  id="code"
                  placeholder="e.g., TRA"
                  value={formData.code}
                  onChange={(e) => updateFormData("code", e.target.value.toUpperCase())}
                  maxLength={5}
                />
                <p className="text-xs text-muted-foreground">Short code (3-5 chars) for namespacing</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description <span className="text-destructive">*</span></Label>
              <Textarea
                id="description"
                placeholder="Describe the project scope, main objectives, and expected outcomes..."
                value={formData.description}
                onChange={(e) => updateFormData("description", e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="objectives">Business Objectives</Label>
              <Textarea
                id="objectives"
                placeholder="Describe the business goals and KPIs..."
                value={formData.businessObjectives}
                onChange={(e) => updateFormData("businessObjectives", e.target.value)}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Project Owner <span className="text-destructive">*</span></Label>
                <Select value={formData.owner} onValueChange={(v) => updateFormData("owner", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.name} - {m.role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Domain <span className="text-destructive">*</span></Label>
                <Select value={formData.domain} onValueChange={(v) => updateFormData("domain", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select domain" />
                  </SelectTrigger>
                  <SelectContent>
                    {domains.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Subdomain</Label>
                <Input
                  placeholder="e.g., Tire Production"
                  value={formData.subdomain}
                  onChange={(e) => updateFormData("subdomain", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={formData.priority} onValueChange={(v: any) => updateFormData("priority", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>SLA Target</Label>
                <Select value={formData.sla} onValueChange={(v) => updateFormData("sla", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="99.99%">99.99% (Critical)</SelectItem>
                    <SelectItem value="99.9%">99.9% (High)</SelectItem>
                    <SelectItem value="99.5%">99.5% (Standard)</SelectItem>
                    <SelectItem value="99%">99% (Basic)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-gold" />
                <Label className="text-base font-semibold">AI Act Risk Classification</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p>The EU AI Act categorizes AI systems by risk level. Select the appropriate category for compliance.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(Object.entries(aiActRiskLabels) as [AIActRiskCategory, typeof aiActRiskLabels[AIActRiskCategory]][]).map(([key, value]) => (
                  <div
                    key={key}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all",
                      formData.aiActRiskCategory === key
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => updateFormData("aiActRiskCategory", key)}
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant={value.color as any} className="text-xs">{value.label}</Badge>
                      {formData.aiActRiskCategory === key && <Check className="h-4 w-4 text-primary ml-auto" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{value.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ML Context - Collapsible (optional) */}
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
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Configure resource allocation for each environment. DEV, STAGING, and PROD are created by default.
            </p>

            {(["development", "staging", "production"] as const).map((env) => (
              <div key={env} className="p-4 rounded-lg border border-border bg-muted/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Badge variant={env === "production" ? "success" : env === "staging" ? "warning" : "info"}>
                      {env.toUpperCase()}
                    </Badge>
                    <span className="text-sm font-medium">Default Environment</span>
                  </div>
                  <Badge variant="outline" className="text-xs">Required</Badge>
                </div>
                <div className="grid grid-cols-5 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">CPU (cores)</Label>
                    <Input
                      type="number"
                      value={formData.environments[env].cpu}
                      onChange={(e) => updateFormData("environments", {
                        ...formData.environments,
                        [env]: { ...formData.environments[env], cpu: parseInt(e.target.value) || 0 }
                      })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Memory (GB)</Label>
                    <Input
                      type="number"
                      value={formData.environments[env].memory}
                      onChange={(e) => updateFormData("environments", {
                        ...formData.environments,
                        [env]: { ...formData.environments[env], memory: parseInt(e.target.value) || 0 }
                      })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">GPU</Label>
                    <Input
                      type="number"
                      value={formData.environments[env].gpu}
                      onChange={(e) => updateFormData("environments", {
                        ...formData.environments,
                        [env]: { ...formData.environments[env], gpu: parseInt(e.target.value) || 0 }
                      })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Storage (GB)</Label>
                    <Input
                      type="number"
                      value={formData.environments[env].storage}
                      onChange={(e) => updateFormData("environments", {
                        ...formData.environments,
                        [env]: { ...formData.environments[env], storage: parseInt(e.target.value) || 0 }
                      })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Python</Label>
                    <Select
                      value={formData.environments[env].python}
                      onValueChange={(v) => updateFormData("environments", {
                        ...formData.environments,
                        [env]: { ...formData.environments[env], python: v }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3.12">3.12</SelectItem>
                        <SelectItem value="3.11">3.11</SelectItem>
                        <SelectItem value="3.10">3.10</SelectItem>
                        <SelectItem value="3.9">3.9</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}

            <Separator />

            <div className="p-4 rounded-lg border border-warning/50 bg-warning/5">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="sandbox"
                  checked={formData.environments.sandbox.enabled}
                  onCheckedChange={(checked) => updateFormData("environments", {
                    ...formData.environments,
                    sandbox: { ...formData.environments.sandbox, enabled: !!checked }
                  })}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="sandbox" className="font-semibold">Enable Sandbox Environment</Label>
                    <Badge variant="warning" className="text-xs">Optional - Temporary</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sandbox is a temporary environment (3 months) for experimentation. Extensions require admin approval.
                  </p>
                </div>
              </div>

              {formData.environments.sandbox.enabled && (
                <div className="mt-4 space-y-3 pl-7">
                  <div className="space-y-2">
                    <Label className="text-xs">Justification <span className="text-destructive">*</span></Label>
                    <Textarea
                      placeholder="Explain why a sandbox environment is needed..."
                      value={formData.environments.sandbox.justification}
                      onChange={(e) => updateFormData("environments", {
                        ...formData.environments,
                        sandbox: { ...formData.environments.sandbox, justification: e.target.value }
                      })}
                      rows={2}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <AlertTriangle className="h-3 w-3 text-warning" />
                    Duration: 3 months | Max extensions: Defined by platform admin
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        const generateDynamicStructure = () => {
          const code = formData.code || "PROJECT";
          const approaches = formData.approaches.filter(a => a.name.trim());
          
          let structure = `${code}/  (Groupe GitLab principal)\n`;
          structure += `├── docs/\n`;
          structure += `│   ├── README.md\n`;
          structure += `│   ├── architecture/\n`;
          structure += `│   │   ├── global-architecture.md\n`;
          structure += `│   │   └── mlops-principles.md\n`;
          structure += `│   └── governance/\n`;
          structure += `│       ├── model-promotion-policy.md\n`;
          structure += `│       └── security-compliance.md\n`;
          structure += `│\n`;
          structure += `├── ci-cd-shared/\n`;
          structure += `│   ├── templates/\n`;
          structure += `│   │   ├── train.yml\n`;
          structure += `│   │   ├── deploy.yml\n`;
          structure += `│   │   └── monitoring.yml\n`;
          structure += `│   └── scripts/\n`;
          structure += `│       ├── build_model.sh\n`;
          structure += `│       └── deploy_model.sh\n`;
          structure += `│\n`;
          
          approaches.forEach((approach, index) => {
            const approachName = approach.name.toLowerCase().replace(/\s+/g, '-');
            const isLast = index === approaches.length - 1;
            const prefix = isLast ? '└── ' : '├── ';
            const childPrefix = isLast ? '    ' : '│   ';
            
            structure += `${prefix}${approachName}/  (Sous-groupe: ${approach.name})\n`;
            structure += `${childPrefix}├── ml-core/\n`;
            structure += `${childPrefix}│   ├── src/features/\n`;
            structure += `${childPrefix}│   ├── src/preprocessing/\n`;
            structure += `${childPrefix}│   ├── src/schemas/\n`;
            structure += `${childPrefix}│   └── tests/\n`;
            structure += `${childPrefix}├── ml-training/\n`;
            structure += `${childPrefix}│   ├── src/train.py\n`;
            structure += `${childPrefix}│   ├── src/evaluate.py\n`;
            structure += `${childPrefix}│   └── configs/\n`;
            structure += `${childPrefix}├── ml-inference/\n`;
            structure += `${childPrefix}│   ├── src/api/\n`;
            structure += `${childPrefix}│   ├── src/batch/\n`;
            structure += `${childPrefix}│   └── configs/\n`;
            structure += `${childPrefix}└── ml-monitoring/\n`;
            structure += `${childPrefix}    ├── src/drift_detection/\n`;
            structure += `${childPrefix}    ├── src/alerting/\n`;
            structure += `${childPrefix}    └── dashboards/\n`;
            if (!isLast) structure += `│\n`;
          });
          
          if (approaches.length === 0) {
            structure += `├── [approach-name]/  (Renseignez un nom d'approche)\n`;
            structure += `│   └── ... (structure générée automatiquement)\n`;
          }
          
          return structure;
        };

        return (
          <div className="space-y-6">
            {/* IDE Selection */}
            <div className="p-4 rounded-lg border border-gold/30 bg-gold/5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-gold/20">
                  <Code2 className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <Label className="text-base font-semibold">Development IDE <span className="text-destructive">*</span></Label>
                  <p className="text-xs text-muted-foreground">Select the IDE for all project workspaces</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {ideOptions.map((ide) => (
                  <Button
                    key={ide.id}
                    variant={formData.preferredIDE === ide.id ? "premium" : "outline"}
                    size="sm"
                    onClick={() => updateFormData("preferredIDE", ide.id)}
                    className={cn(
                      "gap-2",
                      ide.recommended && formData.preferredIDE !== ide.id && "border-gold/50"
                    )}
                  >
                    <span>{ide.icon}</span>
                    {ide.name}
                    {ide.recommended && (
                      <Badge variant="warning" className="text-[10px] px-1 py-0">Recommended</Badge>
                    )}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Git Repository Structure</h3>
                <p className="text-sm text-muted-foreground">
                  Repositories will be created automatically following MLOps best practices.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowFullStructure(!showFullStructure)}>
                <Info className="h-4 w-4 mr-2" />
                {showFullStructure ? "Hide Structure" : "View Full Structure"}
              </Button>
            </div>

            {showFullStructure && (
              <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 font-mono text-xs overflow-auto max-h-80">
                <div className="flex items-center gap-2 mb-3 text-primary">
                  <GitBranch className="h-4 w-4" />
                  <span className="font-semibold text-sm">Dynamic Repository Structure</span>
                  <Badge variant="info" className="text-[10px]">Auto-generated</Badge>
                </div>
                <pre className="text-muted-foreground whitespace-pre">
{generateDynamicStructure()}
                </pre>
              </div>
            )}

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Approaches (Sub-problems)</Label>
                <Button variant="outline" size="sm" onClick={addApproach}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Approach
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Each approach represents a distinct sub-problem or methodology. Each will have its own ml-core, ml-training, ml-inference, and ml-monitoring repositories.
              </p>

              {formData.approaches.map((approach, index) => (
                <div key={index} className="p-4 rounded-lg border border-border bg-background">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <Input
                          placeholder="Approach name (e.g., Wheel Color Classification)"
                          value={approach.name}
                          onChange={(e) => {
                            const newApproaches = [...formData.approaches];
                            newApproaches[index].name = e.target.value;
                            updateFormData("approaches", newApproaches);
                          }}
                          className="flex-1"
                        />
                        {formData.approaches.length > 1 && (
                          <Button variant="ghost" size="icon" onClick={() => removeApproach(index)}>
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <Input
                        placeholder="Brief description of this approach..."
                        value={approach.description}
                        onChange={(e) => {
                          const newApproaches = [...formData.approaches];
                          newApproaches[index].description = e.target.value;
                          updateFormData("approaches", newApproaches);
                        }}
                      />
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Folder className="h-3 w-3" />
                        <span>Will create: ml-core, ml-training, ml-inference, ml-monitoring</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Collapsible open={showRepoStructure} onOpenChange={setShowRepoStructure}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <span>Repository Descriptions</span>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", showRepoStructure && "rotate-180")} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-2">
                {Object.entries(repositoryDescriptions).map(([key, value]) => (
                  <div key={key} className="p-3 rounded-lg bg-muted/30 text-sm">
                    <div className="flex items-center gap-2 font-medium">
                      <GitBranch className="h-4 w-4 text-primary" />
                      {value.name}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{value.description}</p>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label className="text-base font-semibold">Data Classification</Label>
              <div className="grid grid-cols-3 gap-3">
                {(Object.entries(dataClassificationLabels) as [DataClassification, typeof dataClassificationLabels[DataClassification]][]).map(([key, value]) => (
                  <div
                    key={key}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all",
                      formData.dataClassification === key
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => updateFormData("dataClassification", key)}
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant={value.color as any} className="text-xs">{value.label}</Badge>
                      {formData.dataClassification === key && <Check className="h-4 w-4 text-primary ml-auto" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{value.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <Label>Data Sources</Label>
              <div className="flex flex-wrap gap-2">
                {["Internal Database", "External API", "File Upload", "Streaming", "Data Lake", "Feature Store"].map((source) => (
                  <Badge
                    key={source}
                    variant={formData.dataSources.includes(source) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      const newSources = formData.dataSources.includes(source)
                        ? formData.dataSources.filter(s => s !== source)
                        : [...formData.dataSources, source];
                      updateFormData("dataSources", newSources);
                    }}
                  >
                    {source}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <Label className="text-base font-semibold">Data Protection</Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-warning" />
                    <div>
                      <p className="font-medium text-sm">Anonymization Required</p>
                      <p className="text-xs text-muted-foreground">Personal data will be anonymized/pseudonymized</p>
                    </div>
                  </div>
                  <Checkbox
                    checked={formData.anonymizationRequired}
                    onCheckedChange={(checked) => updateFormData("anonymizationRequired", !!checked)}
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <Lock className="h-5 w-5 text-success" />
                    <div>
                      <p className="font-medium text-sm">Encryption at Rest</p>
                      <p className="text-xs text-muted-foreground">All data will be encrypted using AES-256</p>
                    </div>
                  </div>
                  <Checkbox
                    checked={formData.encryptionRequired}
                    onCheckedChange={(checked) => updateFormData("encryptionRequired", !!checked)}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Model Type</Label>
              <Select value={formData.modelType} onValueChange={(v) => updateFormData("modelType", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select model type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="classification">Classification</SelectItem>
                  <SelectItem value="regression">Regression</SelectItem>
                  <SelectItem value="nlp">Natural Language Processing (NLP)</SelectItem>
                  <SelectItem value="computer-vision">Computer Vision</SelectItem>
                  <SelectItem value="time-series">Time Series Forecasting</SelectItem>
                  <SelectItem value="recommendation">Recommendation System</SelectItem>
                  <SelectItem value="anomaly-detection">Anomaly Detection</SelectItem>
                  <SelectItem value="generative">Generative AI / LLM</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>ML Frameworks</Label>
              <div className="flex flex-wrap gap-2">
                {frameworks.map((fw) => (
                  <Badge
                    key={fw}
                    variant={formData.frameworks.includes(fw) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      const newFrameworks = formData.frameworks.includes(fw)
                        ? formData.frameworks.filter(f => f !== fw)
                        : [...formData.frameworks, fw];
                      updateFormData("frameworks", newFrameworks);
                    }}
                  >
                    {fw}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            <div className="p-4 rounded-lg bg-muted/30">
              <h4 className="font-medium text-sm mb-3">Automated Pipelines (CI/CD)</h4>
              <p className="text-xs text-muted-foreground mb-4">
                The following pipelines will be automatically created via CI/CD templates:
              </p>
              <div className="grid grid-cols-2 gap-3">
                {["Training Pipeline", "Validation Pipeline", "Inference Pipeline", "Monitoring Pipeline"].map((p) => (
                  <div key={p} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success" />
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-lg border border-gold/30 bg-gold/5">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-gold" />
                <span className="font-medium text-sm">Deployment Note</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Model deployments are managed via CI/CD pipelines. Manual deployment is restricted to administrators only.
              </p>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label className="text-base font-semibold">Monitoring Configuration</Label>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <Activity className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">Performance Monitoring</p>
                      <p className="text-xs text-muted-foreground">Track model accuracy, latency, and throughput</p>
                    </div>
                  </div>
                  <Checkbox
                    checked={formData.performanceMonitoring}
                    onCheckedChange={(checked) => updateFormData("performanceMonitoring", !!checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-warning" />
                    <div>
                      <p className="font-medium text-sm">Drift Detection</p>
                      <p className="text-xs text-muted-foreground">Monitor data drift and concept drift</p>
                    </div>
                  </div>
                  <Checkbox
                    checked={formData.driftDetection}
                    onCheckedChange={(checked) => updateFormData("driftDetection", !!checked)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Alert Channels</Label>
              <div className="flex flex-wrap gap-2">
                {["Email", "Slack", "Teams", "Webhook", "PagerDuty"].map((channel) => (
                  <Badge
                    key={channel}
                    variant={formData.alertChannels.includes(channel) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      const newChannels = formData.alertChannels.includes(channel)
                        ? formData.alertChannels.filter(c => c !== channel)
                        : [...formData.alertChannels, channel];
                      updateFormData("alertChannels", newChannels);
                    }}
                  >
                    {channel}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Select documentation templates to be automatically generated for your project.
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">README Template</p>
                    <p className="text-xs text-muted-foreground">Project overview, setup instructions, and usage</p>
                  </div>
                </div>
                <Checkbox
                  checked={formData.readmeTemplate}
                  onCheckedChange={(checked) => updateFormData("readmeTemplate", !!checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">API Documentation</p>
                    <p className="text-xs text-muted-foreground">OpenAPI/Swagger documentation for endpoints</p>
                  </div>
                </div>
                <Checkbox
                  checked={formData.apiDocs}
                  onCheckedChange={(checked) => updateFormData("apiDocs", !!checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">Onboarding Guide</p>
                    <p className="text-xs text-muted-foreground">Guide for new team members</p>
                  </div>
                </div>
                <Checkbox
                  checked={formData.onboardingGuide}
                  onCheckedChange={(checked) => updateFormData("onboardingGuide", !!checked)}
                />
              </div>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Team Members</Label>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Member
                </Button>
              </div>

              <div className="space-y-2">
                {teamMembers.slice(0, 5).map((member) => {
                  const teamMember = formData.team.find(t => t.id === member.id);
                  return (
                    <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                          {member.initials}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      <Select
                        value={teamMember?.role || ""}
                        onValueChange={(role: ProjectRole) => {
                          const newTeam = formData.team.filter(t => t.id !== member.id);
                          if (role) {
                            newTeam.push({ id: member.id, role });
                          }
                          updateFormData("team", newTeam);
                        }}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(projectRoleLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 9:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label className="text-base font-semibold">Compliance Requirements</Label>
              <div className="grid grid-cols-2 gap-3">
                {complianceOptions.map((option) => (
                  <div
                    key={option.id}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all",
                      formData.complianceRequirements.includes(option.id)
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => {
                      const newReqs = formData.complianceRequirements.includes(option.id)
                        ? formData.complianceRequirements.filter(r => r !== option.id)
                        : [...formData.complianceRequirements, option.id];
                      updateFormData("complianceRequirements", newReqs);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox checked={formData.complianceRequirements.includes(option.id)} />
                      <span className="font-medium text-sm">{option.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Retention (years)</Label>
                <Select value={formData.retentionPolicy} onValueChange={(v) => updateFormData("retentionPolicy", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 year</SelectItem>
                    <SelectItem value="3">3 years</SelectItem>
                    <SelectItem value="5">5 years</SelectItem>
                    <SelectItem value="7">7 years</SelectItem>
                    <SelectItem value="10">10 years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">Audit Logging</p>
                    <p className="text-xs text-muted-foreground">Complete audit trail for all actions</p>
                  </div>
                </div>
                <Checkbox
                  checked={formData.auditLogging}
                  onCheckedChange={(checked) => updateFormData("auditLogging", !!checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-success" />
                  <div>
                    <p className="font-medium text-sm">MFA Required</p>
                    <p className="text-xs text-muted-foreground">Multi-factor authentication for all users</p>
                  </div>
                </div>
                <Checkbox
                  checked={formData.mfaRequired}
                  onCheckedChange={(checked) => updateFormData("mfaRequired", !!checked)}
                />
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
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-64 border-r border-border bg-muted/30 p-4">
            <DialogHeader className="pb-4">
              <DialogTitle className="flex items-center gap-2 text-lg">
                <div className="p-2 rounded-lg bg-gradient-gold">
                  <FolderKanban className="h-5 w-5 text-primary-foreground" />
                </div>
                New Project
              </DialogTitle>
              <DialogDescription className="text-xs">
                Enterprise MLOps Project Setup
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-1 mt-4">
              {steps.map((step) => {
                const Icon = step.icon;
                const isActive = step.id === currentStep;
                const isCompleted = step.id < currentStep;

                return (
                  <button
                    key={step.id}
                    onClick={() => {
                      // Only allow clicking completed steps or next step if current validates
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

            <div className="mt-6">
              <Progress value={(currentStep / steps.length) * 100} className="h-1" />
              <p className="text-xs text-muted-foreground mt-2">
                Step {currentStep} of {steps.length}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-[calc(90vh-120px)] px-6 py-4">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold">{steps[currentStep - 1].name}</h2>
                </div>
                {renderStepContent()}
              </ScrollArea>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border p-4 bg-background">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <div className="flex items-center gap-2">
                {currentStep > 1 && (
                  <Button variant="outline" onClick={prevStep}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                )}
                {currentStep < steps.length ? (
                  <Button 
                    variant="premium" 
                    size="sm"
                    onClick={nextStep}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button variant="premium" onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create Project"}
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
