// ============================================================================
// Compliance Controls Hooks - React Query Hooks for Regulatory Compliance
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
 * Supported compliance frameworks
 */
export type ComplianceFramework =
  | 'eu_ai_act'      // EU AI Act (2024)
  | 'gdpr'           // General Data Protection Regulation
  | 'ccpa'           // California Consumer Privacy Act
  | 'iso27001'       // Information Security Management
  | 'iso23894'       // AI Risk Management
  | 'iso42001'       // AI Management System
  | 'nist_ai_rmf'    // NIST AI Risk Management Framework
  | 'soc2'           // SOC 2 Type II
  | 'hipaa'          // Health Insurance Portability and Accountability Act
  | 'pci_dss'        // Payment Card Industry Data Security Standard
  | 'custom';        // Custom/Internal Framework

/**
 * Compliance control structure
 */
export interface ComplianceControl {
  id: string;
  tenant_id: string;
  framework: ComplianceFramework;
  control_code: string;
  title: string | null;
  description: string | null;
  evidence_required: string | null;
  created_at: string;
}

export interface ComplianceControlInsert {
  tenant_id: string;
  framework: ComplianceFramework;
  control_code: string;
  title?: string | null;
  description?: string | null;
  evidence_required?: string | null;
}

export interface ComplianceControlUpdate {
  framework?: ComplianceFramework;
  control_code?: string;
  title?: string | null;
  description?: string | null;
  evidence_required?: string | null;
}

export interface ComplianceControlWithEvidence extends ComplianceControl {
  evidence_count?: number;
  validated_count?: number;
  pending_count?: number;
}

// ============================================================================
// PREDEFINED CONTROLS FOR EU AI ACT
// ============================================================================

/**
 * EU AI Act control definitions
 * Based on EU AI Act Articles for high-risk AI systems
 */
export const EU_AI_ACT_CONTROLS: Omit<ComplianceControlInsert, 'tenant_id'>[] = [
  {
    framework: 'eu_ai_act',
    control_code: 'AIA-9',
    title: 'Risk Management System',
    description: 'Establish and maintain a risk management system throughout the AI system lifecycle.',
    evidence_required: 'Risk assessment documentation, monitoring reports',
  },
  {
    framework: 'eu_ai_act',
    control_code: 'AIA-10',
    title: 'Data Governance',
    description: 'Training, validation and testing data shall meet quality criteria.',
    evidence_required: 'Data lineage, bias analysis, data quality reports',
  },
  {
    framework: 'eu_ai_act',
    control_code: 'AIA-11',
    title: 'Technical Documentation',
    description: 'Draw up technical documentation demonstrating compliance.',
    evidence_required: 'Model cards, technical specifications, design documents',
  },
  {
    framework: 'eu_ai_act',
    control_code: 'AIA-12',
    title: 'Record-Keeping',
    description: 'Automatic logging of events during system operation.',
    evidence_required: 'Audit logs, system logs, access records',
  },
  {
    framework: 'eu_ai_act',
    control_code: 'AIA-13',
    title: 'Transparency',
    description: 'Design to enable users to interpret outputs appropriately.',
    evidence_required: 'Explainability reports, user documentation',
  },
  {
    framework: 'eu_ai_act',
    control_code: 'AIA-14',
    title: 'Human Oversight',
    description: 'Enable effective oversight by natural persons.',
    evidence_required: 'Human-in-the-loop procedures, override mechanisms',
  },
  {
    framework: 'eu_ai_act',
    control_code: 'AIA-15',
    title: 'Accuracy and Robustness',
    description: 'Achieve appropriate levels of accuracy, robustness, and cybersecurity.',
    evidence_required: 'Performance metrics, security assessments',
  },
];

// ============================================================================
// QUERY KEYS
// ============================================================================

export const complianceControlKeys = createQueryKeyFactory<string>('complianceControls');

