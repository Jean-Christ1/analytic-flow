// ============================================================================
// Cost Allocation Rules Hooks - React Query Hooks for Cost Attribution
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
 * Types of cost allocation rules supported
 */
export type CostAllocationRuleType =
  | 'tag_based'         // Allocate based on resource tags
  | 'namespace'         // Allocate based on Kubernetes namespaces
  | 'project_mapping'   // Allocate to specific projects
  | 'team_based'        // Allocate based on team ownership
  | 'percentage_split'  // Split costs by percentage
  | 'usage_based'       // Allocate based on usage metrics
  | 'custom';           // Custom allocation logic

/**
 * Rule expression structure for tag-based allocation
 */
export interface TagBasedExpression {
  type: 'tag_based';
  tag_key: string;
  tag_value_mappings: Array<{
    value: string;
    project_id: string;
    percentage?: number;
  }>;
}

/**
 * Rule expression structure for namespace allocation
 */
export interface NamespaceExpression {
  type: 'namespace';
  namespace_mappings: Array<{
    namespace: string;
    project_id: string;
  }>;
}

/**
 * Rule expression structure for percentage split
 */
export interface PercentageSplitExpression {
  type: 'percentage_split';
  splits: Array<{
    project_id: string;
    percentage: number;
  }>;
}

export type RuleExpression =
  | TagBasedExpression
  | NamespaceExpression
  | PercentageSplitExpression
  | Record<string, unknown>;

/**
 * Cost allocation rule structure
 */
export interface CostAllocationRule {
  id: string;
  tenant_id: string;
  name: string;
  rule_type: CostAllocationRuleType;
  expression: RuleExpression | null;
  enabled: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface CostAllocationRuleInsert {
  tenant_id: string;
  name: string;
  rule_type: CostAllocationRuleType;
  expression?: RuleExpression | null;
  enabled?: boolean | null;
}

export interface CostAllocationRuleUpdate {
  name?: string;
  rule_type?: CostAllocationRuleType;
  expression?: RuleExpression | null;
  enabled?: boolean | null;
}

export interface CostAllocationRuleWithStats extends CostAllocationRule {
  allocated_amount?: number;
  affected_records_count?: number;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const costAllocationRuleKeys = createQueryKeyFactory<string>('costAllocationRules');

// ============================================================================
// COST ALLOCATION RULE QUERIES
// ============================================================================

/**
 * Hook to fetch a list of Cost Allocation Rules
 */
export const useCostAllocationRules = (options: ListQueryOptions = {}) => {
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
    queryKey: costAllocationRuleKeys.list({ page, pageSize, sort, filters, search }),
    queryFn: async () => {
      let query = supabase
        .from('cost_allocation_rule')
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
        data: data as CostAllocationRule[],
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
 * Hook to fetch a single Cost Allocation Rule by ID
 */
export const useCostAllocationRule = (
  id: string | undefined,
  options: { select?: string; enabled?: boolean } = {}
) => {
  const { select = '*', enabled = true } = options;

  return useQuery({
    queryKey: costAllocationRuleKeys.detail(id ?? ''),
    queryFn: async () => {
      if (!id) throw new Error('Cost Allocation Rule ID is required');

      const { data, error } = await supabase
        .from('cost_allocation_rule')
        .select(select)
        .eq('id', id)
        .single();

      if (error) throw error;

      return data as CostAllocationRule;
    },
    enabled: enabled && !!id,
  });
};

/**
 * Hook to fetch Cost Allocation Rules by type
 */
export const useCostAllocationRulesByType = (
  ruleType: CostAllocationRuleType,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'rule_type', operator: 'eq' as const, value: ruleType },
  ];

  return useCostAllocationRules({ ...options, filters });
};

/**
 * Hook to fetch enabled Cost Allocation Rules
 */
export const useEnabledCostAllocationRules = (options: ListQueryOptions = {}) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'enabled', operator: 'eq' as const, value: true },
  ];

  return useCostAllocationRules({ ...options, filters });
};

/**
 * Hook to search Cost Allocation Rules
 */
export const useSearchCostAllocationRules = (
  searchTerm: string,
  options: ListQueryOptions = {}
) => {
  return useCostAllocationRules({
    ...options,
    search: { column: 'name', value: searchTerm },
    enabled: (options.enabled ?? true) && searchTerm.length >= 2,
  });
};

/**
 * Hook to get rule type distribution
 */
export const useRuleTypeDistribution = (options: { enabled?: boolean } = {}) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['costAllocationRules', 'distribution'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cost_allocation_rule')
        .select('rule_type, enabled');

      if (error) throw error;

      // Count rules by type and status
      const distribution = new Map<string, { total: number; enabled: number }>();

      data?.forEach((row) => {
        const type = row.rule_type;
        const current = distribution.get(type) ?? { total: 0, enabled: 0 };
        current.total++;
        if (row.enabled) current.enabled++;
        distribution.set(type, current);
      });

      return Array.from(distribution.entries()).map(([type, stats]) => ({
        ruleType: type as CostAllocationRuleType,
        total: stats.total,
        enabled: stats.enabled,
        disabled: stats.total - stats.enabled,
      }));
    },
    enabled,
  });
};

/**
 * Hook to validate a rule expression
 */
