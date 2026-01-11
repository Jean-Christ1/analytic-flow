// ============================================================================
// Workspace Hooks - React Query Hooks for ML Workspace & Session Management
// MLOps Control Plane v3
// Author: Armand AMOUSSOU
// Date: 2026-01-04
// ============================================================================

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
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

export type WorkspaceType =
  | 'jupyter'
  | 'vscode'
  | 'rstudio'
  | 'terminal'
  | 'custom';

export type WorkspaceStatus =
  | 'pending'
  | 'provisioning'
  | 'running'
  | 'stopping'
  | 'stopped'
  | 'failed'
  | 'terminated';

export type WorkspaceSize = 'small' | 'medium' | 'large' | 'xlarge' | 'custom';

export interface Workspace {
  id: string;
  tenant_id: string;
  project_id: string;
  user_id: string;
  name: string;
  description: string | null;
  workspace_type: WorkspaceType;
  status: WorkspaceStatus;
  size: WorkspaceSize;
  compute_profile_id: string | null;
  cluster_id: string;
  namespace: string;
  image: string;
  image_version: string | null;
  environment_id: string | null;
  git_repo_url: string | null;
  git_branch: string | null;
  auto_shutdown_minutes: number | null;
  idle_timeout_minutes: number | null;
  endpoint_url: string | null;
  internal_url: string | null;
  pod_name: string | null;
  resources_allocated: Record<string, unknown>;
  resources_used: Record<string, unknown>;
  environment_vars: Record<string, string>;
  volumes: WorkspaceVolume[];
  ports: WorkspacePort[];
  metadata: Record<string, unknown>;
  started_at: string | null;
  stopped_at: string | null;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceInsert {
  tenant_id: string;
  project_id: string;
  user_id: string;
  name: string;
  description?: string | null;
  workspace_type: WorkspaceType;
  size?: WorkspaceSize;
  compute_profile_id?: string | null;
  cluster_id: string;
  namespace?: string;
  image: string;
  image_version?: string | null;
  environment_id?: string | null;
  git_repo_url?: string | null;
  git_branch?: string | null;
  auto_shutdown_minutes?: number | null;
  idle_timeout_minutes?: number | null;
  environment_vars?: Record<string, string>;
  volumes?: WorkspaceVolume[];
  ports?: WorkspacePort[];
  metadata?: Record<string, unknown>;
}

export interface WorkspaceUpdate {
  name?: string;
  description?: string | null;
  size?: WorkspaceSize;
  compute_profile_id?: string | null;
  image?: string;
  image_version?: string | null;
  environment_id?: string | null;
  git_repo_url?: string | null;
  git_branch?: string | null;
  auto_shutdown_minutes?: number | null;
  idle_timeout_minutes?: number | null;
  environment_vars?: Record<string, string>;
  volumes?: WorkspaceVolume[];
  ports?: WorkspacePort[];
  metadata?: Record<string, unknown>;
}

export interface WorkspaceVolume {
  name: string;
  mount_path: string;
  storage_class?: string;
  size_gb: number;
  read_only?: boolean;
  pvc_name?: string;
}

export interface WorkspacePort {
  name: string;
  container_port: number;
  protocol?: 'TCP' | 'UDP';
  expose?: boolean;
}

export interface WorkspaceWithRelations extends Workspace {
  project?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  user?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
  compute_profile?: {
    id: string;
    name: string;
    cpu_request: string;
    memory_request: string;
    gpu_count: number;
  } | null;
  environment?: {
    id: string;
    name: string;
  } | null;
}

export interface WorkspaceSession {
  id: string;
  workspace_id: string;
  user_id: string;
  session_type: 'interactive' | 'api' | 'scheduled';
  status: 'active' | 'closed' | 'expired';
  token: string | null;
  started_at: string;
  ended_at: string | null;
  last_heartbeat_at: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
}

export interface WorkspaceTemplate {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  workspace_type: WorkspaceType;
  image: string;
  image_version: string | null;
  default_size: WorkspaceSize;
  default_compute_profile_id: string | null;
  default_environment_vars: Record<string, string>;
  default_volumes: WorkspaceVolume[];
  default_ports: WorkspacePort[];
  is_public: boolean;
  is_default: boolean;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceUsageStats {
  workspace_id: string;
  total_runtime_hours: number;
  total_cost: number;
  cpu_hours: number;
  memory_gb_hours: number;
  gpu_hours: number;
  storage_gb_hours: number;
  session_count: number;
  last_30_days: {
    date: string;
    runtime_hours: number;
    cost: number;
  }[];
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const workspaceKeys = createQueryKeyFactory<string>('workspaces');

export const workspaceQueryKeys = {
  all: ['workspaces'] as const,
  lists: () => [...workspaceQueryKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...workspaceQueryKeys.lists(), params] as const,
  details: () => [...workspaceQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...workspaceQueryKeys.details(), id] as const,
  byProject: (projectId: string) => [...workspaceQueryKeys.all, 'project', projectId] as const,
  byUser: (userId: string) => [...workspaceQueryKeys.all, 'user', userId] as const,
  byStatus: (status: WorkspaceStatus) => [...workspaceQueryKeys.all, 'status', status] as const,
  sessions: (workspaceId: string) => [...workspaceQueryKeys.detail(workspaceId), 'sessions'] as const,
  usage: (workspaceId: string) => [...workspaceQueryKeys.detail(workspaceId), 'usage'] as const,
  templates: () => [...workspaceQueryKeys.all, 'templates'] as const,
  template: (id: string) => [...workspaceQueryKeys.templates(), id] as const,
};

// ============================================================================
// WORKSPACE QUERIES
// ============================================================================

/**
 * Hook to fetch a list of workspaces
 */
export const useWorkspaces = (options: ListQueryOptions = {}) => {
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
    queryKey: workspaceKeys.list({ page, pageSize, sort, filters, search }),
    queryFn: async () => {
      let query = supabase
        .from('ml_workspace')
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
        query = query.order('updated_at', { ascending: false });
      }

      // Apply pagination
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data as Workspace[],
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
 * Hook for infinite scrolling workspace list
 */
export const useInfiniteWorkspaces = (
  options: Omit<ListQueryOptions, 'pagination'> & { pageSize?: number } = {}
) => {
  const { sort, filters, search, select = '*', enabled = true, pageSize = DEFAULT_PAGE_SIZE } = options;

  return useInfiniteQuery({
    queryKey: workspaceKeys.infinite({ sort, filters, search }),
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('ml_workspace')
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
        query = query.order('updated_at', { ascending: false });
      }

      // Apply pagination
      query = query.range(pageParam, pageParam + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data as Workspace[],
        count: count ?? 0,
        nextOffset: (pageParam + pageSize < (count ?? 0)) ? pageParam + pageSize : undefined,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    enabled,
  });
};

/**
 * Hook to fetch a single workspace by ID
 */
export const useWorkspace = (
  id: string | undefined,
  options: { select?: string; enabled?: boolean } = {}
) => {
  const {
    select = `
      *,
      project:project_id(id, name, slug),
      user:user_id(id, full_name, avatar_url),
      compute_profile:compute_profile_id(id, name, cpu_request, memory_request, gpu_count),
      environment:environment_id(id, name)
    `,
    enabled = true,
  } = options;

  return useQuery({
    queryKey: workspaceKeys.detail(id ?? ''),
    queryFn: async () => {
      if (!id) throw new Error('Workspace ID is required');

      const { data, error } = await supabase
        .from('ml_workspace')
        .select(select)
        .eq('id', id)
        .single();

      if (error) throw error;

      return data as WorkspaceWithRelations;
    },
    enabled: enabled && !!id,
  });
};

/**
 * Hook to fetch workspaces by project
 */
export const useWorkspacesByProject = (
  projectId: string | undefined,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'project_id', operator: 'eq' as const, value: projectId },
  ];

  return useWorkspaces({
    ...options,
    filters,
    enabled: (options.enabled ?? true) && !!projectId,
  });
};

/**
 * Hook to fetch workspaces by user
 */
export const useWorkspacesByUser = (
  userId: string | undefined,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'user_id', operator: 'eq' as const, value: userId },
  ];

