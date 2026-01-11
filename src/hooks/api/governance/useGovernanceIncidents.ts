// ============================================================================
// Governance Incidents Hooks - React Query Hooks for AI Incident Management
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
 * Governance incident types (EU AI Act aligned)
 */
export type GovernanceIncidentType =
  | 'bias_detected'           // Algorithmic bias detected in production
  | 'discrimination'          // Discriminatory outcome reported
  | 'safety_issue'            // Safety-critical failure
  | 'privacy_breach'          // Data privacy violation
  | 'transparency_failure'    // Lack of explainability
  | 'human_oversight_failure' // Human-in-the-loop bypassed
  | 'accuracy_degradation'    // Model performance decline
  | 'adversarial_attack'      // Attempted manipulation of AI
  | 'data_poisoning'          // Training data compromise
  | 'unauthorized_use'        // AI used outside intended purpose
  | 'regulatory_violation'    // Compliance requirement breach
  | 'other';                  // Other incident types

/**
 * Incident severity levels
 */
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Incident lifecycle status
 */
export type GovernanceIncidentStatus =
  | 'open'           // Incident reported
  | 'investigating'  // Under investigation
  | 'mitigating'     // Mitigation in progress
  | 'resolved'       // Issue resolved
  | 'closed';        // Incident closed

export interface GovernanceIncident {
  id: string;
  tenant_id: string;
  ai_system_id: string;
  model_deployment_id: string | null;
  type: GovernanceIncidentType;
  severity: IncidentSeverity | null;
  description: string | null;
  detected_at: string | null;
  status: GovernanceIncidentStatus;
  resolution: string | null;
  closed_at: string | null;
  owner_user_id: string | null;
}

export interface GovernanceIncidentInsert {
  tenant_id: string;
  ai_system_id: string;
  model_deployment_id?: string | null;
  type: GovernanceIncidentType;
  severity?: IncidentSeverity | null;
  description?: string | null;
  detected_at?: string | null;
  status?: GovernanceIncidentStatus;
  owner_user_id?: string | null;
}

export interface GovernanceIncidentUpdate {
  type?: GovernanceIncidentType;
  severity?: IncidentSeverity | null;
  description?: string | null;
  status?: GovernanceIncidentStatus;
  resolution?: string | null;
  closed_at?: string | null;
  owner_user_id?: string | null;
}

export interface GovernanceIncidentWithRelations extends GovernanceIncident {
  ai_system?: {
    id: string;
    name: string;
    risk_class: string;
    project_id: string;
  } | null;
  deployment?: {
    id: string;
    name: string;
    endpoint_url: string;
  } | null;
  owner?: {
    id: string;
    full_name: string;
    email: string;
  } | null;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const governanceIncidentKeys = createQueryKeyFactory<string>('governanceIncidents');

// ============================================================================
// GOVERNANCE INCIDENT QUERIES
// ============================================================================

/**
 * Hook to fetch a list of Governance Incidents
 */
export const useGovernanceIncidents = (options: ListQueryOptions = {}) => {
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
    queryKey: governanceIncidentKeys.list({ page, pageSize, sort, filters, search }),
    queryFn: async () => {
      let query = supabase
        .from('governance_incident')
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
        query = query.order('detected_at', { ascending: false });
      }

      // Apply pagination
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data as GovernanceIncident[],
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
 * Hook to fetch a single Governance Incident by ID
 */
export const useGovernanceIncident = (
  id: string | undefined,
  options: { select?: string; enabled?: boolean } = {}
) => {
  const {
    select = `
      *,
      ai_system:ai_system_id(id, name, risk_class, project_id),
      deployment:model_deployment_id(id, name, endpoint_url),
      owner:owner_user_id(id, full_name, email)
    `,
    enabled = true,
  } = options;

  return useQuery({
    queryKey: governanceIncidentKeys.detail(id ?? ''),
    queryFn: async () => {
      if (!id) throw new Error('Governance Incident ID is required');

      const { data, error } = await supabase
        .from('governance_incident')
        .select(select)
        .eq('id', id)
        .single();

      if (error) throw error;

      return data as GovernanceIncidentWithRelations;
    },
    enabled: enabled && !!id,
  });
};

/**
 * Hook to fetch Incidents by AI System
 */
export const useIncidentsByAISystem = (
  aiSystemId: string | undefined,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'ai_system_id', operator: 'eq' as const, value: aiSystemId },
  ];

  return useGovernanceIncidents({
    ...options,
    filters,
    enabled: (options.enabled ?? true) && !!aiSystemId,
  });
};

/**
 * Hook to fetch Incidents by status
 */
