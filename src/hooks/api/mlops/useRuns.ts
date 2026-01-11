// ============================================================================
// Run Hooks - React Query Hooks for ML Run Management
// MLOps Control Plane v3
// Author: Armand AMOUSSOU
// Date: 2026-01-04
// ============================================================================

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
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

export type RunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'scheduled';
export type RunSource = 'manual' | 'api' | 'scheduled' | 'pipeline' | 'notebook';

export interface Run {
  id: string;
  tenant_id: string;
  experiment_id: string;
  name: string;
  description: string | null;
  status: RunStatus;
  source: RunSource;
  source_name: string | null;
  source_version: string | null;
  entry_point: string | null;
  user_id: string;
  parent_run_id: string | null;
  start_time: string | null;
  end_time: string | null;
  duration_seconds: number | null;
  artifact_uri: string | null;
  lifecycle_stage: string;
  tags: string[];
  params: Record<string, string | number | boolean>;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface RunInsert {
  tenant_id: string;
  experiment_id: string;
  name: string;
  description?: string | null;
  status?: RunStatus;
  source?: RunSource;
  source_name?: string | null;
  source_version?: string | null;
  entry_point?: string | null;
  user_id: string;
  parent_run_id?: string | null;
  artifact_uri?: string | null;
  tags?: string[];
  params?: Record<string, string | number | boolean>;
  metadata?: Record<string, unknown>;
}

export interface RunUpdate {
  name?: string;
  description?: string | null;
  status?: RunStatus;
  end_time?: string | null;
  artifact_uri?: string | null;
  lifecycle_stage?: string;
  tags?: string[];
  params?: Record<string, string | number | boolean>;
  metadata?: Record<string, unknown>;
}

export interface RunWithMetrics extends Run {
  metrics?: RunMetric[];
  experiment?: {
    id: string;
    name: string;
    project_id: string;
  } | null;
  user?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
  parent_run?: {
    id: string;
    name: string;
  } | null;
  child_runs_count?: number;
}

export interface RunMetric {
  id: string;
  run_id: string;
  key: string;
  value: number;
  timestamp: string | null;
  step: number | null;
  is_nan: boolean;
}

export interface RunParam {
  id: string;
  run_id: string;
  key: string;
  value: string;
}

export interface RunComparison {
  runs: Run[];
  metrics_keys: string[];
  params_keys: string[];
  comparison_matrix: Record<string, Record<string, number | string | null>>;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const runKeys = createQueryKeyFactory<string>('runs');

export const runQueryKeys = {
  all: ['runs'] as const,
  lists: () => [...runQueryKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...runQueryKeys.lists(), params] as const,
  details: () => [...runQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...runQueryKeys.details(), id] as const,
  byExperiment: (experimentId: string) => [...runQueryKeys.all, 'experiment', experimentId] as const,
  byUser: (userId: string) => [...runQueryKeys.all, 'user', userId] as const,
  byStatus: (status: RunStatus) => [...runQueryKeys.all, 'status', status] as const,
  metrics: (runId: string) => [...runQueryKeys.detail(runId), 'metrics'] as const,
  params: (runId: string) => [...runQueryKeys.detail(runId), 'params'] as const,
  children: (runId: string) => [...runQueryKeys.detail(runId), 'children'] as const,
  comparison: (runIds: string[]) => [...runQueryKeys.all, 'comparison', runIds] as const,
};

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Hook to fetch a list of runs
 */
export const useRuns = (options: ListQueryOptions = {}) => {
  const {
    pagination = { page: DEFAULT_PAGE, pageSize: DEFAULT_PAGE_SIZE },
    sort,
    filters,
    search,
    select = '*',
    enabled = true,
  } = options;

  const page = pagination.page ?? DEFAULT_PAGE;
  const pageSize = pagination.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = calculateOffset(page, pageSize);

  return useQuery({
    queryKey: runKeys.list({ page, pageSize, sort, filters, search }),
    queryFn: async () => {
      let query = supabase
        .from('ml_run')
        .select(select, { count: 'exact' });

      // Apply filters
      if (filters) {
        for (const filter of filters) {
          // @ts-expect-error - Dynamic filter application
          query = query[filter.operator](filter.column, filter.value);
        }
      }

      // Apply search
      if (search) {
        query = query.ilike(search.column, `%${search.value}%`);
      }

      // Apply sorting
      if (sort) {
        const sorts = Array.isArray(sort) ? sort : [sort];
        for (const s of sorts) {
          query = query.order(s.column, { ascending: s.ascending ?? true });
        }
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data as Run[],
        count: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      };
    },
    enabled,
  });
};

/**
 * Hook for infinite scrolling runs list
 */
export const useInfiniteRuns = (
  options: Omit<ListQueryOptions, 'pagination'> & { pageSize?: number } = {}
) => {
  const { sort, filters, search, select = '*', enabled = true, pageSize = DEFAULT_PAGE_SIZE } = options;

  return useInfiniteQuery({
    queryKey: runKeys.infinite({ sort, filters, search }),
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('ml_run')
        .select(select, { count: 'exact' });

      // Apply filters
      if (filters) {
        for (const filter of filters) {
          // @ts-expect-error - Dynamic filter application
          query = query[filter.operator](filter.column, filter.value);
        }
      }

      // Apply search
      if (search) {
        query = query.ilike(search.column, `%${search.value}%`);
      }

      // Apply sorting
      if (sort) {
        const sorts = Array.isArray(sort) ? sort : [sort];
        for (const s of sorts) {
          query = query.order(s.column, { ascending: s.ascending ?? true });
        }
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      query = query.range(pageParam, pageParam + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data as Run[],
        count: count ?? 0,
        nextOffset: (pageParam + pageSize < (count ?? 0)) ? pageParam + pageSize : undefined,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    enabled,
  });
};

/**
 * Hook to fetch a single run by ID
 */
export const useRun = (
  id: string | undefined,
  options: { select?: string; enabled?: boolean } = {}
) => {
  const {
    select = `
      *,
      experiment:experiment_id(id, name, project_id),
      user:user_id(id, full_name, avatar_url),
      parent_run:parent_run_id(id, name)
    `,
    enabled = true,
  } = options;

  return useQuery({
    queryKey: runKeys.detail(id ?? ''),
    queryFn: async () => {
      if (!id) throw new Error('Run ID is required');

      const { data, error } = await supabase
        .from('ml_run')
        .select(select)
        .eq('id', id)
        .single();

      if (error) throw error;

      return data as RunWithMetrics;
    },
    enabled: enabled && !!id,
  });
};

/**
 * Hook to fetch runs by experiment
 */
export const useRunsByExperiment = (
  experimentId: string | undefined,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'experiment_id', operator: 'eq' as const, value: experimentId },
  ];

  return useRuns({
    ...options,
    filters,
    enabled: (options.enabled ?? true) && !!experimentId,
  });
};

/**
 * Hook to fetch runs by user
 */
export const useRunsByUser = (
  userId: string | undefined,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'user_id', operator: 'eq' as const, value: userId },
  ];

