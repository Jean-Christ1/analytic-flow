// ============================================================================
// Run Service - ML Run Execution & Management
// MLOps Control Plane v3
// Author: Armand AMOUSSOU
// Date: 2026-01-04
// ============================================================================

import { supabase } from '@/integrations/supabase/client';
import type { Run, RunInsert } from '@/hooks/api/mlops';

// ============================================================================
// TYPES
// ============================================================================

export interface RunExecutionConfig {
  experimentId: string;
  name?: string;
  computeProfileId?: string;
  clusterId?: string;
  namespace?: string;
  environmentBuildId?: string;
  params?: Record<string, string | number | boolean>;
  entryPoint?: string;
  sourceUri?: string;
  parentRunId?: string;
}

export interface RunMetricLog {
  key: string;
  value: number;
  step?: number;
  timestamp?: string;
}

export interface RunParamLog {
  key: string;
  value: string | number | boolean;
}

export interface RunOutput {
  logs: string[];
  metrics: Record<string, number>;
  artifacts: string[];
  status: string;
  exitCode: number | null;
}

export interface RunCostEstimate {
  computeCost: number;
  storageCost: number;
  totalCost: number;
  currency: string;
  breakdown: {
    cpuHours: number;
    gpuHours: number;
    memoryGbHours: number;
    storageGb: number;
  };
}

// ============================================================================
// RUN SERVICE
// ============================================================================

