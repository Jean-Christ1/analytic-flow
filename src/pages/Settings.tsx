import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  User,
  Bell,
  Shield,
  CreditCard,
  Key,
  Palette,
  CheckCircle,
  ExternalLink,
  Info,
  Coins,
} from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

const Settings = () => {
  const { currency, setCurrency, currencies, formatCurrency, getSymbol } = useCurrency();

  return (
    <DashboardLayout>
      <div className="space-y-4 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
            Settings
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">Manage your account, security, notifications, and platform preferences.</p>
              </TooltipContent>
            </Tooltip>
          </h1>
        </div>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="bg-muted/50 p-1 flex-wrap h-auto">
            <TabsTrigger value="profile" className="text-xs">Profile</TabsTrigger>
            <TabsTrigger value="security" className="text-xs">Security</TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs">Notifications</TabsTrigger>
            <TabsTrigger value="billing" className="text-xs">Billing</TabsTrigger>
            <TabsTrigger value="api" className="text-xs">API Keys</TabsTrigger>
            <TabsTrigger value="preferences" className="text-xs">Preferences</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <Card className="glass-card">
              <CardHeader className="pb-3 pt-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary">
                    SC
                  </div>
                  <div>
                    <Button variant="outline" size="sm">Change Avatar</Button>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG or GIF. Max 2MB</p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">First Name</Label>
                    <Input defaultValue="Sarah" className="h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Last Name</Label>
                    <Input defaultValue="Chen" className="h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Email</Label>
                    <Input defaultValue="sarah.chen@company.com" type="email" className="h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Department</Label>
                    <Input defaultValue="Data Science" className="h-9" />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button variant="premium" size="sm">Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4">
            <Card className="glass-card">
              <CardHeader className="pb-3 pt-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Key className="h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium text-sm">Two-Factor Authentication</p>
                      <p className="text-xs text-muted-foreground">Extra security layer</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="success" className="text-xs">Enabled</Badge>
                    <Switch defaultChecked />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium text-sm">Password</p>
                    <p className="text-xs text-muted-foreground">Changed 30 days ago</p>
                  </div>
                  <Button variant="outline" size="sm">Change</Button>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium text-sm">Active Sessions</p>
                    <p className="text-xs text-muted-foreground">3 devices logged in</p>
                  </div>
                  <Button variant="outline" size="sm">Manage</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <Card className="glass-card">
              <CardHeader className="pb-3 pt-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { title: "Experiment Completed", enabled: true },
                  { title: "Model Deployed", enabled: true },
                  { title: "Drift Detected", enabled: true },
                  { title: "Team Activity", enabled: false },
                  { title: "Weekly Reports", enabled: true },
                  { title: "Security Alerts", enabled: true },
                ].map((notif, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                    <p className="text-sm">{notif.title}</p>
                    <Switch defaultChecked={notif.enabled} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-4">
            <Card className="glass-card">
              <CardContent className="py-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-primary/10 to-gold/10 border border-primary/20">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold font-display">Enterprise Plan</h3>
                      <Badge variant="success" className="text-xs">Active</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{formatCurrency(5000)}/month</p>
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <span className="flex items-center gap-1 text-success">
                        <CheckCircle className="h-3 w-3" />Unlimited users
                      </span>
                      <span className="flex items-center gap-1 text-success">
                        <CheckCircle className="h-3 w-3" />Priority support
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Manage <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="text-sm font-medium">Usage This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Compute Hours", used: "2,450", limit: "5,000", percent: 49 },
                    { label: "Storage", used: "1.2 TB", limit: "5 TB", percent: 24 },
                    { label: "API Calls", used: "850K", limit: "2M", percent: 42 },
                  ].map((usage, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">{usage.label}</p>
                      <p className="text-lg font-bold font-display">{usage.used}</p>
                      <p className="text-xs text-muted-foreground">of {usage.limit}</p>
                      <div className="mt-1 h-1 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${usage.percent}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="api" className="space-y-4">
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2 pt-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Key className="h-4 w-4 text-primary" />
                  API Keys
                </CardTitle>
                <Button variant="premium" size="sm">Create Key</Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { name: "Production API Key", key: "fed_prod_*****_x7k2", lastUsed: "2 hours ago" },
                    { name: "Development Key", key: "fed_dev_*****_m3n1", lastUsed: "5 days ago" },
                    { name: "CI/CD Pipeline", key: "fed_ci_*****_p9w4", lastUsed: "1 hour ago" },
                  ].map((apiKey, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div>
                        <p className="font-medium text-sm">{apiKey.name}</p>
                        <p className="text-xs font-mono text-muted-foreground">{apiKey.key}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">{apiKey.lastUsed}</span>
                        <Button variant="destructive" size="sm" className="h-7">Revoke</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Appearance */}
              <Card className="glass-card">
                <CardHeader className="pb-2 pt-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Palette className="h-4 w-4 text-primary" />
                    Appearance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                    <span className="text-sm">Theme</span>
                    <div className="flex items-center gap-1">
                      <Button variant="secondary" size="sm" className="h-7">Dark</Button>
                      <Button variant="ghost" size="sm" className="h-7">Light</Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                    <span className="text-sm">Compact Mode</span>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                    <span className="text-sm">Animations</span>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>

              {/* Currency */}
              <Card className="glass-card">
                <CardHeader className="pb-2 pt-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Coins className="h-4 w-4 text-primary" />
                    Currency
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">Amounts are stored in EUR and converted using daily exchange rates.</p>
                      </TooltipContent>
                    </Tooltip>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Display Currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <ScrollArea className="h-48">
                          {currencies.map((c) => (
                            <SelectItem key={c.code} value={c.code}>
                              <span className="font-mono text-xs w-6 inline-block">{c.symbol}</span>
                              {c.name} ({c.code})
                            </SelectItem>
                          ))}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">Preview</p>
                    <p className="text-lg font-bold font-display">{formatCurrency(1234.56)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;