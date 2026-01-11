// ============================================================================
// Compute Profile Hooks
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
 * Compute Profile type from database
 */
export interface ComputeProfile {
  id: string;
  tenant_id: string;
  name: string;
  cpu_request: number | null;
  cpu_limit: number | null;
  mem_request_mb: number | null;
  mem_limit_mb: number | null;
  gpu_count: number;
  gpu_type: string | null;
  ephemeral_storage_mb: number | null;
  node_selector: Record<string, string>;
  tolerations: Array<K8sToleration>;
  affinity: K8sAffinity;
  priority_class: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Kubernetes toleration specification
 */
export interface K8sToleration {
  key?: string;
  operator?: 'Exists' | 'Equal';
  value?: string;
  effect?: 'NoSchedule' | 'PreferNoSchedule' | 'NoExecute';
  tolerationSeconds?: number;
}

/**
 * Kubernetes affinity specification
 */
export interface K8sAffinity {
  nodeAffinity?: {
    requiredDuringSchedulingIgnoredDuringExecution?: {
      nodeSelectorTerms: Array<{
        matchExpressions?: Array<{
          key: string;
          operator: 'In' | 'NotIn' | 'Exists' | 'DoesNotExist' | 'Gt' | 'Lt';
          values?: string[];
        }>;
      }>;
    };
    preferredDuringSchedulingIgnoredDuringExecution?: Array<{
      weight: number;
      preference: {
        matchExpressions?: Array<{
          key: string;
          operator: 'In' | 'NotIn' | 'Exists' | 'DoesNotExist' | 'Gt' | 'Lt';
          values?: string[];
        }>;
      };
    }>;
  };
  podAffinity?: Record<string, unknown>;
  podAntiAffinity?: Record<string, unknown>;
}

/**
 * Compute profile insert type
 */
export type ComputeProfileInsert = Omit<ComputeProfile, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

/**
 * Compute profile update type
 */
export type ComputeProfileUpdate = Partial<Omit<ComputeProfile, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>;

/**
 * Compute profile with usage stats
 */
export interface ComputeProfileWithStats extends ComputeProfile {
  usage_count?: number;
  active_workloads?: number;
}

/**
 * GPU profile type for filtering
 */
export type GpuProfileFilter = 'all' | 'gpu-only' | 'cpu-only';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const computeProfileKeys = createQueryKeyFactory<string>('compute_profiles');

// Extended query keys
export const computeProfileQueryKeys = {
  ...computeProfileKeys,
  byGpuType: (gpuType: string) => [...computeProfileKeys.all, 'gpu_type', gpuType] as const,
  withGpu: () => [...computeProfileKeys.all, 'with_gpu'] as const,
  cpuOnly: () => [...computeProfileKeys.all, 'cpu_only'] as const,
  byPriorityClass: (priorityClass: string) => [...computeProfileKeys.all, 'priority', priorityClass] as const,
};

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Fetch all compute profiles with pagination
 */
export const useComputeProfiles = (options: ListQueryOptions = {}) => {
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
    queryKey: computeProfileKeys.list({ pagination, sort, filters, search }),
    queryFn: async () => {
      let query = supabase
        .from('compute_profile')
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
      return { data: data as ComputeProfile[], count };
    },
    enabled,
  });
};

/**
 * Fetch a single compute profile by ID
 */
export const useComputeProfile = (profileId: string, options: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: computeProfileKeys.detail(profileId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compute_profile')
        .select('*')
        .eq('id', profileId)
        .single();

      if (error) throw error;
      return data as ComputeProfile;
    },
    enabled: options.enabled !== false && !!profileId,
  });
};

/**
 * Fetch compute profile by name (unique within tenant)
 */
export const useComputeProfileByName = (name: string, options: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: [...computeProfileKeys.all, 'name', name] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compute_profile')
        .select('*')
        .eq('name', name)
        .single();

      if (error) throw error;
      return data as ComputeProfile;
    },
    enabled: options.enabled !== false && !!name,
  });
};

/**
 * Fetch all profiles with GPU
 */
