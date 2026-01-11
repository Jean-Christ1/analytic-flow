import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  FileUp, 
  X, 
  CheckCircle, 
  Box,
  Settings,
  Eye,
  FileText,
  Folder,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { projects } from "@/data/platformData";
import { cn } from "@/lib/utils";
import { WizardLayout, WizardStep } from "@/components/ui/wizard-layout";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface UploadModelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const frameworks = [
  "TensorFlow",
  "PyTorch",
  "Scikit-learn",
  "XGBoost",
  "ONNX",
  "Keras",
  "LightGBM",
];

const fileFormats = [
  ".pkl",
  ".h5",
  ".pt",
  ".pth",
  ".onnx",
  ".joblib",
  ".pmml",
  ".savedmodel",
];

const steps: WizardStep[] = [
  { id: 1, name: "Identification", icon: Box },
  { id: 2, name: "Configuration", icon: Settings },
  { id: 3, name: "Upload", icon: Upload },
  { id: 4, name: "Summary", icon: Eye },
];

export const UploadModelDialog = ({ open, onOpenChange }: UploadModelDialogProps) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const [formData, setFormData] = useState({
    modelName: "",
    version: "1.0.0",
    projectId: "",
    framework: "",
    description: "",
    file: null as File | null,
  });

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!formData.modelName.trim();
      case 2:
        return !!formData.projectId && !!formData.framework;
      case 3:
        return !!formData.file;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      if (currentStep === 1) toast.error("Model name is required");
      else if (currentStep === 2) toast.error("Please select project and framework");
      else if (currentStep === 3) toast.error("Please upload a model file");
      return;
    }
    if (currentStep < steps.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      updateFormData("file", droppedFile);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      updateFormData("file", selectedFile);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleSubmit = async () => {
    setIsUploading(true);
    
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      setUploadProgress(i);
    }
    
    toast.success(`Model "${formData.modelName}" registered successfully!`);
    onOpenChange(false);
    resetForm();
    navigate("/models");
  };

  const resetForm = () => {
    setFormData({
      modelName: "",
      version: "1.0.0",
      projectId: "",
      framework: "",
      description: "",
      file: null,
    });
    setCurrentStep(1);
    setUploadProgress(0);
    setIsUploading(false);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Model Name <span className="text-destructive">*</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">Give your model a unique, descriptive name for easy identification</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                placeholder="e.g., fraud-detector"
                value={formData.modelName}
                onChange={(e) => updateFormData("modelName", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Version</Label>
              <Input
                placeholder="1.0.0"
                value={formData.version}
                onChange={(e) => updateFormData("version", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Semantic version (e.g., 1.0.0)</p>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe the model purpose, training details..."
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
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4" />
                        {p.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                Framework <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.framework} onValueChange={(v) => updateFormData("framework", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select framework" />
                </SelectTrigger>
                <SelectContent>
                  {frameworks.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.framework && (
              <div className="p-3 rounded-lg border border-primary/30 bg-primary/5">
                <p className="text-sm font-medium mb-1">Compatible formats for {formData.framework}:</p>
                <div className="flex flex-wrap gap-1">
                  {fileFormats.slice(0, 4).map((format) => (
                    <Badge key={format} variant="secondary" className="text-xs">
                      {format}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>
                Model File <span className="text-destructive">*</span>
              </Label>
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                  isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                  formData.file && "border-success bg-success/5"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {formData.file ? (
                  <div className="flex items-center justify-center gap-4">
                    <div className="p-3 rounded-lg bg-success/10">
                      <CheckCircle className="h-6 w-6 text-success" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-sm">{formData.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(formData.file.size)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => updateFormData("file", null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <FileUp className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-foreground font-medium text-sm mb-1">
                      Drag and drop your model file here
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                      or click to browse
                    </p>
                    <input
                      type="file"
                      className="hidden"
                      id="model-file"
                      accept={fileFormats.join(",")}
                      onChange={handleFileChange}
                    />
                    <label htmlFor="model-file">
                      <Button variant="outline" size="sm" asChild>
                        <span>Browse Files</span>
                      </Button>
                    </label>
                    <div className="flex flex-wrap justify-center gap-1 mt-3">
                      {fileFormats.map((format) => (
                        <Badge key={format} variant="secondary" className="text-xs">
                          {format}
                        </Badge>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-border bg-muted/20">
              <h4 className="font-medium text-sm mb-3">Model Summary</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Model Name</p>
                  <p className="font-medium">{formData.modelName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Version</p>
                  <Badge variant="outline" className="text-xs">{formData.version}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Project</p>
                  <p className="font-medium">{projects.find(p => p.id === formData.projectId)?.name || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Framework</p>
                  <Badge variant="secondary" className="text-xs">{formData.framework}</Badge>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground text-xs">File</p>
                  <div className="flex items-center gap-2 mt-1">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium text-sm">{formData.file?.name}</p>
                    <span className="text-muted-foreground text-xs">
                      ({formData.file ? formatFileSize(formData.file.size) : "—"})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-info/10 border border-info/20">
              <CheckCircle className="h-4 w-4 text-info" />
              <p className="text-xs text-info">
                Model will be registered to the model registry with version tracking enabled
              </p>
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
      title="Register Model"
      description="Model Registry"
      icon={Upload}
      iconClassName="bg-info/20 text-info"
      steps={steps}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      canProceed={validateStep}
      onNext={handleNext}
      onPrev={handlePrev}
      onSubmit={handleSubmit}
      isSubmitting={isUploading}
      submitLabel="Register"
    >
      {renderStepContent()}
    </WizardLayout>
  );
};