  return useWorkspaces({
    ...options,
    filters,
    enabled: (options.enabled ?? true) && !!userId,
  });
};

/**
 * Hook to fetch workspaces by status
 */
export const useWorkspacesByStatus = (
  status: WorkspaceStatus,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'status', operator: 'eq' as const, value: status },
  ];

  return useWorkspaces({ ...options, filters });
};

/**
 * Hook to fetch running workspaces
 */
export const useRunningWorkspaces = (options: ListQueryOptions = {}) => {
  return useWorkspacesByStatus('running', options);
};

/**
 * Hook to fetch my workspaces (current user)
 */
export const useMyWorkspaces = (
  userId: string | undefined,
  options: ListQueryOptions = {}
) => {
  return useWorkspacesByUser(userId, options);
};

/**
 * Hook to search workspaces
 */
export const useSearchWorkspaces = (
  searchTerm: string,
  options: ListQueryOptions = {}
) => {
  return useWorkspaces({
    ...options,
    search: { column: 'name', value: searchTerm },
    enabled: (options.enabled ?? true) && searchTerm.length >= 2,
  });
};

/**
 * Hook to fetch workspace sessions
 */
export const useWorkspaceSessions = (
  workspaceId: string | undefined,
  options: { status?: 'active' | 'closed' | 'expired'; enabled?: boolean } = {}
) => {
  const { status, enabled = true } = options;

  return useQuery({
    queryKey: [...workspaceQueryKeys.sessions(workspaceId ?? ''), { status }],
    queryFn: async () => {
      if (!workspaceId) throw new Error('Workspace ID is required');

      let query = supabase
        .from('ml_workspace_session')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('started_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data as WorkspaceSession[];
    },
    enabled: enabled && !!workspaceId,
  });
};

/**
 * Hook to fetch workspace usage statistics
 */
export const useWorkspaceUsage = (
  workspaceId: string | undefined,
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: workspaceQueryKeys.usage(workspaceId ?? ''),
    queryFn: async () => {
      if (!workspaceId) throw new Error('Workspace ID is required');

      // TODO: This should be an RPC function for accurate calculations
      // Placeholder implementation
      const { data: sessions, error } = await supabase
        .from('ml_workspace_session')
        .select('*')
        .eq('workspace_id', workspaceId);

      if (error) throw error;

      // Calculate basic stats
      let totalRuntimeHours = 0;
      let sessionCount = sessions?.length ?? 0;

      for (const session of sessions ?? []) {
        if (session.started_at && session.ended_at) {
          const start = new Date(session.started_at);
          const end = new Date(session.ended_at);
          totalRuntimeHours += (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        }
      }

      return {
        workspace_id: workspaceId,
        total_runtime_hours: Math.round(totalRuntimeHours * 100) / 100,
        total_cost: 0, // TODO: Calculate based on pricing
        cpu_hours: 0,
        memory_gb_hours: 0,
        gpu_hours: 0,
        storage_gb_hours: 0,
        session_count: sessionCount,
        last_30_days: [],
      } as WorkspaceUsageStats;
    },
    enabled: enabled && !!workspaceId,
  });
};

