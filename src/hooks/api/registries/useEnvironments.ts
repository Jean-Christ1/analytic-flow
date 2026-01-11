// ============================================================================
// Environment Hooks
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
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE,
  calculateOffset,
} from '../utils/query-utils';
import { projectKeys } from '../tenancy/useProjects';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Environment status enum
 */
export type EnvironmentStatus = 'active' | 'deprecated' | 'archived';

/**
 * Build strategy enum
 */
export type BuildStrategy = 'dockerfile' | 'buildkit' | 'kaniko';

/**
 * Environment build status enum
 */
export type EnvironmentBuildStatus = 'queued' | 'running' | 'succeeded' | 'failed';

/**
 * Environment specification
 */
export interface EnvironmentSpec {
  pythonVersion?: string;
  condaYaml?: string;
  requirements?: string;
  poetryLock?: string;
  pipfile?: string;
  dockerfile?: string;
  aptPackages?: string[];
  systemPackages?: string[];
  environmentVariables?: Record<string, string>;
  // TODO: Add more environment spec fields
}

/**
 * Environment type from database
 */
export interface Environment {
  id: string;
  tenant_id: string;
  project_id: string | null;
  name: string;
  description: string | null;
  base_image: string | null;
  spec: EnvironmentSpec;
  build_strategy: BuildStrategy;
  registry_id: string | null;
  runtime_policy_id: string | null;
  status: EnvironmentStatus;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

/**
 * Environment Build type from database
 */
export interface EnvironmentBuild {
  id: string;
  tenant_id: string;
  environment_id: string;
  version: number;
  git_commit_sha: string | null;
  build_log_uri: string | null;
  image_name: string | null;
  image_tag: string | null;
  image_digest: string | null;
  sbom_uri: string | null;
  vuln_report_uri: string | null;
  status: EnvironmentBuildStatus;
  failure_reason: string | null;
  started_at: string | null;
  finished_at: string | null;
  duration_seconds: number | null;
  created_at: string;
  created_by: string | null;
}

/**
 * Environment insert type
 */
export type EnvironmentInsert = Omit<Environment, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

/**
 * Environment update type
 */
export type EnvironmentUpdate = Partial<
  Omit<Environment, 'id' | 'tenant_id' | 'created_at' | 'updated_at' | 'created_by'>
>;

/**
 * Environment build insert type
 */
export type EnvironmentBuildInsert = Omit<
  EnvironmentBuild,
  'id' | 'created_at' | 'version' | 'duration_seconds'
> & {
  id?: string;
  version?: number;
};

/**
 * Environment with relations
 */
export interface EnvironmentWithRelations extends Environment {
  project?: {
    id: string;
    name: string;
    slug: string;
  };
  registry?: {
    id: string;
    name: string;
    type: string;
  };
  runtime_policy?: {
    id: string;
    name: string;
    pod_security_profile: string;
  };
  latest_build?: EnvironmentBuild;
}

/**
 * Environment build with environment info
 */
export interface EnvironmentBuildWithEnv extends EnvironmentBuild {
  environment?: {
    id: string;
    name: string;
    project_id: string | null;
  };
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const environmentKeys = createQueryKeyFactory<string>('environments');
export const environmentBuildKeys = createQueryKeyFactory<string>('environment_builds');

// Extended query keys
export const environmentQueryKeys = {
  ...environmentKeys,
  byProject: (projectId: string) => [...environmentKeys.all, 'project', projectId] as const,
  byStatus: (status: EnvironmentStatus) => [...environmentKeys.all, 'status', status] as const,
  tenantWide: () => [...environmentKeys.all, 'tenant_wide'] as const,
  default: () => [...environmentKeys.all, 'default'] as const,
};

export const buildQueryKeys = {
  ...environmentBuildKeys,
  byEnvironment: (envId: string) => [...environmentBuildKeys.all, 'environment', envId] as const,
  byStatus: (status: EnvironmentBuildStatus) => [...environmentBuildKeys.all, 'status', status] as const,
  latest: (envId: string) => [...environmentBuildKeys.all, 'latest', envId] as const,
  running: () => [...environmentBuildKeys.all, 'running'] as const,
};

// ============================================================================
// ENVIRONMENT QUERY HOOKS
// ============================================================================

/**
 * Fetch all environments with pagination
 */
export const useEnvironments = (options: ListQueryOptions = {}) => {
  const {
    pagination = { page: DEFAULT_PAGE, pageSize: DEFAULT_PAGE_SIZE },
    sort = { column: 'name', ascending: true },
    filters = [],
    search,
    select = '*, project:project_id(id, name, slug)',
    enabled = true,
  } = options;

  const page = pagination.page ?? DEFAULT_PAGE;
  const pageSize = pagination.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = calculateOffset(page, pageSize);

  return useQuery({
    queryKey: environmentKeys.list({ pagination, sort, filters, search }),
    queryFn: async () => {
      let query = supabase
        .from('environment')
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
      return { data: data as EnvironmentWithRelations[], count };
    },
    enabled,
  });
};

/**
 * Infinite query for environments
 */
export const useInfiniteEnvironments = (options: Omit<ListQueryOptions, 'pagination'> = {}) => {
  const {
    sort = { column: 'name', ascending: true },
    filters = [],
    search,
    select = '*, project:project_id(id, name, slug)',
    enabled = true,
  } = options;

  const pageSize = DEFAULT_PAGE_SIZE;

  return useInfiniteQuery({
    queryKey: environmentKeys.infinite({ sort, filters, search }),
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('environment')
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

      query = query.range(pageParam, pageParam + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;
      return { data: data as EnvironmentWithRelations[], count, nextCursor: pageParam + pageSize };
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
 * Fetch a single environment by ID
 */
export const useEnvironment = (envId: string, options: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: environmentKeys.detail(envId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('environment')
        .select(`
          *,
          project:project_id(id, name, slug),
          registry:registry_id(id, name, type),
          runtime_policy:runtime_policy_id(id, name, pod_security_profile)
        `)
        .eq('id', envId)
        .single();

      if (error) throw error;
      return data as EnvironmentWithRelations;
    },
    enabled: options.enabled !== false && !!envId,
  });
};

/**
 * Fetch environment by name
 */
export const useEnvironmentByName = (
  name: string,
  projectId?: string | null,
  options: { enabled?: boolean } = {}
) => {
  return useQuery({
    queryKey: [...environmentKeys.all, 'name', name, projectId] as const,
    queryFn: async () => {
      let query = supabase
        .from('environment')
        .select('*')
        .eq('name', name);

      if (projectId) {
        query = query.eq('project_id', projectId);
      } else {
        query = query.is('project_id', null);
      }

      const { data, error } = await query.single();

      if (error) throw error;
      return data as Environment;
    },
    enabled: options.enabled !== false && !!name,
  });
};

/**
 * Fetch environments by project
 */
export const useEnvironmentsByProject = (projectId: string) => {
  return useQuery({
    queryKey: environmentQueryKeys.byProject(projectId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('environment')
        .select('*')
        .eq('project_id', projectId)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Environment[];
    },
    enabled: !!projectId,
  });
};

/**
 * Fetch tenant-wide environments (no project)
 */
export const useTenantWideEnvironments = () => {
  return useQuery({
    queryKey: environmentQueryKeys.tenantWide(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('environment')
        .select('*')
        .is('project_id', null)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Environment[];
    },
  });
};

/**
 * Fetch environments by status
 */
export const useEnvironmentsByStatus = (status: EnvironmentStatus) => {
  return useQuery({
    queryKey: environmentQueryKeys.byStatus(status),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('environment')
        .select('*')
        .eq('status', status)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Environment[];
    },
  });
};

/**
 * Fetch default environment
 */
export const useDefaultEnvironment = (projectId?: string) => {
  return useQuery({
    queryKey: [...environmentQueryKeys.default(), projectId] as const,
    queryFn: async () => {
      let query = supabase
        .from('environment')
        .select('*')
        .eq('is_default', true)
        .eq('status', 'active');

      if (projectId) {
        // Try project-specific first
        const { data: projectEnv } = await query
          .eq('project_id', projectId)
          .maybeSingle();

        if (projectEnv) return projectEnv as Environment;
      }

      // Fall back to tenant-wide default
      const { data, error } = await supabase
        .from('environment')
        .select('*')
        .eq('is_default', true)
        .eq('status', 'active')
        .is('project_id', null)
        .maybeSingle();

      if (error) throw error;
      return data as Environment | null;
    },
  });
};

/**
 * Search environments by name
 */
export const useSearchEnvironments = (searchTerm: string) => {
  return useQuery({
    queryKey: [...environmentKeys.all, 'search', searchTerm] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('environment')
        .select('*, project:project_id(id, name, slug)')
        .ilike('name', `%${searchTerm}%`)
        .eq('status', 'active')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as EnvironmentWithRelations[];
    },
    enabled: searchTerm.length >= 2,
  });
};

// ============================================================================
// ENVIRONMENT BUILD QUERY HOOKS
// ============================================================================

/**
 * Fetch environment builds for an environment
 */
export const useEnvironmentBuilds = (
  environmentId: string,
  options: ListQueryOptions = {}
) => {
  const {
    pagination = { page: DEFAULT_PAGE, pageSize: DEFAULT_PAGE_SIZE },
    sort = { column: 'version', ascending: false },
    enabled = true,
  } = options;

  const page = pagination.page ?? DEFAULT_PAGE;
  const pageSize = pagination.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = calculateOffset(page, pageSize);

  return useQuery({
    queryKey: buildQueryKeys.byEnvironment(environmentId),
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from('environment_build')
        .select('*', { count: 'exact' })
        .eq('environment_id', environmentId)
        .order(sort.column, { ascending: sort.ascending ?? false })
        .range(offset, offset + pageSize - 1);

      if (error) throw error;
      return { data: data as EnvironmentBuild[], count };
    },
    enabled: enabled && !!environmentId,
  });
};

/**
 * Fetch a single environment build by ID
 */
export const useEnvironmentBuild = (buildId: string, options: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: environmentBuildKeys.detail(buildId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('environment_build')
        .select('*, environment:environment_id(id, name, project_id)')
        .eq('id', buildId)
        .single();

      if (error) throw error;
      return data as EnvironmentBuildWithEnv;
    },
    enabled: options.enabled !== false && !!buildId,
  });
};

