// ============================================================================
// Compliance Evidence Hooks - React Query Hooks for Compliance Documentation
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
 * Evidence validation status
 */
export type ComplianceEvidenceStatus =
  | 'draft'         // Evidence being prepared
  | 'submitted'     // Submitted for review
  | 'pending'       // Pending validation
  | 'validated'     // Validated and accepted
  | 'rejected'      // Rejected, needs rework
  | 'expired';      // Evidence expired, needs refresh

/**
 * Entity types that can have evidence attached
 */
export type EvidenceEntityType =
  | 'ai_system'
  | 'model_version'
  | 'deployment'
  | 'pipeline'
  | 'policy'
  | 'run'
  | 'project';

export interface ComplianceEvidence {
  id: string;
  tenant_id: string;
  control_id: string;
  entity_type: EvidenceEntityType;
  entity_id: string;
  artifact_id: string | null;
  notes: string | null;
  status: ComplianceEvidenceStatus;
  created_at: string;
  validated_at: string | null;
  validated_by: string | null;
}

export interface ComplianceEvidenceInsert {
  tenant_id: string;
  control_id: string;
  entity_type: EvidenceEntityType;
  entity_id: string;
  artifact_id?: string | null;
  notes?: string | null;
  status?: ComplianceEvidenceStatus;
}

export interface ComplianceEvidenceUpdate {
  artifact_id?: string | null;
  notes?: string | null;
  status?: ComplianceEvidenceStatus;
  validated_at?: string | null;
  validated_by?: string | null;
}

export interface ComplianceEvidenceWithRelations extends ComplianceEvidence {
  control?: {
    id: string;
    control_code: string;
    title: string;
    framework: string;
    evidence_required: string;
  } | null;
  artifact?: {
    id: string;
    name: string;
    uri: string;
    artifact_type: string;
  } | null;
  validator?: {
    id: string;
    full_name: string;
    email: string;
  } | null;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const complianceEvidenceKeys = createQueryKeyFactory<string>('complianceEvidence');

// ============================================================================
// COMPLIANCE EVIDENCE QUERIES
// ============================================================================

/**
 * Hook to fetch a list of Compliance Evidence
 */
export const useComplianceEvidence = (options: ListQueryOptions = {}) => {
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
    queryKey: complianceEvidenceKeys.list({ page, pageSize, sort, filters, search }),
    queryFn: async () => {
      let query = supabase
        .from('compliance_evidence')
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
        query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data as ComplianceEvidence[],
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
 * Hook to fetch a single Compliance Evidence by ID
 */
export const useComplianceEvidenceById = (
  id: string | undefined,
  options: { select?: string; enabled?: boolean } = {}
) => {
  const {
    select = `
      *,
      control:control_id(id, control_code, title, framework, evidence_required),
      artifact:artifact_id(id, name, uri, artifact_type),
      validator:validated_by(id, full_name, email)
    `,
    enabled = true,
  } = options;

  return useQuery({
    queryKey: complianceEvidenceKeys.detail(id ?? ''),
    queryFn: async () => {
      if (!id) throw new Error('Compliance Evidence ID is required');

      const { data, error } = await supabase
        .from('compliance_evidence')
        .select(select)
        .eq('id', id)
        .single();

      if (error) throw error;

      return data as ComplianceEvidenceWithRelations;
    },
    enabled: enabled && !!id,
  });
};

/**
 * Hook to fetch Evidence by control
 */
export const useEvidenceByControl = (
  controlId: string | undefined,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'control_id', operator: 'eq' as const, value: controlId },
  ];

  return useComplianceEvidence({
    ...options,
    filters,
    enabled: (options.enabled ?? true) && !!controlId,
  });
};

/**
 * Hook to fetch Evidence by entity
 */
export const useEvidenceByEntity = (
  entityType: EvidenceEntityType,
  entityId: string | undefined,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'entity_type', operator: 'eq' as const, value: entityType },
    { column: 'entity_id', operator: 'eq' as const, value: entityId },
  ];

  return useComplianceEvidence({
    ...options,
    filters,
    enabled: (options.enabled ?? true) && !!entityId,
  });
};

/**
 * Hook to fetch Evidence by status
 */
export const useEvidenceByStatus = (
  status: ComplianceEvidenceStatus,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'status', operator: 'eq' as const, value: status },
  ];

  return useComplianceEvidence({ ...options, filters });
};

