// ============================================================================
// Audit Log Hooks
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
  type PaginationParams,
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE,
  calculateOffset,
} from '../utils/query-utils';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Audit action types
 */
export type AuditAction =
  // Authentication
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'password_changed'
  | 'mfa_enabled'
  | 'mfa_disabled'
  // CRUD operations
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'bulk_create'
  | 'bulk_update'
  | 'bulk_delete'
  // Access control
  | 'permission_granted'
  | 'permission_revoked'
  | 'role_assigned'
  | 'role_removed'
  // Data operations
  | 'export'
  | 'import'
  | 'download'
  | 'upload'
  // Administrative
  | 'config_changed'
  | 'settings_updated'
  | 'feature_flag_toggled'
  // Deployment
  | 'deployed'
  | 'undeployed'
  | 'scaled'
  | 'rollback';

/**
 * Audit resource types
 */
export type AuditResourceType =
  | 'user'
  | 'tenant'
  | 'project'
  | 'team'
  | 'experiment'
  | 'model'
  | 'deployment'
  | 'pipeline'
  | 'dataset'
  | 'feature'
  | 'endpoint'
  | 'cluster'
  | 'namespace'
  | 'secret'
  | 'api_key'
  | 'webhook'
  | 'integration'
  | 'settings';

/**
 * Audit log severity
 */
export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Audit log entry from database
 */
export interface AuditLog {
  id: string;
  tenant_id: string;
  user_id: string | null;
  action: AuditAction;
  resource_type: AuditResourceType;
  resource_id: string | null;
  resource_name: string | null;
  severity: AuditSeverity;
  description: string;
  changes: AuditChange[];
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  request_id: string | null;
  session_id: string | null;
  status: 'success' | 'failure';
  error_message: string | null;
  created_at: string;
}

/**
 * Audit change details
 */
export interface AuditChange {
  field: string;
  old_value: unknown;
  new_value: unknown;
}

/**
 * Audit log with user info
 */
export interface AuditLogWithUser extends AuditLog {
  user?: {
    id: string;
    email: string;
    full_name: string;
  } | null;
}

/**
 * Audit log insert type
 */
export type AuditLogInsert = Omit<AuditLog, 'id' | 'created_at'> & {
  id?: string;
};

/**
 * Audit log search filters
 */
export interface AuditLogFilters {
  userId?: string;
  action?: AuditAction;
  resourceType?: AuditResourceType;
  resourceId?: string;
  severity?: AuditSeverity;
  status?: 'success' | 'failure';
  startDate?: string;
  endDate?: string;
  ipAddress?: string;
}

/**
 * Audit statistics
 */
