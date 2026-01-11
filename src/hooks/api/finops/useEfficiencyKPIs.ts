// ============================================================================
// Efficiency KPIs Hooks - React Query Hooks for ML Operations Efficiency
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

/**
 * Efficiency KPI snapshot structure for daily ML operations metrics
 */
export interface EfficiencyKPISnapshot {
  id: string;
  tenant_id: string;
  project_id: string;
  date_key: string;
  cpu_hours: number | null;
  gpu_hours: number | null;
  cost_amount: number | null;
  co2e_kg: number | null;
  success_rate: number | null;
  mean_duration_sec: number | null;
  created_at: string;
}

export interface EfficiencyKPISnapshotInsert {
  tenant_id: string;
  project_id: string;
  date_key: string;
  cpu_hours?: number | null;
  gpu_hours?: number | null;
  cost_amount?: number | null;
  co2e_kg?: number | null;
  success_rate?: number | null;
  mean_duration_sec?: number | null;
}

export interface EfficiencyKPISnapshotUpdate {
  cpu_hours?: number | null;
  gpu_hours?: number | null;
  cost_amount?: number | null;
  co2e_kg?: number | null;
  success_rate?: number | null;
  mean_duration_sec?: number | null;
}

/**
 * Derived efficiency metrics
 */
export interface EfficiencyMetrics {
  // Cost efficiency
  costPerSuccessfulRun: number;
  costPerGPUHour: number;
  costPerCPUHour: number;

  // Carbon efficiency
  co2ePerSuccessfulRun: number;
  co2ePerGPUHour: number;
  co2ePerCPUHour: number;

  // Time efficiency
  averageDurationMinutes: number;
  throughputRunsPerDay: number;

  // Overall efficiency score (0-100)
  efficiencyScore: number;
}

/**
 * Time granularity for KPI aggregations
 */
export type KPIGranularity = 'daily' | 'weekly' | 'monthly';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const efficiencyKPIKeys = createQueryKeyFactory<string>('efficiencyKPIs');

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate derived efficiency metrics from snapshots
 */
function calculateEfficiencyMetrics(snapshots: EfficiencyKPISnapshot[]): EfficiencyMetrics {
  if (snapshots.length === 0) {
    return {
      costPerSuccessfulRun: 0,
      costPerGPUHour: 0,
      costPerCPUHour: 0,
      co2ePerSuccessfulRun: 0,
      co2ePerGPUHour: 0,
      co2ePerCPUHour: 0,
      averageDurationMinutes: 0,
      throughputRunsPerDay: 0,
      efficiencyScore: 0,
    };
  }

  const totals = snapshots.reduce(
    (acc, s) => ({
      cpuHours: acc.cpuHours + (s.cpu_hours ?? 0),
      gpuHours: acc.gpuHours + (s.gpu_hours ?? 0),
      cost: acc.cost + (s.cost_amount ?? 0),
      co2e: acc.co2e + (s.co2e_kg ?? 0),
      successRate: acc.successRate + (s.success_rate ?? 0),
      duration: acc.duration + (s.mean_duration_sec ?? 0),
      count: acc.count + 1,
    }),
    { cpuHours: 0, gpuHours: 0, cost: 0, co2e: 0, successRate: 0, duration: 0, count: 0 }
  );

  const avgSuccessRate = totals.successRate / totals.count;
  const avgDurationSec = totals.duration / totals.count;

  // Estimate total runs based on compute hours (rough approximation)
  const estimatedRuns = Math.max(1, totals.count * 10); // Assume ~10 runs per day
  const successfulRuns = estimatedRuns * (avgSuccessRate / 100);

  // Cost metrics
  const costPerSuccessfulRun = successfulRuns > 0 ? totals.cost / successfulRuns : 0;
  const costPerGPUHour = totals.gpuHours > 0 ? totals.cost / totals.gpuHours : 0;
  const costPerCPUHour = totals.cpuHours > 0 ? totals.cost / totals.cpuHours : 0;

  // Carbon metrics
  const co2ePerSuccessfulRun = successfulRuns > 0 ? totals.co2e / successfulRuns : 0;
  const co2ePerGPUHour = totals.gpuHours > 0 ? totals.co2e / totals.gpuHours : 0;
  const co2ePerCPUHour = totals.cpuHours > 0 ? totals.co2e / totals.cpuHours : 0;

  // Time metrics
  const averageDurationMinutes = avgDurationSec / 60;
  const throughputRunsPerDay = estimatedRuns / totals.count;

  // Calculate efficiency score (0-100)
  // Higher success rate, lower cost per run, lower carbon = better
  const successScore = avgSuccessRate; // 0-100
  const costScore = Math.max(0, 100 - costPerSuccessfulRun * 10); // Penalize high cost
  const carbonScore = Math.max(0, 100 - co2ePerSuccessfulRun * 100); // Penalize high carbon
  const speedScore = Math.max(0, 100 - averageDurationMinutes); // Penalize long runs

  const efficiencyScore = Math.round(
    (successScore * 0.3 + costScore * 0.3 + carbonScore * 0.2 + speedScore * 0.2)
  );

  return {
    costPerSuccessfulRun,
    costPerGPUHour,
    costPerCPUHour,
    co2ePerSuccessfulRun,
    co2ePerGPUHour,
    co2ePerCPUHour,
    averageDurationMinutes,
    throughputRunsPerDay,
    efficiencyScore: Math.min(100, Math.max(0, efficiencyScore)),
  };
}