// ============================================================================
// COMPLIANCE CONTROL QUERIES
// ============================================================================

/**
 * Hook to fetch a list of Compliance Controls
 */
export const useComplianceControls = (options: ListQueryOptions = {}) => {
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
    queryKey: complianceControlKeys.list({ page, pageSize, sort, filters, search }),
    queryFn: async () => {
      let query = supabase
        .from('compliance_control')
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
        query = query.order('framework').order('control_code');
      }

      // Apply pagination
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data as ComplianceControl[],
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
 * Hook to fetch a single Compliance Control by ID
 */
export const useComplianceControl = (
  id: string | undefined,
  options: { select?: string; enabled?: boolean } = {}
) => {
  const { select = '*', enabled = true } = options;

  return useQuery({
    queryKey: complianceControlKeys.detail(id ?? ''),
    queryFn: async () => {
      if (!id) throw new Error('Compliance Control ID is required');

      const { data, error } = await supabase
        .from('compliance_control')
        .select(select)
        .eq('id', id)
        .single();

      if (error) throw error;

      return data as ComplianceControl;
    },
    enabled: enabled && !!id,
  });
};

/**
 * Hook to fetch Compliance Controls by framework
 */
export const useComplianceControlsByFramework = (
  framework: ComplianceFramework,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'framework', operator: 'eq' as const, value: framework },
  ];

  return useComplianceControls({ ...options, filters });
};

/**
 * Hook to fetch EU AI Act controls specifically
 */
export const useEUAIActControls = (options: ListQueryOptions = {}) => {
  return useComplianceControlsByFramework('eu_ai_act', options);
};

/**
 * Hook to search Compliance Controls
 */
export const useSearchComplianceControls = (
  searchTerm: string,
  options: ListQueryOptions = {}
) => {
  return useComplianceControls({
    ...options,
    search: { column: 'title', value: searchTerm },
    enabled: (options.enabled ?? true) && searchTerm.length >= 2,
  });
};

/**
 * Hook to get compliance status for an entity
 */
export const useComplianceStatus = (
  entityType: string,
  entityId: string,
  framework?: ComplianceFramework,
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['complianceControls', 'status', entityType, entityId, framework],
    queryFn: async () => {
      // Get all controls for the framework
      let controlsQuery = supabase
        .from('compliance_control')
        .select('id, control_code, title, framework');

      if (framework) {
        controlsQuery = controlsQuery.eq('framework', framework);
      }

      const { data: controls, error: controlsError } = await controlsQuery;

      if (controlsError) throw controlsError;

      // Get evidence for this entity
      const { data: evidence, error: evidenceError } = await supabase
        .from('compliance_evidence')
        .select('control_id, status')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId);

      if (evidenceError) throw evidenceError;

      // Build compliance status map
      const evidenceMap = new Map<string, string>();
      evidence?.forEach((e) => {
        evidenceMap.set(e.control_id, e.status);
      });

      const status = {
        total: controls?.length ?? 0,
        compliant: 0,
        pending: 0,
        notStarted: 0,
        rejected: 0,
        controls: controls?.map((control) => ({
          ...control,
          evidenceStatus: evidenceMap.get(control.id) ?? 'not_started',
        })) ?? [],
      };

      controls?.forEach((control) => {
        const evidenceStatus = evidenceMap.get(control.id);
        switch (evidenceStatus) {
          case 'validated':
            status.compliant++;
            break;
          case 'pending':
          case 'submitted':
            status.pending++;
            break;
          case 'rejected':
            status.rejected++;
            break;
          default:
            status.notStarted++;
        }
      });

      return status;
    },
    enabled: enabled && !!entityType && !!entityId,
  });
};

/**
 * Hook to get available frameworks
 */
