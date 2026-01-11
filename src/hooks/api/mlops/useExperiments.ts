// ============================================================================
// Experiment Hooks - React Query Hooks for ML Experiment Management
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

export type ExperimentStatus = 'active' | 'completed' | 'archived';

export interface Experiment {
  id: string;
  tenant_id: string;
  project_id: string;
  name: string;
  description: string | null;
  status: ExperimentStatus;
  tags: string[];
  metadata: Record<string, unknown>;
  artifact_location: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface ExperimentInsert {
  tenant_id: string;
  project_id: string;
  name: string;
  description?: string | null;
  status?: ExperimentStatus;
  tags?: string[];
  metadata?: Record<string, unknown>;
  artifact_location?: string | null;
  created_by?: string | null;
}

export interface ExperimentUpdate {
  name?: string;
  description?: string | null;
  status?: ExperimentStatus;
  tags?: string[];
  metadata?: Record<string, unknown>;
  artifact_location?: string | null;
}

export interface ExperimentWithStats extends Experiment {
  runs_count?: number;
  best_run?: {
    id: string;
    name: string;
    metrics: Record<string, number>;
  } | null;
  project?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const experimentKeys = createQueryKeyFactory<string>('experiments');

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Hook to fetch a list of experiments
 */
export const useExperiments = (options: ListQueryOptions = {}) => {
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
    queryKey: experimentKeys.list({ page, pageSize, sort, filters, search }),
    queryFn: async () => {
      let query = supabase
        .from('experiment')
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
        query = query.order('updated_at', { ascending: false });
      }

      // Apply pagination
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data as Experiment[],
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
 * Hook for infinite scrolling experiment list
 */
export const useInfiniteExperiments = (
  options: Omit<ListQueryOptions, 'pagination'> & { pageSize?: number } = {}
) => {
  const { sort, filters, search, select = '*', enabled = true, pageSize = DEFAULT_PAGE_SIZE } = options;

  return useInfiniteQuery({
    queryKey: experimentKeys.infinite({ sort, filters, search }),
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('experiment')
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
        query = query.order('updated_at', { ascending: false });
      }

      // Apply pagination
      query = query.range(pageParam, pageParam + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data as Experiment[],
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
 * Hook to fetch a single experiment by ID
 */
export const useExperiment = (
  id: string | undefined,
  options: { select?: string; enabled?: boolean } = {}
) => {
  const {
    select = `
      *,
      project:project_id(id, name, slug)
    `,
    enabled = true,
  } = options;

  return useQuery({
    queryKey: experimentKeys.detail(id ?? ''),
    queryFn: async () => {
      if (!id) throw new Error('Experiment ID is required');

      const { data, error } = await supabase
        .from('experiment')
        .select(select)
        .eq('id', id)
        .single();

      if (error) throw error;

      return data as ExperimentWithStats;
    },
    enabled: enabled && !!id,
  });
};

/**
 * Hook to fetch experiments by project
 */
export const useExperimentsByProject = (
  projectId: string | undefined,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'project_id', operator: 'eq' as const, value: projectId },
  ];

  return useExperiments({
    ...options,
    filters,
    enabled: (options.enabled ?? true) && !!projectId,
  });
};

/**
 * Hook to fetch active experiments
 */
export const useActiveExperiments = (options: ListQueryOptions = {}) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'status', operator: 'eq' as const, value: 'active' },
  ];

  return useExperiments({ ...options, filters });
};

/**
 * Hook to search experiments
 */
export const useSearchExperiments = (
  searchTerm: string,
  options: ListQueryOptions = {}
) => {
  return useExperiments({
    ...options,
    search: { column: 'name', value: searchTerm },
    enabled: (options.enabled ?? true) && searchTerm.length >= 2,
  });
};

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Hook to create a new experiment
 */
export const useCreateExperiment = (
  options: MutationOptions<Experiment, ExperimentInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ExperimentInsert) => {
      const { data, error } = await supabase
        .from('experiment')
        .insert(input)
        .select()
        .single();

      if (error) throw error;

      return data as Experiment;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: experimentKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to create experiment:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to update an experiment
 */
export const useUpdateExperiment = (
  options: MutationOptions<Experiment, { id: string; data: ExperimentUpdate }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ExperimentUpdate }) => {
      const { data: result, error } = await supabase
        .from('experiment')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return result as Experiment;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: experimentKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: experimentKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to update experiment:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to delete an experiment
 */
export const useDeleteExperiment = (
  options: MutationOptions<void, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('experiment')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: experimentKeys.all });
      options.onSuccess?.(undefined, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to delete experiment:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: (data, error, variables) => {
      options.onSettled?.(data, error, variables);
    },
  });
};

/**
 * Hook to archive an experiment
 */
