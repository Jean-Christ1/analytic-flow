// ============================================================================
// Notification Hooks
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
 * Notification type categories
 */
export type NotificationType =
  // System notifications
  | 'system_maintenance'
  | 'system_update'
  | 'security_alert'
  // Project notifications
  | 'project_invite'
  | 'project_update'
  | 'project_archived'
  // Task notifications
  | 'task_assigned'
  | 'task_updated'
  | 'task_completed'
  | 'task_comment'
  | 'task_mention'
  // Experiment notifications
  | 'experiment_started'
  | 'experiment_completed'
  | 'experiment_failed'
  // Model notifications
  | 'model_registered'
  | 'model_deployed'
  | 'model_monitoring_alert'
  // Pipeline notifications
  | 'pipeline_started'
  | 'pipeline_completed'
  | 'pipeline_failed'
  // Deployment notifications
  | 'deployment_started'
  | 'deployment_completed'
  | 'deployment_failed'
  | 'deployment_rollback'
  // Collaboration notifications
  | 'comment_reply'
  | 'mention'
  | 'review_requested'
  | 'review_approved'
  | 'review_rejected';

/**
 * Notification priority
 */
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Notification delivery channel
 */
export type NotificationChannel = 'in_app' | 'email' | 'slack' | 'teams' | 'webhook';

/**
 * Notification from database
 */
export interface Notification {
  id: string;
  tenant_id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  entity_type: string | null;
  entity_id: string | null;
  action_url: string | null;
  action_label: string | null;
  metadata: Record<string, unknown>;
  is_read: boolean;
  read_at: string | null;
  is_archived: boolean;
  archived_at: string | null;
  expires_at: string | null;
  created_at: string;
}

/**
 * Notification with sender info
 */
export interface NotificationWithSender extends Notification {
  sender?: {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
}

/**
 * Notification insert type
 */
export type NotificationInsert = Omit<
  Notification,
  'id' | 'created_at' | 'is_read' | 'read_at' | 'is_archived' | 'archived_at'
> & {
  id?: string;
};

/**
 * Notification preferences
 */
export interface NotificationPreferences {
  id: string;
  user_id: string;
  channel_preferences: Record<NotificationType, NotificationChannel[]>;
  quiet_hours: {
    enabled: boolean;
    start: string; // HH:mm
    end: string; // HH:mm
    timezone: string;
  };
  digest_enabled: boolean;
  digest_frequency: 'daily' | 'weekly';
  email_notifications: boolean;
  push_notifications: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Notification statistics
 */
export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const notificationKeys = createQueryKeyFactory<string>('notifications');

// Extended query keys
export const notificationQueryKeys = {
  ...notificationKeys,
  byUser: (userId: string) => [...notificationKeys.all, 'user', userId] as const,
  unread: (userId: string) => [...notificationKeys.all, 'unread', userId] as const,
  byType: (type: NotificationType) => [...notificationKeys.all, 'type', type] as const,
  byPriority: (priority: NotificationPriority) => [...notificationKeys.all, 'priority', priority] as const,
  archived: (userId: string) => [...notificationKeys.all, 'archived', userId] as const,
  stats: (userId: string) => [...notificationKeys.all, 'stats', userId] as const,
  preferences: (userId: string) => [...notificationKeys.all, 'preferences', userId] as const,
};

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Fetch all notifications for a user
 */
export const useNotifications = (userId: string, options: ListQueryOptions = {}) => {
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
    queryKey: notificationKeys.list({ pagination, sort, filters }),
    queryFn: async () => {
      let query = supabase
        .from('notification')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .eq('is_archived', false);

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
      return { data: data as Notification[], count };
    },
    enabled: enabled && !!userId,
  });
};

/**
 * Infinite scroll for notifications
 */