/**
 * Fetch latest successful build for an environment
 */
export const useLatestBuild = (environmentId: string) => {
  return useQuery({
    queryKey: buildQueryKeys.latest(environmentId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('environment_build')
        .select('*')
        .eq('environment_id', environmentId)
        .eq('status', 'succeeded')
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as EnvironmentBuild | null;
    },
    enabled: !!environmentId,
  });
};

/**
 * Fetch all running builds
 */
export const useRunningBuilds = () => {
  return useQuery({
    queryKey: buildQueryKeys.running(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('environment_build')
        .select('*, environment:environment_id(id, name, project_id)')
        .in('status', ['queued', 'running'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as EnvironmentBuildWithEnv[];
    },
    refetchInterval: 5000, // Poll every 5 seconds for running builds
  });
};

/**
 * Fetch builds by status
 */
export const useBuildsByStatus = (status: EnvironmentBuildStatus) => {
  return useQuery({
    queryKey: buildQueryKeys.byStatus(status),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('environment_build')
        .select('*, environment:environment_id(id, name, project_id)')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as EnvironmentBuildWithEnv[];
    },
  });
};

// ============================================================================
// ENVIRONMENT MUTATION HOOKS
// ============================================================================

/**
 * Create a new environment
 */
export const useCreateEnvironment = (
  options: MutationOptions<Environment, EnvironmentInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (env: EnvironmentInsert) => {
      const { data, error } = await supabase
        .from('environment')
        .insert(env)
        .select()
        .single();

      if (error) throw error;
      return data as Environment;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: environmentKeys.lists() });
      if (data.project_id) {
        queryClient.invalidateQueries({ queryKey: environmentQueryKeys.byProject(data.project_id) });
        queryClient.invalidateQueries({ queryKey: projectKeys.detail(data.project_id) });
      } else {
        queryClient.invalidateQueries({ queryKey: environmentQueryKeys.tenantWide() });
      }
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update an environment
 */
export const useUpdateEnvironment = (
  options: MutationOptions<Environment, { id: string; updates: EnvironmentUpdate }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: EnvironmentUpdate }) => {
      const { data, error } = await supabase
        .from('environment')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Environment;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: environmentKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: environmentKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Delete an environment
 */
export const useDeleteEnvironment = (
  options: MutationOptions<void, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (envId: string) => {
      const { error } = await supabase
        .from('environment')
        .delete()
        .eq('id', envId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: environmentKeys.all });
      options.onSuccess?.(undefined, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update environment status
 */
export const useUpdateEnvironmentStatus = (
  options: MutationOptions<Environment, { id: string; status: EnvironmentStatus }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }) => {
      const { data, error } = await supabase
        .from('environment')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Environment;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: environmentKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: environmentQueryKeys.byStatus(variables.status) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Set default environment
 */
export const useSetDefaultEnvironment = (
  options: MutationOptions<Environment, { id: string; projectId?: string | null }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId }) => {
      // Unset existing default for this scope
      if (projectId) {
        await supabase
          .from('environment')
          .update({ is_default: false })
          .eq('project_id', projectId)
          .eq('is_default', true);
      } else {
        await supabase
          .from('environment')
          .update({ is_default: false })
          .is('project_id', null)
          .eq('is_default', true);
      }

      // Set new default
      const { data, error } = await supabase
        .from('environment')
        .update({ is_default: true })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Environment;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: environmentKeys.all });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update environment spec
 */
export const useUpdateEnvironmentSpec = (
  options: MutationOptions<Environment, { id: string; spec: EnvironmentSpec }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, spec }) => {
      const { data, error } = await supabase
        .from('environment')
        .update({ spec })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Environment;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: environmentKeys.detail(variables.id) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

// ============================================================================
// ENVIRONMENT BUILD MUTATION HOOKS
// ============================================================================

/**
 * Trigger a new environment build
 */
export const useTriggerBuild = (
  options: MutationOptions<EnvironmentBuild, EnvironmentBuildInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (build: EnvironmentBuildInsert) => {
      const { data, error } = await supabase
        .from('environment_build')
        .insert(build)
        .select()
        .single();

      if (error) throw error;
      return data as EnvironmentBuild;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: buildQueryKeys.byEnvironment(data.environment_id) });
      queryClient.invalidateQueries({ queryKey: buildQueryKeys.running() });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update build status
 */
export const useUpdateBuildStatus = (
  options: MutationOptions<EnvironmentBuild, {
    id: string;
    status: EnvironmentBuildStatus;
    failureReason?: string;
  }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, failureReason }) => {
      const updates: Partial<EnvironmentBuild> = { status };

      if (status === 'running' && !updates.started_at) {
        updates.started_at = new Date().toISOString();
      }
      if (status === 'succeeded' || status === 'failed') {
        updates.finished_at = new Date().toISOString();
      }
      if (failureReason) {
        updates.failure_reason = failureReason;
      }

      const { data, error } = await supabase
        .from('environment_build')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as EnvironmentBuild;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: environmentBuildKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: buildQueryKeys.byEnvironment(data.environment_id) });
      queryClient.invalidateQueries({ queryKey: buildQueryKeys.running() });
      queryClient.invalidateQueries({ queryKey: buildQueryKeys.latest(data.environment_id) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update build image info
 */
export const useUpdateBuildImage = (
  options: MutationOptions<EnvironmentBuild, {
    id: string;
    imageName: string;
    imageTag: string;
    imageDigest?: string;
  }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, imageName, imageTag, imageDigest }) => {
      const { data, error } = await supabase
        .from('environment_build')
        .update({
          image_name: imageName,
          image_tag: imageTag,
          image_digest: imageDigest,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as EnvironmentBuild;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: environmentBuildKeys.detail(variables.id) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

// ============================================================================
// TODO: Additional Features
// ============================================================================
// TODO: Add useCancelBuild mutation for cancelling running builds
// TODO: Add useRetryBuild mutation for retrying failed builds
// TODO: Add useBuildLogs hook for streaming build logs
// TODO: Add useValidateSpec hook for environment spec validation
// TODO: Add useGenerateDockerfile hook for Dockerfile generation
// TODO: Add useCompareBuildImages hook for image diff
// TODO: Add useBuildMetrics hook for build statistics
// TODO: Add environment cloning hook
// TODO: Add environment versioning hooks
// TODO: Add environment dependency resolution hooks
// TODO: Add vulnerability scanning result hooks
// TODO: Add SBOM parsing hooks
