import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

const count = (rows: any[] | null | undefined, key: string, values: string[]) =>
  (rows ?? []).filter((r) => values.includes(String(r[key]))).length;

export const timeAgo = (iso?: string | null) => {
  if (!iso) return "";
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${Math.floor(s)}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export const useDashboardData = () =>
  useQuery({
    queryKey: ["dashboard-overview"],
    refetchInterval: 60_000,
    queryFn: async () => {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const [models, versions, runs, deps, costs, pipes, projects, audit, alerts, incidents, clusters] =
        await Promise.all([
          db.from("model").select("id"),
          db.from("model_version").select("status"),
          db.from("run").select("status"),
          db.from("model_deployment").select("status"),
          db.from("cost_record").select("service,cost_amount").gte("usage_start", monthStart.toISOString()),
          db.from("pipeline_run").select("status"),
          db.from("project").select("id,name,lifecycle_status,criticality,description").order("updated_at", { ascending: false }).limit(50),
          db.from("audit_event").select("id,action,resource_type,resource_name,actor_type,status,created_at").order("created_at", { ascending: false }).limit(20),
          db.from("metric_alert").select("id,message,alert_type,created_at").eq("acknowledged", false).order("created_at", { ascending: false }).limit(10),
          db.from("incident").select("id,title,severity,status").neq("status", "resolved").limit(10),
          db.from("k8s_cluster").select("status"),
        ]);

      const costRows = costs.data ?? [];
      const sumBy = (pred: (s: string) => boolean) =>
        costRows.filter((c: any) => pred(String(c.service ?? "").toLowerCase()))
          .reduce((t: number, c: any) => t + Number(c.cost_amount ?? 0), 0);
      const totalCost = sumBy(() => true);
      const storage = sumBy((s) => /stor|s3|blob|gcs|disk/.test(s));
      const network = sumBy((s) => /net|egress|transfer|cdn/.test(s));

      const failedQueries = [models, versions, runs, deps, costs, pipes, projects, audit, alerts, incidents, clusters]
        .filter((r) => r.error).length;

      return {
        models: {
          total: models.data?.length ?? 0,
          approved: count(versions.data, "status", ["approved"]),
          draft: count(versions.data, "status", ["draft"]),
          deprecated: count(versions.data, "status", ["deprecated"]),
        },
        runs: {
          total: runs.data?.length ?? 0,
          running: count(runs.data, "status", ["running", "queued"]),
          succeeded: count(runs.data, "status", ["succeeded"]),
          failed: count(runs.data, "status", ["failed"]),
        },
        deployments: {
          total: deps.data?.length ?? 0,
          healthy: count(deps.data, "status", ["healthy"]),
          degraded: count(deps.data, "status", ["degraded", "syncing"]),
          failed: count(deps.data, "status", ["failed"]),
        },
        cost: { total: totalCost, storage, network, compute: totalCost - storage - network },
        pipelines: {
          total: pipes.data?.length ?? 0,
          ok: count(pipes.data, "status", ["succeeded", "running"]),
          pending: count(pipes.data, "status", ["pending", "canceled"]),
          failed: count(pipes.data, "status", ["failed"]),
        },
        clusters: {
          total: clusters.data?.length ?? 0,
          ready: count(clusters.data, "status", ["ready"]),
          degraded: count(clusters.data, "status", ["degraded", "down"]),
        },
        projects: projects.data ?? [],
        activity: audit.data ?? [],
        alerts: [
          ...(incidents.data ?? []).map((i: any) => ({ id: i.id, label: i.title, level: ["p1", "p2"].includes(i.severity) ? "crit" : "warn" })),
          ...(alerts.data ?? []).map((a: any) => ({ id: a.id, label: a.message ?? a.alert_type, level: "info" })),
        ],
        dbHealthy: failedQueries === 0,
      };
    },
  });
