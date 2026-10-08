import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, Copy, Stethoscope, Wrench, Undo2, ShieldCheck, AlertTriangle } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { AccessDenied } from "@/components/governance/AccessDenied";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Step = { priority: string; title: string; action: string; rationale: string; commands: string[]; owner: string; eta_minutes: number };
type Plan = {
  summary: string;
  severity: string;
  probable_causes: { cause: string; likelihood: string; evidence: string }[];
  diagnostic_steps: Step[];
  remediation_steps: Step[];
  rollback_plan: string;
  prevention: string[];
};

const prioVariant = (p: string) => (p === "P0" ? "destructive" : p === "P1" ? "default" : "secondary") as "destructive" | "default" | "secondary";

function StepList({ steps }: { steps: Step[] }) {
  const sorted = [...steps].sort((a, b) => a.priority.localeCompare(b.priority));
  return (
    <ol className="space-y-3">
      {sorted.map((s, i) => (
        <li key={i} className="rounded-lg border border-border p-4 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={prioVariant(s.priority)}>{s.priority}</Badge>
            <span className="font-medium">{s.title}</span>
            <span className="ml-auto text-xs text-muted-foreground">{s.owner} · ~{s.eta_minutes} min</span>
          </div>
          <p className="text-sm">{s.action}</p>
          <p className="text-xs text-muted-foreground">{s.rationale}</p>
          {s.commands.length > 0 && (
            <pre className="text-xs bg-muted rounded p-2 overflow-x-auto">{s.commands.join("\n")}</pre>
          )}
        </li>
      ))}
    </ol>
  );
}

export default function IncidentRemediation() {
  const { isAdmin, isLoading } = useCurrentUser();
  const { toast } = useToast();
  const [form, setForm] = useState({ title: "", environment: "production", service: "", symptoms: "", recentChanges: "", logs: "" });
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (form.title.trim().length < 3 || form.symptoms.trim().length < 10) {
      toast({ title: "Champs requis", description: "Titre (3+ caractères) et symptômes (10+ caractères).", variant: "destructive" });
      return;
    }
    setLoading(true);
    setError(null);
    setPlan(null);
    const { data, error } = await supabase.functions.invoke("incident-remediation", { body: form });
    setLoading(false);
    if (error) {
      let msg = error.message;
      try {
        const ctx = (error as any).context as Response | undefined;
        const j = ctx ? await ctx.json() : null;
        if (j?.error) msg = j.error;
      } catch { /* ignore */ }
      setError(msg);
      return;
    }
    if (data?.error) return setError(data.error);
    setPlan(data.plan);
  };

  const copyPlan = () => {
    if (!plan) return;
    navigator.clipboard.writeText(JSON.stringify(plan, null, 2));
    toast({ title: "Plan copié" });
  };

  if (isLoading)
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin" /></div>
      </DashboardLayout>
    );
  if (!isAdmin)
    return (
      <DashboardLayout>
        <AccessDenied title="Accès restreint" message="L'assistant d'incident est réservé aux administrateurs de la plateforme." />
      </DashboardLayout>
    );

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-6xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Sparkles className="h-6 w-6 text-primary" />Assistant incident de déploiement</h1>
          <p className="text-muted-foreground">Décrivez l'incident : l'IA produit un plan de diagnostic et de remédiation priorisé.</p>
        </div>

        <Card>
          <CardHeader><CardTitle>Description de l'incident</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2"><Label>Titre *</Label><Input value={form.title} onChange={set("title")} maxLength={200} placeholder="Latence p99 x10 après déploiement fraud-detector v3.2" /></div>
            <div className="space-y-2">
              <Label>Environnement</Label>
              <Select value={form.environment} onValueChange={(v) => setForm((f) => ({ ...f, environment: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["production", "staging", "development"].map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Service / modèle</Label><Input value={form.service} onChange={set("service")} maxLength={200} placeholder="fraud-detector (KServe, GPU A100)" /></div>
            <div className="space-y-2 md:col-span-2"><Label>Symptômes *</Label><Textarea rows={4} value={form.symptoms} onChange={set("symptoms")} maxLength={8000} placeholder="Ce qui est observé, depuis quand, impact utilisateurs…" /></div>
            <div className="space-y-2 md:col-span-2"><Label>Changements récents</Label><Textarea rows={2} value={form.recentChanges} onChange={set("recentChanges")} maxLength={4000} /></div>
            <div className="space-y-2 md:col-span-2"><Label>Logs / messages d'erreur</Label><Textarea rows={4} className="font-mono text-xs" value={form.logs} onChange={set("logs")} maxLength={12000} /></div>
            <div className="md:col-span-2">
              <Button onClick={submit} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                {loading ? "Analyse en cours…" : "Générer le plan"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-destructive"><CardContent className="pt-6 flex gap-2 text-destructive"><AlertTriangle className="h-5 w-5" />{error}</CardContent></Card>
        )}

        {plan && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">Synthèse <Badge variant={plan.severity === "critical" || plan.severity === "high" ? "destructive" : "secondary"}>{plan.severity}</Badge></CardTitle>
                  <CardDescription className="mt-2">{plan.summary}</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={copyPlan}><Copy className="h-4 w-4 mr-1" />Copier</Button>
              </CardHeader>
              <CardContent>
                <h3 className="font-medium mb-2">Causes probables</h3>
                <ul className="space-y-2">
                  {plan.probable_causes.map((c, i) => (
                    <li key={i} className="text-sm"><Badge variant="outline" className="mr-2">{c.likelihood}</Badge><span className="font-medium">{c.cause}</span> — <span className="text-muted-foreground">{c.evidence}</span></li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><Stethoscope className="h-5 w-5" />Diagnostic</CardTitle></CardHeader><CardContent><StepList steps={plan.diagnostic_steps} /></CardContent></Card>
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5" />Remédiation</CardTitle></CardHeader><CardContent><StepList steps={plan.remediation_steps} /></CardContent></Card>
            <div className="grid gap-4 md:grid-cols-2">
              <Card><CardHeader><CardTitle className="flex items-center gap-2"><Undo2 className="h-5 w-5" />Plan de rollback</CardTitle></CardHeader><CardContent className="text-sm whitespace-pre-wrap">{plan.rollback_plan}</CardContent></Card>
              <Card><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" />Prévention</CardTitle></CardHeader><CardContent><ul className="list-disc pl-5 text-sm space-y-1">{plan.prevention.map((p, i) => <li key={i}>{p}</li>)}</ul></CardContent></Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