  return useRuns({
    ...options,
    filters,
    enabled: (options.enabled ?? true) && !!userId,
  });
};

/**
 * Hook to fetch runs by status
 */
export const useRunsByStatus = (
  status: RunStatus,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'status', operator: 'eq' as const, value: status },
  ];

  return useRuns({ ...options, filters });
};

/**
 * Hook to fetch active (running) runs
 */
export const useActiveRuns = (options: ListQueryOptions = {}) => {
  return useRunsByStatus('running', options);
};

/**
 * Hook to fetch failed runs
 */
export const useFailedRuns = (options: ListQueryOptions = {}) => {
  return useRunsByStatus('failed', options);
};

/**
 * Hook to search runs
 */
export const useSearchRuns = (
  searchTerm: string,
  options: ListQueryOptions = {}
) => {
  return useRuns({
    ...options,
    search: { column: 'name', value: searchTerm },
    enabled: (options.enabled ?? true) && searchTerm.length >= 2,
  });
};

/**
 * Hook to fetch child runs of a parent run
 */
export const useChildRuns = (
  parentRunId: string | undefined,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'parent_run_id', operator: 'eq' as const, value: parentRunId },
  ];

  return useRuns({
    ...options,
    filters,
    enabled: (options.enabled ?? true) && !!parentRunId,
  });
};

/**
 * Hook to fetch run metrics
 */
export const useRunMetrics = (
  runId: string | undefined,
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: runQueryKeys.metrics(runId ?? ''),
    queryFn: async () => {
      if (!runId) throw new Error('Run ID is required');

      const { data, error } = await supabase
        .from('ml_run_metric')
        .select('*')
        .eq('run_id', runId)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      return data as RunMetric[];
    },
    enabled: enabled && !!runId,
  });
};

/**
 * Hook to fetch run parameters
 */
export const useRunParams = (
  runId: string | undefined,
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: runQueryKeys.params(runId ?? ''),
    queryFn: async () => {
      if (!runId) throw new Error('Run ID is required');

      const { data, error } = await supabase
        .from('ml_run_param')
        .select('*')
        .eq('run_id', runId);

      if (error) throw error;

      return data as RunParam[];
    },
    enabled: enabled && !!runId,
  });
};

