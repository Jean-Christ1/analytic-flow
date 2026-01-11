// ============================================================================
// Artifact Hooks - React Query Hooks for ML Artifact Management
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

export type ArtifactType =
  | 'model'
  | 'dataset'
  | 'checkpoint'
  | 'metrics'
  | 'logs'
  | 'config'
  | 'code'
  | 'image'
  | 'plot'
  | 'table'
  | 'text'
  | 'other';

export type ArtifactStorageType = 's3' | 'gcs' | 'azure' | 'local' | 'supabase';

export interface Artifact {
  id: string;
  tenant_id: string;
  run_id: string | null;
  experiment_id: string | null;
  model_version_id: string | null;
  name: string;
  path: string;
  artifact_type: ArtifactType;
  storage_type: ArtifactStorageType;
  storage_uri: string;
  size_bytes: number | null;
  mime_type: string | null;
  checksum: string | null;
  checksum_algorithm: string | null;
  description: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  is_directory: boolean;
  parent_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ArtifactInsert {
  tenant_id: string;
  run_id?: string | null;
  experiment_id?: string | null;
  model_version_id?: string | null;
  name: string;
  path: string;
  artifact_type: ArtifactType;
  storage_type: ArtifactStorageType;
  storage_uri: string;
  size_bytes?: number | null;
  mime_type?: string | null;
  checksum?: string | null;
  checksum_algorithm?: string | null;
  description?: string | null;
  tags?: string[];
  metadata?: Record<string, unknown>;
  is_directory?: boolean;
  parent_id?: string | null;
  created_by: string;
}

export interface ArtifactUpdate {
  name?: string;
  description?: string | null;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface ArtifactWithRelations extends Artifact {
  run?: {
    id: string;
    name: string;
    experiment_id: string;
  } | null;
  experiment?: {
    id: string;
    name: string;
    project_id: string;
  } | null;
  model_version?: {
    id: string;
    version: number;
    model_id: string;
  } | null;
  children?: Artifact[];
  children_count?: number;
}

export interface ArtifactDownloadUrl {
  url: string;
  expires_at: string;
}

export interface ArtifactUploadUrl {
  url: string;
  fields: Record<string, string>;
  expires_at: string;
}

export interface ArtifactTree {
  artifact: Artifact;
  children: ArtifactTree[];
}

export interface ArtifactStorageStats {
  total_size_bytes: number;
  artifact_count: number;
  by_type: Record<ArtifactType, { count: number; size_bytes: number }>;
  by_storage: Record<ArtifactStorageType, { count: number; size_bytes: number }>;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const artifactKeys = createQueryKeyFactory<string>('artifacts');

export const artifactQueryKeys = {
  all: ['artifacts'] as const,
  lists: () => [...artifactQueryKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...artifactQueryKeys.lists(), params] as const,
  details: () => [...artifactQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...artifactQueryKeys.details(), id] as const,
  byRun: (runId: string) => [...artifactQueryKeys.all, 'run', runId] as const,
  byExperiment: (experimentId: string) => [...artifactQueryKeys.all, 'experiment', experimentId] as const,
  byModelVersion: (modelVersionId: string) => [...artifactQueryKeys.all, 'model-version', modelVersionId] as const,
  byType: (type: ArtifactType) => [...artifactQueryKeys.all, 'type', type] as const,
  tree: (parentId: string | null) => [...artifactQueryKeys.all, 'tree', parentId] as const,
  download: (id: string) => [...artifactQueryKeys.detail(id), 'download'] as const,
  stats: (scope: Record<string, unknown>) => [...artifactQueryKeys.all, 'stats', scope] as const,
};

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Hook to fetch a list of artifacts
 */
export const useArtifacts = (options: ListQueryOptions = {}) => {
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
    queryKey: artifactKeys.list({ page, pageSize, sort, filters, search }),
    queryFn: async () => {
      let query = supabase
        .from('ml_artifact')
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
        query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data as Artifact[],
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
 * Hook for infinite scrolling artifact list
 */
export const useInfiniteArtifacts = (
  options: Omit<ListQueryOptions, 'pagination'> & { pageSize?: number } = {}
) => {
  const { sort, filters, search, select = '*', enabled = true, pageSize = DEFAULT_PAGE_SIZE } = options;

  return useInfiniteQuery({
    queryKey: artifactKeys.infinite({ sort, filters, search }),
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('ml_artifact')
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
        query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      query = query.range(pageParam, pageParam + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data as Artifact[],
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
 * Hook to fetch a single artifact by ID
 */
export const useArtifact = (
  id: string | undefined,
  options: { select?: string; enabled?: boolean } = {}
) => {
  const {
    select = `
      *,
      run:run_id(id, name, experiment_id),
      experiment:experiment_id(id, name, project_id),
      model_version:model_version_id(id, version, model_id)
    `,
    enabled = true,
  } = options;

  return useQuery({
    queryKey: artifactKeys.detail(id ?? ''),
    queryFn: async () => {
      if (!id) throw new Error('Artifact ID is required');

      const { data, error } = await supabase
        .from('ml_artifact')
        .select(select)
        .eq('id', id)
        .single();

      if (error) throw error;

      return data as ArtifactWithRelations;
    },
    enabled: enabled && !!id,
  });
};

/**
 * Hook to fetch artifacts by run
 */
export const useArtifactsByRun = (
  runId: string | undefined,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'run_id', operator: 'eq' as const, value: runId },
  ];

  return useArtifacts({
    ...options,
    filters,
    enabled: (options.enabled ?? true) && !!runId,
  });
};

/**
 * Hook to fetch artifacts by experiment
 */
export const useArtifactsByExperiment = (
  experimentId: string | undefined,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'experiment_id', operator: 'eq' as const, value: experimentId },
  ];

  return useArtifacts({
    ...options,
    filters,
    enabled: (options.enabled ?? true) && !!experimentId,
  });
};

/**
 * Hook to fetch artifacts by model version
 */
export const useArtifactsByModelVersion = (
  modelVersionId: string | undefined,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'model_version_id', operator: 'eq' as const, value: modelVersionId },
  ];

  return useArtifacts({
    ...options,
    filters,
    enabled: (options.enabled ?? true) && !!modelVersionId,
  });
};

/**
 * Hook to fetch artifacts by type
 */
export const useArtifactsByType = (
  artifactType: ArtifactType,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'artifact_type', operator: 'eq' as const, value: artifactType },
  ];

