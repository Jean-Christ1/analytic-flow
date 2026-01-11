// ============================================================================
// AI Systems Hooks - React Query Hooks for EU AI Act Compliance
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
 * EU AI Act Risk Classification
 * - unacceptable: Banned (social scoring, real-time biometric ID, etc.)
 * - high: Strict compliance requirements (credit scoring, recruitment, etc.)
 * - limited: Transparency obligations (chatbots, emotion recognition)
 * - minimal: No restrictions (spam filters, video games)
 */
export type AIRiskClass = 'unacceptable' | 'high' | 'limited' | 'minimal';

/**
 * AI System lifecycle status
 */
export type AISystemStatus =
  | 'draft'
  | 'under_review'
  | 'approved'
  | 'deployed'
  | 'monitoring'
  | 'deprecated'
  | 'decommissioned';

export interface AISystem {
  id: string;
  tenant_id: string;
  project_id: string;
  name: string;
  description: string | null;
  risk_class: AIRiskClass;
  intended_purpose: string | null;
  users_affected: string | null;
  deployment_context: string | null;
  owner_user_id: string | null;
  status: AISystemStatus;
  created_at: string;
  updated_at: string;
}

export interface AISystemInsert {
  tenant_id: string;
  project_id: string;
  name: string;
  description?: string | null;
  risk_class?: AIRiskClass;
  intended_purpose?: string | null;
  users_affected?: string | null;
  deployment_context?: string | null;
  owner_user_id?: string | null;
  status?: AISystemStatus;
}

export interface AISystemUpdate {
  name?: string;
  description?: string | null;
  risk_class?: AIRiskClass;
  intended_purpose?: string | null;
  users_affected?: string | null;
  deployment_context?: string | null;
  owner_user_id?: string | null;
  status?: AISystemStatus;
}

export interface AISystemWithRelations extends AISystem {
  project?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  owner?: {
    id: string;
    full_name: string;
    email: string;
  } | null;
  risk_assessments?: Array<{
    id: string;
    residual_risk: string;
    assessed_at: string;
  }>;
  model_cards?: Array<{
    id: string;
    model_version_id: string;
    version: string;
  }>;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const aiSystemKeys = createQueryKeyFactory<string>('aiSystems');

// ============================================================================
// AI SYSTEM QUERIES
// ============================================================================

/**
 * Hook to fetch a list of AI Systems
 * Supports pagination, sorting, filtering and search
 */
export const useAISystems = (options: ListQueryOptions = {}) => {
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
    queryKey: aiSystemKeys.list({ page, pageSize, sort, filters, search }),
    queryFn: async () => {
      let query = supabase
        .from('ai_system')
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
        data: data as AISystem[],
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
 * Hook to fetch a single AI System by ID
 */
export const useAISystem = (
  id: string | undefined,
  options: { select?: string; enabled?: boolean } = {}
) => {
  const {
    select = `
      *,
      project:project_id(id, name, slug),
      owner:owner_user_id(id, full_name, email)
    `,
    enabled = true,
  } = options;

  return useQuery({
    queryKey: aiSystemKeys.detail(id ?? ''),
    queryFn: async () => {
      if (!id) throw new Error('AI System ID is required');

      const { data, error } = await supabase
        .from('ai_system')
        .select(select)
        .eq('id', id)
        .single();

      if (error) throw error;

      return data as AISystemWithRelations;
    },
    enabled: enabled && !!id,
  });
};

/**
 * Hook to fetch AI Systems by project
 */
export const useAISystemsByProject = (
  projectId: string | undefined,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'project_id', operator: 'eq' as const, value: projectId },
  ];

  return useAISystems({
    ...options,
    filters,
    enabled: (options.enabled ?? true) && !!projectId,
  });
};

/**
 * Hook to fetch AI Systems by risk class
 * Useful for compliance dashboards showing high-risk systems
 */
export const useAISystemsByRiskClass = (
  riskClass: AIRiskClass,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'risk_class', operator: 'eq' as const, value: riskClass },
  ];

  return useAISystems({ ...options, filters });
};

/**
 * Hook to fetch high-risk AI Systems (EU AI Act requirement)
 */
export const useHighRiskAISystems = (options: ListQueryOptions = {}) => {
  return useAISystemsByRiskClass('high', options);
};

/**
 * Hook to fetch AI Systems by status
 */
