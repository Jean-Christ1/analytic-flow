// ============================================================================
// CI/CD Pipeline Hooks
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

// ============================================================================
// TYPES
// ============================================================================

/**
 * Pipeline source enum
 */
export type CicdPipelineSource = 'push' | 'merge_request' | 'schedule' | 'web' | 'api' | 'parent_pipeline';

/**
 * Pipeline status enum
 */
export type CicdPipelineStatus = 'created' | 'pending' | 'running' | 'success' | 'failed' | 'canceled' | 'skipped' | 'manual';

/**
 * Job status enum
 */
export type CicdJobStatus = 'created' | 'pending' | 'running' | 'success' | 'failed' | 'canceled' | 'skipped' | 'manual';

/**
 * Artifact type enum
 */
export type CicdArtifactType = 'archive' | 'dotenv' | 'junit' | 'coverage' | 'sbom' | 'container_scan' | 'terraform_plan' | 'helm_chart';

/**
 * CI/CD Pipeline type from database
 */
export interface CicdPipeline {
  id: string;
  tenant_id: string;
  project_id: string;
  gitlab_instance_id: string | null;
  repo_full_name: string | null;
  pipeline_iid: number | null;
  pipeline_id_external: string | null;
  source: CicdPipelineSource | null;
  ref: string | null;
  sha: string | null;
  mr_iid: number | null;
  status: CicdPipelineStatus;
  detailed_status: string | null;
  started_at: string | null;
  finished_at: string | null;
  duration_sec: number | null;
  queued_duration_sec: number | null;
  user_external_id: string | null;
  web_url: string | null;
  variables: Record<string, unknown>;
  coverage: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * CI/CD Stage type from database
 */
export interface CicdStage {
  id: string;
  tenant_id: string;
  pipeline_id: string;
  name: string;
  status: string | null;
  started_at: string | null;
  finished_at: string | null;
  duration_sec: number | null;
}

/**
 * CI/CD Job type from database
 */
export interface CicdJob {
  id: string;
  tenant_id: string;
  pipeline_id: string;
  stage_id: string | null;
  name: string;
  job_id_external: string | null;
  status: CicdJobStatus;
  allow_failure: boolean;
  when_run: string | null;
  started_at: string | null;
  finished_at: string | null;
  duration_sec: number | null;
  runner_description: string | null;
  runner_tags: string[];
  image: string | null;
  script_summary: string | null;
  artifacts_expire_at: string | null;
  log_url: string | null;
  failure_reason: string | null;
  exit_code: number | null;
  retry_count: number;
  created_at: string;
}

/**
 * CI/CD Job Artifact type from database
 */
export interface CicdJobArtifact {
  id: string;
  tenant_id: string;
  job_id: string;
  name: string;
  type: CicdArtifactType | null;
  uri: string | null;
  size_bytes: number | null;
  checksum: string | null;
  created_at: string;
}

/**
 * Pipeline with relations
 */
export interface CicdPipelineWithRelations extends CicdPipeline {
  project?: {
    id: string;
    name: string;
    slug: string;
  };
  stages?: CicdStage[];
  jobs_count?: number;
}

/**
 * Job with relations
 */
export interface CicdJobWithRelations extends CicdJob {
  stage?: CicdStage;
  artifacts?: CicdJobArtifact[];
}

// Insert types
export type CicdPipelineInsert = Omit<CicdPipeline, 'id' | 'created_at' | 'updated_at'> & { id?: string };
export type CicdStageInsert = Omit<CicdStage, 'id'> & { id?: string };
export type CicdJobInsert = Omit<CicdJob, 'id' | 'created_at'> & { id?: string };
export type CicdJobArtifactInsert = Omit<CicdJobArtifact, 'id' | 'created_at'> & { id?: string };

// Update types
export type CicdPipelineUpdate = Partial<Omit<CicdPipeline, 'id' | 'tenant_id' | 'project_id' | 'created_at' | 'updated_at'>>;
export type CicdStageUpdate = Partial<Omit<CicdStage, 'id' | 'tenant_id' | 'pipeline_id'>>;
export type CicdJobUpdate = Partial<Omit<CicdJob, 'id' | 'tenant_id' | 'pipeline_id' | 'created_at'>>;

// ============================================================================
// QUERY KEYS
// ============================================================================

export const pipelineKeys = createQueryKeyFactory<string>('cicd_pipelines');
export const stageKeys = createQueryKeyFactory<string>('cicd_stages');
export const jobKeys = createQueryKeyFactory<string>('cicd_jobs');
export const artifactKeys = createQueryKeyFactory<string>('cicd_artifacts');

// Extended query keys
export const pipelineQueryKeys = {
  ...pipelineKeys,
  byProject: (projectId: string) => [...pipelineKeys.all, 'project', projectId] as const,
  byStatus: (status: CicdPipelineStatus) => [...pipelineKeys.all, 'status', status] as const,
  byRef: (ref: string) => [...pipelineKeys.all, 'ref', ref] as const,
  running: () => [...pipelineKeys.all, 'running'] as const,
  recent: () => [...pipelineKeys.all, 'recent'] as const,
};

export const jobQueryKeys = {
  ...jobKeys,
  byPipeline: (pipelineId: string) => [...jobKeys.all, 'pipeline', pipelineId] as const,
  byStage: (stageId: string) => [...jobKeys.all, 'stage', stageId] as const,
  byStatus: (status: CicdJobStatus) => [...jobKeys.all, 'status', status] as const,
  failed: () => [...jobKeys.all, 'failed'] as const,
};

// ============================================================================
// PIPELINE QUERY HOOKS
// ============================================================================

/**
 * Fetch all pipelines with pagination
 */
export const usePipelines = (options: ListQueryOptions = {}) => {
  const {
    pagination = { page: DEFAULT_PAGE, pageSize: DEFAULT_PAGE_SIZE },
    sort = { column: 'created_at', ascending: false },
    filters = [],
    search,
    select = '*, project:project_id(id, name, slug)',
    enabled = true,
  } = options;

  const page = pagination.page ?? DEFAULT_PAGE;
  const pageSize = pagination.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = calculateOffset(page, pageSize);

  return useQuery({
    queryKey: pipelineKeys.list({ pagination, sort, filters, search }),
    queryFn: async () => {
      let query = supabase
        .from('cicd_pipeline')
        .select(select, { count: 'exact' });

      filters.forEach(filter => {
        query = query.filter(filter.column, filter.operator, filter.value);
      });

      if (search) {
        query = query.ilike(search.column, `%${search.value}%`);
      }

      const sortParams = Array.isArray(sort) ? sort : [sort];
      sortParams.forEach(s => {
        query = query.order(s.column, { ascending: s.ascending ?? true });
      });

      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;
      return { data: data as CicdPipelineWithRelations[], count };
    },
    enabled,
  });
};

/**
 * Infinite query for pipelines
 */
export const useInfinitePipelines = (options: Omit<ListQueryOptions, 'pagination'> = {}) => {
  const {
    sort = { column: 'created_at', ascending: false },
    filters = [],
    enabled = true,
  } = options;

  const pageSize = DEFAULT_PAGE_SIZE;

  return useInfiniteQuery({
    queryKey: pipelineKeys.infinite({ sort, filters }),
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('cicd_pipeline')
        .select('*, project:project_id(id, name, slug)', { count: 'exact' });

      filters.forEach(filter => {
        query = query.filter(filter.column, filter.operator, filter.value);
      });

      const sortParams = Array.isArray(sort) ? sort : [sort];
      sortParams.forEach(s => {
        query = query.order(s.column, { ascending: s.ascending ?? true });
      });

      query = query.range(pageParam, pageParam + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;
      return { data: data as CicdPipelineWithRelations[], count, nextCursor: pageParam + pageSize };
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
 * Fetch a single pipeline
 */
export const usePipeline = (pipelineId: string, options: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: pipelineKeys.detail(pipelineId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cicd_pipeline')
        .select('*, project:project_id(id, name, slug)')
        .eq('id', pipelineId)
        .single();

      if (error) throw error;
      return data as CicdPipelineWithRelations;
    },
    enabled: options.enabled !== false && !!pipelineId,
  });
};

/**
 * Fetch pipelines by project
 */
export const usePipelinesByProject = (projectId: string, options: ListQueryOptions = {}) => {
  const { pagination = { page: DEFAULT_PAGE, pageSize: DEFAULT_PAGE_SIZE } } = options;
  const page = pagination.page ?? DEFAULT_PAGE;
  const pageSize = pagination.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = calculateOffset(page, pageSize);

  return useQuery({
    queryKey: pipelineQueryKeys.byProject(projectId),
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from('cicd_pipeline')
        .select('*', { count: 'exact' })
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) throw error;
      return { data: data as CicdPipeline[], count };
    },
    enabled: !!projectId,
  });
};

/**
 * Fetch pipelines by status
 */
export const usePipelinesByStatus = (status: CicdPipelineStatus) => {
  return useQuery({
    queryKey: pipelineQueryKeys.byStatus(status),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cicd_pipeline')
        .select('*, project:project_id(id, name, slug)')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CicdPipelineWithRelations[];
    },
  });
};

