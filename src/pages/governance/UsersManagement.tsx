import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Plus, 
  Filter, 
  MoreHorizontal,
  Shield,
  UserCheck,
  UserX,
  Clock,
  Users,
  Mail,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { AccessDenied } from "@/components/governance/AccessDenied";

const mockUsers = [
  { id: "1", name: "Sarah Chen", email: "sarah.chen@company.com", role: "Admin", status: "active", lastActive: "2 min ago", avatar: "SC" },
  { id: "2", name: "Marcus Johnson", email: "marcus.j@company.com", role: "Data Scientist", status: "active", lastActive: "15 min ago", avatar: "MJ" },
  { id: "3", name: "Elena Rodriguez", email: "e.rodriguez@company.com", role: "ML Engineer", status: "active", lastActive: "1 hour ago", avatar: "ER" },
  { id: "4", name: "David Kim", email: "d.kim@company.com", role: "Viewer", status: "inactive", lastActive: "3 days ago", avatar: "DK" },
  { id: "5", name: "Anna Müller", email: "a.muller@company.com", role: "Moderator", status: "pending", lastActive: "Never", avatar: "AM" },
];

const stats = [
  { label: "Total Users", value: "156", icon: Users, trend: "+12 this month" },
  { label: "Active Now", value: "23", icon: UserCheck, trend: "14% of total" },
  { label: "Pending Invites", value: "8", icon: Mail, trend: "Awaiting response" },
  { label: "Deactivated", value: "5", icon: UserX, trend: "Last 30 days" },
];

const UsersManagement = () => {
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
          message="User management is restricted to administrators only. Contact your system administrator for access."
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
            <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground text-sm">Manage platform users and access</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Invite User
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="bg-card/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Content */}
        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search users..." className="pl-9 w-64" />
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-3.5 w-3.5" />
                  Filter
                </Button>
              </div>
              <Tabs defaultValue="all" className="w-auto">
                <TabsList className="h-8">
                  <TabsTrigger value="all" className="text-xs px-3">All</TabsTrigger>
                  <TabsTrigger value="active" className="text-xs px-3">Active</TabsTrigger>
                  <TabsTrigger value="pending" className="text-xs px-3">Pending</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="flex-1 pt-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[300px]">User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockUsers.map((user) => (
                  <TableRow key={user.id} className="cursor-pointer">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user.email}`} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">{user.avatar}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        <Shield className="h-3 w-3 mr-1" />
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={user.status === "active" ? "default" : user.status === "pending" ? "secondary" : "outline"}
                        className={user.status === "active" ? "bg-success/20 text-success hover:bg-success/30" : ""}
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                        <Clock className="h-3 w-3" />
                        {user.lastActive}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Profile</DropdownMenuItem>
                          <DropdownMenuItem>Edit Permissions</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">Deactivate</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default UsersManagement;
