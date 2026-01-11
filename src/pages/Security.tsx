import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Shield,
  Lock,
  Key,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Fingerprint,
  ShieldCheck,
  ShieldAlert,
  Users,
  FileWarning,
  Scan,
  RefreshCw,
  Info,
} from "lucide-react";

const vulnerabilities = [
  { id: 1, severity: "critical", title: "Outdated dependency: lodash < 4.17.21", status: "remediated", component: "Backend API" },
  { id: 2, severity: "high", title: "SQL injection vulnerability in query builder", status: "remediated", component: "Data Pipeline" },
  { id: 3, severity: "medium", title: "Missing rate limiting on API endpoints", status: "in-progress", component: "API Gateway" },
  { id: 4, severity: "low", title: "Verbose error messages in production", status: "open", component: "Frontend" },
];

const accessLogs = [
  { user: "alice.johnson@company.com", action: "Model deployment", status: "success", time: "2 min ago" },
  { user: "bob.smith@company.com", action: "Data access", status: "success", time: "5 min ago" },
  { user: "unknown@external.com", action: "API access", status: "blocked", time: "12 min ago" },
  { user: "carol.white@company.com", action: "Secret access", status: "success", time: "18 min ago" },
];

const securityPolicies = [
  { name: "Multi-Factor Auth", status: "enforced", coverage: 100 },
  { name: "Password Complexity", status: "enforced", coverage: 100 },
  { name: "Session Timeout", status: "enforced", coverage: 100 },
  { name: "IP Allowlisting", status: "enabled", coverage: 85 },
  { name: "Data Encryption", status: "enforced", coverage: 100 },
  { name: "Secret Rotation", status: "enabled", coverage: 92 },
];

