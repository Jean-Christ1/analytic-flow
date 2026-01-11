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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Archive,
  Download,
  Upload,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  RotateCcw,
  Calendar,
  HardDrive,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Backup {
  id: string;
  name: string;
  date: string;
  size: string;
  type: "manual" | "scheduled";
  status: "completed" | "failed" | "in-progress";
  environment: string;
}

interface BackupRestoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appName: string;
}

const mockBackups: Backup[] = [
  {
    id: "bkp-001",
    name: "Pre-upgrade backup",
    date: "2024-01-15 14:30:00",
    size: "2.4 MB",
    type: "manual",
    status: "completed",
    environment: "production",
  },
  {
    id: "bkp-002",
    name: "Daily scheduled backup",
    date: "2024-01-15 03:00:00",
    size: "2.3 MB",
    type: "scheduled",
    status: "completed",
    environment: "production",
  },
  {
    id: "bkp-003",
    name: "Weekly backup",
    date: "2024-01-14 00:00:00",
    size: "2.2 MB",
    type: "scheduled",
    status: "completed",
    environment: "production",
  },
  {
    id: "bkp-004",
    name: "Config change backup",
    date: "2024-01-13 16:45:00",
    size: "2.1 MB",
    type: "manual",
    status: "completed",
    environment: "staging",
  },
  {
    id: "bkp-005",
    name: "Failed backup attempt",
    date: "2024-01-12 03:00:00",
    size: "0 MB",
    type: "scheduled",
    status: "failed",
    environment: "production",
  },
];