export const useIncidentsByStatus = (
  status: GovernanceIncidentStatus,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'status', operator: 'eq' as const, value: status },
  ];

  return useGovernanceIncidents({ ...options, filters });
};

/**
 * Hook to fetch open incidents
 */
export const useOpenIncidents = (options: ListQueryOptions = {}) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'status', operator: 'in' as const, value: ['open', 'investigating', 'mitigating'] },
  ];

  return useGovernanceIncidents({ ...options, filters });
};

/**
 * Hook to fetch critical incidents
 */
export const useCriticalIncidents = (options: ListQueryOptions = {}) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'severity', operator: 'eq' as const, value: 'critical' },
    { column: 'status', operator: 'neq' as const, value: 'closed' },
  ];

  return useGovernanceIncidents({ ...options, filters });
};

/**
 * Hook to fetch Incidents by type
 */
export const useIncidentsByType = (
  type: GovernanceIncidentType,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'type', operator: 'eq' as const, value: type },
  ];

  return useGovernanceIncidents({ ...options, filters });
};

/**
 * Hook to fetch Incidents assigned to a user
 */
export const useMyIncidents = (
  userId: string | undefined,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'owner_user_id', operator: 'eq' as const, value: userId },
  ];

  return useGovernanceIncidents({
    ...options,
    filters,
    enabled: (options.enabled ?? true) && !!userId,
  });
};

/**
 * Hook to get incident statistics
 */
export const useIncidentStats = (
  projectId?: string,
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['governanceIncidents', 'stats', projectId],
    queryFn: async () => {
      let query = supabase
        .from('governance_incident')
        .select(`
          id,
          type,
          severity,
          status,
          detected_at,
          closed_at,
          ai_system:ai_system_id(project_id)
        `);

      const { data, error } = await query;

      if (error) throw error;

      // Filter by project if specified
      let filteredData = data;
      if (projectId) {
        filteredData = data?.filter(
          (incident: { ai_system: { project_id: string } | null }) =>
            incident.ai_system?.project_id === projectId
        );
      }

      // Calculate statistics
      const stats = {
        total: filteredData?.length ?? 0,
        byStatus: {
          open: 0,
          investigating: 0,
          mitigating: 0,
          resolved: 0,
          closed: 0,
        },
        bySeverity: {
          low: 0,
          medium: 0,
          high: 0,
          critical: 0,
        },
        byType: {} as Record<GovernanceIncidentType, number>,
        avgResolutionTimeHours: 0,
        openCount: 0,
        criticalOpenCount: 0,
      };

      let totalResolutionTime = 0;
      let resolvedCount = 0;

      filteredData?.forEach((incident) => {
        // Status counts
        stats.byStatus[incident.status as GovernanceIncidentStatus]++;

        // Severity counts
        if (incident.severity) {
          stats.bySeverity[incident.severity as IncidentSeverity]++;
        }

        // Type counts
        const type = incident.type as GovernanceIncidentType;
        stats.byType[type] = (stats.byType[type] ?? 0) + 1;

        // Open incidents
        if (['open', 'investigating', 'mitigating'].includes(incident.status)) {
          stats.openCount++;
          if (incident.severity === 'critical') {
            stats.criticalOpenCount++;
          }
        }

        // Resolution time calculation
        if (incident.detected_at && incident.closed_at) {
          const detected = new Date(incident.detected_at).getTime();
          const closed = new Date(incident.closed_at).getTime();
          totalResolutionTime += (closed - detected) / (1000 * 60 * 60); // hours
          resolvedCount++;
        }
      });

      if (resolvedCount > 0) {
        stats.avgResolutionTimeHours = totalResolutionTime / resolvedCount;
      }

      return stats;
    },
    enabled,
  });
};

/**
 * Hook to get incident trends
 */
export const useIncidentTrends = (
  daysBack: number = 30,
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['governanceIncidents', 'trends', daysBack],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const { data, error } = await supabase
        .from('governance_incident')
        .select('id, detected_at, type, severity, status')
        .gte('detected_at', startDate.toISOString())
        .order('detected_at');

      if (error) throw error;

      // Group by date
      const byDate = new Map<string, {
        date: string;
        count: number;
        bySeverity: Record<IncidentSeverity, number>;
      }>();

      data?.forEach((incident) => {
        if (!incident.detected_at) return;

        const date = incident.detected_at.split('T')[0];
        if (!byDate.has(date)) {
          byDate.set(date, {
            date,
            count: 0,
            bySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
          });
        }

        const dayStats = byDate.get(date)!;
        dayStats.count++;
        if (incident.severity) {
          dayStats.bySeverity[incident.severity as IncidentSeverity]++;
        }
      });

      return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
    },
    enabled,
  });
};

