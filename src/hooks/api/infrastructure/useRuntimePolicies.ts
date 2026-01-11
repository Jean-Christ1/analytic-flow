// ============================================================================
// Runtime Policy Hooks
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
 * Pod Security Profile type
 */
export type PodSecurityProfile = 'restricted' | 'baseline' | 'privileged';

/**
 * Runtime Policy type from database
 */
export interface RuntimePolicy {
  id: string;
  tenant_id: string;
  name: string;
  allowed_images: string[];
  allowed_registries: string[];
  egress_rules: EgressRule[];
  ingress_rules: IngressRule[];
  pod_security_profile: PodSecurityProfile;
  env_var_allowlist: string[];
  secret_mount_policy: SecretMountPolicy;
  created_at: string;
  updated_at: string;
}

/**
 * Network egress rule
 */
export interface EgressRule {
  destination: string;
  ports?: number[];
  protocol?: 'TCP' | 'UDP' | 'SCTP';
  description?: string;
  // TODO: Add more egress rule fields (CIDR blocks, DNS names, etc.)
}

/**
 * Network ingress rule
 */
export interface IngressRule {
  source: string;
  ports?: number[];
  protocol?: 'TCP' | 'UDP' | 'SCTP';
  description?: string;
  // TODO: Add more ingress rule fields (CIDR blocks, service accounts, etc.)
}

/**
 * Secret mount policy
 */
export interface SecretMountPolicy {
  allowedPaths?: string[];
  allowedSecretNames?: string[];
  denyRootMounts?: boolean;
  readOnlyRequired?: boolean;
  // TODO: Add more secret mount policy fields
}

/**
 * Runtime policy insert type
 */
export type RuntimePolicyInsert = Omit<RuntimePolicy, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

/**
 * Runtime policy update type
 */
export type RuntimePolicyUpdate = Partial<Omit<RuntimePolicy, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>;

/**
 * Runtime policy with usage info
 */
export interface RuntimePolicyWithUsage extends RuntimePolicy {
  namespace_count?: number;
  workload_count?: number;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const runtimePolicyKeys = createQueryKeyFactory<string>('runtime_policies');

// Extended query keys
export const runtimePolicyQueryKeys = {
  ...runtimePolicyKeys,
  bySecurityProfile: (profile: PodSecurityProfile) => [...runtimePolicyKeys.all, 'security_profile', profile] as const,
  restricted: () => [...runtimePolicyKeys.all, 'restricted'] as const,
  baseline: () => [...runtimePolicyKeys.all, 'baseline'] as const,
  privileged: () => [...runtimePolicyKeys.all, 'privileged'] as const,
};

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Fetch all runtime policies with pagination
 */
export const useRuntimePolicies = (options: ListQueryOptions = {}) => {
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
    queryKey: runtimePolicyKeys.list({ pagination, sort, filters, search }),
    queryFn: async () => {
      let query = supabase
        .from('runtime_policy')
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
      return { data: data as RuntimePolicy[], count };
    },
    enabled,
  });
};

/**
 * Fetch a single runtime policy by ID
 */
export const useRuntimePolicy = (policyId: string, options: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: runtimePolicyKeys.detail(policyId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('runtime_policy')
        .select('*')
        .eq('id', policyId)
        .single();

      if (error) throw error;
      return data as RuntimePolicy;
    },
    enabled: options.enabled !== false && !!policyId,
  });
};

/**
 * Fetch runtime policy by name (unique within tenant)
 */
export const useRuntimePolicyByName = (name: string, options: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: [...runtimePolicyKeys.all, 'name', name] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('runtime_policy')
        .select('*')
        .eq('name', name)
        .single();

      if (error) throw error;
      return data as RuntimePolicy;
    },
    enabled: options.enabled !== false && !!name,
  });
};

/**
 * Fetch policies by security profile
 */
export const useRuntimePoliciesBySecurityProfile = (profile: PodSecurityProfile) => {
  return useQuery({
    queryKey: runtimePolicyQueryKeys.bySecurityProfile(profile),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('runtime_policy')
        .select('*')
        .eq('pod_security_profile', profile)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as RuntimePolicy[];
    },
  });
};

/**
 * Fetch restricted policies only
 */
export const useRestrictedPolicies = () => {
  return useQuery({
    queryKey: runtimePolicyQueryKeys.restricted(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('runtime_policy')
        .select('*')
        .eq('pod_security_profile', 'restricted')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as RuntimePolicy[];
    },
  });
};