  return useArtifacts({ ...options, filters });
};

/**
 * Hook to search artifacts
 */
export const useSearchArtifacts = (
  searchTerm: string,
  options: ListQueryOptions = {}
) => {
  return useArtifacts({
    ...options,
    search: { column: 'name', value: searchTerm },
    enabled: (options.enabled ?? true) && searchTerm.length >= 2,
  });
};

/**
 * Hook to fetch child artifacts (for directory navigation)
 */
export const useChildArtifacts = (
  parentId: string | null,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'parent_id', operator: parentId ? 'eq' as const : 'is' as const, value: parentId },
  ];

  return useArtifacts({ ...options, filters });
};

/**
 * Hook to fetch artifact tree structure
 */
export const useArtifactTree = (
  rootArtifactId: string | undefined,
  options: { maxDepth?: number; enabled?: boolean } = {}
) => {
  const { maxDepth = 5, enabled = true } = options;

  return useQuery({
    queryKey: [...artifactQueryKeys.tree(rootArtifactId ?? null), { maxDepth }],
    queryFn: async () => {
      if (!rootArtifactId) throw new Error('Root artifact ID is required');

      // Recursive function to build tree
      // TODO: This should be a server-side function for performance
      const buildTree = async (id: string, depth: number): Promise<ArtifactTree> => {
        const { data: artifact, error: artifactError } = await supabase
          .from('ml_artifact')
          .select('*')
          .eq('id', id)
          .single();

        if (artifactError) throw artifactError;

        if (!artifact.is_directory || depth >= maxDepth) {
          return { artifact: artifact as Artifact, children: [] };
        }

        const { data: children, error: childrenError } = await supabase
          .from('ml_artifact')
          .select('*')
          .eq('parent_id', id)
          .order('name', { ascending: true });

        if (childrenError) throw childrenError;

        const childTrees = await Promise.all(
          (children ?? []).map((child) => buildTree(child.id, depth + 1))
        );

        return { artifact: artifact as Artifact, children: childTrees };
      };

      return buildTree(rootArtifactId, 0);
    },
    enabled: enabled && !!rootArtifactId,
  });
};

/**
 * Hook to get artifact download URL
 * TODO: Implement actual presigned URL generation via edge function
 */
