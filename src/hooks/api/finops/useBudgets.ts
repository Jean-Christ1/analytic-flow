// ============================================================================
// Budgets Hooks - React Query Hooks for Cost Budget Management
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
 * Budget period for recurring cost limits
 */
export type BudgetPeriod = 'monthly' | 'quarterly' | 'yearly';

/**
 * Budget scope type
 */
export type BudgetScopeType = 'tenant' | 'org' | 'project';

/**
 * Budget type alias for compatibility
 */
export type BudgetType = BudgetScopeType;

/**
 * Alert channel configuration
 */
export interface AlertChannel {
  type: 'email' | 'slack' | 'webhook' | 'pagerduty';
  config: {
    recipients?: string[];
    webhook_url?: string;
    channel_id?: string;
  };
}

/**
 * Budget threshold configuration
 */
export interface BudgetThreshold {
  percentage: number;
  alert_sent?: boolean;
  alert_sent_at?: string;
}

/**
 * Budget structure for cost management
 */
export interface Budget {
  id: string;
  tenant_id: string;
  scope_type: BudgetScopeType;
  scope_id: string | null;
  name: string;
  period: BudgetPeriod;
  amount: number | null;
  currency: string | null;
  threshold_percentages: BudgetThreshold[] | null;
  alert_channels: AlertChannel[] | null;
  created_at: string;
  updated_at: string;
}

export interface BudgetInsert {
  tenant_id: string;
  scope_type: BudgetScopeType;
  scope_id?: string | null;
  name: string;
  period: BudgetPeriod;
  amount?: number | null;
  currency?: string | null;
  threshold_percentages?: BudgetThreshold[] | null;
  alert_channels?: AlertChannel[] | null;
}

export interface BudgetUpdate {
  scope_type?: BudgetScopeType;
  scope_id?: string | null;
  name?: string;
  period?: BudgetPeriod;
  amount?: number | null;
  currency?: string | null;
  threshold_percentages?: BudgetThreshold[] | null;
  alert_channels?: AlertChannel[] | null;
}

export interface BudgetWithUsage extends Budget {
  current_usage: number;
  usage_percentage: number;
  remaining: number;
  status: 'healthy' | 'warning' | 'critical' | 'exceeded';
  period_start: string;
  period_end: string;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const budgetKeys = createQueryKeyFactory<string>('budgets');

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate budget period dates
 */
function getBudgetPeriodDates(period: BudgetPeriod): { start: string; end: string } {
  const now = new Date();
  let start: Date;
  let end: Date;

  switch (period) {
    case 'monthly':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      break;
    case 'quarterly': {
      const quarter = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), quarter * 3, 1);
      end = new Date(now.getFullYear(), (quarter + 1) * 3, 0, 23, 59, 59);
      break;
    }
    case 'yearly':
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      break;
  }

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

/**
 * Determine budget status based on usage
 */
function getBudgetStatus(usagePercentage: number, thresholds: BudgetThreshold[]): BudgetWithUsage['status'] {
  if (usagePercentage >= 100) return 'exceeded';

  const sortedThresholds = [...thresholds].sort((a, b) => b.percentage - a.percentage);
  for (const threshold of sortedThresholds) {
    if (usagePercentage >= threshold.percentage) {
      return threshold.percentage >= 90 ? 'critical' : 'warning';
    }
  }

  return 'healthy';
}

// ============================================================================
// BUDGET QUERIES
// ============================================================================

/**
 * Hook to fetch a list of Budgets
 */
export const useBudgets = (options: ListQueryOptions = {}) => {
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
    queryKey: budgetKeys.list({ page, pageSize, sort, filters, search }),
    queryFn: async () => {
      let query = supabase
        .from('budget')
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
        data: data as Budget[],
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
 * Hook to fetch a single Budget by ID
 */
export const useBudget = (
  id: string | undefined,
  options: { select?: string; enabled?: boolean } = {}
) => {
  const { select = '*', enabled = true } = options;

  return useQuery({
    queryKey: budgetKeys.detail(id ?? ''),
    queryFn: async () => {
      if (!id) throw new Error('Budget ID is required');

      const { data, error } = await supabase
        .from('budget')
        .select(select)
        .eq('id', id)
        .single();

      if (error) throw error;

      return data as Budget;
    },
    enabled: enabled && !!id,
  });
};

/**
 * Hook to fetch Budgets by scope type
 */
export const useBudgetsByScopeType = (
  scopeType: BudgetScopeType,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'scope_type', operator: 'eq' as const, value: scopeType },
  ];

  return useBudgets({ ...options, filters });
};

/**
 * Hook to fetch Budgets for a specific scope
 */
export const useBudgetsByScope = (
  scopeType: BudgetScopeType,
  scopeId: string,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'scope_type', operator: 'eq' as const, value: scopeType },
    { column: 'scope_id', operator: 'eq' as const, value: scopeId },
  ];

  return useBudgets({ ...options, filters });
};

