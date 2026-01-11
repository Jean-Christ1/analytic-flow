// ============================================================================
// Metrics Hooks - React Query Hooks for ML Metrics Management
// MLOps Control Plane v3
// Author: Armand AMOUSSOU
// Date: 2026-01-04
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PostgrestError } from '@supabase/supabase-js';
import {
  createQueryKeyFactory,
  type ListQueryOptions,
  type MutationOptions,
  calculateOffset,
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE,
  getErrorMessage,
} from '../utils/query-utils';

// ============================================================================
// TYPES
// ============================================================================

export type MetricType = 'scalar' | 'histogram' | 'image' | 'text' | 'audio' | 'video' | 'table';
export type AggregationType = 'min' | 'max' | 'avg' | 'sum' | 'count' | 'last' | 'first';

export interface Metric {
  id: string;
  run_id: string;
  key: string;
  value: number;
  timestamp: string;
  step: number | null;
  is_nan: boolean;
  context: Record<string, unknown> | null;
}

export interface MetricSeries {
  key: string;
  run_id: string;
  run_name: string;
  values: MetricPoint[];
  min: number;
  max: number;
  avg: number;
  count: number;
  last: number;
}

export interface MetricPoint {
  step: number | null;
  timestamp: string;
  value: number;
}

export interface MetricDefinition {
  id: string;
  tenant_id: string;
  project_id: string;
  key: string;
  display_name: string | null;
  description: string | null;
  metric_type: MetricType;
  unit: string | null;
  goal_direction: 'minimize' | 'maximize' | null;
  goal_value: number | null;
  warning_threshold: number | null;
  alert_threshold: number | null;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface MetricDefinitionInsert {
  tenant_id: string;
  project_id: string;
  key: string;
  display_name?: string | null;
  description?: string | null;
  metric_type?: MetricType;
  unit?: string | null;
  goal_direction?: 'minimize' | 'maximize' | null;
  goal_value?: number | null;
  warning_threshold?: number | null;
  alert_threshold?: number | null;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface MetricDefinitionUpdate {
  display_name?: string | null;
  description?: string | null;
  unit?: string | null;
  goal_direction?: 'minimize' | 'maximize' | null;
  goal_value?: number | null;
  warning_threshold?: number | null;
  alert_threshold?: number | null;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface MetricAggregation {
  key: string;
  aggregation: AggregationType;
  value: number;
  run_count: number;
  time_range?: {
    start: string;
    end: string;
  };
}

export interface MetricComparison {
  metric_key: string;
  runs: {
    run_id: string;
    run_name: string;
    value: number;
    delta_from_best: number | null;
    is_best: boolean;
  }[];
  best_run_id: string;
  best_value: number;
  worst_value: number;
  average_value: number;
}

export interface MetricAlert {
  id: string;
  tenant_id: string;
  metric_key: string;
  run_id: string;
  alert_type: 'warning' | 'critical';
  message: string;
  current_value: number;
  threshold_value: number;
  acknowledged: boolean;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  created_at: string;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const metricKeys = createQueryKeyFactory<string>('metrics');

export const metricQueryKeys = {
  all: ['metrics'] as const,
  lists: () => [...metricQueryKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...metricQueryKeys.lists(), params] as const,
  details: () => [...metricQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...metricQueryKeys.details(), id] as const,
  byRun: (runId: string) => [...metricQueryKeys.all, 'run', runId] as const,
  byKey: (key: string) => [...metricQueryKeys.all, 'key', key] as const,
  series: (runId: string, key: string) => [...metricQueryKeys.byRun(runId), 'series', key] as const,
  comparison: (runIds: string[], key: string) => [...metricQueryKeys.all, 'comparison', runIds, key] as const,
  aggregation: (params: Record<string, unknown>) => [...metricQueryKeys.all, 'aggregation', params] as const,
  definitions: () => [...metricQueryKeys.all, 'definitions'] as const,
  definition: (key: string) => [...metricQueryKeys.definitions(), key] as const,
  alerts: () => [...metricQueryKeys.all, 'alerts'] as const,
};

// ============================================================================
// METRIC VALUE QUERIES
// ============================================================================

/**
 * Hook to fetch metrics by run
 */
export const useMetricsByRun = (
  runId: string | undefined,
  options: ListQueryOptions = {}
) => {
  const {
    pagination = { page: DEFAULT_PAGE, pageSize: DEFAULT_PAGE_SIZE },
    sort,
    enabled = true,
  } = options;

  const page = pagination.page ?? DEFAULT_PAGE;
  const pageSize = pagination.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = calculateOffset(page, pageSize);

  return useQuery({
    queryKey: [...metricQueryKeys.byRun(runId ?? ''), { page, pageSize, sort }],
    queryFn: async () => {
      if (!runId) throw new Error('Run ID is required');

      let query = supabase
        .from('ml_run_metric')
        .select('*', { count: 'exact' })
        .eq('run_id', runId);

      // Apply sorting
      if (sort) {
        const sorts = Array.isArray(sort) ? sort : [sort];
        for (const s of sorts) {
          query = query.order(s.column, { ascending: s.ascending ?? true });
        }
      } else {
        query = query.order('timestamp', { ascending: true });
      }

      // Apply pagination
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data as Metric[],
        count: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      };
    },
    enabled: enabled && !!runId,
  });
};

/**
 * Hook to fetch metric series for a specific key in a run
 */
export const useMetricSeries = (
  runId: string | undefined,
  key: string,
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: metricQueryKeys.series(runId ?? '', key),
    queryFn: async () => {
      if (!runId) throw new Error('Run ID is required');

      const { data, error } = await supabase
        .from('ml_run_metric')
        .select('*')
        .eq('run_id', runId)
        .eq('key', key)
        .order('step', { ascending: true, nullsFirst: false })
        .order('timestamp', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        return null;
      }

      // Get run name
      const { data: run } = await supabase
        .from('ml_run')
        .select('name')
        .eq('id', runId)
        .single();

      const values = data.map((m) => ({
        step: m.step,
        timestamp: m.timestamp,
        value: m.value,
      }));

      const numericValues = values.map((v) => v.value).filter((v) => !Number.isNaN(v));

      return {
        key,
        run_id: runId,
        run_name: run?.name ?? runId,
        values,
        min: Math.min(...numericValues),
        max: Math.max(...numericValues),
        avg: numericValues.reduce((a, b) => a + b, 0) / numericValues.length,
        count: values.length,
        last: values[values.length - 1]?.value ?? 0,
      } as MetricSeries;
    },
    enabled: enabled && !!runId && !!key,
  });
};

/**
 * Hook to fetch all metric keys available in a run
 */
export const useMetricKeys = (
  runId: string | undefined,
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: [...metricQueryKeys.byRun(runId ?? ''), 'keys'],
    queryFn: async () => {
      if (!runId) throw new Error('Run ID is required');

      // TODO: Use a distinct query or RPC function
      const { data, error } = await supabase
        .from('ml_run_metric')
        .select('key')
        .eq('run_id', runId);

      if (error) throw error;

      const uniqueKeys = [...new Set(data?.map((m) => m.key) ?? [])];
      return uniqueKeys.sort();
    },
    enabled: enabled && !!runId,
  });
};

