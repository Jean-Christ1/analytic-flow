import { corsHeaders as baseCors } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";

const corsHeaders = {
  ...baseCors,
  "Access-Control-Expose-Headers": "X-Lovable-AIG-Run-ID",
};
const GATEWAY = "https://ai.gateway.lovable.dev/v1/responses";
const MODEL = "openai/gpt-6-astra";

const Body = z.object({
  title: z.string().trim().min(3).max(200),
  environment: z.string().trim().max(50).default("production"),
  service: z.string().trim().max(200).optional().default(""),
  symptoms: z.string().trim().min(10).max(8000),
  recentChanges: z.string().trim().max(4000).optional().default(""),
  logs: z.string().max(12000).optional().default(""),
});

const step = {
  type: "object",
  additionalProperties: false,
  required: ["priority", "title", "action", "rationale", "commands", "owner", "eta_minutes"],
  properties: {
    priority: { type: "string", enum: ["P0", "P1", "P2", "P3"] },
    title: { type: "string" },
    action: { type: "string" },
    rationale: { type: "string" },
    commands: { type: "array", items: { type: "string" } },
    owner: { type: "string" },
    eta_minutes: { type: "number" },
  },
};
const schema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "severity", "probable_causes", "diagnostic_steps", "remediation_steps", "rollback_plan", "prevention"],
  properties: {
    summary: { type: "string" },
    severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
    probable_causes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["cause", "likelihood", "evidence"],
        properties: {
          cause: { type: "string" },
          likelihood: { type: "string", enum: ["low", "medium", "high"] },
          evidence: { type: "string" },
        },
      },
    },
    diagnostic_steps: { type: "array", items: step },
    remediation_steps: { type: "array", items: step },
    rollback_plan: { type: "string" },
    prevention: { type: "array", items: { type: "string" } },
  },
};

const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, ...extra, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // Auth + admin check
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json({ error: "Non authentifié" }, 401);
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await supabase.auth.getUser(authHeader.slice(7));
  if (userErr || !userData.user) return json({ error: "Non authentifié" }, 401);
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userData.user.id);
  if (!roles?.some((r: { role: string }) => r.role === "admin")) {
    return json({ error: "Réservé aux administrateurs de la plateforme" }, 403);
  }

  let parsed;
  try {
    parsed = Body.safeParse(await req.json());
  } catch {
    return json({ error: "Corps de requête invalide" }, 400);
  }
  if (!parsed.success) return json({ error: "Champs invalides", details: parsed.error.flatten().fieldErrors }, 400);
  const b = parsed.data;

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return json({ error: "Configuration IA manquante" }, 500);

  const instructions =
    "Tu es un SRE/MLOps senior expert en déploiement de modèles ML (Kubernetes, KServe, Seldon, ArgoCD, GPU, feature stores, dérive de données). " +
    "À partir de la description d'un incident de déploiement, produis un plan de diagnostic puis de remédiation priorisé (P0 = immédiat). " +
    "Réponds en français. 3 à 6 causes probables, 3 à 8 étapes de diagnostic, 3 à 8 étapes de remédiation, ordonnées par priorité. " +
    "Les commandes doivent être concrètes (kubectl, argocd, curl, requêtes de métriques) et sûres; indique explicitement toute action destructive. " +
    "N'invente pas de faits absents de la description: signale les hypothèses.";
  const input =
    `Titre: ${b.title}\nEnvironnement: ${b.environment}\nService/modèle: ${b.service || "non précisé"}\n\n` +
    `Symptômes:\n${b.symptoms}\n\nChangements récents:\n${b.recentChanges || "non précisé"}\n\nLogs / erreurs:\n${b.logs || "aucun"}`;

  let upstream: Response;
  try {
    upstream = await fetch(GATEWAY, {
      method: "POST",
      signal: req.signal,
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: MODEL,
        instructions,
        input,
        stream: true,
        store: false,
        reasoning: { effort: "medium", summary: "auto" },
        include: ["reasoning.encrypted_content"],
        text: { format: { type: "json_schema", name: "remediation_plan", strict: true, schema } },
      }),
    });
  } catch (e) {
    if (req.signal.aborted) return new Response(null, { status: 499, headers: corsHeaders });
    return json({ error: "Service IA injoignable" }, 502);
  }
  const runId = upstream.headers.get("X-Lovable-AIG-Run-ID");
  const extra: Record<string, string> = runId ? { "X-Lovable-AIG-Run-ID": runId } : {};

  if (!upstream.ok || !upstream.body) {
    let msg = "Erreur du service IA";
    try {
      const t = await upstream.text();
      const j = JSON.parse(t);
      msg = j?.error?.message ?? j?.message ?? msg;
    } catch { /* ignore */ }
    if (upstream.status === 429) msg = "Trop de requêtes, réessayez dans un instant.";
    if (upstream.status === 402) msg = msg || "Crédits IA épuisés.";
    return json({ error: msg }, upstream.status, extra);
  }

  // Consume SSE server-side
  const reader = upstream.body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = "";
  let text = "";
  let failure: string | null = null;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += value;
      let idx;
      while ((idx = buf.indexOf("\n\n")) !== -1) {
        const chunk = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (!data || data === "[DONE]") continue;
          try {
            const ev = JSON.parse(data);
            if (ev.type === "response.output_text.delta") text += ev.delta ?? "";
            else if (ev.type === "response.refusal.delta") failure = "Le modèle a refusé de répondre.";
            else if (ev.type === "response.failed" || ev.type === "error")
              failure = ev.response?.error?.message ?? ev.message ?? "Échec de génération";
          } catch { /* ignore */ }
        }
      }
    }
  } catch {
    if (req.signal.aborted) return new Response(null, { status: 499, headers: corsHeaders });
    return json({ error: "Flux IA interrompu" }, 502, extra);
  }

  if (failure) return json({ error: failure }, 502, extra);
  try {
    const plan = JSON.parse(text);
    return json({ plan }, 200, extra);
  } catch {
    return json({ error: "Réponse IA illisible" }, 502, extra);
  }
});
