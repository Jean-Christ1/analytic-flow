// ============================================================================
// Observability Links Hooks - React Query Hooks for Entity-Backend Mapping
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
import type { ObservabilityKind, ObservabilityType } from './useObservabilityBackends';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Entity types that can have observability links
 */
export type ObservableEntityType =
  | 'project'
  | 'experiment'
  | 'run'
  | 'model_deployment'
  | 'pipeline'
  | 'pipeline_run'
  | 'workspace'
  | 'cluster'
  | 'namespace';

/**
 * Query configuration for observability backend
 */
export interface ObservabilityQuery {
  // Loki/Logs
  logql?: string;
  // Prometheus/Metrics
  promql?: string;
  // Tempo/Jaeger Traces
  trace_query?: {
    service_name?: string;
    operation_name?: string;
    tags?: Record<string, string>;
    min_duration?: string;
    max_duration?: string;
  };
  // Time range
  time_range?: {
    start?: string;
    end?: string;
    relative?: string; // e.g., "now-1h", "now-24h"
  };
  // Labels/Filters
  labels?: Record<string, string>;
}

/**
 * Observability link structure connecting entities to backends
 */
export interface ObservabilityLink {
  id: string;
  tenant_id: string;
  backend_id: string;
  entity_type: ObservableEntityType;
  entity_id: string;
  query: ObservabilityQuery | null;
  url: string | null;
  created_at: string;
}

export interface ObservabilityLinkInsert {
  tenant_id: string;
  backend_id: string;
  entity_type: ObservableEntityType;
  entity_id: string;
  query?: ObservabilityQuery | null;
  url?: string | null;
}

export interface ObservabilityLinkUpdate {
  backend_id?: string;
  query?: ObservabilityQuery | null;
  url?: string | null;
}

export interface ObservabilityLinkWithBackend extends ObservabilityLink {
  backend?: {
    kind: ObservabilityKind;
    type: ObservabilityType;
    endpoint: string | null;
  };
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const observabilityLinkKeys = createQueryKeyFactory<string>('observabilityLinks');

// ============================================================================
// OBSERVABILITY LINK QUERIES
// ============================================================================

/**
 * Hook to fetch a list of Observability Links
 */
export const useObservabilityLinks = (options: ListQueryOptions = {}) => {
  const {
    pagination = { page: DEFAULT_PAGE, pageSize: DEFAULT_PAGE_SIZE },
    sort,
    filters,
    search,
    select = '*, backend:observability_backend(kind, type, endpoint)',
    enabled = true,
  } = options;

  const page = pagination.page ?? DEFAULT_PAGE;
  const pageSize = pagination.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = calculateOffset(page, pageSize);

  return useQuery({
    queryKey: observabilityLinkKeys.list({ page, pageSize, sort, filters, search }),
    queryFn: async () => {
      let query = supabase
        .from('observability_link')
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
        data: data as ObservabilityLinkWithBackend[],
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
 * Hook to fetch a single Observability Link by ID
 */
export const useObservabilityLink = (
  id: string | undefined,
  options: { select?: string; enabled?: boolean } = {}
) => {
  const { select = '*, backend:observability_backend(kind, type, endpoint)', enabled = true } = options;

  return useQuery({
    queryKey: observabilityLinkKeys.detail(id ?? ''),
    queryFn: async () => {
      if (!id) throw new Error('Observability Link ID is required');

      const { data, error } = await supabase
        .from('observability_link')
        .select(select)
        .eq('id', id)
        .single();

      if (error) throw error;

      return data as ObservabilityLinkWithBackend;
    },
    enabled: enabled && !!id,
  });
};

/**
 * Hook to fetch Observability Links by entity
 */
export const useObservabilityLinksByEntity = (
  entityType: ObservableEntityType,
  entityId: string,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'entity_type', operator: 'eq' as const, value: entityType },
    { column: 'entity_id', operator: 'eq' as const, value: entityId },
  ];

  return useObservabilityLinks({ ...options, filters });
};

/**
 * Hook to fetch Observability Links by backend
 */
export const useObservabilityLinksByBackend = (
  backendId: string,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'backend_id', operator: 'eq' as const, value: backendId },
  ];

  return useObservabilityLinks({ ...options, filters });
};

/**
 * Hook to fetch Observability Links by entity type
 */
export const useObservabilityLinksByEntityType = (
  entityType: ObservableEntityType,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'entity_type', operator: 'eq' as const, value: entityType },
  ];

  return useObservabilityLinks({ ...options, filters });
};