export const useInfiniteNotifications = (userId: string, options: { enabled?: boolean } = {}) => {
  const pageSize = DEFAULT_PAGE_SIZE;

  return useInfiniteQuery({
    queryKey: [...notificationQueryKeys.byUser(userId), 'infinite'] as const,
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error, count } = await supabase
        .from('notification')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .range(pageParam, pageParam + pageSize - 1);

      if (error) throw error;
      return { data: data as Notification[], count, nextCursor: pageParam + pageSize };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (!lastPage.count || lastPage.data.length < pageSize) return undefined;
      return lastPage.nextCursor;
    },
    enabled: options.enabled !== false && !!userId,
  });
};

/**
 * Fetch unread notifications
 */
export const useUnreadNotifications = (userId: string, limit: number = 10) => {
  return useQuery({
    queryKey: notificationQueryKeys.unread(userId),
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from('notification')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .eq('is_read', false)
        .eq('is_archived', false)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { data: data as Notification[], count };
    },
    enabled: !!userId,
    // Refetch more frequently for unread notifications
    refetchInterval: 30000, // 30 seconds
  });
};

/**
 * Fetch unread count
 */
export const useUnreadCount = (userId: string) => {
  return useQuery({
    queryKey: [...notificationQueryKeys.unread(userId), 'count'] as const,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('notification')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)
        .eq('is_archived', false);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!userId,
    refetchInterval: 30000, // 30 seconds
  });
};

/**
 * Fetch notifications by type
 */
export const useNotificationsByType = (
  userId: string,
  type: NotificationType,
  pagination?: PaginationParams
) => {
  const page = pagination?.page ?? DEFAULT_PAGE;
  const pageSize = pagination?.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = calculateOffset(page, pageSize);

  return useQuery({
    queryKey: [...notificationQueryKeys.byType(type), userId] as const,
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from('notification')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .eq('type', type)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) throw error;
      return { data: data as Notification[], count };
    },
    enabled: !!userId,
  });
};

/**
 * Fetch high priority notifications
 */
export const useHighPriorityNotifications = (userId: string) => {
  return useQuery({
    queryKey: [...notificationQueryKeys.byPriority('high'), userId] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification')
        .select('*')
        .eq('user_id', userId)
        .in('priority', ['high', 'urgent'])
        .eq('is_read', false)
        .eq('is_archived', false)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!userId,
  });
};

/**
 * Fetch archived notifications
 */
export const useArchivedNotifications = (userId: string, pagination?: PaginationParams) => {
  const page = pagination?.page ?? DEFAULT_PAGE;
  const pageSize = pagination?.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = calculateOffset(page, pageSize);

  return useQuery({
    queryKey: notificationQueryKeys.archived(userId),
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from('notification')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .eq('is_archived', true)
        .order('archived_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) throw error;
      return { data: data as Notification[], count };
    },
    enabled: !!userId,
  });
};

/**
 * Fetch notification statistics
 */
export const useNotificationStats = (userId: string) => {
  return useQuery({
    queryKey: notificationQueryKeys.stats(userId),
    queryFn: async () => {
      // Get total and unread counts
      const { count: total, error: totalError } = await supabase
        .from('notification')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_archived', false);

      if (totalError) throw totalError;

      const { count: unread, error: unreadError } = await supabase
        .from('notification')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)
        .eq('is_archived', false);

      if (unreadError) throw unreadError;

      // Get counts by type (recent notifications only)
      const { data: recentNotifications, error: recentError } = await supabase
        .from('notification')
        .select('type, priority')
        .eq('user_id', userId)
        .eq('is_archived', false)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (recentError) throw recentError;

      const byType: Record<string, number> = {};
      const byPriority: Record<string, number> = {};

      recentNotifications?.forEach(n => {
        byType[n.type] = (byType[n.type] || 0) + 1;
        byPriority[n.priority] = (byPriority[n.priority] || 0) + 1;
      });

      return {
        total: total || 0,
        unread: unread || 0,
        byType,
        byPriority,
      } as NotificationStats;
    },
    enabled: !!userId,
  });
};