/**
 * Hook to fetch latest metric value for each key in a run
 */
export const useLatestMetrics = (
  runId: string | undefined,
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: [...metricQueryKeys.byRun(runId ?? ''), 'latest'],
    queryFn: async () => {
      if (!runId) throw new Error('Run ID is required');

      // TODO: This should be a server-side function
      const { data, error } = await supabase
        .from('ml_run_metric')
        .select('*')
        .eq('run_id', runId)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      // Get the latest value for each key
      const latestByKey: Record<string, Metric> = {};
      for (const metric of data ?? []) {
        if (!latestByKey[metric.key]) {
          latestByKey[metric.key] = metric;
        }
      }

      return Object.values(latestByKey) as Metric[];
    },
    enabled: enabled && !!runId,
  });
};

/**
 * Hook to compare metrics across multiple runs
 */
export const useCompareMetrics = (
  runIds: string[],
  metricKey: string,
  options: { goalDirection?: 'minimize' | 'maximize'; enabled?: boolean } = {}
) => {
  const { goalDirection = 'maximize', enabled = true } = options;

  return useQuery({
    queryKey: metricQueryKeys.comparison(runIds, metricKey),
    queryFn: async () => {
      if (runIds.length === 0) throw new Error('At least one run ID is required');

      // Fetch runs info
      const { data: runs, error: runsError } = await supabase
        .from('ml_run')
        .select('id, name')
        .in('id', runIds);

      if (runsError) throw runsError;

      // Fetch latest metric value for each run
      // TODO: Use a server-side function for this
      const { data: metrics, error: metricsError } = await supabase
        .from('ml_run_metric')
        .select('*')
        .in('run_id', runIds)
        .eq('key', metricKey)
        .order('timestamp', { ascending: false });

      if (metricsError) throw metricsError;

      // Get latest metric per run
      const latestByRun: Record<string, Metric> = {};
      for (const metric of metrics ?? []) {
        if (!latestByRun[metric.run_id]) {
          latestByRun[metric.run_id] = metric;
        }
      }

      const values = Object.values(latestByRun).map((m) => m.value);
      const bestValue = goalDirection === 'maximize'
        ? Math.max(...values)
        : Math.min(...values);
      const worstValue = goalDirection === 'maximize'
        ? Math.min(...values)
        : Math.max(...values);
      const averageValue = values.reduce((a, b) => a + b, 0) / values.length;

      const bestRunId = Object.entries(latestByRun)
        .find(([, m]) => m.value === bestValue)?.[0] ?? '';

      const runsData = runIds.map((runId) => {
        const run = runs?.find((r) => r.id === runId);
        const metric = latestByRun[runId];
        const value = metric?.value ?? 0;
        const isBest = value === bestValue;
        const deltaFromBest = metric ? value - bestValue : null;

        return {
          run_id: runId,
          run_name: run?.name ?? runId,
          value,
          delta_from_best: deltaFromBest,
          is_best: isBest,
        };
      });

      return {
        metric_key: metricKey,
        runs: runsData,
        best_run_id: bestRunId,
        best_value: bestValue,
        worst_value: worstValue,
        average_value: averageValue,
      } as MetricComparison;
    },
    enabled: enabled && runIds.length > 0 && !!metricKey,
  });
};

