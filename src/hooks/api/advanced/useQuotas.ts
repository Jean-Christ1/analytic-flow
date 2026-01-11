// ============================================================================
// Quota & Limits Hooks
// MLOps Control Plane v3
// Author: Armand AMOUSSOU
// Date: 2026-01-04
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  createQueryKeyFactory,
  type ListQueryOptions,
  type MutationOptions,
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE,
  calculateOffset,
} from '../utils/query-utils';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Quota resource types
 */
export type QuotaResourceType =
  // Compute resources
  | 'cpu_hours'
  | 'gpu_hours'
  | 'memory_gb_hours'
  | 'storage_gb'
  // ML resources
  | 'experiments'
  | 'models'
  | 'deployments'
  | 'endpoints'
  | 'pipelines'
  | 'datasets'
  // Infrastructure resources
  | 'clusters'
  | 'namespaces'
  | 'services'
  // Collaboration resources
  | 'projects'
  | 'team_members'
  | 'api_requests'
  | 'api_keys'
  // Storage resources
  | 'artifact_storage_gb'
  | 'model_storage_gb'
  | 'dataset_storage_gb';

/**
 * Quota scope
 */
export type QuotaScope = 'tenant' | 'project' | 'team' | 'user';

/**
 * Quota period
 */
export type QuotaPeriod = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'unlimited';

/**
 * Quota from database
 */