export const BackupRestoreDialog = ({
  open,
  onOpenChange,
  appName,
}: BackupRestoreDialogProps) => {
  const [backups, setBackups] = useState<Backup[]>(mockBackups);
  const [backupName, setBackupName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [scheduleEnabled, setScheduleEnabled] = useState(true);
  const [scheduleFrequency, setScheduleFrequency] = useState("daily");
  const [scheduleTime, setScheduleTime] = useState("03:00");
  const [retentionDays, setRetentionDays] = useState("30");

  const handleCreateBackup = async () => {
    if (!backupName.trim()) {
      toast.error("Veuillez entrer un nom pour la sauvegarde");
      return;
    }

    setIsCreating(true);
    
    // Simulate backup creation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const newBackup: Backup = {
      id: `bkp-${Date.now()}`,
      name: backupName,
      date: new Date().toISOString().replace("T", " ").slice(0, 19),
      size: "2.5 MB",
      type: "manual",
      status: "completed",
      environment: "production",
    };

    setBackups([newBackup, ...backups]);
    setBackupName("");
    setIsCreating(false);
    toast.success("Sauvegarde créée avec succès");
  };

  const handleRestore = async (backup: Backup) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 3000)),
      {
        loading: `Restauration de "${backup.name}" en cours...`,
        success: "Configuration restaurée avec succès",
        error: "Erreur lors de la restauration",
      }
    );
  };

  const handleDelete = (backupId: string) => {
    setBackups(backups.filter((b) => b.id !== backupId));
    toast.success("Sauvegarde supprimée");
  };

  const handleDownload = (backup: Backup) => {
    toast.success(`Téléchargement de "${backup.name}" démarré`);
  };

  const handleSaveSchedule = () => {
    toast.success("Paramètres de sauvegarde planifiée enregistrés");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case "in-progress":
        return <Clock className="h-4 w-4 text-warning animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "failed":
        return "destructive";
      case "in-progress":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-primary" />
            Backup & Restore - {appName}
          </DialogTitle>
          <DialogDescription>
            Gérez les sauvegardes de configuration et restaurez des versions précédentes
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="backups" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="backups" className="flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Sauvegardes
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Nouvelle
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Planification
            </TabsTrigger>
          </TabsList>

          {/* Backups List */}
          <TabsContent value="backups" className="mt-4">
            <div className="rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Nom</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Taille</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Env</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backups.map((backup) => (
                    <TableRow key={backup.id}>
                      <TableCell className="font-medium">{backup.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {backup.date}
                      </TableCell>
                      <TableCell>{backup.size}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {backup.type === "scheduled" ? (
                            <Clock className="h-3 w-3 mr-1" />
                          ) : (
                            <Upload className="h-3 w-3 mr-1" />
                          )}
                          {backup.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-xs",
                            backup.environment === "production"
                              ? "bg-success/20 text-success"
                              : "bg-warning/20 text-warning"
                          )}
                        >
                          {backup.environment}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {getStatusIcon(backup.status)}
                          <Badge
                            variant={getStatusBadge(backup.status) as any}
                            className="text-xs"
                          >
                            {backup.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleRestore(backup)}
                            disabled={backup.status !== "completed"}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDownload(backup)}
                            disabled={backup.status !== "completed"}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(backup.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>{backups.length} sauvegardes • Espace utilisé: 11.5 MB</span>
              <span>Rétention: 30 jours</span>
            </div>
          </TabsContent>

          {/* Create Backup */}
          <TabsContent value="create" className="mt-4 space-y-6">
            <div className="rounded-lg border border-border p-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Créer une sauvegarde manuelle</h3>
                  <p className="text-sm text-muted-foreground">
                    Sauvegardez la configuration actuelle de l'application
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="backup-name">Nom de la sauvegarde</Label>
                  <Input
                    id="backup-name"
                    placeholder="Ex: Pre-upgrade backup, Config change..."
                    value={backupName}
                    onChange={(e) => setBackupName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Environnement source</Label>
                    <Select defaultValue="production">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="production">Production</SelectItem>
                        <SelectItem value="staging">Staging</SelectItem>
                        <SelectItem value="development">Development</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Inclure</Label>
                    <Select defaultValue="all">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tout (config + données)</SelectItem>
                        <SelectItem value="config">Configuration uniquement</SelectItem>
                        <SelectItem value="data">Données uniquement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Les sauvegardes sont chiffrées et stockées de manière sécurisée
                  </span>
                </div>
              </div>

              <Button
                onClick={handleCreateBackup}
                disabled={isCreating || !backupName.trim()}
                className="w-full"
              >
                {isCreating ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  <>
                    <Archive className="h-4 w-4 mr-2" />
                    Créer la sauvegarde
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Schedule Settings */}
          <TabsContent value="schedule" className="mt-4 space-y-6">
            <div className="rounded-lg border border-border p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Sauvegarde automatique</h3>
                    <p className="text-sm text-muted-foreground">
                      Planifiez des sauvegardes régulières
                    </p>
                  </div>
                </div>
                <Switch
                  checked={scheduleEnabled}
                  onCheckedChange={setScheduleEnabled}
                />
              </div>

              {scheduleEnabled && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Fréquence</Label>
                      <Select
                        value={scheduleFrequency}
                        onValueChange={setScheduleFrequency}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Toutes les heures</SelectItem>
                          <SelectItem value="daily">Quotidienne</SelectItem>
                          <SelectItem value="weekly">Hebdomadaire</SelectItem>
                          <SelectItem value="monthly">Mensuelle</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Heure d'exécution</Label>
                      <Input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Rétention (jours)</Label>
                      <Select
                        value={retentionDays}
                        onValueChange={setRetentionDays}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7">7 jours</SelectItem>
                          <SelectItem value="14">14 jours</SelectItem>
                          <SelectItem value="30">30 jours</SelectItem>
                          <SelectItem value="60">60 jours</SelectItem>
                          <SelectItem value="90">90 jours</SelectItem>
                          <SelectItem value="365">1 an</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Environnement</Label>
                      <Select defaultValue="production">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les environnements</SelectItem>
                          <SelectItem value="production">Production uniquement</SelectItem>
                          <SelectItem value="staging">Staging uniquement</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                    <h4 className="text-sm font-medium">Résumé de la planification</h4>
                    <p className="text-sm text-muted-foreground">
                      Sauvegarde {scheduleFrequency === "daily" ? "quotidienne" : 
                        scheduleFrequency === "hourly" ? "horaire" :
                        scheduleFrequency === "weekly" ? "hebdomadaire" : "mensuelle"} à {scheduleTime}
                      <br />
                      Conservation des {retentionDays} derniers jours
                      <br />
                      Prochaine exécution: demain à {scheduleTime}
                    </p>
                  </div>
                </div>
              )}

              <Button onClick={handleSaveSchedule} className="w-full">
                Enregistrer les paramètres
              </Button>
            </div>

            {/* Backup Statistics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border border-border p-4 text-center">
                <div className="text-2xl font-bold text-primary">24</div>
                <div className="text-sm text-muted-foreground">Sauvegardes ce mois</div>
              </div>
              <div className="rounded-lg border border-border p-4 text-center">
                <div className="text-2xl font-bold text-success">98%</div>
                <div className="text-sm text-muted-foreground">Taux de réussite</div>
              </div>
              <div className="rounded-lg border border-border p-4 text-center">
                <div className="text-2xl font-bold">156 MB</div>
                <div className="text-sm text-muted-foreground">Espace total utilisé</div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
