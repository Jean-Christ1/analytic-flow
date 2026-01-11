// ============================================================================
// Model Hooks - React Query Hooks for ML Model Registry Management
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

export type ModelStage = 'none' | 'development' | 'staging' | 'production' | 'archived';
export type ModelVersionStatus = 'pending' | 'ready' | 'failed' | 'archived';
export type DeploymentStatus = 'pending' | 'deploying' | 'running' | 'failed' | 'stopped' | 'scaling';
export type DeploymentTarget = 'kubernetes' | 'serverless' | 'edge' | 'batch';

export interface Model {
  id: string;
  tenant_id: string;
  project_id: string;
  name: string;
  description: string | null;
  framework: string | null;
  task_type: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  latest_version: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface ModelInsert {
  tenant_id: string;
  project_id: string;
  name: string;
  description?: string | null;
  framework?: string | null;
  task_type?: string | null;
  tags?: string[];
  metadata?: Record<string, unknown>;
  created_by?: string | null;
}

export interface ModelUpdate {
  name?: string;
  description?: string | null;
  framework?: string | null;
  task_type?: string | null;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface ModelVersion {
  id: string;
  tenant_id: string;
  model_id: string;
  version: number;
  run_id: string | null;
  artifact_uri: string | null;
  model_signature: Record<string, unknown>;
  model_flavor: string | null;
  stage: ModelStage;
  status: ModelVersionStatus;
  description: string | null;
  metrics: Record<string, number>;
  parameters: Record<string, unknown>;
  tags: string[];
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface ModelVersionInsert {
  tenant_id: string;
  model_id: string;
  run_id?: string | null;
  artifact_uri?: string | null;
  model_signature?: Record<string, unknown>;
  model_flavor?: string | null;
  stage?: ModelStage;
  status?: ModelVersionStatus;
  description?: string | null;
  metrics?: Record<string, number>;
  parameters?: Record<string, unknown>;
  tags?: string[];
  created_by?: string | null;
}

export interface ModelDeployment {
  id: string;
  tenant_id: string;
  model_id: string;
  model_version_id: string;
  name: string;
  target: DeploymentTarget;
  environment_id: string | null;
  cluster_id: string | null;
  endpoint_url: string | null;
  status: DeploymentStatus;
  replicas: number;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface ModelWithVersions extends Model {
  versions?: ModelVersion[];
  project?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const modelKeys = createQueryKeyFactory<string>('models');
export const modelVersionKeys = createQueryKeyFactory<string>('modelVersions');
export const modelDeploymentKeys = createQueryKeyFactory<string>('modelDeployments');

// ============================================================================
// MODEL QUERIES
// ============================================================================

/**
 * Hook to fetch a list of models
 */
export const useModels = (options: ListQueryOptions = {}) => {
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
    queryKey: modelKeys.list({ page, pageSize, sort, filters, search }),
    queryFn: async () => {
      let query = supabase
        .from('model')
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
        data: data as Model[],
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
 * Hook to fetch a single model by ID
 */
export const useModel = (
  id: string | undefined,
  options: { select?: string; enabled?: boolean } = {}
) => {
  const {
    select = `
      *,
      project:project_id(id, name, slug)
    `,
    enabled = true,
  } = options;

  return useQuery({
    queryKey: modelKeys.detail(id ?? ''),
    queryFn: async () => {
      if (!id) throw new Error('Model ID is required');

      const { data, error } = await supabase
        .from('model')
        .select(select)
        .eq('id', id)
        .single();

      if (error) throw error;

      return data as ModelWithVersions;
    },
    enabled: enabled && !!id,
  });
};

/**
 * Hook to fetch models by project
 */
export const useModelsByProject = (
  projectId: string | undefined,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'project_id', operator: 'eq' as const, value: projectId },
  ];

  return useModels({
    ...options,
    filters,
    enabled: (options.enabled ?? true) && !!projectId,
  });
};

/**
 * Hook to fetch models by framework
 */
export const useModelsByFramework = (
  framework: string,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'framework', operator: 'eq' as const, value: framework },
  ];

  return useModels({ ...options, filters });
};

/**
 * Hook to search models
 */
export const useSearchModels = (
  searchTerm: string,
  options: ListQueryOptions = {}
) => {
  return useModels({
    ...options,
    search: { column: 'name', value: searchTerm },
    enabled: (options.enabled ?? true) && searchTerm.length >= 2,
  });
};

// ============================================================================
// MODEL VERSION QUERIES
// ============================================================================

/**
 * Hook to fetch versions for a model
 */
export const useModelVersions = (
  modelId: string | undefined,
  options: ListQueryOptions = {}
) => {
  const {
    pagination = { page: DEFAULT_PAGE, pageSize: DEFAULT_PAGE_SIZE },
    sort,
    filters,
    select = '*',
    enabled = true,
  } = options;

  const page = pagination.page ?? DEFAULT_PAGE;
  const pageSize = pagination.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = calculateOffset(page, pageSize);

  return useQuery({
    queryKey: ['modelVersions', 'model', modelId, { page, pageSize, sort, filters }],
    queryFn: async () => {
      if (!modelId) throw new Error('Model ID is required');

      let query = supabase
        .from('model_version')
        .select(select, { count: 'exact' })
        .eq('model_id', modelId);

      // Apply filters
      if (filters) {
        for (const filter of filters) {
          // @ts-expect-error - Dynamic filter application
          query = query[filter.operator](filter.column, filter.value);
        }
      }

      // Apply sorting
      if (sort) {
        const sorts = Array.isArray(sort) ? sort : [sort];
        for (const s of sorts) {
          query = query.order(s.column, { ascending: s.ascending ?? true });
        }
      } else {
        query = query.order('version', { ascending: false });
      }

      // Apply pagination
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data as ModelVersion[],
        count: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      };
    },
    enabled: enabled && !!modelId,
  });
};

/**
 * Hook to fetch a specific model version
 */
export const useModelVersion = (
  id: string | undefined,
  options: { select?: string; enabled?: boolean } = {}
) => {
  const { select = '*', enabled = true } = options;

  return useQuery({
    queryKey: modelVersionKeys.detail(id ?? ''),
    queryFn: async () => {
      if (!id) throw new Error('Model version ID is required');

      const { data, error } = await supabase
        .from('model_version')
        .select(select)
        .eq('id', id)
        .single();

      if (error) throw error;

      return data as ModelVersion;
    },
    enabled: enabled && !!id,
  });
};

/**
 * Hook to fetch the latest version of a model
 */
export const useLatestModelVersion = (
  modelId: string | undefined,
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['modelVersions', 'latest', modelId],
    queryFn: async () => {
      if (!modelId) throw new Error('Model ID is required');

      const { data, error } = await supabase
        .from('model_version')
        .select('*')
        .eq('model_id', modelId)
        .order('version', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      return data as ModelVersion;
    },
    enabled: enabled && !!modelId,
  });
};

/**
 * Hook to fetch production model version
 */
export const useProductionModelVersion = (
  modelId: string | undefined,
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['modelVersions', 'production', modelId],
    queryFn: async () => {
      if (!modelId) throw new Error('Model ID is required');

      const { data, error } = await supabase
        .from('model_version')
        .select('*')
        .eq('model_id', modelId)
        .eq('stage', 'production')
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      return data as ModelVersion | null;
    },
    enabled: enabled && !!modelId,
  });
};

