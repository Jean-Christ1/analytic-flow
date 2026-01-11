// ============================================================================
// Incidents Hooks - React Query Hooks for Incident Management
// MLOps Control Plane v3
// Author: Armand AMOUSSOU
// Date: 2026-01-04
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

/**
 * Incident severity levels (SEV0 = most critical)
 */
export type IncidentSeverity = 'sev0' | 'sev1' | 'sev2' | 'sev3' | 'sev4';

/**
 * Incident lifecycle statuses
 */
export type IncidentStatus = 'open' | 'mitigating' | 'resolved' | 'closed';

/**
 * Update message types in incident timeline
 */
export type IncidentUpdateType = 'info' | 'mitigation' | 'resolution';

/**
 * Related entity reference
 */
export interface RelatedEntity {
  type: string;
  id: string;
  name?: string;
  url?: string;
}

/**
 * Incident structure
 */
export interface Incident {
  id: string;
  tenant_id: string;
  project_id: string;
  title: string;
  description: string | null;
  severity: IncidentSeverity;
  status: IncidentStatus;
  detected_at: string | null;
  declared_at: string | null;
  resolved_at: string | null;
  owner_user_id: string | null;
  related_entity: RelatedEntity | null;
  root_cause: string | null;
  impact: string | null;
  timeline_uri: string | null;
  created_at: string;
  updated_at: string;
}

export interface IncidentInsert {
  tenant_id: string;
  project_id: string;
  title: string;
  description?: string | null;
  severity?: IncidentSeverity;
  status?: IncidentStatus;
  detected_at?: string | null;
  declared_at?: string | null;
  owner_user_id?: string | null;
  related_entity?: RelatedEntity | null;
  impact?: string | null;
}

export interface IncidentUpdate {
  title?: string;
  description?: string | null;
  severity?: IncidentSeverity;
  status?: IncidentStatus;
  resolved_at?: string | null;
  owner_user_id?: string | null;
  root_cause?: string | null;
  impact?: string | null;
  timeline_uri?: string | null;
}

/**
 * Incident update/timeline entry
 */
export interface IncidentTimelineEntry {
  id: string;
  tenant_id: string;
  incident_id: string;
  author_user_id: string;
  message: string | null;
  status: IncidentUpdateType | null;
  created_at: string;
}

export interface IncidentTimelineEntryInsert {
  tenant_id: string;
  incident_id: string;
  author_user_id: string;
  message?: string | null;
  status?: IncidentUpdateType | null;
}

export interface IncidentWithRelations extends Incident {
  project?: { name: string; slug: string };
  owner?: { display_name: string | null; email: string };
  updates_count?: number;
}

/**
 * Incident metrics
 */
export interface IncidentMetrics {
  mttr: number; // Mean Time To Resolution (minutes)
  mtta: number; // Mean Time To Acknowledge (minutes)
  openIncidents: number;
  resolvedLast30Days: number;
  bySeverity: { severity: IncidentSeverity; count: number }[];
  byProject: { projectId: string; count: number }[];
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const incidentKeys = createQueryKeyFactory<string>('incidents');
export const incidentTimelineKeys = createQueryKeyFactory<string>('incidentTimeline');

// ============================================================================
// INCIDENT QUERIES
// ============================================================================

/**
 * Hook to fetch a list of Incidents
 */
export const useIncidents = (options: ListQueryOptions = {}) => {
  const {
    pagination = { page: DEFAULT_PAGE, pageSize: DEFAULT_PAGE_SIZE },
    sort,
    filters,
    search,
    select = '*, project:project(name, slug)',
    enabled = true,
  } = options;

  const page = pagination.page ?? DEFAULT_PAGE;
  const pageSize = pagination.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = calculateOffset(page, pageSize);

  return useQuery({
    queryKey: incidentKeys.list({ page, pageSize, sort, filters, search }),
    queryFn: async () => {
      let query = supabase
        .from('incident')
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
        // Default: open incidents first, then by severity
        query = query
          .order('status', { ascending: true })
          .order('severity', { ascending: true })
          .order('created_at', { ascending: false });
      }

      // Apply pagination
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data as IncidentWithRelations[],
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
 * Hook to fetch a single Incident by ID
 */
export const useIncident = (
  id: string | undefined,
  options: { select?: string; enabled?: boolean } = {}
) => {
  const {
    select = '*, project:project(name, slug), owner:user_account(display_name, email)',
    enabled = true,
  } = options;

  return useQuery({
    queryKey: incidentKeys.detail(id ?? ''),
    queryFn: async () => {
      if (!id) throw new Error('Incident ID is required');

      const { data, error } = await supabase
        .from('incident')
        .select(select)
        .eq('id', id)
        .single();

      if (error) throw error;

      return data as IncidentWithRelations;
    },
    enabled: enabled && !!id,
  });
};

/**
 * Hook to fetch Incidents by project
 */
export const useIncidentsByProject = (
  projectId: string,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'project_id', operator: 'eq' as const, value: projectId },
  ];

  return useIncidents({ ...options, filters });
};

/**
 * Hook to fetch Incidents by status
 */
export const useIncidentsByStatus = (
  status: IncidentStatus,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'status', operator: 'eq' as const, value: status },
  ];

