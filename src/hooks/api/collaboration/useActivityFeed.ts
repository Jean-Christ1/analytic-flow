// ============================================================================
// Activity Feed Hooks
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
 * Activity event type categories
 */
export type ActivityEventType =
  // Project activities
  | 'project_created'
  | 'project_updated'
  | 'project_archived'
  | 'project_member_added'
  | 'project_member_removed'
  // Experiment activities
  | 'experiment_created'
  | 'experiment_started'
  | 'experiment_completed'
  | 'experiment_failed'
  | 'experiment_cancelled'
  // Model activities
  | 'model_registered'
  | 'model_version_created'
  | 'model_stage_transition'
  | 'model_deployed'
  | 'model_retired'
  // Dataset activities
  | 'dataset_created'
  | 'dataset_version_created'
  | 'dataset_validated'
  // Pipeline activities
  | 'pipeline_created'
  | 'pipeline_started'
  | 'pipeline_completed'
  | 'pipeline_failed'
  // Deployment activities
  | 'deployment_created'
  | 'deployment_started'
  | 'deployment_completed'
  | 'deployment_failed'
  | 'deployment_scaled'
  | 'deployment_rollback'
  // Task activities
  | 'task_created'
  | 'task_assigned'
  | 'task_status_changed'
  | 'task_completed'
  // Comment activities
  | 'comment_added'
  | 'comment_resolved'
  // User activities
  | 'user_joined'
  | 'user_left'
  | 'user_role_changed';

/**
 * Activity entity type
 */
export type ActivityEntityType =
  | 'project'
  | 'experiment'
  | 'model'
  | 'model_version'
  | 'dataset'
  | 'pipeline'
  | 'deployment'
  | 'task'
  | 'comment'
  | 'user';

/**
 * Activity feed entry from database
 */
export interface ActivityFeed {
  id: string;
  tenant_id: string;
  project_id: string | null;
  user_id: string;
  event_type: ActivityEventType;
  entity_type: ActivityEntityType;
  entity_id: string;
  entity_name: string | null;
  description: string;
  metadata: Record<string, unknown>;
  changes: ActivityChange[];
  is_public: boolean;
  created_at: string;
}

/**
 * Activity change details
 */
export interface ActivityChange {
  field: string;
  old_value: unknown;
  new_value: unknown;
}

/**
 * Activity with user info
 */
export interface ActivityWithUser extends ActivityFeed {
  user?: {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string | null;
  };
  project?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

/**
 * Activity insert type
 */
export type ActivityInsert = Omit<ActivityFeed, 'id' | 'created_at'> & {
  id?: string;
};

/**
 * Activity aggregation
 */
export interface ActivityAggregation {
  date: string;
  count: number;
  byEventType: Record<ActivityEventType, number>;
}

/**
 * Activity timeline entry (grouped activities)
 */
export interface ActivityTimelineEntry {
  date: string;
  activities: ActivityWithUser[];
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const activityFeedKeys = createQueryKeyFactory<string>('activity_feed');

// Extended query keys
export const activityFeedQueryKeys = {
  ...activityFeedKeys,
  byProject: (projectId: string) => [...activityFeedKeys.all, 'project', projectId] as const,
  byUser: (userId: string) => [...activityFeedKeys.all, 'user', userId] as const,
  byEntity: (entityType: ActivityEntityType, entityId: string) =>
    [...activityFeedKeys.all, 'entity', entityType, entityId] as const,
  byEventType: (eventType: ActivityEventType) =>
    [...activityFeedKeys.all, 'event_type', eventType] as const,
  timeline: (projectId?: string) => [...activityFeedKeys.all, 'timeline', projectId] as const,
  stats: (projectId?: string) => [...activityFeedKeys.all, 'stats', projectId] as const,
};

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Fetch activity feed with pagination
 */
export const useActivityFeed = (options: ListQueryOptions = {}) => {
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
    queryKey: activityFeedKeys.list({ pagination, sort, filters }),
    queryFn: async () => {
      let query = supabase
        .from('activity_feed')
        .select(`
          *,
          user:profile(id, email, full_name, avatar_url),
          project(id, name, slug)
        `, { count: 'exact' });

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
      return { data: data as ActivityWithUser[], count };
    },
    enabled,
  });
};

/**
 * Infinite scroll for activity feed
 */
