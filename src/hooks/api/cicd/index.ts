// ============================================================================
// CI/CD Domain Hooks - Index
// MLOps Control Plane v3
// Author: Armand AMOUSSOU
// Date: 2026-01-04
// ============================================================================

// Git Provider Hooks (GitLab, GitHub, Bitbucket)
export {
  // GitLab Instance Queries
  useGitLabInstances,
  useGitLabInstance,
  useGitLabInstanceByUrl,
  useActiveGitLabInstances,
  // Git Provider Queries
  useGitProviders,
  useGitProvider,
  useGitProvidersByType,
  useGitProvidersByInstance,
  // Repo Binding Queries
  useRepoBindings,
  useRepoBinding,
  useRepoBindingsByProject,
  useRepoBindingsByProvider,
  useRepoBindingByRepoPath,
  // GitLab Instance Mutations
  useCreateGitLabInstance,
  useUpdateGitLabInstance,
  useDeleteGitLabInstance,
  useUpdateGitLabInstanceStatus,
  useUpdateGitLabWebhookSecret,
  // Git Provider Mutations
  useCreateGitProvider,
  useUpdateGitProvider,
  useDeleteGitProvider,
  useUpdateGitProviderCredentials,
  useUpdateGitProviderScopes,
  // Repo Binding Mutations
  useCreateRepoBinding,
  useUpdateRepoBinding,
  useDeleteRepoBinding,
  useToggleRepoBindingProtection,
  useUpdateDefaultBranch,
  // Keys
  gitLabInstanceKeys,
  gitLabInstanceQueryKeys,
  gitProviderKeys,
  gitProviderQueryKeys,
  repoBindingKeys,
  repoBindingQueryKeys,
  // Types
  type GitLabInstance,
  type GitLabInstanceInsert,
  type GitLabInstanceUpdate,
  type GitProvider,
  type GitProviderInsert,
  type GitProviderUpdate,
  type GitProviderWithInstance,
  type GitProviderType,
  type RepoBinding,
  type RepoBindingInsert,
  type RepoBindingUpdate,
  type RepoBindingWithRelations,
} from './useGitProviders';

// Pipeline Hooks (Pipelines, Stages, Jobs, Artifacts)
export {
  // Pipeline Queries
  usePipelines,
  useInfinitePipelines,
  usePipeline,
  usePipelinesByProject,
  usePipelinesByRepo,
  usePipelinesByStatus,
  useRunningPipelines,
  useLatestPipelineByRepo,
  // Stage Queries
  useStages,
  useStagesByPipeline,
  useFailedStages,
  // Job Queries
  useJobs,
  useJob,
  useJobsByPipeline,
  useJobsByStage,
  useRunningJobs,
  useFailedJobs,
  // Artifact Queries
  useArtifacts,
  useArtifactsByJob,
  useArtifactsByPipeline,
  useArtifactByPath,
  // Pipeline Mutations
  useCreatePipeline,
  useUpdatePipeline,
  useDeletePipeline,
  useUpdatePipelineStatus,
  useTriggerPipeline,
  useCancelPipeline,
  useRetryPipeline,
  // Stage Mutations
  useCreateStage,
  useUpdateStage,
  useUpdateStageStatus,
  // Job Mutations
  useCreateJob,
  useUpdateJob,
  useUpdateJobStatus,
  useRetryJob,
  useCancelJob,
  // Artifact Mutations
  useCreateArtifact,
  useDeleteArtifact,
  useUpdateArtifactExpiry,
  // Keys
  pipelineKeys,
  pipelineQueryKeys,
  stageKeys,
  stageQueryKeys,
  jobKeys,
  jobQueryKeys,
  artifactKeys,
  artifactQueryKeys,
  // Types
  type CicdPipeline,
  type CicdPipelineInsert,
  type CicdPipelineUpdate,
  type CicdPipelineWithRelations,
  type CicdPipelineStatus,
  type CicdStage,
  type CicdStageInsert,
  type CicdStageWithJobs,
  type CicdJob,
  type CicdJobInsert,
  type CicdJobUpdate,
  type CicdJobWithArtifacts,
  type CicdJobArtifact,
  type CicdJobArtifactInsert,
  type ArtifactType,
} from './usePipelines';

// ArgoCD Hooks (Instances, Applications, Sync, Drift)
export {
  // Instance Queries
  useArgoCdInstances,
  useArgoCdInstance,
  useArgoCdInstanceByUrl,
  useActiveArgoCdInstances,
  // Application Queries
  useArgoCdApplications,
  useArgoCdApplication,
  useArgoCdApplicationByName,
  useArgoCdApplicationsByProject,
  useArgoCdApplicationsByInstance,
  useArgoCdApplicationsByStatus,
  useUnhealthyApps,
  useOutOfSyncApps,
  // Sync History Queries
  useSyncHistory,
  useSyncHistoryByApplication,
  useLatestSync,
  useFailedSyncs,
  // Drift Finding Queries
  useDriftFindings,
  useDriftFindingsByApplication,
  useUnresolvedDriftFindings,
  // Instance Mutations
  useCreateArgoCdInstance,
  useUpdateArgoCdInstance,
  useDeleteArgoCdInstance,
  useUpdateArgoCdInstanceStatus,
  useUpdateArgoCdCredentials,
  // Application Mutations
  useCreateArgoCdApplication,
  useUpdateArgoCdApplication,
  useDeleteArgoCdApplication,
  useUpdateApplicationSyncPolicy,
  useUpdateHealthStatus,
  useSyncApplication,
  useRefreshApplication,
  useRollbackApplication,
  // Sync History Mutations
  useRecordSyncOperation,
  // Drift Finding Mutations
  useRecordDriftFinding,
  useResolveDriftFinding,
  useAcknowledgeDriftFinding,
  useBulkResolveDrift,
  // Keys
  argoCdInstanceKeys,
  argoCdInstanceQueryKeys,
  argoCdApplicationKeys,
  argoCdApplicationQueryKeys,
  syncHistoryKeys,
  syncHistoryQueryKeys,
  driftFindingKeys,
  driftFindingQueryKeys,
  // Types
  type ArgoCdInstance,
  type ArgoCdInstanceInsert,
  type ArgoCdInstanceUpdate,
  type ArgoCdApplication,
  type ArgoCdApplicationInsert,
  type ArgoCdApplicationUpdate,
  type ArgoCdApplicationWithRelations,
  type HealthStatus,
  type SyncStatus,
  type SyncPolicy,
  type ArgoCdSyncHistory,
  type ArgoCdSyncHistoryInsert,
  type ArgoCdDriftFinding,
  type ArgoCdDriftFindingInsert,
  type DriftSeverity,
} from './useArgoCD';

// ============================================================================
// TODO: Additional CI/CD Hooks
// ============================================================================
// TODO: Add useCicdEnvironments hooks for deployment environments
// TODO: Add useCicdDeployments hooks for deployment tracking
// TODO: Add useCicdQualityGates hooks for quality gate management
// TODO: Add useReleases hooks for release management
// TODO: Add useReleaseLinks hooks for release artifacts
// TODO: Add useDeploymentApprovals hooks for deployment approvals
// TODO: Add usePipelineTemplates hooks for reusable pipeline templates
// TODO: Add usePipelineVariables hooks for pipeline variable management
// TODO: Add usePipelineSchedules hooks for scheduled pipeline runs
// TODO: Add useWebhooks hooks for webhook management
// TODO: Add useBuildMetrics hooks for build analytics
// TODO: Add useDeploymentMetrics hooks for deployment analytics
