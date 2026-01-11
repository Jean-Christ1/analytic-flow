// ============================================================================
// SLA Policies Hooks - React Query Hooks for Service Level Agreement Management
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
 * SLA policy scope type
 */
export type SLAScopeType = 'tenant' | 'project';

/**
 * SLA target metric types
 */
export type SLAMetricType =
  | 'availability'        // Service uptime percentage
  | 'latency_p50'         // 50th percentile latency
  | 'latency_p95'         // 95th percentile latency
  | 'latency_p99'         // 99th percentile latency
  | 'error_rate'          // Error rate percentage
  | 'throughput'          // Requests per second
  | 'mttr'                // Mean Time To Resolution
  | 'mtta'                // Mean Time To Acknowledge
  | 'success_rate'        // ML model/run success rate
  | 'inference_latency'   // ML inference latency
  | 'data_freshness';     // Data pipeline freshness

/**
 * SLA target definition
 */
export interface SLATarget {
  metric: SLAMetricType;
  target_value: number;
  unit: string;
  comparison: 'gte' | 'lte' | 'eq'; // greater_than_equal, less_than_equal, equal
  window: string; // e.g., "30d", "7d", "24h"
  weight?: number; // For composite SLO calculation
}

/**
 * SLA policy targets structure
 */
export interface SLATargets {
  targets: SLATarget[];
  burn_rate_threshold?: number; // For error budget alerting
  error_budget_policy?: 'alert_only' | 'block_deploys' | 'rollback';
}

/**
 * SLA policy structure
 */
export interface SLAPolicy {
  id: string;
  tenant_id: string;
  name: string;
  scope_type: SLAScopeType;
  scope_id: string | null;
  targets: SLATargets | null;
  created_at: string;
  updated_at: string;
}

export interface SLAPolicyInsert {
  tenant_id: string;
  name: string;
  scope_type: SLAScopeType;
  scope_id?: string | null;
  targets?: SLATargets | null;
}

export interface SLAPolicyUpdate {
  name?: string;
  scope_type?: SLAScopeType;
  scope_id?: string | null;
  targets?: SLATargets | null;
}

/**
 * SLA compliance result
 */
export interface SLAComplianceResult {
  policyId: string;
  policyName: string;
  overall_compliance: number; // 0-100
  is_compliant: boolean;
  targets: {
    metric: SLAMetricType;
    target_value: number;
    actual_value: number;
    is_met: boolean;
    error_budget_remaining?: number;
  }[];
  period: { start: string; end: string };
}

/**
 * Error budget status
 */
export interface ErrorBudgetStatus {
  policyId: string;
  total_budget: number;
  consumed: number;
  remaining: number;
  remaining_percentage: number;
  burn_rate: number;
  projected_depletion?: string; // ISO date
  status: 'healthy' | 'warning' | 'critical' | 'exhausted';
}

// ============================================================================
// PREDEFINED SLA TEMPLATES
// ============================================================================

/**
 * Predefined SLA templates for common use cases
 */
export const SLA_TEMPLATES: Record<string, Omit<SLATargets, 'error_budget_policy'>> = {
  ml_inference_standard: {
    targets: [
      { metric: 'availability', target_value: 99.5, unit: '%', comparison: 'gte', window: '30d' },
      { metric: 'inference_latency', target_value: 200, unit: 'ms', comparison: 'lte', window: '30d', weight: 0.3 },
      { metric: 'error_rate', target_value: 1, unit: '%', comparison: 'lte', window: '30d', weight: 0.2 },
    ],
    burn_rate_threshold: 2,
  },
  ml_inference_premium: {
    targets: [
      { metric: 'availability', target_value: 99.9, unit: '%', comparison: 'gte', window: '30d' },
      { metric: 'inference_latency', target_value: 100, unit: 'ms', comparison: 'lte', window: '30d', weight: 0.3 },
      { metric: 'error_rate', target_value: 0.1, unit: '%', comparison: 'lte', window: '30d', weight: 0.2 },
    ],
    burn_rate_threshold: 1.5,
  },
  ml_training_pipeline: {
    targets: [
      { metric: 'success_rate', target_value: 95, unit: '%', comparison: 'gte', window: '7d' },
      { metric: 'data_freshness', target_value: 24, unit: 'hours', comparison: 'lte', window: '7d' },
    ],
    burn_rate_threshold: 3,
  },
  incident_response: {
    targets: [
      { metric: 'mtta', target_value: 15, unit: 'minutes', comparison: 'lte', window: '30d' },
      { metric: 'mttr', target_value: 60, unit: 'minutes', comparison: 'lte', window: '30d' },
    ],
    burn_rate_threshold: 2,
  },
};

