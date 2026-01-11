// ============================================================================
// Risk Assessments Hooks - React Query Hooks for AI Risk Management
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
 * Residual risk level after mitigations
 */
export type ResidualRiskLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Risk assessment decision outcomes
 */
export type RiskDecision =
  | 'approved'
  | 'approved_with_conditions'
  | 'requires_mitigation'
  | 'rejected'
  | 'pending_review';

/**
 * Hazard identification structure
 */
export interface Hazard {
  id: string;
  category: string; // bias, privacy, security, safety, transparency, etc.
  description: string;
  likelihood: 'rare' | 'unlikely' | 'possible' | 'likely' | 'almost_certain';
  impact: 'negligible' | 'minor' | 'moderate' | 'major' | 'catastrophic';
  affected_groups?: string[];
  data_sources?: string[];
}

/**
 * Mitigation measure structure
 */
export interface Mitigation {
  id: string;
  hazard_id: string;
  description: string;
  type: 'technical' | 'procedural' | 'organizational';
  status: 'planned' | 'in_progress' | 'implemented' | 'verified';
  effectiveness: 'low' | 'medium' | 'high';
  owner?: string;
  due_date?: string;
}

export interface RiskAssessment {
  id: string;
  tenant_id: string;
  ai_system_id: string;
  methodology: string | null;
  hazards: Hazard[] | null;
  mitigations: Mitigation[] | null;
  residual_risk: ResidualRiskLevel | null;
  decision: RiskDecision | null;
  assessor_user_id: string | null;
  assessed_at: string | null;
  next_review_at: string | null;
}

export interface RiskAssessmentInsert {
  tenant_id: string;
  ai_system_id: string;
  methodology?: string | null;
  hazards?: Hazard[] | null;
  mitigations?: Mitigation[] | null;
  residual_risk?: ResidualRiskLevel | null;
  decision?: RiskDecision | null;
  assessor_user_id?: string | null;
  assessed_at?: string | null;
  next_review_at?: string | null;
}

export interface RiskAssessmentUpdate {
  methodology?: string | null;
  hazards?: Hazard[] | null;
  mitigations?: Mitigation[] | null;
  residual_risk?: ResidualRiskLevel | null;
  decision?: RiskDecision | null;
  assessor_user_id?: string | null;
  assessed_at?: string | null;
  next_review_at?: string | null;
}

export interface RiskAssessmentWithRelations extends RiskAssessment {
  ai_system?: {
    id: string;
    name: string;
    risk_class: string;
    status: string;
    project_id: string;
  } | null;
  assessor?: {
    id: string;
    full_name: string;
    email: string;
  } | null;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const riskAssessmentKeys = createQueryKeyFactory<string>('riskAssessments');

// ============================================================================
// RISK ASSESSMENT QUERIES
// ============================================================================

/**
 * Hook to fetch a list of Risk Assessments
 */
export const useRiskAssessments = (options: ListQueryOptions = {}) => {
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
    queryKey: riskAssessmentKeys.list({ page, pageSize, sort, filters, search }),
    queryFn: async () => {
      let query = supabase
        .from('risk_assessment')
        .select(select, { count: 'exact' });

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
        query = query.order('assessed_at', { ascending: false });
      }

      // Apply pagination
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data as RiskAssessment[],
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
 * Hook to fetch a single Risk Assessment by ID
 */
export const useRiskAssessment = (
  id: string | undefined,
  options: { select?: string; enabled?: boolean } = {}
) => {
  const {
    select = `
      *,
      ai_system:ai_system_id(id, name, risk_class, status, project_id),
      assessor:assessor_user_id(id, full_name, email)
    `,
    enabled = true,
  } = options;

  return useQuery({
    queryKey: riskAssessmentKeys.detail(id ?? ''),
    queryFn: async () => {
      if (!id) throw new Error('Risk Assessment ID is required');

      const { data, error } = await supabase
        .from('risk_assessment')
        .select(select)
        .eq('id', id)
        .single();

      if (error) throw error;

      return data as RiskAssessmentWithRelations;
    },
    enabled: enabled && !!id,
  });
};

/**
 * Hook to fetch Risk Assessments by AI System
 */
export const useRiskAssessmentsByAISystem = (
  aiSystemId: string | undefined,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'ai_system_id', operator: 'eq' as const, value: aiSystemId },
  ];

  return useRiskAssessments({
    ...options,
    filters,
    enabled: (options.enabled ?? true) && !!aiSystemId,
  });
};

/**
 * Hook to fetch the latest Risk Assessment for an AI System
 */