/**
 * Fetch baseline policies only
 */
export const useBaselinePolicies = () => {
  return useQuery({
    queryKey: runtimePolicyQueryKeys.baseline(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('runtime_policy')
        .select('*')
        .eq('pod_security_profile', 'baseline')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as RuntimePolicy[];
    },
  });
};

/**
 * Search runtime policies by name
 */
export const useSearchRuntimePolicies = (searchTerm: string) => {
  return useQuery({
    queryKey: [...runtimePolicyKeys.all, 'search', searchTerm] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('runtime_policy')
        .select('*')
        .ilike('name', `%${searchTerm}%`)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as RuntimePolicy[];
    },
    enabled: searchTerm.length >= 2,
  });
};

/**
 * Validate image against policy
 */
export const useValidateImage = (policyId: string, imageName: string) => {
  return useQuery({
    queryKey: [...runtimePolicyKeys.all, 'validate', 'image', policyId, imageName] as const,
    queryFn: async () => {
      const { data: policy, error } = await supabase
        .from('runtime_policy')
        .select('allowed_images, allowed_registries')
        .eq('id', policyId)
        .single();

      if (error) throw error;

      const allowedImages = policy.allowed_images as string[];
      const allowedRegistries = policy.allowed_registries as string[];

      // Check if image matches any allowed pattern
      const imageAllowed = allowedImages.some(pattern => {
        const regex = new RegExp(pattern.replace('*', '.*'));
        return regex.test(imageName);
      });

      // Check if image registry is allowed
      const registryAllowed = allowedRegistries.some(registry => {
        return imageName.startsWith(registry);
      });

      return {
        allowed: imageAllowed || registryAllowed,
        imageMatched: imageAllowed,
        registryMatched: registryAllowed,
        checkedPatterns: allowedImages,
        checkedRegistries: allowedRegistries,
      };
    },
    enabled: !!policyId && !!imageName,
  });
};

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Create a new runtime policy
 */
export const useCreateRuntimePolicy = (
  options: MutationOptions<RuntimePolicy, RuntimePolicyInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (policy: RuntimePolicyInsert) => {
      const { data, error } = await supabase
        .from('runtime_policy')
        .insert(policy)
        .select()
        .single();

      if (error) throw error;
      return data as RuntimePolicy;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: runtimePolicyKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: runtimePolicyQueryKeys.bySecurityProfile(data.pod_security_profile),
      });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update a runtime policy
 */