/**
 * Fetch running pipelines
 */
export const useRunningPipelines = () => {
  return useQuery({
    queryKey: pipelineQueryKeys.running(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cicd_pipeline')
        .select('*, project:project_id(id, name, slug)')
        .in('status', ['created', 'pending', 'running'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CicdPipelineWithRelations[];
    },
    refetchInterval: 10000, // Poll every 10 seconds
  });
};

/**
 * Fetch recent pipelines
 */
export const useRecentPipelines = (limit: number = 10) => {
  return useQuery({
    queryKey: [...pipelineQueryKeys.recent(), limit] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cicd_pipeline')
        .select('*, project:project_id(id, name, slug)')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as CicdPipelineWithRelations[];
    },
  });
};

// ============================================================================
// STAGE QUERY HOOKS
// ============================================================================

/**
 * Fetch stages by pipeline
 */
export const useStagesByPipeline = (pipelineId: string) => {
  return useQuery({
    queryKey: [...stageKeys.all, 'pipeline', pipelineId] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cicd_stage')
        .select('*')
        .eq('pipeline_id', pipelineId)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as CicdStage[];
    },
    enabled: !!pipelineId,
  });
};

// ============================================================================
// JOB QUERY HOOKS
// ============================================================================

/**
 * Fetch jobs by pipeline
 */