export const useLatestRiskAssessment = (
  aiSystemId: string | undefined,
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['riskAssessments', 'latest', aiSystemId],
    queryFn: async () => {
      if (!aiSystemId) throw new Error('AI System ID is required');

      const { data, error } = await supabase
        .from('risk_assessment')
        .select(`
          *,
          ai_system:ai_system_id(id, name, risk_class, status),
          assessor:assessor_user_id(id, full_name, email)
        `)
        .eq('ai_system_id', aiSystemId)
        .order('assessed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      return data as RiskAssessmentWithRelations | null;
    },
    enabled: enabled && !!aiSystemId,
  });
};

/**
 * Hook to fetch Risk Assessments by residual risk level
 */
export const useRiskAssessmentsByRiskLevel = (
  riskLevel: ResidualRiskLevel,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'residual_risk', operator: 'eq' as const, value: riskLevel },
  ];

  return useRiskAssessments({ ...options, filters });
};

/**
 * Hook to fetch Risk Assessments requiring review
 * Assessments with next_review_at in the past or within 30 days
 */
export const useRiskAssessmentsRequiringReview = (
  daysThreshold: number = 30,
  options: ListQueryOptions = {}
) => {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

  const filters = [
    ...(options.filters ?? []),
    {
      column: 'next_review_at',
      operator: 'lte' as const,
      value: thresholdDate.toISOString()
    },
  ];

  return useRiskAssessments({ ...options, filters });
};

/**
 * Hook to fetch Risk Assessments by decision
 */
export const useRiskAssessmentsByDecision = (
  decision: RiskDecision,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'decision', operator: 'eq' as const, value: decision },
  ];

  return useRiskAssessments({ ...options, filters });
};

/**
 * Hook to get risk assessment statistics
 */
export const useRiskAssessmentStats = (
  projectId?: string,
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['riskAssessments', 'stats', projectId],
    queryFn: async () => {
      // Build query based on project filter
      let query = supabase
        .from('risk_assessment')
        .select(`
          id,
          residual_risk,
          decision,
          next_review_at,
          ai_system:ai_system_id(project_id)
        `);

      const { data, error } = await query;

      if (error) throw error;

      // Filter by project if specified
      let filteredData = data;
      if (projectId) {
        filteredData = data?.filter(
          (ra: { ai_system: { project_id: string } | null }) =>
            ra.ai_system?.project_id === projectId
        );
      }

      // Calculate statistics
      const stats = {
        total: filteredData?.length ?? 0,
        byRiskLevel: {
          low: 0,
          medium: 0,
          high: 0,
          critical: 0,
        },
        byDecision: {
          approved: 0,
          approved_with_conditions: 0,
          requires_mitigation: 0,
          rejected: 0,
          pending_review: 0,
        },
        requiresReview: 0,
        overdue: 0,
      };

      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      filteredData?.forEach((assessment) => {
        if (assessment.residual_risk) {
          stats.byRiskLevel[assessment.residual_risk as ResidualRiskLevel]++;
        }
        if (assessment.decision) {
          stats.byDecision[assessment.decision as RiskDecision]++;
        }
        if (assessment.next_review_at) {
          const reviewDate = new Date(assessment.next_review_at);
          if (reviewDate <= now) {
            stats.overdue++;
          } else if (reviewDate <= thirtyDaysFromNow) {
            stats.requiresReview++;
          }
        }
      });

      return stats;
    },
    enabled,
  });
};

// ============================================================================
// RISK ASSESSMENT MUTATIONS
// ============================================================================

/**
 * Hook to create a new Risk Assessment
 */
export const useCreateRiskAssessment = (
  options: MutationOptions<RiskAssessment, RiskAssessmentInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RiskAssessmentInsert) => {
      const { data, error } = await supabase
        .from('risk_assessment')
        .insert(input)
        .select()
        .single();

      if (error) throw error;

      return data as RiskAssessment;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: riskAssessmentKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: ['riskAssessments', 'aiSystem', variables.ai_system_id]
      });
      queryClient.invalidateQueries({ queryKey: ['riskAssessments', 'stats'] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to create Risk Assessment:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to update a Risk Assessment
 */
export const useUpdateRiskAssessment = (
  options: MutationOptions<RiskAssessment, { id: string; data: RiskAssessmentUpdate }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: RiskAssessmentUpdate }) => {
      const { data: result, error } = await supabase
        .from('risk_assessment')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return result as RiskAssessment;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: riskAssessmentKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: riskAssessmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['riskAssessments', 'stats'] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to update Risk Assessment:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to delete a Risk Assessment
 */
export const useDeleteRiskAssessment = (
  options: MutationOptions<void, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('risk_assessment')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: riskAssessmentKeys.all });
      queryClient.invalidateQueries({ queryKey: ['riskAssessments', 'stats'] });
      options.onSuccess?.(undefined, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to delete Risk Assessment:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: (data, error, variables) => {
      options.onSettled?.(data, error, variables);
    },
  });
};

