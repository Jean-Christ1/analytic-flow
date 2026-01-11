// ============================================================================
// K8s Namespace Binding Hooks
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
  type PaginationParams,
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE,
  calculateOffset,
} from '../utils/query-utils';
import { clusterKeys, type K8sCluster } from './useClusters';
import { projectKeys } from '../tenancy/useProjects';

// ============================================================================
// TYPES
// ============================================================================

/**
 * K8s Namespace Binding type from database
 */
export interface K8sNamespaceBinding {
  id: string;
  tenant_id: string;
  project_id: string;
  cluster_id: string;
  namespace: string;
  resource_quota: Record<string, unknown>;
  limit_range: Record<string, unknown>;
  network_policy_profile: string | null;
  pod_security_profile: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

/**
 * Namespace binding with relations
 */
export interface K8sNamespaceBindingWithRelations extends K8sNamespaceBinding {
  cluster?: K8sCluster;
  project?: {
    id: string;
    name: string;
    slug: string;
  };
}

/**
 * Namespace binding insert type
 */
export type K8sNamespaceBindingInsert = Omit<
  K8sNamespaceBinding,
  'id' | 'created_at' | 'updated_at'
> & {
  id?: string;
};

/**
 * Namespace binding update type
 */
export type K8sNamespaceBindingUpdate = Partial<
  Omit<K8sNamespaceBinding, 'id' | 'tenant_id' | 'project_id' | 'cluster_id' | 'created_at' | 'updated_at'>
>;

/**
 * Resource quota specification
 */
export interface ResourceQuotaSpec {
  cpu?: string;
  memory?: string;
  pods?: number;
  services?: number;
  secrets?: number;
  configmaps?: number;
  persistentvolumeclaims?: number;
  'requests.cpu'?: string;
  'requests.memory'?: string;
  'limits.cpu'?: string;
  'limits.memory'?: string;
  'requests.nvidia.com/gpu'?: number;
  // TODO: Add more resource quota fields
}

/**
 * Limit range specification
 */
export interface LimitRangeSpec {
  default?: {
    cpu?: string;
    memory?: string;
  };
  defaultRequest?: {
    cpu?: string;
    memory?: string;
  };
  max?: {
    cpu?: string;
    memory?: string;
  };
  min?: {
    cpu?: string;
    memory?: string;
  };
  // TODO: Add container-level limit ranges
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const namespaceBindingKeys = createQueryKeyFactory<string>('k8s_namespace_bindings');

// Extended query keys
export const namespaceBindingQueryKeys = {
  ...namespaceBindingKeys,
  byProject: (projectId: string) => [...namespaceBindingKeys.all, 'project', projectId] as const,
  byCluster: (clusterId: string) => [...namespaceBindingKeys.all, 'cluster', clusterId] as const,
  byNamespace: (namespace: string) => [...namespaceBindingKeys.all, 'namespace', namespace] as const,
  byStatus: (status: string) => [...namespaceBindingKeys.all, 'status', status] as const,
};

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Fetch all namespace bindings with pagination
 */
export const useNamespaceBindings = (options: ListQueryOptions = {}) => {
  const {
    pagination = { page: DEFAULT_PAGE, pageSize: DEFAULT_PAGE_SIZE },
    sort = { column: 'created_at', ascending: false },
    filters = [],
    select = '*, cluster:k8s_cluster(id, name, provider, environment, status)',
    enabled = true,
  } = options;

  const page = pagination.page ?? DEFAULT_PAGE;
  const pageSize = pagination.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = calculateOffset(page, pageSize);

  return useQuery({
    queryKey: namespaceBindingKeys.list({ pagination, sort, filters }),
    queryFn: async () => {
      let query = supabase
        .from('k8s_namespace_binding')
        .select(select, { count: 'exact' });

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
      return { data: data as K8sNamespaceBindingWithRelations[], count };
    },
    enabled,
  });
};

/**
 * Fetch a single namespace binding by ID
 */
export const useNamespaceBinding = (bindingId: string, options: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: namespaceBindingKeys.detail(bindingId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('k8s_namespace_binding')
        .select('*, cluster:k8s_cluster(id, name, provider, environment, status), project(id, name, slug)')
        .eq('id', bindingId)
        .single();

      if (error) throw error;
      return data as K8sNamespaceBindingWithRelations;
    },
    enabled: options.enabled !== false && !!bindingId,
  });
};

/**
 * Fetch namespace bindings by project
 */
export const useNamespaceBindingsByProject = (
  projectId: string,
  pagination?: PaginationParams
) => {
  const page = pagination?.page ?? DEFAULT_PAGE;
  const pageSize = pagination?.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = calculateOffset(page, pageSize);

  return useQuery({
    queryKey: namespaceBindingQueryKeys.byProject(projectId),
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from('k8s_namespace_binding')
        .select('*, cluster:k8s_cluster(id, name, provider, environment, status)', { count: 'exact' })
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) throw error;
      return { data: data as K8sNamespaceBindingWithRelations[], count };
    },
    enabled: !!projectId,
  });
};

/**
 * Fetch namespace bindings by cluster
 */