// ============================================================================
// MODEL DEPLOYMENT QUERIES
// ============================================================================

/**
 * Hook to fetch deployments for a model
 */
export const useModelDeployments = (
  modelId: string | undefined,
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['modelDeployments', 'model', modelId],
    queryFn: async () => {
      if (!modelId) throw new Error('Model ID is required');

      const { data, error } = await supabase
        .from('model_deployment')
        .select('*')
        .eq('model_id', modelId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data as ModelDeployment[];
    },
    enabled: enabled && !!modelId,
  });
};

/**
 * Hook to fetch active deployments
 */
export const useActiveDeployments = (options: ListQueryOptions = {}) => {
  const {
    pagination = { page: DEFAULT_PAGE, pageSize: DEFAULT_PAGE_SIZE },
    sort,
    select = '*',
    enabled = true,
  } = options;

  const page = pagination.page ?? DEFAULT_PAGE;
  const pageSize = pagination.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = calculateOffset(page, pageSize);

  return useQuery({
    queryKey: ['modelDeployments', 'active', { page, pageSize, sort }],
    queryFn: async () => {
      let query = supabase
        .from('model_deployment')
        .select(select, { count: 'exact' })
        .in('status', ['running', 'deploying', 'scaling']);

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
        data: data as ModelDeployment[],
        count: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      };
    },
    enabled,
  });
};

