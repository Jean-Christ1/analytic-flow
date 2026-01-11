import { useState } from "react";
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
import { 
  Users, 
  Mail, 
  Plus, 
  X, 
  Shield, 
  Eye,
  Building,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { projects } from "@/data/platformData";
import { WizardLayout, WizardStep } from "@/components/ui/wizard-layout";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const roles = [
  { value: "viewer", label: "Viewer", desc: "Read-only access to assigned projects", color: "secondary" },
  { value: "scientist", label: "Scientist", desc: "Run experiments and view results", color: "success" },
  { value: "deployer", label: "Deployer", desc: "Deploy and manage model endpoints", color: "warning" },
  { value: "editor", label: "Editor", desc: "Create and modify projects, experiments, models", color: "info" },
  { value: "admin", label: "Admin", desc: "Full access to all resources and settings", color: "destructive" },
];

const departments = [
  "Data Science",
  "ML Engineering",
  "Data Engineering",
  "Research",
  "Product",
  "DevOps",
  "Security",
];

const steps: WizardStep[] = [
  { id: 1, name: "Recipients", icon: Mail },
  { id: 2, name: "Role & Access", icon: Shield },
  { id: 3, name: "Projects", icon: Building },
  { id: 4, name: "Summary", icon: Eye },
];

export const InviteMemberDialog = ({ open, onOpenChange }: InviteMemberDialogProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    emails: [] as string[],
    currentEmail: "",
    role: "",
    department: "",
    selectedProjects: [] as string[],
    message: "",
  });

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddEmail = () => {
    const email = formData.currentEmail.trim().toLowerCase();
    if (!email) return;
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    if (formData.emails.includes(email)) {
      toast.error("Email already added");
      return;
    }
    
    updateFormData("emails", [...formData.emails, email]);
    updateFormData("currentEmail", "");
  };

  const handleRemoveEmail = (email: string) => {
    updateFormData("emails", formData.emails.filter((e) => e !== email));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddEmail();
    }
  };

  const handleProjectToggle = (projectId: string) => {
    const newProjects = formData.selectedProjects.includes(projectId)
      ? formData.selectedProjects.filter((p) => p !== projectId)
      : [...formData.selectedProjects, projectId];
    updateFormData("selectedProjects", newProjects);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return formData.emails.length > 0;
      case 2:
        return !!formData.role;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      if (currentStep === 1) toast.error("Please add at least one email address");
      else if (currentStep === 2) toast.error("Please select a role");
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
    
    toast.success(`Invitation${formData.emails.length > 1 ? "s" : ""} sent successfully!`, {
      description: `${formData.emails.length} member${formData.emails.length > 1 ? "s" : ""} invited.`,
    });
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      emails: [],
      currentEmail: "",
      role: "",
      department: "",
      selectedProjects: [],
      message: "",
    });
    setCurrentStep(1);
    setIsSubmitting(false);
  };

  const selectedRole = roles.find((r) => r.value === formData.role);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Email Addresses <span className="text-destructive">*</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">Press Enter or click + to add multiple emails</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="colleague@company.com"
                  value={formData.currentEmail}
                  onChange={(e) => updateFormData("currentEmail", e.target.value)}
                  onKeyDown={handleKeyDown}
                  type="email"
                />
                <Button variant="outline" onClick={handleAddEmail}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {formData.emails.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                  {formData.emails.map((email) => (
                    <Badge key={email} variant="secondary" className="gap-1 py-1">
                      <Mail className="h-3 w-3" />
                      {email}
                      <button
                        onClick={() => handleRemoveEmail(email)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Personal Message (Optional)</Label>
              <Textarea
                placeholder="Add a personal note to the invitation..."
                value={formData.message}
                onChange={(e) => updateFormData("message", e.target.value)}
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
                  Role <span className="text-destructive">*</span>
                </Label>
                <Select value={formData.role} onValueChange={(v) => updateFormData("role", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        <div className="flex items-center gap-2">
                          <Badge variant={r.color as any} className="text-xs">
                            {r.label}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedRole && (
                  <p className="text-xs text-muted-foreground">{selectedRole.desc}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={formData.department} onValueChange={(v) => updateFormData("department", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedRole && (
              <div className="p-3 rounded-lg border border-primary/30 bg-primary/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{selectedRole.label}</p>
                    <p className="text-xs text-muted-foreground">{selectedRole.desc}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Project Access
              </Label>
              <p className="text-xs text-muted-foreground">
                {formData.role === "admin" 
                  ? "Admins have access to all projects automatically."
                  : "Select which projects this member can access."
                }
              </p>
              
              {formData.role !== "admin" && (
                <div className="flex flex-wrap gap-2 p-4 rounded-lg bg-muted/30 border border-border/50">
                  {projects.map((project) => (
                    <Badge
                      key={project.id}
                      variant={formData.selectedProjects.includes(project.id) ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/20 transition-colors"
                      onClick={() => handleProjectToggle(project.id)}
                    >
                      {project.name}
                    </Badge>
                  ))}
                </div>
              )}

              {formData.role === "admin" && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
                  <Shield className="h-4 w-4 text-warning" />
                  <p className="text-sm text-warning">
                    Admin users have full access to all resources and settings.
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-border bg-muted/20">
              <h4 className="font-medium text-sm mb-3">Invitation Summary</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="col-span-2">
                  <p className="text-muted-foreground text-xs">Recipients</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {formData.emails.map(email => (
                      <Badge key={email} variant="secondary" className="text-xs">
                        {email}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Role</p>
                  {selectedRole && (
                    <Badge variant={selectedRole.color as any} className="text-xs mt-1">
                      {selectedRole.label}
                    </Badge>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Department</p>
                  <p className="font-medium">{formData.department || "—"}</p>
                </div>
                {formData.role !== "admin" && formData.selectedProjects.length > 0 && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs">Project Access</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {formData.selectedProjects.map(pId => (
                        <Badge key={pId} variant="outline" className="text-xs">
                          {projects.find(p => p.id === pId)?.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
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
      title="Invite Members"
      description="Team Collaboration"
      icon={Users}
      iconClassName="bg-primary/20 text-primary"
      steps={steps}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      canProceed={validateStep}
      onNext={handleNext}
      onPrev={handlePrev}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel="Send Invitations"
    >
      {renderStepContent()}
    </WizardLayout>
  );
};