// ============================================================================
// EFFICIENCY KPI QUERIES
// ============================================================================

/**
 * Hook to fetch a list of Efficiency KPI Snapshots
 */
export const useEfficiencyKPISnapshots = (options: ListQueryOptions = {}) => {
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
    queryKey: efficiencyKPIKeys.list({ page, pageSize, sort, filters, search }),
    queryFn: async () => {
      let query = supabase
        .from('efficiency_kpi_snapshot')
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
        query = query.order('date_key', { ascending: false });
      }

      // Apply pagination
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data as EfficiencyKPISnapshot[],
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
 * Hook to fetch a single Efficiency KPI Snapshot by ID
 */
export const useEfficiencyKPISnapshot = (
  id: string | undefined,
  options: { select?: string; enabled?: boolean } = {}
) => {
  const { select = '*', enabled = true } = options;

  return useQuery({
    queryKey: efficiencyKPIKeys.detail(id ?? ''),
    queryFn: async () => {
      if (!id) throw new Error('Efficiency KPI Snapshot ID is required');

      const { data, error } = await supabase
        .from('efficiency_kpi_snapshot')
        .select(select)
        .eq('id', id)
        .single();

      if (error) throw error;

      return data as EfficiencyKPISnapshot;
    },
    enabled: enabled && !!id,
  });
};

/**
 * Hook to fetch Efficiency KPI Snapshots by project
 */
export const useEfficiencyKPIsByProject = (
  projectId: string,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'project_id', operator: 'eq' as const, value: projectId },
  ];

  return useEfficiencyKPISnapshots({ ...options, filters });
};

/**
 * Hook to fetch Efficiency KPI Snapshots by date range
 */
export const useEfficiencyKPIsByDateRange = (
  startDate: string,
  endDate: string,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'date_key', operator: 'gte' as const, value: startDate },
    { column: 'date_key', operator: 'lte' as const, value: endDate },
  ];

  return useEfficiencyKPISnapshots({ ...options, filters });
};

/**
 * Hook to get efficiency metrics for a project
 */