export interface AuditStats {
  total: number;
  byAction: Record<AuditAction, number>;
  bySeverity: Record<AuditSeverity, number>;
  byResourceType: Record<AuditResourceType, number>;
  byStatus: { success: number; failure: number };
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const auditLogKeys = createQueryKeyFactory<string>('audit_logs');

// Extended query keys
export const auditLogQueryKeys = {
  ...auditLogKeys,
  byUser: (userId: string) => [...auditLogKeys.all, 'user', userId] as const,
  byResource: (resourceType: AuditResourceType, resourceId: string) =>
    [...auditLogKeys.all, 'resource', resourceType, resourceId] as const,
  byAction: (action: AuditAction) => [...auditLogKeys.all, 'action', action] as const,
  bySeverity: (severity: AuditSeverity) => [...auditLogKeys.all, 'severity', severity] as const,
  search: (filters: AuditLogFilters) => [...auditLogKeys.all, 'search', filters] as const,
  stats: (tenantId: string) => [...auditLogKeys.all, 'stats', tenantId] as const,
  recent: () => [...auditLogKeys.all, 'recent'] as const,
  security: () => [...auditLogKeys.all, 'security'] as const,
};

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Fetch audit logs with pagination
 */
export const useAuditLogs = (options: ListQueryOptions = {}) => {
  const {
    pagination = { page: DEFAULT_PAGE, pageSize: DEFAULT_PAGE_SIZE },
    sort = { column: 'created_at', ascending: false },
    filters = [],
    enabled = true,
  } = options;

  const page = pagination.page ?? DEFAULT_PAGE;
  const pageSize = pagination.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = calculateOffset(page, pageSize);

  return useQuery({
    queryKey: auditLogKeys.list({ pagination, sort, filters }),
    queryFn: async () => {
      let query = (supabase as any)
        .from('audit_event')
        .select('*', { count: 'exact' });

      // Apply filters
      filters.forEach(filter => {
        query = query.filter(filter.column, filter.operator, filter.value);
      });

      // Apply sorting
      const sortParams = Array.isArray(sort) ? sort : [sort];
      sortParams.forEach(s => {
        query = query.order(s.column, { ascending: s.ascending ?? true });
      });

      // Apply pagination
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;
      return { data: data as AuditLogWithUser[], count };
    },
    enabled,
  });
};

/**
 * Infinite scroll for audit logs
 */
export const useInfiniteAuditLogs = (options: Omit<ListQueryOptions, 'pagination'> = {}) => {
  const {
    sort = { column: 'created_at', ascending: false },
    filters = [],
    enabled = true,
  } = options;

  const pageSize = DEFAULT_PAGE_SIZE;

  return useInfiniteQuery({
    queryKey: auditLogKeys.infinite({ sort, filters }),
    queryFn: async ({ pageParam = 0 }) => {
      let query = (supabase as any)
        .from('audit_event')
        .select('*', { count: 'exact' });

      filters.forEach(filter => {
        query = query.filter(filter.column, filter.operator, filter.value);
      });

      const sortParams = Array.isArray(sort) ? sort : [sort];
      sortParams.forEach(s => {
        query = query.order(s.column, { ascending: s.ascending ?? true });
      });

      query = query.range(pageParam, pageParam + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;
      return { data: data as AuditLogWithUser[], count, nextCursor: pageParam + pageSize };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (!lastPage.count || lastPage.data.length < pageSize) return undefined;
      return lastPage.nextCursor;
    },
    enabled,
  });
};

/**
 * Fetch a single audit log entry
 */
export const useAuditLog = (logId: string, options: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: auditLogKeys.detail(logId),
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('audit_event')
        .select('*, user:profile(id, email, full_name)')
        .eq('id', logId)
        .single();

      if (error) throw error;
      return data as AuditLogWithUser;
    },
    enabled: options.enabled !== false && !!logId,
  });
};

/**
 * Fetch audit logs by user
 */
export const useAuditLogsByUser = (userId: string, pagination?: PaginationParams) => {
  const page = pagination?.page ?? DEFAULT_PAGE;
  const pageSize = pagination?.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = calculateOffset(page, pageSize);

  return useQuery({
    queryKey: auditLogQueryKeys.byUser(userId),
    queryFn: async () => {
      const { data, error, count } = await (supabase as any)
        .from('audit_event')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) throw error;
      return { data: data as AuditLog[], count };
    },
    enabled: !!userId,
  });
};

/**
 * Fetch audit logs for a specific resource
 */
export const useAuditLogsByResource = (
  resourceType: AuditResourceType,
  resourceId: string,
  pagination?: PaginationParams
) => {
  const page = pagination?.page ?? DEFAULT_PAGE;
  const pageSize = pagination?.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = calculateOffset(page, pageSize);

  return useQuery({
    queryKey: auditLogQueryKeys.byResource(resourceType, resourceId),
    queryFn: async () => {
      const { data, error, count } = await (supabase as any)
        .from('audit_event')
        .select('*', { count: 'exact' })
        .eq('resource_type', resourceType)
        .eq('resource_id', resourceId)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) throw error;
      return { data: data as AuditLogWithUser[], count };
    },
    enabled: !!resourceType && !!resourceId,
  });
};

/**
 * Fetch audit logs by action
 */
export const useAuditLogsByAction = (action: AuditAction, pagination?: PaginationParams) => {
  const page = pagination?.page ?? DEFAULT_PAGE;
  const pageSize = pagination?.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = calculateOffset(page, pageSize);

  return useQuery({
    queryKey: auditLogQueryKeys.byAction(action),
    queryFn: async () => {
      const { data, error, count } = await (supabase as any)
        .from('audit_event')
        .select('*', { count: 'exact' })
        .eq('action', action)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) throw error;
      return { data: data as AuditLogWithUser[], count };
    },
  });
};

