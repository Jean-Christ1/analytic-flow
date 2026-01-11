import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, ChevronLeft, ChevronRight, Loader2, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WizardStep {
  id: number;
  name: string;
  icon: LucideIcon;
}

interface WizardLayoutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  icon: LucideIcon;
  iconClassName?: string;
  steps: WizardStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  canProceed: (step: number) => boolean;
  onNext: () => void;
  onPrev: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  children: ReactNode;
}

export const WizardLayout = ({
  open,
  onOpenChange,
  title,
  description,
  icon: HeaderIcon,
  iconClassName = "bg-primary/20 text-primary",
  steps,
  currentStep,
  onStepChange,
  canProceed,
  onNext,
  onPrev,
  onSubmit,
  isSubmitting = false,
  submitLabel = "Create",
  children,
}: WizardLayoutProps) => {
  const progress = (currentStep / steps.length) * 100;
  const isLastStep = currentStep === steps.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-56 border-r border-border bg-muted/30 p-5 shrink-0 flex flex-col">
            <DialogHeader className="pb-4">
              <DialogTitle className="flex items-center gap-2.5 text-base">
                <div className={cn("p-2 rounded-lg", iconClassName)}>
                  <HeaderIcon className="h-4 w-4" />
                </div>
                {title}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {description}
              </DialogDescription>
            </DialogHeader>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>

            {/* Steps */}
            <nav className="space-y-1 flex-1">
              {steps.map((step) => {
                const Icon = step.icon;
                const isActive = step.id === currentStep;
                const isCompleted = step.id < currentStep;
                const isClickable = isCompleted || (step.id === currentStep + 1 && canProceed(currentStep));

                return (
                  <button
                    key={step.id}
                    onClick={() => {
                      if (isClickable || isActive) {
                        onStepChange(step.id);
                      }
                    }}
                    disabled={!isClickable && !isActive && !isCompleted}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all text-sm",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md"
                        : isCompleted
                        ? "text-foreground hover:bg-muted cursor-pointer"
                        : "text-muted-foreground/60 cursor-not-allowed"
                    )}
                  >
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0",
                        isActive
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : isCompleted
                          ? "bg-success text-success-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {isCompleted ? <Check className="h-3.5 w-3.5" /> : step.id}
                    </div>
                    <span className="truncate">{step.name}</span>
                  </button>
                );
              })}
            </nav>

            {/* Step indicator */}
            <div className="pt-4 border-t border-border mt-4">
              <p className="text-xs text-muted-foreground text-center">
                Step {currentStep} of {steps.length}
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Step Title */}
            <div className="px-6 pt-5 pb-3 border-b border-border bg-background">
              <div className="flex items-center gap-2">
                {(() => {
                  const StepIcon = steps[currentStep - 1]?.icon;
                  return StepIcon ? <StepIcon className="h-5 w-5 text-primary" /> : null;
                })()}
                <h3 className="font-semibold text-lg">{steps[currentStep - 1]?.name}</h3>
              </div>
            </div>

            {/* Scrollable Content */}
            <ScrollArea className="flex-1 px-6 py-5">
              {children}
            </ScrollArea>

            {/* Footer - Fixed position */}
            <div className="px-6 py-4 border-t border-border bg-background flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <div className="flex gap-2">
                {currentStep > 1 && (
                  <Button variant="outline" onClick={onPrev} disabled={isSubmitting}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                )}
                {isLastStep ? (
                  <Button onClick={onSubmit} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      submitLabel
                    )}
                  </Button>
                ) : (
                  <Button onClick={onNext}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
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