/**
 * Hook to fetch tenant-level budgets
 */
export const useTenantBudgets = (options: ListQueryOptions = {}) => {
  return useBudgetsByScopeType('tenant', options);
};

/**
 * Hook to fetch project budgets
 */
export const useProjectBudgets = (
  projectId: string,
  options: ListQueryOptions = {}
) => {
  return useBudgetsByScope('project', projectId, options);
};

/**
 * Hook to search Budgets
 */
export const useSearchBudgets = (
  searchTerm: string,
  options: ListQueryOptions = {}
) => {
  return useBudgets({
    ...options,
    search: { column: 'name', value: searchTerm },
    enabled: (options.enabled ?? true) && searchTerm.length >= 2,
  });
};

/**
 * Hook to fetch Budgets by type (alias for useBudgetsByScopeType)
 *
 * Filters budgets by their budget type (tenant, org, project).
 *
 * Parameters
 * ----------
 * budgetType : BudgetType
 *     The type of budget to filter by ('tenant' | 'org' | 'project').
 * options : ListQueryOptions, optional
 *     Standard list query options for pagination, sorting, and filtering.
 *
 * Returns
 * -------
 * UseQueryResult
 *     Query result containing array of Budget objects matching the type.
 *
 * Examples
 * --------
 * >>> const { data: projectBudgets } = useBudgetsByType('project');
 * >>> projectBudgets?.forEach(budget => console.log(budget.name));
 */
export const useBudgetsByType = (
  budgetType: BudgetType,
  options: ListQueryOptions = {}
) => {
  return useBudgetsByScopeType(budgetType, options);
};

/**
 * Hook to fetch exceeded budgets (usage > 100%)
 *
 * Returns all budgets where current spending has exceeded the allocated amount.
 *
 * Parameters
 * ----------
 * options : object, optional
 *     Query options including enabled flag.
 *
 * Returns
 * -------
 * UseQueryResult
 *     Query result containing array of BudgetWithUsage objects where usage > 100%.
 *
 * Examples
 * --------
 * >>> const { data: exceededBudgets } = useExceededBudgets();
 * >>> console.log(`${exceededBudgets?.length} budgets exceeded`);
 */
export const useExceededBudgets = (options: { enabled?: boolean } = {}) => {
  const { enabled = true } = options;
  const budgetsQuery = useBudgetsWithUsage({ enabled });

  return useQuery({
    queryKey: ['budgets', 'exceeded'],
    queryFn: async () => {
      const budgets = budgetsQuery.data ?? [];
      return budgets.filter((b) => b.usage_percentage >= 100);
    },
    enabled: enabled && budgetsQuery.isSuccess,
  });
};

/**
 * Hook to get budget with current usage
 */
export const useBudgetWithUsage = (
  id: string | undefined,
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['budgets', 'withUsage', id],
    queryFn: async () => {
      if (!id) throw new Error('Budget ID is required');

      // Get the budget
      const { data: budget, error: budgetError } = await supabase
        .from('budget')
        .select('*')
        .eq('id', id)
        .single();

      if (budgetError) throw budgetError;

      const typedBudget = budget as Budget;
      const periodDates = getBudgetPeriodDates(typedBudget.period);

      // Get cost records for this budget's scope
      let costQuery = supabase
        .from('cost_record')
        .select('cost_amount')
        .gte('usage_start', periodDates.start)
        .lte('usage_end', periodDates.end);

      if (typedBudget.scope_type === 'project' && typedBudget.scope_id) {
        costQuery = costQuery.eq('project_id', typedBudget.scope_id);
      }

      const { data: costs, error: costsError } = await costQuery;

      if (costsError) throw costsError;

      const currentUsage = costs?.reduce((sum, c) => sum + (c.cost_amount ?? 0), 0) ?? 0;
      const budgetAmount = typedBudget.amount ?? 0;
      const usagePercentage = budgetAmount > 0 ? (currentUsage / budgetAmount) * 100 : 0;
      const remaining = Math.max(0, budgetAmount - currentUsage);
      const thresholds = (typedBudget.threshold_percentages ?? []) as BudgetThreshold[];

      return {
        ...typedBudget,
        current_usage: currentUsage,
        usage_percentage: usagePercentage,
        remaining,
        status: getBudgetStatus(usagePercentage, thresholds),
        period_start: periodDates.start,
        period_end: periodDates.end,
      } as BudgetWithUsage;
    },
    enabled: enabled && !!id,
  });
};

/**
 * Hook to get all budgets with usage status
 */