export const useProjectEfficiencyMetrics = (
  projectId: string,
  dateRange?: { start: string; end: string },
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['efficiencyKPIs', 'metrics', projectId, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('efficiency_kpi_snapshot')
        .select('*')
        .eq('project_id', projectId)
        .order('date_key', { ascending: false });

      if (dateRange) {
        query = query
          .gte('date_key', dateRange.start)
          .lte('date_key', dateRange.end);
      }

      const { data, error } = await query;

      if (error) throw error;

      return calculateEfficiencyMetrics(data as EfficiencyKPISnapshot[]);
    },
    enabled: enabled && !!projectId,
  });
};

/**
 * Hook to get efficiency trends over time
 */
export const useEfficiencyTrends = (
  projectId: string,
  dateRange: { start: string; end: string },
  granularity: KPIGranularity = 'daily',
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['efficiencyKPIs', 'trends', projectId, dateRange, granularity],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('efficiency_kpi_snapshot')
        .select('*')
        .eq('project_id', projectId)
        .gte('date_key', dateRange.start)
        .lte('date_key', dateRange.end)
        .order('date_key');

      if (error) throw error;

      const snapshots = data as EfficiencyKPISnapshot[];

      // Group by period based on granularity
      const grouped = new Map<string, EfficiencyKPISnapshot[]>();

      snapshots.forEach((s) => {
        const date = new Date(s.date_key);
        let periodKey: string;

        switch (granularity) {
          case 'daily':
            periodKey = s.date_key;
            break;
          case 'weekly': {
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            periodKey = weekStart.toISOString().split('T')[0];
            break;
          }
          case 'monthly':
            periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            break;
        }

        const current = grouped.get(periodKey) ?? [];
        current.push(s);
        grouped.set(periodKey, current);
      });

      // Calculate metrics for each period
      return Array.from(grouped.entries())
        .map(([period, snapshots]) => ({
          period,
          ...calculateEfficiencyMetrics(snapshots),
          dataPoints: snapshots.length,
        }))
        .sort((a, b) => a.period.localeCompare(b.period));
    },
    enabled: enabled && !!projectId,
  });
};

/**
 * Hook to compare efficiency across projects
 */
export const useProjectEfficiencyComparison = (
  projectIds: string[],
  dateRange?: { start: string; end: string },
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['efficiencyKPIs', 'comparison', projectIds, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('efficiency_kpi_snapshot')
        .select('*')
        .in('project_id', projectIds);

      if (dateRange) {
        query = query
          .gte('date_key', dateRange.start)
          .lte('date_key', dateRange.end);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Group by project
      const byProject = new Map<string, EfficiencyKPISnapshot[]>();
      (data as EfficiencyKPISnapshot[]).forEach((s) => {
        const current = byProject.get(s.project_id) ?? [];
        current.push(s);
        byProject.set(s.project_id, current);
      });

      // Calculate metrics for each project
      return Array.from(byProject.entries())
        .map(([projectId, snapshots]) => ({
          projectId,
          ...calculateEfficiencyMetrics(snapshots),
          dataPoints: snapshots.length,
        }))
        .sort((a, b) => b.efficiencyScore - a.efficiencyScore);
    },
    enabled: enabled && projectIds.length > 0,
  });
};

/**
 * Hook to get top performing projects
 */
