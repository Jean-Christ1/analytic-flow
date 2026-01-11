// ============================================================================
// Observability Domain Hooks Index
// MLOps Control Plane v3
// Author: Armand AMOUSSOU
// Date: 2026-01-04
// ============================================================================
//
// This module exports all hooks related to Observability, Incident Management,
// and Service Level Agreements (SLAs) for ML operations monitoring.
//
// Domain Coverage:
// - Observability Backends: Integration with logging, metrics, and tracing systems
// - Observability Links: Connecting entities to their observability data
// - Incidents: Incident lifecycle management and response
// - SLA Policies: Service Level Agreement definitions and compliance tracking
//
// ============================================================================

// Observability Backends - Monitoring System Integration
export {
  // Types
  type ObservabilityKind,
  type ObservabilityType,
  type ObservabilityBackend,
  type ObservabilityBackendInsert,
  type ObservabilityBackendUpdate,
  type ObservabilityBackendWithStatus,
  // Query Keys
  observabilityBackendKeys,
  // Queries
  useObservabilityBackends,
  useObservabilityBackend,
  useObservabilityBackendsByKind,
  useObservabilityBackendsByType,
  useLogsBackends,
  useMetricsBackends,
  useTracesBackends,
  useSearchObservabilityBackends,
  useObservabilityBackendSummary,
  useObservabilityBackendHealth,
  // Mutations
  useCreateObservabilityBackend,
  useUpdateObservabilityBackend,
  useDeleteObservabilityBackend,
  useTestObservabilityBackend,
} from './useObservabilityBackends';

// Observability Links - Entity to Backend Mapping
export {
  // Types
  type ObservableEntityType,
  type ObservabilityQuery,
  type ObservabilityLink,
  type ObservabilityLinkInsert,
  type ObservabilityLinkUpdate,
  type ObservabilityLinkWithBackend,
  // Query Keys
  observabilityLinkKeys,
  // Queries
  useObservabilityLinks,
  useObservabilityLink,
  useObservabilityLinksByEntity,
  useObservabilityLinksByBackend,
  useObservabilityLinksByEntityType,
  useRunObservabilityLinks,
  useDeploymentObservabilityLinks,
  useBuildDeepLink,
  // Mutations
  useCreateObservabilityLink,
  useUpdateObservabilityLink,
  useDeleteObservabilityLink,
  useBulkCreateObservabilityLinks,
  useAutoProvisionObservabilityLinks,
} from './useObservabilityLinks';

// Incidents - Incident Management
export {
  // Types
  type IncidentSeverity,
  type IncidentStatus,
  type IncidentUpdateType,
  type RelatedEntity,
  type Incident,
  type IncidentInsert,
  type IncidentUpdate,
  type IncidentTimelineEntry,
  type IncidentTimelineEntryInsert,
  type IncidentWithRelations,
  type IncidentMetrics,
  // Query Keys
  incidentKeys,
  incidentTimelineKeys,
  // Queries
  useIncidents,
  useIncident,
  useIncidentsByProject,
  useIncidentsByStatus,
  useIncidentsBySeverity,
  useOpenIncidents,
  useCriticalIncidents,
  useMyIncidents,
  useSearchIncidents,
  useIncidentTimeline,
  useIncidentMetrics,
  useIncidentTrends,
  // Mutations
  useCreateIncident,
  useUpdateIncident,
  useDeleteIncident,
  useAcknowledgeIncident,
  useResolveIncident,
  useCloseIncident,
  useAddIncidentUpdate,
  useEscalateIncident,
} from './useIncidents';

// SLA Policies - Service Level Agreement Management
export {
  // Types
  type SLAScopeType,
  type SLAMetricType,
  type SLATarget,
  type SLATargets,
  type SLAPolicy,
  type SLAPolicyInsert,
  type SLAPolicyUpdate,
  type SLAComplianceResult,
  type ErrorBudgetStatus,
  // Predefined Templates
  SLA_TEMPLATES,
  // Query Keys
  slaPolicyKeys,
  // Queries
  useSLAPolicies,
  useSLAPolicy,
  useSLAPoliciesByScopeType,
  useSLAPoliciesByScope,
  useTenantSLAPolicies,
  useProjectSLAPolicies,
  useSearchSLAPolicies,
  useSLACompliance,
  useErrorBudgetStatus,
  useSLAPoliciesWithCompliance,
  useSLATemplates,
  // Mutations
  useCreateSLAPolicy,
  useUpdateSLAPolicy,
  useDeleteSLAPolicy,
  useCreateSLAFromTemplate,
  useAddSLATarget,
} from './useSLAPolicies';

// ============================================================================
// TODO: Future Domain Additions
// ============================================================================
// TODO: Add useAlertRules hooks for alert configuration
// TODO: Add useAlertHistory hooks for alert history tracking
// TODO: Add useDashboards hooks for custom dashboard management
// TODO: Add useStatusPages hooks for public status page integration
// TODO: Add useOnCall hooks for on-call schedule management
// TODO: Add useRunbooks hooks for incident response runbooks
// TODO: Add usePostMortems hooks for post-incident analysis
// TODO: Add useSyntheticMonitoring hooks for proactive monitoring
// TODO: Add useAnomalyDetection hooks for ML-based anomaly detection
// TODO: Add useCapacityPlanning hooks for resource forecasting
