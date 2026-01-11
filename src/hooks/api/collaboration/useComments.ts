// ============================================================================
// Comment Hooks
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
 * Entity type that can have comments
 */
export type CommentableEntity =
  | 'experiment'
  | 'model_version'
  | 'pipeline'
  | 'deployment'
  | 'task'
  | 'project'
  | 'dataset'
  | 'feature'
  | 'notebook';

/**
 * Comment type from database
 */
export interface Comment {
  id: string;
  tenant_id: string;
  entity_type: CommentableEntity;
  entity_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  mentions: string[];
  attachments: CommentAttachment[];
  is_resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  edited_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Comment attachment
 */
export interface CommentAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

/**
 * Comment with user info
 */
export interface CommentWithUser extends Comment {
  user?: {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string | null;
  };
  resolved_by_user?: {
    id: string;
    email: string;
    full_name: string;
  } | null;
  replies_count?: number;
}

/**
 * Comment thread (comment with replies)
 */
export interface CommentThread extends CommentWithUser {
  replies?: CommentWithUser[];
}

/**
 * Comment insert type
 */
export type CommentInsert = Omit<
  Comment,
  'id' | 'created_at' | 'updated_at' | 'edited_at' | 'resolved_at' | 'resolved_by' | 'is_resolved'
> & {
  id?: string;
};

/**
 * Comment update type
 */
export type CommentUpdate = Partial<Pick<Comment, 'content' | 'mentions' | 'attachments'>>;

// ============================================================================
// QUERY KEYS
// ============================================================================

export const commentKeys = createQueryKeyFactory<string>('comments');

// Extended query keys
export const commentQueryKeys = {
  ...commentKeys,
  byEntity: (entityType: CommentableEntity, entityId: string) =>
    [...commentKeys.all, 'entity', entityType, entityId] as const,
  byUser: (userId: string) => [...commentKeys.all, 'user', userId] as const,
  thread: (commentId: string) => [...commentKeys.all, 'thread', commentId] as const,
  unresolved: (entityType: CommentableEntity, entityId: string) =>
    [...commentKeys.all, 'unresolved', entityType, entityId] as const,
  mentions: (userId: string) => [...commentKeys.all, 'mentions', userId] as const,
};

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Fetch all comments with pagination
 */
export const useComments = (options: ListQueryOptions = {}) => {
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
    queryKey: commentKeys.list({ pagination, sort, filters }),
    queryFn: async () => {
      let query = supabase
        .from('comment')
        .select('*, user:profile(id, email, full_name, avatar_url)', { count: 'exact' });

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
      return { data: data as CommentWithUser[], count };
    },
    enabled,
  });
};

/**
 * Fetch comments for a specific entity
 */
export const useCommentsByEntity = (
  entityType: CommentableEntity,
  entityId: string,
  pagination?: PaginationParams
) => {
  const page = pagination?.page ?? DEFAULT_PAGE;
  const pageSize = pagination?.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = calculateOffset(page, pageSize);

  return useQuery({
    queryKey: commentQueryKeys.byEntity(entityType, entityId),
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from('comment')
        .select('*, user:profile(id, email, full_name, avatar_url)', { count: 'exact' })
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .is('parent_id', null) // Only top-level comments
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) throw error;
      return { data: data as CommentWithUser[], count };
    },
    enabled: !!entityType && !!entityId,
  });
};

/**
 * Infinite scroll for entity comments
 */
export const useInfiniteCommentsByEntity = (
  entityType: CommentableEntity,
  entityId: string,
  options: { enabled?: boolean } = {}
) => {
  const pageSize = DEFAULT_PAGE_SIZE;

  return useInfiniteQuery({
    queryKey: [...commentQueryKeys.byEntity(entityType, entityId), 'infinite'] as const,
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error, count } = await supabase
        .from('comment')
        .select('*, user:profile(id, email, full_name, avatar_url)', { count: 'exact' })
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .is('parent_id', null)
        .order('created_at', { ascending: false })
        .range(pageParam, pageParam + pageSize - 1);

      if (error) throw error;
      return { data: data as CommentWithUser[], count, nextCursor: pageParam + pageSize };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (!lastPage.count || lastPage.data.length < pageSize) return undefined;
      return lastPage.nextCursor;
    },
    enabled: options.enabled !== false && !!entityType && !!entityId,
  });
};

/**
 * Fetch a single comment by ID
 */
export const useComment = (commentId: string, options: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: commentKeys.detail(commentId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comment')
        .select(`
          *,
          user:profile(id, email, full_name, avatar_url),
          resolved_by_user:profile!resolved_by(id, email, full_name)
        `)
        .eq('id', commentId)
        .single();

      if (error) throw error;
      return data as CommentWithUser;
    },
    enabled: options.enabled !== false && !!commentId,
  });
};

/**
 * Fetch comment thread (comment + replies)
 */
export const useCommentThread = (commentId: string, options: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: commentQueryKeys.thread(commentId),
    queryFn: async () => {
      // Fetch parent comment
      const { data: parent, error: parentError } = await supabase
        .from('comment')
        .select('*, user:profile(id, email, full_name, avatar_url)')
        .eq('id', commentId)
        .single();

      if (parentError) throw parentError;

      // Fetch replies
      const { data: replies, error: repliesError } = await supabase
        .from('comment')
        .select('*, user:profile(id, email, full_name, avatar_url)')
        .eq('parent_id', commentId)
        .order('created_at', { ascending: true });

      if (repliesError) throw repliesError;

      return {
        ...parent,
        replies: replies as CommentWithUser[],
      } as CommentThread;
    },
    enabled: options.enabled !== false && !!commentId,
  });
};