// ============================================================================
// TEMPLATE QUERIES
// ============================================================================

/**
 * Hook to fetch workspace templates
 */
export const useWorkspaceTemplates = (
  tenantId: string | undefined,
  options: { includePublic?: boolean; enabled?: boolean } = {}
) => {
  const { includePublic = true, enabled = true } = options;

  return useQuery({
    queryKey: [...workspaceQueryKeys.templates(), { tenantId, includePublic }],
    queryFn: async () => {
      if (!tenantId) throw new Error('Tenant ID is required');

      let query = supabase
        .from('ml_workspace_template')
        .select('*')
        .order('name', { ascending: true });

      if (includePublic) {
        query = query.or(`tenant_id.eq.${tenantId},is_public.eq.true`);
      } else {
        query = query.eq('tenant_id', tenantId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data as WorkspaceTemplate[];
    },
    enabled: enabled && !!tenantId,
  });
};

/**
 * Hook to fetch a single workspace template
 */
export const useWorkspaceTemplate = (
  id: string | undefined,
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: workspaceQueryKeys.template(id ?? ''),
    queryFn: async () => {
      if (!id) throw new Error('Template ID is required');

      const { data, error } = await supabase
        .from('ml_workspace_template')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return data as WorkspaceTemplate;
    },
    enabled: enabled && !!id,
  });
};

