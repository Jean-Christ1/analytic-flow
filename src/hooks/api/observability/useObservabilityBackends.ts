// ============================================================================
// Observability Backends Hooks - React Query Hooks for Monitoring Integration
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
 * Types of observability data
 */
export type ObservabilityKind = 'logs' | 'metrics' | 'traces';

/**
 * Supported observability backend systems
 */
export type ObservabilityType =
  | 'loki'            // Grafana Loki for logs
  | 'elastic'         // Elasticsearch
  | 'opensearch'      // OpenSearch
  | 'prometheus'      // Prometheus for metrics
  | 'victoriametrics' // VictoriaMetrics
  | 'tempo'           // Grafana Tempo for traces
  | 'jaeger'          // Jaeger for traces
  | 'datadog';        // Datadog (all-in-one)

/**
 * Observability backend configuration
 */
export interface ObservabilityBackend {
  id: string;
  tenant_id: string;
  kind: ObservabilityKind;
  type: ObservabilityType;
  endpoint: string | null;
  auth_secret_ref: string | null;
  default_labels: Record<string, string> | null;
  created_at: string;
  updated_at: string;
}

export interface ObservabilityBackendInsert {
  tenant_id: string;
  kind: ObservabilityKind;
  type: ObservabilityType;
  endpoint?: string | null;
  auth_secret_ref?: string | null;
  default_labels?: Record<string, string> | null;
}

export interface ObservabilityBackendUpdate {
  kind?: ObservabilityKind;
  type?: ObservabilityType;
  endpoint?: string | null;
  auth_secret_ref?: string | null;
  default_labels?: Record<string, string> | null;
}

export interface ObservabilityBackendWithStatus extends ObservabilityBackend {
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  last_checked_at?: string;
  link_count?: number;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const observabilityBackendKeys = createQueryKeyFactory<string>('observabilityBackends');

// ============================================================================
// OBSERVABILITY BACKEND QUERIES
// ============================================================================

/**
 * Hook to fetch a list of Observability Backends
 */
export const useObservabilityBackends = (options: ListQueryOptions = {}) => {
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
    queryKey: observabilityBackendKeys.list({ page, pageSize, sort, filters, search }),
    queryFn: async () => {
      let query = supabase
        .from('observability_backend')
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
        query = query.order('kind').order('type');
      }

      // Apply pagination
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data as ObservabilityBackend[],
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
 * Hook to fetch a single Observability Backend by ID
 */
export const useObservabilityBackend = (
  id: string | undefined,
  options: { select?: string; enabled?: boolean } = {}
) => {
  const { select = '*', enabled = true } = options;

  return useQuery({
    queryKey: observabilityBackendKeys.detail(id ?? ''),
    queryFn: async () => {
      if (!id) throw new Error('Observability Backend ID is required');

      const { data, error } = await supabase
        .from('observability_backend')
        .select(select)
        .eq('id', id)
        .single();

      if (error) throw error;

      return data as ObservabilityBackend;
    },
    enabled: enabled && !!id,
  });
};

/**
 * Hook to fetch Observability Backends by kind
 */
export const useObservabilityBackendsByKind = (
  kind: ObservabilityKind,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'kind', operator: 'eq' as const, value: kind },
  ];

  return useObservabilityBackends({ ...options, filters });
};

/**
 * Hook to fetch Observability Backends by type
 */
export const useObservabilityBackendsByType = (
  type: ObservabilityType,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'type', operator: 'eq' as const, value: type },
  ];

  return useObservabilityBackends({ ...options, filters });
};

/**
 * Hook to fetch logs backends
 */
export const useLogsBackends = (options: ListQueryOptions = {}) => {
  return useObservabilityBackendsByKind('logs', options);
};

/**
 * Hook to fetch metrics backends
 */
export const useMetricsBackends = (options: ListQueryOptions = {}) => {
  return useObservabilityBackendsByKind('metrics', options);
};

/**
 * Hook to fetch traces backends
 */
export const useTracesBackends = (options: ListQueryOptions = {}) => {
  return useObservabilityBackendsByKind('traces', options);
};

/**
 * Hook to search Observability Backends by endpoint
 */
export const useSearchObservabilityBackends = (
  searchTerm: string,
  options: ListQueryOptions = {}
) => {
  return useObservabilityBackends({
    ...options,
    search: { column: 'endpoint', value: searchTerm },
    enabled: (options.enabled ?? true) && searchTerm.length >= 2,
  });
};

/**
 * Hook to get backend summary by kind
 */