/**
 * Hook to compare multiple runs
 * TODO: Implement server-side comparison function for better performance
 */
export const useCompareRuns = (
  runIds: string[],
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: runQueryKeys.comparison(runIds),
    queryFn: async () => {
      if (runIds.length === 0) throw new Error('At least one run ID is required');

      // Fetch all runs
      const { data: runs, error: runsError } = await supabase
        .from('ml_run')
        .select('*')
        .in('id', runIds);

      if (runsError) throw runsError;

      // Fetch all metrics for these runs
      const { data: metrics, error: metricsError } = await supabase
        .from('ml_run_metric')
        .select('*')
        .in('run_id', runIds);

      if (metricsError) throw metricsError;

      // Build comparison matrix
      const metricsKeys = [...new Set(metrics?.map((m) => m.key) ?? [])];
      const paramsKeys = [...new Set(runs?.flatMap((r) => Object.keys(r.params ?? {})) ?? [])];

      const comparisonMatrix: Record<string, Record<string, number | string | null>> = {};

      for (const run of runs ?? []) {
        comparisonMatrix[run.id] = {};

        // Add metrics
        for (const key of metricsKeys) {
          const metric = metrics?.find((m) => m.run_id === run.id && m.key === key);
          comparisonMatrix[run.id][`metric_${key}`] = metric?.value ?? null;
        }

        // Add params
        for (const key of paramsKeys) {
          comparisonMatrix[run.id][`param_${key}`] = run.params?.[key] ?? null;
        }
      }

      return {
        runs: runs as Run[],
        metrics_keys: metricsKeys,
        params_keys: paramsKeys,
        comparison_matrix: comparisonMatrix,
      } as RunComparison;
    },
    enabled: enabled && runIds.length > 0,
  });
};

/**
 * Hook to get best run from an experiment based on a metric
 */
export const useBestRun = (
  experimentId: string | undefined,
  metricKey: string,
  options: { maximize?: boolean; enabled?: boolean } = {}
) => {
  const { maximize = true, enabled = true } = options;

  return useQuery({
    queryKey: [...runQueryKeys.byExperiment(experimentId ?? ''), 'best', metricKey, maximize],
    queryFn: async () => {
      if (!experimentId) throw new Error('Experiment ID is required');

      // TODO: This should be a server-side function for performance
      // Get all completed runs for this experiment
      const { data: runs, error: runsError } = await supabase
        .from('ml_run')
        .select('*')
        .eq('experiment_id', experimentId)
        .eq('status', 'completed');

      if (runsError) throw runsError;
      if (!runs || runs.length === 0) return null;

      // Get metrics for these runs
      const { data: metrics, error: metricsError } = await supabase
        .from('ml_run_metric')
        .select('*')
        .in('run_id', runs.map((r) => r.id))
        .eq('key', metricKey);

      if (metricsError) throw metricsError;
      if (!metrics || metrics.length === 0) return null;

      // Find best metric value
      const sortedMetrics = [...metrics].sort((a, b) => {
        return maximize ? b.value - a.value : a.value - b.value;
      });

      const bestMetric = sortedMetrics[0];
      const bestRun = runs.find((r) => r.id === bestMetric.run_id);

      return bestRun as Run | null;
    },
    enabled: enabled && !!experimentId,
  });
};

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Hook to create a new run
 */