/**
 * Hook to fetch default templates by workspace type
 */
export const useDefaultTemplates = (
  tenantId: string | undefined,
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: [...workspaceQueryKeys.templates(), 'defaults', tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error('Tenant ID is required');

      const { data, error } = await supabase
        .from('ml_workspace_template')
        .select('*')
        .or(`tenant_id.eq.${tenantId},is_public.eq.true`)
        .eq('is_default', true)
        .order('workspace_type', { ascending: true });

      if (error) throw error;

      // Group by type
      const byType: Record<WorkspaceType, WorkspaceTemplate> = {} as Record<WorkspaceType, WorkspaceTemplate>;
      for (const template of data ?? []) {
        if (!byType[template.workspace_type as WorkspaceType]) {
          byType[template.workspace_type as WorkspaceType] = template;
        }
      }

      return byType;
    },
    enabled: enabled && !!tenantId,
  });
};

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Hook to create a new workspace
 */
export const useCreateWorkspace = (
  options: MutationOptions<Workspace, WorkspaceInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: WorkspaceInsert) => {
      const { data, error } = await supabase
        .from('ml_workspace')
        .insert({
          ...input,
          status: 'pending',
          namespace: input.namespace ?? 'default',
        })
        .select()
        .single();

      if (error) throw error;

      // TODO: Trigger workspace provisioning via edge function

      return data as Workspace;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.byProject(variables.project_id) });
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.byUser(variables.user_id) });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to create workspace:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to create workspace from template
 */