/**
 * Hook to aggregate metrics across runs
 */
export const useAggregateMetrics = (
  experimentId: string | undefined,
  metricKey: string,
  aggregation: AggregationType,
  options: { timeRange?: { start: string; end: string }; enabled?: boolean } = {}
) => {
  const { timeRange, enabled = true } = options;

  return useQuery({
    queryKey: metricQueryKeys.aggregation({ experimentId, metricKey, aggregation, timeRange }),
    queryFn: async () => {
      if (!experimentId) throw new Error('Experiment ID is required');

      // Get all runs for experiment
      const { data: runs, error: runsError } = await supabase
        .from('ml_run')
        .select('id')
        .eq('experiment_id', experimentId)
        .eq('status', 'completed');

      if (runsError) throw runsError;

      const runIds = runs?.map((r) => r.id) ?? [];
      if (runIds.length === 0) {
        return {
          key: metricKey,
          aggregation,
          value: 0,
          run_count: 0,
          time_range: timeRange,
        } as MetricAggregation;
      }

      // Get metrics for these runs
      let query = supabase
        .from('ml_run_metric')
        .select('*')
        .in('run_id', runIds)
        .eq('key', metricKey);

      if (timeRange) {
        query = query
          .gte('timestamp', timeRange.start)
          .lte('timestamp', timeRange.end);
      }

      const { data: metrics, error: metricsError } = await query;

      if (metricsError) throw metricsError;

      // Get latest value per run and aggregate
      const latestByRun: Record<string, number> = {};
      for (const metric of metrics ?? []) {
        if (!latestByRun[metric.run_id] || metric.timestamp > metrics!.find((m) => m.value === latestByRun[metric.run_id])!.timestamp) {
          latestByRun[metric.run_id] = metric.value;
        }
      }

      const values = Object.values(latestByRun);
      let aggregatedValue = 0;

      switch (aggregation) {
        case 'min':
          aggregatedValue = Math.min(...values);
          break;
        case 'max':
          aggregatedValue = Math.max(...values);
          break;
        case 'avg':
          aggregatedValue = values.reduce((a, b) => a + b, 0) / values.length;
          break;
        case 'sum':
          aggregatedValue = values.reduce((a, b) => a + b, 0);
          break;
        case 'count':
          aggregatedValue = values.length;
          break;
        case 'last':
          aggregatedValue = values[values.length - 1] ?? 0;
          break;
        case 'first':
          aggregatedValue = values[0] ?? 0;
          break;
      }

      return {
        key: metricKey,
        aggregation,
        value: aggregatedValue,
        run_count: values.length,
        time_range: timeRange,
      } as MetricAggregation;
    },
    enabled: enabled && !!experimentId && !!metricKey,
  });
};

