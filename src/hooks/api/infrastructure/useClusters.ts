// ============================================================================
// K8s Cluster Hooks
// MLOps Control Plane v3
// Author: Armand AMOUSSOU
// Date: 2026-01-04
// ============================================================================

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
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

// ============================================================================
// TYPES
// ============================================================================

/**
 * Cloud provider enum
 */
export type CloudProvider = 'aws' | 'gcp' | 'azure' | 'onprem';

/**
 * K8s environment tier
 */
export type K8sEnvironment = 'dev' | 'staging' | 'prod' | 'sandbox';

/**
 * K8s cluster status
 */
export type K8sClusterStatus = 'ready' | 'degraded' | 'down';

/**
 * K8s Cluster type from database
 */
export interface K8sCluster {
  id: string;
  tenant_id: string;
  name: string;
  provider: CloudProvider;
  region: string | null;
  environment: K8sEnvironment;
  api_server_url: string | null;
  cluster_identity: Record<string, unknown>;
  network_profile: Record<string, unknown>;
  status: K8sClusterStatus;
  version: string | null;
  labels: Record<string, string>;
  created_at: string;
  updated_at: string;
}

/**
 * Cluster insert type
 */
export type K8sClusterInsert = Omit<K8sCluster, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

/**
 * Cluster update type
 */
export type K8sClusterUpdate = Partial<Omit<K8sCluster, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>;

/**
 * Cluster with namespace count
 */
export interface K8sClusterWithStats extends K8sCluster {
  namespace_count?: number;
  // TODO: Add more stats (node count, resource utilization, etc.)
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const clusterKeys = createQueryKeyFactory<string>('k8s_clusters');

// Extended query keys for specific cluster queries
export const clusterQueryKeys = {
  ...clusterKeys,
  byProvider: (provider: CloudProvider) => [...clusterKeys.all, 'provider', provider] as const,
  byEnvironment: (env: K8sEnvironment) => [...clusterKeys.all, 'environment', env] as const,
  byStatus: (status: K8sClusterStatus) => [...clusterKeys.all, 'status', status] as const,
  byRegion: (region: string) => [...clusterKeys.all, 'region', region] as const,
  ready: () => [...clusterKeys.all, 'ready'] as const,
};

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Fetch all K8s clusters with pagination, sorting, and filtering
 */
export const useClusters = (options: ListQueryOptions = {}) => {
  const {
    pagination = { page: DEFAULT_PAGE, pageSize: DEFAULT_PAGE_SIZE },
    sort = { column: 'created_at', ascending: false },
    filters = [],
    search,
    select = '*',
    enabled = true,
  } = options;

  const page = pagination.page ?? DEFAULT_PAGE;
  const pageSize = pagination.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = calculateOffset(page, pageSize);

  return useQuery({
    queryKey: clusterKeys.list({ pagination, sort, filters, search }),
    queryFn: async () => {
      let query = supabase
        .from('k8s_cluster')
        .select(select, { count: 'exact' });

      // Apply filters
      filters.forEach(filter => {
        query = query.filter(filter.column, filter.operator, filter.value);
      });

      // Apply search
      if (search) {
        query = query.ilike(search.column, `%${search.value}%`);
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
      return { data: data as K8sCluster[], count };
    },
    enabled,
  });
};

/**
 * Infinite query for clusters with cursor-based pagination
 */
export const useInfiniteClusters = (options: Omit<ListQueryOptions, 'pagination'> = {}) => {
  const {
    sort = { column: 'created_at', ascending: false },
    filters = [],
    search,
    select = '*',
    enabled = true,
  } = options;

  const pageSize = DEFAULT_PAGE_SIZE;

  return useInfiniteQuery({
    queryKey: clusterKeys.infinite({ sort, filters, search }),
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('k8s_cluster')
        .select(select, { count: 'exact' });

      // Apply filters
      filters.forEach(filter => {
        query = query.filter(filter.column, filter.operator, filter.value);
      });

      // Apply search
      if (search) {
        query = query.ilike(search.column, `%${search.value}%`);
      }

      // Apply sorting
      const sortParams = Array.isArray(sort) ? sort : [sort];
      sortParams.forEach(s => {
        query = query.order(s.column, { ascending: s.ascending ?? true });
      });

      // Apply pagination
      query = query.range(pageParam, pageParam + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;
      return { data: data as K8sCluster[], count, nextCursor: pageParam + pageSize };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (!lastPage.count || lastPage.data.length < pageSize) return undefined;
      return lastPage.nextCursor;
    },
    enabled,
  });
};

/**
 * Fetch a single cluster by ID
 */
export const useCluster = (clusterId: string, options: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: clusterKeys.detail(clusterId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('k8s_cluster')
        .select('*')
        .eq('id', clusterId)
        .single();

      if (error) throw error;
      return data as K8sCluster;
    },
    enabled: options.enabled !== false && !!clusterId,
  });
};

/**
 * Fetch cluster by name (unique within tenant)
 */
export const useClusterByName = (name: string, options: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: [...clusterKeys.all, 'name', name] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('k8s_cluster')
        .select('*')
        .eq('name', name)
        .single();

      if (error) throw error;
      return data as K8sCluster;
    },
    enabled: options.enabled !== false && !!name,
  });
};

/**
 * Fetch clusters by provider
 */