export const useAvailableFrameworks = (options: { enabled?: boolean } = {}) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['complianceControls', 'frameworks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compliance_control')
        .select('framework')
        .order('framework');

      if (error) throw error;

      // Get unique frameworks with counts
      const frameworkCounts = new Map<ComplianceFramework, number>();
      data?.forEach((row) => {
        const framework = row.framework as ComplianceFramework;
        frameworkCounts.set(framework, (frameworkCounts.get(framework) ?? 0) + 1);
      });

      return Array.from(frameworkCounts.entries()).map(([framework, count]) => ({
        framework,
        controlCount: count,
      }));
    },
    enabled,
  });
};

// ============================================================================
// COMPLIANCE CONTROL MUTATIONS
// ============================================================================

/**
 * Hook to create a new Compliance Control
 */
export const useCreateComplianceControl = (
  options: MutationOptions<ComplianceControl, ComplianceControlInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ComplianceControlInsert) => {
      const { data, error } = await supabase
        .from('compliance_control')
        .insert(input)
        .select()
        .single();

      if (error) throw error;

      return data as ComplianceControl;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: complianceControlKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['complianceControls', 'frameworks'] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to create Compliance Control:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to update a Compliance Control
 */
export const useUpdateComplianceControl = (
  options: MutationOptions<ComplianceControl, { id: string; data: ComplianceControlUpdate }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ComplianceControlUpdate }) => {
      const { data: result, error } = await supabase
        .from('compliance_control')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return result as ComplianceControl;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: complianceControlKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: complianceControlKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to update Compliance Control:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to delete a Compliance Control
 */
export const useDeleteComplianceControl = (
  options: MutationOptions<void, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('compliance_control')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: complianceControlKeys.all });
      queryClient.invalidateQueries({ queryKey: ['complianceControls', 'frameworks'] });
      options.onSuccess?.(undefined, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to delete Compliance Control:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: (data, error, variables) => {
      options.onSettled?.(data, error, variables);
    },
  });
};

/**
 * Hook to initialize EU AI Act controls for a tenant
 */
export const useInitializeEUAIActControls = (
  options: MutationOptions<ComplianceControl[], { tenantId: string }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tenantId }: { tenantId: string }) => {
      // Check if controls already exist
      const { data: existing, error: checkError } = await supabase
        .from('compliance_control')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('framework', 'eu_ai_act')
        .limit(1);

      if (checkError) throw checkError;

      if (existing && existing.length > 0) {
        throw new Error('EU AI Act controls already initialized for this tenant');
      }

      // Insert all EU AI Act controls
      const controlsToInsert = EU_AI_ACT_CONTROLS.map((control) => ({
        ...control,
        tenant_id: tenantId,
      }));

      const { data, error } = await supabase
        .from('compliance_control')
        .insert(controlsToInsert)
        .select();

      if (error) throw error;

      return data as ComplianceControl[];
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: complianceControlKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['complianceControls', 'frameworks'] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to initialize EU AI Act controls:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to bulk create controls from a framework
 */
export const useBulkCreateControls = (
  options: MutationOptions<ComplianceControl[], ComplianceControlInsert[]> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (controls: ComplianceControlInsert[]) => {
      const { data, error } = await supabase
        .from('compliance_control')
        .insert(controls)
        .select();

      if (error) throw error;

      return data as ComplianceControl[];
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: complianceControlKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['complianceControls', 'frameworks'] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to bulk create controls:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

// ============================================================================
// TODO: Future Enhancements
// ============================================================================
// TODO: Add useImportControls hook for CSV/JSON framework import
// TODO: Add useExportControls hook for compliance documentation
// TODO: Add useControlMapping hook for cross-framework mapping
// TODO: Add useControlDependencies hook for prerequisite tracking
// TODO: Add useControlTemplates hook for reusable control sets
// TODO: Add automated control suggestion based on AI system type
// TODO: Add integration with external GRC platforms
// TODO: Add control versioning and change tracking
// TODO: Add multi-language support for control descriptions
// TODO: Add control effectiveness measurement hooks