/**
 * Hook to fetch pending evidence (awaiting validation)
 */
export const usePendingEvidence = (options: ListQueryOptions = {}) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'status', operator: 'in' as const, value: ['submitted', 'pending'] },
  ];

  return useComplianceEvidence({ ...options, filters });
};

/**
 * Hook to fetch validated evidence
 */
export const useValidatedEvidence = (options: ListQueryOptions = {}) => {
  return useEvidenceByStatus('validated', options);
};

/**
 * Hook to fetch rejected evidence (needs rework)
 */
export const useRejectedEvidence = (options: ListQueryOptions = {}) => {
  return useEvidenceByStatus('rejected', options);
};

/**
 * Hook to get evidence summary for an entity
 */
export const useEvidenceSummary = (
  entityType: EvidenceEntityType,
  entityId: string | undefined,
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['complianceEvidence', 'summary', entityType, entityId],
    queryFn: async () => {
      if (!entityId) throw new Error('Entity ID is required');

      const { data, error } = await supabase
        .from('compliance_evidence')
        .select(`
          id,
          status,
          control:control_id(framework)
        `)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId);

      if (error) throw error;

      // Calculate summary statistics
      const summary = {
        total: data?.length ?? 0,
        byStatus: {
          draft: 0,
          submitted: 0,
          pending: 0,
          validated: 0,
          rejected: 0,
          expired: 0,
        },
        byFramework: {} as Record<string, { total: number; validated: number }>,
        completionRate: 0,
      };

      data?.forEach((evidence: {
        status: ComplianceEvidenceStatus;
        control: { framework: string } | null
      }) => {
        summary.byStatus[evidence.status]++;

        const framework = evidence.control?.framework ?? 'unknown';
        if (!summary.byFramework[framework]) {
          summary.byFramework[framework] = { total: 0, validated: 0 };
        }
        summary.byFramework[framework].total++;
        if (evidence.status === 'validated') {
          summary.byFramework[framework].validated++;
        }
      });

      if (summary.total > 0) {
        summary.completionRate = (summary.byStatus.validated / summary.total) * 100;
      }

      return summary;
    },
    enabled: enabled && !!entityId,
  });
};

/**
 * Hook to check compliance gaps for an entity
 */
export const useComplianceGaps = (
  entityType: EvidenceEntityType,
  entityId: string | undefined,
  framework?: string,
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['complianceEvidence', 'gaps', entityType, entityId, framework],
    queryFn: async () => {
      if (!entityId) throw new Error('Entity ID is required');

      // Get all required controls
      let controlsQuery = supabase
        .from('compliance_control')
        .select('id, control_code, title, framework, evidence_required');

      if (framework) {
        controlsQuery = controlsQuery.eq('framework', framework);
      }

      const { data: controls, error: controlsError } = await controlsQuery;

      if (controlsError) throw controlsError;

      // Get existing evidence for this entity
      const { data: evidence, error: evidenceError } = await supabase
        .from('compliance_evidence')
        .select('control_id, status')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId);

      if (evidenceError) throw evidenceError;

      // Build evidence map
      const evidenceMap = new Map<string, ComplianceEvidenceStatus>();
      evidence?.forEach((e) => {
        evidenceMap.set(e.control_id, e.status as ComplianceEvidenceStatus);
      });

      // Identify gaps
      const gaps = controls?.filter((control) => {
        const status = evidenceMap.get(control.id);
        return !status || status === 'rejected' || status === 'expired';
      }) ?? [];

      return {
        totalControls: controls?.length ?? 0,
        coveredControls: controls?.length ?? 0 - gaps.length,
        gaps: gaps.map((control) => ({
          control,
          status: evidenceMap.get(control.id) ?? 'not_started',
        })),
      };
    },
    enabled: enabled && !!entityId,
  });
};

// ============================================================================
// COMPLIANCE EVIDENCE MUTATIONS
// ============================================================================

/**
 * Hook to create new Compliance Evidence
 */
export const useCreateComplianceEvidence = (
  options: MutationOptions<ComplianceEvidence, ComplianceEvidenceInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ComplianceEvidenceInsert) => {
      const { data, error } = await supabase
        .from('compliance_evidence')
        .insert(input)
        .select()
        .single();

      if (error) throw error;

      return data as ComplianceEvidence;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: complianceEvidenceKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: ['complianceEvidence', 'summary', variables.entity_type, variables.entity_id]
      });
      queryClient.invalidateQueries({
        queryKey: ['complianceEvidence', 'gaps', variables.entity_type, variables.entity_id]
      });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to create Compliance Evidence:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to update Compliance Evidence
 */
