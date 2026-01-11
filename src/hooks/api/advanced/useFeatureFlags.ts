// ============================================================================
// Feature Flag Hooks
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
 * Feature flag type
 */
export type FeatureFlagType = 'boolean' | 'percentage' | 'user_list' | 'segment' | 'gradual_rollout';

/**
 * Feature flag status
 */
export type FeatureFlagStatus = 'active' | 'inactive' | 'archived';

/**
 * Feature flag from database
 */
export interface FeatureFlag {
  id: string;
  tenant_id: string;
  key: string;
  name: string;
  description: string | null;
  flag_type: FeatureFlagType;
  enabled: boolean;
  default_value: unknown;
  rules: FeatureFlagRule[];
  targeting: FeatureFlagTargeting;
  status: FeatureFlagStatus;
  tags: string[];
  metadata: Record<string, unknown>;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Feature flag rule
 */
export interface FeatureFlagRule {
  id: string;
  name: string;
  conditions: FeatureFlagCondition[];
  value: unknown;
  percentage?: number;
  priority: number;
}

/**
 * Feature flag condition
 */
export interface FeatureFlagCondition {
  attribute: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'in' | 'not_in' | 'gt' | 'lt' | 'gte' | 'lte';
  value: unknown;
}

/**
 * Feature flag targeting
 */
export interface FeatureFlagTargeting {
  enabled_users?: string[];
  disabled_users?: string[];
  enabled_teams?: string[];
  disabled_teams?: string[];
  enabled_projects?: string[];
  disabled_projects?: string[];
  percentage?: number;
  segment_ids?: string[];
}

/**
 * Feature flag with stats
 */
export interface FeatureFlagWithStats extends FeatureFlag {
  evaluation_count?: number;
  unique_users?: number;
  last_evaluated_at?: string;
}

/**
 * Feature flag insert type
 */
export type FeatureFlagInsert = Omit<
  FeatureFlag,
  'id' | 'created_at' | 'updated_at' | 'updated_by'
> & {
  id?: string;
};

/**
 * Feature flag update type
 */
export type FeatureFlagUpdate = Partial<
  Omit<FeatureFlag, 'id' | 'tenant_id' | 'key' | 'created_by' | 'created_at' | 'updated_at'>
>;

/**
 * Feature flag evaluation context
 */
export interface EvaluationContext {
  userId?: string;
  teamId?: string;
  projectId?: string;
  attributes?: Record<string, unknown>;
}

/**
 * Feature flag evaluation result
 */
export interface EvaluationResult {
  flag_key: string;
  value: unknown;
  rule_id?: string;
  reason: 'default' | 'rule_match' | 'targeting' | 'percentage' | 'disabled';
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const featureFlagKeys = createQueryKeyFactory<string>('feature_flags');

// Extended query keys
export const featureFlagQueryKeys = {
  ...featureFlagKeys,
  byKey: (key: string) => [...featureFlagKeys.all, 'key', key] as const,
  byStatus: (status: FeatureFlagStatus) => [...featureFlagKeys.all, 'status', status] as const,
  byTag: (tag: string) => [...featureFlagKeys.all, 'tag', tag] as const,
  active: () => [...featureFlagKeys.all, 'active'] as const,
  evaluation: (context: EvaluationContext) => [...featureFlagKeys.all, 'evaluate', context] as const,
};

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Fetch all feature flags
 */
export const useFeatureFlags = (options: ListQueryOptions = {}) => {
  const {
    pagination = { page: DEFAULT_PAGE, pageSize: DEFAULT_PAGE_SIZE },
    sort = { column: 'name', ascending: true },
    filters = [],
    search,
    enabled = true,
  } = options;

  const page = pagination.page ?? DEFAULT_PAGE;
  const pageSize = pagination.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = calculateOffset(page, pageSize);

  return useQuery({
    queryKey: featureFlagKeys.list({ pagination, sort, filters, search }),
    queryFn: async () => {
      let query = supabase
        .from('feature_flag')
        .select('*', { count: 'exact' });

      // Apply filters
      filters.forEach(filter => {
        query = query.filter(filter.column, filter.operator, filter.value);
      });

      // Apply search
      if (search) {
        query = query.or(`name.ilike.%${search.value}%,key.ilike.%${search.value}%`);
      }

      // Apply sorting
      const sortParams = Array.isArray(sort) ? sort : [sort];
      sortParams.forEach(s => {
        query = query.order(s.column, { ascending: s.ascending ?? true });
      });

      // Apply pagination
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;
      return { data: data as FeatureFlag[], count };
    },
    enabled,
  });
};

/**
 * Fetch a single feature flag by ID
 */
export const useFeatureFlag = (flagId: string, options: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: featureFlagKeys.detail(flagId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_flag')
        .select('*')
        .eq('id', flagId)
        .single();

      if (error) throw error;
      return data as FeatureFlag;
    },
    enabled: options.enabled !== false && !!flagId,
  });
};