export const useClustersByProvider = (
  provider: CloudProvider,
  pagination?: PaginationParams
) => {
  const page = pagination?.page ?? DEFAULT_PAGE;
  const pageSize = pagination?.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = calculateOffset(page, pageSize);

  return useQuery({
    queryKey: clusterQueryKeys.byProvider(provider),
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from('k8s_cluster')
        .select('*', { count: 'exact' })
        .eq('provider', provider)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) throw error;
      return { data: data as K8sCluster[], count };
    },
  });
};

/**
 * Fetch clusters by environment
 */
export const useClustersByEnvironment = (
  environment: K8sEnvironment,
  pagination?: PaginationParams
) => {
  const page = pagination?.page ?? DEFAULT_PAGE;
  const pageSize = pagination?.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = calculateOffset(page, pageSize);

  return useQuery({
    queryKey: clusterQueryKeys.byEnvironment(environment),
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from('k8s_cluster')
        .select('*', { count: 'exact' })
        .eq('environment', environment)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) throw error;
      return { data: data as K8sCluster[], count };
    },
  });
};

/**
 * Fetch clusters by status
 */
export const useClustersByStatus = (
  status: K8sClusterStatus,
  pagination?: PaginationParams
) => {
  const page = pagination?.page ?? DEFAULT_PAGE;
  const pageSize = pagination?.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = calculateOffset(page, pageSize);

  return useQuery({
    queryKey: clusterQueryKeys.byStatus(status),
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from('k8s_cluster')
        .select('*', { count: 'exact' })
        .eq('status', status)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) throw error;
      return { data: data as K8sCluster[], count };
    },
  });
};

/**
 * Fetch only ready clusters
 */
export const useReadyClusters = () => {
  return useQuery({
    queryKey: clusterQueryKeys.ready(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('k8s_cluster')
        .select('*')
        .eq('status', 'ready')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as K8sCluster[];
    },
  });
};

/**
 * Fetch clusters by region
 */
export const useClustersByRegion = (region: string) => {
  return useQuery({
    queryKey: clusterQueryKeys.byRegion(region),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('k8s_cluster')
        .select('*')
        .eq('region', region)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as K8sCluster[];
    },
    enabled: !!region,
  });
};

/**
 * Search clusters by name
 */
export const useSearchClusters = (searchTerm: string, pagination?: PaginationParams) => {
  const page = pagination?.page ?? DEFAULT_PAGE;
  const pageSize = pagination?.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = calculateOffset(page, pageSize);

  return useQuery({
    queryKey: [...clusterKeys.all, 'search', searchTerm] as const,
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from('k8s_cluster')
        .select('*', { count: 'exact' })
        .ilike('name', `%${searchTerm}%`)
        .order('name', { ascending: true })
        .range(offset, offset + pageSize - 1);

      if (error) throw error;
      return { data: data as K8sCluster[], count };
    },
    enabled: searchTerm.length >= 2,
  });
};

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Create a new K8s cluster
 */
export const useCreateCluster = (
  options: MutationOptions<K8sCluster, K8sClusterInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cluster: K8sClusterInsert) => {
      const { data, error } = await supabase
        .from('k8s_cluster')
        .insert(cluster)
        .select()
        .single();

      if (error) throw error;
      return data as K8sCluster;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: clusterKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update an existing cluster
 */
export const useUpdateCluster = (
  options: MutationOptions<K8sCluster, { id: string; updates: K8sClusterUpdate }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: K8sClusterUpdate }) => {
      const { data, error } = await supabase
        .from('k8s_cluster')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as K8sCluster;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: clusterKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: clusterKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Delete a cluster
 */
export const useDeleteCluster = (
  options: MutationOptions<void, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clusterId: string) => {
      const { error } = await supabase
        .from('k8s_cluster')
        .delete()
        .eq('id', clusterId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: clusterKeys.all });
      options.onSuccess?.(undefined, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update cluster status
 */
export const useUpdateClusterStatus = (
  options: MutationOptions<K8sCluster, { id: string; status: K8sClusterStatus }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: K8sClusterStatus }) => {
      const { data, error } = await supabase
        .from('k8s_cluster')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as K8sCluster;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: clusterKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: clusterKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clusterQueryKeys.byStatus(variables.status) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update cluster labels
 */
export const useUpdateClusterLabels = (
  options: MutationOptions<K8sCluster, { id: string; labels: Record<string, string> }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, labels }: { id: string; labels: Record<string, string> }) => {
      const { data, error } = await supabase
        .from('k8s_cluster')
        .update({ labels })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as K8sCluster;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: clusterKeys.detail(variables.id) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update cluster network profile
 */
export const useUpdateClusterNetworkProfile = (
  options: MutationOptions<K8sCluster, { id: string; networkProfile: Record<string, unknown> }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, networkProfile }: { id: string; networkProfile: Record<string, unknown> }) => {
      const { data, error } = await supabase
        .from('k8s_cluster')
        .update({ network_profile: networkProfile })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as K8sCluster;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: clusterKeys.detail(variables.id) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

// ============================================================================
// TODO: Additional Features
// ============================================================================
// TODO: Add useClusterHealth hook for health monitoring
// TODO: Add useClusterMetrics hook for resource utilization
// TODO: Add useClusterNodes hook for node listing
// TODO: Add useClusterEvents hook for cluster events
// TODO: Add useValidateClusterConnection hook for connectivity testing
// TODO: Add useClusterVersions hook for available K8s versions
// TODO: Add useUpgradeCluster mutation for version upgrades
// TODO: Add batch operations (bulk status update, bulk delete)
// TODO: Add cluster provisioning workflow hooks
// TODO: Add cluster backup/restore hooks
