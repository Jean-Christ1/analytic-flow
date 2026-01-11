// ============================================================================
// Git Provider Hooks
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
import { projectKeys } from '../tenancy/useProjects';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Git provider type enum
 */
export type GitProviderType = 'gitlab' | 'github' | 'bitbucket';

/**
 * GitLab mode enum
 */
export type GitLabMode = 'saas' | 'self_managed';

/**
 * GitLab Instance type from database
 */
export interface GitLabInstance {
  id: string;
  tenant_id: string;
  name: string;
  base_url: string;
  mode: GitLabMode;
  api_version: string;
  auth_secret_ref: string | null;
  webhook_secret_ref: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Git Provider type from database
 */
export interface GitProvider {
  id: string;
  tenant_id: string;
  name: string;
  type: GitProviderType;
  base_url: string | null;
  app_installation_ref: Record<string, unknown>;
  auth_secret_ref: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Repository Binding type from database
 */
export interface RepoBinding {
  id: string;
  tenant_id: string;
  project_id: string;
  provider_id: string;
  repo_full_name: string;
  default_branch: string;
  webhook_secret_ref: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Repository binding with relations
 */
export interface RepoBindingWithRelations extends RepoBinding {
  provider?: GitProvider;
  project?: {
    id: string;
    name: string;
    slug: string;
  };
}

// Insert types
export type GitLabInstanceInsert = Omit<GitLabInstance, 'id' | 'created_at' | 'updated_at'> & { id?: string };
export type GitProviderInsert = Omit<GitProvider, 'id' | 'created_at' | 'updated_at'> & { id?: string };
export type RepoBindingInsert = Omit<RepoBinding, 'id' | 'created_at' | 'updated_at'> & { id?: string };

// Update types
export type GitLabInstanceUpdate = Partial<Omit<GitLabInstance, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>;
export type GitProviderUpdate = Partial<Omit<GitProvider, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>;
export type RepoBindingUpdate = Partial<Omit<RepoBinding, 'id' | 'tenant_id' | 'project_id' | 'created_at' | 'updated_at'>>;

// ============================================================================
// QUERY KEYS
// ============================================================================

export const gitlabInstanceKeys = createQueryKeyFactory<string>('gitlab_instances');
export const gitProviderKeys = createQueryKeyFactory<string>('git_providers');
export const repoBindingKeys = createQueryKeyFactory<string>('repo_bindings');

// Extended query keys
export const gitProviderQueryKeys = {
  ...gitProviderKeys,
  byType: (type: GitProviderType) => [...gitProviderKeys.all, 'type', type] as const,
};

export const repoBindingQueryKeys = {
  ...repoBindingKeys,
  byProject: (projectId: string) => [...repoBindingKeys.all, 'project', projectId] as const,
  byProvider: (providerId: string) => [...repoBindingKeys.all, 'provider', providerId] as const,
  byRepo: (repoFullName: string) => [...repoBindingKeys.all, 'repo', repoFullName] as const,
};

// ============================================================================
// GITLAB INSTANCE QUERY HOOKS
// ============================================================================

/**
 * Fetch all GitLab instances
 */
export const useGitLabInstances = (options: ListQueryOptions = {}) => {
  const {
    pagination = { page: DEFAULT_PAGE, pageSize: DEFAULT_PAGE_SIZE },
    sort = { column: 'name', ascending: true },
    filters = [],
    enabled = true,
  } = options;

  const page = pagination.page ?? DEFAULT_PAGE;
  const pageSize = pagination.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = calculateOffset(page, pageSize);

  return useQuery({
    queryKey: gitlabInstanceKeys.list({ pagination, sort, filters }),
    queryFn: async () => {
      let query = supabase
        .from('gitlab_instance')
        .select('*', { count: 'exact' });

      filters.forEach(filter => {
        query = query.filter(filter.column, filter.operator, filter.value);
      });

      const sortParams = Array.isArray(sort) ? sort : [sort];
      sortParams.forEach(s => {
        query = query.order(s.column, { ascending: s.ascending ?? true });
      });

      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;
      return { data: data as GitLabInstance[], count };
    },
    enabled,
  });
};

/**
 * Fetch a single GitLab instance
 */
export const useGitLabInstance = (instanceId: string, options: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: gitlabInstanceKeys.detail(instanceId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gitlab_instance')
        .select('*')
        .eq('id', instanceId)
        .single();

      if (error) throw error;
      return data as GitLabInstance;
    },
    enabled: options.enabled !== false && !!instanceId,
  });
};

// ============================================================================
// GIT PROVIDER QUERY HOOKS
// ============================================================================

/**
 * Fetch all Git providers
 */
export const useGitProviders = (options: ListQueryOptions = {}) => {
  const {
    pagination = { page: DEFAULT_PAGE, pageSize: DEFAULT_PAGE_SIZE },
    sort = { column: 'name', ascending: true },
    filters = [],
    enabled = true,
  } = options;

  const page = pagination.page ?? DEFAULT_PAGE;
  const pageSize = pagination.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = calculateOffset(page, pageSize);

  return useQuery({
    queryKey: gitProviderKeys.list({ pagination, sort, filters }),
    queryFn: async () => {
      let query = supabase
        .from('git_provider')
        .select('*', { count: 'exact' });

      filters.forEach(filter => {
        query = query.filter(filter.column, filter.operator, filter.value);
      });

      const sortParams = Array.isArray(sort) ? sort : [sort];
      sortParams.forEach(s => {
        query = query.order(s.column, { ascending: s.ascending ?? true });
      });

      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;
      return { data: data as GitProvider[], count };
    },
    enabled,
  });
};

/**
 * Fetch a single Git provider
 */
export const useGitProvider = (providerId: string, options: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: gitProviderKeys.detail(providerId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('git_provider')
        .select('*')
        .eq('id', providerId)
        .single();

      if (error) throw error;
      return data as GitProvider;
    },
    enabled: options.enabled !== false && !!providerId,
  });
};

