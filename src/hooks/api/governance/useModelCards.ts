// ============================================================================
// Model Cards Hooks - React Query Hooks for ML Model Documentation
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
 * Model Card - Standard documentation format for ML models
 * Based on Google's Model Cards paper (Mitchell et al., 2019)
 * Extended for EU AI Act compliance requirements
 */
export interface ModelCard {
  id: string;
  tenant_id: string;
  model_version_id: string;
  ai_system_id: string | null;
  summary: string | null;
  training_data: string | null;
  evaluation_data: string | null;
  performance: Record<string, unknown> | null;
  limitations: string | null;
  ethical_considerations: string | null;
  caveats: string | null;
  version: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface ModelCardInsert {
  tenant_id: string;
  model_version_id: string;
  ai_system_id?: string | null;
  summary?: string | null;
  training_data?: string | null;
  evaluation_data?: string | null;
  performance?: Record<string, unknown> | null;
  limitations?: string | null;
  ethical_considerations?: string | null;
  caveats?: string | null;
  version?: string | null;
  created_by?: string | null;
}

export interface ModelCardUpdate {
  ai_system_id?: string | null;
  summary?: string | null;
  training_data?: string | null;
  evaluation_data?: string | null;
  performance?: Record<string, unknown> | null;
  limitations?: string | null;
  ethical_considerations?: string | null;
  caveats?: string | null;
  version?: string | null;
}

export interface ModelCardWithRelations extends ModelCard {
  model_version?: {
    id: string;
    version: number;
    stage: string;
    model_id: string;
    model?: {
      id: string;
      name: string;
    };
  } | null;
  ai_system?: {
    id: string;
    name: string;
    risk_class: string;
  } | null;
  creator?: {
    id: string;
    full_name: string;
    email: string;
  } | null;
}

/**
 * Performance metrics structure
 */
export interface ModelPerformanceMetrics {
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1_score?: number;
  auc_roc?: number;
  mse?: number;
  mae?: number;
  r2?: number;
  latency_p50_ms?: number;
  latency_p99_ms?: number;
  throughput_rps?: number;
  fairness_metrics?: {
    demographic_parity?: number;
    equalized_odds?: number;
    calibration?: number;
  };
  custom_metrics?: Record<string, number>;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const modelCardKeys = createQueryKeyFactory<string>('modelCards');

// ============================================================================
// MODEL CARD QUERIES
// ============================================================================

/**
 * Hook to fetch a list of Model Cards
 */
export const useModelCards = (options: ListQueryOptions = {}) => {
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
    queryKey: modelCardKeys.list({ page, pageSize, sort, filters, search }),
    queryFn: async () => {
      let query = supabase
        .from('model_card')
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
        data: data as ModelCard[],
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
 * Hook to fetch a single Model Card by ID
 */
export const useModelCard = (
  id: string | undefined,
  options: { select?: string; enabled?: boolean } = {}
) => {
  const {
    select = `
      *,
      model_version:model_version_id(
        id, version, stage, model_id,
        model:model_id(id, name)
      ),
      ai_system:ai_system_id(id, name, risk_class),
      creator:created_by(id, full_name, email)
    `,
    enabled = true,
  } = options;

  return useQuery({
    queryKey: modelCardKeys.detail(id ?? ''),
    queryFn: async () => {
      if (!id) throw new Error('Model Card ID is required');

      const { data, error } = await supabase
        .from('model_card')
        .select(select)
        .eq('id', id)
        .single();

      if (error) throw error;

      return data as ModelCardWithRelations;
    },
    enabled: enabled && !!id,
  });
};

/**
 * Hook to fetch Model Card by model version
 */
export const useModelCardByVersion = (
  modelVersionId: string | undefined,
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['modelCards', 'version', modelVersionId],
    queryFn: async () => {
      if (!modelVersionId) throw new Error('Model Version ID is required');

      const { data, error } = await supabase
        .from('model_card')
        .select(`
          *,
          model_version:model_version_id(
            id, version, stage, model_id,
            model:model_id(id, name)
          ),
          ai_system:ai_system_id(id, name, risk_class)
        `)
        .eq('model_version_id', modelVersionId)
        .maybeSingle();

      if (error) throw error;

      return data as ModelCardWithRelations | null;
    },
    enabled: enabled && !!modelVersionId,
  });
};

/**
 * Hook to fetch Model Cards by AI System
 */
export const useModelCardsByAISystem = (
  aiSystemId: string | undefined,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'ai_system_id', operator: 'eq' as const, value: aiSystemId },
  ];