// ============================================================================
// MODEL MUTATIONS
// ============================================================================

/**
 * Hook to create a new model
 */
export const useCreateModel = (
  options: MutationOptions<Model, ModelInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ModelInsert) => {
      const { data, error } = await supabase
        .from('model')
        .insert(input)
        .select()
        .single();

      if (error) throw error;

      return data as Model;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: modelKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to create model:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to update a model
 */
export const useUpdateModel = (
  options: MutationOptions<Model, { id: string; data: ModelUpdate }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ModelUpdate }) => {
      const { data: result, error } = await supabase
        .from('model')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return result as Model;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: modelKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: modelKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to update model:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to delete a model
 */
export const useDeleteModel = (
  options: MutationOptions<void, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('model')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: modelKeys.all });
      options.onSuccess?.(undefined, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to delete model:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: (data, error, variables) => {
      options.onSettled?.(data, error, variables);
    },
  });
};

// ============================================================================
// MODEL VERSION MUTATIONS
// ============================================================================

/**
 * Hook to create a new model version
 */
export const useCreateModelVersion = (
  options: MutationOptions<ModelVersion, ModelVersionInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ModelVersionInsert) => {
      const { data, error } = await supabase
        .from('model_version')
        .insert(input)
        .select()
        .single();

      if (error) throw error;

      return data as ModelVersion;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['modelVersions', 'model', variables.model_id] });
      queryClient.invalidateQueries({ queryKey: modelKeys.detail(variables.model_id) });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to create model version:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to transition model version stage
 */
export const useTransitionModelVersionStage = (
  options: MutationOptions<ModelVersion, { id: string; stage: ModelStage }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: ModelStage }) => {
      const { data, error } = await supabase
        .from('model_version')
        .update({ stage })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as ModelVersion;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: modelVersionKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['modelVersions'] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to transition model version stage:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to promote model version to production
 */
export const usePromoteToProduction = (
  options: MutationOptions<ModelVersion, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (versionId: string) => {
      // First, get the model_id for this version
      const { data: version, error: fetchError } = await supabase
        .from('model_version')
        .select('model_id')
        .eq('id', versionId)
        .single();

      if (fetchError) throw fetchError;

      // Demote any existing production version
      await supabase
        .from('model_version')
        .update({ stage: 'archived' as ModelStage })
        .eq('model_id', version.model_id)
        .eq('stage', 'production');

      // Promote the new version
      const { data, error } = await supabase
        .from('model_version')
        .update({ stage: 'production' as ModelStage })
        .eq('id', versionId)
        .select()
        .single();

      if (error) throw error;

      return data as ModelVersion;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: modelVersionKeys.all });
      queryClient.invalidateQueries({ queryKey: modelKeys.all });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to promote model version:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

// ============================================================================
// MODEL DEPLOYMENT MUTATIONS
// ============================================================================

export interface ModelDeploymentInsert {
  tenant_id?: string;
  model_id: string;
  model_version_id: string;
  name: string;
  target: DeploymentTarget;
  environment_id?: string | null;
  cluster_id?: string | null;
  replicas?: number;
  config?: Record<string, unknown>;
  created_by?: string | null;
}

export interface ModelDeploymentUpdate {
  name?: string;
  target?: DeploymentTarget;
  environment_id?: string | null;
  cluster_id?: string | null;
  status?: DeploymentStatus;
  replicas?: number;
  config?: Record<string, unknown>;
}

/**
 * Hook to promote a model version to a specific stage.
 *
 * This is an alias for useTransitionModelVersionStage for backward compatibility.
 *
 * Parameters
 * ----------
 * options : MutationOptions
 *     Optional mutation configuration including onSuccess, onError callbacks.
 *
 * Returns
 * -------
 * UseMutationResult
 *     The mutation result containing mutate function and status.
 */
export const usePromoteModelVersion = (
  options: MutationOptions<ModelVersion, { versionId: string; stage: ModelStage }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ versionId, stage }: { versionId: string; stage: ModelStage }) => {
      const { data, error } = await supabase
        .from('model_version')
        .update({ stage })
        .eq('id', versionId)
        .select()
        .single();

      if (error) throw error;

      return data as ModelVersion;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: modelVersionKeys.detail(variables.versionId) });
      queryClient.invalidateQueries({ queryKey: modelVersionKeys.all });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to promote model version:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to create a new model deployment.
 *
 * Parameters
 * ----------
 * options : MutationOptions
 *     Optional mutation configuration including onSuccess, onError callbacks.
 *
 * Returns
 * -------
 * UseMutationResult
 *     The mutation result containing mutate function and status.
 */