export const useBudgetsWithUsage = (options: { enabled?: boolean } = {}) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['budgets', 'allWithUsage'],
    queryFn: async () => {
      // Get all budgets
      const { data: budgets, error: budgetsError } = await supabase
        .from('budget')
        .select('*');

      if (budgetsError) throw budgetsError;

      // Get all cost records for this period (use monthly as default)
      const periodDates = getBudgetPeriodDates('monthly');
      const { data: costs, error: costsError } = await supabase
        .from('cost_record')
        .select('cost_amount, project_id')
        .gte('usage_start', periodDates.start)
        .lte('usage_end', periodDates.end);

      if (costsError) throw costsError;

      // Calculate usage per project
      const usageByProject = new Map<string, number>();
      let totalUsage = 0;

      costs?.forEach((c) => {
        const amount = c.cost_amount ?? 0;
        totalUsage += amount;
        if (c.project_id) {
          usageByProject.set(c.project_id, (usageByProject.get(c.project_id) ?? 0) + amount);
        }
      });

      // Map budgets with usage
      return budgets?.map((b) => {
        const typedBudget = b as Budget;
        const currentUsage = typedBudget.scope_type === 'tenant'
          ? totalUsage
          : typedBudget.scope_id
            ? usageByProject.get(typedBudget.scope_id) ?? 0
            : 0;

        const budgetAmount = typedBudget.amount ?? 0;
        const usagePercentage = budgetAmount > 0 ? (currentUsage / budgetAmount) * 100 : 0;
        const remaining = Math.max(0, budgetAmount - currentUsage);
        const thresholds = (typedBudget.threshold_percentages ?? []) as BudgetThreshold[];
        const periodForBudget = getBudgetPeriodDates(typedBudget.period);

        return {
          ...typedBudget,
          current_usage: currentUsage,
          usage_percentage: usagePercentage,
          remaining,
          status: getBudgetStatus(usagePercentage, thresholds),
          period_start: periodForBudget.start,
          period_end: periodForBudget.end,
        } as BudgetWithUsage;
      }) ?? [];
    },
    enabled,
  });
};

/**
 * Hook to get budgets that are at risk
 */
export const useAtRiskBudgets = (
  thresholdPercentage: number = 80,
  options: { enabled?: boolean; threshold?: number } = {}
) => {
  const { enabled = true, threshold } = options;
  const effectiveThreshold = threshold ?? thresholdPercentage;
  const budgetsQuery = useBudgetsWithUsage({ enabled });

  return useQuery({
    queryKey: ['budgets', 'atRisk', effectiveThreshold],
    queryFn: async () => {
      const budgets = budgetsQuery.data ?? [];
      return budgets.filter((b) => b.usage_percentage >= effectiveThreshold);
    },
    enabled: enabled && budgetsQuery.isSuccess,
  });
};

/**
 * Budget alert structure
 */
export interface BudgetAlert {
  id: string;
  budget_id: string;
  threshold: number;
  triggered_at: string;
  acknowledged: boolean;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
}

/**
 * Hook to fetch alerts for a specific Budget
 *
 * Retrieves all triggered threshold alerts for a budget,
 * ordered by most recent first.
 *
 * Parameters
 * ----------
 * budgetId : string | undefined
 *     The unique identifier of the budget.
 * options : object, optional
 *     Query options including enabled flag.
 *
 * Returns
 * -------
 * UseQueryResult
 *     Query result containing array of BudgetAlert objects.
 *
 * Examples
 * --------
 * >>> const { data: alerts } = useBudgetAlerts('budget-123');
 * >>> alerts?.forEach(alert => console.log(`Threshold ${alert.threshold}% triggered`));
 */
export const useBudgetAlerts = (
  budgetId: string | undefined,
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['budgets', 'alerts', budgetId],
    queryFn: async () => {
      if (!budgetId) throw new Error('Budget ID is required');

      // Get the budget with its thresholds
      const { data: budget, error: budgetError } = await supabase
        .from('budget')
        .select('id, threshold_percentages')
        .eq('id', budgetId)
        .single();

      if (budgetError) throw budgetError;

      // Extract triggered alerts from threshold_percentages
      const thresholds = (budget.threshold_percentages ?? []) as BudgetThreshold[];
      const alerts: BudgetAlert[] = thresholds
        .filter((t) => t.alert_sent)
        .map((t, index) => ({
          id: `${budgetId}-alert-${index}`,
          budget_id: budgetId,
          threshold: t.percentage,
          triggered_at: t.alert_sent_at ?? new Date().toISOString(),
          acknowledged: false,
          acknowledged_at: null,
          acknowledged_by: null,
        }));

      // Sort by triggered_at descending (most recent first)
      return alerts.sort(
        (a, b) => new Date(b.triggered_at).getTime() - new Date(a.triggered_at).getTime()
      );
    },
    enabled: enabled && !!budgetId,
  });
};

/**
 * Hook to get budget alerts summary
 */
