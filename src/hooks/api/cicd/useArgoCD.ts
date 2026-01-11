// ============================================================================
// ArgoCD Hooks
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
 * ArgoCD sync status enum
 */
export type ArgoCdSyncStatus = 'unknown' | 'syncing' | 'synced' | 'outofsync' | 'error';

/**
 * ArgoCD health status enum
 */
export type ArgoCdHealthStatus = 'healthy' | 'progressing' | 'degraded' | 'missing' | 'suspended';

/**
 * Drift severity enum
 */
export type DriftSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Drift status enum
 */
export type DriftStatus = 'open' | 'acknowledged' | 'resolved';

/**
 * ArgoCD Instance type from database
 */
export interface ArgoCdInstance {
  id: string;
  tenant_id: string;
  name: string;
  base_url: string | null;
  cluster_id: string | null;
  auth_secret_ref: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * ArgoCD Application type from database
 */
export interface ArgoCdApplication {
  id: string;
  tenant_id: string;
  project_id: string;
  argocd_instance_id: string;
  name: string;
  app_project: string;
  source_repo: string | null;
  source_path: string | null;
  source_target_revision: string;
  helm_values: Record<string, unknown>;
  kustomize: Record<string, unknown>;
  destination_cluster: string | null;
  destination_namespace: string | null;
  sync_policy: SyncPolicy;
  status: ArgoCdSyncStatus;
  health: ArgoCdHealthStatus;
  conditions: ArgoCdCondition[];
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * ArgoCD sync policy
 */
export interface SyncPolicy {
  automated?: {
    prune?: boolean;
    selfHeal?: boolean;
    allowEmpty?: boolean;
  };
  syncOptions?: string[];
  retry?: {
    limit?: number;
    backoff?: {
      duration?: string;
      factor?: number;
      maxDuration?: string;
    };
  };
}

/**
 * ArgoCD condition
 */
export interface ArgoCdCondition {
  type: string;
  message?: string;
  lastTransitionTime?: string;
}

/**
 * ArgoCD Sync History type from database
 */
export interface ArgoCdSyncHistory {
  id: string;
  tenant_id: string;
  application_id: string;
  revision: string | null;
  initiated_by: string | null;
  operation_phase: string | null;
  sync_status: string | null;
  health_status: string | null;
  started_at: string | null;
  finished_at: string | null;
  message: string | null;
  resources: Array<Record<string, unknown>>;
}

/**
 * ArgoCD Resource Status type from database
 */
export interface ArgoCdResourceStatus {
  id: string;
  tenant_id: string;
  application_id: string;
  group_name: string | null;
  kind: string | null;
  namespace: string | null;
  name: string | null;
  sync_status: string | null;
  health_status: string | null;
  hook: boolean;
  requires_pruning: boolean;
  message: string | null;
  last_seen_at: string | null;
}

/**
 * ArgoCD Event type from database
 */
export interface ArgoCdEvent {
  id: string;
  tenant_id: string;
  application_id: string;
  type: string | null;
  reason: string | null;
  message: string | null;
  involved_object: Record<string, unknown>;
  occurred_at: string | null;
}

/**
 * ArgoCD Drift Finding type from database
 */
export interface ArgoCdDriftFinding {
  id: string;
  tenant_id: string;
  application_id: string;
  severity: DriftSeverity;
  resource_key: string | null;
  diff_summary: string | null;
  diff_uri: string | null;
  detected_at: string | null;
  status: DriftStatus;
  resolved_at: string | null;
  resolved_by: string | null;
}

/**
 * Application with relations
 */
export interface ArgoCdApplicationWithRelations extends ArgoCdApplication {
  instance?: ArgoCdInstance;
  project?: {
    id: string;
    name: string;
    slug: string;
  };
  drift_count?: number;
}

// Insert types
export type ArgoCdInstanceInsert = Omit<ArgoCdInstance, 'id' | 'created_at' | 'updated_at'> & { id?: string };
export type ArgoCdApplicationInsert = Omit<ArgoCdApplication, 'id' | 'created_at' | 'updated_at'> & { id?: string };
export type ArgoCdSyncHistoryInsert = Omit<ArgoCdSyncHistory, 'id'> & { id?: string };
export type ArgoCdDriftFindingInsert = Omit<ArgoCdDriftFinding, 'id'> & { id?: string };

// Update types
export type ArgoCdInstanceUpdate = Partial<Omit<ArgoCdInstance, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>;
export type ArgoCdApplicationUpdate = Partial<Omit<ArgoCdApplication, 'id' | 'tenant_id' | 'project_id' | 'argocd_instance_id' | 'created_at' | 'updated_at'>>;
export type ArgoCdDriftFindingUpdate = Partial<Omit<ArgoCdDriftFinding, 'id' | 'tenant_id' | 'application_id'>>;

// ============================================================================
// QUERY KEYS
// ============================================================================

export const argoCdInstanceKeys = createQueryKeyFactory<string>('argocd_instances');
export const argoCdAppKeys = createQueryKeyFactory<string>('argocd_applications');
export const argoCdSyncHistoryKeys = createQueryKeyFactory<string>('argocd_sync_history');
export const argoCdResourceKeys = createQueryKeyFactory<string>('argocd_resources');
export const argoCdEventKeys = createQueryKeyFactory<string>('argocd_events');
export const argoCdDriftKeys = createQueryKeyFactory<string>('argocd_drift');

// Extended query keys
export const argoCdAppQueryKeys = {
  ...argoCdAppKeys,
  byProject: (projectId: string) => [...argoCdAppKeys.all, 'project', projectId] as const,
  byInstance: (instanceId: string) => [...argoCdAppKeys.all, 'instance', instanceId] as const,
  byStatus: (status: ArgoCdSyncStatus) => [...argoCdAppKeys.all, 'status', status] as const,
  byHealth: (health: ArgoCdHealthStatus) => [...argoCdAppKeys.all, 'health', health] as const,
  unhealthy: () => [...argoCdAppKeys.all, 'unhealthy'] as const,
  outOfSync: () => [...argoCdAppKeys.all, 'outofsync'] as const,
};

export const driftQueryKeys = {
  ...argoCdDriftKeys,
  byApp: (appId: string) => [...argoCdDriftKeys.all, 'app', appId] as const,
  byStatus: (status: DriftStatus) => [...argoCdDriftKeys.all, 'status', status] as const,
  open: () => [...argoCdDriftKeys.all, 'open'] as const,
};

// ============================================================================
// ARGOCD INSTANCE QUERY HOOKS
// ============================================================================

/**
 * Fetch all ArgoCD instances
 */
export const useArgoCdInstances = (options: ListQueryOptions = {}) => {
  const {
    pagination = { page: DEFAULT_PAGE, pageSize: DEFAULT_PAGE_SIZE },
    sort = { column: 'name', ascending: true },
    enabled = true,
  } = options;

  const page = pagination.page ?? DEFAULT_PAGE;
  const pageSize = pagination.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = calculateOffset(page, pageSize);

  return useQuery({
    queryKey: argoCdInstanceKeys.list({ pagination, sort }),
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from('argocd_instance')
        .select('*', { count: 'exact' })
        .order(sort.column, { ascending: sort.ascending ?? true })
        .range(offset, offset + pageSize - 1);

      if (error) throw error;
      return { data: data as ArgoCdInstance[], count };
    },
    enabled,
  });
};

/**
 * Fetch a single ArgoCD instance
 */
export const useArgoCdInstance = (instanceId: string, options: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: argoCdInstanceKeys.detail(instanceId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('argocd_instance')
        .select('*')
        .eq('id', instanceId)
        .single();

      if (error) throw error;
      return data as ArgoCdInstance;
    },
    enabled: options.enabled !== false && !!instanceId,
  });
};