/**
 * Search audit logs with filters
 */
export const useSearchAuditLogs = (filters: AuditLogFilters, pagination?: PaginationParams) => {
  const page = pagination?.page ?? DEFAULT_PAGE;
  const pageSize = pagination?.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = calculateOffset(page, pageSize);

  return useQuery({
    queryKey: auditLogQueryKeys.search(filters),
    queryFn: async () => {
      let query = (supabase as any)
        .from('audit_event')
        .select('*', { count: 'exact' });

      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters.action) {
        query = query.eq('action', filters.action);
      }
      if (filters.resourceType) {
        query = query.eq('resource_type', filters.resourceType);
      }
      if (filters.resourceId) {
        query = query.eq('resource_id', filters.resourceId);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }
      if (filters.ipAddress) {
        query = query.eq('ip_address', filters.ipAddress);
      }

      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;
      return { data: data as AuditLogWithUser[], count };
    },
    enabled: Object.values(filters).some(v => v !== undefined),
  });
};

/**
 * Fetch recent audit logs
 */
export const useRecentAuditLogs = (limit: number = 50) => {
  return useQuery({
    queryKey: auditLogQueryKeys.recent(),
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('audit_event')
        .select('*, user:profile(id, email, full_name)')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as AuditLogWithUser[];
    },
  });
};

/**
 * Fetch security-related audit logs
 */
export const useSecurityAuditLogs = (pagination?: PaginationParams) => {
  const page = pagination?.page ?? DEFAULT_PAGE;
  const pageSize = pagination?.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = calculateOffset(page, pageSize);

  const securityActions: AuditAction[] = [
    'login',
    'logout',
    'login_failed',
    'password_changed',
    'mfa_enabled',
    'mfa_disabled',
    'permission_granted',
    'permission_revoked',
    'role_assigned',
    'role_removed',
  ];

  return useQuery({
    queryKey: auditLogQueryKeys.security(),
    queryFn: async () => {
      const { data, error, count } = await (supabase as any)
        .from('audit_event')
        .select('*', { count: 'exact' })
        .in('action', securityActions)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) throw error;
      return { data: data as AuditLogWithUser[], count };
    },
  });
};

/**
 * Fetch failed operations
 */
export const useFailedOperations = (pagination?: PaginationParams) => {
  const page = pagination?.page ?? DEFAULT_PAGE;
  const pageSize = pagination?.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = calculateOffset(page, pageSize);

  return useQuery({
    queryKey: [...auditLogKeys.all, 'failed'] as const,
    queryFn: async () => {
      const { data, error, count } = await (supabase as any)
        .from('audit_event')
        .select('*', { count: 'exact' })
        .eq('status', 'failure')
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) throw error;
      return { data: data as AuditLogWithUser[], count };
    },
  });
};

/**
 * Fetch audit statistics
 */
export const useAuditStats = (tenantId: string, days: number = 30) => {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  return useQuery({
    queryKey: [...auditLogQueryKeys.stats(tenantId), days] as const,
    queryFn: async () => {
      const { data, error, count } = await (supabase as any)
        .from('audit_event')
        .select('action, resource_type, status', { count: 'exact' })
        .eq('tenant_id', tenantId)
        .gte('created_at', startDate);

      if (error) throw error;

      const stats: AuditStats = {
        total: count || 0,
        byAction: {} as Record<AuditAction, number>,
        bySeverity: {} as Record<AuditSeverity, number>,
        byResourceType: {} as Record<AuditResourceType, number>,
        byStatus: { success: 0, failure: 0 },
      };

      (data || []).forEach(log => {
        stats.byAction[log.action as AuditAction] =
          (stats.byAction[log.action as AuditAction] || 0) + 1;
        const derivedSeverity: AuditSeverity = log.status === 'failure' ? 'error' : 'info';
        stats.bySeverity[derivedSeverity] = (stats.bySeverity[derivedSeverity] || 0) + 1;
        stats.byResourceType[log.resource_type as AuditResourceType] =
          (stats.byResourceType[log.resource_type as AuditResourceType] || 0) + 1;
        stats.byStatus[log.status as 'success' | 'failure']++;
      });

      return stats;
    },
    enabled: !!tenantId,
  });
};