export const useJobsByPipeline = (pipelineId: string) => {
  return useQuery({
    queryKey: jobQueryKeys.byPipeline(pipelineId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cicd_job')
        .select('*, stage:cicd_stage(id, name, status)')
        .eq('pipeline_id', pipelineId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as CicdJobWithRelations[];
    },
    enabled: !!pipelineId,
  });
};

/**
 * Fetch a single job
 */
export const useJob = (jobId: string, options: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: jobKeys.detail(jobId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cicd_job')
        .select('*, stage:cicd_stage(id, name, status), artifacts:cicd_job_artifact(*)')
        .eq('id', jobId)
        .single();

      if (error) throw error;
      return data as CicdJobWithRelations;
    },
    enabled: options.enabled !== false && !!jobId,
  });
};

/**
 * Fetch failed jobs
 */
export const useFailedJobs = (limit: number = 20) => {
  return useQuery({
    queryKey: [...jobQueryKeys.failed(), limit] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cicd_job')
        .select('*, stage:cicd_stage(id, name)')
        .eq('status', 'failed')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as CicdJobWithRelations[];
    },
  });
};

// ============================================================================
// ARTIFACT QUERY HOOKS
// ============================================================================

/**
 * Fetch artifacts by job
 */
export const useArtifactsByJob = (jobId: string) => {
  return useQuery({
    queryKey: [...artifactKeys.all, 'job', jobId] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cicd_job_artifact')
        .select('*')
        .eq('job_id', jobId)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as CicdJobArtifact[];
    },
    enabled: !!jobId,
  });
};