  return useIncidents({ ...options, filters });
};

/**
 * Hook to fetch Incidents by severity
 */
export const useIncidentsBySeverity = (
  severity: IncidentSeverity,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'severity', operator: 'eq' as const, value: severity },
  ];

  return useIncidents({ ...options, filters });
};

/**
 * Hook to fetch open Incidents
 */
export const useOpenIncidents = (options: ListQueryOptions = {}) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'status', operator: 'in' as const, value: ['open', 'mitigating'] },
  ];

  return useIncidents({ ...options, filters });
};

/**
 * Hook to fetch critical Incidents (SEV0, SEV1)
 */
export const useCriticalIncidents = (options: ListQueryOptions = {}) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'severity', operator: 'in' as const, value: ['sev0', 'sev1'] },
    { column: 'status', operator: 'in' as const, value: ['open', 'mitigating'] },
  ];

  return useIncidents({ ...options, filters });
};

/**
 * Hook to fetch my Incidents (assigned to current user)
 */
export const useMyIncidents = (
  userId: string,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'owner_user_id', operator: 'eq' as const, value: userId },
  ];

  return useIncidents({ ...options, filters });
};

/**
 * Hook to search Incidents
 */
export const useSearchIncidents = (
  searchTerm: string,
  options: ListQueryOptions = {}
) => {
  return useIncidents({
    ...options,
    search: { column: 'title', value: searchTerm },
    enabled: (options.enabled ?? true) && searchTerm.length >= 2,
  });
};

/**
 * Hook to fetch incident timeline
 */
export const useIncidentTimeline = (
  incidentId: string | undefined,
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['incidents', 'timeline', incidentId],
    queryFn: async () => {
      if (!incidentId) throw new Error('Incident ID is required');

      const { data, error } = await supabase
        .from('incident_update')
        .select('*, author:user_account(display_name, email)')
        .eq('incident_id', incidentId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data as (IncidentTimelineEntry & { author?: { display_name: string | null; email: string } })[];
    },
    enabled: enabled && !!incidentId,
  });
};

/**
 * Hook to get incident metrics
 */
export const useIncidentMetrics = (
  dateRange?: { start: string; end: string },
  options: { projectId?: string; enabled?: boolean } = {}
) => {
  const { projectId, enabled = true } = options;

  return useQuery({
    queryKey: ['incidents', 'metrics', dateRange, projectId],
    queryFn: async () => {
      let query = supabase
        .from('incident')
        .select('severity, status, detected_at, declared_at, resolved_at, project_id');

      if (dateRange) {
        query = query
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end);
      }

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calculate MTTR (Mean Time To Resolution)
      const resolvedIncidents = data?.filter((i) => i.resolved_at && i.declared_at) ?? [];
      const ttrs = resolvedIncidents.map((i) => {
        const declared = new Date(i.declared_at!).getTime();
        const resolved = new Date(i.resolved_at!).getTime();
        return (resolved - declared) / (1000 * 60); // minutes
      });
      const mttr = ttrs.length > 0 ? ttrs.reduce((sum, t) => sum + t, 0) / ttrs.length : 0;

      // Calculate MTTA (Mean Time To Acknowledge)
      const acknowledgedIncidents = data?.filter((i) => i.declared_at && i.detected_at) ?? [];
      const ttas = acknowledgedIncidents.map((i) => {
        const detected = new Date(i.detected_at!).getTime();
        const declared = new Date(i.declared_at!).getTime();
        return (declared - detected) / (1000 * 60); // minutes
      });
      const mtta = ttas.length > 0 ? ttas.reduce((sum, t) => sum + t, 0) / ttas.length : 0;

      // Count by severity
      const bySeverity = new Map<IncidentSeverity, number>();
      data?.forEach((i) => {
        bySeverity.set(i.severity, (bySeverity.get(i.severity) ?? 0) + 1);
      });

      // Count by project
      const byProject = new Map<string, number>();
      data?.forEach((i) => {
        byProject.set(i.project_id, (byProject.get(i.project_id) ?? 0) + 1);
      });

      // Count open and resolved
      const openIncidents = data?.filter((i) => i.status === 'open' || i.status === 'mitigating').length ?? 0;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const resolvedLast30Days = data?.filter((i) =>
        i.resolved_at && new Date(i.resolved_at) >= thirtyDaysAgo
      ).length ?? 0;

      return {
        mttr: Math.round(mttr),
        mtta: Math.round(mtta),
        openIncidents,
        resolvedLast30Days,
        bySeverity: Array.from(bySeverity.entries()).map(([severity, count]) => ({ severity, count })),
        byProject: Array.from(byProject.entries()).map(([projectId, count]) => ({ projectId, count })),
      } as IncidentMetrics;
    },
    enabled,
  });
};

/**
 * Hook to get incident trends
 */