/**
 * Hook to fetch all links for a run (logs, metrics, traces)
 */
export const useRunObservabilityLinks = (
  runId: string,
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['observabilityLinks', 'run', runId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('observability_link')
        .select('*, backend:observability_backend(kind, type, endpoint)')
        .eq('entity_type', 'run')
        .eq('entity_id', runId);

      if (error) throw error;

      const links = data as ObservabilityLinkWithBackend[];

      // Group by kind
      return {
        logs: links.filter((l) => l.backend?.kind === 'logs'),
        metrics: links.filter((l) => l.backend?.kind === 'metrics'),
        traces: links.filter((l) => l.backend?.kind === 'traces'),
      };
    },
    enabled: enabled && !!runId,
  });
};

/**
 * Hook to fetch all links for a deployment
 */
export const useDeploymentObservabilityLinks = (
  deploymentId: string,
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['observabilityLinks', 'deployment', deploymentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('observability_link')
        .select('*, backend:observability_backend(kind, type, endpoint)')
        .eq('entity_type', 'model_deployment')
        .eq('entity_id', deploymentId);

      if (error) throw error;

      const links = data as ObservabilityLinkWithBackend[];

      return {
        logs: links.filter((l) => l.backend?.kind === 'logs'),
        metrics: links.filter((l) => l.backend?.kind === 'metrics'),
        traces: links.filter((l) => l.backend?.kind === 'traces'),
      };
    },
    enabled: enabled && !!deploymentId,
  });
};

/**
 * Hook to build deep link URL for a link
 */
export const useBuildDeepLink = (
  linkId: string | undefined,
  timeRange?: { start: string; end: string },
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['observabilityLinks', 'deepLink', linkId, timeRange],
    queryFn: async () => {
      if (!linkId) throw new Error('Link ID is required');

      const { data, error } = await supabase
        .from('observability_link')
        .select('*, backend:observability_backend(kind, type, endpoint)')
        .eq('id', linkId)
        .single();

      if (error) throw error;

      const link = data as ObservabilityLinkWithBackend;

      // If URL is pre-defined, use it
      if (link.url) return link.url;

      // Build URL based on backend type
      const endpoint = link.backend?.endpoint;
      if (!endpoint) return null;

      const query = link.query as ObservabilityQuery | null;
      const baseUrl = new URL(endpoint);

      // TODO: Build deep link URL based on backend type
      // This is a simplified implementation

      switch (link.backend?.type) {
        case 'loki':
        case 'elastic':
          // Grafana Explore style URL
          if (query?.logql) {
            baseUrl.pathname = '/explore';
            baseUrl.searchParams.set('query', query.logql);
          }
          break;

        case 'prometheus':
        case 'victoriametrics':
          if (query?.promql) {
            baseUrl.pathname = '/graph';
            baseUrl.searchParams.set('g0.expr', query.promql);
          }
          break;

        case 'tempo':
        case 'jaeger':
          if (query?.trace_query?.service_name) {
            baseUrl.pathname = '/search';
            baseUrl.searchParams.set('service', query.trace_query.service_name);
          }
          break;
      }

      // Add time range
      if (timeRange) {
        baseUrl.searchParams.set('from', timeRange.start);
        baseUrl.searchParams.set('to', timeRange.end);
      } else if (query?.time_range?.relative) {
        baseUrl.searchParams.set('range', query.time_range.relative);
      }

      return baseUrl.toString();
    },
    enabled: enabled && !!linkId,
  });
};

// ============================================================================
// OBSERVABILITY LINK MUTATIONS
// ============================================================================

/**
 * Hook to create a new Observability Link
 */
