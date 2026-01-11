// ============================================================================
// Role & Permission Hooks - React Query Hooks for RBAC Management
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

export type RoleScopeType = 'system' | 'tenant' | 'project';
export type PrincipalType = 'user' | 'group' | 'service_account';
export type PermissionCategory = 'admin' | 'project' | 'security' | 'mlops' | 'cicd' | 'gitops' | 'data' | 'governance';

export interface Role {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  scope_type: RoleScopeType;
  is_system_role: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface RoleInsert {
  tenant_id: string;
  name: string;
  description?: string | null;
  scope_type?: RoleScopeType;
  metadata?: Record<string, unknown>;
}

export interface RoleUpdate {
  name?: string;
  description?: string | null;
  scope_type?: RoleScopeType;
  metadata?: Record<string, unknown>;
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: PermissionCategory;
  created_at: string;
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  created_at: string;
}

export interface PrincipalRoleBinding {
  id: string;
  tenant_id: string;
  principal_type: PrincipalType;
  principal_id: string;
  role_id: string;
  project_id: string | null;
  granted_by: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface RoleWithPermissions extends Role {
  permissions?: Permission[];
}

export interface PrincipalRoleBindingInsert {
  tenant_id: string;
  principal_type: PrincipalType;
  principal_id: string;
  role_id: string;
  project_id?: string | null;
  granted_by?: string | null;
  expires_at?: string | null;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const roleKeys = createQueryKeyFactory<string>('roles');
export const permissionKeys = createQueryKeyFactory<string>('permissions');
export const roleBindingKeys = createQueryKeyFactory<string>('roleBindings');

// ============================================================================
// ROLE QUERIES
// ============================================================================

/**
 * Hook to fetch a list of roles
 */
export const useRoles = (options: ListQueryOptions = {}) => {
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
    queryKey: roleKeys.list({ page, pageSize, sort, filters, search }),
    queryFn: async () => {
      let query = supabase
        .from('role')
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
        query = query.order('name', { ascending: true });
      }

      // Apply pagination
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data as Role[],
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
 * Hook to fetch a single role by ID
 */
export const useRole = (
  id: string | undefined,
  options: { select?: string; enabled?: boolean } = {}
) => {
  const { select = '*', enabled = true } = options;

  return useQuery({
    queryKey: roleKeys.detail(id ?? ''),
    queryFn: async () => {
      if (!id) throw new Error('Role ID is required');

      const { data, error } = await supabase
        .from('role')
        .select(select)
        .eq('id', id)
        .single();

      if (error) throw error;

      return data as Role;
    },
    enabled: enabled && !!id,
  });
};

/**
 * Hook to fetch a role with its permissions
 */
export const useRoleWithPermissions = (
  id: string | undefined,
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['roles', 'withPermissions', id],
    queryFn: async () => {
      if (!id) throw new Error('Role ID is required');

      const { data: role, error: roleError } = await supabase
        .from('role')
        .select('*')
        .eq('id', id)
        .single();

      if (roleError) throw roleError;

      const { data: rolePermissions, error: permError } = await supabase
        .from('role_permission')
        .select(`
          permission:permission_id(*)
        `)
        .eq('role_id', id);

      if (permError) throw permError;

      return {
        ...role,
        permissions: rolePermissions?.map(rp => rp.permission).filter(Boolean) ?? [],
      } as RoleWithPermissions;
    },
    enabled: enabled && !!id,
  });
};

/**
 * Hook to fetch system roles
 */
export const useSystemRoles = (options: ListQueryOptions = {}) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'is_system_role', operator: 'eq' as const, value: true },
  ];

  return useRoles({ ...options, filters });
};

/**
 * Hook to fetch custom roles
 */
export const useCustomRoles = (options: ListQueryOptions = {}) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'is_system_role', operator: 'eq' as const, value: false },
  ];

  return useRoles({ ...options, filters });
};

// ============================================================================
// PERMISSION QUERIES
// ============================================================================

/**
 * Hook to fetch all permissions
 */
export const usePermissions = (options: ListQueryOptions = {}) => {
  const {
    pagination = { page: DEFAULT_PAGE, pageSize: 100 },
    sort,
    filters,
    select = '*',
    enabled = true,
  } = options;

  const page = pagination.page ?? DEFAULT_PAGE;
  const pageSize = pagination.pageSize ?? 100;
  const offset = calculateOffset(page, pageSize);

  return useQuery({
    queryKey: permissionKeys.list({ page, pageSize, sort, filters }),
    queryFn: async () => {
      let query = supabase
        .from('permission')
        .select(select, { count: 'exact' });

      // Apply filters
      if (filters) {
        for (const filter of filters) {
          // @ts-expect-error - Dynamic filter application
          query = query[filter.operator](filter.column, filter.value);
        }
      }

      // Apply sorting
      if (sort) {
        const sorts = Array.isArray(sort) ? sort : [sort];
        for (const s of sorts) {
          query = query.order(s.column, { ascending: s.ascending ?? true });
        }
      } else {
        query = query.order('category', { ascending: true }).order('name', { ascending: true });
      }

      // Apply pagination
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data as Permission[],
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
 * Hook to fetch permissions by category
 */
export const usePermissionsByCategory = (
  category: PermissionCategory,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'category', operator: 'eq' as const, value: category },
  ];

  return usePermissions({ ...options, filters });
};

/**
 * Hook to fetch permissions grouped by category
 */
export const usePermissionsGrouped = (options: { enabled?: boolean } = {}) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['permissions', 'grouped'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permission')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;

      // Group by category
      const grouped = (data as Permission[]).reduce((acc, perm) => {
        if (!acc[perm.category]) {
          acc[perm.category] = [];
        }
        acc[perm.category].push(perm);
        return acc;
      }, {} as Record<PermissionCategory, Permission[]>);

      return grouped;
    },
    enabled,
  });
};