export const useCreateModelDeployment = (
  options: MutationOptions<ModelDeployment, ModelDeploymentInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ModelDeploymentInsert) => {
      const { data, error } = await supabase
        .from('model_deployment')
        .insert({
          ...input,
          status: 'pending' as DeploymentStatus,
        })
        .select()
        .single();

      if (error) throw error;

      return data as ModelDeployment;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: modelDeploymentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['modelDeployments', 'model', variables.model_id] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to create model deployment:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to update an existing model deployment.
 *
 * Parameters
 * ----------
 * options : MutationOptions
 *     Optional mutation configuration including onSuccess, onError callbacks.
 *
 * Returns
 * -------
 * UseMutationResult
 *     The mutation result containing mutate function and status.
 */
export const useUpdateModelDeployment = (
  options: MutationOptions<ModelDeployment, { id: string } & ModelDeploymentUpdate> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & ModelDeploymentUpdate) => {
      const { data: result, error } = await supabase
        .from('model_deployment')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return result as ModelDeployment;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: modelDeploymentKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: modelDeploymentKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to update model deployment:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to delete a model deployment.
 *
 * Parameters
 * ----------
 * options : MutationOptions
 *     Optional mutation configuration including onSuccess, onError callbacks.
 *
 * Returns
 * -------
 * UseMutationResult
 *     The mutation result containing mutate function and status.
 */
export const useDeleteModelDeployment = (
  options: MutationOptions<void, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('model_deployment')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: modelDeploymentKeys.all });
      options.onSuccess?.(undefined, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to delete model deployment:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: (data, error, variables) => {
      options.onSettled?.(data, error, variables);
    },
  });
};

/**
 * Hook to scale a model deployment.
 *
 * Parameters
 * ----------
 * options : MutationOptions
 *     Optional mutation configuration including onSuccess, onError callbacks.
 *
 * Returns
 * -------
 * UseMutationResult
 *     The mutation result containing mutate function and status.
 */
export const useScaleModelDeployment = (
  options: MutationOptions<ModelDeployment, { id: string; replicas: number }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, replicas }: { id: string; replicas: number }) => {
      const { data, error } = await supabase
        .from('model_deployment')
        .update({ replicas, status: 'scaling' as DeploymentStatus })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as ModelDeployment;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: modelDeploymentKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: modelDeploymentKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to scale model deployment:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to stop a model deployment.
 *
 * Parameters
 * ----------
 * options : MutationOptions
 *     Optional mutation configuration including onSuccess, onError callbacks.
 *
 * Returns
 * -------
 * UseMutationResult
 *     The mutation result containing mutate function and status.
 */
export const useStopModelDeployment = (
  options: MutationOptions<ModelDeployment, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('model_deployment')
        .update({ status: 'stopped' as DeploymentStatus })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as ModelDeployment;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: modelDeploymentKeys.detail(variables) });
      queryClient.invalidateQueries({ queryKey: modelDeploymentKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to stop model deployment:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};