export const useUpdateComplianceEvidence = (
  options: MutationOptions<ComplianceEvidence, { id: string; data: ComplianceEvidenceUpdate }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ComplianceEvidenceUpdate }) => {
      const { data: result, error } = await supabase
        .from('compliance_evidence')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return result as ComplianceEvidence;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: complianceEvidenceKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: complianceEvidenceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['complianceEvidence', 'summary'] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to update Compliance Evidence:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to delete Compliance Evidence
 */
export const useDeleteComplianceEvidence = (
  options: MutationOptions<void, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('compliance_evidence')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: complianceEvidenceKeys.all });
      queryClient.invalidateQueries({ queryKey: ['complianceEvidence', 'summary'] });
      queryClient.invalidateQueries({ queryKey: ['complianceEvidence', 'gaps'] });
      options.onSuccess?.(undefined, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to delete Compliance Evidence:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: (data, error, variables) => {
      options.onSettled?.(data, error, variables);
    },
  });
};

/**
 * Hook to submit evidence for validation
 */
export const useSubmitEvidence = (
  options: MutationOptions<ComplianceEvidence, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('compliance_evidence')
        .update({ status: 'submitted' as ComplianceEvidenceStatus })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as ComplianceEvidence;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: complianceEvidenceKeys.detail(variables) });
      queryClient.invalidateQueries({ queryKey: complianceEvidenceKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to submit evidence:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to validate evidence
 */
export const useValidateEvidence = (
  options: MutationOptions<ComplianceEvidence, { id: string; validatorId: string }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, validatorId }: { id: string; validatorId: string }) => {
      const { data, error } = await supabase
        .from('compliance_evidence')
        .update({
          status: 'validated' as ComplianceEvidenceStatus,
          validated_at: new Date().toISOString(),
          validated_by: validatorId,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as ComplianceEvidence;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: complianceEvidenceKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: complianceEvidenceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['complianceEvidence', 'summary'] });
      queryClient.invalidateQueries({ queryKey: ['complianceEvidence', 'gaps'] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to validate evidence:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to reject evidence
 */
export const useRejectEvidence = (
  options: MutationOptions<ComplianceEvidence, { id: string; reason: string }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { data, error } = await supabase
        .from('compliance_evidence')
        .update({
          status: 'rejected' as ComplianceEvidenceStatus,
          notes: reason,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as ComplianceEvidence;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: complianceEvidenceKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: complianceEvidenceKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to reject evidence:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to attach artifact to evidence
 */
export const useAttachArtifact = (
  options: MutationOptions<ComplianceEvidence, { evidenceId: string; artifactId: string }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ evidenceId, artifactId }: { evidenceId: string; artifactId: string }) => {
      const { data, error } = await supabase
        .from('compliance_evidence')
        .update({ artifact_id: artifactId })
        .eq('id', evidenceId)
        .select()
        .single();

      if (error) throw error;

      return data as ComplianceEvidence;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: complianceEvidenceKeys.detail(variables.evidenceId) });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to attach artifact:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to bulk create evidence for multiple controls
 */
export const useBulkCreateEvidence = (
  options: MutationOptions<ComplianceEvidence[], ComplianceEvidenceInsert[]> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (evidenceList: ComplianceEvidenceInsert[]) => {
      const { data, error } = await supabase
        .from('compliance_evidence')
        .insert(evidenceList)
        .select();

      if (error) throw error;

      return data as ComplianceEvidence[];
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: complianceEvidenceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['complianceEvidence', 'summary'] });
      queryClient.invalidateQueries({ queryKey: ['complianceEvidence', 'gaps'] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to bulk create evidence:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

// ============================================================================
// TODO: Future Enhancements
// ============================================================================
// TODO: Add useEvidenceExport hook for compliance report generation
// TODO: Add useEvidenceHistory hook for audit trail
// TODO: Add useEvidenceReminders hook for expiration notifications
// TODO: Add useBulkValidateEvidence hook for batch validation
// TODO: Add useEvidenceTemplates hook for reusable evidence patterns
// TODO: Add automated evidence collection from pipelines
// TODO: Add integration with document management systems
// TODO: Add digital signature support for validations
// TODO: Add evidence versioning and comparison
// TODO: Add evidence linking (evidence dependencies)
