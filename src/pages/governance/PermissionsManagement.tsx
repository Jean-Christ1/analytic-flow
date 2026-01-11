import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  Search,
  Shield,
  Database,
  Box,
  Server,
  FolderKanban,
  Activity,
  Users,
  Settings,
  Lock,
  Eye,
  Edit,
  Trash2,
  Plus,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { AccessDenied } from "@/components/governance/AccessDenied";

const permissionCategories = [
  {
    id: "projects",
    name: "Projects",
    icon: FolderKanban,
    permissions: [
      { id: "projects.view", name: "View Projects", enabled: true },
      { id: "projects.create", name: "Create Projects", enabled: true },
      { id: "projects.edit", name: "Edit Projects", enabled: true },
      { id: "projects.delete", name: "Delete Projects", enabled: false },
      { id: "projects.archive", name: "Archive Projects", enabled: true },
    ]
  },
  {
    id: "data",
    name: "Data",
    icon: Database,
    permissions: [
      { id: "data.view", name: "View Datasets", enabled: true },
      { id: "data.upload", name: "Upload Data", enabled: true },
      { id: "data.delete", name: "Delete Data", enabled: false },
      { id: "data.export", name: "Export Data", enabled: true },
    ]
  },
  {
    id: "models",
    name: "Models",
    icon: Box,
    permissions: [
      { id: "models.view", name: "View Models", enabled: true },
      { id: "models.create", name: "Create Models", enabled: true },
      { id: "models.deploy", name: "Deploy Models", enabled: false },
      { id: "models.delete", name: "Delete Models", enabled: false },
    ]
  },
  {
    id: "compute",
    name: "Compute",
    icon: Server,
    permissions: [
      { id: "compute.view", name: "View Resources", enabled: true },
      { id: "compute.launch", name: "Launch Workspaces", enabled: true },
      { id: "compute.terminate", name: "Terminate Jobs", enabled: false },
      { id: "compute.config", name: "Configure Clusters", enabled: false },
    ]
  },
  {
    id: "governance",
    name: "Governance",
    icon: Shield,
    permissions: [
      { id: "gov.audit", name: "View Audit Logs", enabled: false },
      { id: "gov.users", name: "Manage Users", enabled: false },
      { id: "gov.roles", name: "Manage Roles", enabled: false },
      { id: "gov.compliance", name: "View Compliance", enabled: false },
    ]
  },
];

const PermissionsManagement = () => {
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
          message="Permissions management is restricted to administrators only. Contact your system administrator for access."
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
            <h1 className="text-2xl font-bold tracking-tight">Permissions</h1>
            <p className="text-muted-foreground text-sm">Configure granular access controls</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2">
              <Users className="h-4 w-4" />
              Simulate Access
            </Button>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Policy
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex gap-6">
          {/* Role Selector */}
          <Card className="w-64 flex-shrink-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Select Role</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="space-y-1">
                {["Admin", "Moderator", "User", "Viewer", "Data Scientist", "ML Engineer"].map((role, i) => (
                  <Button 
                    key={role} 
                    variant={i === 4 ? "secondary" : "ghost"} 
                    className="w-full justify-start text-sm h-9"
                  >
                    <Shield className="h-3.5 w-3.5 mr-2" />
                    {role}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Permissions Grid */}
          <Card className="flex-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    Data Scientist Permissions
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">24 permissions enabled</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search permissions..." className="pl-9 w-56 h-8" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-4">
                {permissionCategories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <Card key={category.id} className="bg-muted/30">
                      <CardHeader className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-primary" />
                          <span className="font-medium text-sm">{category.name}</span>
                          <Badge variant="outline" className="ml-auto text-xs">
                            {category.permissions.filter(p => p.enabled).length}/{category.permissions.length}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="py-2 px-4 space-y-2">
                        {category.permissions.map((perm) => (
                          <div key={perm.id} className="flex items-center justify-between py-1">
                            <div className="flex items-center gap-2">
                              {perm.enabled ? (
                                <Eye className="h-3 w-3 text-muted-foreground" />
                              ) : (
                                <Lock className="h-3 w-3 text-muted-foreground" />
                              )}
                              <span className="text-xs">{perm.name}</span>
                            </div>
                            <Switch checked={perm.enabled} className="scale-75" />
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PermissionsManagement;
