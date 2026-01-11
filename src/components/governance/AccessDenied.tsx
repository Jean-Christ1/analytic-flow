import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface AccessDeniedProps {
  title?: string;
  message?: string;
}

export const AccessDenied = ({
  title = "Access Denied",
  message = "You don't have permission to access this page. Please contact your administrator if you believe this is an error."
}: AccessDeniedProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
        <ShieldX className="h-10 w-10 text-destructive" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
      <p className="text-muted-foreground max-w-md mb-6">{message}</p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go Back
        </Button>
        <Button onClick={() => navigate("/dashboard")}>
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
};
