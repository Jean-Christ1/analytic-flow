// ============================================================================
// Organization Hooks - React Query Hooks for Organization Management
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

export interface Organization {
  id: string;
  tenant_id: string;
  parent_org_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  path: string;
  depth: number;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface OrganizationInsert {
  tenant_id: string;
  parent_org_id?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  settings?: Record<string, unknown>;
}

export interface OrganizationUpdate {
  name?: string;
  slug?: string;
  description?: string | null;
  parent_org_id?: string | null;
  settings?: Record<string, unknown>;
}

export interface OrganizationWithChildren extends Organization {
  children?: Organization[];
  projects_count?: number;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const orgKeys = createQueryKeyFactory<string>('organizations');

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Hook to fetch a list of organizations
 */
export const useOrganizations = (options: ListQueryOptions = {}) => {
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
    queryKey: orgKeys.list({ page, pageSize, sort, filters, search }),
    queryFn: async () => {
      let query = supabase
        .from('org')
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
        query = query.order('path', { ascending: true });
      }

      // Apply pagination
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data as Organization[],
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
 * Hook to fetch a single organization by ID
 */
export const useOrganization = (
  id: string | undefined,
  options: { select?: string; enabled?: boolean } = {}
) => {
  const { select = '*', enabled = true } = options;

  return useQuery({
    queryKey: orgKeys.detail(id ?? ''),
    queryFn: async () => {
      if (!id) throw new Error('Organization ID is required');

      const { data, error } = await supabase
        .from('org')
        .select(select)
        .eq('id', id)
        .single();

      if (error) throw error;

      return data as Organization;
    },
    enabled: enabled && !!id,
  });
};

/**
 * Hook to fetch organization hierarchy (tree structure)
 */
export const useOrganizationTree = (
  tenantId: string | undefined,
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['organizations', 'tree', tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error('Tenant ID is required');

      const { data, error } = await supabase
        .from('org')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('path', { ascending: true });

      if (error) throw error;

      // Build tree structure
      const orgs = data as Organization[];
      const tree: OrganizationWithChildren[] = [];
      const orgMap = new Map<string, OrganizationWithChildren>();

      // First pass: create map
      for (const org of orgs) {
        orgMap.set(org.id, { ...org, children: [] });
      }

      // Second pass: build tree
      for (const org of orgs) {
        const orgWithChildren = orgMap.get(org.id)!;
        if (org.parent_org_id && orgMap.has(org.parent_org_id)) {
          orgMap.get(org.parent_org_id)!.children!.push(orgWithChildren);
        } else {
          tree.push(orgWithChildren);
        }
      }

      return tree;
    },
    enabled: enabled && !!tenantId,
  });
};

/**
 * Hook to fetch child organizations
 */
export const useChildOrganizations = (
  parentId: string | undefined,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'parent_org_id', operator: 'eq' as const, value: parentId },
  ];

  return useOrganizations({
    ...options,
    filters,
    enabled: (options.enabled ?? true) && !!parentId,
  });
};

/**
 * Hook to fetch root organizations (no parent)
 */
export const useRootOrganizations = (options: ListQueryOptions = {}) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'parent_org_id', operator: 'is' as const, value: null },
  ];

  return useOrganizations({ ...options, filters });
};

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Hook to create a new organization
 */
export const useCreateOrganization = (
  options: MutationOptions<Organization, OrganizationInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: OrganizationInsert) => {
      const { data, error } = await supabase
        .from('org')
        .insert(input)
        .select()
        .single();

      if (error) throw error;

      return data as Organization;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: orgKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['organizations', 'tree'] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to create organization:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to update an organization
 */
export const useUpdateOrganization = (
  options: MutationOptions<Organization, { id: string; data: OrganizationUpdate }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: OrganizationUpdate }) => {
      const { data: result, error } = await supabase
        .from('org')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return result as Organization;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: orgKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: orgKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['organizations', 'tree'] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to update organization:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to delete an organization
 */
export const useDeleteOrganization = (
  options: MutationOptions<void, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('org')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: orgKeys.all });
      queryClient.invalidateQueries({ queryKey: ['organizations', 'tree'] });
      options.onSuccess?.(undefined, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to delete organization:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: (data, error, variables) => {
      options.onSettled?.(data, error, variables);
    },
  });
};

/**
 * Hook to move an organization to a new parent
 */
export const useMoveOrganization = (
  options: MutationOptions<Organization, { id: string; newParentId: string | null }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, newParentId }: { id: string; newParentId: string | null }) => {
      const { data, error } = await supabase
        .from('org')
        .update({ parent_org_id: newParentId })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as Organization;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: orgKeys.all });
      queryClient.invalidateQueries({ queryKey: ['organizations', 'tree'] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to move organization:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};