/**
 * Fetch feature flag by key
 */
export const useFeatureFlagByKey = (key: string, options: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: featureFlagQueryKeys.byKey(key),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_flag')
        .select('*')
        .eq('key', key)
        .single();

      if (error) throw error;
      return data as FeatureFlag;
    },
    enabled: options.enabled !== false && !!key,
  });
};

/**
 * Fetch active feature flags
 */
export const useActiveFeatureFlags = () => {
  return useQuery({
    queryKey: featureFlagQueryKeys.active(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_flag')
        .select('*')
        .eq('status', 'active')
        .eq('enabled', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as FeatureFlag[];
    },
  });
};

/**
 * Fetch feature flags by status
 */
export const useFeatureFlagsByStatus = (status: FeatureFlagStatus) => {
  return useQuery({
    queryKey: featureFlagQueryKeys.byStatus(status),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_flag')
        .select('*')
        .eq('status', status)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as FeatureFlag[];
    },
  });
};

/**
 * Fetch feature flags by tag
 */
export const useFeatureFlagsByTag = (tag: string) => {
  return useQuery({
    queryKey: featureFlagQueryKeys.byTag(tag),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_flag')
        .select('*')
        .contains('tags', [tag])
        .order('name', { ascending: true });

      if (error) throw error;
      return data as FeatureFlag[];
    },
    enabled: !!tag,
  });
};

/**
 * Evaluate feature flags for a context
 */
export const useEvaluateFlags = (context: EvaluationContext) => {
  return useQuery({
    queryKey: featureFlagQueryKeys.evaluation(context),
    queryFn: async () => {
      // Fetch all active flags
      const { data: flags, error } = await supabase
        .from('feature_flag')
        .select('*')
        .eq('status', 'active');

      if (error) throw error;

      // Evaluate each flag
      const results: Record<string, EvaluationResult> = {};

      (flags || []).forEach(flag => {
        results[flag.key] = evaluateFlag(flag as FeatureFlag, context);
      });

      return results;
    },
    // Refetch periodically to catch flag changes
    refetchInterval: 60000, // 1 minute
  });
};

/**
 * Check if a specific flag is enabled
 */
export const useFlagEnabled = (key: string, context: EvaluationContext = {}) => {
  return useQuery({
    queryKey: [...featureFlagQueryKeys.byKey(key), 'enabled', context] as const,
    queryFn: async () => {
      const { data: flag, error } = await supabase
        .from('feature_flag')
        .select('*')
        .eq('key', key)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;

      if (!flag) {
        return { enabled: false, reason: 'not_found' };
      }

      const result = evaluateFlag(flag as FeatureFlag, context);
      return { enabled: !!result.value, reason: result.reason };
    },
    enabled: !!key,
  });
};

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Create a new feature flag
 */
export const useCreateFeatureFlag = (
  options: MutationOptions<FeatureFlag, FeatureFlagInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (flag: FeatureFlagInsert) => {
      const { data, error } = await supabase
        .from('feature_flag')
        .insert(flag)
        .select()
        .single();

      if (error) throw error;
      return data as FeatureFlag;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: featureFlagKeys.lists() });
      queryClient.invalidateQueries({ queryKey: featureFlagQueryKeys.active() });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update a feature flag
 */
