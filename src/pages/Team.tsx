import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Search,
  Plus,
  Users,
  Shield,
  Mail,
  MoreHorizontal,
  UserCheck,
  Key,
  Info,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const teamMembers = [
  { id: 1, name: "Sarah Chen", email: "sarah.chen@company.com", role: "Admin", department: "Data Science", status: "active", lastActive: "Active now", projects: 8, mfa: true },
  { id: 2, name: "John Doe", email: "john.doe@company.com", role: "Editor", department: "ML Engineering", status: "active", lastActive: "2 hours ago", projects: 5, mfa: true },
  { id: 3, name: "Maria Kim", email: "maria.kim@company.com", role: "Editor", department: "Data Engineering", status: "active", lastActive: "1 hour ago", projects: 6, mfa: true },
  { id: 4, name: "Alex Lee", email: "alex.lee@company.com", role: "Scientist", department: "Research", status: "active", lastActive: "30 min ago", projects: 4, mfa: false },
  { id: 5, name: "Tom Wilson", email: "tom.wilson@company.com", role: "Viewer", department: "Product", status: "invited", lastActive: "Pending", projects: 0, mfa: false },
  { id: 6, name: "Rachel Brown", email: "rachel.brown@company.com", role: "Deployer", department: "DevOps", status: "active", lastActive: "5 hours ago", projects: 3, mfa: true },
  { id: 7, name: "Mike Johnson", email: "mike.johnson@company.com", role: "Editor", department: "ML Engineering", status: "active", lastActive: "1 day ago", projects: 7, mfa: true },
  { id: 8, name: "Emma Davis", email: "emma.davis@company.com", role: "Scientist", department: "Research", status: "active", lastActive: "3 hours ago", projects: 5, mfa: true },
];

const ITEMS_PER_PAGE = 5;

const Team = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("all");

  const filteredMembers = teamMembers.filter((member) => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || 
      (activeTab === "active" && member.status === "active") ||
      (activeTab === "invited" && member.status === "invited") ||
      (activeTab === "admin" && member.role === "Admin");
    return matchesSearch && matchesTab;
  });

  const totalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE);
  const paginatedMembers = filteredMembers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "Admin": return "destructive";
      case "Editor": return "info";
      case "Scientist": return "success";
      case "Deployer": return "warning";
      default: return "secondary";
    }
  };

  const activeCount = teamMembers.filter((m) => m.status === "active").length;
  const adminCount = teamMembers.filter((m) => m.role === "Admin").length;

  return (
    <DashboardLayout>
      <div className="space-y-4 animate-fade-in">
        {/* Header compact */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
              Team Management
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">Manage team members, roles and access permissions for your workspace.</p>
                </TooltipContent>
              </Tooltip>
            </h1>
          </div>
          <Button variant="premium" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        </div>

        {/* Stats compacts */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total Members", value: teamMembers.length, icon: Users, tip: "Total team members in workspace" },
            { label: "Active Now", value: activeCount, icon: UserCheck, color: "text-success", tip: "Members currently online" },
            { label: "Administrators", value: adminCount, icon: Shield, tip: "Members with full access" },
            { label: "Pending Invites", value: 1, icon: Mail, color: "text-warning", tip: "Invitations awaiting response" },
          ].map((stat, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      {stat.label}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent><p className="text-xs">{stat.tip}</p></TooltipContent>
                      </Tooltip>
                    </p>
                    <p className="text-xl font-bold font-display">{stat.value}</p>
                  </div>
                  <stat.icon className={`h-5 w-5 ${stat.color || "text-primary"}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs + Search */}
        <div className="flex items-center justify-between gap-4">
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setCurrentPage(1); }} className="flex-1">
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="all">All ({teamMembers.length})</TabsTrigger>
              <TabsTrigger value="active">Active ({activeCount})</TabsTrigger>
              <TabsTrigger value="invited">Invited (1)</TabsTrigger>
              <TabsTrigger value="admin">Admins ({adminCount})</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-10 bg-muted/50 h-9"
            />
          </div>
        </div>

        {/* Table avec pagination */}
        <Card className="glass-card">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Member</TableHead>
                  <TableHead className="text-muted-foreground">Role</TableHead>
                  <TableHead className="text-muted-foreground">Department</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">
                    <span className="flex items-center gap-1">
                      MFA
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent><p className="text-xs">Multi-Factor Authentication status</p></TooltipContent>
                      </Tooltip>
                    </span>
                  </TableHead>
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedMembers.map((member) => (
                  <TableRow key={member.id} className="border-border/50 hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                          {member.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadge(member.role)} className="text-xs">{member.role}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{member.department}</TableCell>
                    <TableCell>
                      <Badge variant={member.status === "active" ? "success" : "warning"} className="text-xs capitalize">
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {member.mfa ? (
                        <Key className="h-4 w-4 text-success" />
                      ) : (
                        <span className="text-xs text-warning">Off</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Profile</DropdownMenuItem>
                          <DropdownMenuItem>Edit Permissions</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">Remove</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredMembers.length)} of {filteredMembers.length}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <Button
                    key={i + 1}
                    variant={currentPage === i + 1 ? "default" : "outline"}
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rôles - Compact horizontal */}
        <Card className="glass-card">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Role Permissions:</span>
              {[
                { role: "Admin", desc: "Full access", color: "destructive" },
                { role: "Editor", desc: "Create & modify", color: "info" },
                { role: "Scientist", desc: "Run experiments", color: "success" },
                { role: "Deployer", desc: "Deploy models", color: "warning" },
                { role: "Viewer", desc: "Read-only", color: "secondary" },
              ].map((item, i) => (
                <Tooltip key={i}>
                  <TooltipTrigger asChild>
                    <Badge variant={item.color as any} className="cursor-help whitespace-nowrap">{item.role}</Badge>
                  </TooltipTrigger>
                  <TooltipContent><p className="text-xs">{item.desc}</p></TooltipContent>
                </Tooltip>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Team;