export const useCreateRun = (
  options: MutationOptions<Run, RunInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RunInsert) => {
      const { data, error } = await supabase
        .from('ml_run')
        .insert({
          ...input,
          start_time: new Date().toISOString(),
          status: input.status ?? 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      return data as Run;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: runKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: runQueryKeys.byExperiment(variables.experiment_id)
      });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to create run:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to update a run
 */
export const useUpdateRun = (
  options: MutationOptions<Run, { id: string; data: RunUpdate }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: RunUpdate }) => {
      const { data: result, error } = await supabase
        .from('ml_run')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return result as Run;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: runKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: runKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to update run:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to start a run
 */
export const useStartRun = (
  options: MutationOptions<Run, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('ml_run')
        .update({
          status: 'running' as RunStatus,
          start_time: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as Run;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: runKeys.detail(variables) });
      queryClient.invalidateQueries({ queryKey: runKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to start run:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to complete a run
 */
export const useCompleteRun = (
  options: MutationOptions<Run, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // First get the run to calculate duration
      const { data: run, error: fetchError } = await supabase
        .from('ml_run')
        .select('start_time')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const endTime = new Date();
      const startTime = run.start_time ? new Date(run.start_time) : endTime;
      const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

      const { data, error } = await supabase
        .from('ml_run')
        .update({
          status: 'completed' as RunStatus,
          end_time: endTime.toISOString(),
          duration_seconds: durationSeconds,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as Run;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: runKeys.detail(variables) });
      queryClient.invalidateQueries({ queryKey: runKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to complete run:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to fail a run
 */
export const useFailRun = (
  options: MutationOptions<Run, { id: string; error_message?: string }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, error_message }: { id: string; error_message?: string }) => {
      // First get the run to calculate duration
      const { data: run, error: fetchError } = await supabase
        .from('ml_run')
        .select('start_time, metadata')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const endTime = new Date();
      const startTime = run.start_time ? new Date(run.start_time) : endTime;
      const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

      const metadata = {
        ...(run.metadata as Record<string, unknown> ?? {}),
        error_message,
        failed_at: endTime.toISOString(),
      };

      const { data, error } = await supabase
        .from('ml_run')
        .update({
          status: 'failed' as RunStatus,
          end_time: endTime.toISOString(),
          duration_seconds: durationSeconds,
          metadata,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as Run;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: runKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: runKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to fail run:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to cancel a run
 */
export const useCancelRun = (
  options: MutationOptions<Run, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('ml_run')
        .update({
          status: 'cancelled' as RunStatus,
          end_time: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as Run;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: runKeys.detail(variables) });
      queryClient.invalidateQueries({ queryKey: runKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to cancel run:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to delete a run
 */
export const useDeleteRun = (
  options: MutationOptions<void, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ml_run')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: runKeys.all });
      options.onSuccess?.(undefined, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to delete run:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: (data, error, variables) => {
      options.onSettled?.(data, error, variables);
    },
  });
};

/**
 * Hook to log a metric for a run
 */
export const useLogRunMetric = (
  options: MutationOptions<RunMetric, { run_id: string; key: string; value: number; step?: number }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { run_id: string; key: string; value: number; step?: number }) => {
      const { data, error } = await supabase
        .from('ml_run_metric')
        .insert({
          run_id: input.run_id,
          key: input.key,
          value: input.value,
          step: input.step,
          timestamp: new Date().toISOString(),
          is_nan: Number.isNaN(input.value),
        })
        .select()
        .single();

      if (error) throw error;

      return data as RunMetric;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: runQueryKeys.metrics(variables.run_id) });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to log metric:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to batch log metrics for a run
 */
export const useBatchLogRunMetrics = (
  options: MutationOptions<RunMetric[], { run_id: string; metrics: { key: string; value: number; step?: number }[] }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { run_id: string; metrics: { key: string; value: number; step?: number }[] }) => {
      const timestamp = new Date().toISOString();
      const metricsToInsert = input.metrics.map((m) => ({
        run_id: input.run_id,
        key: m.key,
        value: m.value,
        step: m.step,
        timestamp,
        is_nan: Number.isNaN(m.value),
      }));

      const { data, error } = await supabase
        .from('ml_run_metric')
        .insert(metricsToInsert)
        .select();

      if (error) throw error;

      return data as RunMetric[];
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: runQueryKeys.metrics(variables.run_id) });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to batch log metrics:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to set a parameter for a run
 */
export const useSetRunParam = (
  options: MutationOptions<RunParam, { run_id: string; key: string; value: string }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { run_id: string; key: string; value: string }) => {
      // Upsert the parameter
      const { data, error } = await supabase
        .from('ml_run_param')
        .upsert({
          run_id: input.run_id,
          key: input.key,
          value: input.value,
        }, { onConflict: 'run_id,key' })
        .select()
        .single();

      if (error) throw error;

      return data as RunParam;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: runQueryKeys.params(variables.run_id) });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to set param:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to update run tags
 */
export const useUpdateRunTags = (
  options: MutationOptions<Run, { id: string; tags: string[] }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, tags }: { id: string; tags: string[] }) => {
      const { data, error } = await supabase
        .from('ml_run')
        .update({ tags })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as Run;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: runKeys.detail(variables.id) });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to update run tags:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

// ============================================================================
// TODO: Additional Features
// ============================================================================
// TODO: Add useRunLogs hook for streaming run logs
// TODO: Add useRunArtifacts hook for fetching run artifacts
// TODO: Add useCloneRun hook for cloning/reproducing a run
// TODO: Add useResumeRun hook for resuming a failed run
// TODO: Add useScheduleRun hook for scheduling a run
// TODO: Add real-time subscription hooks for run status changes
// TODO: Add aggregation hooks for run statistics
// TODO: Add useRunLineage hook for tracking run provenance