export const useArchiveExperiment = (
  options: MutationOptions<Experiment, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('experiment')
        .update({ status: 'archived' as ExperimentStatus })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as Experiment;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: experimentKeys.detail(variables) });
      queryClient.invalidateQueries({ queryKey: experimentKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to archive experiment:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to complete an experiment
 */
export const useCompleteExperiment = (
  options: MutationOptions<Experiment, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('experiment')
        .update({ status: 'completed' as ExperimentStatus })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as Experiment;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: experimentKeys.detail(variables) });
      queryClient.invalidateQueries({ queryKey: experimentKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to complete experiment:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to update experiment tags
 */
export const useUpdateExperimentTags = (
  options: MutationOptions<Experiment, { id: string; tags: string[] }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, tags }: { id: string; tags: string[] }) => {
      const { data, error } = await supabase
        .from('experiment')
        .update({ tags })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as Experiment;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: experimentKeys.detail(variables.id) });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to update experiment tags:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to restore an archived experiment.
 *
 * Parameters
 * ----------
 * options : MutationOptions
 *     Optional mutation configuration including onSuccess, onError callbacks.
 *
 * Returns
 * -------
 * UseMutationResult
 *     The mutation result containing mutate function and status.
 */
export const useRestoreExperiment = (
  options: MutationOptions<Experiment, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('experiment')
        .update({ status: 'active' as ExperimentStatus })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as Experiment;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: experimentKeys.detail(variables) });
      queryClient.invalidateQueries({ queryKey: experimentKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to restore experiment:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

// ============================================================================
// EXPERIMENT STATISTICS
// ============================================================================

export interface ExperimentStats {
  experimentId: string;
  totalRuns: number;
  completedRuns: number;
  failedRuns: number;
  runningRuns: number;
  avgDurationSeconds: number | null;
  bestMetricValue: number | null;
  bestMetricKey: string | null;
}

/**
 * Hook to fetch experiment statistics.
 *
 * Retrieves aggregate statistics for an experiment including run counts,
 * average duration, and best metric values.
 *
 * Parameters
 * ----------
 * experimentId : string | undefined
 *     The ID of the experiment to get statistics for.
 * metricKey : string
 *     The metric key to use for determining the best run (default: 'accuracy').
 * options : object
 *     Optional configuration including enabled flag.
 *
 * Returns
 * -------
 * UseQueryResult
 *     The query result containing experiment statistics.
 */
export const useExperimentStats = (
  experimentId: string | undefined,
  metricKey: string = 'accuracy',
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['experiments', 'stats', experimentId, metricKey],
    queryFn: async (): Promise<ExperimentStats> => {
      if (!experimentId) throw new Error('Experiment ID is required');

      // Fetch all runs for this experiment
      const { data: runs, error } = await supabase
        .from('ml_run')
        .select('id, status, duration_seconds')
        .eq('experiment_id', experimentId);

      if (error) throw error;

      const runsList = runs ?? [];

      // Calculate statistics
      const totalRuns = runsList.length;
      const completedRuns = runsList.filter((r) => r.status === 'completed').length;
      const failedRuns = runsList.filter((r) => r.status === 'failed').length;
      const runningRuns = runsList.filter((r) => r.status === 'running').length;

      // Calculate average duration
      const durations = runsList
        .filter((r) => r.duration_seconds !== null && r.duration_seconds !== undefined)
        .map((r) => r.duration_seconds as number);

      const avgDurationSeconds = durations.length > 0
        ? durations.reduce((sum, d) => sum + d, 0) / durations.length
        : null;

      // Fetch best metric value if runs exist
      let bestMetricValue: number | null = null;
      let bestMetricKey: string | null = null;

      if (runsList.length > 0) {
        const runIds = runsList.map((r) => r.id);
        const { data: metrics, error: metricsError } = await supabase
          .from('run_metric')
          .select('key, value')
          .in('run_id', runIds)
          .eq('key', metricKey)
          .order('value', { ascending: false })
          .limit(1);

        if (!metricsError && metrics && metrics.length > 0) {
          bestMetricValue = metrics[0].value;
          bestMetricKey = metrics[0].key;
        }
      }

      return {
        experimentId,
        totalRuns,
        completedRuns,
        failedRuns,
        runningRuns,
        avgDurationSeconds,
        bestMetricValue,
        bestMetricKey,
      };
    },
    enabled: enabled && !!experimentId,
  });
};

/**
 * Hook to compare multiple experiments.
 *
 * Parameters
 * ----------
 * experimentIds : string[]
 *     Array of experiment IDs to compare.
 * options : object
 *     Optional configuration including enabled flag.
 *
 * Returns
 * -------
 * UseQueryResult
 *     The query result containing comparison data.
 */
export const useCompareExperiments = (
  experimentIds: string[],
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['experiments', 'compare', experimentIds],
    queryFn: async () => {
      if (experimentIds.length === 0) {
        return [];
      }

      const { data, error } = await supabase
        .from('experiment')
        .select(`
          *,
          runs:run(id, status, duration_seconds)
        `)
        .in('id', experimentIds);

      if (error) throw error;

      return data;
    },
    enabled: enabled && experimentIds.length > 0,
  });
};