export const useInfiniteActivityFeed = (
  projectId?: string,
  options: { enabled?: boolean } = {}
) => {
  const pageSize = DEFAULT_PAGE_SIZE;

  return useInfiniteQuery({
    queryKey: [...activityFeedQueryKeys.byProject(projectId || 'all'), 'infinite'] as const,
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('activity_feed')
        .select(`
          *,
          user:profile(id, email, full_name, avatar_url),
          project(id, name, slug)
        `, { count: 'exact' });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      query = query
        .order('created_at', { ascending: false })
        .range(pageParam, pageParam + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;
      return { data: data as ActivityWithUser[], count, nextCursor: pageParam + pageSize };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (!lastPage.count || lastPage.data.length < pageSize) return undefined;
      return lastPage.nextCursor;
    },
    enabled: options.enabled !== false,
  });
};

/**
 * Fetch activity feed by project
 */
export const useActivityByProject = (projectId: string, pagination?: PaginationParams) => {
  const page = pagination?.page ?? DEFAULT_PAGE;
  const pageSize = pagination?.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = calculateOffset(page, pageSize);

  return useQuery({
    queryKey: activityFeedQueryKeys.byProject(projectId),
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from('activity_feed')
        .select(`
          *,
          user:profile(id, email, full_name, avatar_url)
        `, { count: 'exact' })
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) throw error;
      return { data: data as ActivityWithUser[], count };
    },
    enabled: !!projectId,
  });
};

/**
 * Fetch activity feed by user
 */
export const useActivityByUser = (userId: string, pagination?: PaginationParams) => {
  const page = pagination?.page ?? DEFAULT_PAGE;
  const pageSize = pagination?.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = calculateOffset(page, pageSize);

  return useQuery({
    queryKey: activityFeedQueryKeys.byUser(userId),
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from('activity_feed')
        .select(`
          *,
          project(id, name, slug)
        `, { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) throw error;
      return { data: data as ActivityWithUser[], count };
    },
    enabled: !!userId,
  });
};

/**
 * Fetch activity for a specific entity
 */
export const useActivityByEntity = (
  entityType: ActivityEntityType,
  entityId: string,
  pagination?: PaginationParams
) => {
  const page = pagination?.page ?? DEFAULT_PAGE;
  const pageSize = pagination?.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = calculateOffset(page, pageSize);

  return useQuery({
    queryKey: activityFeedQueryKeys.byEntity(entityType, entityId),
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from('activity_feed')
        .select(`
          *,
          user:profile(id, email, full_name, avatar_url)
        `, { count: 'exact' })
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) throw error;
      return { data: data as ActivityWithUser[], count };
    },
    enabled: !!entityType && !!entityId,
  });
};

/**
 * Fetch activity by event type
 */
export const useActivityByEventType = (eventType: ActivityEventType, projectId?: string) => {
  return useQuery({
    queryKey: [...activityFeedQueryKeys.byEventType(eventType), projectId] as const,
    queryFn: async () => {
      let query = supabase
        .from('activity_feed')
        .select(`
          *,
          user:profile(id, email, full_name, avatar_url)
        `)
        .eq('event_type', eventType)
        .order('created_at', { ascending: false })
        .limit(50);

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ActivityWithUser[];
    },
  });
};

/**
 * Fetch recent activities (last 24h)
 */
export const useRecentActivities = (projectId?: string, limit: number = 20) => {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  return useQuery({
    queryKey: [...activityFeedQueryKeys.timeline(projectId), 'recent'] as const,
    queryFn: async () => {
      let query = supabase
        .from('activity_feed')
        .select(`
          *,
          user:profile(id, email, full_name, avatar_url),
          project(id, name, slug)
        `)
        .gte('created_at', yesterday)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ActivityWithUser[];
    },
  });
};

/**
 * Fetch activity timeline (grouped by date)
 */
export const useActivityTimeline = (projectId?: string, days: number = 7) => {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  return useQuery({
    queryKey: [...activityFeedQueryKeys.timeline(projectId), days] as const,
    queryFn: async () => {
      let query = supabase
        .from('activity_feed')
        .select(`
          *,
          user:profile(id, email, full_name, avatar_url),
          project(id, name, slug)
        `)
        .gte('created_at', startDate)
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Group by date
      const grouped = (data as ActivityWithUser[]).reduce((acc, activity) => {
        const date = activity.created_at.split('T')[0];
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(activity);
        return acc;
      }, {} as Record<string, ActivityWithUser[]>);

      // Convert to timeline entries
      const timeline: ActivityTimelineEntry[] = Object.entries(grouped)
        .map(([date, activities]) => ({ date, activities }))
        .sort((a, b) => b.date.localeCompare(a.date));

      return timeline;
    },
  });
};

/**
 * Fetch activity statistics
 */
