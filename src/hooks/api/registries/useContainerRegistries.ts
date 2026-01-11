// ============================================================================
// Container Registry Hooks
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
 * Container registry type enum
 */
export type ContainerRegistryType = 'ecr' | 'gar' | 'acr' | 'harbor' | 'dockerhub' | 'ghcr';

/**
 * Image trust policy
 */
export interface ImageTrustPolicy {
  requireSigned?: boolean;
  trustedSigners?: string[];
  maxVulnerabilitySeverity?: 'low' | 'medium' | 'high' | 'critical' | 'none';
  allowedBaseImages?: string[];
  scanOnPush?: boolean;
  // TODO: Add more trust policy fields
}

/**
 * Container Registry type from database
 */
export interface ContainerRegistry {
  id: string;
  tenant_id: string;
  name: string;
  type: ContainerRegistryType;
  endpoint: string | null;
  auth_secret_ref: string | null;
  trust_policy: ImageTrustPolicy;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Container registry insert type
 */
export type ContainerRegistryInsert = Omit<ContainerRegistry, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

/**
 * Container registry update type
 */
export type ContainerRegistryUpdate = Partial<
  Omit<ContainerRegistry, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>
>;

/**
 * Container registry with stats
 */
export interface ContainerRegistryWithStats extends ContainerRegistry {
  image_count?: number;
  total_size_bytes?: number;
  environment_count?: number;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const containerRegistryKeys = createQueryKeyFactory<string>('container_registries');

// Extended query keys
export const containerRegistryQueryKeys = {
  ...containerRegistryKeys,
  byType: (type: ContainerRegistryType) => [...containerRegistryKeys.all, 'type', type] as const,
  default: () => [...containerRegistryKeys.all, 'default'] as const,
};

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Fetch all container registries with pagination
 */
export const useContainerRegistries = (options: ListQueryOptions = {}) => {
  const {
    pagination = { page: DEFAULT_PAGE, pageSize: DEFAULT_PAGE_SIZE },
    sort = { column: 'name', ascending: true },
    filters = [],
    search,
    select = '*',
    enabled = true,
  } = options;

  const page = pagination.page ?? DEFAULT_PAGE;
  const pageSize = pagination.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = calculateOffset(page, pageSize);

  return useQuery({
    queryKey: containerRegistryKeys.list({ pagination, sort, filters, search }),
    queryFn: async () => {
      let query = supabase
        .from('container_registry')
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
      return { data: data as ContainerRegistry[], count };
    },
    enabled,
  });
};

/**
 * Fetch a single container registry by ID
 */
export const useContainerRegistry = (registryId: string, options: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: containerRegistryKeys.detail(registryId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('container_registry')
        .select('*')
        .eq('id', registryId)
        .single();

      if (error) throw error;
      return data as ContainerRegistry;
    },
    enabled: options.enabled !== false && !!registryId,
  });
};

/**
 * Fetch container registry by name
 */
export const useContainerRegistryByName = (name: string, options: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: [...containerRegistryKeys.all, 'name', name] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('container_registry')
        .select('*')
        .eq('name', name)
        .single();

      if (error) throw error;
      return data as ContainerRegistry;
    },
    enabled: options.enabled !== false && !!name,
  });
};

/**
 * Fetch default container registry for tenant
 */
export const useDefaultContainerRegistry = () => {
  return useQuery({
    queryKey: containerRegistryQueryKeys.default(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('container_registry')
        .select('*')
        .eq('is_default', true)
        .maybeSingle();

      if (error) throw error;
      return data as ContainerRegistry | null;
    },
  });
};

/**
 * Fetch container registries by type
 */
export const useContainerRegistriesByType = (type: ContainerRegistryType) => {
  return useQuery({
    queryKey: containerRegistryQueryKeys.byType(type),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('container_registry')
        .select('*')
        .eq('type', type)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as ContainerRegistry[];
    },
  });
};

/**
 * Search container registries by name
 */
export const useSearchContainerRegistries = (searchTerm: string) => {
  return useQuery({
    queryKey: [...containerRegistryKeys.all, 'search', searchTerm] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('container_registry')
        .select('*')
        .ilike('name', `%${searchTerm}%`)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as ContainerRegistry[];
    },
    enabled: searchTerm.length >= 2,
  });
};

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Create a new container registry
 */
export const useCreateContainerRegistry = (
  options: MutationOptions<ContainerRegistry, ContainerRegistryInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (registry: ContainerRegistryInsert) => {
      const { data, error } = await supabase
        .from('container_registry')
        .insert(registry)
        .select()
        .single();

      if (error) throw error;
      return data as ContainerRegistry;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: containerRegistryKeys.lists() });
      if (data.is_default) {
        queryClient.invalidateQueries({ queryKey: containerRegistryQueryKeys.default() });
      }
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update a container registry
 */
export const useUpdateContainerRegistry = (
  options: MutationOptions<ContainerRegistry, { id: string; updates: ContainerRegistryUpdate }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ContainerRegistryUpdate }) => {
      const { data, error } = await supabase
        .from('container_registry')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ContainerRegistry;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: containerRegistryKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: containerRegistryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: containerRegistryQueryKeys.default() });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Delete a container registry
 */
export const useDeleteContainerRegistry = (
  options: MutationOptions<void, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (registryId: string) => {
      const { error } = await supabase
        .from('container_registry')
        .delete()
        .eq('id', registryId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: containerRegistryKeys.all });
      options.onSuccess?.(undefined, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Set default container registry
 */
export const useSetDefaultContainerRegistry = (
  options: MutationOptions<ContainerRegistry, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (registryId: string) => {
      // First, unset any existing default
      await supabase
        .from('container_registry')
        .update({ is_default: false })
        .eq('is_default', true);

      // Then set the new default
      const { data, error } = await supabase
        .from('container_registry')
        .update({ is_default: true })
        .eq('id', registryId)
        .select()
        .single();

      if (error) throw error;
      return data as ContainerRegistry;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: containerRegistryKeys.all });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update trust policy
 */
export const useUpdateTrustPolicy = (
  options: MutationOptions<ContainerRegistry, { id: string; trustPolicy: ImageTrustPolicy }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, trustPolicy }) => {
      const { data, error } = await supabase
        .from('container_registry')
        .update({ trust_policy: trustPolicy })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ContainerRegistry;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: containerRegistryKeys.detail(variables.id) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update authentication secret reference
 */
export const useUpdateRegistryAuth = (
  options: MutationOptions<ContainerRegistry, { id: string; authSecretRef: string | null }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, authSecretRef }) => {
      const { data, error } = await supabase
        .from('container_registry')
        .update({ auth_secret_ref: authSecretRef })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ContainerRegistry;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: containerRegistryKeys.detail(variables.id) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

// ============================================================================
// TODO: Additional Features
// ============================================================================
// TODO: Add useTestRegistryConnection hook for connectivity testing
// TODO: Add useListRegistryImages hook for image listing
// TODO: Add useRegistryImageTags hook for tag listing
// TODO: Add useDeleteRegistryImage hook for image deletion
// TODO: Add useScanRegistryImage hook for vulnerability scanning
// TODO: Add useRegistryMetrics hook for usage statistics
// TODO: Add useRegistryWebhooks hook for event webhooks
// TODO: Add bulk operations (sync, clean)
// TODO: Add registry mirroring hooks
// TODO: Add image replication hooks