export const useTopPerformingProjects = (
  limit: number = 10,
  dateRange?: { start: string; end: string },
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['efficiencyKPIs', 'topProjects', limit, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('efficiency_kpi_snapshot')
        .select('project_id, success_rate, cost_amount, co2e_kg');

      if (dateRange) {
        query = query
          .gte('date_key', dateRange.start)
          .lte('date_key', dateRange.end);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Group by project and calculate efficiency
      const byProject = new Map<string, { successSum: number; costSum: number; co2eSum: number; count: number }>();

      data?.forEach((s) => {
        const current = byProject.get(s.project_id) ?? { successSum: 0, costSum: 0, co2eSum: 0, count: 0 };
        current.successSum += s.success_rate ?? 0;
        current.costSum += s.cost_amount ?? 0;
        current.co2eSum += s.co2e_kg ?? 0;
        current.count++;
        byProject.set(s.project_id, current);
      });

      // Calculate simple efficiency score and sort
      return Array.from(byProject.entries())
        .map(([projectId, stats]) => {
          const avgSuccess = stats.successSum / stats.count;
          const avgCost = stats.costSum / stats.count;
          const avgCO2e = stats.co2eSum / stats.count;
          // Simple score: high success, low cost, low carbon
          const score = avgSuccess - avgCost * 0.1 - avgCO2e * 10;
          return {
            projectId,
            averageSuccessRate: avgSuccess,
            averageCost: avgCost,
            averageCO2e: avgCO2e,
            efficiencyScore: Math.max(0, Math.min(100, score)),
            dataPoints: stats.count,
          };
        })
        .sort((a, b) => b.efficiencyScore - a.efficiencyScore)
        .slice(0, limit);
    },
    enabled,
  });
};

/**
 * Hook to get global efficiency summary
 */
export const useGlobalEfficiencySummary = (
  dateRange?: { start: string; end: string },
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['efficiencyKPIs', 'globalSummary', dateRange],
    queryFn: async () => {
      let query = supabase
        .from('efficiency_kpi_snapshot')
        .select('*');

      if (dateRange) {
        query = query
          .gte('date_key', dateRange.start)
          .lte('date_key', dateRange.end);
      }

      const { data, error } = await query;

      if (error) throw error;

      const snapshots = data as EfficiencyKPISnapshot[];

      // Calculate global totals
      const totals = snapshots.reduce(
        (acc, s) => ({
          cpuHours: acc.cpuHours + (s.cpu_hours ?? 0),
          gpuHours: acc.gpuHours + (s.gpu_hours ?? 0),
          cost: acc.cost + (s.cost_amount ?? 0),
          co2e: acc.co2e + (s.co2e_kg ?? 0),
        }),
        { cpuHours: 0, gpuHours: 0, cost: 0, co2e: 0 }
      );

      // Count unique projects
      const uniqueProjects = new Set(snapshots.map((s) => s.project_id));

      return {
        totalCPUHours: totals.cpuHours,
        totalGPUHours: totals.gpuHours,
        totalCost: totals.cost,
        totalCO2eKg: totals.co2e,
        totalCO2eTonnes: totals.co2e / 1000,
        snapshotCount: snapshots.length,
        projectCount: uniqueProjects.size,
        metrics: calculateEfficiencyMetrics(snapshots),
      };
    },
    enabled,
  });
};

// ============================================================================
// EFFICIENCY KPI MUTATIONS
// ============================================================================

/**
 * Hook to create a new Efficiency KPI Snapshot
 */
export const useCreateEfficiencyKPISnapshot = (
  options: MutationOptions<EfficiencyKPISnapshot, EfficiencyKPISnapshotInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: EfficiencyKPISnapshotInsert) => {
      const { data, error } = await supabase
        .from('efficiency_kpi_snapshot')
        .insert(input)
        .select()
        .single();

      if (error) throw error;

      return data as EfficiencyKPISnapshot;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: efficiencyKPIKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['efficiencyKPIs', 'metrics'] });
      queryClient.invalidateQueries({ queryKey: ['efficiencyKPIs', 'trends'] });
      queryClient.invalidateQueries({ queryKey: ['efficiencyKPIs', 'globalSummary'] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to create Efficiency KPI Snapshot:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to update an Efficiency KPI Snapshot
 */
export const useUpdateEfficiencyKPISnapshot = (
  options: MutationOptions<EfficiencyKPISnapshot, { id: string; data: EfficiencyKPISnapshotUpdate }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EfficiencyKPISnapshotUpdate }) => {
      const { data: result, error } = await supabase
        .from('efficiency_kpi_snapshot')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return result as EfficiencyKPISnapshot;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: efficiencyKPIKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: efficiencyKPIKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['efficiencyKPIs', 'metrics'] });
      queryClient.invalidateQueries({ queryKey: ['efficiencyKPIs', 'trends'] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to update Efficiency KPI Snapshot:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to delete an Efficiency KPI Snapshot
 */
export const useDeleteEfficiencyKPISnapshot = (
  options: MutationOptions<void, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('efficiency_kpi_snapshot')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: efficiencyKPIKeys.all });
      queryClient.invalidateQueries({ queryKey: ['efficiencyKPIs', 'metrics'] });
      queryClient.invalidateQueries({ queryKey: ['efficiencyKPIs', 'trends'] });
      options.onSuccess?.(undefined, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to delete Efficiency KPI Snapshot:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: (data, error, variables) => {
      options.onSettled?.(data, error, variables);
    },
  });
};

