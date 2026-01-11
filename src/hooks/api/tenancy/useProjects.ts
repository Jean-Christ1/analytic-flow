// ============================================================================
// Project Hooks - React Query Hooks for Project Management
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

// TODO: Import from database types when generated
export type ProjectVisibility = 'private' | 'internal' | 'public';
export type ProjectLifecycle = 'planning' | 'development' | 'staging' | 'production' | 'deprecated' | 'archived';
export type Criticality = 'low' | 'medium' | 'high' | 'critical';
export type ProgressStatus = 'on_track' | 'at_risk' | 'delayed' | 'blocked';

export interface Project {
  id: string;
  tenant_id: string;
  org_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  visibility: ProjectVisibility;
  lifecycle: ProjectLifecycle;
  criticality: Criticality;
  progress_status: ProgressStatus;
  progress_percent: number;
  owner_id: string | null;
  default_branch: string;
  tags: string[];
  metadata: Record<string, unknown>;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface ProjectInsert {
  tenant_id: string;
  org_id?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  visibility?: ProjectVisibility;
  lifecycle?: ProjectLifecycle;
  criticality?: Criticality;
  progress_status?: ProgressStatus;
  progress_percent?: number;
  owner_id?: string | null;
  default_branch?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  settings?: Record<string, unknown>;
}

export interface ProjectUpdate {
  name?: string;
  slug?: string;
  description?: string | null;
  visibility?: ProjectVisibility;
  lifecycle?: ProjectLifecycle;
  criticality?: Criticality;
  progress_status?: ProgressStatus;
  progress_percent?: number;
  owner_id?: string | null;
  default_branch?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  archived_at?: string | null;
}

export interface ProjectWithRelations extends Project {
  owner?: {
    id: string;
    email: string;
    display_name: string | null;
  } | null;
  org?: {
    id: string;
    name: string;
  } | null;
  _count?: {
    experiments: number;
    models: number;
    deployments: number;
  };
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const projectKeys = createQueryKeyFactory<string>('projects');

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Hook to fetch a list of projects
 * @param options - Query options including pagination, sorting, and filtering
 */
export const useProjects = (options: ListQueryOptions = {}) => {
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
    queryKey: projectKeys.list({ page, pageSize, sort, filters, search }),
    queryFn: async () => {
      let query = supabase
        .from('project')
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
        data: data as Project[],
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
 * Hook for infinite scrolling project list
 */
export const useInfiniteProjects = (
  options: Omit<ListQueryOptions, 'pagination'> & { pageSize?: number } = {}
) => {
  const { sort, filters, search, select = '*', enabled = true, pageSize = DEFAULT_PAGE_SIZE } = options;

  return useInfiniteQuery({
    queryKey: projectKeys.infinite({ sort, filters, search }),
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('project')
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
        data: data as Project[],
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
 * Hook to fetch a single project by ID
 * @param id - Project ID
 * @param options - Query options
 */
export const useProject = (
  id: string | undefined,
  options: { select?: string; enabled?: boolean } = {}
) => {
  const {
    select = `
      *,
      owner:user_account!owner_id(id, email, display_name),
      org:org!org_id(id, name)
    `,
    enabled = true,
  } = options;

  return useQuery({
    queryKey: projectKeys.detail(id ?? ''),
    queryFn: async () => {
      if (!id) throw new Error('Project ID is required');

      const { data, error } = await supabase
        .from('project')
        .select(select)
        .eq('id', id)
        .single();

      if (error) throw error;

      return data as ProjectWithRelations;
    },
    enabled: enabled && !!id,
  });
};

/**
 * Hook to fetch a project by slug
 * @param slug - Project slug
 * @param options - Query options
 */
export const useProjectBySlug = (
  slug: string | undefined,
  options: { select?: string; enabled?: boolean } = {}
) => {
  const { select = '*', enabled = true } = options;

  return useQuery({
    queryKey: ['projects', 'slug', slug],
    queryFn: async () => {
      if (!slug) throw new Error('Project slug is required');

      const { data, error } = await supabase
        .from('project')
        .select(select)
        .eq('slug', slug)
        .single();

      if (error) throw error;

      return data as Project;
    },
    enabled: enabled && !!slug,
  });
};

/**
 * Hook to fetch projects by organization ID
 */
export const useProjectsByOrg = (
  orgId: string | undefined,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'org_id', operator: 'eq' as const, value: orgId },
  ];

  return useProjects({
    ...options,
    filters,
    enabled: (options.enabled ?? true) && !!orgId,
  });
};

/**
 * Hook to fetch projects by owner
 */
export const useProjectsByOwner = (
  ownerId: string | undefined,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'owner_id', operator: 'eq' as const, value: ownerId },
  ];

  return useProjects({
    ...options,
    filters,
    enabled: (options.enabled ?? true) && !!ownerId,
  });
};

/**
 * Hook to fetch projects by lifecycle stage
 */
export const useProjectsByLifecycle = (
  lifecycle: ProjectLifecycle,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'lifecycle', operator: 'eq' as const, value: lifecycle },
  ];