// ============================================================================
// QUERY KEYS
// ============================================================================

export const slaPolicyKeys = createQueryKeyFactory<string>('slaPolicies');

// ============================================================================
// SLA POLICY QUERIES
// ============================================================================

/**
 * Hook to fetch a list of SLA Policies
 */
export const useSLAPolicies = (options: ListQueryOptions = {}) => {
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
    queryKey: slaPolicyKeys.list({ page, pageSize, sort, filters, search }),
    queryFn: async () => {
      let query = supabase
        .from('sla_policy')
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
        query = query.order('name');
      }

      // Apply pagination
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data as SLAPolicy[],
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
 * Hook to fetch a single SLA Policy by ID
 */
export const useSLAPolicy = (
  id: string | undefined,
  options: { select?: string; enabled?: boolean } = {}
) => {
  const { select = '*', enabled = true } = options;

  return useQuery({
    queryKey: slaPolicyKeys.detail(id ?? ''),
    queryFn: async () => {
      if (!id) throw new Error('SLA Policy ID is required');

      const { data, error } = await supabase
        .from('sla_policy')
        .select(select)
        .eq('id', id)
        .single();

      if (error) throw error;

      return data as SLAPolicy;
    },
    enabled: enabled && !!id,
  });
};

/**
 * Hook to fetch SLA Policies by scope type
 */
export const useSLAPoliciesByScopeType = (
  scopeType: SLAScopeType,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'scope_type', operator: 'eq' as const, value: scopeType },
  ];

  return useSLAPolicies({ ...options, filters });
};

/**
 * Hook to fetch SLA Policies by scope
 */
export const useSLAPoliciesByScope = (
  scopeType: SLAScopeType,
  scopeId: string,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'scope_type', operator: 'eq' as const, value: scopeType },
    { column: 'scope_id', operator: 'eq' as const, value: scopeId },
  ];

  return useSLAPolicies({ ...options, filters });
};

/**
 * Hook to fetch tenant-level SLA Policies
 */
export const useTenantSLAPolicies = (options: ListQueryOptions = {}) => {
  return useSLAPoliciesByScopeType('tenant', options);
};

/**
 * Hook to fetch project SLA Policies
 */
export const useProjectSLAPolicies = (
  projectId: string,
  options: ListQueryOptions = {}
) => {
  return useSLAPoliciesByScope('project', projectId, options);
};

/**
 * Hook to search SLA Policies
 */
export const useSearchSLAPolicies = (
  searchTerm: string,
  options: ListQueryOptions = {}
) => {
  return useSLAPolicies({
    ...options,
    search: { column: 'name', value: searchTerm },
    enabled: (options.enabled ?? true) && searchTerm.length >= 2,
  });
};

/**
 * Hook to calculate SLA compliance
 */