// ============================================================================
// ARGOCD APPLICATION QUERY HOOKS
// ============================================================================

/**
 * Fetch all ArgoCD applications
 */
export const useArgoCdApplications = (options: ListQueryOptions = {}) => {
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
    queryKey: argoCdAppKeys.list({ pagination, sort, filters }),
    queryFn: async () => {
      let query = supabase
        .from('argocd_application')
        .select('*, instance:argocd_instance(id, name, base_url), project:project_id(id, name, slug)', { count: 'exact' });

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
      return { data: data as ArgoCdApplicationWithRelations[], count };
    },
    enabled,
  });
};

/**
 * Fetch a single ArgoCD application
 */
export const useArgoCdApplication = (appId: string, options: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: argoCdAppKeys.detail(appId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('argocd_application')
        .select('*, instance:argocd_instance(id, name, base_url), project:project_id(id, name, slug)')
        .eq('id', appId)
        .single();

      if (error) throw error;
      return data as ArgoCdApplicationWithRelations;
    },
    enabled: options.enabled !== false && !!appId,
  });
};

/**
 * Fetch ArgoCD applications by project
 */
export const useArgoCdAppsByProject = (projectId: string) => {
  return useQuery({
    queryKey: argoCdAppQueryKeys.byProject(projectId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('argocd_application')
        .select('*, instance:argocd_instance(id, name)')
        .eq('project_id', projectId)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as ArgoCdApplicationWithRelations[];
    },
    enabled: !!projectId,
  });
};