  return useModelCards({
    ...options,
    filters,
    enabled: (options.enabled ?? true) && !!aiSystemId,
  });
};

/**
 * Hook to search Model Cards
 */
export const useSearchModelCards = (
  searchTerm: string,
  options: ListQueryOptions = {}
) => {
  return useModelCards({
    ...options,
    search: { column: 'summary', value: searchTerm },
    enabled: (options.enabled ?? true) && searchTerm.length >= 2,
  });
};

/**
 * Hook to fetch Model Cards requiring updates (stale cards)
 * Cards older than 90 days should be reviewed
 */
export const useStaleModelCards = (
  daysThreshold: number = 90,
  options: ListQueryOptions = {}
) => {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

  const filters = [
    ...(options.filters ?? []),
    {
      column: 'updated_at',
      operator: 'lt' as const,
      value: thresholdDate.toISOString()
    },
  ];

  return useModelCards({ ...options, filters });
};

// ============================================================================
// MODEL CARD MUTATIONS
// ============================================================================

/**
 * Hook to create a new Model Card
 */
export const useCreateModelCard = (
  options: MutationOptions<ModelCard, ModelCardInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ModelCardInsert) => {
      const { data, error } = await supabase
        .from('model_card')
        .insert(input)
        .select()
        .single();

      if (error) throw error;

      return data as ModelCard;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: modelCardKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: ['modelCards', 'version', variables.model_version_id]
      });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to create Model Card:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to update a Model Card
 */
export const useUpdateModelCard = (
  options: MutationOptions<ModelCard, { id: string; data: ModelCardUpdate }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ModelCardUpdate }) => {
      const { data: result, error } = await supabase
        .from('model_card')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return result as ModelCard;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: modelCardKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: modelCardKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to update Model Card:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to delete a Model Card
 */
export const useDeleteModelCard = (
  options: MutationOptions<void, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('model_card')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: modelCardKeys.all });
      options.onSuccess?.(undefined, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to delete Model Card:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: (data, error, variables) => {
      options.onSettled?.(data, error, variables);
    },
  });
};

/**
 * Hook to update Model Card performance metrics
 */
export const useUpdateModelCardPerformance = (
  options: MutationOptions<ModelCard, { id: string; performance: ModelPerformanceMetrics }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, performance }: { id: string; performance: ModelPerformanceMetrics }) => {
      const { data, error } = await supabase
        .from('model_card')
        .update({ performance })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as ModelCard;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: modelCardKeys.detail(variables.id) });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to update Model Card performance:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to link Model Card to AI System
 */
export const useLinkModelCardToAISystem = (
  options: MutationOptions<ModelCard, { modelCardId: string; aiSystemId: string }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ modelCardId, aiSystemId }: { modelCardId: string; aiSystemId: string }) => {
      const { data, error } = await supabase
        .from('model_card')
        .update({ ai_system_id: aiSystemId })
        .eq('id', modelCardId)
        .select()
        .single();

      if (error) throw error;

      return data as ModelCard;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: modelCardKeys.detail(variables.modelCardId) });
      queryClient.invalidateQueries({ queryKey: ['modelCards', 'aiSystem', variables.aiSystemId] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to link Model Card to AI System:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to bump Model Card version
 */
export const useBumpModelCardVersion = (
  options: MutationOptions<ModelCard, { id: string; version: string }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, version }: { id: string; version: string }) => {
      const { data, error } = await supabase
        .from('model_card')
        .update({
          version,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as ModelCard;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: modelCardKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: modelCardKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to bump Model Card version:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

// ============================================================================
// TODO: Future Enhancements
// ============================================================================
// TODO: Add useExportModelCard hook for PDF/HTML generation
// TODO: Add useModelCardDiff hook for version comparison
// TODO: Add useModelCardTemplate hook for standard templates
// TODO: Add useBulkCreateModelCards hook for batch operations
// TODO: Add useModelCardHistory hook for version history
// TODO: Add automated performance metrics population from runs
// TODO: Add fairness metrics calculation integration
// TODO: Add model card validation against schema
// TODO: Add multi-format export (Markdown, LaTeX, HTML, PDF)
// TODO: Add collaboration features (comments, approvals)