  return useProjects({ ...options, filters });
};

/**
 * Hook to search projects
 */
export const useSearchProjects = (
  searchTerm: string,
  options: ListQueryOptions = {}
) => {
  return useProjects({
    ...options,
    search: { column: 'name', value: searchTerm },
    enabled: (options.enabled ?? true) && searchTerm.length >= 2,
  });
};

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Hook to create a new project
 */
export const useCreateProject = (
  options: MutationOptions<Project, ProjectInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ProjectInsert) => {
      const { data, error } = await supabase
        .from('project')
        .insert(input)
        .select()
        .single();

      if (error) throw error;

      return data as Project;
    },
    onSuccess: (data, variables) => {
      // Invalidate project list queries
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to create project:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to update an existing project
 */
export const useUpdateProject = (
  options: MutationOptions<Project, { id: string; data: ProjectUpdate }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProjectUpdate }) => {
      const { data: result, error } = await supabase
        .from('project')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return result as Project;
    },
    onSuccess: (data, variables) => {
      // Invalidate specific project and lists
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to update project:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to delete a project
 */
export const useDeleteProject = (
  options: MutationOptions<void, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('project')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      // Invalidate all project queries
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      options.onSuccess?.(undefined, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to delete project:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: (data, error, variables) => {
      options.onSettled?.(data, error, variables);
    },
  });
};

/**
 * Hook to archive a project
 */
export const useArchiveProject = (
  options: MutationOptions<Project, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('project')
        .update({
          lifecycle: 'archived' as ProjectLifecycle,
          archived_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as Project;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to archive project:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to restore an archived project
 */
export const useRestoreProject = (
  options: MutationOptions<Project, { id: string; lifecycle?: ProjectLifecycle }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, lifecycle = 'development' }: { id: string; lifecycle?: ProjectLifecycle }) => {
      const { data, error } = await supabase
        .from('project')
        .update({
          lifecycle,
          archived_at: null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as Project;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to restore project:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to update project progress
 */
export const useUpdateProjectProgress = (
  options: MutationOptions<Project, { id: string; progress_percent: number; progress_status?: ProgressStatus }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      progress_percent,
      progress_status,
    }: {
      id: string;
      progress_percent: number;
      progress_status?: ProgressStatus;
    }) => {
      const updates: Partial<Project> = { progress_percent };
      if (progress_status) {
        updates.progress_status = progress_status;
      }

      const { data, error } = await supabase
        .from('project')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as Project;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to update project progress:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to update project tags
 */
export const useUpdateProjectTags = (
  options: MutationOptions<Project, { id: string; tags: string[] }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, tags }: { id: string; tags: string[] }) => {
      const { data, error } = await supabase
        .from('project')
        .update({ tags })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as Project;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.id) });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to update project tags:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to transfer project ownership
 */
export const useTransferProjectOwnership = (
  options: MutationOptions<Project, { id: string; newOwnerId: string }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, newOwnerId }: { id: string; newOwnerId: string }) => {
      const { data, error } = await supabase
        .from('project')
        .update({ owner_id: newOwnerId })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as Project;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to transfer project ownership:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};