// ============================================================================
// METRIC DEFINITION QUERIES
// ============================================================================

/**
 * Hook to fetch metric definitions
 */
export const useMetricDefinitions = (
  projectId: string | undefined,
  options: ListQueryOptions = {}
) => {
  const {
    pagination = { page: DEFAULT_PAGE, pageSize: DEFAULT_PAGE_SIZE },
    sort,
    filters,
    enabled = true,
  } = options;

  const page = pagination.page ?? DEFAULT_PAGE;
  const pageSize = pagination.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = calculateOffset(page, pageSize);

  return useQuery({
    queryKey: [...metricQueryKeys.definitions(), { projectId, page, pageSize, sort, filters }],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID is required');

      let query = supabase
        .from('ml_metric_definition')
        .select('*', { count: 'exact' })
        .eq('project_id', projectId);

      // Apply filters
      if (filters) {
        for (const filter of filters) {
          // @ts-expect-error - Dynamic filter application
          query = query[filter.operator](filter.column, filter.value);
        }
      }

      // Apply sorting
      if (sort) {
        const sorts = Array.isArray(sort) ? sort : [sort];
        for (const s of sorts) {
          query = query.order(s.column, { ascending: s.ascending ?? true });
        }
      } else {
        query = query.order('key', { ascending: true });
      }

      // Apply pagination
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data as MetricDefinition[],
        count: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      };
    },
    enabled: enabled && !!projectId,
  });
};

/**
 * Hook to fetch a metric definition by key
 */
export const useMetricDefinition = (
  projectId: string | undefined,
  key: string,
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: [...metricQueryKeys.definition(key), projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID is required');

      const { data, error } = await supabase
        .from('ml_metric_definition')
        .select('*')
        .eq('project_id', projectId)
        .eq('key', key)
        .single();

      if (error) {
        // Return null if not found instead of throwing
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data as MetricDefinition;
    },
    enabled: enabled && !!projectId && !!key,
  });
};

// ============================================================================
// METRIC ALERT QUERIES
// ============================================================================

/**
 * Hook to fetch metric alerts
 */