export const useSLACompliance = (
  policyId: string | undefined,
  dateRange?: { start: string; end: string },
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['slaPolicies', 'compliance', policyId, dateRange],
    queryFn: async () => {
      if (!policyId) throw new Error('Policy ID is required');

      // Get the policy
      const { data: policy, error: policyError } = await supabase
        .from('sla_policy')
        .select('*')
        .eq('id', policyId)
        .single();

      if (policyError) throw policyError;

      const typedPolicy = policy as SLAPolicy;
      const targets = (typedPolicy.targets as SLATargets | null)?.targets ?? [];

      // TODO: Implement actual compliance calculation via Edge Function
      // This would:
      // 1. Query metrics from observability backends
      // 2. Compare against SLA targets
      // 3. Calculate compliance percentages

      // Mock implementation
      const range = dateRange ?? {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
      };

      const targetResults = targets.map((target) => {
        // Generate mock actual values
        const variance = Math.random() * 0.2 - 0.1; // ±10%
        let actual: number;
        let isMet: boolean;

        if (target.comparison === 'gte') {
          actual = target.target_value * (1 + variance);
          isMet = actual >= target.target_value;
        } else if (target.comparison === 'lte') {
          actual = target.target_value * (1 + variance);
          isMet = actual <= target.target_value;
        } else {
          actual = target.target_value * (1 + variance * 0.05);
          isMet = Math.abs(actual - target.target_value) < target.target_value * 0.01;
        }

        return {
          metric: target.metric,
          target_value: target.target_value,
          actual_value: Math.round(actual * 100) / 100,
          is_met: isMet,
          error_budget_remaining: isMet ? 100 : Math.max(0, 100 - Math.random() * 50),
        };
      });

      const metCount = targetResults.filter((t) => t.is_met).length;
      const overallCompliance = targets.length > 0 ? (metCount / targets.length) * 100 : 100;

      return {
        policyId,
        policyName: typedPolicy.name,
        overall_compliance: Math.round(overallCompliance),
        is_compliant: overallCompliance >= 100,
        targets: targetResults,
        period: range,
      } as SLAComplianceResult;
    },
    enabled: enabled && !!policyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to get error budget status
 */
export const useErrorBudgetStatus = (
  policyId: string | undefined,
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['slaPolicies', 'errorBudget', policyId],
    queryFn: async () => {
      if (!policyId) throw new Error('Policy ID is required');

      // Get the policy
      const { data: policy, error: policyError } = await supabase
        .from('sla_policy')
        .select('*')
        .eq('id', policyId)
        .single();

      if (policyError) throw policyError;

      const typedPolicy = policy as SLAPolicy;
      const targets = (typedPolicy.targets as SLATargets | null)?.targets ?? [];

      // TODO: Implement actual error budget calculation
      // Based on availability target: error_budget = 100 - availability_target

      const availabilityTarget = targets.find((t) => t.metric === 'availability');
      const totalBudget = availabilityTarget ? 100 - availabilityTarget.target_value : 0.5; // Default 0.5%

      // Mock consumption
      const consumed = Math.random() * totalBudget * 0.8;
      const remaining = totalBudget - consumed;
      const remainingPercentage = (remaining / totalBudget) * 100;
      const burnRate = consumed / 30; // Assuming 30-day window

      let status: ErrorBudgetStatus['status'];
      if (remaining <= 0) {
        status = 'exhausted';
      } else if (remainingPercentage < 20) {
        status = 'critical';
      } else if (remainingPercentage < 50) {
        status = 'warning';
      } else {
        status = 'healthy';
      }

      // Project depletion date
      const daysRemaining = burnRate > 0 ? remaining / burnRate : Infinity;
      const projectedDepletion = daysRemaining < 365
        ? new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000).toISOString()
        : undefined;

      return {
        policyId,
        total_budget: Math.round(totalBudget * 1000) / 1000,
        consumed: Math.round(consumed * 1000) / 1000,
        remaining: Math.round(remaining * 1000) / 1000,
        remaining_percentage: Math.round(remainingPercentage),
        burn_rate: Math.round(burnRate * 10000) / 10000,
        projected_depletion: projectedDepletion,
        status,
      } as ErrorBudgetStatus;
    },
    enabled: enabled && !!policyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to get all policies with compliance status
 */
export const useSLAPoliciesWithCompliance = (options: { enabled?: boolean } = {}) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['slaPolicies', 'allWithCompliance'],
    queryFn: async () => {
      const { data: policies, error } = await supabase
        .from('sla_policy')
        .select('*');

      if (error) throw error;

      // TODO: Calculate actual compliance for each policy
      // For now, return with mock compliance
      return (policies as SLAPolicy[]).map((policy) => {
        const compliance = 85 + Math.random() * 15; // 85-100%
        return {
          ...policy,
          compliance: Math.round(compliance),
          is_compliant: compliance >= 100,
          status: compliance >= 100 ? 'healthy' : compliance >= 90 ? 'warning' : 'critical',
        };
      });
    },
    enabled,
  });
};

/**
 * Hook to get available SLA templates
 */
export const useSLATemplates = () => {
  return useQuery({
    queryKey: ['slaPolicies', 'templates'],
    queryFn: async () => {
      return Object.entries(SLA_TEMPLATES).map(([key, value]) => ({
        id: key,
        name: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        ...value,
      }));
    },
    staleTime: Infinity,
  });
};

