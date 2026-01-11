// ============================================================================
// Billing Accounts Hooks - React Query Hooks for Cloud Billing Management
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
 * Supported cloud providers for billing integration
 */
export type CloudProvider = 'aws' | 'gcp' | 'azure' | 'onprem';

/**
 * Status of a billing account
 */
export type BillingAccountStatus = 'active' | 'suspended' | 'pending' | 'inactive';

/**
 * Sync status of a billing account
 */
export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

/**
 * Billing account structure for cloud cost tracking
 */
export interface BillingAccount {
  id: string;
  tenant_id: string;
  provider: CloudProvider;
  name: string;
  external_id: string | null;
  currency: string | null;
  status: BillingAccountStatus;
  sync_status: SyncStatus;
  last_sync_at: string | null;
  config: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

/**
 * Sync status details for a billing account
 */
export interface BillingAccountSyncStatusDetails {
  account_id: string;
  sync_status: SyncStatus;
  last_sync_at: string | null;
  records_synced: number;
  next_sync_at: string | null;
  error_message: string | null;
}

export interface BillingAccountInsert {
  tenant_id: string;
  provider: CloudProvider;
  name: string;
  external_id?: string | null;
  currency?: string | null;
  config?: Record<string, unknown> | null;
}

export interface BillingAccountUpdate {
  provider?: CloudProvider;
  name?: string;
  external_id?: string | null;
  currency?: string | null;
  config?: Record<string, unknown> | null;
}

export interface BillingAccountWithStats extends BillingAccount {
  total_cost?: number;
  cost_records_count?: number;
  last_sync_at?: string | null;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const billingAccountKeys = createQueryKeyFactory<string>('billingAccounts');

// ============================================================================
// BILLING ACCOUNT QUERIES
// ============================================================================

/**
 * Hook to fetch a list of Billing Accounts
 */
export const useBillingAccounts = (options: ListQueryOptions = {}) => {
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
    queryKey: billingAccountKeys.list({ page, pageSize, sort, filters, search }),
    queryFn: async () => {
      let query = supabase
        .from('billing_account')
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
        data: data as BillingAccount[],
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
 * Hook to fetch a single Billing Account by ID
 */
export const useBillingAccount = (
  id: string | undefined,
  options: { select?: string; enabled?: boolean } = {}
) => {
  const { select = '*', enabled = true } = options;

  return useQuery({
    queryKey: billingAccountKeys.detail(id ?? ''),
    queryFn: async () => {
      if (!id) throw new Error('Billing Account ID is required');

      const { data, error } = await supabase
        .from('billing_account')
        .select(select)
        .eq('id', id)
        .single();

      if (error) throw error;

      return data as BillingAccount;
    },
    enabled: enabled && !!id,
  });
};

/**
 * Hook to fetch Billing Accounts by provider
 */
export const useBillingAccountsByProvider = (
  provider: CloudProvider,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'provider', operator: 'eq' as const, value: provider },
  ];

  return useBillingAccounts({ ...options, filters });
};

/**
 * Hook to search Billing Accounts
 */
export const useSearchBillingAccounts = (
  searchTerm: string,
  options: ListQueryOptions = {}
) => {
  return useBillingAccounts({
    ...options,
    search: { column: 'name', value: searchTerm },
    enabled: (options.enabled ?? true) && searchTerm.length >= 2,
  });
};

/**
 * Hook to fetch only active Billing Accounts
 *
 * Filters billing accounts by status = 'active' to return only
 * operational accounts that are currently in use.
 *
 * Parameters
 * ----------
 * options : ListQueryOptions
 *     Standard list query options for pagination, sorting, and filtering.
 *
 * Returns
 * -------
 * UseQueryResult
 *     Query result containing array of active BillingAccount objects.
 *
 * Examples
 * --------
 * >>> const { data: activeAccounts } = useActiveBillingAccounts();
 * >>> activeAccounts?.forEach(account => console.log(account.name));
 */
export const useActiveBillingAccounts = (options: ListQueryOptions = {}) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'status', operator: 'eq' as const, value: 'active' },
  ];

  return useBillingAccounts({ ...options, filters });
};

/**
 * Hook to fetch sync status for a specific Billing Account
 *
 * Retrieves detailed synchronization status including last sync time,
 * number of records synced, and next scheduled sync.
 *
 * Parameters
 * ----------
 * accountId : string | undefined
 *     The unique identifier of the billing account.
 * options : object, optional
 *     Query options including enabled flag.
 *
 * Returns
 * -------
 * UseQueryResult
 *     Query result containing BillingAccountSyncStatusDetails object.
 *
 * Examples
 * --------
 * >>> const { data: syncStatus } = useBillingAccountSyncStatus('billing-123');
 * >>> console.log(syncStatus?.records_synced);
 */
export const useBillingAccountSyncStatus = (
  accountId: string | undefined,
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['billingAccounts', 'syncStatus', accountId],
    queryFn: async () => {
      if (!accountId) throw new Error('Billing Account ID is required');

      // Fetch the billing account to get sync-related fields
      const { data: account, error: accountError } = await supabase
        .from('billing_account')
        .select('id, sync_status, last_sync_at, config')
        .eq('id', accountId)
        .single();

      if (accountError) throw accountError;

      // Get count of cost records for this account
      const { count, error: countError } = await supabase
        .from('cost_record')
        .select('*', { count: 'exact', head: true })
        .eq('billing_account_id', accountId);

      if (countError) throw countError;

      // Calculate next sync time (default: 1 hour after last sync)
      const lastSync = account.last_sync_at ? new Date(account.last_sync_at) : null;
      const nextSync = lastSync
        ? new Date(lastSync.getTime() + 3600000).toISOString()
        : null;

      return {
        account_id: account.id,
        sync_status: (account.sync_status ?? 'idle') as SyncStatus,
        last_sync_at: account.last_sync_at,
        records_synced: count ?? 0,
        next_sync_at: nextSync,
        error_message: null,
      } as BillingAccountSyncStatusDetails;
    },
    enabled: enabled && !!accountId,
    staleTime: 30000, // Consider stale after 30 seconds
    refetchInterval: 60000, // Refetch every minute when syncing
  });
};