export interface Quota {
  id: string;
  tenant_id: string;
  scope: QuotaScope;
  scope_id: string | null; // project_id, team_id, or user_id
  resource_type: QuotaResourceType;
  limit_value: number;
  current_usage: number;
  period: QuotaPeriod;
  period_start: string | null;
  period_end: string | null;
  soft_limit: number | null;
  hard_limit: number;
  alert_threshold: number; // Percentage (0-100)
  alert_sent: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Quota with scope info
 */
export interface QuotaWithScope extends Quota {
  project?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  team?: {
    id: string;
    name: string;
  } | null;
  user?: {
    id: string;
    email: string;
    full_name: string;
  } | null;
}

/**
 * Quota insert type
 */
export type QuotaInsert = Omit<
  Quota,
  'id' | 'created_at' | 'updated_at' | 'current_usage' | 'alert_sent'
> & {
  id?: string;
  current_usage?: number;
};

/**
 * Quota update type
 */
export type QuotaUpdate = Partial<
  Omit<Quota, 'id' | 'tenant_id' | 'scope' | 'scope_id' | 'resource_type' | 'created_at' | 'updated_at'>
>;

/**
 * Quota usage record
 */
export interface QuotaUsage {
  id: string;
  quota_id: string;
  amount: number;
  operation: 'increment' | 'decrement' | 'set';
  source: string;
  source_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

/**
 * Quota status
 */
export interface QuotaStatus {
  quota_id: string;
  resource_type: QuotaResourceType;
  current_usage: number;
  limit_value: number;
  percentage_used: number;
  status: 'ok' | 'warning' | 'exceeded';
  remaining: number;
  resets_at: string | null;
}

/**
 * Quota summary
 */
export interface QuotaSummary {
  scope: QuotaScope;
  scope_id: string | null;
  quotas: QuotaStatus[];
  total_resources: number;
  exceeded_count: number;
  warning_count: number;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const quotaKeys = createQueryKeyFactory<string>('quotas');

// Extended query keys
export const quotaQueryKeys = {
  ...quotaKeys,
  byTenant: (tenantId: string) => [...quotaKeys.all, 'tenant', tenantId] as const,
  byProject: (projectId: string) => [...quotaKeys.all, 'project', projectId] as const,
  byTeam: (teamId: string) => [...quotaKeys.all, 'team', teamId] as const,
  byUser: (userId: string) => [...quotaKeys.all, 'user', userId] as const,
  byResource: (resourceType: QuotaResourceType) =>
    [...quotaKeys.all, 'resource', resourceType] as const,
  status: (scope: QuotaScope, scopeId: string | null) =>
    [...quotaKeys.all, 'status', scope, scopeId] as const,
  exceeded: () => [...quotaKeys.all, 'exceeded'] as const,
  warnings: () => [...quotaKeys.all, 'warnings'] as const,
};

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Fetch all quotas
 */
export const useQuotas = (options: ListQueryOptions = {}) => {
  const {
    pagination = { page: DEFAULT_PAGE, pageSize: DEFAULT_PAGE_SIZE },
    sort = { column: 'resource_type', ascending: true },
    filters = [],
    enabled = true,
  } = options;

  const page = pagination.page ?? DEFAULT_PAGE;
  const pageSize = pagination.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = calculateOffset(page, pageSize);

  return useQuery({
    queryKey: quotaKeys.list({ pagination, sort, filters }),
    queryFn: async () => {
      let query = supabase
        .from('quota')
        .select('*', { count: 'exact' });

      // Apply filters
      filters.forEach(filter => {
        query = query.filter(filter.column, filter.operator, filter.value);
      });

      // Apply sorting
      const sortParams = Array.isArray(sort) ? sort : [sort];
      sortParams.forEach(s => {
        query = query.order(s.column, { ascending: s.ascending ?? true });
      });

      // Apply pagination
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;
      return { data: data as Quota[], count };
    },
    enabled,
  });
};

/**
 * Fetch a single quota by ID
 */
export const useQuota = (quotaId: string, options: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: quotaKeys.detail(quotaId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quota')
        .select('*')
        .eq('id', quotaId)
        .single();

      if (error) throw error;
      return data as Quota;
    },
    enabled: options.enabled !== false && !!quotaId,
  });
};

/**
 * Fetch quotas by tenant
 */
export const useQuotasByTenant = (tenantId: string) => {
  return useQuery({
    queryKey: quotaQueryKeys.byTenant(tenantId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quota')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('scope', 'tenant')
        .order('resource_type', { ascending: true });

      if (error) throw error;
      return data as Quota[];
    },
    enabled: !!tenantId,
  });
};

/**
 * Fetch quotas by project
 */
export const useQuotasByProject = (projectId: string) => {
  return useQuery({
    queryKey: quotaQueryKeys.byProject(projectId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quota')
        .select('*')
        .eq('scope', 'project')
        .eq('scope_id', projectId)
        .order('resource_type', { ascending: true });

      if (error) throw error;
      return data as Quota[];
    },
    enabled: !!projectId,
  });
};

/**
 * Fetch quotas by team
 */
export const useQuotasByTeam = (teamId: string) => {
  return useQuery({
    queryKey: quotaQueryKeys.byTeam(teamId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quota')
        .select('*')
        .eq('scope', 'team')
        .eq('scope_id', teamId)
        .order('resource_type', { ascending: true });

      if (error) throw error;
      return data as Quota[];
    },
    enabled: !!teamId,
  });
};

/**
 * Fetch quotas by user
 */
export const useQuotasByUser = (userId: string) => {
  return useQuery({
    queryKey: quotaQueryKeys.byUser(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quota')
        .select('*')
        .eq('scope', 'user')
        .eq('scope_id', userId)
        .order('resource_type', { ascending: true });

      if (error) throw error;
      return data as Quota[];
    },
    enabled: !!userId,
  });
};

/**
 * Fetch quota by resource type
 */
export const useQuotaByResource = (
  resourceType: QuotaResourceType,
  scope: QuotaScope,
  scopeId: string | null
) => {
  return useQuery({
    queryKey: [...quotaQueryKeys.byResource(resourceType), scope, scopeId] as const,
    queryFn: async () => {
      let query = supabase
        .from('quota')
        .select('*')
        .eq('resource_type', resourceType)
        .eq('scope', scope);

      if (scopeId) {
        query = query.eq('scope_id', scopeId);
      } else {
        query = query.is('scope_id', null);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      return data as Quota | null;
    },
  });
};

/**
 * Fetch quota status summary
 */
export const useQuotaStatus = (scope: QuotaScope, scopeId: string | null) => {
  return useQuery({
    queryKey: quotaQueryKeys.status(scope, scopeId),
    queryFn: async () => {
      let query = supabase
        .from('quota')
        .select('*')
        .eq('scope', scope);

      if (scopeId) {
        query = query.eq('scope_id', scopeId);
      } else {
        query = query.is('scope_id', null);
      }

      const { data, error } = await query;

      if (error) throw error;

      const quotas = (data || []).map(q => {
        const percentageUsed = q.hard_limit > 0
          ? Math.round((q.current_usage / q.hard_limit) * 100)
          : 0;

        let status: 'ok' | 'warning' | 'exceeded';
        if (q.current_usage >= q.hard_limit) {
          status = 'exceeded';
        } else if (percentageUsed >= q.alert_threshold) {
          status = 'warning';
        } else {
          status = 'ok';
        }

        return {
          quota_id: q.id,
          resource_type: q.resource_type,
          current_usage: q.current_usage,
          limit_value: q.hard_limit,
          percentage_used: percentageUsed,
          status,
          remaining: Math.max(0, q.hard_limit - q.current_usage),
          resets_at: q.period_end,
        } as QuotaStatus;
      });

      return {
        scope,
        scope_id: scopeId,
        quotas,
        total_resources: quotas.length,
        exceeded_count: quotas.filter(q => q.status === 'exceeded').length,
        warning_count: quotas.filter(q => q.status === 'warning').length,
      } as QuotaSummary;
    },
  });
};

/**
 * Fetch exceeded quotas
 */
export const useExceededQuotas = () => {
  return useQuery({
    queryKey: quotaQueryKeys.exceeded(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quota')
        .select('*')
        .gte('current_usage', supabase.rpc('get_hard_limit'))
        .order('updated_at', { ascending: false });

      // Fallback query if RPC not available
      if (error) {
        const { data: allData, error: allError } = await supabase
          .from('quota')
          .select('*');

        if (allError) throw allError;

        return (allData || []).filter(q => q.current_usage >= q.hard_limit) as Quota[];
      }

      return data as Quota[];
    },
  });
};

/**
 * Fetch quotas at warning threshold
 */
export const useQuotaWarnings = () => {
  return useQuery({
    queryKey: quotaQueryKeys.warnings(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quota')
        .select('*');

      if (error) throw error;

      return (data || []).filter(q => {
        const percentageUsed = q.hard_limit > 0
          ? (q.current_usage / q.hard_limit) * 100
          : 0;
        return percentageUsed >= q.alert_threshold && q.current_usage < q.hard_limit;
      }) as Quota[];
    },
  });
};

/**
 * Check if quota allows operation
 */
export const useCheckQuota = (
  resourceType: QuotaResourceType,
  scope: QuotaScope,
  scopeId: string | null,
  amount: number = 1
) => {
  return useQuery({
    queryKey: [...quotaQueryKeys.byResource(resourceType), 'check', scope, scopeId, amount] as const,
    queryFn: async () => {
      let query = supabase
        .from('quota')
        .select('*')
        .eq('resource_type', resourceType)
        .eq('scope', scope);

      if (scopeId) {
        query = query.eq('scope_id', scopeId);
      } else {
        query = query.is('scope_id', null);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;

      if (!data) {
        return { allowed: true, reason: 'no_quota' };
      }

      const newUsage = data.current_usage + amount;
      const allowed = newUsage <= data.hard_limit;

      return {
        allowed,
        reason: allowed ? 'within_limit' : 'would_exceed_limit',
        current_usage: data.current_usage,
        limit: data.hard_limit,
        remaining: Math.max(0, data.hard_limit - data.current_usage),
        requested: amount,
      };
    },
    enabled: !!resourceType,
  });
};

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Create a quota
 */
export const useCreateQuota = (
  options: MutationOptions<Quota, QuotaInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quota: QuotaInsert) => {
      const { data, error } = await supabase
        .from('quota')
        .insert(quota)
        .select()
        .single();

      if (error) throw error;
      return data as Quota;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: quotaKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: quotaQueryKeys.status(data.scope, data.scope_id),
      });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update a quota
 */
export const useUpdateQuota = (
  options: MutationOptions<Quota, { id: string; updates: QuotaUpdate }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: QuotaUpdate }) => {
      const { data, error } = await supabase
        .from('quota')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Quota;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: quotaKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: quotaKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Delete a quota
 */
export const useDeleteQuota = (
  options: MutationOptions<void, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quotaId: string) => {
      const { error } = await supabase
        .from('quota')
        .delete()
        .eq('id', quotaId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: quotaKeys.all });
      options.onSuccess?.(undefined, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Increment quota usage
 */
export const useIncrementQuotaUsage = (
  options: MutationOptions<Quota, { quotaId: string; amount: number; source?: string; sourceId?: string }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      quotaId,
      amount,
    }: { quotaId: string; amount: number; source?: string; sourceId?: string }) => {
      // First get current usage
      const { data: current, error: fetchError } = await supabase
        .from('quota')
        .select('current_usage, hard_limit')
        .eq('id', quotaId)
        .single();

      if (fetchError) throw fetchError;

      const newUsage = current.current_usage + amount;

      // Check if would exceed
      if (newUsage > current.hard_limit) {
        throw new Error('Would exceed quota limit');
      }

      // Update
      const { data, error } = await supabase
        .from('quota')
        .update({ current_usage: newUsage })
        .eq('id', quotaId)
        .select()
        .single();

      if (error) throw error;
      return data as Quota;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: quotaKeys.detail(variables.quotaId) });
      queryClient.invalidateQueries({
        queryKey: quotaQueryKeys.status(data.scope, data.scope_id),
      });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Decrement quota usage
 */
export const useDecrementQuotaUsage = (
  options: MutationOptions<Quota, { quotaId: string; amount: number }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ quotaId, amount }: { quotaId: string; amount: number }) => {
      // First get current usage
      const { data: current, error: fetchError } = await supabase
        .from('quota')
        .select('current_usage')
        .eq('id', quotaId)
        .single();

      if (fetchError) throw fetchError;

      const newUsage = Math.max(0, current.current_usage - amount);

      // Update
      const { data, error } = await supabase
        .from('quota')
        .update({ current_usage: newUsage })
        .eq('id', quotaId)
        .select()
        .single();

      if (error) throw error;
      return data as Quota;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: quotaKeys.detail(variables.quotaId) });
      queryClient.invalidateQueries({
        queryKey: quotaQueryKeys.status(data.scope, data.scope_id),
      });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Reset quota usage
 */
