// ============================================================================
// Cost Records Hooks - React Query Hooks for Cloud Cost Tracking
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

export type CloudProvider = 'aws' | 'gcp' | 'azure' | 'onprem';

/**
 * Cost record structure for tracking cloud spending
 */
export interface CostRecord {
  id: string;
  tenant_id: string;
  billing_account_id: string;
  provider: CloudProvider;
  service: string | null;
  sku: string | null;
  usage_start: string | null;
  usage_end: string | null;
  cost_amount: number | null;
  currency: string | null;
  usage_quantity: number | null;
  usage_unit: string | null;
  tags: Record<string, string> | null;
  resource_external_id: string | null;
  project_id: string | null;
  run_id: string | null;
  pipeline_id: string | null;
  deployment_id: string | null;
  created_at: string;
}

export interface CostRecordInsert {
  tenant_id: string;
  billing_account_id: string;
  provider: CloudProvider;
  service?: string | null;
  sku?: string | null;
  usage_start?: string | null;
  usage_end?: string | null;
  cost_amount?: number | null;
  currency?: string | null;
  usage_quantity?: number | null;
  usage_unit?: string | null;
  tags?: Record<string, string> | null;
  resource_external_id?: string | null;
  project_id?: string | null;
  run_id?: string | null;
  pipeline_id?: string | null;
  deployment_id?: string | null;
}

export interface CostRecordUpdate {
  service?: string | null;
  sku?: string | null;
  cost_amount?: number | null;
  tags?: Record<string, string> | null;
  project_id?: string | null;
  run_id?: string | null;
  pipeline_id?: string | null;
  deployment_id?: string | null;
}

export interface CostRecordWithRelations extends CostRecord {
  billing_account?: { name: string; provider: CloudProvider };
  project?: { name: string; slug: string };
  run?: { name: string };
}

/**
 * Time granularity for cost aggregations
 */
export type CostGranularity = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

/**
 * Cost aggregation result
 */
export interface CostAggregation {
  period: string;
  total_cost: number;
  record_count: number;
  by_service?: { service: string; amount: number }[];
  by_provider?: { provider: CloudProvider; amount: number }[];
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const costRecordKeys = createQueryKeyFactory<string>('costRecords');

// ============================================================================
// COST RECORD QUERIES
// ============================================================================

/**
 * Hook to fetch a list of Cost Records
 */
export const useCostRecords = (options: ListQueryOptions = {}) => {
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
    queryKey: costRecordKeys.list({ page, pageSize, sort, filters, search }),
    queryFn: async () => {
      let query = supabase
        .from('cost_record')
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
        query = query.order('usage_start', { ascending: false });
      }

      // Apply pagination
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data as CostRecord[],
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
 * Hook to fetch a single Cost Record by ID
 */
export const useCostRecord = (
  id: string | undefined,
  options: { select?: string; enabled?: boolean } = {}
) => {
  const { select = '*', enabled = true } = options;

  return useQuery({
    queryKey: costRecordKeys.detail(id ?? ''),
    queryFn: async () => {
      if (!id) throw new Error('Cost Record ID is required');

      const { data, error } = await supabase
        .from('cost_record')
        .select(select)
        .eq('id', id)
        .single();

      if (error) throw error;

      return data as CostRecord;
    },
    enabled: enabled && !!id,
  });
};

/**
 * Hook to fetch Cost Records by billing account
 */
export const useCostRecordsByBillingAccount = (
  billingAccountId: string,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'billing_account_id', operator: 'eq' as const, value: billingAccountId },
  ];

  return useCostRecords({ ...options, filters });
};

/**
 * Hook to fetch Cost Records by project
 */
export const useCostRecordsByProject = (
  projectId: string,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'project_id', operator: 'eq' as const, value: projectId },
  ];

  return useCostRecords({ ...options, filters });
};

/**
 * Hook to fetch Cost Records by provider
 */
export const useCostRecordsByProvider = (
  provider: CloudProvider,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'provider', operator: 'eq' as const, value: provider },
  ];

  return useCostRecords({ ...options, filters });
};

/**
 * Hook to fetch Cost Records by date range
 */
export const useCostRecordsByDateRange = (
  startDate: string,
  endDate: string,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'usage_start', operator: 'gte' as const, value: startDate },
    { column: 'usage_end', operator: 'lte' as const, value: endDate },
  ];

  return useCostRecords({ ...options, filters });
};

/**
 * Hook to fetch Cost Records by service
 */
export const useCostRecordsByService = (
  service: string,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'service', operator: 'eq' as const, value: service },
  ];

  return useCostRecords({ ...options, filters });
};

/**
 * Hook to fetch Cost Records by run (ML experiment run)
 */
