// ============================================================================
// User Hooks - React Query Hooks for User Account Management
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

export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended';

export interface UserAccount {
  id: string;
  tenant_id: string;
  auth_user_id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  status: UserStatus;
  preferences: Record<string, unknown>;
  metadata: Record<string, unknown>;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserAccountInsert {
  tenant_id: string;
  auth_user_id: string;
  email: string;
  display_name?: string | null;
  avatar_url?: string | null;
  status?: UserStatus;
  preferences?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface UserAccountUpdate {
  email?: string;
  display_name?: string | null;
  avatar_url?: string | null;
  status?: UserStatus;
  preferences?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface UserWithRoles extends UserAccount {
  roles?: {
    id: string;
    name: string;
    scope_type: string;
  }[];
  groups?: {
    id: string;
    name: string;
  }[];
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const userKeys = createQueryKeyFactory<string>('users');

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Hook to fetch a list of users
 */
export const useUsers = (options: ListQueryOptions = {}) => {
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
    queryKey: userKeys.list({ page, pageSize, sort, filters, search }),
    queryFn: async () => {
      let query = supabase
        .from('user_account')
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
        query = query.or(`email.ilike.%${search.value}%,display_name.ilike.%${search.value}%`);
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
        data: data as UserAccount[],
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
 * Hook to fetch a single user by ID
 */
export const useUser = (
  id: string | undefined,
  options: { select?: string; enabled?: boolean } = {}
) => {
  const { select = '*', enabled = true } = options;

  return useQuery({
    queryKey: userKeys.detail(id ?? ''),
    queryFn: async () => {
      if (!id) throw new Error('User ID is required');

      const { data, error } = await supabase
        .from('user_account')
        .select(select)
        .eq('id', id)
        .single();

      if (error) throw error;

      return data as UserAccount;
    },
    enabled: enabled && !!id,
  });
};

/**
 * Hook to fetch a user with their roles and groups
 */
export const useUserWithRoles = (
  id: string | undefined,
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['users', 'withRoles', id],
    queryFn: async () => {
      if (!id) throw new Error('User ID is required');

      // Fetch user
      const { data: user, error: userError } = await supabase
        .from('user_account')
        .select('*')
        .eq('id', id)
        .single();

      if (userError) throw userError;

      // Fetch user's role bindings
      const { data: roleBindings, error: rolesError } = await supabase
        .from('principal_role_binding')
        .select(`
          role:role_id(id, name, scope_type)
        `)
        .eq('principal_type', 'user')
        .eq('principal_id', id);

      if (rolesError) throw rolesError;

      // Fetch user's groups
      const { data: groupMemberships, error: groupsError } = await supabase
        .from('group_member')
        .select(`
          group:group_id(id, name)
        `)
        .eq('user_id', id);

      if (groupsError) throw groupsError;

      return {
        ...user,
        roles: roleBindings?.map(rb => rb.role).filter(Boolean) ?? [],
        groups: groupMemberships?.map(gm => gm.group).filter(Boolean) ?? [],
      } as UserWithRoles;
    },
    enabled: enabled && !!id,
  });
};

/**
 * Hook to fetch a user by email
 */
export const useUserByEmail = (
  email: string | undefined,
  options: { select?: string; enabled?: boolean } = {}
) => {
  const { select = '*', enabled = true } = options;

  return useQuery({
    queryKey: ['users', 'email', email],
    queryFn: async () => {
      if (!email) throw new Error('Email is required');

      const { data, error } = await supabase
        .from('user_account')
        .select(select)
        .eq('email', email)
        .single();

      if (error) throw error;

      return data as UserAccount;
    },
    enabled: enabled && !!email,
  });
};

/**
 * Hook to search users by name or email
 */
export const useSearchUsers = (
  searchTerm: string,
  options: ListQueryOptions = {}
) => {
  return useUsers({
    ...options,
    search: { column: 'email', value: searchTerm },
    enabled: (options.enabled ?? true) && searchTerm.length >= 2,
  });
};

/**
 * Hook to fetch users by status
 */
export const useUsersByStatus = (
  status: UserStatus,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'status', operator: 'eq' as const, value: status },
  ];

  return useUsers({ ...options, filters });
};

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Hook to create a new user account
 */
export const useCreateUser = (
  options: MutationOptions<UserAccount, UserAccountInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UserAccountInsert) => {
      const { data, error } = await supabase
        .from('user_account')
        .insert(input)
        .select()
        .single();

      if (error) throw error;

      return data as UserAccount;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to create user:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to update a user account
 */
export const useUpdateUser = (
  options: MutationOptions<UserAccount, { id: string; data: UserAccountUpdate }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UserAccountUpdate }) => {
      const { data: result, error } = await supabase
        .from('user_account')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return result as UserAccount;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to update user:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to update user status
 */
export const useUpdateUserStatus = (
  options: MutationOptions<UserAccount, { id: string; status: UserStatus }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: UserStatus }) => {
      const { data, error } = await supabase
        .from('user_account')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as UserAccount;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to update user status:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to update user preferences
 */
export const useUpdateUserPreferences = (
  options: MutationOptions<UserAccount, { id: string; preferences: Record<string, unknown> }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, preferences }: { id: string; preferences: Record<string, unknown> }) => {
      // Merge with existing preferences
      const { data: existing, error: fetchError } = await supabase
        .from('user_account')
        .select('preferences')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const mergedPreferences = {
        ...(existing?.preferences ?? {}),
        ...preferences,
      };

      const { data, error } = await supabase
        .from('user_account')
        .update({ preferences: mergedPreferences })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as UserAccount;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to update user preferences:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to delete a user account
 */
export const useDeleteUser = (
  options: MutationOptions<void, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_account')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      options.onSuccess?.(undefined, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to delete user:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: (data, error, variables) => {
      options.onSettled?.(data, error, variables);
    },
  });
};

/**
 * Hook to suspend a user
 */
export const useSuspendUser = (options: MutationOptions<UserAccount, string> = {}) => {
  return useUpdateUserStatus({
    onSuccess: (data, variables) => {
      options.onSuccess?.(data, variables.id);
    },
    onError: (error, variables) => {
      options.onError?.(error, variables.id);
    },
  });
};

/**
 * Hook to activate a user
 */
export const useActivateUser = (options: MutationOptions<UserAccount, string> = {}) => {
  return useUpdateUserStatus({
    onSuccess: (data, variables) => {
      options.onSuccess?.(data, variables.id);
    },
    onError: (error, variables) => {
      options.onError?.(error, variables.id);
    },
  });
};