// ============================================================================
// GOVERNANCE INCIDENT MUTATIONS
// ============================================================================

/**
 * Hook to create a new Governance Incident
 */
export const useCreateGovernanceIncident = (
  options: MutationOptions<GovernanceIncident, GovernanceIncidentInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: GovernanceIncidentInsert) => {
      // Set detected_at if not provided
      const insertData = {
        ...input,
        detected_at: input.detected_at ?? new Date().toISOString(),
        status: input.status ?? ('open' as GovernanceIncidentStatus),
      };

      const { data, error } = await supabase
        .from('governance_incident')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      return data as GovernanceIncident;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: governanceIncidentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['governanceIncidents', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['governanceIncidents', 'trends'] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to create Governance Incident:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to update a Governance Incident
 */
export const useUpdateGovernanceIncident = (
  options: MutationOptions<GovernanceIncident, { id: string; data: GovernanceIncidentUpdate }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: GovernanceIncidentUpdate }) => {
      const { data: result, error } = await supabase
        .from('governance_incident')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return result as GovernanceIncident;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: governanceIncidentKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: governanceIncidentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['governanceIncidents', 'stats'] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to update Governance Incident:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to delete a Governance Incident
 */
export const useDeleteGovernanceIncident = (
  options: MutationOptions<void, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('governance_incident')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: governanceIncidentKeys.all });
      queryClient.invalidateQueries({ queryKey: ['governanceIncidents', 'stats'] });
      options.onSuccess?.(undefined, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to delete Governance Incident:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: (data, error, variables) => {
      options.onSettled?.(data, error, variables);
    },
  });
};

/**
 * Hook to transition incident status
 */
export const useTransitionIncidentStatus = (
  options: MutationOptions<GovernanceIncident, { id: string; status: GovernanceIncidentStatus }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: GovernanceIncidentStatus }) => {
      const updateData: GovernanceIncidentUpdate = { status };

      // Set closed_at when closing
      if (status === 'closed') {
        updateData.closed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('governance_incident')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as GovernanceIncident;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: governanceIncidentKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: governanceIncidentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['governanceIncidents', 'stats'] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to transition incident status:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to resolve an incident
 */
export const useResolveIncident = (
  options: MutationOptions<GovernanceIncident, { id: string; resolution: string }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, resolution }: { id: string; resolution: string }) => {
      const { data, error } = await supabase
        .from('governance_incident')
        .update({
          status: 'resolved' as GovernanceIncidentStatus,
          resolution,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as GovernanceIncident;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: governanceIncidentKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: governanceIncidentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['governanceIncidents', 'stats'] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to resolve incident:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to close an incident
 */
export const useCloseIncident = (
  options: MutationOptions<GovernanceIncident, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('governance_incident')
        .update({
          status: 'closed' as GovernanceIncidentStatus,
          closed_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as GovernanceIncident;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: governanceIncidentKeys.detail(variables) });
      queryClient.invalidateQueries({ queryKey: governanceIncidentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['governanceIncidents', 'stats'] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to close incident:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to assign incident to a user
 */
export const useAssignIncident = (
  options: MutationOptions<GovernanceIncident, { id: string; userId: string }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const { data, error } = await supabase
        .from('governance_incident')
        .update({ owner_user_id: userId })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as GovernanceIncident;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: governanceIncidentKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: governanceIncidentKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to assign incident:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to escalate incident severity
 */
export const useEscalateIncident = (
  options: MutationOptions<GovernanceIncident, { id: string; severity: IncidentSeverity }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, severity }: { id: string; severity: IncidentSeverity }) => {
      const { data, error } = await supabase
        .from('governance_incident')
        .update({ severity })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as GovernanceIncident;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: governanceIncidentKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: governanceIncidentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['governanceIncidents', 'stats'] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to escalate incident:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

// ============================================================================
// TODO: Future Enhancements
// ============================================================================
// TODO: Add useIncidentTimeline hook for incident history visualization
// TODO: Add useIncidentNotifications hook for alerting integration
// TODO: Add useIncidentExport hook for regulatory reporting
// TODO: Add useRelatedIncidents hook for pattern detection
// TODO: Add useIncidentRootCause hook for RCA tracking
// TODO: Add automated incident detection from model monitoring
// TODO: Add integration with PagerDuty/OpsGenie/Slack
// TODO: Add incident playbook automation
// TODO: Add regulatory notification workflow (EU AI Act Article 62)
// TODO: Add incident postmortem template generation