export const useResetQuotaUsage = (
  options: MutationOptions<Quota, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quotaId: string) => {
      const { data, error } = await supabase
        .from('quota')
        .update({
          current_usage: 0,
          alert_sent: false,
          period_start: new Date().toISOString(),
        })
        .eq('id', quotaId)
        .select()
        .single();

      if (error) throw error;
      return data as Quota;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: quotaKeys.detail(variables) });
      queryClient.invalidateQueries({
        queryKey: quotaQueryKeys.status(data.scope, data.scope_id),
      });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Reset all quotas for a period
 */
export const useResetPeriodicQuotas = (
  options: MutationOptions<number, QuotaPeriod> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (period: QuotaPeriod) => {
      const { data, error } = await supabase
        .from('quota')
        .update({
          current_usage: 0,
          alert_sent: false,
          period_start: new Date().toISOString(),
        })
        .eq('period', period)
        .select('id');

      if (error) throw error;
      return data?.length || 0;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: quotaKeys.all });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

// ============================================================================
// TODO: Additional Features
// ============================================================================
// TODO: Add useQuotaHistory hook for usage history
// TODO: Add useQuotaForecast hook for usage prediction
// TODO: Add useQuotaAlerts hook for alert management
// TODO: Add useQuotaReports hook for reporting
// TODO: Add useBulkQuotaUpdate hook for batch updates
// TODO: Add useQuotaTemplates hook for quota templates
// TODO: Add useQuotaInheritance hook for hierarchical quotas
// TODO: Add useQuotaExceptions hook for temporary overrides
// TODO: Add useQuotaBilling hook for usage-based billing
// TODO: Add real-time quota monitoring via WebSocket