export const useValidateRuleExpression = (
  expression: RuleExpression | null,
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['costAllocationRules', 'validate', expression],
    queryFn: async () => {
      if (!expression) {
        return { valid: false, errors: ['Expression is required'] };
      }

      const errors: string[] = [];

      // Validate based on expression type
      if ('type' in expression) {
        switch (expression.type) {
          case 'tag_based': {
            const tagExpr = expression as TagBasedExpression;
            if (!tagExpr.tag_key) {
              errors.push('Tag key is required');
            }
            if (!tagExpr.tag_value_mappings?.length) {
              errors.push('At least one tag value mapping is required');
            }
            tagExpr.tag_value_mappings?.forEach((mapping, idx) => {
              if (!mapping.value) {
                errors.push(`Mapping ${idx + 1}: Tag value is required`);
              }
              if (!mapping.project_id) {
                errors.push(`Mapping ${idx + 1}: Project ID is required`);
              }
            });
            break;
          }
          case 'namespace': {
            const nsExpr = expression as NamespaceExpression;
            if (!nsExpr.namespace_mappings?.length) {
              errors.push('At least one namespace mapping is required');
            }
            break;
          }
          case 'percentage_split': {
            const splitExpr = expression as PercentageSplitExpression;
            if (!splitExpr.splits?.length) {
              errors.push('At least one split is required');
            }
            const totalPercentage = splitExpr.splits?.reduce(
              (sum, s) => sum + (s.percentage ?? 0),
              0
            ) ?? 0;
            if (Math.abs(totalPercentage - 100) > 0.01) {
              errors.push(`Percentages must sum to 100% (current: ${totalPercentage}%)`);
            }
            break;
          }
        }
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    },
    enabled: enabled && expression !== null,
  });
};

// ============================================================================
// COST ALLOCATION RULE MUTATIONS
// ============================================================================

/**
 * Hook to create a new Cost Allocation Rule
 */
export const useCreateCostAllocationRule = (
  options: MutationOptions<CostAllocationRule, CostAllocationRuleInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CostAllocationRuleInsert) => {
      const { data, error } = await supabase
        .from('cost_allocation_rule')
        .insert(input)
        .select()
        .single();

      if (error) throw error;

      return data as CostAllocationRule;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: costAllocationRuleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['costAllocationRules', 'distribution'] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to create Cost Allocation Rule:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to update a Cost Allocation Rule
 */
export const useUpdateCostAllocationRule = (
  options: MutationOptions<CostAllocationRule, { id: string; data: CostAllocationRuleUpdate }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CostAllocationRuleUpdate }) => {
      const { data: result, error } = await supabase
        .from('cost_allocation_rule')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return result as CostAllocationRule;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: costAllocationRuleKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: costAllocationRuleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['costAllocationRules', 'distribution'] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to update Cost Allocation Rule:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to delete a Cost Allocation Rule
 */
export const useDeleteCostAllocationRule = (
  options: MutationOptions<void, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cost_allocation_rule')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: costAllocationRuleKeys.all });
      queryClient.invalidateQueries({ queryKey: ['costAllocationRules', 'distribution'] });
      options.onSuccess?.(undefined, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to delete Cost Allocation Rule:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: (data, error, variables) => {
      options.onSettled?.(data, error, variables);
    },
  });
};

/**
 * Hook to toggle a Cost Allocation Rule
 */
export const useToggleCostAllocationRule = (
  options: MutationOptions<CostAllocationRule, { id: string; enabled: boolean }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { data, error } = await supabase
        .from('cost_allocation_rule')
        .update({ enabled })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as CostAllocationRule;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: costAllocationRuleKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: costAllocationRuleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['costAllocationRules', 'distribution'] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to toggle Cost Allocation Rule:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to apply allocation rules to cost records
 */
export const useApplyAllocationRules = (
  options: MutationOptions<{ applied: number; failed: number }, { ruleIds?: string[]; dateRange?: { start: string; end: string } }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ruleIds, dateRange }: { ruleIds?: string[]; dateRange?: { start: string; end: string } }) => {
      // TODO: Implement actual allocation logic via Edge Function
      // This would:
      // 1. Fetch enabled rules (or specific rules if ruleIds provided)
      // 2. Fetch unallocated cost records within date range
      // 3. Apply each rule's expression to determine allocation
      // 4. Update cost records with project_id attribution

      // For now, return mock result
      return {
        applied: 0,
        failed: 0,
      };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['costRecords'] });
      queryClient.invalidateQueries({ queryKey: ['costAllocationRules', 'distribution'] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to apply allocation rules:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to bulk create allocation rules
 */
export const useBulkCreateCostAllocationRules = (
  options: MutationOptions<CostAllocationRule[], CostAllocationRuleInsert[]> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rules: CostAllocationRuleInsert[]) => {
      const { data, error } = await supabase
        .from('cost_allocation_rule')
        .insert(rules)
        .select();

      if (error) throw error;

      return data as CostAllocationRule[];
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: costAllocationRuleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['costAllocationRules', 'distribution'] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to bulk create allocation rules:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

// ============================================================================
// TODO: Future Enhancements
// ============================================================================
// TODO: Add useRuleSimulation hook to preview allocation results before applying
// TODO: Add useRuleConflictDetection hook to identify overlapping rules
// TODO: Add useRulePriority hook for rule ordering when multiple rules match
// TODO: Add useRuleHistory hook for tracking rule changes over time
// TODO: Add useRuleCloning hook for creating rules from templates
// TODO: Add support for conditional rule activation (time-based, threshold-based)
// TODO: Add integration with cost anomaly detection for automatic rule suggestions
// TODO: Add machine learning-based allocation recommendations
// TODO: Add rule performance metrics (allocation speed, accuracy)
// TODO: Add export/import functionality for rule definitions