export const useNamespaceBindingsByCluster = (
  clusterId: string,
  pagination?: PaginationParams
) => {
  const page = pagination?.page ?? DEFAULT_PAGE;
  const pageSize = pagination?.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = calculateOffset(page, pageSize);

  return useQuery({
    queryKey: namespaceBindingQueryKeys.byCluster(clusterId),
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from('k8s_namespace_binding')
        .select('*, project(id, name, slug)', { count: 'exact' })
        .eq('cluster_id', clusterId)
        .order('namespace', { ascending: true })
        .range(offset, offset + pageSize - 1);

      if (error) throw error;
      return { data: data as K8sNamespaceBindingWithRelations[], count };
    },
    enabled: !!clusterId,
  });
};

/**
 * Fetch namespace bindings by status
 */
export const useNamespaceBindingsByStatus = (status: string) => {
  return useQuery({
    queryKey: namespaceBindingQueryKeys.byStatus(status),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('k8s_namespace_binding')
        .select('*, cluster:k8s_cluster(id, name, provider, environment)')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as K8sNamespaceBindingWithRelations[];
    },
  });
};

/**
 * Check if namespace exists in cluster
 */
export const useCheckNamespaceExists = (clusterId: string, namespace: string) => {
  return useQuery({
    queryKey: [...namespaceBindingKeys.all, 'check', clusterId, namespace] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('k8s_namespace_binding')
        .select('id')
        .eq('cluster_id', clusterId)
        .eq('namespace', namespace)
        .maybeSingle();

      if (error) throw error;
      return { exists: !!data, bindingId: data?.id };
    },
    enabled: !!clusterId && !!namespace,
  });
};

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Create a new namespace binding
 */
export const useCreateNamespaceBinding = (
  options: MutationOptions<K8sNamespaceBinding, K8sNamespaceBindingInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (binding: K8sNamespaceBindingInsert) => {
      const { data, error } = await supabase
        .from('k8s_namespace_binding')
        .insert(binding)
        .select()
        .single();

      if (error) throw error;
      return data as K8sNamespaceBinding;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: namespaceBindingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: namespaceBindingQueryKeys.byProject(data.project_id) });
      queryClient.invalidateQueries({ queryKey: namespaceBindingQueryKeys.byCluster(data.cluster_id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(data.project_id) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update a namespace binding
 */
export const useUpdateNamespaceBinding = (
  options: MutationOptions<K8sNamespaceBinding, { id: string; updates: K8sNamespaceBindingUpdate }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: K8sNamespaceBindingUpdate }) => {
      const { data, error } = await supabase
        .from('k8s_namespace_binding')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as K8sNamespaceBinding;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: namespaceBindingKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: namespaceBindingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: namespaceBindingQueryKeys.byProject(data.project_id) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Delete a namespace binding
 */
export const useDeleteNamespaceBinding = (
  options: MutationOptions<void, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bindingId: string) => {
      const { error } = await supabase
        .from('k8s_namespace_binding')
        .delete()
        .eq('id', bindingId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: namespaceBindingKeys.all });
      options.onSuccess?.(undefined, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update resource quota for a namespace binding
 */
export const useUpdateResourceQuota = (
  options: MutationOptions<K8sNamespaceBinding, { id: string; resourceQuota: ResourceQuotaSpec }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, resourceQuota }: { id: string; resourceQuota: ResourceQuotaSpec }) => {
      const { data, error } = await supabase
        .from('k8s_namespace_binding')
        .update({ resource_quota: resourceQuota })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as K8sNamespaceBinding;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: namespaceBindingKeys.detail(variables.id) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update limit range for a namespace binding
 */
export const useUpdateLimitRange = (
  options: MutationOptions<K8sNamespaceBinding, { id: string; limitRange: LimitRangeSpec }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, limitRange }: { id: string; limitRange: LimitRangeSpec }) => {
      const { data, error } = await supabase
        .from('k8s_namespace_binding')
        .update({ limit_range: limitRange })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as K8sNamespaceBinding;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: namespaceBindingKeys.detail(variables.id) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update security profiles for a namespace binding
 */
export const useUpdateSecurityProfiles = (
  options: MutationOptions<K8sNamespaceBinding, {
    id: string;
    networkPolicyProfile?: string | null;
    podSecurityProfile?: string | null;
  }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, networkPolicyProfile, podSecurityProfile }) => {
      const updates: Partial<K8sNamespaceBinding> = {};
      if (networkPolicyProfile !== undefined) {
        updates.network_policy_profile = networkPolicyProfile;
      }
      if (podSecurityProfile !== undefined) {
        updates.pod_security_profile = podSecurityProfile;
      }

      const { data, error } = await supabase
        .from('k8s_namespace_binding')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as K8sNamespaceBinding;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: namespaceBindingKeys.detail(variables.id) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update namespace binding status
 */
export const useUpdateNamespaceBindingStatus = (
  options: MutationOptions<K8sNamespaceBinding, { id: string; status: string }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from('k8s_namespace_binding')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as K8sNamespaceBinding;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: namespaceBindingKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: namespaceBindingQueryKeys.byStatus(variables.status) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

// ============================================================================
// TODO: Additional Features
// ============================================================================
// TODO: Add useNamespaceResources hook for resource usage monitoring
// TODO: Add useSyncNamespace mutation for K8s sync
// TODO: Add useNamespaceEvents hook for namespace events
// TODO: Add useNamespacePods hook for pod listing
// TODO: Add bulk operations (create multiple bindings, batch delete)
// TODO: Add namespace template support
// TODO: Add namespace migration between clusters
// TODO: Add namespace backup/restore hooks
// TODO: Add quota enforcement validation hooks