export const useAISystemsByStatus = (
  status: AISystemStatus,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'status', operator: 'eq' as const, value: status },
  ];

  return useAISystems({ ...options, filters });
};

/**
 * Hook to search AI Systems
 */
export const useSearchAISystems = (
  searchTerm: string,
  options: ListQueryOptions = {}
) => {
  return useAISystems({
    ...options,
    search: { column: 'name', value: searchTerm },
    enabled: (options.enabled ?? true) && searchTerm.length >= 2,
  });
};

/**
 * Hook to fetch AI System compliance summary
 * Returns aggregated compliance status for dashboards
 */
export const useAISystemComplianceSummary = (
  projectId?: string,
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['aiSystems', 'complianceSummary', projectId],
    queryFn: async () => {
      let query = supabase
        .from('ai_system')
        .select('id, risk_class, status');

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calculate compliance summary
      const summary = {
        total: data?.length ?? 0,
        byRiskClass: {
          unacceptable: 0,
          high: 0,
          limited: 0,
          minimal: 0,
        },
        byStatus: {
          draft: 0,
          under_review: 0,
          approved: 0,
          deployed: 0,
          monitoring: 0,
          deprecated: 0,
          decommissioned: 0,
        },
        requiresReview: 0,
        compliant: 0,
      };

      data?.forEach((system) => {
        summary.byRiskClass[system.risk_class as AIRiskClass]++;
        summary.byStatus[system.status as AISystemStatus]++;

        // High-risk systems not yet approved require review
        if (system.risk_class === 'high' &&
            ['draft', 'under_review'].includes(system.status)) {
          summary.requiresReview++;
        }

        // Systems that have passed review are compliant
        if (['approved', 'deployed', 'monitoring'].includes(system.status)) {
          summary.compliant++;
        }
      });

      return summary;
    },
    enabled,
  });
};

// ============================================================================
// AI SYSTEM MUTATIONS
// ============================================================================

/**
 * Hook to create a new AI System
 */
export const useCreateAISystem = (
  options: MutationOptions<AISystem, AISystemInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AISystemInsert) => {
      const { data, error } = await supabase
        .from('ai_system')
        .insert(input)
        .select()
        .single();

      if (error) throw error;

      return data as AISystem;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: aiSystemKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to create AI System:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to update an AI System
 */
export const useUpdateAISystem = (
  options: MutationOptions<AISystem, { id: string; data: AISystemUpdate }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AISystemUpdate }) => {
      const { data: result, error } = await supabase
        .from('ai_system')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return result as AISystem;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: aiSystemKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: aiSystemKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to update AI System:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to delete an AI System
 */
export const useDeleteAISystem = (
  options: MutationOptions<void, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ai_system')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: aiSystemKeys.all });
      options.onSuccess?.(undefined, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to delete AI System:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: (data, error, variables) => {
      options.onSettled?.(data, error, variables);
    },
  });
};

/**
 * Hook to transition AI System status
 */
export const useTransitionAISystemStatus = (
  options: MutationOptions<AISystem, { id: string; status: AISystemStatus }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AISystemStatus }) => {
      const { data, error } = await supabase
        .from('ai_system')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as AISystem;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: aiSystemKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: aiSystemKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['aiSystems', 'complianceSummary'] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to transition AI System status:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to classify AI System risk
 * Updates risk class and logs the classification decision
 */
export const useClassifyAISystemRisk = (
  options: MutationOptions<AISystem, { id: string; riskClass: AIRiskClass }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, riskClass }: { id: string; riskClass: AIRiskClass }) => {
      const { data, error } = await supabase
        .from('ai_system')
        .update({ risk_class: riskClass })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as AISystem;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: aiSystemKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: aiSystemKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['aiSystems', 'complianceSummary'] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to classify AI System risk:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

// ============================================================================
// TODO: Future Enhancements
// ============================================================================
// TODO: Add useAISystemAuditTrail hook for compliance audit logs
// TODO: Add useAISystemExport hook for generating compliance reports
// TODO: Add useAISystemNotifications hook for compliance deadline alerts
// TODO: Add useBulkUpdateAISystems hook for batch operations
// TODO: Add useAISystemDependencies hook for model/deployment tracking
// TODO: Add useAISystemTimeline hook for status history visualization
// TODO: Add integration with external compliance management systems
// TODO: Add automated risk classification suggestion based on intended purpose
// TODO: Add EU AI Act Article reference linking for each risk class
// TODO: Add multi-language support for compliance documentation