/**
 * Fetch unresolved comments for an entity
 */
export const useUnresolvedComments = (entityType: CommentableEntity, entityId: string) => {
  return useQuery({
    queryKey: commentQueryKeys.unresolved(entityType, entityId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comment')
        .select('*, user:profile(id, email, full_name, avatar_url)')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CommentWithUser[];
    },
    enabled: !!entityType && !!entityId,
  });
};

/**
 * Fetch comments by user
 */
export const useCommentsByUser = (userId: string, pagination?: PaginationParams) => {
  const page = pagination?.page ?? DEFAULT_PAGE;
  const pageSize = pagination?.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = calculateOffset(page, pageSize);

  return useQuery({
    queryKey: commentQueryKeys.byUser(userId),
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from('comment')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) throw error;
      return { data: data as Comment[], count };
    },
    enabled: !!userId,
  });
};

/**
 * Fetch comments where user is mentioned
 */
export const useCommentMentions = (userId: string, pagination?: PaginationParams) => {
  const page = pagination?.page ?? DEFAULT_PAGE;
  const pageSize = pagination?.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = calculateOffset(page, pageSize);

  return useQuery({
    queryKey: commentQueryKeys.mentions(userId),
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from('comment')
        .select('*, user:profile(id, email, full_name, avatar_url)', { count: 'exact' })
        .contains('mentions', [userId])
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) throw error;
      return { data: data as CommentWithUser[], count };
    },
    enabled: !!userId,
  });
};

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Create a new comment
 */
export const useCreateComment = (
  options: MutationOptions<Comment, CommentInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (comment: CommentInsert) => {
      const { data, error } = await supabase
        .from('comment')
        .insert(comment)
        .select()
        .single();

      if (error) throw error;
      return data as Comment;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: commentQueryKeys.byEntity(data.entity_type, data.entity_id),
      });
      if (data.parent_id) {
        queryClient.invalidateQueries({
          queryKey: commentQueryKeys.thread(data.parent_id),
        });
      }
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update a comment
 */
export const useUpdateComment = (
  options: MutationOptions<Comment, { id: string; updates: CommentUpdate }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: CommentUpdate }) => {
      const { data, error } = await supabase
        .from('comment')
        .update({ ...updates, edited_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Comment;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: commentKeys.detail(variables.id) });
      queryClient.invalidateQueries({
        queryKey: commentQueryKeys.byEntity(data.entity_type, data.entity_id),
      });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Delete a comment
 */
export const useDeleteComment = (
  options: MutationOptions<void, { id: string; entityType: CommentableEntity; entityId: string }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string; entityType: CommentableEntity; entityId: string }) => {
      const { error } = await supabase
        .from('comment')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: commentQueryKeys.byEntity(variables.entityType, variables.entityId),
      });
      options.onSuccess?.(undefined, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Resolve a comment
 */
export const useResolveComment = (
  options: MutationOptions<Comment, { id: string; resolvedBy: string }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, resolvedBy }: { id: string; resolvedBy: string }) => {
      const { data, error } = await supabase
        .from('comment')
        .update({
          is_resolved: true,
          resolved_by: resolvedBy,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Comment;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: commentKeys.detail(variables.id) });
      queryClient.invalidateQueries({
        queryKey: commentQueryKeys.byEntity(data.entity_type, data.entity_id),
      });
      queryClient.invalidateQueries({
        queryKey: commentQueryKeys.unresolved(data.entity_type, data.entity_id),
      });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Unresolve a comment
 */
export const useUnresolveComment = (
  options: MutationOptions<Comment, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      const { data, error } = await supabase
        .from('comment')
        .update({
          is_resolved: false,
          resolved_by: null,
          resolved_at: null,
        })
        .eq('id', commentId)
        .select()
        .single();

      if (error) throw error;
      return data as Comment;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: commentKeys.detail(variables) });
      queryClient.invalidateQueries({
        queryKey: commentQueryKeys.byEntity(data.entity_type, data.entity_id),
      });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Add reply to a comment
 */
export const useAddReply = (
  options: MutationOptions<Comment, Omit<CommentInsert, 'parent_id'> & { parentId: string }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ parentId, ...reply }: Omit<CommentInsert, 'parent_id'> & { parentId: string }) => {
      const { data, error } = await supabase
        .from('comment')
        .insert({ ...reply, parent_id: parentId })
        .select()
        .single();

      if (error) throw error;
      return data as Comment;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: commentQueryKeys.thread(variables.parentId),
      });
      queryClient.invalidateQueries({
        queryKey: commentQueryKeys.byEntity(data.entity_type, data.entity_id),
      });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

// ============================================================================
// TODO: Additional Features
// ============================================================================
// TODO: Add useCommentReactions hook for emoji reactions
// TODO: Add usePinComment mutation for pinning important comments
// TODO: Add useCommentSearch hook for searching comments
// TODO: Add useBulkResolveComments mutation
// TODO: Add useCommentAnalytics hook for comment statistics
// TODO: Add useCommentExport hook for exporting discussions
// TODO: Add real-time subscriptions for live comment updates
// TODO: Add useCommentVersionHistory hook for edit history
// TODO: Add useReportComment mutation for flagging inappropriate comments