/**
 * Hook to generate daily KPI snapshot from runs
 */
export const useGenerateDailyKPISnapshot = (
  options: MutationOptions<EfficiencyKPISnapshot, { projectId: string; date: string }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, date }: { projectId: string; date: string }) => {
      // TODO: Implement actual KPI calculation from runs via Edge Function
      // This would:
      // 1. Fetch all runs for the project on the given date
      // 2. Calculate CPU/GPU hours from run durations and compute profiles
      // 3. Aggregate costs from cost_record table
      // 4. Calculate success rate from run statuses
      // 5. Calculate carbon from carbon_record table or estimate

      // Check if snapshot already exists
      const { data: existing } = await supabase
        .from('efficiency_kpi_snapshot')
        .select('id')
        .eq('project_id', projectId)
        .eq('date_key', date)
        .single();

      if (existing) {
        throw new Error(`Snapshot already exists for ${date}`);
      }

      // For now, create a placeholder snapshot
      const { data, error } = await supabase
        .from('efficiency_kpi_snapshot')
        .insert({
          project_id: projectId,
          date_key: date,
          cpu_hours: 0,
          gpu_hours: 0,
          cost_amount: 0,
          co2e_kg: 0,
          success_rate: 0,
          mean_duration_sec: 0,
        })
        .select()
        .single();

      if (error) throw error;

      return data as EfficiencyKPISnapshot;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: efficiencyKPIKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['efficiencyKPIs', 'metrics', variables.projectId] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to generate KPI snapshot:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to bulk create KPI snapshots
 */
export const useBulkCreateEfficiencyKPISnapshots = (
  options: MutationOptions<EfficiencyKPISnapshot[], EfficiencyKPISnapshotInsert[]> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (snapshots: EfficiencyKPISnapshotInsert[]) => {
      const { data, error } = await supabase
        .from('efficiency_kpi_snapshot')
        .insert(snapshots)
        .select();

      if (error) throw error;

      return data as EfficiencyKPISnapshot[];
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: efficiencyKPIKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['efficiencyKPIs', 'metrics'] });
      queryClient.invalidateQueries({ queryKey: ['efficiencyKPIs', 'globalSummary'] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to bulk create KPI snapshots:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

// ============================================================================
// TODO: Future Enhancements
// ============================================================================
// TODO: Add useEfficiencyBenchmarks hook for industry benchmarking
// TODO: Add useEfficiencyTargets hook for setting and tracking targets
// TODO: Add useEfficiencyAlerts hook for anomaly detection in efficiency
// TODO: Add useEfficiencyRecommendations hook for optimization suggestions
// TODO: Add useAutomatedKPIGeneration hook for scheduled snapshot creation
// TODO: Add useCostPerModel hook for model-level cost tracking
// TODO: Add useGPUUtilization hook for detailed GPU efficiency metrics
// TODO: Add useResourceWaste hook for identifying underutilized resources
// TODO: Add integration with Prometheus for real-time metrics
// TODO: Add integration with Grafana for visualization
// TODO: Add ML-based efficiency prediction
// TODO: Add gamification elements (leaderboards, badges)
