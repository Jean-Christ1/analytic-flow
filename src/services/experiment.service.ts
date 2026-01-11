// ============================================================================
// Experiment Service - ML Experiment Management
// MLOps Control Plane v3
// Author: Armand AMOUSSOU
// Date: 2026-01-04
// ============================================================================

import { supabase } from '@/integrations/supabase/client';
import type { Experiment, ExperimentInsert, ExperimentUpdate } from '@/hooks/api/mlops';

// ============================================================================
// TYPES
// ============================================================================

export interface ExperimentSummary {
  id: string;
  name: string;
  runCount: number;
  successRate: number;
  lastRunAt: string | null;
  bestMetrics: Record<string, number>;
}

export interface ExperimentComparison {
  experiments: ExperimentSummary[];
  metricKeys: string[];
  comparisonMatrix: Record<string, Record<string, number | null>>;
}

export interface ExperimentCloneOptions {
  name: string;
  includeRuns?: boolean;
  includeArtifacts?: boolean;
  targetProjectId?: string;
}

// ============================================================================
// EXPERIMENT SERVICE
// ============================================================================

class ExperimentService {
  /**
   * Create a new experiment
   */
  async createExperiment(data: ExperimentInsert): Promise<Experiment> {
    const { data: result, error } = await supabase
      .from('experiment')
      .insert({
        tenant_id: data.tenant_id,
        project_id: data.project_id,
        name: data.name,
        description: data.description,
        tags: data.tags ?? [],
        created_by: data.created_by,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create experiment:', error);
      throw new Error(error.message);
    }

    return result as unknown as Experiment;
  }

  /**
   * Get experiment summary with statistics
   */
  async getExperimentSummary(experimentId: string): Promise<ExperimentSummary | null> {
    const { data: experiment, error: expError } = await supabase
      .from('experiment')
      .select('id, name')
      .eq('id', experimentId)
      .single();

    if (expError || !experiment) return null;

    // Get run statistics
    const { data: runs, error: runsError } = await supabase
      .from('run')
      .select('id, status, started_at, metrics_summary')
      .eq('experiment_id', experimentId)
      .order('started_at', { ascending: false });

    if (runsError) {
      console.error('Failed to fetch runs:', runsError);
      return null;
    }

    const runCount = runs?.length ?? 0;
    const successfulRuns = runs?.filter((r) => r.status === 'succeeded').length ?? 0;
    const successRate = runCount > 0 ? (successfulRuns / runCount) * 100 : 0;
    const lastRunAt = runs?.[0]?.started_at ?? null;

    // Calculate best metrics across all runs
    const bestMetrics: Record<string, number> = {};
    for (const run of runs ?? []) {
      const metrics = run.metrics_summary as Record<string, number> | null;
      if (metrics) {
        for (const [key, value] of Object.entries(metrics)) {
          if (typeof value === 'number') {
            if (bestMetrics[key] === undefined || value > bestMetrics[key]) {
              bestMetrics[key] = value;
            }
          }
        }
      }
    }

    return {
      id: experiment.id,
      name: experiment.name,
      runCount,
      successRate,
      lastRunAt,
      bestMetrics,
    };
  }

  /**
   * Compare multiple experiments
   */
  async compareExperiments(experimentIds: string[]): Promise<ExperimentComparison> {
    const experiments: ExperimentSummary[] = [];
    const allMetricKeys = new Set<string>();

    for (const id of experimentIds) {
      const summary = await this.getExperimentSummary(id);
      if (summary) {
        experiments.push(summary);
        Object.keys(summary.bestMetrics).forEach((key) => allMetricKeys.add(key));
      }
    }

    const metricKeys = Array.from(allMetricKeys).sort();

    // Build comparison matrix
    const comparisonMatrix: Record<string, Record<string, number | null>> = {};
    for (const exp of experiments) {
      comparisonMatrix[exp.id] = {};
      for (const key of metricKeys) {
        comparisonMatrix[exp.id][key] = exp.bestMetrics[key] ?? null;
      }
    }

    return {
      experiments,
      metricKeys,
      comparisonMatrix,
    };
  }

  /**
   * Clone an experiment
   */
  async cloneExperiment(
    sourceId: string,
    options: ExperimentCloneOptions
  ): Promise<Experiment> {
    // Fetch source experiment
    const { data: source, error: sourceError } = await supabase
      .from('experiment')
      .select('*')
      .eq('id', sourceId)
      .single();

    if (sourceError || !source) {
      throw new Error('Source experiment not found');
    }

    // Create new experiment
    const { data: newExperiment, error: createError } = await supabase
      .from('experiment')
      .insert({
        tenant_id: source.tenant_id,
        project_id: options.targetProjectId ?? source.project_id,
        name: options.name,
        description: source.description,
        tags: source.tags,
        created_by: source.created_by,
      })
      .select()
      .single();

    if (createError || !newExperiment) {
      throw new Error(createError?.message ?? 'Failed to create experiment');
    }

    // TODO: Optionally clone runs if options.includeRuns is true
    // TODO: Optionally clone artifacts if options.includeArtifacts is true

    return newExperiment as unknown as Experiment;
  }

  /**
   * Archive an experiment
   */
  async archiveExperiment(experimentId: string): Promise<void> {
    const { error } = await supabase
      .from('experiment')
      .update({
        tags: supabase.sql`array_append(tags, 'archived')`,
      })
      .eq('id', experimentId);

    if (error) {
      console.error('Failed to archive experiment:', error);
      throw new Error(error.message);
    }
  }

  /**
   * Get experiment metrics timeline
   */
  async getMetricsTimeline(
    experimentId: string,
    metricKey: string
  ): Promise<{ runId: string; runName: string; timestamp: string; value: number }[]> {
    const { data: runs, error: runsError } = await supabase
      .from('run')
      .select('id, started_at')
      .eq('experiment_id', experimentId)
      .order('started_at', { ascending: true });

    if (runsError || !runs) return [];

    const runIds = runs.map((r) => r.id);

    const { data: metrics, error: metricsError } = await supabase
      .from('run_metric')
      .select('run_id, value, logged_at')
      .in('run_id', runIds)
      .eq('name', metricKey)
      .order('logged_at', { ascending: true });

    if (metricsError) return [];

    // Get latest metric per run
    const latestByRun: Map<string, { value: number; timestamp: string }> = new Map();
    for (const metric of metrics ?? []) {
      const current = latestByRun.get(metric.run_id);
      if (!current || (metric.logged_at && metric.logged_at > current.timestamp)) {
        latestByRun.set(metric.run_id, {
          value: metric.value ?? 0,
          timestamp: metric.logged_at ?? '',
        });
      }
    }

    return runs
      .filter((run) => latestByRun.has(run.id))
      .map((run) => ({
        runId: run.id,
        runName: `Run ${run.id.substring(0, 8)}`,
        timestamp: run.started_at ?? '',
        value: latestByRun.get(run.id)!.value,
      }));
  }

  /**
   * Get experiment tags
   */
  async getExperimentTags(projectId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('experiment')
      .select('tags')
      .eq('project_id', projectId);

    if (error) return [];

    const allTags = new Set<string>();
    for (const exp of data ?? []) {
      const tags = exp.tags as string[] | null;
      if (tags) {
        tags.forEach((tag) => allTags.add(tag));
      }
    }

    return Array.from(allTags).sort();
  }

  /**
   * Bulk update experiment tags
   */
  async bulkUpdateTags(
    experimentIds: string[],
    addTags: string[],
    removeTags: string[]
  ): Promise<void> {
    for (const id of experimentIds) {
      const { data: current } = await supabase
        .from('experiment')
        .select('tags')
        .eq('id', id)
        .single();

      let tags = (current?.tags as string[]) ?? [];

      // Remove tags
      tags = tags.filter((t) => !removeTags.includes(t));

      // Add tags
      for (const tag of addTags) {
        if (!tags.includes(tag)) {
          tags.push(tag);
        }
      }

      await supabase.from('experiment').update({ tags }).eq('id', id);
    }
  }
}

// Export singleton instance
export const experimentService = new ExperimentService();

// ============================================================================
// TODO: Additional Experiment Features
// ============================================================================
// TODO: Add experiment search with full-text
// TODO: Add experiment export to JSON/YAML
// TODO: Add experiment import from MLflow
// TODO: Add experiment sharing between projects
// TODO: Add experiment lifecycle management
// TODO: Add experiment notifications/alerts
// TODO: Add experiment cost tracking