// ============================================================================
// SLA POLICY MUTATIONS
// ============================================================================

/**
 * Hook to create a new SLA Policy
 */
export const useCreateSLAPolicy = (
  options: MutationOptions<SLAPolicy, SLAPolicyInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SLAPolicyInsert) => {
      const { data, error } = await supabase
        .from('sla_policy')
        .insert(input)
        .select()
        .single();

      if (error) throw error;

      return data as SLAPolicy;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: slaPolicyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['slaPolicies', 'allWithCompliance'] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to create SLA Policy:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to update an SLA Policy
 */
export const useUpdateSLAPolicy = (
  options: MutationOptions<SLAPolicy, { id: string; data: SLAPolicyUpdate }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: SLAPolicyUpdate }) => {
      const { data: result, error } = await supabase
        .from('sla_policy')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return result as SLAPolicy;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: slaPolicyKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: slaPolicyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['slaPolicies', 'compliance', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['slaPolicies', 'errorBudget', variables.id] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to update SLA Policy:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to delete an SLA Policy
 */
export const useDeleteSLAPolicy = (
  options: MutationOptions<void, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sla_policy')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: slaPolicyKeys.all });
      queryClient.invalidateQueries({ queryKey: ['slaPolicies', 'allWithCompliance'] });
      options.onSuccess?.(undefined, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to delete SLA Policy:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: (data, error, variables) => {
      options.onSettled?.(data, error, variables);
    },
  });
};

/**
 * Hook to create SLA Policy from template
 */
export const useCreateSLAFromTemplate = (
  options: MutationOptions<SLAPolicy, { templateId: string; name: string; scopeType: SLAScopeType; scopeId?: string; tenantId: string }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      templateId,
      name,
      scopeType,
      scopeId,
      tenantId,
    }: { templateId: string; name: string; scopeType: SLAScopeType; scopeId?: string; tenantId: string }) => {
      const template = SLA_TEMPLATES[templateId];
      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }

      const { data, error } = await supabase
        .from('sla_policy')
        .insert({
          tenant_id: tenantId,
          name,
          scope_type: scopeType,
          scope_id: scopeId,
          targets: template as SLATargets,
        })
        .select()
        .single();

      if (error) throw error;

      return data as SLAPolicy;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: slaPolicyKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to create SLA Policy from template:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to add target to SLA Policy
 */
export const useAddSLATarget = (
  options: MutationOptions<SLAPolicy, { policyId: string; target: SLATarget }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ policyId, target }: { policyId: string; target: SLATarget }) => {
      // Get current policy
      const { data: policy, error: fetchError } = await supabase
        .from('sla_policy')
        .select('targets')
        .eq('id', policyId)
        .single();

      if (fetchError) throw fetchError;

      const currentTargets = (policy.targets as SLATargets | null)?.targets ?? [];
      const updatedTargets: SLATargets = {
        ...(policy.targets as SLATargets | null),
        targets: [...currentTargets, target],
      };

      const { data, error } = await supabase
        .from('sla_policy')
        .update({ targets: updatedTargets })
        .eq('id', policyId)
        .select()
        .single();

      if (error) throw error;

      return data as SLAPolicy;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: slaPolicyKeys.detail(variables.policyId) });
      queryClient.invalidateQueries({ queryKey: ['slaPolicies', 'compliance', variables.policyId] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to add SLA target:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

// ============================================================================
// TODO: Future Enhancements
// ============================================================================
// TODO: Add useSLAAlerts hook for breach notifications
// TODO: Add useSLAHistory hook for historical compliance tracking
// TODO: Add useSLAForecasting hook for predictive SLA analysis
// TODO: Add useSLAReporting hook for SLA report generation
// TODO: Add useMultiWindowSLA hook for multi-window burn rate calculation
// TODO: Add useSLACorrelation hook for correlating SLA breaches with incidents
// TODO: Add integration with Prometheus/Grafana for real metrics
// TODO: Add integration with status page providers
// TODO: Add support for custom SLI definitions
// TODO: Add automated remediation actions on SLA breach
// TODO: Add contractual SLA tracking for external agreements
// TODO: Add SLA cost impact calculation