/**
 * Fetch unhealthy applications
 */
export const useUnhealthyApps = () => {
  return useQuery({
    queryKey: argoCdAppQueryKeys.unhealthy(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('argocd_application')
        .select('*, instance:argocd_instance(id, name), project:project_id(id, name)')
        .in('health', ['degraded', 'missing'])
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as ArgoCdApplicationWithRelations[];
    },
    refetchInterval: 30000, // Poll every 30 seconds
  });
};

/**
 * Fetch out-of-sync applications
 */
export const useOutOfSyncApps = () => {
  return useQuery({
    queryKey: argoCdAppQueryKeys.outOfSync(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('argocd_application')
        .select('*, instance:argocd_instance(id, name), project:project_id(id, name)')
        .eq('status', 'outofsync')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as ArgoCdApplicationWithRelations[];
    },
    refetchInterval: 30000, // Poll every 30 seconds
  });
};

// ============================================================================
// SYNC HISTORY QUERY HOOKS
// ============================================================================

/**
 * Fetch sync history for an application
 */
export const useSyncHistory = (applicationId: string, limit: number = 20) => {
  return useQuery({
    queryKey: [...argoCdSyncHistoryKeys.all, 'app', applicationId, limit] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('argocd_sync_history')
        .select('*')
        .eq('application_id', applicationId)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as ArgoCdSyncHistory[];
    },
    enabled: !!applicationId,
  });
};

// ============================================================================
// RESOURCE STATUS QUERY HOOKS
// ============================================================================

/**
 * Fetch resources for an application
 */
export const useAppResources = (applicationId: string) => {
  return useQuery({
    queryKey: [...argoCdResourceKeys.all, 'app', applicationId] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('argocd_resource_status')
        .select('*')
        .eq('application_id', applicationId)
        .order('kind', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return data as ArgoCdResourceStatus[];
    },
    enabled: !!applicationId,
  });
};

// ============================================================================
// EVENT QUERY HOOKS
// ============================================================================

/**
 * Fetch events for an application
 */
export const useAppEvents = (applicationId: string, limit: number = 50) => {
  return useQuery({
    queryKey: [...argoCdEventKeys.all, 'app', applicationId, limit] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('argocd_event')
        .select('*')
        .eq('application_id', applicationId)
        .order('occurred_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as ArgoCdEvent[];
    },
    enabled: !!applicationId,
  });
};

// ============================================================================
// DRIFT FINDING QUERY HOOKS
// ============================================================================

/**
 * Fetch drift findings for an application
 */
export const useDriftFindings = (applicationId: string) => {
  return useQuery({
    queryKey: driftQueryKeys.byApp(applicationId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('argocd_drift_finding')
        .select('*')
        .eq('application_id', applicationId)
        .order('detected_at', { ascending: false });

      if (error) throw error;
      return data as ArgoCdDriftFinding[];
    },
    enabled: !!applicationId,
  });
};

/**
 * Fetch open drift findings
 */