export const useBudgetAlertsSummary = (options: { enabled?: boolean } = {}) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['budgets', 'alertsSummary'],
    queryFn: async () => {
      const { data: budgets, error } = await supabase
        .from('budget')
        .select('id, name, scope_type, threshold_percentages');

      if (error) throw error;

      // Count alerts sent
      let totalAlertsSent = 0;
      const alertsByBudget: { budgetId: string; name: string; alertsSent: number }[] = [];

      budgets?.forEach((b) => {
        const thresholds = (b.threshold_percentages ?? []) as BudgetThreshold[];
        const budgetAlerts = thresholds.filter((t) => t.alert_sent).length;
        totalAlertsSent += budgetAlerts;

        if (budgetAlerts > 0) {
          alertsByBudget.push({
            budgetId: b.id,
            name: b.name,
            alertsSent: budgetAlerts,
          });
        }
      });

      return {
        totalAlertsSent,
        budgetsWithAlerts: alertsByBudget.length,
        alertsByBudget,
      };
    },
    enabled,
  });
};

// ============================================================================
// BUDGET MUTATIONS
// ============================================================================

/**
 * Hook to create a new Budget
 */
export const useCreateBudget = (
  options: MutationOptions<Budget, BudgetInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: BudgetInsert) => {
      // Set default thresholds if not provided
      const inputWithDefaults = {
        ...input,
        threshold_percentages: input.threshold_percentages ?? [
          { percentage: 50 },
          { percentage: 80 },
          { percentage: 100 },
        ],
        currency: input.currency ?? 'USD',
      };

      const { data, error } = await supabase
        .from('budget')
        .insert(inputWithDefaults)
        .select()
        .single();

      if (error) throw error;

      return data as Budget;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['budgets', 'allWithUsage'] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to create Budget:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to update a Budget
 */
export const useUpdateBudget = (
  options: MutationOptions<Budget, { id: string; data: BudgetUpdate }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: BudgetUpdate }) => {
      const { data: result, error } = await supabase
        .from('budget')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return result as Budget;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: budgetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['budgets', 'withUsage', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['budgets', 'allWithUsage'] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to update Budget:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to delete a Budget
 */
export const useDeleteBudget = (
  options: MutationOptions<void, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('budget')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
      queryClient.invalidateQueries({ queryKey: ['budgets', 'allWithUsage'] });
      options.onSuccess?.(undefined, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to delete Budget:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: (data, error, variables) => {
      options.onSettled?.(data, error, variables);
    },
  });
};

/**
 * Hook to update budget thresholds
 */
export const useUpdateBudgetThresholds = (
  options: MutationOptions<Budget, { id: string; thresholds: BudgetThreshold[] }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, thresholds }: { id: string; thresholds: BudgetThreshold[] }) => {
      const { data, error } = await supabase
        .from('budget')
        .update({ threshold_percentages: thresholds })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as Budget;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['budgets', 'withUsage', variables.id] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to update Budget thresholds:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to update budget alert channels
 */
export const useUpdateBudgetAlertChannels = (
  options: MutationOptions<Budget, { id: string; channels: AlertChannel[] }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, channels }: { id: string; channels: AlertChannel[] }) => {
      const { data, error } = await supabase
        .from('budget')
        .update({ alert_channels: channels })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as Budget;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.detail(variables.id) });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to update Budget alert channels:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to check and send budget alerts
 */
export const useCheckBudgetAlerts = (
  options: MutationOptions<{ alertsSent: number }, void> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // TODO: Implement actual alert checking and sending via Edge Function
      // This would:
      // 1. Fetch all budgets with their current usage
      // 2. Compare usage to thresholds
      // 3. Send alerts via configured channels
      // 4. Update threshold_percentages with alert_sent flag

      return { alertsSent: 0 };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      options.onSuccess?.(data, undefined);
    },
    onError: (error: PostgrestError) => {
      console.error('Failed to check budget alerts:', getErrorMessage(error));
      options.onError?.(error, undefined);
    },
    onSettled: options.onSettled,
  });
};

// ============================================================================
// TODO: Future Enhancements
// ============================================================================
// TODO: Add useBudgetForecasting hook for predicting when budget will be exceeded
// TODO: Add useBudgetRecommendations hook for suggesting optimal budget amounts
// TODO: Add useBudgetHistory hook for tracking budget changes over time
// TODO: Add useBudgetComparison hook for comparing budget vs actual across periods
// TODO: Add useRolloverBudget hook for carrying over unused budget
// TODO: Add useBudgetSharing hook for shared budgets across projects
// TODO: Add integration with PagerDuty for critical budget alerts
// TODO: Add integration with Slack for budget notifications
// TODO: Add support for flexible budget periods (custom date ranges)
// TODO: Add support for multi-currency budgets
// TODO: Add support for budget approval workflows