export const useCreateWorkspaceFromTemplate = (
  options: MutationOptions<Workspace, { templateId: string; overrides: Partial<WorkspaceInsert> }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ templateId, overrides }: { templateId: string; overrides: Partial<WorkspaceInsert> }) => {
      // Fetch template
      const { data: template, error: templateError } = await supabase
        .from('ml_workspace_template')
        .select('*')
        .eq('id', templateId)
        .single();

      if (templateError) throw templateError;

      // Create workspace from template
      const workspaceData: WorkspaceInsert = {
        tenant_id: overrides.tenant_id!,
        project_id: overrides.project_id!,
        user_id: overrides.user_id!,
        name: overrides.name ?? `${template.name}-${Date.now()}`,
        description: overrides.description ?? template.description,
        workspace_type: template.workspace_type as WorkspaceType,
        size: overrides.size ?? template.default_size as WorkspaceSize,
        compute_profile_id: overrides.compute_profile_id ?? template.default_compute_profile_id,
        cluster_id: overrides.cluster_id!,
        namespace: overrides.namespace,
        image: overrides.image ?? template.image,
        image_version: overrides.image_version ?? template.image_version,
        environment_vars: {
          ...template.default_environment_vars,
          ...overrides.environment_vars,
        },
        volumes: overrides.volumes ?? template.default_volumes,
        ports: overrides.ports ?? template.default_ports,
        metadata: {
          ...template.metadata,
          ...overrides.metadata,
          created_from_template: templateId,
        },
      };

      const { data, error } = await supabase
        .from('ml_workspace')
        .insert({
          ...workspaceData,
          status: 'pending',
          namespace: workspaceData.namespace ?? 'default',
        })
        .select()
        .single();

      if (error) throw error;

      return data as Workspace;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
      options.onSuccess?.(data, { templateId: '', overrides: {} });
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to create workspace from template:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to update a workspace
 */
export const useUpdateWorkspace = (
  options: MutationOptions<Workspace, { id: string; data: WorkspaceUpdate }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: WorkspaceUpdate }) => {
      const { data: result, error } = await supabase
        .from('ml_workspace')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return result as Workspace;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to update workspace:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to start a workspace
 */
export const useStartWorkspace = (
  options: MutationOptions<Workspace, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // TODO: Call edge function to provision workspace in K8s
      const { data, error } = await supabase
        .from('ml_workspace')
        .update({
          status: 'provisioning' as WorkspaceStatus,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as Workspace;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.detail(variables) });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to start workspace:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to stop a workspace
 */
export const useStopWorkspace = (
  options: MutationOptions<Workspace, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // TODO: Call edge function to stop workspace in K8s
      const { data, error } = await supabase
        .from('ml_workspace')
        .update({
          status: 'stopping' as WorkspaceStatus,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as Workspace;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.detail(variables) });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to stop workspace:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to restart a workspace
 */
export const useRestartWorkspace = (
  options: MutationOptions<Workspace, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // TODO: Call edge function to restart workspace in K8s
      const { data, error } = await supabase
        .from('ml_workspace')
        .update({
          status: 'provisioning' as WorkspaceStatus,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as Workspace;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.detail(variables) });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to restart workspace:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to terminate/delete a workspace
 */
export const useTerminateWorkspace = (
  options: MutationOptions<void, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // TODO: Call edge function to delete workspace resources in K8s
      const { error } = await supabase
        .from('ml_workspace')
        .update({
          status: 'terminated' as WorkspaceStatus,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
      options.onSuccess?.(undefined, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to terminate workspace:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: (data, error, variables) => {
      options.onSettled?.(data, error, variables);
    },
  });
};

/**
 * Hook to delete a workspace permanently
 */
export const useDeleteWorkspace = (
  options: MutationOptions<void, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // First terminate if running
      const { data: workspace } = await supabase
        .from('ml_workspace')
        .select('status')
        .eq('id', id)
        .single();

      if (workspace?.status === 'running') {
        throw new Error('Cannot delete a running workspace. Stop it first.');
      }

      const { error } = await supabase
        .from('ml_workspace')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
      options.onSuccess?.(undefined, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to delete workspace:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: (data, error, variables) => {
      options.onSettled?.(data, error, variables);
    },
  });
};

/**
 * Hook to update workspace activity (heartbeat)
 */
export const useUpdateWorkspaceActivity = (
  options: MutationOptions<void, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ml_workspace')
        .update({
          last_activity_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.detail(variables) });
      options.onSuccess?.(undefined, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to update workspace activity:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: (data, error, variables) => {
      options.onSettled?.(data, error, variables);
    },
  });
};

// ============================================================================
// TEMPLATE MUTATIONS
// ============================================================================

/**
 * Hook to create a workspace template
 */
export const useCreateWorkspaceTemplate = (
  options: MutationOptions<WorkspaceTemplate, Omit<WorkspaceTemplate, 'id' | 'created_at' | 'updated_at'>> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<WorkspaceTemplate, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('ml_workspace_template')
        .insert(input)
        .select()
        .single();

      if (error) throw error;

      return data as WorkspaceTemplate;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.templates() });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to create workspace template:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to delete a workspace template
 */
export const useDeleteWorkspaceTemplate = (
  options: MutationOptions<void, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ml_workspace_template')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.templates() });
      options.onSuccess?.(undefined, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to delete workspace template:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: (data, error, variables) => {
      options.onSettled?.(data, error, variables);
    },
  });
};

// ============================================================================
// TODO: Additional Features
// ============================================================================
// TODO: Add useWorkspaceLogs hook for streaming logs
// TODO: Add useWorkspaceTerminal hook for terminal access
// TODO: Add useWorkspaceSnapshot hook for saving workspace state
// TODO: Add useWorkspaceShare hook for sharing workspaces
// TODO: Add useWorkspaceClone hook for cloning workspaces
// TODO: Add useWorkspaceScale hook for scaling resources
// TODO: Add real-time subscription for workspace status changes
// TODO: Add useWorkspaceMetrics hook for resource metrics
// TODO: Add useWorkspaceGitSync hook for git synchronization
// TODO: Add useWorkspaceExtensions hook for managing extensions