export const useObservabilityBackendSummary = (options: { enabled?: boolean } = {}) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['observabilityBackends', 'summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('observability_backend')
        .select('kind, type');

      if (error) throw error;

      // Group by kind
      const byKind = new Map<ObservabilityKind, Map<ObservabilityType, number>>();

      data?.forEach((row) => {
        const kind = row.kind as ObservabilityKind;
        const type = row.type as ObservabilityType;

        if (!byKind.has(kind)) {
          byKind.set(kind, new Map());
        }
        const typeMap = byKind.get(kind)!;
        typeMap.set(type, (typeMap.get(type) ?? 0) + 1);
      });

      return Array.from(byKind.entries()).map(([kind, typeMap]) => ({
        kind,
        total: Array.from(typeMap.values()).reduce((sum, count) => sum + count, 0),
        byType: Array.from(typeMap.entries()).map(([type, count]) => ({ type, count })),
      }));
    },
    enabled,
  });
};

/**
 * Hook to check backend health
 */
export const useObservabilityBackendHealth = (
  id: string | undefined,
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['observabilityBackends', 'health', id],
    queryFn: async () => {
      if (!id) throw new Error('Backend ID is required');

      // Get the backend details
      const { data: backend, error } = await supabase
        .from('observability_backend')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // TODO: Implement actual health check via Edge Function
      // This would ping the endpoint and verify connectivity

      return {
        backend: backend as ObservabilityBackend,
        status: 'unknown' as const,
        lastCheckedAt: new Date().toISOString(),
        latencyMs: null as number | null,
        errorMessage: null as string | null,
      };
    },
    enabled: enabled && !!id,
    staleTime: 30000, // Consider stale after 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
};

// ============================================================================
// OBSERVABILITY BACKEND MUTATIONS
// ============================================================================

/**
 * Hook to create a new Observability Backend
 */
export const useCreateObservabilityBackend = (
  options: MutationOptions<ObservabilityBackend, ObservabilityBackendInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ObservabilityBackendInsert) => {
      const { data, error } = await supabase
        .from('observability_backend')
        .insert(input)
        .select()
        .single();

      if (error) throw error;

      return data as ObservabilityBackend;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: observabilityBackendKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['observabilityBackends', 'summary'] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to create Observability Backend:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to update an Observability Backend
 */
export const useUpdateObservabilityBackend = (
  options: MutationOptions<ObservabilityBackend, { id: string; data: ObservabilityBackendUpdate }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ObservabilityBackendUpdate }) => {
      const { data: result, error } = await supabase
        .from('observability_backend')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return result as ObservabilityBackend;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: observabilityBackendKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: observabilityBackendKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['observabilityBackends', 'health', variables.id] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to update Observability Backend:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to delete an Observability Backend
 */
export const useDeleteObservabilityBackend = (
  options: MutationOptions<void, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('observability_backend')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: observabilityBackendKeys.all });
      queryClient.invalidateQueries({ queryKey: ['observabilityBackends', 'summary'] });
      options.onSuccess?.(undefined, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to delete Observability Backend:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: (data, error, variables) => {
      options.onSettled?.(data, error, variables);
    },
  });
};

/**
 * Hook to test backend connection
 */
export const useTestObservabilityBackend = (
  options: MutationOptions<{ success: boolean; latencyMs: number; error?: string }, string> = {}
) => {
  return useMutation({
    mutationFn: async (id: string) => {
      // TODO: Implement actual connection test via Edge Function
      // This would:
      // 1. Fetch the backend details and credentials
      // 2. Ping the endpoint with a simple query
      // 3. Measure latency
      // 4. Return success/failure with details

      // Mock implementation
      await new Promise((resolve) => setTimeout(resolve, 500));

      return {
        success: true,
        latencyMs: Math.random() * 100 + 20,
      };
    },
    onSuccess: (data, variables) => {
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to test Observability Backend:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

// ============================================================================
// TODO: Future Enhancements
// ============================================================================
// TODO: Add useBackendDiscovery hook for auto-discovering available backends
// TODO: Add useBackendCredentials hook for secure credential management
// TODO: Add useBackendMetrics hook for backend performance monitoring
// TODO: Add useBackendAlerts hook for alerting on backend issues
// TODO: Add useCrossBackendQuery hook for federated queries
// TODO: Add integration with Grafana for dashboard provisioning
// TODO: Add integration with AlertManager for alert routing
// TODO: Add support for custom backend types via plugins
// TODO: Add automatic failover between redundant backends
// TODO: Add rate limiting and query cost estimation