/**
 * Fetch Git providers by type
 */
export const useGitProvidersByType = (type: GitProviderType) => {
  return useQuery({
    queryKey: gitProviderQueryKeys.byType(type),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('git_provider')
        .select('*')
        .eq('type', type)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as GitProvider[];
    },
  });
};

// ============================================================================
// REPO BINDING QUERY HOOKS
// ============================================================================

/**
 * Fetch all repository bindings
 */
export const useRepoBindings = (options: ListQueryOptions = {}) => {
  const {
    pagination = { page: DEFAULT_PAGE, pageSize: DEFAULT_PAGE_SIZE },
    sort = { column: 'created_at', ascending: false },
    filters = [],
    select = '*, provider:git_provider(id, name, type), project(id, name, slug)',
    enabled = true,
  } = options;

  const page = pagination.page ?? DEFAULT_PAGE;
  const pageSize = pagination.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = calculateOffset(page, pageSize);

  return useQuery({
    queryKey: repoBindingKeys.list({ pagination, sort, filters }),
    queryFn: async () => {
      let query = supabase
        .from('repo_binding')
        .select(select, { count: 'exact' });

      filters.forEach(filter => {
        query = query.filter(filter.column, filter.operator, filter.value);
      });

      const sortParams = Array.isArray(sort) ? sort : [sort];
      sortParams.forEach(s => {
        query = query.order(s.column, { ascending: s.ascending ?? true });
      });

      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;
      return { data: data as RepoBindingWithRelations[], count };
    },
    enabled,
  });
};

/**
 * Fetch a single repository binding
 */
export const useRepoBinding = (bindingId: string, options: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: repoBindingKeys.detail(bindingId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('repo_binding')
        .select('*, provider:git_provider(id, name, type), project(id, name, slug)')
        .eq('id', bindingId)
        .single();

      if (error) throw error;
      return data as RepoBindingWithRelations;
    },
    enabled: options.enabled !== false && !!bindingId,
  });
};

/**
 * Fetch repository bindings by project
 */
export const useRepoBindingsByProject = (projectId: string) => {
  return useQuery({
    queryKey: repoBindingQueryKeys.byProject(projectId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('repo_binding')
        .select('*, provider:git_provider(id, name, type)')
        .eq('project_id', projectId)
        .order('repo_full_name', { ascending: true });

      if (error) throw error;
      return data as RepoBindingWithRelations[];
    },
    enabled: !!projectId,
  });
};