export const useIncidentTrends = (
  dateRange: { start: string; end: string },
  options: { projectId?: string; enabled?: boolean } = {}
) => {
  const { projectId, enabled = true } = options;

  return useQuery({
    queryKey: ['incidents', 'trends', dateRange, projectId],
    queryFn: async () => {
      let query = supabase
        .from('incident')
        .select('created_at, severity, status')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Group by day
      const byDay = new Map<string, { total: number; bySeverity: Record<IncidentSeverity, number> }>();

      data?.forEach((i) => {
        const day = new Date(i.created_at).toISOString().split('T')[0];
        const current = byDay.get(day) ?? {
          total: 0,
          bySeverity: { sev0: 0, sev1: 0, sev2: 0, sev3: 0, sev4: 0 },
        };
        current.total++;
        current.bySeverity[i.severity as IncidentSeverity]++;
        byDay.set(day, current);
      });

      return Array.from(byDay.entries())
        .map(([date, stats]) => ({ date, ...stats }))
        .sort((a, b) => a.date.localeCompare(b.date));
    },
    enabled,
  });
};

// ============================================================================
// INCIDENT MUTATIONS
// ============================================================================

/**
 * Hook to create a new Incident
 */
export const useCreateIncident = (
  options: MutationOptions<Incident, IncidentInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: IncidentInsert) => {
      const inputWithDefaults = {
        ...input,
        severity: input.severity ?? 'sev3',
        status: input.status ?? 'open',
        declared_at: input.declared_at ?? new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('incident')
        .insert(inputWithDefaults)
        .select()
        .single();

      if (error) throw error;

      return data as Incident;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: incidentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['incidents', 'metrics'] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to create Incident:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to update an Incident
 */
export const useUpdateIncident = (
  options: MutationOptions<Incident, { id: string; data: IncidentUpdate }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: IncidentUpdate }) => {
      const { data: result, error } = await supabase
        .from('incident')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return result as Incident;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: incidentKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: incidentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['incidents', 'metrics'] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to update Incident:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to delete an Incident
 */
export const useDeleteIncident = (
  options: MutationOptions<void, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('incident')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: incidentKeys.all });
      queryClient.invalidateQueries({ queryKey: ['incidents', 'metrics'] });
      options.onSuccess?.(undefined, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to delete Incident:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: (data, error, variables) => {
      options.onSettled?.(data, error, variables);
    },
  });
};

/**
 * Hook to acknowledge an Incident
 */
export const useAcknowledgeIncident = (
  options: MutationOptions<Incident, { id: string; ownerId: string }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ownerId }: { id: string; ownerId: string }) => {
      const { data, error } = await supabase
        .from('incident')
        .update({
          owner_user_id: ownerId,
          status: 'mitigating',
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as Incident;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: incidentKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: incidentKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to acknowledge Incident:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to resolve an Incident
 */
export const useResolveIncident = (
  options: MutationOptions<Incident, { id: string; rootCause?: string }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, rootCause }: { id: string; rootCause?: string }) => {
      const { data, error } = await supabase
        .from('incident')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          root_cause: rootCause,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as Incident;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: incidentKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: incidentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['incidents', 'metrics'] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to resolve Incident:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to close an Incident
 */
export const useCloseIncident = (
  options: MutationOptions<Incident, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('incident')
        .update({ status: 'closed' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as Incident;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: incidentKeys.detail(variables) });
      queryClient.invalidateQueries({ queryKey: incidentKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to close Incident:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to add timeline update to an Incident
 */
export const useAddIncidentUpdate = (
  options: MutationOptions<IncidentTimelineEntry, IncidentTimelineEntryInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: IncidentTimelineEntryInsert) => {
      const { data, error } = await supabase
        .from('incident_update')
        .insert(input)
        .select()
        .single();

      if (error) throw error;

      return data as IncidentTimelineEntry;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['incidents', 'timeline', variables.incident_id] });
      queryClient.invalidateQueries({ queryKey: incidentKeys.detail(variables.incident_id) });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to add Incident update:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to escalate incident severity
 */
export const useEscalateIncident = (
  options: MutationOptions<Incident, { id: string; newSeverity: IncidentSeverity }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, newSeverity }: { id: string; newSeverity: IncidentSeverity }) => {
      const { data, error } = await supabase
        .from('incident')
        .update({ severity: newSeverity })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as Incident;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: incidentKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: incidentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['incidents', 'metrics'] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to escalate Incident:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

// ============================================================================
// TODO: Future Enhancements
// ============================================================================
// TODO: Add useIncidentNotifications hook for real-time incident alerts
// TODO: Add useIncidentEscalation hook for automatic escalation rules
// TODO: Add useIncidentRunbook hook for linking runbooks to incidents
// TODO: Add usePostMortem hook for generating post-incident reviews
// TODO: Add useIncidentCorrelation hook for finding related incidents
// TODO: Add useIncidentPrediction hook for ML-based incident prediction
// TODO: Add integration with PagerDuty for on-call management
// TODO: Add integration with Slack/Teams for incident channels
// TODO: Add integration with Jira for follow-up ticket creation
// TODO: Add support for incident templates by type
// TODO: Add SLA breach detection and alerting
// TODO: Add automatic status page updates
