// ============================================================================
// Governance Domain Hooks Index
// MLOps Control Plane v3
// Author: Armand AMOUSSOU
// Date: 2026-01-04
// ============================================================================
//
// This module exports all hooks related to AI Governance, designed to support
// EU AI Act compliance and responsible AI practices.
//
// Domain Coverage:
// - AI Systems: Registration and lifecycle management of AI systems
// - Model Cards: Standardized model documentation (per Mitchell et al., 2019)
// - Risk Assessments: Risk identification, analysis, and mitigation
// - Compliance Controls: Framework-based control definitions
// - Compliance Evidence: Evidence collection and validation
// - Governance Incidents: AI incident management and reporting
//
// ============================================================================

// AI Systems - EU AI Act Article 9 (Risk Management)
export {
  // Types
  type AIRiskClass,
  type AISystemStatus,
  type AISystem,
  type AISystemInsert,
  type AISystemUpdate,
  type AISystemWithRelations,
  // Query Keys
  aiSystemKeys,
  // Queries
  useAISystems,
  useAISystem,
  useAISystemsByProject,
  useAISystemsByRiskClass,
  useHighRiskAISystems,
  useAISystemsByStatus,
  useSearchAISystems,
  useAISystemComplianceSummary,
  // Mutations
  useCreateAISystem,
  useUpdateAISystem,
  useDeleteAISystem,
  useTransitionAISystemStatus,
  useClassifyAISystemRisk,
} from './useAISystems';

// Model Cards - EU AI Act Article 11 (Technical Documentation)
export {
  // Types
  type ModelCard,
  type ModelCardInsert,
  type ModelCardUpdate,
  type ModelCardWithRelations,
  type ModelPerformanceMetrics,
  // Query Keys
  modelCardKeys,
  // Queries
  useModelCards,
  useModelCard,
  useModelCardByVersion,
  useModelCardsByAISystem,
  useSearchModelCards,
  useStaleModelCards,
  // Mutations
  useCreateModelCard,
  useUpdateModelCard,
  useDeleteModelCard,
  useUpdateModelCardPerformance,
  useLinkModelCardToAISystem,
  useBumpModelCardVersion,
} from './useModelCards';

// Risk Assessments - EU AI Act Article 9 (Risk Management System)
export {
  // Types
  type ResidualRiskLevel,
  type RiskDecision,
  type Hazard,
  type Mitigation,
  type RiskAssessment,
  type RiskAssessmentInsert,
  type RiskAssessmentUpdate,
  type RiskAssessmentWithRelations,
  // Query Keys
  riskAssessmentKeys,
  // Queries
  useRiskAssessments,
  useRiskAssessment,
  useRiskAssessmentsByAISystem,
  useLatestRiskAssessment,
  useRiskAssessmentsByRiskLevel,
  useRiskAssessmentsRequiringReview,
  useRiskAssessmentsByDecision,
  useRiskAssessmentStats,
  // Mutations
  useCreateRiskAssessment,
  useUpdateRiskAssessment,
  useDeleteRiskAssessment,
  useAddHazard,
  useAddMitigation,
  useFinalizeRiskAssessment,
  useScheduleReview,
} from './useRiskAssessments';

// Compliance Controls - Framework-based control definitions
export {
  // Types
  type ComplianceFramework,
  type ComplianceControl,
  type ComplianceControlInsert,
  type ComplianceControlUpdate,
  type ComplianceControlWithEvidence,
  // Predefined Controls
  EU_AI_ACT_CONTROLS,
  // Query Keys
  complianceControlKeys,
  // Queries
  useComplianceControls,
  useComplianceControl,
  useComplianceControlsByFramework,
  useEUAIActControls,
  useSearchComplianceControls,
  useComplianceStatus,
  useAvailableFrameworks,
  // Mutations
  useCreateComplianceControl,
  useUpdateComplianceControl,
  useDeleteComplianceControl,
  useInitializeEUAIActControls,
  useBulkCreateControls,
} from './useComplianceControls';

// Compliance Evidence - EU AI Act Articles 12, 16, 18
export {
  // Types
  type ComplianceEvidenceStatus,
  type EvidenceEntityType,
  type ComplianceEvidence,
  type ComplianceEvidenceInsert,
  type ComplianceEvidenceUpdate,
  type ComplianceEvidenceWithRelations,
  // Query Keys
  complianceEvidenceKeys,
  // Queries
  useComplianceEvidence,
  useComplianceEvidenceById,
  useEvidenceByControl,
  useEvidenceByEntity,
  useEvidenceByStatus,
  usePendingEvidence,
  useValidatedEvidence,
  useRejectedEvidence,
  useEvidenceSummary,
  useComplianceGaps,
  // Mutations
  useCreateComplianceEvidence,
  useUpdateComplianceEvidence,
  useDeleteComplianceEvidence,
  useSubmitEvidence,
  useValidateEvidence,
  useRejectEvidence,
  useAttachArtifact,
  useBulkCreateEvidence,
} from './useComplianceEvidence';

// Governance Incidents - EU AI Act Article 62 (Reporting of serious incidents)
export {
  // Types
  type GovernanceIncidentType,
  type IncidentSeverity,
  type GovernanceIncidentStatus,
  type GovernanceIncident,
  type GovernanceIncidentInsert,
  type GovernanceIncidentUpdate,
  type GovernanceIncidentWithRelations,
  // Query Keys
  governanceIncidentKeys,
  // Queries
  useGovernanceIncidents,
  useGovernanceIncident,
  useIncidentsByAISystem,
  useIncidentsByStatus,
  useOpenIncidents,
  useCriticalIncidents,
  useIncidentsByType,
  useMyIncidents,
  useIncidentStats,
  useIncidentTrends,
  // Mutations
  useCreateGovernanceIncident,
  useUpdateGovernanceIncident,
  useDeleteGovernanceIncident,
  useTransitionIncidentStatus,
  useResolveIncident,
  useCloseIncident,
  useAssignIncident,
  useEscalateIncident,
} from './useGovernanceIncidents';

// ============================================================================
// TODO: Future Domain Additions
// ============================================================================
// TODO: Add useMonitoringPlans hooks for EU AI Act Article 9(9)
// TODO: Add useHumanOversight hooks for EU AI Act Article 14
// TODO: Add useTransparency hooks for EU AI Act Article 13
// TODO: Add useDataGovernance hooks for EU AI Act Article 10
// TODO: Add useBiasDetection hooks for fairness monitoring
// TODO: Add useExplainability hooks for model interpretability
// TODO: Add useAuditTrail hooks for comprehensive audit logging
// TODO: Add useConformityAssessment hooks for EU AI Act Article 43
// TODO: Add useCEMarking hooks for EU AI Act Article 49
// TODO: Add useNotifiedBody hooks for third-party assessment