export const useArtifactDownloadUrl = (
  id: string | undefined,
  options: { expiresIn?: number; enabled?: boolean } = {}
) => {
  const { expiresIn = 3600, enabled = true } = options;

  return useQuery({
    queryKey: [...artifactQueryKeys.download(id ?? ''), { expiresIn }],
    queryFn: async () => {
      if (!id) throw new Error('Artifact ID is required');

      // Fetch artifact to get storage info
      const { data: artifact, error: artifactError } = await supabase
        .from('ml_artifact')
        .select('storage_type, storage_uri')
        .eq('id', id)
        .single();

      if (artifactError) throw artifactError;

      // TODO: Call edge function to generate presigned URL based on storage type
      // For now, return placeholder
      // In production, this should call an edge function that generates
      // presigned URLs for S3, GCS, Azure, or Supabase storage

      // Placeholder implementation for Supabase storage
      if (artifact.storage_type === 'supabase') {
        const { data } = await supabase.storage
          .from('artifacts')
          .createSignedUrl(artifact.storage_uri, expiresIn);

        if (data) {
          return {
            url: data.signedUrl,
            expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
          } as ArtifactDownloadUrl;
        }
      }

      throw new Error('Presigned URL generation not implemented for this storage type');
    },
    enabled: enabled && !!id,
    staleTime: (expiresIn - 60) * 1000, // Refresh before expiry
  });
};

/**
 * Hook to get artifact storage statistics
 */
export const useArtifactStorageStats = (
  scope: { tenantId?: string; projectId?: string; experimentId?: string },
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: artifactQueryKeys.stats(scope),
    queryFn: async () => {
      // TODO: This should be a server-side function for performance
      let query = supabase
        .from('ml_artifact')
        .select('artifact_type, storage_type, size_bytes');

      if (scope.tenantId) {
        query = query.eq('tenant_id', scope.tenantId);
      }
      if (scope.projectId) {
        // Need to join through experiment or run
        // TODO: Add project_id to artifact table or use RPC
      }
      if (scope.experimentId) {
        query = query.eq('experiment_id', scope.experimentId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calculate stats
      const stats: ArtifactStorageStats = {
        total_size_bytes: 0,
        artifact_count: data?.length ?? 0,
        by_type: {} as Record<ArtifactType, { count: number; size_bytes: number }>,
        by_storage: {} as Record<ArtifactStorageType, { count: number; size_bytes: number }>,
      };

      for (const artifact of data ?? []) {
        const sizeBytes = artifact.size_bytes ?? 0;
        stats.total_size_bytes += sizeBytes;

        // By type
        if (!stats.by_type[artifact.artifact_type as ArtifactType]) {
          stats.by_type[artifact.artifact_type as ArtifactType] = { count: 0, size_bytes: 0 };
        }
        stats.by_type[artifact.artifact_type as ArtifactType].count++;
        stats.by_type[artifact.artifact_type as ArtifactType].size_bytes += sizeBytes;

        // By storage
        if (!stats.by_storage[artifact.storage_type as ArtifactStorageType]) {
          stats.by_storage[artifact.storage_type as ArtifactStorageType] = { count: 0, size_bytes: 0 };
        }
        stats.by_storage[artifact.storage_type as ArtifactStorageType].count++;
        stats.by_storage[artifact.storage_type as ArtifactStorageType].size_bytes += sizeBytes;
      }

      return stats;
    },
    enabled: enabled && !!(scope.tenantId || scope.projectId || scope.experimentId),
  });
};

/**
 * Hook to get model artifacts specifically
 */
export const useModelArtifacts = (
  runId: string | undefined,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'run_id', operator: 'eq' as const, value: runId },
    { column: 'artifact_type', operator: 'eq' as const, value: 'model' },
  ];

  return useArtifacts({
    ...options,
    filters,
    enabled: (options.enabled ?? true) && !!runId,
  });
};

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Hook to create a new artifact
 */
export const useCreateArtifact = (
  options: MutationOptions<Artifact, ArtifactInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ArtifactInsert) => {
      const { data, error } = await supabase
        .from('ml_artifact')
        .insert(input)
        .select()
        .single();

      if (error) throw error;

      return data as Artifact;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: artifactKeys.lists() });
      if (variables.run_id) {
        queryClient.invalidateQueries({ queryKey: artifactQueryKeys.byRun(variables.run_id) });
      }
      if (variables.experiment_id) {
        queryClient.invalidateQueries({ queryKey: artifactQueryKeys.byExperiment(variables.experiment_id) });
      }
      if (variables.model_version_id) {
        queryClient.invalidateQueries({ queryKey: artifactQueryKeys.byModelVersion(variables.model_version_id) });
      }
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to create artifact:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to batch create artifacts
 */
export const useBatchCreateArtifacts = (
  options: MutationOptions<Artifact[], ArtifactInsert[]> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inputs: ArtifactInsert[]) => {
      const { data, error } = await supabase
        .from('ml_artifact')
        .insert(inputs)
        .select();

      if (error) throw error;

      return data as Artifact[];
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: artifactKeys.lists() });
      // Invalidate related queries
      const runIds = [...new Set(variables.map((v) => v.run_id).filter(Boolean))];
      const experimentIds = [...new Set(variables.map((v) => v.experiment_id).filter(Boolean))];

      for (const runId of runIds) {
        if (runId) queryClient.invalidateQueries({ queryKey: artifactQueryKeys.byRun(runId) });
      }
      for (const experimentId of experimentIds) {
        if (experimentId) queryClient.invalidateQueries({ queryKey: artifactQueryKeys.byExperiment(experimentId) });
      }

      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to batch create artifacts:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to update an artifact
 */