/**
 * Hook to add a hazard to a Risk Assessment
 */
export const useAddHazard = (
  options: MutationOptions<RiskAssessment, { assessmentId: string; hazard: Hazard }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assessmentId, hazard }: { assessmentId: string; hazard: Hazard }) => {
      // Fetch current assessment
      const { data: current, error: fetchError } = await supabase
        .from('risk_assessment')
        .select('hazards')
        .eq('id', assessmentId)
        .single();

      if (fetchError) throw fetchError;

      const currentHazards = (current.hazards as Hazard[]) ?? [];
      const updatedHazards = [...currentHazards, hazard];

      const { data, error } = await supabase
        .from('risk_assessment')
        .update({ hazards: updatedHazards })
        .eq('id', assessmentId)
        .select()
        .single();

      if (error) throw error;

      return data as RiskAssessment;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: riskAssessmentKeys.detail(variables.assessmentId) });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to add hazard:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to add a mitigation to a Risk Assessment
 */
export const useAddMitigation = (
  options: MutationOptions<RiskAssessment, { assessmentId: string; mitigation: Mitigation }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assessmentId, mitigation }: { assessmentId: string; mitigation: Mitigation }) => {
      // Fetch current assessment
      const { data: current, error: fetchError } = await supabase
        .from('risk_assessment')
        .select('mitigations')
        .eq('id', assessmentId)
        .single();

      if (fetchError) throw fetchError;

      const currentMitigations = (current.mitigations as Mitigation[]) ?? [];
      const updatedMitigations = [...currentMitigations, mitigation];

      const { data, error } = await supabase
        .from('risk_assessment')
        .update({ mitigations: updatedMitigations })
        .eq('id', assessmentId)
        .select()
        .single();

      if (error) throw error;

      return data as RiskAssessment;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: riskAssessmentKeys.detail(variables.assessmentId) });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to add mitigation:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to finalize and submit a Risk Assessment
 */
export const useFinalizeRiskAssessment = (
  options: MutationOptions<RiskAssessment, { id: string; decision: RiskDecision; residualRisk: ResidualRiskLevel }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      decision,
      residualRisk
    }: {
      id: string;
      decision: RiskDecision;
      residualRisk: ResidualRiskLevel
    }) => {
      // Calculate next review date based on risk level
      const reviewIntervals: Record<ResidualRiskLevel, number> = {
        critical: 30,  // 30 days
        high: 90,      // 90 days
        medium: 180,   // 6 months
        low: 365,      // 1 year
      };

      const nextReviewAt = new Date();
      nextReviewAt.setDate(nextReviewAt.getDate() + reviewIntervals[residualRisk]);

      const { data, error } = await supabase
        .from('risk_assessment')
        .update({
          decision,
          residual_risk: residualRisk,
          assessed_at: new Date().toISOString(),
          next_review_at: nextReviewAt.toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as RiskAssessment;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: riskAssessmentKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: riskAssessmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['riskAssessments', 'stats'] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to finalize Risk Assessment:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to schedule next review
 */
export const useScheduleReview = (
  options: MutationOptions<RiskAssessment, { id: string; nextReviewAt: string }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, nextReviewAt }: { id: string; nextReviewAt: string }) => {
      const { data, error } = await supabase
        .from('risk_assessment')
        .update({ next_review_at: nextReviewAt })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as RiskAssessment;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: riskAssessmentKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['riskAssessments', 'stats'] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to schedule review:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

// ============================================================================
// TODO: Future Enhancements
// ============================================================================
// TODO: Add useRiskMatrix hook for visual risk matrix generation
// TODO: Add useRiskAssessmentTemplate hook for standard methodologies
// TODO: Add useExportRiskAssessment hook for report generation
// TODO: Add useBulkAssessment hook for batch risk evaluations
// TODO: Add useRiskTrend hook for tracking risk changes over time
// TODO: Add automated hazard suggestion based on AI system type
// TODO: Add integration with external risk management frameworks
// TODO: Add real-time risk monitoring and alerting
// TODO: Add compliance mapping (ISO 31000, NIST RMF)
// TODO: Add multi-reviewer workflow support