export const useUpdateFeatureFlag = (
  options: MutationOptions<FeatureFlag, { id: string; updates: FeatureFlagUpdate }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: FeatureFlagUpdate }) => {
      const { data, error } = await supabase
        .from('feature_flag')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as FeatureFlag;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: featureFlagKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: featureFlagKeys.lists() });
      queryClient.invalidateQueries({ queryKey: featureFlagQueryKeys.byKey(data.key) });
      queryClient.invalidateQueries({ queryKey: featureFlagQueryKeys.active() });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Toggle feature flag enabled state
 */
export const useToggleFeatureFlag = (
  options: MutationOptions<FeatureFlag, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (flagId: string) => {
      // First get current state
      const { data: current, error: fetchError } = await supabase
        .from('feature_flag')
        .select('enabled')
        .eq('id', flagId)
        .single();

      if (fetchError) throw fetchError;

      // Toggle
      const { data, error } = await supabase
        .from('feature_flag')
        .update({ enabled: !current.enabled })
        .eq('id', flagId)
        .select()
        .single();

      if (error) throw error;
      return data as FeatureFlag;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: featureFlagKeys.detail(variables) });
      queryClient.invalidateQueries({ queryKey: featureFlagQueryKeys.active() });
      queryClient.invalidateQueries({ queryKey: featureFlagQueryKeys.byKey(data.key) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Delete a feature flag
 */
export const useDeleteFeatureFlag = (
  options: MutationOptions<void, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (flagId: string) => {
      const { error } = await supabase
        .from('feature_flag')
        .delete()
        .eq('id', flagId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: featureFlagKeys.all });
      options.onSuccess?.(undefined, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Archive a feature flag
 */
export const useArchiveFeatureFlag = (
  options: MutationOptions<FeatureFlag, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (flagId: string) => {
      const { data, error } = await supabase
        .from('feature_flag')
        .update({ status: 'archived', enabled: false })
        .eq('id', flagId)
        .select()
        .single();

      if (error) throw error;
      return data as FeatureFlag;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: featureFlagKeys.all });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update flag rules
 */
export const useUpdateFlagRules = (
  options: MutationOptions<FeatureFlag, { flagId: string; rules: FeatureFlagRule[] }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ flagId, rules }: { flagId: string; rules: FeatureFlagRule[] }) => {
      const { data, error } = await supabase
        .from('feature_flag')
        .update({ rules })
        .eq('id', flagId)
        .select()
        .single();

      if (error) throw error;
      return data as FeatureFlag;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: featureFlagKeys.detail(variables.flagId) });
      queryClient.invalidateQueries({ queryKey: featureFlagQueryKeys.byKey(data.key) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update flag targeting
 */
export const useUpdateFlagTargeting = (
  options: MutationOptions<FeatureFlag, { flagId: string; targeting: FeatureFlagTargeting }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ flagId, targeting }: { flagId: string; targeting: FeatureFlagTargeting }) => {
      const { data, error } = await supabase
        .from('feature_flag')
        .update({ targeting })
        .eq('id', flagId)
        .select()
        .single();

      if (error) throw error;
      return data as FeatureFlag;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: featureFlagKeys.detail(variables.flagId) });
      queryClient.invalidateQueries({ queryKey: featureFlagQueryKeys.byKey(data.key) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

// ============================================================================
// EVALUATION LOGIC
// ============================================================================

/**
 * Evaluate a feature flag for a given context
 */
function evaluateFlag(flag: FeatureFlag, context: EvaluationContext): EvaluationResult {
  // If flag is disabled, return default
  if (!flag.enabled) {
    return {
      flag_key: flag.key,
      value: flag.default_value,
      reason: 'disabled',
    };
  }

  const targeting = flag.targeting;

  // Check user targeting
  if (context.userId) {
    if (targeting.disabled_users?.includes(context.userId)) {
      return {
        flag_key: flag.key,
        value: false,
        reason: 'targeting',
      };
    }
    if (targeting.enabled_users?.includes(context.userId)) {
      return {
        flag_key: flag.key,
        value: true,
        reason: 'targeting',
      };
    }
  }

  // Check team targeting
  if (context.teamId) {
    if (targeting.disabled_teams?.includes(context.teamId)) {
      return {
        flag_key: flag.key,
        value: false,
        reason: 'targeting',
      };
    }
    if (targeting.enabled_teams?.includes(context.teamId)) {
      return {
        flag_key: flag.key,
        value: true,
        reason: 'targeting',
      };
    }
  }

  // Check project targeting
  if (context.projectId) {
    if (targeting.disabled_projects?.includes(context.projectId)) {
      return {
        flag_key: flag.key,
        value: false,
        reason: 'targeting',
      };
    }
    if (targeting.enabled_projects?.includes(context.projectId)) {
      return {
        flag_key: flag.key,
        value: true,
        reason: 'targeting',
      };
    }
  }

  // Check rules
  for (const rule of (flag.rules || []).sort((a, b) => a.priority - b.priority)) {
    if (evaluateRule(rule, context)) {
      // For percentage rules
      if (rule.percentage !== undefined && context.userId) {
        const hash = hashString(context.userId + flag.key);
        if (hash % 100 < rule.percentage) {
          return {
            flag_key: flag.key,
            value: rule.value,
            rule_id: rule.id,
            reason: 'rule_match',
          };
        }
      } else {
        return {
          flag_key: flag.key,
          value: rule.value,
          rule_id: rule.id,
          reason: 'rule_match',
        };
      }
    }
  }

  // Check percentage rollout
  if (targeting.percentage !== undefined && context.userId) {
    const hash = hashString(context.userId + flag.key);
    if (hash % 100 < targeting.percentage) {
      return {
        flag_key: flag.key,
        value: true,
        reason: 'percentage',
      };
    }
    return {
      flag_key: flag.key,
      value: false,
      reason: 'percentage',
    };
  }

  // Return default
  return {
    flag_key: flag.key,
    value: flag.default_value,
    reason: 'default',
  };
}

/**
 * Evaluate a rule against context
 */
function evaluateRule(rule: FeatureFlagRule, context: EvaluationContext): boolean {
  if (!rule.conditions || rule.conditions.length === 0) {
    return true;
  }

  return rule.conditions.every(condition => {
    const value = getAttributeValue(condition.attribute, context);
    return evaluateCondition(condition, value);
  });
}

/**
 * Get attribute value from context
 */
function getAttributeValue(attribute: string, context: EvaluationContext): unknown {
  if (attribute === 'userId') return context.userId;
  if (attribute === 'teamId') return context.teamId;
  if (attribute === 'projectId') return context.projectId;
  return context.attributes?.[attribute];
}

/**
 * Evaluate a single condition
 */
function evaluateCondition(condition: FeatureFlagCondition, value: unknown): boolean {
  switch (condition.operator) {
    case 'equals':
      return value === condition.value;
    case 'not_equals':
      return value !== condition.value;
    case 'contains':
      return String(value).includes(String(condition.value));
    case 'not_contains':
      return !String(value).includes(String(condition.value));
    case 'in':
      return Array.isArray(condition.value) && condition.value.includes(value);
    case 'not_in':
      return Array.isArray(condition.value) && !condition.value.includes(value);
    case 'gt':
      return Number(value) > Number(condition.value);
    case 'lt':
      return Number(value) < Number(condition.value);
    case 'gte':
      return Number(value) >= Number(condition.value);
    case 'lte':
      return Number(value) <= Number(condition.value);
    default:
      return false;
  }
}

/**
 * Simple hash function for percentage bucketing
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// ============================================================================
// TODO: Additional Features
// ============================================================================
// TODO: Add useFeatureFlagHistory hook for change history
// TODO: Add useFeatureFlagSchedule hook for scheduled toggles
// TODO: Add useFeatureFlagSegments hook for user segments
// TODO: Add useFeatureFlagAnalytics hook for usage analytics
// TODO: Add useFeatureFlagExperiment hook for A/B testing
// TODO: Add useFeatureFlagOverride hook for local overrides
// TODO: Add real-time flag updates via WebSocket
// TODO: Add useFeatureFlagExport hook for flag exports
// TODO: Add useFeatureFlagImport hook for flag imports
// TODO: Add useFeatureFlagComparison hook for environment comparison