/**
 * Hook to get billing account summary with cost aggregations
 */
export const useBillingAccountSummary = (
  id: string | undefined,
  dateRange?: { start: string; end: string },
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['billingAccounts', 'summary', id, dateRange],
    queryFn: async () => {
      if (!id) throw new Error('Billing Account ID is required');

      // Get the billing account
      const { data: account, error: accountError } = await supabase
        .from('billing_account')
        .select('*')
        .eq('id', id)
        .single();

      if (accountError) throw accountError;

      // Get cost records for this account
      let costQuery = supabase
        .from('cost_record')
        .select('cost_amount, service, created_at')
        .eq('billing_account_id', id);

      if (dateRange) {
        costQuery = costQuery
          .gte('usage_start', dateRange.start)
          .lte('usage_end', dateRange.end);
      }

      const { data: costs, error: costsError } = await costQuery;

      if (costsError) throw costsError;

      // Calculate aggregations
      const totalCost = costs?.reduce((sum, c) => sum + (c.cost_amount ?? 0), 0) ?? 0;
      const byService = new Map<string, number>();

      costs?.forEach((c) => {
        const service = c.service ?? 'unknown';
        byService.set(service, (byService.get(service) ?? 0) + (c.cost_amount ?? 0));
      });

      return {
        account: account as BillingAccount,
        totalCost,
        recordCount: costs?.length ?? 0,
        byService: Array.from(byService.entries()).map(([service, amount]) => ({
          service,
          amount,
        })),
      };
    },
    enabled: enabled && !!id,
  });
};

/**
 * Hook to get all providers with their account counts
 */
export const useProviderSummary = (options: { enabled?: boolean } = {}) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['billingAccounts', 'providers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('billing_account')
        .select('provider');

      if (error) throw error;

      // Count accounts by provider
      const providerCounts = new Map<CloudProvider, number>();
      data?.forEach((row) => {
        const provider = row.provider as CloudProvider;
        providerCounts.set(provider, (providerCounts.get(provider) ?? 0) + 1);
      });

      return Array.from(providerCounts.entries()).map(([provider, count]) => ({
        provider,
        accountCount: count,
      }));
    },
    enabled,
  });
};

// ============================================================================
// BILLING ACCOUNT MUTATIONS
// ============================================================================

/**
 * Hook to create a new Billing Account
 */
export const useCreateBillingAccount = (
  options: MutationOptions<BillingAccount, BillingAccountInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: BillingAccountInsert) => {
      const { data, error } = await supabase
        .from('billing_account')
        .insert(input)
        .select()
        .single();

      if (error) throw error;

      return data as BillingAccount;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: billingAccountKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['billingAccounts', 'providers'] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to create Billing Account:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to update a Billing Account
 */
export const useUpdateBillingAccount = (
  options: MutationOptions<BillingAccount, { id: string; data: BillingAccountUpdate }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: BillingAccountUpdate }) => {
      const { data: result, error } = await supabase
        .from('billing_account')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return result as BillingAccount;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: billingAccountKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: billingAccountKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['billingAccounts', 'summary', variables.id] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to update Billing Account:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to delete a Billing Account
 */
export const useDeleteBillingAccount = (
  options: MutationOptions<void, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('billing_account')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: billingAccountKeys.all });
      queryClient.invalidateQueries({ queryKey: ['billingAccounts', 'providers'] });
      options.onSuccess?.(undefined, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to delete Billing Account:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: (data, error, variables) => {
      options.onSettled?.(data, error, variables);
    },
  });
};

/**
 * Hook to sync billing account with cloud provider
 */
export const useSyncBillingAccount = (
  options: MutationOptions<BillingAccount, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // TODO: Implement actual cloud provider sync via Edge Function
      // This would call a serverless function that:
      // 1. Fetches cost data from AWS Cost Explorer / GCP Billing / Azure Cost Management
      // 2. Transforms and stores cost records
      // 3. Updates the billing account last_sync timestamp

      // For now, just update the timestamp
      const { data, error } = await supabase
        .from('billing_account')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as BillingAccount;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: billingAccountKeys.detail(variables) });
      queryClient.invalidateQueries({ queryKey: billingAccountKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['billingAccounts', 'summary', variables] });
      queryClient.invalidateQueries({ queryKey: ['costRecords'] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to sync Billing Account:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

// ============================================================================
// TODO: Future Enhancements
// ============================================================================
// TODO: Add useValidateBillingCredentials hook for credential verification
// TODO: Add useBillingAccountHealth hook for connection status monitoring
// TODO: Add useAutomatedSync hook for scheduled cost data synchronization
// TODO: Add useBillingAccountAnomalies hook for cost anomaly detection
// TODO: Add useBillingAccountForecasting hook for cost prediction
// TODO: Add integration with AWS Organizations for multi-account setup
// TODO: Add integration with GCP Billing Export for BigQuery
// TODO: Add integration with Azure Cost Management API
// TODO: Add support for custom pricing rates and discounts
// TODO: Add reserved instance and savings plan tracking