export const useCostRecordsByRun = (
  runId: string,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'run_id', operator: 'eq' as const, value: runId },
  ];

  return useCostRecords({ ...options, filters });
};

/**
 * Hook to fetch unallocated cost records
 */
export const useUnallocatedCostRecords = (options: ListQueryOptions = {}) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'project_id', operator: 'is' as const, value: null },
  ];

  return useCostRecords({ ...options, filters });
};

/**
 * Hook to get cost aggregations by time period
 */
export const useCostAggregations = (
  dateRange: { start: string; end: string },
  granularity: CostGranularity = 'daily',
  options: { projectId?: string; provider?: CloudProvider; service?: string; enabled?: boolean } = {}
) => {
  const { projectId, provider, service, enabled = true } = options;

  return useQuery({
    queryKey: ['costRecords', 'aggregations', dateRange, granularity, { projectId, provider, service }],
    queryFn: async () => {
      let query = supabase
        .from('cost_record')
        .select('usage_start, cost_amount, service, provider')
        .gte('usage_start', dateRange.start)
        .lte('usage_end', dateRange.end);

      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      if (provider) {
        query = query.eq('provider', provider);
      }
      if (service) {
        query = query.eq('service', service);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Group by period based on granularity
      const aggregations = new Map<string, {
        total: number;
        count: number;
        byService: Map<string, number>;
        byProvider: Map<CloudProvider, number>;
      }>();

      data?.forEach((record) => {
        if (!record.usage_start) return;

        const date = new Date(record.usage_start);
        let periodKey: string;

        switch (granularity) {
          case 'daily':
            periodKey = date.toISOString().split('T')[0];
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
          case 'quarterly': {
            const quarter = Math.floor(date.getMonth() / 3) + 1;
            periodKey = `${date.getFullYear()}-Q${quarter}`;
            break;
          }
          case 'yearly':
            periodKey = String(date.getFullYear());
            break;
        }

        const current = aggregations.get(periodKey) ?? {
          total: 0,
          count: 0,
          byService: new Map<string, number>(),
          byProvider: new Map<CloudProvider, number>(),
        };

        current.total += record.cost_amount ?? 0;
        current.count++;

        const svc = record.service ?? 'unknown';
        current.byService.set(svc, (current.byService.get(svc) ?? 0) + (record.cost_amount ?? 0));

        const prov = record.provider as CloudProvider;
        current.byProvider.set(prov, (current.byProvider.get(prov) ?? 0) + (record.cost_amount ?? 0));

        aggregations.set(periodKey, current);
      });

      // Convert to array format
      return Array.from(aggregations.entries())
        .map(([period, agg]) => ({
          period,
          total_cost: agg.total,
          record_count: agg.count,
          by_service: Array.from(agg.byService.entries()).map(([service, amount]) => ({ service, amount })),
          by_provider: Array.from(agg.byProvider.entries()).map(([provider, amount]) => ({ provider, amount })),
        }))
        .sort((a, b) => a.period.localeCompare(b.period)) as CostAggregation[];
    },
    enabled,
  });
};

/**
 * Hook to get total cost summary
 */
export const useCostSummary = (
  dateRange?: { start: string; end: string },
  options: { projectId?: string; enabled?: boolean } = {}
) => {
  const { projectId, enabled = true } = options;

  return useQuery({
    queryKey: ['costRecords', 'summary', dateRange, projectId],
    queryFn: async () => {
      let query = supabase
        .from('cost_record')
        .select('cost_amount, provider, service, project_id');

      if (dateRange) {
        query = query
          .gte('usage_start', dateRange.start)
          .lte('usage_end', dateRange.end);
      }

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calculate totals
      const totalCost = data?.reduce((sum, r) => sum + (r.cost_amount ?? 0), 0) ?? 0;
      const allocatedCost = data?.filter((r) => r.project_id)
        .reduce((sum, r) => sum + (r.cost_amount ?? 0), 0) ?? 0;
      const unallocatedCost = totalCost - allocatedCost;

      // Group by provider
      const byProvider = new Map<CloudProvider, number>();
      data?.forEach((r) => {
        const provider = r.provider as CloudProvider;
        byProvider.set(provider, (byProvider.get(provider) ?? 0) + (r.cost_amount ?? 0));
      });

      // Top services
      const byService = new Map<string, number>();
      data?.forEach((r) => {
        const service = r.service ?? 'unknown';
        byService.set(service, (byService.get(service) ?? 0) + (r.cost_amount ?? 0));
      });

      const topServices = Array.from(byService.entries())
        .map(([service, amount]) => ({ service, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10);

      return {
        totalCost,
        allocatedCost,
        unallocatedCost,
        allocationRate: totalCost > 0 ? (allocatedCost / totalCost) * 100 : 0,
        recordCount: data?.length ?? 0,
        byProvider: Array.from(byProvider.entries()).map(([provider, amount]) => ({ provider, amount })),
        topServices,
      };
    },
    enabled,
  });
};

/**
 * Hook to get top cost drivers
 */
export const useTopCostDrivers = (
  dateRange: { start: string; end: string },
  limit: number = 10,
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['costRecords', 'topDrivers', dateRange, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cost_record')
        .select('resource_external_id, service, provider, cost_amount')
        .gte('usage_start', dateRange.start)
        .lte('usage_end', dateRange.end)
        .not('resource_external_id', 'is', null);

      if (error) throw error;

      // Aggregate by resource
      const byResource = new Map<string, { service: string; provider: CloudProvider; amount: number }>();
      data?.forEach((r) => {
        const key = r.resource_external_id!;
        const current = byResource.get(key) ?? {
          service: r.service ?? 'unknown',
          provider: r.provider as CloudProvider,
          amount: 0,
        };
        current.amount += r.cost_amount ?? 0;
        byResource.set(key, current);
      });

      return Array.from(byResource.entries())
        .map(([resourceId, info]) => ({
          resourceId,
          service: info.service,
          provider: info.provider,
          amount: info.amount,
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, limit);
    },
    enabled,
  });
};

// ============================================================================
// COST RECORD MUTATIONS
// ============================================================================

/**
 * Hook to create a new Cost Record
 */
export const useCreateCostRecord = (
  options: MutationOptions<CostRecord, CostRecordInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CostRecordInsert) => {
      const { data, error } = await supabase
        .from('cost_record')
        .insert(input)
        .select()
        .single();

      if (error) throw error;

      return data as CostRecord;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: costRecordKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['costRecords', 'aggregations'] });
      queryClient.invalidateQueries({ queryKey: ['costRecords', 'summary'] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to create Cost Record:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to update a Cost Record
 */
export const useUpdateCostRecord = (
  options: MutationOptions<CostRecord, { id: string; data: CostRecordUpdate }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CostRecordUpdate }) => {
      const { data: result, error } = await supabase
        .from('cost_record')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return result as CostRecord;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: costRecordKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: costRecordKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['costRecords', 'aggregations'] });
      queryClient.invalidateQueries({ queryKey: ['costRecords', 'summary'] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to update Cost Record:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to delete a Cost Record
 */
export const useDeleteCostRecord = (
  options: MutationOptions<void, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cost_record')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: costRecordKeys.all });
      queryClient.invalidateQueries({ queryKey: ['costRecords', 'aggregations'] });
      queryClient.invalidateQueries({ queryKey: ['costRecords', 'summary'] });
      options.onSuccess?.(undefined, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to delete Cost Record:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: (data, error, variables) => {
      options.onSettled?.(data, error, variables);
    },
  });
};

/**
 * Hook to bulk create cost records
 */
export const useBulkCreateCostRecords = (
  options: MutationOptions<CostRecord[], CostRecordInsert[]> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (records: CostRecordInsert[]) => {
      const { data, error } = await supabase
        .from('cost_record')
        .insert(records)
        .select();

      if (error) throw error;

      return data as CostRecord[];
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: costRecordKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['costRecords', 'aggregations'] });
      queryClient.invalidateQueries({ queryKey: ['costRecords', 'summary'] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to bulk create Cost Records:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to allocate cost records to a project
 */
export const useAllocateCostRecords = (
  options: MutationOptions<number, { recordIds: string[]; projectId: string }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recordIds, projectId }: { recordIds: string[]; projectId: string }) => {
      const { error, count } = await supabase
        .from('cost_record')
        .update({ project_id: projectId })
        .in('id', recordIds);

      if (error) throw error;

      return count ?? 0;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: costRecordKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['costRecords', 'summary'] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to allocate Cost Records:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

// ============================================================================
// TODO: Future Enhancements
// ============================================================================
// TODO: Add useCostAnomaly hook for detecting unusual spending patterns
// TODO: Add useCostForecast hook for predicting future costs
// TODO: Add useCostComparison hook for comparing costs across periods
// TODO: Add useResourceCostBreakdown hook for detailed resource-level costs
// TODO: Add useCostByTag hook for tag-based cost analysis
// TODO: Add useCostExport hook for generating cost reports (CSV, Excel)
// TODO: Add useRealtimeCostUpdates hook with Supabase real-time subscriptions
// TODO: Add integration with AWS Cost Explorer API for automated ingestion
// TODO: Add integration with GCP BigQuery for billing export
// TODO: Add integration with Azure Cost Management for data sync
// TODO: Add support for cost amortization (reserved instances, savings plans)
// TODO: Add support for custom pricing and discount tracking