class RunService {
  /**
   * Start a new ML run
   */
  async startRun(config: RunExecutionConfig): Promise<Run> {
    const { data: run, error } = await supabase
      .from('run')
      .insert({
        tenant_id: await this.getCurrentTenantId(),
        project_id: await this.getProjectIdFromExperiment(config.experimentId),
        experiment_id: config.experimentId,
        parent_run_id: config.parentRunId,
        type: 'job',
        status: 'queued',
        trigger: 'manual',
        compute_profile_id: config.computeProfileId,
        environment_build_id: config.environmentBuildId,
        cluster_id: config.clusterId,
        namespace: config.namespace ?? 'default',
        params: config.params ?? {},
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to start run:', error);
      throw new Error(error.message);
    }

    // TODO: Trigger actual job execution via Kubernetes API/Operator
    // This would typically:
    // 1. Create a Kubernetes Job or Pod
    // 2. Mount the environment
    // 3. Execute the entrypoint
    // 4. Stream logs back
    // 5. Update status on completion

    return run as unknown as Run;
  }

  /**
   * Stop a running job
   */
  async stopRun(runId: string): Promise<void> {
    // Update status to canceled
    const { error } = await supabase
      .from('run')
      .update({
        status: 'canceled',
        ended_at: new Date().toISOString(),
      })
      .eq('id', runId);

    if (error) {
      console.error('Failed to stop run:', error);
      throw new Error(error.message);
    }

    // TODO: Actually stop the Kubernetes job/pod
  }

  /**
   * Log metrics for a run
   */
  async logMetrics(runId: string, metrics: RunMetricLog[]): Promise<void> {
    const tenantId = await this.getCurrentTenantId();

    const metricsToInsert = metrics.map((m) => ({
      tenant_id: tenantId,
      run_id: runId,
      name: m.key,
      value: m.value,
      step: m.step,
      logged_at: m.timestamp ?? new Date().toISOString(),
    }));

    const { error } = await supabase.from('run_metric').insert(metricsToInsert);

    if (error) {
      console.error('Failed to log metrics:', error);
      throw new Error(error.message);
    }

    // Update metrics summary in run
    await this.updateMetricsSummary(runId);
  }

  /**
   * Log parameters for a run
   */
  async logParams(runId: string, params: RunParamLog[]): Promise<void> {
    const tenantId = await this.getCurrentTenantId();

    for (const param of params) {
      await supabase.from('run_param').upsert(
        {
          tenant_id: tenantId,
          run_id: runId,
          key: param.key,
          value: String(param.value),
        },
        { onConflict: 'run_id,key' }
      );
    }
  }

  /**
   * Get run logs (streaming)
   */
  async getRunLogs(
    runId: string,
    options: { tail?: number; follow?: boolean } = {}
  ): Promise<AsyncGenerator<string>> {
    // TODO: Implement actual log streaming from Kubernetes
    // This is a placeholder implementation
    const { data: run } = await supabase
      .from('run')
      .select('logs_uri')
      .eq('id', runId)
      .single();

    // Return a simple async generator
    async function* logGenerator(): AsyncGenerator<string> {
      yield `Fetching logs for run ${runId}...`;
      yield `Logs URI: ${run?.logs_uri ?? 'N/A'}`;
      // TODO: Stream actual logs
    }

    return logGenerator();
  }

  /**
   * Get run output (metrics, artifacts, status)
   */
  async getRunOutput(runId: string): Promise<RunOutput> {
    const { data: run } = await supabase
      .from('run')
      .select('status, metrics_summary, status_message')
      .eq('id', runId)
      .single();

    const { data: artifacts } = await supabase
      .from('artifact')
      .select('uri')
      .eq('run_id', runId);

    return {
      logs: [], // TODO: Fetch actual logs
      metrics: (run?.metrics_summary as Record<string, number>) ?? {},
      artifacts: artifacts?.map((a) => a.uri ?? '').filter(Boolean) ?? [],
      status: run?.status ?? 'unknown',
      exitCode: run?.status === 'succeeded' ? 0 : run?.status === 'failed' ? 1 : null,
    };
  }

  /**
   * Compare runs side by side
   */
  async compareRuns(
    runIds: string[]
  ): Promise<{
    runs: { id: string; name: string; status: string; duration: number | null }[];
    params: Record<string, Record<string, string>>;
    metrics: Record<string, Record<string, number>>;
  }> {
    const { data: runs } = await supabase
      .from('run')
      .select('id, status, started_at, ended_at, params, metrics_summary')
      .in('id', runIds);

    const { data: params } = await supabase
      .from('run_param')
      .select('run_id, key, value')
      .in('run_id', runIds);

    const { data: metrics } = await supabase
      .from('run_metric')
      .select('run_id, name, value')
      .in('run_id', runIds);

    // Build comparison structures
    const paramsMap: Record<string, Record<string, string>> = {};
    const metricsMap: Record<string, Record<string, number>> = {};

    for (const param of params ?? []) {
      if (!paramsMap[param.run_id]) paramsMap[param.run_id] = {};
      paramsMap[param.run_id][param.key] = param.value ?? '';
    }

    // Get latest metric per key per run
    for (const metric of metrics ?? []) {
      if (!metricsMap[metric.run_id]) metricsMap[metric.run_id] = {};
      metricsMap[metric.run_id][metric.name] = metric.value ?? 0;
    }

    return {
      runs:
        runs?.map((r) => ({
          id: r.id,
          name: `Run ${r.id.substring(0, 8)}`,
          status: r.status,
          duration:
            r.started_at && r.ended_at
              ? (new Date(r.ended_at).getTime() - new Date(r.started_at).getTime()) / 1000
              : null,
        })) ?? [],
      params: paramsMap,
      metrics: metricsMap,
    };
  }

  /**
   * Estimate run cost
   */
  async estimateRunCost(
    config: RunExecutionConfig,
    estimatedDurationHours: number
  ): Promise<RunCostEstimate> {
    // TODO: Fetch actual pricing from configuration
    // This is a placeholder implementation
    const cpuCostPerHour = 0.05;
    const gpuCostPerHour = 2.0;
    const memoryCostPerGbHour = 0.01;
    const storageCostPerGb = 0.023;

    // Get compute profile specs
    const { data: computeProfile } = await supabase
      .from('compute_profile')
      .select('*')
      .eq('id', config.computeProfileId)
      .single();

    const cpuHours = estimatedDurationHours; // TODO: Parse CPU request
    const gpuHours = (computeProfile?.gpu_count ?? 0) * estimatedDurationHours;
    const memoryGbHours = 4 * estimatedDurationHours; // TODO: Parse memory request
    const storageGb = 10; // TODO: Estimate storage needs

    const computeCost =
      cpuHours * cpuCostPerHour +
      gpuHours * gpuCostPerHour +
      memoryGbHours * memoryCostPerGbHour;

    const storageCost = storageGb * storageCostPerGb;

    return {
      computeCost,
      storageCost,
      totalCost: computeCost + storageCost,
      currency: 'USD',
      breakdown: {
        cpuHours,
        gpuHours,
        memoryGbHours,
        storageGb,
      },
    };
  }

  /**
   * Retry a failed run
   */
  async retryRun(runId: string): Promise<Run> {
    const { data: originalRun } = await supabase
      .from('run')
      .select('*')
      .eq('id', runId)
      .single();

    if (!originalRun) {
      throw new Error('Run not found');
    }

    // Create a new run with same config
    return this.startRun({
      experimentId: originalRun.experiment_id,
      computeProfileId: originalRun.compute_profile_id,
      clusterId: originalRun.cluster_id,
      namespace: originalRun.namespace,
      environmentBuildId: originalRun.environment_build_id,
      params: originalRun.params as Record<string, string | number | boolean>,
      parentRunId: originalRun.parent_run_id,
    });
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private async getCurrentTenantId(): Promise<string> {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('user_id', data.user.id)
      .single();

    // TODO: Handle missing tenant_id properly
    return profile?.tenant_id ?? data.user.id;
  }

  private async getProjectIdFromExperiment(experimentId: string): Promise<string> {
    const { data } = await supabase
      .from('experiment')
      .select('project_id')
      .eq('id', experimentId)
      .single();

    if (!data) throw new Error('Experiment not found');
    return data.project_id;
  }

  private async updateMetricsSummary(runId: string): Promise<void> {
    // Get latest value for each metric
    const { data: metrics } = await supabase
      .from('run_metric')
      .select('name, value')
      .eq('run_id', runId)
      .order('logged_at', { ascending: false });

    const summary: Record<string, number> = {};
    const seen = new Set<string>();

    for (const metric of metrics ?? []) {
      if (!seen.has(metric.name)) {
        summary[metric.name] = metric.value ?? 0;
        seen.add(metric.name);
      }
    }

    await supabase.from('run').update({ metrics_summary: summary }).eq('id', runId);
  }
}

// Export singleton instance
export const runService = new RunService();

// ============================================================================
// TODO: Additional Run Features
// ============================================================================
// TODO: Add run scheduling (cron jobs)
// TODO: Add run queuing and prioritization
// TODO: Add run resource limits enforcement
// TODO: Add run checkpointing and resumption
// TODO: Add distributed training support
// TODO: Add hyperparameter sweep orchestration
// TODO: Add run cost optimization recommendations
// TODO: Add run anomaly detection