export const useUpdateRuntimePolicy = (
  options: MutationOptions<RuntimePolicy, { id: string; updates: RuntimePolicyUpdate }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: RuntimePolicyUpdate }) => {
      const { data, error } = await supabase
        .from('runtime_policy')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as RuntimePolicy;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: runtimePolicyKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: runtimePolicyKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Delete a runtime policy
 */
export const useDeleteRuntimePolicy = (
  options: MutationOptions<void, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (policyId: string) => {
      const { error } = await supabase
        .from('runtime_policy')
        .delete()
        .eq('id', policyId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: runtimePolicyKeys.all });
      options.onSuccess?.(undefined, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update allowed images list
 */
export const useUpdateAllowedImages = (
  options: MutationOptions<RuntimePolicy, { id: string; allowedImages: string[] }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, allowedImages }) => {
      const { data, error } = await supabase
        .from('runtime_policy')
        .update({ allowed_images: allowedImages })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as RuntimePolicy;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: runtimePolicyKeys.detail(variables.id) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Add allowed image pattern
 */
export const useAddAllowedImage = (
  options: MutationOptions<RuntimePolicy, { id: string; imagePattern: string }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, imagePattern }) => {
      // First fetch current policy
      const { data: current, error: fetchError } = await supabase
        .from('runtime_policy')
        .select('allowed_images')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const currentImages = current.allowed_images as string[];
      if (currentImages.includes(imagePattern)) {
        throw new Error('Image pattern already exists');
      }

      const { data, error } = await supabase
        .from('runtime_policy')
        .update({ allowed_images: [...currentImages, imagePattern] })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as RuntimePolicy;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: runtimePolicyKeys.detail(variables.id) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Remove allowed image pattern
 */
export const useRemoveAllowedImage = (
  options: MutationOptions<RuntimePolicy, { id: string; imagePattern: string }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, imagePattern }) => {
      // First fetch current policy
      const { data: current, error: fetchError } = await supabase
        .from('runtime_policy')
        .select('allowed_images')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const currentImages = current.allowed_images as string[];
      const updatedImages = currentImages.filter(img => img !== imagePattern);

      const { data, error } = await supabase
        .from('runtime_policy')
        .update({ allowed_images: updatedImages })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as RuntimePolicy;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: runtimePolicyKeys.detail(variables.id) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update allowed registries
 */
export const useUpdateAllowedRegistries = (
  options: MutationOptions<RuntimePolicy, { id: string; allowedRegistries: string[] }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, allowedRegistries }) => {
      const { data, error } = await supabase
        .from('runtime_policy')
        .update({ allowed_registries: allowedRegistries })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as RuntimePolicy;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: runtimePolicyKeys.detail(variables.id) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update network egress rules
 */
export const useUpdateEgressRules = (
  options: MutationOptions<RuntimePolicy, { id: string; egressRules: EgressRule[] }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, egressRules }) => {
      const { data, error } = await supabase
        .from('runtime_policy')
        .update({ egress_rules: egressRules })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as RuntimePolicy;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: runtimePolicyKeys.detail(variables.id) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update network ingress rules
 */
export const useUpdateIngressRules = (
  options: MutationOptions<RuntimePolicy, { id: string; ingressRules: IngressRule[] }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ingressRules }) => {
      const { data, error } = await supabase
        .from('runtime_policy')
        .update({ ingress_rules: ingressRules })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as RuntimePolicy;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: runtimePolicyKeys.detail(variables.id) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update pod security profile
 */
export const useUpdatePodSecurityProfile = (
  options: MutationOptions<RuntimePolicy, { id: string; profile: PodSecurityProfile }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, profile }) => {
      const { data, error } = await supabase
        .from('runtime_policy')
        .update({ pod_security_profile: profile })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as RuntimePolicy;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: runtimePolicyKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: runtimePolicyQueryKeys.bySecurityProfile(variables.profile) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update environment variable allowlist
 */
export const useUpdateEnvVarAllowlist = (
  options: MutationOptions<RuntimePolicy, { id: string; envVarAllowlist: string[] }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, envVarAllowlist }) => {
      const { data, error } = await supabase
        .from('runtime_policy')
        .update({ env_var_allowlist: envVarAllowlist })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as RuntimePolicy;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: runtimePolicyKeys.detail(variables.id) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update secret mount policy
 */
export const useUpdateSecretMountPolicy = (
  options: MutationOptions<RuntimePolicy, { id: string; secretMountPolicy: SecretMountPolicy }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, secretMountPolicy }) => {
      const { data, error } = await supabase
        .from('runtime_policy')
        .update({ secret_mount_policy: secretMountPolicy })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as RuntimePolicy;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: runtimePolicyKeys.detail(variables.id) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Clone a runtime policy
 */
export const useCloneRuntimePolicy = (
  options: MutationOptions<RuntimePolicy, { sourceId: string; newName: string }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sourceId, newName }) => {
      // First, fetch the source policy
      const { data: source, error: fetchError } = await supabase
        .from('runtime_policy')
        .select('*')
        .eq('id', sourceId)
        .single();

      if (fetchError) throw fetchError;

      // Create new policy with modified name
      const newPolicy: RuntimePolicyInsert = {
        tenant_id: source.tenant_id,
        name: newName,
        allowed_images: source.allowed_images,
        allowed_registries: source.allowed_registries,
        egress_rules: source.egress_rules,
        ingress_rules: source.ingress_rules,
        pod_security_profile: source.pod_security_profile,
        env_var_allowlist: source.env_var_allowlist,
        secret_mount_policy: source.secret_mount_policy,
      };

      const { data, error } = await supabase
        .from('runtime_policy')
        .insert(newPolicy)
        .select()
        .single();

      if (error) throw error;
      return data as RuntimePolicy;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: runtimePolicyKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

// ============================================================================
// TODO: Additional Features
// ============================================================================
// TODO: Add useValidatePolicy hook for comprehensive policy validation
// TODO: Add useGenerateNetworkPolicy hook for K8s NetworkPolicy generation
// TODO: Add usePolicyViolations hook for violation tracking
// TODO: Add usePolicyCompliance hook for compliance checking
// TODO: Add policy versioning support
// TODO: Add policy inheritance (base policies, overrides)
// TODO: Add policy templates (predefined security profiles)
// TODO: Add policy audit history hooks
// TODO: Add policy simulation/dry-run hooks
// TODO: Add OPA/Rego policy integration hooks
// TODO: Add Kyverno policy integration hooks