export const useCreateObservabilityLink = (
  options: MutationOptions<ObservabilityLink, ObservabilityLinkInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ObservabilityLinkInsert) => {
      const { data, error } = await supabase
        .from('observability_link')
        .insert(input)
        .select()
        .single();

      if (error) throw error;

      return data as ObservabilityLink;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: observabilityLinkKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: ['observabilityLinks', variables.entity_type, variables.entity_id],
      });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to create Observability Link:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to update an Observability Link
 */
export const useUpdateObservabilityLink = (
  options: MutationOptions<ObservabilityLink, { id: string; data: ObservabilityLinkUpdate }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ObservabilityLinkUpdate }) => {
      const { data: result, error } = await supabase
        .from('observability_link')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return result as ObservabilityLink;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: observabilityLinkKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: observabilityLinkKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['observabilityLinks', 'deepLink', variables.id] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to update Observability Link:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to delete an Observability Link
 */
export const useDeleteObservabilityLink = (
  options: MutationOptions<void, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('observability_link')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: observabilityLinkKeys.all });
      options.onSuccess?.(undefined, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to delete Observability Link:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: (data, error, variables) => {
      options.onSettled?.(data, error, variables);
    },
  });
};

/**
 * Hook to bulk create links for an entity
 */
export const useBulkCreateObservabilityLinks = (
  options: MutationOptions<ObservabilityLink[], ObservabilityLinkInsert[]> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (links: ObservabilityLinkInsert[]) => {
      const { data, error } = await supabase
        .from('observability_link')
        .insert(links)
        .select();

      if (error) throw error;

      return data as ObservabilityLink[];
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: observabilityLinkKeys.lists() });
      // Invalidate entity-specific queries
      const entityTypes = [...new Set(variables.map((l) => l.entity_type))];
      entityTypes.forEach((type) => {
        queryClient.invalidateQueries({ queryKey: ['observabilityLinks', type] });
      });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to bulk create Observability Links:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to auto-provision links based on defaults
 */
export const useAutoProvisionObservabilityLinks = (
  options: MutationOptions<ObservabilityLink[], { entityType: ObservableEntityType; entityId: string }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entityType, entityId }: { entityType: ObservableEntityType; entityId: string }) => {
      // TODO: Implement auto-provisioning via Edge Function
      // This would:
      // 1. Get all backends with default labels matching entity
      // 2. Build appropriate queries based on entity type
      // 3. Create links for each backend kind (logs, metrics, traces)

      // Get all backends
      const { data: backends, error: backendError } = await supabase
        .from('observability_backend')
        .select('id, kind, type, default_labels');

      if (backendError) throw backendError;

      if (!backends?.length) return [];

      // Create one link per kind (take first backend of each kind)
      const linksByKind = new Map<string, typeof backends[0]>();
      backends.forEach((b) => {
        if (!linksByKind.has(b.kind)) {
          linksByKind.set(b.kind, b);
        }
      });

      const linksToCreate = Array.from(linksByKind.values()).map((backend) => ({
        backend_id: backend.id,
        entity_type: entityType,
        entity_id: entityId,
        query: {
          labels: backend.default_labels ?? {},
        },
      }));

      const { data, error } = await supabase
        .from('observability_link')
        .insert(linksToCreate)
        .select();

      if (error) throw error;

      return data as ObservabilityLink[];
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: observabilityLinkKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: ['observabilityLinks', variables.entityType, variables.entityId],
      });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to auto-provision Observability Links:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

// ============================================================================
// TODO: Future Enhancements
// ============================================================================
// TODO: Add useLinkTemplates hook for reusable link configurations
// TODO: Add useLinkValidation hook for verifying query syntax
// TODO: Add useLinkPreview hook for testing queries before saving
// TODO: Add useAutoLinking hook for automatic link creation on entity creation
// TODO: Add useLinkInheritance hook for parent-child link propagation
// TODO: Add useContextualLabels hook for dynamic label injection
// TODO: Add integration with Grafana Data Sources API
// TODO: Add support for custom URL builders per backend type
// TODO: Add link versioning and history tracking
// TODO: Add link sharing and collaboration features