// ============================================================================
// PIPELINE MUTATION HOOKS
// ============================================================================

/**
 * Create a pipeline
 */
export const useCreatePipeline = (
  options: MutationOptions<CicdPipeline, CicdPipelineInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pipeline: CicdPipelineInsert) => {
      const { data, error } = await supabase
        .from('cicd_pipeline')
        .insert(pipeline)
        .select()
        .single();

      if (error) throw error;
      return data as CicdPipeline;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: pipelineKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pipelineQueryKeys.byProject(data.project_id) });
      queryClient.invalidateQueries({ queryKey: pipelineQueryKeys.running() });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update a pipeline
 */
export const useUpdatePipeline = (
  options: MutationOptions<CicdPipeline, { id: string; updates: CicdPipelineUpdate }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('cicd_pipeline')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as CicdPipeline;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: pipelineKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: pipelineKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pipelineQueryKeys.running() });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update pipeline status
 */
export const useUpdatePipelineStatus = (
  options: MutationOptions<CicdPipeline, { id: string; status: CicdPipelineStatus }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }) => {
      const updates: Partial<CicdPipeline> = { status };

      // Set timestamps based on status
      if (status === 'running' && !updates.started_at) {
        updates.started_at = new Date().toISOString();
      }
      if (['success', 'failed', 'canceled'].includes(status)) {
        updates.finished_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('cicd_pipeline')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as CicdPipeline;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: pipelineKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: pipelineQueryKeys.byStatus(variables.status) });
      queryClient.invalidateQueries({ queryKey: pipelineQueryKeys.running() });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

// ============================================================================
// JOB MUTATION HOOKS
// ============================================================================

/**
 * Create a job
 */
export const useCreateJob = (
  options: MutationOptions<CicdJob, CicdJobInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (job: CicdJobInsert) => {
      const { data, error } = await supabase
        .from('cicd_job')
        .insert(job)
        .select()
        .single();

      if (error) throw error;
      return data as CicdJob;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.byPipeline(data.pipeline_id) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update a job
 */
export const useUpdateJob = (
  options: MutationOptions<CicdJob, { id: string; updates: CicdJobUpdate }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('cicd_job')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as CicdJob;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.byPipeline(data.pipeline_id) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Retry a failed job
 */
export const useRetryJob = (
  options: MutationOptions<CicdJob, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const { data, error } = await supabase
        .from('cicd_job')
        .update({
          status: 'pending',
          started_at: null,
          finished_at: null,
          duration_sec: null,
          failure_reason: null,
          exit_code: null,
          retry_count: supabase.rpc('increment', { x: 1 }) as unknown as number,
        })
        .eq('id', jobId)
        .select()
        .single();

      if (error) throw error;
      return data as CicdJob;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(variables) });
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.byPipeline(data.pipeline_id) });
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.failed() });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

// ============================================================================
// ARTIFACT MUTATION HOOKS
// ============================================================================

/**
 * Create a job artifact
 */
export const useCreateArtifact = (
  options: MutationOptions<CicdJobArtifact, CicdJobArtifactInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (artifact: CicdJobArtifactInsert) => {
      const { data, error } = await supabase
        .from('cicd_job_artifact')
        .insert(artifact)
        .select()
        .single();

      if (error) throw error;
      return data as CicdJobArtifact;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: artifactKeys.all });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

// ============================================================================
// TODO: Additional Features
// ============================================================================
// TODO: Add useCancelPipeline mutation for cancelling pipelines
// TODO: Add useRetriggerPipeline mutation for retriggering
// TODO: Add usePipelineMetrics hook for pipeline statistics
// TODO: Add usePipelineTrends hook for success/failure trends
// TODO: Add useJobLogs hook for streaming job logs
// TODO: Add usePipelineVariables hook for variable management
// TODO: Add useDownloadArtifact hook for artifact download
// TODO: Add usePipelineBadge hook for status badges
// TODO: Add pipeline comparison hooks
// TODO: Add pipeline dependency visualization hooks