// ============================================================================
// ROLE BINDING QUERIES
// ============================================================================

/**
 * Hook to fetch role bindings for a principal
 */
export const usePrincipalRoleBindings = (
  principalType: PrincipalType,
  principalId: string | undefined,
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['roleBindings', principalType, principalId],
    queryFn: async () => {
      if (!principalId) throw new Error('Principal ID is required');

      const { data, error } = await supabase
        .from('principal_role_binding')
        .select(`
          *,
          role:role_id(*),
          project:project_id(id, name)
        `)
        .eq('principal_type', principalType)
        .eq('principal_id', principalId);

      if (error) throw error;

      return data;
    },
    enabled: enabled && !!principalId,
  });
};

/**
 * Hook to fetch role bindings for a project
 */
export const useProjectRoleBindings = (
  projectId: string | undefined,
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['roleBindings', 'project', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID is required');

      const { data, error } = await supabase
        .from('principal_role_binding')
        .select(`
          *,
          role:role_id(*)
        `)
        .eq('project_id', projectId);

      if (error) throw error;

      return data;
    },
    enabled: enabled && !!projectId,
  });
};

// ============================================================================
// ROLE MUTATIONS
// ============================================================================

/**
 * Hook to create a new role
 */
export const useCreateRole = (
  options: MutationOptions<Role, RoleInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RoleInsert) => {
      const { data, error } = await supabase
        .from('role')
        .insert({ ...input, is_system_role: false })
        .select()
        .single();

      if (error) throw error;

      return data as Role;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to create role:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to update a role
 */
export const useUpdateRole = (
  options: MutationOptions<Role, { id: string; data: RoleUpdate }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: RoleUpdate }) => {
      const { data: result, error } = await supabase
        .from('role')
        .update(data)
        .eq('id', id)
        .eq('is_system_role', false) // Cannot update system roles
        .select()
        .single();

      if (error) throw error;

      return result as Role;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['roles', 'withPermissions', variables.id] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to update role:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to delete a role
 */
export const useDeleteRole = (
  options: MutationOptions<void, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('role')
        .delete()
        .eq('id', id)
        .eq('is_system_role', false); // Cannot delete system roles

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
      options.onSuccess?.(undefined, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to delete role:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: (data, error, variables) => {
      options.onSettled?.(data, error, variables);
    },
  });
};

/**
 * Hook to add a permission to a role
 */
export const useAddRolePermission = (
  options: MutationOptions<RolePermission, { roleId: string; permissionId: string }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roleId, permissionId }: { roleId: string; permissionId: string }) => {
      const { data, error } = await supabase
        .from('role_permission')
        .insert({ role_id: roleId, permission_id: permissionId })
        .select()
        .single();

      if (error) throw error;

      return data as RolePermission;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['roles', 'withPermissions', variables.roleId] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to add permission to role:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to remove a permission from a role
 */
export const useRemoveRolePermission = (
  options: MutationOptions<void, { roleId: string; permissionId: string }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roleId, permissionId }: { roleId: string; permissionId: string }) => {
      const { error } = await supabase
        .from('role_permission')
        .delete()
        .eq('role_id', roleId)
        .eq('permission_id', permissionId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['roles', 'withPermissions', variables.roleId] });
      options.onSuccess?.(undefined, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to remove permission from role:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: (data, error, variables) => {
      options.onSettled?.(data, error, variables);
    },
  });
};

/**
 * Hook to set all permissions for a role (replace)
 */
export const useSetRolePermissions = (
  options: MutationOptions<void, { roleId: string; permissionIds: string[] }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) => {
      // Delete existing permissions
      const { error: deleteError } = await supabase
        .from('role_permission')
        .delete()
        .eq('role_id', roleId);

      if (deleteError) throw deleteError;

      // Insert new permissions
      if (permissionIds.length > 0) {
        const { error: insertError } = await supabase
          .from('role_permission')
          .insert(permissionIds.map(pid => ({ role_id: roleId, permission_id: pid })));

        if (insertError) throw insertError;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['roles', 'withPermissions', variables.roleId] });
      options.onSuccess?.(undefined, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to set role permissions:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: (data, error, variables) => {
      options.onSettled?.(data, error, variables);
    },
  });
};

// ============================================================================
// ROLE BINDING MUTATIONS
// ============================================================================

/**
 * Hook to assign a role to a principal
 */
export const useAssignRole = (
  options: MutationOptions<PrincipalRoleBinding, PrincipalRoleBindingInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: PrincipalRoleBindingInsert) => {
      const { data, error } = await supabase
        .from('principal_role_binding')
        .insert(input)
        .select()
        .single();

      if (error) throw error;

      return data as PrincipalRoleBinding;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['roleBindings', variables.principal_type, variables.principal_id] });
      if (variables.project_id) {
        queryClient.invalidateQueries({ queryKey: ['roleBindings', 'project', variables.project_id] });
      }
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to assign role:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to revoke a role from a principal
 */
export const useRevokeRole = (
  options: MutationOptions<void, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bindingId: string) => {
      const { error } = await supabase
        .from('principal_role_binding')
        .delete()
        .eq('id', bindingId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: roleBindingKeys.all });
      options.onSuccess?.(undefined, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to revoke role:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: (data, error, variables) => {
      options.onSettled?.(data, error, variables);
    },
  });
};