export const useActivityStats = (projectId?: string, days: number = 30) => {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  return useQuery({
    queryKey: [...activityFeedQueryKeys.stats(projectId), days] as const,
    queryFn: async () => {
      let query = supabase
        .from('activity_feed')
        .select('event_type, created_at')
        .gte('created_at', startDate);

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Aggregate by date
      const aggregations = (data || []).reduce((acc, activity) => {
        const date = activity.created_at.split('T')[0];
        if (!acc[date]) {
          acc[date] = { date, count: 0, byEventType: {} as Record<ActivityEventType, number> };
        }
        acc[date].count++;
        acc[date].byEventType[activity.event_type as ActivityEventType] =
          (acc[date].byEventType[activity.event_type as ActivityEventType] || 0) + 1;
        return acc;
      }, {} as Record<string, ActivityAggregation>);

      return Object.values(aggregations).sort((a, b) => a.date.localeCompare(b.date));
    },
  });
};

/**
 * Fetch public activities (cross-project)
 */
export const usePublicActivities = (pagination?: PaginationParams) => {
  const page = pagination?.page ?? DEFAULT_PAGE;
  const pageSize = pagination?.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = calculateOffset(page, pageSize);

  return useQuery({
    queryKey: [...activityFeedKeys.all, 'public'] as const,
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from('activity_feed')
        .select(`
          *,
          user:profile(id, email, full_name, avatar_url),
          project(id, name, slug)
        `, { count: 'exact' })
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) throw error;
      return { data: data as ActivityWithUser[], count };
    },
  });
};

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Record an activity
 */
export const useRecordActivity = (
  options: MutationOptions<ActivityFeed, ActivityInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activity: ActivityInsert) => {
      const { data, error } = await supabase
        .from('activity_feed')
        .insert(activity)
        .select()
        .single();

      if (error) throw error;
      return data as ActivityFeed;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: activityFeedKeys.lists() });
      if (data.project_id) {
        queryClient.invalidateQueries({ queryKey: activityFeedQueryKeys.byProject(data.project_id) });
      }
      queryClient.invalidateQueries({ queryKey: activityFeedQueryKeys.byUser(data.user_id) });
      queryClient.invalidateQueries({
        queryKey: activityFeedQueryKeys.byEntity(data.entity_type, data.entity_id),
      });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Batch record activities
 */
export const useBatchRecordActivities = (
  options: MutationOptions<ActivityFeed[], ActivityInsert[]> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activities: ActivityInsert[]) => {
      const { data, error } = await supabase
        .from('activity_feed')
        .insert(activities)
        .select();

      if (error) throw error;
      return data as ActivityFeed[];
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: activityFeedKeys.all });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Delete old activities (cleanup)
 */
export const useCleanupOldActivities = (
  options: MutationOptions<number, { olderThanDays: number; projectId?: string }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ olderThanDays, projectId }: { olderThanDays: number; projectId?: string }) => {
      const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000).toISOString();

      let query = supabase
        .from('activity_feed')
        .delete()
        .lt('created_at', cutoffDate);

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query.select('id');

      if (error) throw error;
      return data?.length || 0;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: activityFeedKeys.all });
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
 * Hook to get activity description
 */
export const useActivityDescription = () => {
  const getDescription = (activity: ActivityFeed): string => {
    // This could be extended to generate rich descriptions
    return activity.description;
  };

  const getEventIcon = (eventType: ActivityEventType): string => {
    const iconMap: Record<string, string> = {
      // Project events
      project_created: 'folder-plus',
      project_updated: 'folder-edit',
      project_archived: 'folder-archive',
      // Experiment events
      experiment_created: 'flask',
      experiment_started: 'play',
      experiment_completed: 'check-circle',
      experiment_failed: 'x-circle',
      // Model events
      model_registered: 'box',
      model_deployed: 'rocket',
      // Pipeline events
      pipeline_started: 'git-branch',
      pipeline_completed: 'git-merge',
      pipeline_failed: 'git-pull-request',
      // Default
      default: 'activity',
    };

    return iconMap[eventType] || iconMap.default;
  };

  return { getDescription, getEventIcon };
};

// ============================================================================
// TODO: Additional Features
// ============================================================================
// TODO: Add useSubscribeToActivityFeed hook for real-time updates
// TODO: Add useActivityFilters hook for saved filter configurations
// TODO: Add useActivityExport hook for exporting activity logs
// TODO: Add useActivitySearch hook for full-text search
// TODO: Add useActivityBookmarks hook for bookmarking important activities
// TODO: Add useActivityDigest hook for daily/weekly digests
// TODO: Add useActivityAuditLog hook for compliance reporting
// TODO: Add useActivityRetention hook for retention policy management
// TODO: Add useActivityWebhook hook for activity webhook delivery
// TODO: Add useCollaboratorActivities hook for team member activities
// TODO: Add useActivityAlerts hook for activity-based alerting
