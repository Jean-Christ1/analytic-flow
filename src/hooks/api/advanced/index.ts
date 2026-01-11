// ============================================================================
// Advanced Domain Hooks - Index
// MLOps Control Plane v3
// Author: Armand AMOUSSOU
// Date: 2026-01-04
// ============================================================================

// Audit Log Hooks
export {
  // Queries
  useAuditLogs,
  useInfiniteAuditLogs,
  useAuditLog,
  useAuditLogsByUser,
  useAuditLogsByResource,
  useAuditLogsByAction,
  useSearchAuditLogs,
  useRecentAuditLogs,
  useSecurityAuditLogs,
  useFailedOperations,
  useAuditStats,
  // Mutations
  useCreateAuditLog,
  useBatchCreateAuditLogs,
  usePurgeAuditLogs,
  // Utility
  useAuditLogger,
  // Keys
  auditLogKeys,
  auditLogQueryKeys,
  // Types
  type AuditLog,
  type AuditLogInsert,
  type AuditLogWithUser,
  type AuditAction,
  type AuditResourceType,
  type AuditSeverity,
  type AuditChange,
  type AuditLogFilters,
  type AuditStats,
} from './useAuditLogs';

// Feature Flag Hooks
export {
  // Queries
  useFeatureFlags,
  useFeatureFlag,
  useFeatureFlagByKey,
  useActiveFeatureFlags,
  useFeatureFlagsByStatus,
  useFeatureFlagsByTag,
  useEvaluateFlags,
  useFlagEnabled,
  // Mutations
  useCreateFeatureFlag,
  useUpdateFeatureFlag,
  useToggleFeatureFlag,
  useDeleteFeatureFlag,
  useArchiveFeatureFlag,
  useUpdateFlagRules,
  useUpdateFlagTargeting,
  // Keys
  featureFlagKeys,
  featureFlagQueryKeys,
  // Types
  type FeatureFlag,
  type FeatureFlagInsert,
  type FeatureFlagUpdate,
  type FeatureFlagWithStats,
  type FeatureFlagType,
  type FeatureFlagStatus,
  type FeatureFlagRule,
  type FeatureFlagCondition,
  type FeatureFlagTargeting,
  type EvaluationContext,
  type EvaluationResult,
} from './useFeatureFlags';

// Quota Hooks
export {
  // Queries
  useQuotas,
  useQuota,
  useQuotasByTenant,
  useQuotasByProject,
  useQuotasByTeam,
  useQuotasByUser,
  useQuotaByResource,
  useQuotaStatus,
  useExceededQuotas,
  useQuotaWarnings,
  useCheckQuota,
  // Mutations
  useCreateQuota,
  useUpdateQuota,
  useDeleteQuota,
  useIncrementQuotaUsage,
  useDecrementQuotaUsage,
  useResetQuotaUsage,
  useResetPeriodicQuotas,
  // Keys
  quotaKeys,
  quotaQueryKeys,
  // Types
  type Quota,
  type QuotaInsert,
  type QuotaUpdate,
  type QuotaWithScope,
  type QuotaResourceType,
  type QuotaScope,
  type QuotaPeriod,
  type QuotaUsage,
  type QuotaStatus,
  type QuotaSummary,
} from './useQuotas';

// Webhook Hooks
export {
  // Webhook Queries
  useWebhooks,
  useWebhook,
  useWebhooksByProject,
  useActiveWebhooks,
  useWebhooksByEvent,
  // Delivery Queries
  useWebhookDeliveries,
  useInfiniteWebhookDeliveries,
  useWebhookDelivery,
  useFailedDeliveries,
  useRecentDeliveries,
  // Webhook Mutations
  useCreateWebhook,
  useUpdateWebhook,
  useDeleteWebhook,
  useToggleWebhookStatus,
  useTestWebhook,
  useRegenerateWebhookSecret,
  // Delivery Mutations
  useRetryDelivery,
  // Keys
  webhookKeys,
  webhookQueryKeys,
  webhookDeliveryKeys,
  deliveryQueryKeys,
  // Types
  type Webhook,
  type WebhookInsert,
  type WebhookUpdate,
  type WebhookWithStats,
  type WebhookEventType,
  type WebhookStatus,
  type WebhookDelivery,
  type WebhookDeliveryStatus,
  type WebhookTestResult,
} from './useWebhooks';

// ============================================================================
// TODO: Additional Advanced Hooks
// ============================================================================
// TODO: Add useScheduledJobs hooks for cron/scheduled tasks
// TODO: Add useIntegrations hooks for third-party integrations
// TODO: Add useApiKeys hooks for API key management
// TODO: Add useSecrets hooks for secret management
// TODO: Add useSso hooks for SSO configuration
// TODO: Add useOAuth hooks for OAuth providers
// TODO: Add useBackups hooks for backup management
// TODO: Add useMigrations hooks for data migrations
// TODO: Add useSystemHealth hooks for system monitoring
// TODO: Add useMetrics hooks for custom metrics
// TODO: Add useLicensing hooks for license management
// TODO: Add useBilling hooks for billing/subscription management
// TODO: Add useCompliance hooks for compliance reporting
// TODO: Add useDataRetention hooks for data retention policies
