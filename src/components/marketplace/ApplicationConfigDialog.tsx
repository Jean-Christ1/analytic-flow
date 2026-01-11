import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings,
  Save,
  RotateCcw,
  Server,
  Shield,
  Database,
  Network,
  Cpu,
  MemoryStick,
  HardDrive,
  Key,
  Globe,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Info,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";

interface ApplicationConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appName: string;
}

export const ApplicationConfigDialog = ({
  open,
  onOpenChange,
  appName,
}: ApplicationConfigDialogProps) => {
  const [activeTab, setActiveTab] = useState("general");
  const [hasChanges, setHasChanges] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);

  // General Settings
  const [displayName, setDisplayName] = useState(appName);
  const [description, setDescription] = useState("Application description");
  const [autoRestart, setAutoRestart] = useState(true);
  const [healthCheck, setHealthCheck] = useState(true);

  // Resource Settings
  const [cpuLimit, setCpuLimit] = useState([2]);
  const [memoryLimit, setMemoryLimit] = useState([4]);
  const [storageLimit, setStorageLimit] = useState([20]);
  const [replicas, setReplicas] = useState("1");

  // Network Settings
  const [port, setPort] = useState("5000");
  const [protocol, setProtocol] = useState("HTTP");
  const [publicAccess, setPublicAccess] = useState(false);
  const [customDomain, setCustomDomain] = useState("");

  // Security Settings
  const [tlsEnabled, setTlsEnabled] = useState(true);
  const [authEnabled, setAuthEnabled] = useState(true);
  const [apiKeyRequired, setApiKeyRequired] = useState(false);

  // Environment Variables
  const [envVars, setEnvVars] = useState([
    { key: "DATABASE_URL", value: "postgres://user:pass@localhost:5432/db", isSecret: true },
    { key: "REDIS_URL", value: "redis://localhost:6379", isSecret: true },
    { key: "LOG_LEVEL", value: "INFO", isSecret: false },
    { key: "API_KEY", value: "your-api-key-here", isSecret: true },
  ]);

  const handleSave = () => {
    toast.success("Configuration saved successfully");
    setHasChanges(false);
  };

  const handleReset = () => {
    toast.info("Configuration reset to defaults");
    setHasChanges(false);
  };

  const handleChange = () => {
    setHasChanges(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Configure - {appName}
          </DialogTitle>
          <DialogDescription>
            Manage application settings, resources, and environment variables
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="general" className="text-xs">
              <Server className="h-3 w-3 mr-1" />
              General
            </TabsTrigger>
            <TabsTrigger value="resources" className="text-xs">
              <Cpu className="h-3 w-3 mr-1" />
              Resources
            </TabsTrigger>
            <TabsTrigger value="network" className="text-xs">
              <Network className="h-3 w-3 mr-1" />
              Network
            </TabsTrigger>
            <TabsTrigger value="security" className="text-xs">
              <Shield className="h-3 w-3 mr-1" />
              Security
            </TabsTrigger>
            <TabsTrigger value="environment" className="text-xs">
              <Key className="h-3 w-3 mr-1" />
              Environment
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px] mt-4">
            {/* General Tab */}
            <TabsContent value="general" className="space-y-4 pr-4">
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Basic Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Display Name</Label>
                      <Input
                        value={displayName}
                        onChange={(e) => { setDisplayName(e.target.value); handleChange(); }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Instance ID</Label>
                      <Input value="inst-abc123" disabled className="bg-muted/50" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => { setDescription(e.target.value); handleChange(); }}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Lifecycle Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Auto-restart on failure</p>
                      <p className="text-xs text-muted-foreground">Automatically restart if the application crashes</p>
                    </div>
                    <Switch checked={autoRestart} onCheckedChange={(v) => { setAutoRestart(v); handleChange(); }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Health checks</p>
                      <p className="text-xs text-muted-foreground">Enable periodic health monitoring</p>
                    </div>
                    <Switch checked={healthCheck} onCheckedChange={(v) => { setHealthCheck(v); handleChange(); }} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Resources Tab */}
            <TabsContent value="resources" className="space-y-4 pr-4">
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-primary" />
                    CPU Allocation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Limit</span>
                      <span className="font-mono">{cpuLimit[0]} cores</span>
                    </div>
                    <Slider
                      value={cpuLimit}
                      onValueChange={(v) => { setCpuLimit(v); handleChange(); }}
                      max={8}
                      min={0.5}
                      step={0.5}
                    />
                    <p className="text-xs text-muted-foreground">Recommended: 1-2 cores for this application</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MemoryStick className="h-4 w-4 text-info" />
                    Memory Allocation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Limit</span>
                      <span className="font-mono">{memoryLimit[0]} GB</span>
                    </div>
                    <Slider
                      value={memoryLimit}
                      onValueChange={(v) => { setMemoryLimit(v); handleChange(); }}
                      max={32}
                      min={1}
                      step={1}
                    />
                    <p className="text-xs text-muted-foreground">Recommended: 2-4 GB for this application</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-warning" />
                    Storage Allocation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Limit</span>
                      <span className="font-mono">{storageLimit[0]} GB</span>
                    </div>
                    <Slider
                      value={storageLimit}
                      onValueChange={(v) => { setStorageLimit(v); handleChange(); }}
                      max={100}
                      min={5}
                      step={5}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Scaling</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label>Number of Replicas</Label>
                    <Select value={replicas} onValueChange={(v) => { setReplicas(v); handleChange(); }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 replica</SelectItem>
                        <SelectItem value="2">2 replicas</SelectItem>
                        <SelectItem value="3">3 replicas</SelectItem>
                        <SelectItem value="5">5 replicas</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">More replicas improve availability but increase cost</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Network Tab */}
            <TabsContent value="network" className="space-y-4 pr-4">
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Service Endpoint</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Port</Label>
                      <Input
                        value={port}
                        onChange={(e) => { setPort(e.target.value); handleChange(); }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Protocol</Label>
                      <Select value={protocol} onValueChange={(v) => { setProtocol(v); handleChange(); }}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="HTTP">HTTP</SelectItem>
                          <SelectItem value="HTTPS">HTTPS</SelectItem>
                          <SelectItem value="gRPC">gRPC</SelectItem>
                          <SelectItem value="TCP">TCP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Access Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Public Access</p>
                      <p className="text-xs text-muted-foreground">Allow access from outside the cluster</p>
                    </div>
                    <Switch checked={publicAccess} onCheckedChange={(v) => { setPublicAccess(v); handleChange(); }} />
                  </div>
                  {publicAccess && (
                    <div className="space-y-2">
                      <Label>Custom Domain (optional)</Label>
                      <Input
                        placeholder="app.example.com"
                        value={customDomain}
                        onChange={(e) => { setCustomDomain(e.target.value); handleChange(); }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Internal Endpoints</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between items-center p-2 rounded bg-muted/30">
                    <span className="text-muted-foreground">Service URL</span>
                    <code className="font-mono text-xs">{appName.toLowerCase()}.default.svc.cluster.local:{port}</code>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-muted/30">
                    <span className="text-muted-foreground">External URL</span>
                    <code className="font-mono text-xs">https://{appName.toLowerCase()}.platform.example.com</code>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-4 pr-4">
              <Card className="glass-card border-success/30">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <div>
                      <p className="font-medium text-sm">Security Status: Good</p>
                      <p className="text-xs text-muted-foreground">All security settings are properly configured</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Encryption</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">TLS Encryption</p>
                      <p className="text-xs text-muted-foreground">Encrypt all traffic with TLS 1.3</p>
                    </div>
                    <Switch checked={tlsEnabled} onCheckedChange={(v) => { setTlsEnabled(v); handleChange(); }} />
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Authentication</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Require Authentication</p>
                      <p className="text-xs text-muted-foreground">Users must authenticate to access</p>
                    </div>
                    <Switch checked={authEnabled} onCheckedChange={(v) => { setAuthEnabled(v); handleChange(); }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">API Key Required</p>
                      <p className="text-xs text-muted-foreground">Require API key for programmatic access</p>
                    </div>
                    <Switch checked={apiKeyRequired} onCheckedChange={(v) => { setApiKeyRequired(v); handleChange(); }} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Environment Tab */}
            <TabsContent value="environment" className="space-y-4 pr-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Environment Variables</h3>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowSecrets(!showSecrets)}>
                    {showSecrets ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                    {showSecrets ? "Hide" : "Show"} Secrets
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    setEnvVars([...envVars, { key: "", value: "", isSecret: false }]);
                    handleChange();
                  }}>
                    Add Variable
                  </Button>
                </div>
              </div>

              <Card className="glass-card">
                <CardContent className="pt-4 space-y-3">
                  {envVars.map((env, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        placeholder="KEY"
                        value={env.key}
                        onChange={(e) => {
                          const newVars = [...envVars];
                          newVars[i].key = e.target.value;
                          setEnvVars(newVars);
                          handleChange();
                        }}
                        className="flex-1 font-mono text-sm"
                      />
                      <Input
                        placeholder="value"
                        type={env.isSecret && !showSecrets ? "password" : "text"}
                        value={env.value}
                        onChange={(e) => {
                          const newVars = [...envVars];
                          newVars[i].value = e.target.value;
                          setEnvVars(newVars);
                          handleChange();
                        }}
                        className="flex-1 font-mono text-sm"
                      />
                      <Button
                        variant={env.isSecret ? "default" : "ghost"}
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => {
                          const newVars = [...envVars];
                          newVars[i].isSecret = !newVars[i].isSecret;
                          setEnvVars(newVars);
                          handleChange();
                        }}
                      >
                        <Key className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-destructive hover:text-destructive"
                        onClick={() => {
                          setEnvVars(envVars.filter((_, j) => j !== i));
                          handleChange();
                        }}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="glass-card border-warning/30">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Sensitive Data Warning</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Secret values are encrypted at rest. Never commit secrets to version control.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border/50 mt-4">
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Badge variant="warning" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Unsaved Changes
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleReset} disabled={!hasChanges}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApplicationConfigDialog;
