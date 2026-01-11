// ============================================================================
// Collaboration Domain Hooks - Index
// MLOps Control Plane v3
// Author: Armand AMOUSSOU
// Date: 2026-01-04
// ============================================================================

// Comment Hooks
export {
  // Queries
  useComments,
  useComment,
  useCommentsByEntity,
  useInfiniteCommentsByEntity,
  useCommentThread,
  useUnresolvedComments,
  useCommentsByUser,
  useCommentMentions,
  // Mutations
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
  useResolveComment,
  useUnresolveComment,
  useAddReply,
  // Keys
  commentKeys,
  commentQueryKeys,
  // Types
  type Comment,
  type CommentInsert,
  type CommentUpdate,
  type CommentWithUser,
  type CommentThread,
  type CommentableEntity,
  type CommentAttachment,
} from './useComments';

// Task Hooks
export {
  // Task Queries
  useTasks,
  useInfiniteTasks,
  useTask,
  useTasksByProject,
  useTasksByAssignee,
  useTasksByStatus,
  useTasksByPriority,
  useSubtasks,
  useMyTasks,
  useOverdueTasks,
  // Dependency Queries
  useTaskDependencies,
  useBlockingTasks,
  useBlockedTasks,
  // Task Mutations
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useAssignTask,
  useUpdateTaskStatus,
  useUpdateTaskPriority,
  useLogTaskTime,
  // Dependency Mutations
  useAddTaskDependency,
  useRemoveTaskDependency,
  // Keys
  taskKeys,
  taskQueryKeys,
  taskDependencyKeys,
  dependencyQueryKeys,
  // Types
  type Task,
  type TaskInsert,
  type TaskUpdate,
  type TaskWithRelations,
  type TaskDependency,
  type TaskDependencyInsert,
  type TaskDependencyWithTask,
  type TaskPriority,
  type TaskStatus,
  type TaskType,
  type DependencyType,
} from './useTasks';

// Notification Hooks
export {
  // Queries
  useNotifications,
  useInfiniteNotifications,
  useUnreadNotifications,
  useUnreadCount,
  useNotificationsByType,
  useHighPriorityNotifications,
  useArchivedNotifications,
  useNotificationStats,
  useNotificationPreferences,
  // Mutations
  useCreateNotification,
  useMarkAsRead,
  useMarkAllAsRead,
  useArchiveNotification,
  useBulkArchive,
  useDeleteNotification,
  useUpdateNotificationPreferences,
  useClearExpiredNotifications,
  // Keys
  notificationKeys,
  notificationQueryKeys,
  // Types
  type Notification,
  type NotificationInsert,
  type NotificationWithSender,
  type NotificationType,
  type NotificationPriority,
  type NotificationChannel,
  type NotificationPreferences,
  type NotificationStats,
} from './useNotifications';

// Activity Feed Hooks
export {
  // Queries
  useActivityFeed,
  useInfiniteActivityFeed,
  useActivityByProject,
  useActivityByUser,
  useActivityByEntity,
  useActivityByEventType,
  useRecentActivities,
  useActivityTimeline,
  useActivityStats,
  usePublicActivities,
  // Mutations
  useRecordActivity,
  useBatchRecordActivities,
  useCleanupOldActivities,
  // Utility
  useActivityDescription,
  // Keys
  activityFeedKeys,
  activityFeedQueryKeys,
  // Types
  type ActivityFeed,
  type ActivityInsert,
  type ActivityWithUser,
  type ActivityEventType,
  type ActivityEntityType,
  type ActivityChange,
  type ActivityAggregation,
  type ActivityTimelineEntry,
} from './useActivityFeed';

// ============================================================================
// TODO: Additional Collaboration Hooks
// ============================================================================
// TODO: Add useReviews hooks for code/model review workflows
// TODO: Add useMentions hooks for @mention handling
// TODO: Add useReactions hooks for emoji reactions
// TODO: Add useFavorites hooks for bookmarking entities
// TODO: Add useWatchers hooks for entity subscriptions
// TODO: Add useSharing hooks for sharing configurations
// TODO: Add useTeamActivity hooks for team dashboards
// TODO: Add useCollaborators hooks for real-time collaboration
// TODO: Add usePresence hooks for online status
// TODO: Add useDiscussions hooks for threaded discussions
// TODO: Add useAnnotations hooks for data annotations
// TODO: Add useApprovals hooks for approval workflows
