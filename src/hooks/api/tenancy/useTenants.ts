// ============================================================================
// Tenant Hooks - React Query Hooks for Tenant Management
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

// TODO: Import from database types when generated
export type TenantStatus = 'active' | 'suspended' | 'pending_setup' | 'archived';
export type TenantTier = 'free' | 'starter' | 'professional' | 'enterprise';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  tier: TenantTier;
  domain: string | null;
  settings: Record<string, unknown>;
  feature_flags: Record<string, boolean>;
  quotas: Record<string, number>;
  billing_email: string | null;
  technical_contact_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface TenantInsert {
  name: string;
  slug: string;
  status?: TenantStatus;
  tier?: TenantTier;
  domain?: string | null;
  settings?: Record<string, unknown>;
  feature_flags?: Record<string, boolean>;
  quotas?: Record<string, number>;
  billing_email?: string | null;
  technical_contact_email?: string | null;
}

export interface TenantUpdate {
  name?: string;
  slug?: string;
  status?: TenantStatus;
  tier?: TenantTier;
  domain?: string | null;
  settings?: Record<string, unknown>;
  feature_flags?: Record<string, boolean>;
  quotas?: Record<string, number>;
  billing_email?: string | null;
  technical_contact_email?: string | null;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const tenantKeys = createQueryKeyFactory<string>('tenants');

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Hook to fetch a list of tenants
 * @param options - Query options including pagination, sorting, and filtering
 */
export const useTenants = (options: ListQueryOptions = {}) => {
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
    queryKey: tenantKeys.list({ page, pageSize, sort, filters, search }),
    queryFn: async () => {
      let query = supabase
        .from('tenant')
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
        data: data as Tenant[],
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
 * Hook to fetch a single tenant by ID
 * @param id - Tenant ID
 * @param options - Query options
 */
export const useTenant = (
  id: string | undefined,
  options: { select?: string; enabled?: boolean } = {}
) => {
  const { select = '*', enabled = true } = options;

  return useQuery({
    queryKey: tenantKeys.detail(id ?? ''),
    queryFn: async () => {
      if (!id) throw new Error('Tenant ID is required');

      const { data, error } = await supabase
        .from('tenant')
        .select(select)
        .eq('id', id)
        .single();

      if (error) throw error;

      return data as Tenant;
    },
    enabled: enabled && !!id,
  });
};

/**
 * Hook to fetch a tenant by slug
 * @param slug - Tenant slug
 * @param options - Query options
 */
export const useTenantBySlug = (
  slug: string | undefined,
  options: { select?: string; enabled?: boolean } = {}
) => {
  const { select = '*', enabled = true } = options;

  return useQuery({
    queryKey: ['tenants', 'slug', slug],
    queryFn: async () => {
      if (!slug) throw new Error('Tenant slug is required');

      const { data, error } = await supabase
        .from('tenant')
        .select(select)
        .eq('slug', slug)
        .single();

      if (error) throw error;

      return data as Tenant;
    },
    enabled: enabled && !!slug,
  });
};

/**
 * Hook to fetch the current user's tenant
 * Uses JWT claims to determine tenant
 */
export const useCurrentTenant = (options: { select?: string; enabled?: boolean } = {}) => {
  const { select = '*', enabled = true } = options;

  return useQuery({
    queryKey: ['tenants', 'current'],
    queryFn: async () => {
      // TODO: Get tenant_id from JWT claims or session
      // For now, fetch the first tenant the user has access to
      const { data, error } = await supabase
        .from('tenant')
        .select(select)
        .limit(1)
        .single();

      if (error) throw error;

      return data as Tenant;
    },
    enabled,
  });
};

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Hook to create a new tenant
 */
export const useCreateTenant = (
  options: MutationOptions<Tenant, TenantInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TenantInsert) => {
      const { data, error } = await supabase
        .from('tenant')
        .insert(input)
        .select()
        .single();

      if (error) throw error;

      return data as Tenant;
    },
    onSuccess: (data, variables) => {
      // Invalidate tenant list queries
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to create tenant:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to update an existing tenant
 */
export const useUpdateTenant = (
  options: MutationOptions<Tenant, { id: string; data: TenantUpdate }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TenantUpdate }) => {
      const { data: result, error } = await supabase
        .from('tenant')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return result as Tenant;
    },
    onSuccess: (data, variables) => {
      // Invalidate specific tenant and lists
      queryClient.invalidateQueries({ queryKey: tenantKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to update tenant:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to delete a tenant
 */
export const useDeleteTenant = (
  options: MutationOptions<void, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tenant')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      // Invalidate all tenant queries
      queryClient.invalidateQueries({ queryKey: tenantKeys.all });
      options.onSuccess?.(undefined, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to delete tenant:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: (data, error, variables) => {
      options.onSettled?.(data, error, variables);
    },
  });
};

/**
 * Hook to update tenant status
 */
export const useUpdateTenantStatus = (
  options: MutationOptions<Tenant, { id: string; status: TenantStatus }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TenantStatus }) => {
      const { data, error } = await supabase
        .from('tenant')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as Tenant;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to update tenant status:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to update tenant tier
 */
export const useUpdateTenantTier = (
  options: MutationOptions<Tenant, { id: string; tier: TenantTier }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, tier }: { id: string; tier: TenantTier }) => {
      const { data, error } = await supabase
        .from('tenant')
        .update({ tier })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as Tenant;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to update tenant tier:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};