/**
 * Fetch repository bindings by provider
 */
export const useRepoBindingsByProvider = (providerId: string) => {
  return useQuery({
    queryKey: repoBindingQueryKeys.byProvider(providerId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('repo_binding')
        .select('*, project(id, name, slug)')
        .eq('provider_id', providerId)
        .order('repo_full_name', { ascending: true });

      if (error) throw error;
      return data as RepoBindingWithRelations[];
    },
    enabled: !!providerId,
  });
};

// ============================================================================
// GITLAB INSTANCE MUTATION HOOKS
// ============================================================================

/**
 * Create a GitLab instance
 */
export const useCreateGitLabInstance = (
  options: MutationOptions<GitLabInstance, GitLabInstanceInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (instance: GitLabInstanceInsert) => {
      const { data, error } = await supabase
        .from('gitlab_instance')
        .insert(instance)
        .select()
        .single();

      if (error) throw error;
      return data as GitLabInstance;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: gitlabInstanceKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update a GitLab instance
 */
export const useUpdateGitLabInstance = (
  options: MutationOptions<GitLabInstance, { id: string; updates: GitLabInstanceUpdate }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('gitlab_instance')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as GitLabInstance;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: gitlabInstanceKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: gitlabInstanceKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Delete a GitLab instance
 */
export const useDeleteGitLabInstance = (
  options: MutationOptions<void, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (instanceId: string) => {
      const { error } = await supabase
        .from('gitlab_instance')
        .delete()
        .eq('id', instanceId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: gitlabInstanceKeys.all });
      options.onSuccess?.(undefined, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

// ============================================================================
// GIT PROVIDER MUTATION HOOKS
// ============================================================================

/**
 * Create a Git provider
 */
export const useCreateGitProvider = (
  options: MutationOptions<GitProvider, GitProviderInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (provider: GitProviderInsert) => {
      const { data, error } = await supabase
        .from('git_provider')
        .insert(provider)
        .select()
        .single();

      if (error) throw error;
      return data as GitProvider;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: gitProviderKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update a Git provider
 */
export const useUpdateGitProvider = (
  options: MutationOptions<GitProvider, { id: string; updates: GitProviderUpdate }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('git_provider')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as GitProvider;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: gitProviderKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: gitProviderKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Delete a Git provider
 */
export const useDeleteGitProvider = (
  options: MutationOptions<void, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (providerId: string) => {
      const { error } = await supabase
        .from('git_provider')
        .delete()
        .eq('id', providerId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: gitProviderKeys.all });
      options.onSuccess?.(undefined, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

// ============================================================================
// REPO BINDING MUTATION HOOKS
// ============================================================================

/**
 * Create a repository binding
 */
export const useCreateRepoBinding = (
  options: MutationOptions<RepoBinding, RepoBindingInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (binding: RepoBindingInsert) => {
      const { data, error } = await supabase
        .from('repo_binding')
        .insert(binding)
        .select()
        .single();

      if (error) throw error;
      return data as RepoBinding;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: repoBindingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: repoBindingQueryKeys.byProject(data.project_id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(data.project_id) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update a repository binding
 */
export const useUpdateRepoBinding = (
  options: MutationOptions<RepoBinding, { id: string; updates: RepoBindingUpdate }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('repo_binding')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as RepoBinding;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: repoBindingKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: repoBindingKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Delete a repository binding
 */
export const useDeleteRepoBinding = (
  options: MutationOptions<void, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bindingId: string) => {
      const { error } = await supabase
        .from('repo_binding')
        .delete()
        .eq('id', bindingId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: repoBindingKeys.all });
      options.onSuccess?.(undefined, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

// ============================================================================
// TODO: Additional Features
// ============================================================================
// TODO: Add useTestGitLabConnection hook for connectivity testing
// TODO: Add useRefreshGitLabToken hook for token refresh
// TODO: Add useListGitLabProjects hook for project listing
// TODO: Add useListGitLabBranches hook for branch listing
// TODO: Add useWebhookEvents hook for webhook event handling
// TODO: Add useGitHubAppInstallation hooks for GitHub Apps
// TODO: Add useSyncRepoMetadata hook for repo metadata sync
// TODO: Add useValidateRepoAccess hook for permission checking
