import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Shield,
  Users,
  Settings,
  Eye,
  Edit,
  Trash2,
  ChevronRight,
  Lock,
  CheckCircle,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { AccessDenied } from "@/components/governance/AccessDenied";

const systemRoles = [
  { 
    id: "admin", 
    name: "Admin", 
    description: "Full platform access with all permissions",
    users: 3,
    permissions: 48,
    isSystem: true,
    color: "text-destructive"
  },
  { 
    id: "moderator", 
    name: "Moderator", 
    description: "Can manage content and moderate users",
    users: 8,
    permissions: 32,
    isSystem: true,
    color: "text-warning"
  },
  { 
    id: "user", 
    name: "User", 
    description: "Standard user with project access",
    users: 124,
    permissions: 18,
    isSystem: true,
    color: "text-primary"
  },
  { 
    id: "viewer", 
    name: "Viewer", 
    description: "Read-only access to shared resources",
    users: 21,
    permissions: 6,
    isSystem: true,
    color: "text-muted-foreground"
  },
];

const customRoles = [
  { 
    id: "data-scientist", 
    name: "Data Scientist", 
    description: "Access to experiments, models and data",
    users: 45,
    permissions: 24,
    isSystem: false,
  },
  { 
    id: "ml-engineer", 
    name: "ML Engineer", 
    description: "Full MLOps pipeline access",
    users: 18,
    permissions: 28,
    isSystem: false,
  },
  { 
    id: "compliance-officer", 
    name: "Compliance Officer", 
    description: "Audit and compliance management",
    users: 4,
    permissions: 15,
    isSystem: false,
  },
];

const RolesManagement = () => {
  const { isAdmin, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <AccessDenied 
          title="Access Restricted"
          message="Role management is restricted to administrators only. Contact your system administrator for access."
        />
      </DashboardLayout>
    );
  }
  return (
    <DashboardLayout>
      <div className="h-full flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Roles Management</h1>
            <p className="text-muted-foreground text-sm">Define roles and permission sets</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Role
          </Button>
        </div>

        {/* System Roles */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">System Roles</h2>
            <Badge variant="outline" className="text-xs">Protected</Badge>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {systemRoles.map((role) => (
              <Card key={role.id} className="bg-card/50 hover:bg-card/80 transition-colors cursor-pointer group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg bg-muted ${role.color}`}>
                        <Shield className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm">{role.name}</h3>
                          <Lock className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{role.description}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {role.users} users
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            {role.permissions} permissions
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Custom Roles */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Custom Roles</h2>
            <Badge variant="secondary" className="text-xs">{customRoles.length} roles</Badge>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {customRoles.map((role) => (
              <Card key={role.id} className="bg-card/50 hover:bg-card/80 transition-colors cursor-pointer group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Shield className="h-4 w-4 text-primary" />
                      </div>
                      <h3 className="font-semibold text-sm">{role.name}</h3>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{role.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {role.users}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        {role.permissions}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RolesManagement;