// ============================================================================
// MUTATION HOOKS
// ============================================================================

// Map the app-level audit log shape onto the `audit_event` table columns.
const toAuditEventRow = (log: Record<string, unknown>) => ({
  tenant_id: log.tenant_id || null,
  actor_type: 'user',
  actor_id: log.user_id ?? null,
  action: log.action,
  resource_type: log.resource_type,
  resource_id: log.resource_id ?? null,
  resource_name: log.resource_name ?? null,
  ip: log.ip_address ?? null,
  user_agent: log.user_agent ?? null,
  status: log.status ?? 'success',
  error_message: log.error_message ?? null,
  payload: {
    description: log.description ?? null,
    severity: log.severity ?? 'info',
    changes: log.changes ?? [],
    metadata: log.metadata ?? {},
  },
});

/**
 * Create audit log entry
 */
export const useCreateAuditLog = (
  options: MutationOptions<AuditLog, AuditLogInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (log: AuditLogInsert) => {
      const { data, error } = await (supabase as any)
        .from('audit_event')
        .insert(toAuditEventRow(log as unknown as Record<string, unknown>))
        .select()
        .single();

      if (error) throw error;
      return data as AuditLog;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: auditLogKeys.lists() });
      queryClient.invalidateQueries({ queryKey: auditLogQueryKeys.recent() });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Batch create audit logs
 */
export const useBatchCreateAuditLogs = (
  options: MutationOptions<AuditLog[], AuditLogInsert[]> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (logs: AuditLogInsert[]) => {
      const { data, error } = await (supabase as any)
        .from('audit_event')
        .insert((logs as unknown as Record<string, unknown>[]).map(toAuditEventRow))
        .select();

      if (error) throw error;
      return data as AuditLog[];
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: auditLogKeys.all });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Delete old audit logs (retention policy)
 */
export const usePurgeAuditLogs = (
  options: MutationOptions<number, { tenantId: string; olderThanDays: number }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tenantId, olderThanDays }: { tenantId: string; olderThanDays: number }) => {
      const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await (supabase as any)
        .from('audit_event')
        .delete()
        .eq('tenant_id', tenantId)
        .lt('created_at', cutoffDate)
        .select('id');

      if (error) throw error;
      return data?.length || 0;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: auditLogKeys.all });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook to log audit events (convenience wrapper)
 */
export const useAuditLogger = () => {
  const createLog = useCreateAuditLog();

  const logAction = async (params: {
    action: AuditAction;
    resourceType: AuditResourceType;
    resourceId?: string;
    resourceName?: string;
    description: string;
    changes?: AuditChange[];
    metadata?: Record<string, unknown>;
    severity?: AuditSeverity;
  }) => {
    // Get current user info from session
    const { data: { session } } = await supabase.auth.getSession();

    return createLog.mutateAsync({
      tenant_id: '', // Will be set by RLS or trigger
      user_id: session?.user?.id || null,
      action: params.action,
      resource_type: params.resourceType,
      resource_id: params.resourceId || null,
      resource_name: params.resourceName || null,
      severity: params.severity || 'info',
      description: params.description,
      changes: params.changes || [],
      metadata: params.metadata || {},
      ip_address: null, // TODO: Get from request context
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      request_id: null,
      session_id: session?.access_token?.slice(0, 32) || null,
      status: 'success',
      error_message: null,
    });
  };

  return { logAction, isLogging: createLog.isPending };
};

// ============================================================================
// TODO: Additional Features
// ============================================================================
// TODO: Add useAuditLogExport hook for compliance exports (CSV, PDF)
// TODO: Add useAuditAlerts hook for anomaly detection alerts
// TODO: Add useAuditDashboard hook for audit dashboard data
// TODO: Add useComplianceReport hook for compliance reports (SOC2, GDPR)
// TODO: Add useAuditRetentionPolicy hook for retention settings
// TODO: Add useAuditArchive hook for archiving old logs
// TODO: Add useAuditSearch hook with full-text search
// TODO: Add real-time audit log streaming
// TODO: Add useAuditForensics hook for security investigations
// TODO: Add useUserActivity hook for user activity reports