export const useGpuProfiles = () => {
  return useQuery({
    queryKey: computeProfileQueryKeys.withGpu(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compute_profile')
        .select('*')
        .gt('gpu_count', 0)
        .order('gpu_count', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return data as ComputeProfile[];
    },
  });
};

/**
 * Fetch CPU-only profiles (no GPU)
 */
export const useCpuOnlyProfiles = () => {
  return useQuery({
    queryKey: computeProfileQueryKeys.cpuOnly(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compute_profile')
        .select('*')
        .eq('gpu_count', 0)
        .order('cpu_limit', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return data as ComputeProfile[];
    },
  });
};

/**
 * Fetch profiles by GPU type
 */
export const useProfilesByGpuType = (gpuType: string) => {
  return useQuery({
    queryKey: computeProfileQueryKeys.byGpuType(gpuType),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compute_profile')
        .select('*')
        .eq('gpu_type', gpuType)
        .order('gpu_count', { ascending: true });

      if (error) throw error;
      return data as ComputeProfile[];
    },
    enabled: !!gpuType,
  });
};

/**
 * Fetch profiles by priority class
 */
export const useProfilesByPriorityClass = (priorityClass: string) => {
  return useQuery({
    queryKey: computeProfileQueryKeys.byPriorityClass(priorityClass),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compute_profile')
        .select('*')
        .eq('priority_class', priorityClass)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as ComputeProfile[];
    },
    enabled: !!priorityClass,
  });
};

/**
 * Search compute profiles by name
 */
export const useSearchComputeProfiles = (searchTerm: string) => {
  return useQuery({
    queryKey: [...computeProfileKeys.all, 'search', searchTerm] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compute_profile')
        .select('*')
        .ilike('name', `%${searchTerm}%`)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as ComputeProfile[];
    },
    enabled: searchTerm.length >= 2,
  });
};

/**
 * Fetch profiles suitable for a workload (based on resource requirements)
 */
export const useSuitableProfiles = (requirements: {
  minCpu?: number;
  minMemoryMb?: number;
  gpuRequired?: boolean;
  gpuType?: string;
}) => {
  const { minCpu, minMemoryMb, gpuRequired, gpuType } = requirements;

  return useQuery({
    queryKey: [...computeProfileKeys.all, 'suitable', requirements] as const,
    queryFn: async () => {
      let query = supabase.from('compute_profile').select('*');

      if (minCpu) {
        query = query.gte('cpu_limit', minCpu);
      }

      if (minMemoryMb) {
        query = query.gte('mem_limit_mb', minMemoryMb);
      }

      if (gpuRequired) {
        query = query.gt('gpu_count', 0);
      }

      if (gpuType) {
        query = query.eq('gpu_type', gpuType);
      }

      query = query.order('cpu_limit', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;
      return data as ComputeProfile[];
    },
  });
};

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Create a new compute profile
 */
export const useCreateComputeProfile = (
  options: MutationOptions<ComputeProfile, ComputeProfileInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: ComputeProfileInsert) => {
      const { data, error } = await supabase
        .from('compute_profile')
        .insert(profile)
        .select()
        .single();

      if (error) throw error;
      return data as ComputeProfile;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: computeProfileKeys.lists() });
      if (data.gpu_count > 0) {
        queryClient.invalidateQueries({ queryKey: computeProfileQueryKeys.withGpu() });
      } else {
        queryClient.invalidateQueries({ queryKey: computeProfileQueryKeys.cpuOnly() });
      }
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update an existing compute profile
 */
export const useUpdateComputeProfile = (
  options: MutationOptions<ComputeProfile, { id: string; updates: ComputeProfileUpdate }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ComputeProfileUpdate }) => {
      const { data, error } = await supabase
        .from('compute_profile')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ComputeProfile;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: computeProfileKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: computeProfileKeys.lists() });
      queryClient.invalidateQueries({ queryKey: computeProfileQueryKeys.withGpu() });
      queryClient.invalidateQueries({ queryKey: computeProfileQueryKeys.cpuOnly() });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Delete a compute profile
 */