export const useUpdateArtifact = (
  options: MutationOptions<Artifact, { id: string; data: ArtifactUpdate }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ArtifactUpdate }) => {
      const { data: result, error } = await supabase
        .from('ml_artifact')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return result as Artifact;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: artifactKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: artifactKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to update artifact:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to delete an artifact
 */
export const useDeleteArtifact = (
  options: MutationOptions<void, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // TODO: Also delete from storage (edge function)
      const { error } = await supabase
        .from('ml_artifact')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: artifactKeys.all });
      options.onSuccess?.(undefined, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to delete artifact:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: (data, error, variables) => {
      options.onSettled?.(data, error, variables);
    },
  });
};

/**
 * Hook to batch delete artifacts
 */
export const useBatchDeleteArtifacts = (
  options: MutationOptions<void, string[]> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      // TODO: Also delete from storage (edge function)
      const { error } = await supabase
        .from('ml_artifact')
        .delete()
        .in('id', ids);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: artifactKeys.all });
      options.onSuccess?.(undefined, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to batch delete artifacts:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: (data, error, variables) => {
      options.onSettled?.(data, error, variables);
    },
  });
};

/**
 * Hook to update artifact tags
 */
export const useUpdateArtifactTags = (
  options: MutationOptions<Artifact, { id: string; tags: string[] }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, tags }: { id: string; tags: string[] }) => {
      const { data, error } = await supabase
        .from('ml_artifact')
        .update({ tags })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as Artifact;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: artifactKeys.detail(variables.id) });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to update artifact tags:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to move artifact to different parent (reorganize)
 */
export const useMoveArtifact = (
  options: MutationOptions<Artifact, { id: string; newParentId: string | null }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, newParentId }: { id: string; newParentId: string | null }) => {
      const { data, error } = await supabase
        .from('ml_artifact')
        .update({ parent_id: newParentId })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as Artifact;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: artifactKeys.all });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to move artifact:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to copy artifact
 * TODO: Implement actual file copy via edge function
 */
export const useCopyArtifact = (
  options: MutationOptions<Artifact, { sourceId: string; destinationRunId?: string; newName?: string }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sourceId,
      destinationRunId,
      newName,
    }: {
      sourceId: string;
      destinationRunId?: string;
      newName?: string;
    }) => {
      // Fetch source artifact
      const { data: source, error: sourceError } = await supabase
        .from('ml_artifact')
        .select('*')
        .eq('id', sourceId)
        .single();

      if (sourceError) throw sourceError;

      // TODO: Copy the actual file in storage via edge function

      // Create new artifact record
      const newArtifact: ArtifactInsert = {
        tenant_id: source.tenant_id,
        run_id: destinationRunId ?? source.run_id,
        experiment_id: source.experiment_id,
        model_version_id: source.model_version_id,
        name: newName ?? `${source.name}_copy`,
        path: source.path,
        artifact_type: source.artifact_type,
        storage_type: source.storage_type,
        storage_uri: source.storage_uri, // TODO: Update after actual copy
        size_bytes: source.size_bytes,
        mime_type: source.mime_type,
        checksum: source.checksum,
        checksum_algorithm: source.checksum_algorithm,
        description: source.description,
        tags: source.tags,
        metadata: {
          ...(source.metadata as Record<string, unknown>),
          copied_from: sourceId,
          copied_at: new Date().toISOString(),
        },
        is_directory: source.is_directory,
        created_by: source.created_by, // TODO: Use current user
      };

      const { data, error } = await supabase
        .from('ml_artifact')
        .insert(newArtifact)
        .select()
        .single();

      if (error) throw error;

      return data as Artifact;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: artifactKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to copy artifact:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

// ============================================================================
// TODO: Additional Features
// ============================================================================
// TODO: Add useUploadArtifact hook with progress tracking
// TODO: Add useArtifactPreview hook for image/text previews
// TODO: Add useArtifactDiff hook for comparing artifacts
// TODO: Add useArtifactVersionHistory hook for versioned artifacts
// TODO: Add useArtifactLineage hook for provenance tracking
// TODO: Add useArtifactSearch hook with full-text search
// TODO: Add useArtifactValidation hook for integrity checks
// TODO: Add real-time subscription for artifact uploads
// TODO: Add useArtifactQuota hook for storage quota tracking
// TODO: Add useArtifactCleanup hook for orphaned artifact cleanup