const Security = () => {
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical": return <Badge variant="destructive">Critical</Badge>;
      case "high": return <Badge variant="destructive" className="bg-orange-500">High</Badge>;
      case "medium": return <Badge variant="warning">Medium</Badge>;
      case "low": return <Badge variant="secondary">Low</Badge>;
      default: return <Badge variant="secondary">{severity}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "remediated": return <Badge variant="success" className="gap-1 text-xs"><CheckCircle className="h-3 w-3" />Fixed</Badge>;
      case "in-progress": return <Badge variant="warning" className="gap-1 text-xs"><RefreshCw className="h-3 w-3" />Progress</Badge>;
      case "open": return <Badge variant="destructive" className="gap-1 text-xs"><AlertTriangle className="h-3 w-3" />Open</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
              Security Center
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">Platform security, access control, threat monitoring and vulnerability management.</p>
                </TooltipContent>
              </Tooltip>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Scan className="h-4 w-4 mr-2" />
              Scan
            </Button>
            <Button variant="premium" size="sm">
              <ShieldCheck className="h-4 w-4 mr-2" />
              Report
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-3">
          <Card className="glass-card border-success/20">
            <CardContent className="py-3">
              <div className="flex items-center justify-between mb-1">
                <ShieldCheck className="h-5 w-5 text-success" />
                <Badge variant="success" className="text-xs">Excellent</Badge>
              </div>
              <p className="text-2xl font-bold font-display">94</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                Security Score
                <Tooltip>
                  <TooltipTrigger asChild><Info className="h-3 w-3 cursor-help" /></TooltipTrigger>
                  <TooltipContent><p className="text-xs">Overall platform security rating</p></TooltipContent>
                </Tooltip>
              </p>
              <Progress value={94} className="h-1 mt-1" />
            </CardContent>
          </Card>

          {[
            { label: "Open Vulns", value: "1", icon: AlertTriangle, color: "text-warning", tip: "Unresolved vulnerabilities" },
            { label: "Blocked (24h)", value: "23", icon: XCircle, color: "text-destructive", tip: "Threats blocked in 24h" },
            { label: "Sessions", value: "156", icon: Users, color: "text-primary", tip: "Active user sessions" },
            { label: "API Keys", value: "42", icon: Key, color: "text-gold", tip: "Active API keys" },
          ].map((stat, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="py-3">
                <stat.icon className={`h-5 w-5 ${stat.color} mb-1`} />
                <p className="text-2xl font-bold font-display">{stat.value}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {stat.label}
                  <Tooltip>
                    <TooltipTrigger asChild><Info className="h-3 w-3 cursor-help" /></TooltipTrigger>
                    <TooltipContent><p className="text-xs">{stat.tip}</p></TooltipContent>
                  </Tooltip>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="overview" className="space-y-3">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="overview" className="gap-1 text-xs">
              <Shield className="h-3.5 w-3.5" />Overview
            </TabsTrigger>
            <TabsTrigger value="vulnerabilities" className="gap-1 text-xs">
              <FileWarning className="h-3.5 w-3.5" />Vulnerabilities
            </TabsTrigger>
            <TabsTrigger value="access" className="gap-1 text-xs">
              <Lock className="h-3.5 w-3.5" />Access Control
            </TabsTrigger>
            <TabsTrigger value="secrets" className="gap-1 text-xs">
              <Key className="h-3.5 w-3.5" />Secrets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {/* Policies */}
              <Card className="glass-card">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    Security Policies
                    <Tooltip>
                      <TooltipTrigger asChild><Info className="h-3 w-3 text-muted-foreground cursor-help" /></TooltipTrigger>
                      <TooltipContent><p className="text-xs">Security policy enforcement status</p></TooltipContent>
                    </Tooltip>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <div className="space-y-2">
                    {securityPolicies.map((policy, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/30">
                        <div className="flex items-center gap-2">
                          <CheckCircle className={`h-3.5 w-3.5 ${policy.status === "enforced" ? "text-success" : "text-warning"}`} />
                          <span className="text-xs">{policy.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{policy.coverage}%</span>
                          <Badge variant={policy.status === "enforced" ? "success" : "warning"} className="text-xs h-5">
                            {policy.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Access */}
              <Card className="glass-card">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-sm font-medium">Recent Access Activity</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <div className="space-y-2">
                    {accessLogs.map((log, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/30">
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded-full ${log.status === "blocked" ? "bg-destructive/20" : "bg-success/20"}`}>
                            {log.status === "blocked" ? (
                              <XCircle className="h-3 w-3 text-destructive" />
                            ) : (
                              <CheckCircle className="h-3 w-3 text-success" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-medium truncate max-w-32">{log.user.split("@")[0]}</p>
                            <p className="text-xs text-muted-foreground">{log.action}</p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">{log.time}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="vulnerabilities" className="space-y-3">
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="space-y-2">
                  {vulnerabilities.map((vuln) => (
                    <div key={vuln.id} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getSeverityBadge(vuln.severity)}
                          <span className="text-sm font-medium">{vuln.title}</span>
                        </div>
                        {getStatusBadge(vuln.status)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Component: {vuln.component}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="access" className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Card className="glass-card">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Fingerprint className="h-4 w-4 text-primary" />
                    Authentication Methods
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <div className="space-y-2">
                    {[
                      { method: "SSO (SAML 2.0)", users: 145 },
                      { method: "Multi-Factor Auth", users: 156 },
                      { method: "API Key Auth", users: 42 },
                      { method: "Service Tokens", users: 18 },
                    ].map((auth, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/30">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-3.5 w-3.5 text-success" />
                          <span className="text-xs">{auth.method}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">{auth.users} users</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Lock className="h-4 w-4 text-success" />
                    Role-Based Access
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <div className="space-y-2">
                    {[
                      { role: "Platform Admin", users: 3, permissions: "Full access" },
                      { role: "Data Scientist", users: 45, permissions: "Models, Data" },
                      { role: "ML Engineer", users: 32, permissions: "Deployments" },
                      { role: "Viewer", users: 48, permissions: "Read-only" },
                    ].map((role, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/30">
                        <div>
                          <p className="text-xs font-medium">{role.role}</p>
                          <p className="text-xs text-muted-foreground">{role.permissions}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">{role.users}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="secrets" className="space-y-3">
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="space-y-2">
                  {[
                    { name: "AWS Production Credentials", rotated: "5 days ago", expires: "85 days" },
                    { name: "Database Connection String", rotated: "12 days ago", expires: "78 days" },
                    { name: "API Gateway Keys", rotated: "3 days ago", expires: "87 days" },
                    { name: "Encryption Keys", rotated: "1 day ago", expires: "89 days" },
                  ].map((secret, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{secret.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">Rotated: {secret.rotated}</span>
                        <Badge variant="success" className="text-xs">Expires: {secret.expires}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Security;