/**
 * Fetch notification preferences
 */
export const useNotificationPreferences = (userId: string) => {
  return useQuery({
    queryKey: notificationQueryKeys.preferences(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data as NotificationPreferences | null;
    },
    enabled: !!userId,
  });
};

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Create a notification
 */
export const useCreateNotification = (
  options: MutationOptions<Notification, NotificationInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notification: NotificationInsert) => {
      const { data, error } = await supabase
        .from('notification')
        .insert(notification)
        .select()
        .single();

      if (error) throw error;
      return data as Notification;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.byUser(data.user_id) });
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.unread(data.user_id) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Mark notification as read
 */
export const useMarkAsRead = (
  options: MutationOptions<Notification, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { data, error } = await supabase
        .from('notification')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .select()
        .single();

      if (error) throw error;
      return data as Notification;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.detail(variables) });
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.unread(data.user_id) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Mark all notifications as read
 */
export const useMarkAllAsRead = (
  options: MutationOptions<number, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase
        .from('notification')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_read', false)
        .select('id');

      if (error) throw error;
      return data?.length || 0;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.byUser(variables) });
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.unread(variables) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Archive a notification
 */
export const useArchiveNotification = (
  options: MutationOptions<Notification, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { data, error } = await supabase
        .from('notification')
        .update({ is_archived: true, archived_at: new Date().toISOString() })
        .eq('id', notificationId)
        .select()
        .single();

      if (error) throw error;
      return data as Notification;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.byUser(data.user_id) });
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.unread(data.user_id) });
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.archived(data.user_id) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Archive multiple notifications
 */
export const useBulkArchive = (
  options: MutationOptions<number, { userId: string; notificationIds: string[] }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ notificationIds }: { userId: string; notificationIds: string[] }) => {
      const { data, error } = await supabase
        .from('notification')
        .update({ is_archived: true, archived_at: new Date().toISOString() })
        .in('id', notificationIds)
        .select('id');

      if (error) throw error;
      return data?.length || 0;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.byUser(variables.userId) });
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.archived(variables.userId) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Delete a notification
 */
export const useDeleteNotification = (
  options: MutationOptions<void, { notificationId: string; userId: string }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ notificationId }: { notificationId: string; userId: string }) => {
      const { error } = await supabase
        .from('notification')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.byUser(variables.userId) });
      options.onSuccess?.(undefined, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update notification preferences
 */
export const useUpdateNotificationPreferences = (
  options: MutationOptions<NotificationPreferences, { userId: string; preferences: Partial<NotificationPreferences> }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, preferences }: { userId: string; preferences: Partial<NotificationPreferences> }) => {
      const { data, error } = await supabase
        .from('notification_preferences')
        .upsert({ user_id: userId, ...preferences })
        .select()
        .single();

      if (error) throw error;
      return data as NotificationPreferences;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.preferences(variables.userId) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Clear expired notifications
 */
export const useClearExpiredNotifications = (
  options: MutationOptions<number, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('notification')
        .delete()
        .eq('user_id', userId)
        .lt('expires_at', now)
        .select('id');

      if (error) throw error;
      return data?.length || 0;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.byUser(variables) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

// ============================================================================
// TODO: Additional Features
// ============================================================================
// TODO: Add useNotificationTemplates hook for notification templates
// TODO: Add useSubscribeToNotifications hook for real-time updates
// TODO: Add usePushNotificationToken mutation for mobile push tokens
// TODO: Add useNotificationHistory hook for audit trail
// TODO: Add useMuteEntity hook for muting specific entity notifications
// TODO: Add useNotificationRules hook for custom notification rules
// TODO: Add useDigestPreview hook for digest email preview
// TODO: Add useSlackIntegration hook for Slack notification settings
// TODO: Add useTeamsIntegration hook for MS Teams notification settings
// TODO: Add useWebhookNotifications hook for webhook delivery management
// TODO: Add useNotificationSchedule hook for scheduled notifications
