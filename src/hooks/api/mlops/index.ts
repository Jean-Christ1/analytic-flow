// ============================================================================
// MLOps Domain Hooks - Index
// MLOps Control Plane v3
// Author: Armand AMOUSSOU
// Date: 2026-01-04
// ============================================================================

// Experiment Hooks
export {
  useExperiments,
  useInfiniteExperiments,
  useExperiment,
  useExperimentsByProject,
  useActiveExperiments,
  useSearchExperiments,
  useCreateExperiment,
  useUpdateExperiment,
  useDeleteExperiment,
  useArchiveExperiment,
  useCompleteExperiment,
  useUpdateExperimentTags,
  experimentKeys,
  type Experiment,
  type ExperimentInsert,
  type ExperimentUpdate,
  type ExperimentWithStats,
  type ExperimentStatus,
} from './useExperiments';

// Model Hooks
export {
  // Model queries
  useModels,
  useModel,
  useModelsByProject,
  useModelsByFramework,
  useSearchModels,
  // Model version queries
  useModelVersions,
  useModelVersion,
  useLatestModelVersion,
  useProductionModelVersion,
  // Model deployment queries
  useModelDeployments,
  useActiveDeployments,
  // Model mutations
  useCreateModel,
  useUpdateModel,
  useDeleteModel,
  // Model version mutations
  useCreateModelVersion,
  useTransitionModelVersionStage,
  usePromoteToProduction,
  // Keys
  modelKeys,
  modelVersionKeys,
  modelDeploymentKeys,
  // Types
  type Model,
  type ModelInsert,
  type ModelUpdate,
  type ModelVersion,
  type ModelVersionInsert,
  type ModelDeployment,
  type ModelWithVersions,
  type ModelStage,
  type ModelVersionStatus,
  type DeploymentStatus,
  type DeploymentTarget,
} from './useModels';

// Run Hooks
export {
  // Run queries
  useRuns,
  useInfiniteRuns,
  useRun,
  useRunsByExperiment,
  useRunsByUser,
  useRunsByStatus,
  useActiveRuns,
  useFailedRuns,
  useSearchRuns,
  useChildRuns,
  useRunMetrics,
  useRunParams,
  useCompareRuns,
  useBestRun,
  // Run mutations
  useCreateRun,
  useUpdateRun,
  useStartRun,
  useCompleteRun,
  useFailRun,
  useCancelRun,
  useDeleteRun,
  useLogRunMetric,
  useBatchLogRunMetrics,
  useSetRunParam,
  useUpdateRunTags,
  // Keys
  runKeys,
  runQueryKeys,
  // Types
  type Run,
  type RunInsert,
  type RunUpdate,
  type RunWithMetrics,
  type RunMetric,
  type RunParam,
  type RunComparison,
  type RunStatus,
  type RunSource,
} from './useRuns';

// Metric Hooks
export {
  // Metric value queries
  useMetricsByRun,
  useMetricSeries,
  useMetricKeys,
  useLatestMetrics,
  useCompareMetrics,
  useAggregateMetrics,
  // Metric definition queries
  useMetricDefinitions,
  useMetricDefinition,
  // Metric alert queries
  useMetricAlerts,
  useUnacknowledgedAlertsCount,
  // Metric mutations
  useCreateMetricDefinition,
  useUpdateMetricDefinition,
  useDeleteMetricDefinition,
  useAcknowledgeMetricAlert,
  useBulkAcknowledgeAlerts,
  // Keys
  metricKeys,
  metricQueryKeys,
  // Types
  type Metric,
  type MetricSeries,
  type MetricPoint,
  type MetricDefinition,
  type MetricDefinitionInsert,
  type MetricDefinitionUpdate,
  type MetricAggregation,
  type MetricComparison,
  type MetricAlert,
  type MetricType,
  type AggregationType,
} from './useMetrics';

// Artifact Hooks
export {
  // Artifact queries
  useArtifacts,
  useInfiniteArtifacts,
  useArtifact,
  useArtifactsByRun,
  useArtifactsByExperiment,
  useArtifactsByModelVersion,
  useArtifactsByType,
  useSearchArtifacts,
  useChildArtifacts,
  useArtifactTree,
  useArtifactDownloadUrl,
  useArtifactStorageStats,
  useModelArtifacts,
  // Artifact mutations
  useCreateArtifact,
  useBatchCreateArtifacts,
  useUpdateArtifact,
  useDeleteArtifact,
  useBatchDeleteArtifacts,
  useUpdateArtifactTags,
  useMoveArtifact,
  useCopyArtifact,
  // Keys
  artifactKeys,
  artifactQueryKeys,
  // Types
  type Artifact,
  type ArtifactInsert,
  type ArtifactUpdate,
  type ArtifactWithRelations,
  type ArtifactDownloadUrl,
  type ArtifactUploadUrl,
  type ArtifactTree,
  type ArtifactStorageStats,
  type ArtifactType,
  type ArtifactStorageType,
} from './useArtifacts';

// Workspace Hooks
export {
  // Workspace queries
  useWorkspaces,
  useInfiniteWorkspaces,
  useWorkspace,
  useWorkspacesByProject,
  useWorkspacesByUser,
  useWorkspacesByStatus,
  useRunningWorkspaces,
  useMyWorkspaces,
  useSearchWorkspaces,
  useWorkspaceSessions,
  useWorkspaceUsage,
  // Template queries
  useWorkspaceTemplates,
  useWorkspaceTemplate,
  useDefaultTemplates,
  // Workspace mutations
  useCreateWorkspace,
  useCreateWorkspaceFromTemplate,
  useUpdateWorkspace,
  useStartWorkspace,
  useStopWorkspace,
  useRestartWorkspace,
  useTerminateWorkspace,
  useDeleteWorkspace,
  useUpdateWorkspaceActivity,
  // Template mutations
  useCreateWorkspaceTemplate,
  useDeleteWorkspaceTemplate,
  // Keys
  workspaceKeys,
  workspaceQueryKeys,
  // Types
  type Workspace,
  type WorkspaceInsert,
  type WorkspaceUpdate,
  type WorkspaceWithRelations,
  type WorkspaceSession,
  type WorkspaceTemplate,
  type WorkspaceUsageStats,
  type WorkspaceVolume,
  type WorkspacePort,
  type WorkspaceType,
  type WorkspaceStatus,
  type WorkspaceSize,
} from './useWorkspaces';

// ============================================================================
// TODO: Additional MLOps Hooks
// ============================================================================
// TODO: Add useDatasets hooks for dataset management
// TODO: Add useFeatureStore hooks for feature engineering
// TODO: Add useMonitoring hooks for model monitoring
// TODO: Add usePipelines hooks for ML pipelines
// TODO: Add useLabeling hooks for data labeling
// TODO: Add useAutoML hooks for automated ML
// TODO: Add useHyperparameters hooks for hyperparameter tuning
// TODO: Add useModelRegistry hooks for model registry
// TODO: Add useServing hooks for model serving
// TODO: Add useABTesting hooks for A/B testing