export const useOpenDriftFindings = () => {
  return useQuery({
    queryKey: driftQueryKeys.open(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('argocd_drift_finding')
        .select('*, application:argocd_application(id, name, project_id)')
        .eq('status', 'open')
        .order('severity', { ascending: false })
        .order('detected_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

// ============================================================================
// ARGOCD INSTANCE MUTATION HOOKS
// ============================================================================

/**
 * Create an ArgoCD instance
 */
export const useCreateArgoCdInstance = (
  options: MutationOptions<ArgoCdInstance, ArgoCdInstanceInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (instance: ArgoCdInstanceInsert) => {
      const { data, error } = await supabase
        .from('argocd_instance')
        .insert(instance)
        .select()
        .single();

      if (error) throw error;
      return data as ArgoCdInstance;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: argoCdInstanceKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update an ArgoCD instance
 */
export const useUpdateArgoCdInstance = (
  options: MutationOptions<ArgoCdInstance, { id: string; updates: ArgoCdInstanceUpdate }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('argocd_instance')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ArgoCdInstance;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: argoCdInstanceKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: argoCdInstanceKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Delete an ArgoCD instance
 */
export const useDeleteArgoCdInstance = (
  options: MutationOptions<void, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (instanceId: string) => {
      const { error } = await supabase
        .from('argocd_instance')
        .delete()
        .eq('id', instanceId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: argoCdInstanceKeys.all });
      options.onSuccess?.(undefined, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

// ============================================================================
// ARGOCD APPLICATION MUTATION HOOKS
// ============================================================================

/**
 * Create an ArgoCD application
 */
export const useCreateArgoCdApplication = (
  options: MutationOptions<ArgoCdApplication, ArgoCdApplicationInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (app: ArgoCdApplicationInsert) => {
      const { data, error } = await supabase
        .from('argocd_application')
        .insert(app)
        .select()
        .single();

      if (error) throw error;
      return data as ArgoCdApplication;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: argoCdAppKeys.lists() });
      queryClient.invalidateQueries({ queryKey: argoCdAppQueryKeys.byProject(data.project_id) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update an ArgoCD application
 */
export const useUpdateArgoCdApplication = (
  options: MutationOptions<ArgoCdApplication, { id: string; updates: ArgoCdApplicationUpdate }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('argocd_application')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ArgoCdApplication;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: argoCdAppKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: argoCdAppKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update application sync policy
 */
export const useUpdateSyncPolicy = (
  options: MutationOptions<ArgoCdApplication, { id: string; syncPolicy: SyncPolicy }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, syncPolicy }) => {
      const { data, error } = await supabase
        .from('argocd_application')
        .update({ sync_policy: syncPolicy })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ArgoCdApplication;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: argoCdAppKeys.detail(variables.id) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update application status
 */
export const useUpdateAppStatus = (
  options: MutationOptions<ArgoCdApplication, {
    id: string;
    status: ArgoCdSyncStatus;
    health: ArgoCdHealthStatus;
  }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, health }) => {
      const { data, error } = await supabase
        .from('argocd_application')
        .update({ status, health, last_sync_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ArgoCdApplication;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: argoCdAppKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: argoCdAppQueryKeys.unhealthy() });
      queryClient.invalidateQueries({ queryKey: argoCdAppQueryKeys.outOfSync() });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Delete an ArgoCD application
 */
export const useDeleteArgoCdApplication = (
  options: MutationOptions<void, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appId: string) => {
      const { error } = await supabase
        .from('argocd_application')
        .delete()
        .eq('id', appId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: argoCdAppKeys.all });
      options.onSuccess?.(undefined, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

// ============================================================================
// DRIFT FINDING MUTATION HOOKS
// ============================================================================

/**
 * Update drift finding status
 */
export const useUpdateDriftStatus = (
  options: MutationOptions<ArgoCdDriftFinding, { id: string; status: DriftStatus; resolvedBy?: string }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, resolvedBy }) => {
      const updates: Partial<ArgoCdDriftFinding> = { status };
      if (status === 'resolved') {
        updates.resolved_at = new Date().toISOString();
        updates.resolved_by = resolvedBy || null;
      }

      const { data, error } = await supabase
        .from('argocd_drift_finding')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ArgoCdDriftFinding;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: argoCdDriftKeys.all });
      queryClient.invalidateQueries({ queryKey: driftQueryKeys.byApp(data.application_id) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

// ============================================================================
// TODO: Additional Features
// ============================================================================
// TODO: Add useTriggerSync mutation for manual sync
// TODO: Add useRollbackApp mutation for rollback to previous revision
// TODO: Add useRefreshApp mutation for hard refresh
// TODO: Add useTerminateOperation mutation for cancelling operations
// TODO: Add useGetAppManifests hook for manifest retrieval
// TODO: Add useGetAppDiff hook for comparing live vs desired state
// TODO: Add useAppMetrics hook for resource metrics
// TODO: Add useAppLogs hook for pod logs
// TODO: Add real-time subscription hooks for status updates
// TODO: Add bulk operations (sync all, refresh all)