export const useDeleteComputeProfile = (
  options: MutationOptions<void, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileId: string) => {
      const { error } = await supabase
        .from('compute_profile')
        .delete()
        .eq('id', profileId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: computeProfileKeys.all });
      options.onSuccess?.(undefined, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update CPU resources
 */
export const useUpdateCpuResources = (
  options: MutationOptions<ComputeProfile, {
    id: string;
    cpuRequest: number | null;
    cpuLimit: number | null;
  }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, cpuRequest, cpuLimit }) => {
      const { data, error } = await supabase
        .from('compute_profile')
        .update({
          cpu_request: cpuRequest,
          cpu_limit: cpuLimit,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ComputeProfile;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: computeProfileKeys.detail(variables.id) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update memory resources
 */
export const useUpdateMemoryResources = (
  options: MutationOptions<ComputeProfile, {
    id: string;
    memRequestMb: number | null;
    memLimitMb: number | null;
  }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, memRequestMb, memLimitMb }) => {
      const { data, error } = await supabase
        .from('compute_profile')
        .update({
          mem_request_mb: memRequestMb,
          mem_limit_mb: memLimitMb,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ComputeProfile;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: computeProfileKeys.detail(variables.id) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update GPU configuration
 */
export const useUpdateGpuConfig = (
  options: MutationOptions<ComputeProfile, {
    id: string;
    gpuCount: number;
    gpuType: string | null;
  }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, gpuCount, gpuType }) => {
      const { data, error } = await supabase
        .from('compute_profile')
        .update({
          gpu_count: gpuCount,
          gpu_type: gpuType,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ComputeProfile;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: computeProfileKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: computeProfileQueryKeys.withGpu() });
      queryClient.invalidateQueries({ queryKey: computeProfileQueryKeys.cpuOnly() });
      if (data.gpu_type) {
        queryClient.invalidateQueries({ queryKey: computeProfileQueryKeys.byGpuType(data.gpu_type) });
      }
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update node selector
 */
export const useUpdateNodeSelector = (
  options: MutationOptions<ComputeProfile, { id: string; nodeSelector: Record<string, string> }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, nodeSelector }) => {
      const { data, error } = await supabase
        .from('compute_profile')
        .update({ node_selector: nodeSelector })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ComputeProfile;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: computeProfileKeys.detail(variables.id) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update tolerations
 */
export const useUpdateTolerations = (
  options: MutationOptions<ComputeProfile, { id: string; tolerations: K8sToleration[] }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, tolerations }) => {
      const { data, error } = await supabase
        .from('compute_profile')
        .update({ tolerations })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ComputeProfile;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: computeProfileKeys.detail(variables.id) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update affinity rules
 */
export const useUpdateAffinity = (
  options: MutationOptions<ComputeProfile, { id: string; affinity: K8sAffinity }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, affinity }) => {
      const { data, error } = await supabase
        .from('compute_profile')
        .update({ affinity })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ComputeProfile;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: computeProfileKeys.detail(variables.id) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Clone a compute profile
 */
export const useCloneComputeProfile = (
  options: MutationOptions<ComputeProfile, { sourceId: string; newName: string }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sourceId, newName }) => {
      // First, fetch the source profile
      const { data: source, error: fetchError } = await supabase
        .from('compute_profile')
        .select('*')
        .eq('id', sourceId)
        .single();

      if (fetchError) throw fetchError;

      // Create new profile with modified name
      const newProfile: ComputeProfileInsert = {
        tenant_id: source.tenant_id,
        name: newName,
        cpu_request: source.cpu_request,
        cpu_limit: source.cpu_limit,
        mem_request_mb: source.mem_request_mb,
        mem_limit_mb: source.mem_limit_mb,
        gpu_count: source.gpu_count,
        gpu_type: source.gpu_type,
        ephemeral_storage_mb: source.ephemeral_storage_mb,
        node_selector: source.node_selector,
        tolerations: source.tolerations,
        affinity: source.affinity,
        priority_class: source.priority_class,
      };

      const { data, error } = await supabase
        .from('compute_profile')
        .insert(newProfile)
        .select()
        .single();

      if (error) throw error;
      return data as ComputeProfile;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: computeProfileKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

// ============================================================================
// TODO: Additional Features
// ============================================================================
// TODO: Add useValidateComputeProfile hook for resource validation
// TODO: Add useComputeProfileUsage hook for usage statistics
// TODO: Add useRecommendProfile hook for workload-based recommendations
// TODO: Add useCompareProfiles hook for profile comparison
// TODO: Add batch profile creation/update operations
// TODO: Add profile versioning support
// TODO: Add profile templates (predefined configurations)
// TODO: Add cost estimation hooks based on profile resources
// TODO: Add profile sharing between tenants (with permissions)
// TODO: Add profile audit history hooks