export const useMetricAlerts = (
  tenantId: string | undefined,
  options: { acknowledged?: boolean; alertType?: 'warning' | 'critical'; enabled?: boolean } = {}
) => {
  const { acknowledged, alertType, enabled = true } = options;

  return useQuery({
    queryKey: [...metricQueryKeys.alerts(), { tenantId, acknowledged, alertType }],
    queryFn: async () => {
      if (!tenantId) throw new Error('Tenant ID is required');

      let query = supabase
        .from('ml_metric_alert')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (acknowledged !== undefined) {
        query = query.eq('acknowledged', acknowledged);
      }

      if (alertType) {
        query = query.eq('alert_type', alertType);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data as MetricAlert[];
    },
    enabled: enabled && !!tenantId,
  });
};

/**
 * Hook to fetch unacknowledged alerts count
 */
export const useUnacknowledgedAlertsCount = (
  tenantId: string | undefined,
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: [...metricQueryKeys.alerts(), 'unacknowledged-count', tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error('Tenant ID is required');

      const { count, error } = await supabase
        .from('ml_metric_alert')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('acknowledged', false);

      if (error) throw error;

      return count ?? 0;
    },
    enabled: enabled && !!tenantId,
  });
};

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Hook to create a metric definition
 */
export const useCreateMetricDefinition = (
  options: MutationOptions<MetricDefinition, MetricDefinitionInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: MetricDefinitionInsert) => {
      const { data, error } = await supabase
        .from('ml_metric_definition')
        .insert(input)
        .select()
        .single();

      if (error) throw error;

      return data as MetricDefinition;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: metricQueryKeys.definitions() });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to create metric definition:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to update a metric definition
 */
export const useUpdateMetricDefinition = (
  options: MutationOptions<MetricDefinition, { id: string; data: MetricDefinitionUpdate }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: MetricDefinitionUpdate }) => {
      const { data: result, error } = await supabase
        .from('ml_metric_definition')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return result as MetricDefinition;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: metricQueryKeys.definitions() });
      queryClient.invalidateQueries({ queryKey: metricQueryKeys.definition(data.key) });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to update metric definition:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to delete a metric definition
 */
export const useDeleteMetricDefinition = (
  options: MutationOptions<void, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ml_metric_definition')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: metricQueryKeys.definitions() });
      options.onSuccess?.(undefined, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to delete metric definition:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: (data, error, variables) => {
      options.onSettled?.(data, error, variables);
    },
  });
};

/**
 * Hook to acknowledge a metric alert
 */
export const useAcknowledgeMetricAlert = (
  options: MutationOptions<MetricAlert, { id: string; userId: string }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const { data, error } = await supabase
        .from('ml_metric_alert')
        .update({
          acknowledged: true,
          acknowledged_by: userId,
          acknowledged_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as MetricAlert;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: metricQueryKeys.alerts() });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to acknowledge alert:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to bulk acknowledge metric alerts
 */
export const useBulkAcknowledgeAlerts = (
  options: MutationOptions<void, { alertIds: string[]; userId: string }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ alertIds, userId }: { alertIds: string[]; userId: string }) => {
      const { error } = await supabase
        .from('ml_metric_alert')
        .update({
          acknowledged: true,
          acknowledged_by: userId,
          acknowledged_at: new Date().toISOString(),
        })
        .in('id', alertIds);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: metricQueryKeys.alerts() });
      options.onSuccess?.(undefined, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to bulk acknowledge alerts:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: (data, error, variables) => {
      options.onSettled?.(data, error, variables);
    },
  });
};

// ============================================================================
// TODO: Additional Features
// ============================================================================
// TODO: Add useMetricChart hook for chart data preparation
// TODO: Add useMetricExport hook for exporting metric data
// TODO: Add useMetricDiff hook for comparing metrics between two runs
// TODO: Add useMetricStats hook for statistical analysis
// TODO: Add useMetricTrend hook for trend detection
// TODO: Add useMetricAnomaly hook for anomaly detection
// TODO: Add real-time subscription for metric updates
// TODO: Add useMetricBaseline hook for baseline comparisons
// TODO: Add useMetricGoals hook for goal tracking
// TODO: Add useMetricDashboard hook for dashboard configuration
