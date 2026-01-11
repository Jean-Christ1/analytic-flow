/**
 * CI/CD and GitOps Database Types
 *
 * GitLab integration, Git providers, CI/CD pipelines, stages, jobs,
 * ArgoCD applications, releases, and deployment configurations.
 */

import type {
  Json,
  CICDPipelineStatus,
  CICDPipelineSource,
  CICDJobStatus,
  CICDEnvironmentTier,
  CICDQualityGateType,
  CICDQualityGateStatus,
  ArgoCDSyncStatus,
  ArgoCDHealthStatus,
  DriftSeverity,
  DriftStatus,
} from './common';

// ============================================================================
// GITLAB INSTANCE
// ============================================================================

export interface GitLabInstanceRow {
  id: string;
  tenant_id: string;
  name: string;
  base_url: string | null;
  mode: string | null; // saas|self_managed
  api_version: string | null;
  auth_secret_ref: string | null;
  webhook_secret_ref: string | null;
  created_at: string;
  updated_at: string;
}

export interface GitLabInstanceInsert {
  id?: string;
  tenant_id: string;
  name: string;
  base_url?: string | null;
  mode?: string | null;
  api_version?: string | null;
  auth_secret_ref?: string | null;
  webhook_secret_ref?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface GitLabInstanceUpdate {
  id?: string;
  tenant_id?: string;
  name?: string;
  base_url?: string | null;
  mode?: string | null;
  api_version?: string | null;
  auth_secret_ref?: string | null;
  webhook_secret_ref?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface GitLabInstanceTable {
  Row: GitLabInstanceRow;
  Insert: GitLabInstanceInsert;
  Update: GitLabInstanceUpdate;
  Relationships: [
    {
      foreignKeyName: 'gitlab_instance_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'gitlab_instance_auth_secret_ref_fkey';
      columns: ['auth_secret_ref'];
      referencedRelation: 'secret_ref';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'gitlab_instance_webhook_secret_ref_fkey';
      columns: ['webhook_secret_ref'];
      referencedRelation: 'secret_ref';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// GIT PROVIDER
// ============================================================================

export interface GitProviderRow {
  id: string;
  tenant_id: string;
  type: string; // gitlab|github|bitbucket
  base_url: string | null;
  app_installation_ref: Json | null;
  auth_secret_ref: string | null;
  created_at: string;
  updated_at: string;
}

export interface GitProviderInsert {
  id?: string;
  tenant_id: string;
  type: string;
  base_url?: string | null;
  app_installation_ref?: Json | null;
  auth_secret_ref?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface GitProviderUpdate {
  id?: string;
  tenant_id?: string;
  type?: string;
  base_url?: string | null;
  app_installation_ref?: Json | null;
  auth_secret_ref?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface GitProviderTable {
  Row: GitProviderRow;
  Insert: GitProviderInsert;
  Update: GitProviderUpdate;
  Relationships: [
    {
      foreignKeyName: 'git_provider_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'git_provider_auth_secret_ref_fkey';
      columns: ['auth_secret_ref'];
      referencedRelation: 'secret_ref';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// REPO BINDING
// ============================================================================

export interface RepoBindingRow {
  id: string;
  tenant_id: string;
  project_id: string;
  provider_id: string;
  repo_full_name: string;
  default_branch: string | null;
  webhook_secret_ref: string | null;
  created_at: string;
  updated_at: string;
}

export interface RepoBindingInsert {
  id?: string;
  tenant_id: string;
  project_id: string;
  provider_id: string;
  repo_full_name: string;
  default_branch?: string | null;
  webhook_secret_ref?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface RepoBindingUpdate {
  id?: string;
  tenant_id?: string;
  project_id?: string;
  provider_id?: string;
  repo_full_name?: string;
  default_branch?: string | null;
  webhook_secret_ref?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface RepoBindingTable {
  Row: RepoBindingRow;
  Insert: RepoBindingInsert;
  Update: RepoBindingUpdate;
  Relationships: [
    {
      foreignKeyName: 'repo_binding_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'repo_binding_project_id_fkey';
      columns: ['project_id'];
      referencedRelation: 'project';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'repo_binding_provider_id_fkey';
      columns: ['provider_id'];
      referencedRelation: 'git_provider';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'repo_binding_webhook_secret_ref_fkey';
      columns: ['webhook_secret_ref'];
      referencedRelation: 'secret_ref';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// CICD PIPELINE
// ============================================================================

export interface CICDPipelineRow {
  id: string;
  tenant_id: string;
  project_id: string;
  gitlab_instance_id: string | null;
  repo_full_name: string | null;
  pipeline_iid: number | null;
  pipeline_id_external: string | null;
  source: CICDPipelineSource | null;
  ref: string | null;
  sha: string | null;
  mr_iid: number | null;
  status: CICDPipelineStatus;
  detailed_status: string | null;
  started_at: string | null;
  finished_at: string | null;
  duration_sec: number | null;
  queued_duration_sec: number | null;
  user_external_id: string | null;
  web_url: string | null;
  variables: Json | null;
  coverage: number | null;
  created_at: string;
  updated_at: string;
}

export interface CICDPipelineInsert {
  id?: string;
  tenant_id: string;
  project_id: string;
  gitlab_instance_id?: string | null;
  repo_full_name?: string | null;
  pipeline_iid?: number | null;
  pipeline_id_external?: string | null;
  source?: CICDPipelineSource | null;
  ref?: string | null;
  sha?: string | null;
  mr_iid?: number | null;
  status?: CICDPipelineStatus;
  detailed_status?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  duration_sec?: number | null;
  queued_duration_sec?: number | null;
  user_external_id?: string | null;
  web_url?: string | null;
  variables?: Json | null;
  coverage?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface CICDPipelineUpdate {
  id?: string;
  tenant_id?: string;
  project_id?: string;
  gitlab_instance_id?: string | null;
  repo_full_name?: string | null;
  pipeline_iid?: number | null;
  pipeline_id_external?: string | null;
  source?: CICDPipelineSource | null;
  ref?: string | null;
  sha?: string | null;
  mr_iid?: number | null;
  status?: CICDPipelineStatus;
  detailed_status?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  duration_sec?: number | null;
  queued_duration_sec?: number | null;
  user_external_id?: string | null;
  web_url?: string | null;
  variables?: Json | null;
  coverage?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface CICDPipelineTable {
  Row: CICDPipelineRow;
  Insert: CICDPipelineInsert;
  Update: CICDPipelineUpdate;
  Relationships: [
    {
      foreignKeyName: 'cicd_pipeline_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'cicd_pipeline_project_id_fkey';
      columns: ['project_id'];
      referencedRelation: 'project';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'cicd_pipeline_gitlab_instance_id_fkey';
      columns: ['gitlab_instance_id'];
      referencedRelation: 'gitlab_instance';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// CICD STAGE
// ============================================================================

export interface CICDStageRow {
  id: string;
  tenant_id: string;
  pipeline_id: string;
  name: string;
  status: string | null;
  started_at: string | null;
  finished_at: string | null;
  duration_sec: number | null;
}

export interface CICDStageInsert {
  id?: string;
  tenant_id: string;
  pipeline_id: string;
  name: string;
  status?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  duration_sec?: number | null;
}

export interface CICDStageUpdate {
  id?: string;
  tenant_id?: string;
  pipeline_id?: string;
  name?: string;
  status?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  duration_sec?: number | null;
}

export interface CICDStageTable {
  Row: CICDStageRow;
  Insert: CICDStageInsert;
  Update: CICDStageUpdate;
  Relationships: [
    {
      foreignKeyName: 'cicd_stage_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'cicd_stage_pipeline_id_fkey';
      columns: ['pipeline_id'];
      referencedRelation: 'cicd_pipeline';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// CICD JOB
// ============================================================================

export interface CICDJobRow {
  id: string;
  tenant_id: string;
  pipeline_id: string;
  stage_id: string | null;
  name: string;
  job_id_external: string | null;
  status: CICDJobStatus;
  allow_failure: boolean | null;
  when_run: string | null;
  started_at: string | null;
  finished_at: string | null;
  duration_sec: number | null;
  runner_description: string | null;
  runner_tags: Json | null;
  image: string | null;
  script_summary: string | null;
  artifacts_expire_at: string | null;
  log_url: string | null;
  failure_reason: string | null;
  exit_code: number | null;
  retry_count: number | null;
  created_at: string;
}

export interface CICDJobInsert {
  id?: string;
  tenant_id: string;
  pipeline_id: string;
  stage_id?: string | null;
  name: string;
  job_id_external?: string | null;
  status?: CICDJobStatus;
  allow_failure?: boolean | null;
  when_run?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  duration_sec?: number | null;
  runner_description?: string | null;
  runner_tags?: Json | null;
  image?: string | null;
  script_summary?: string | null;
  artifacts_expire_at?: string | null;
  log_url?: string | null;
  failure_reason?: string | null;
  exit_code?: number | null;
  retry_count?: number | null;
  created_at?: string;
}

export interface CICDJobUpdate {
  id?: string;
  tenant_id?: string;
  pipeline_id?: string;
  stage_id?: string | null;
  name?: string;
  job_id_external?: string | null;
  status?: CICDJobStatus;
  allow_failure?: boolean | null;
  when_run?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  duration_sec?: number | null;
  runner_description?: string | null;
  runner_tags?: Json | null;
  image?: string | null;
  script_summary?: string | null;
  artifacts_expire_at?: string | null;
  log_url?: string | null;
  failure_reason?: string | null;
  exit_code?: number | null;
  retry_count?: number | null;
  created_at?: string;
}

export interface CICDJobTable {
  Row: CICDJobRow;
  Insert: CICDJobInsert;
  Update: CICDJobUpdate;
  Relationships: [
    {
      foreignKeyName: 'cicd_job_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'cicd_job_pipeline_id_fkey';
      columns: ['pipeline_id'];
      referencedRelation: 'cicd_pipeline';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'cicd_job_stage_id_fkey';
      columns: ['stage_id'];
      referencedRelation: 'cicd_stage';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// CICD JOB ARTIFACT
// ============================================================================

export interface CICDJobArtifactRow {
  id: string;
  tenant_id: string;
  job_id: string;
  name: string;
  type: string | null; // archive|dotenv|junit|coverage|sbom|container_scan|terraform_plan|helm_chart
  uri: string | null;
  size_bytes: number | null;
  checksum: string | null;
  created_at: string;
}

export interface CICDJobArtifactInsert {
  id?: string;
  tenant_id: string;
  job_id: string;
  name: string;
  type?: string | null;
  uri?: string | null;
  size_bytes?: number | null;
  checksum?: string | null;
  created_at?: string;
}

export interface CICDJobArtifactUpdate {
  id?: string;
  tenant_id?: string;
  job_id?: string;
  name?: string;
  type?: string | null;
  uri?: string | null;
  size_bytes?: number | null;
  checksum?: string | null;
  created_at?: string;
}

export interface CICDJobArtifactTable {
  Row: CICDJobArtifactRow;
  Insert: CICDJobArtifactInsert;
  Update: CICDJobArtifactUpdate;
  Relationships: [
    {
      foreignKeyName: 'cicd_job_artifact_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'cicd_job_artifact_job_id_fkey';
      columns: ['job_id'];
      referencedRelation: 'cicd_job';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// CICD ENVIRONMENT
// ============================================================================

export interface CICDEnvironmentRow {
  id: string;
  tenant_id: string;
  project_id: string;
  name: string;
  slug: string | null;
  tier: CICDEnvironmentTier | null;
  external_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CICDEnvironmentInsert {
  id?: string;
  tenant_id: string;
  project_id: string;
  name: string;
  slug?: string | null;
  tier?: CICDEnvironmentTier | null;
  external_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CICDEnvironmentUpdate {
  id?: string;
  tenant_id?: string;
  project_id?: string;
  name?: string;
  slug?: string | null;
  tier?: CICDEnvironmentTier | null;
  external_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CICDEnvironmentTable {
  Row: CICDEnvironmentRow;
  Insert: CICDEnvironmentInsert;
  Update: CICDEnvironmentUpdate;
  Relationships: [
    {
      foreignKeyName: 'cicd_environment_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'cicd_environment_project_id_fkey';
      columns: ['project_id'];
      referencedRelation: 'project';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// CICD DEPLOYMENT
// ============================================================================

export interface CICDDeploymentRow {
  id: string;
  tenant_id: string;
  pipeline_id: string;
  environment_id: string;
  status: string | null;
  deployed_at: string | null;
  deployable_ref: Json | null;
  release_tag: string | null;
  change_log: string | null;
  created_at: string;
}

export interface CICDDeploymentInsert {
  id?: string;
  tenant_id: string;
  pipeline_id: string;
  environment_id: string;
  status?: string | null;
  deployed_at?: string | null;
  deployable_ref?: Json | null;
  release_tag?: string | null;
  change_log?: string | null;
  created_at?: string;
}

export interface CICDDeploymentUpdate {
  id?: string;
  tenant_id?: string;
  pipeline_id?: string;
  environment_id?: string;
  status?: string | null;
  deployed_at?: string | null;
  deployable_ref?: Json | null;
  release_tag?: string | null;
  change_log?: string | null;
  created_at?: string;
}

export interface CICDDeploymentTable {
  Row: CICDDeploymentRow;
  Insert: CICDDeploymentInsert;
  Update: CICDDeploymentUpdate;
  Relationships: [
    {
      foreignKeyName: 'cicd_deployment_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'cicd_deployment_pipeline_id_fkey';
      columns: ['pipeline_id'];
      referencedRelation: 'cicd_pipeline';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'cicd_deployment_environment_id_fkey';
      columns: ['environment_id'];
      referencedRelation: 'cicd_environment';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// CICD QUALITY GATE
// ============================================================================

export interface CICDQualityGateRow {
  id: string;
  tenant_id: string;
  pipeline_id: string;
  gate_type: CICDQualityGateType;
  status: CICDQualityGateStatus;
  summary: string | null;
  metrics: Json | null;
  report_artifact_id: string | null;
  created_at: string;
}

export interface CICDQualityGateInsert {
  id?: string;
  tenant_id: string;
  pipeline_id: string;
  gate_type: CICDQualityGateType;
  status?: CICDQualityGateStatus;
  summary?: string | null;
  metrics?: Json | null;
  report_artifact_id?: string | null;
  created_at?: string;
}

export interface CICDQualityGateUpdate {
  id?: string;
  tenant_id?: string;
  pipeline_id?: string;
  gate_type?: CICDQualityGateType;
  status?: CICDQualityGateStatus;
  summary?: string | null;
  metrics?: Json | null;
  report_artifact_id?: string | null;
  created_at?: string;
}

export interface CICDQualityGateTable {
  Row: CICDQualityGateRow;
  Insert: CICDQualityGateInsert;
  Update: CICDQualityGateUpdate;
  Relationships: [
    {
      foreignKeyName: 'cicd_quality_gate_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'cicd_quality_gate_pipeline_id_fkey';
      columns: ['pipeline_id'];
      referencedRelation: 'cicd_pipeline';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'cicd_quality_gate_report_artifact_id_fkey';
      columns: ['report_artifact_id'];
      referencedRelation: 'cicd_job_artifact';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// CICD PIPELINE LINK
// ============================================================================

export interface CICDPipelineLinkRow {
  id: string;
  tenant_id: string;
  pipeline_id: string;
  entity_type: string; // environment_build|model_version|release|argocd_application|infra_change
  entity_id: string;
  created_at: string;
}

export interface CICDPipelineLinkInsert {
  id?: string;
  tenant_id: string;
  pipeline_id: string;
  entity_type: string;
  entity_id: string;
  created_at?: string;
}

export interface CICDPipelineLinkUpdate {
  id?: string;
  tenant_id?: string;
  pipeline_id?: string;
  entity_type?: string;
  entity_id?: string;
  created_at?: string;
}

export interface CICDPipelineLinkTable {
  Row: CICDPipelineLinkRow;
  Insert: CICDPipelineLinkInsert;
  Update: CICDPipelineLinkUpdate;
  Relationships: [
    {
      foreignKeyName: 'cicd_pipeline_link_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'cicd_pipeline_link_pipeline_id_fkey';
      columns: ['pipeline_id'];
      referencedRelation: 'cicd_pipeline';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// ARGOCD INSTANCE
// ============================================================================

export interface ArgoCDInstanceRow {
  id: string;
  tenant_id: string;
  name: string;
  base_url: string | null;
  cluster_id: string | null;
  auth_secret_ref: string | null;
  created_at: string;
  updated_at: string;
}

export interface ArgoCDInstanceInsert {
  id?: string;
  tenant_id: string;
  name: string;
  base_url?: string | null;
  cluster_id?: string | null;
  auth_secret_ref?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ArgoCDInstanceUpdate {
  id?: string;
  tenant_id?: string;
  name?: string;
  base_url?: string | null;
  cluster_id?: string | null;
  auth_secret_ref?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ArgoCDInstanceTable {
  Row: ArgoCDInstanceRow;
  Insert: ArgoCDInstanceInsert;
  Update: ArgoCDInstanceUpdate;
  Relationships: [
    {
      foreignKeyName: 'argocd_instance_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'argocd_instance_cluster_id_fkey';
      columns: ['cluster_id'];
      referencedRelation: 'k8s_cluster';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'argocd_instance_auth_secret_ref_fkey';
      columns: ['auth_secret_ref'];
      referencedRelation: 'secret_ref';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// ARGOCD APPLICATION
// ============================================================================

export interface ArgoCDApplicationRow {
  id: string;
  tenant_id: string;
  project_id: string;
  argocd_instance_id: string;
  name: string;
  app_project: string | null;
  source_repo: string | null;
  source_path: string | null;
  source_target_revision: string | null;
  helm_values: Json | null;
  kustomize: Json | null;
  destination_cluster: string | null;
  destination_namespace: string | null;
  sync_policy: Json | null;
  status: ArgoCDSyncStatus;
  health: ArgoCDHealthStatus;
  conditions: Json | null;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ArgoCDApplicationInsert {
  id?: string;
  tenant_id: string;
  project_id: string;
  argocd_instance_id: string;
  name: string;
  app_project?: string | null;
  source_repo?: string | null;
  source_path?: string | null;
  source_target_revision?: string | null;
  helm_values?: Json | null;
  kustomize?: Json | null;
  destination_cluster?: string | null;
  destination_namespace?: string | null;
  sync_policy?: Json | null;
  status?: ArgoCDSyncStatus;
  health?: ArgoCDHealthStatus;
  conditions?: Json | null;
  last_sync_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ArgoCDApplicationUpdate {
  id?: string;
  tenant_id?: string;
  project_id?: string;
  argocd_instance_id?: string;
  name?: string;
  app_project?: string | null;
  source_repo?: string | null;
  source_path?: string | null;
  source_target_revision?: string | null;
  helm_values?: Json | null;
  kustomize?: Json | null;
  destination_cluster?: string | null;
  destination_namespace?: string | null;
  sync_policy?: Json | null;
  status?: ArgoCDSyncStatus;
  health?: ArgoCDHealthStatus;
  conditions?: Json | null;
  last_sync_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ArgoCDApplicationTable {
  Row: ArgoCDApplicationRow;
  Insert: ArgoCDApplicationInsert;
  Update: ArgoCDApplicationUpdate;
  Relationships: [
    {
      foreignKeyName: 'argocd_application_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'argocd_application_project_id_fkey';
      columns: ['project_id'];
      referencedRelation: 'project';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'argocd_application_argocd_instance_id_fkey';
      columns: ['argocd_instance_id'];
      referencedRelation: 'argocd_instance';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// ARGOCD SYNC HISTORY
// ============================================================================

export interface ArgoCDSyncHistoryRow {
  id: string;
  tenant_id: string;
  application_id: string;
  revision: string | null;
  initiated_by: string | null;
  operation_phase: string | null;
  sync_status: string | null;
  health_status: string | null;
  started_at: string | null;
  finished_at: string | null;
  message: string | null;
  resources: Json | null;
}

export interface ArgoCDSyncHistoryInsert {
  id?: string;
  tenant_id: string;
  application_id: string;
  revision?: string | null;
  initiated_by?: string | null;
  operation_phase?: string | null;
  sync_status?: string | null;
  health_status?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  message?: string | null;
  resources?: Json | null;
}

export interface ArgoCDSyncHistoryUpdate {
  id?: string;
  tenant_id?: string;
  application_id?: string;
  revision?: string | null;
  initiated_by?: string | null;
  operation_phase?: string | null;
  sync_status?: string | null;
  health_status?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  message?: string | null;
  resources?: Json | null;
}

export interface ArgoCDSyncHistoryTable {
  Row: ArgoCDSyncHistoryRow;
  Insert: ArgoCDSyncHistoryInsert;
  Update: ArgoCDSyncHistoryUpdate;
  Relationships: [
    {
      foreignKeyName: 'argocd_sync_history_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'argocd_sync_history_application_id_fkey';
      columns: ['application_id'];
      referencedRelation: 'argocd_application';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// ARGOCD RESOURCE STATUS
// ============================================================================

export interface ArgoCDResourceStatusRow {
  id: string;
  tenant_id: string;
  application_id: string;
  group_name: string | null;
  kind: string | null;
  namespace: string | null;
  name: string | null;
  sync_status: string | null;
  health_status: string | null;
  hook: boolean | null;
  requires_pruning: boolean | null;
  message: string | null;
  last_seen_at: string | null;
}

export interface ArgoCDResourceStatusInsert {
  id?: string;
  tenant_id: string;
  application_id: string;
  group_name?: string | null;
  kind?: string | null;
  namespace?: string | null;
  name?: string | null;
  sync_status?: string | null;
  health_status?: string | null;
  hook?: boolean | null;
  requires_pruning?: boolean | null;
  message?: string | null;
  last_seen_at?: string | null;
}

export interface ArgoCDResourceStatusUpdate {
  id?: string;
  tenant_id?: string;
  application_id?: string;
  group_name?: string | null;
  kind?: string | null;
  namespace?: string | null;
  name?: string | null;
  sync_status?: string | null;
  health_status?: string | null;
  hook?: boolean | null;
  requires_pruning?: boolean | null;
  message?: string | null;
  last_seen_at?: string | null;
}

export interface ArgoCDResourceStatusTable {
  Row: ArgoCDResourceStatusRow;
  Insert: ArgoCDResourceStatusInsert;
  Update: ArgoCDResourceStatusUpdate;
  Relationships: [
    {
      foreignKeyName: 'argocd_resource_status_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'argocd_resource_status_application_id_fkey';
      columns: ['application_id'];
      referencedRelation: 'argocd_application';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// ARGOCD EVENT
// ============================================================================

export interface ArgoCDEventRow {
  id: string;
  tenant_id: string;
  application_id: string;
  type: string | null;
  reason: string | null;
  message: string | null;
  involved_object: Json | null;
  occurred_at: string | null;
}

export interface ArgoCDEventInsert {
  id?: string;
  tenant_id: string;
  application_id: string;
  type?: string | null;
  reason?: string | null;
  message?: string | null;
  involved_object?: Json | null;
  occurred_at?: string | null;
}

export interface ArgoCDEventUpdate {
  id?: string;
  tenant_id?: string;
  application_id?: string;
  type?: string | null;
  reason?: string | null;
  message?: string | null;
  involved_object?: Json | null;
  occurred_at?: string | null;
}

export interface ArgoCDEventTable {
  Row: ArgoCDEventRow;
  Insert: ArgoCDEventInsert;
  Update: ArgoCDEventUpdate;
  Relationships: [
    {
      foreignKeyName: 'argocd_event_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'argocd_event_application_id_fkey';
      columns: ['application_id'];
      referencedRelation: 'argocd_application';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// ARGOCD DRIFT FINDING
// ============================================================================

export interface ArgoCDDriftFindingRow {
  id: string;
  tenant_id: string;
  application_id: string;
  severity: DriftSeverity;
  resource_key: string | null;
  diff_summary: string | null;
  diff_uri: string | null;
  detected_at: string | null;
  status: DriftStatus;
  resolved_at: string | null;
  resolved_by: string | null;
}

export interface ArgoCDDriftFindingInsert {
  id?: string;
  tenant_id: string;
  application_id: string;
  severity?: DriftSeverity;
  resource_key?: string | null;
  diff_summary?: string | null;
  diff_uri?: string | null;
  detected_at?: string | null;
  status?: DriftStatus;
  resolved_at?: string | null;
  resolved_by?: string | null;
}

export interface ArgoCDDriftFindingUpdate {
  id?: string;
  tenant_id?: string;
  application_id?: string;
  severity?: DriftSeverity;
  resource_key?: string | null;
  diff_summary?: string | null;
  diff_uri?: string | null;
  detected_at?: string | null;
  status?: DriftStatus;
  resolved_at?: string | null;
  resolved_by?: string | null;
}

export interface ArgoCDDriftFindingTable {
  Row: ArgoCDDriftFindingRow;
  Insert: ArgoCDDriftFindingInsert;
  Update: ArgoCDDriftFindingUpdate;
  Relationships: [
    {
      foreignKeyName: 'argocd_drift_finding_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'argocd_drift_finding_application_id_fkey';
      columns: ['application_id'];
      referencedRelation: 'argocd_application';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// RELEASE
// ============================================================================

export interface ReleaseRow {
  id: string;
  tenant_id: string;
  project_id: string;
  name: string;
  version: string | null;
  git_ref: string | null;
  commit_sha: string | null;
  changelog: string | null;
  created_at: string;
  created_by: string | null;
}

export interface ReleaseInsert {
  id?: string;
  tenant_id: string;
  project_id: string;
  name: string;
  version?: string | null;
  git_ref?: string | null;
  commit_sha?: string | null;
  changelog?: string | null;
  created_at?: string;
  created_by?: string | null;
}

export interface ReleaseUpdate {
  id?: string;
  tenant_id?: string;
  project_id?: string;
  name?: string;
  version?: string | null;
  git_ref?: string | null;
  commit_sha?: string | null;
  changelog?: string | null;
  created_at?: string;
  created_by?: string | null;
}

export interface ReleaseTable {
  Row: ReleaseRow;
  Insert: ReleaseInsert;
  Update: ReleaseUpdate;
  Relationships: [
    {
      foreignKeyName: 'release_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'release_project_id_fkey';
      columns: ['project_id'];
      referencedRelation: 'project';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// RELEASE LINK
// ============================================================================

export interface ReleaseLinkRow {
  id: string;
  tenant_id: string;
  release_id: string;
  cicd_pipeline_id: string | null;
  argocd_application_id: string | null;
  model_deployment_id: string | null;
  created_at: string;
}

export interface ReleaseLinkInsert {
  id?: string;
  tenant_id: string;
  release_id: string;
  cicd_pipeline_id?: string | null;
  argocd_application_id?: string | null;
  model_deployment_id?: string | null;
  created_at?: string;
}

export interface ReleaseLinkUpdate {
  id?: string;
  tenant_id?: string;
  release_id?: string;
  cicd_pipeline_id?: string | null;
  argocd_application_id?: string | null;
  model_deployment_id?: string | null;
  created_at?: string;
}

export interface ReleaseLinkTable {
  Row: ReleaseLinkRow;
  Insert: ReleaseLinkInsert;
  Update: ReleaseLinkUpdate;
  Relationships: [
    {
      foreignKeyName: 'release_link_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'release_link_release_id_fkey';
      columns: ['release_id'];
      referencedRelation: 'release';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'release_link_cicd_pipeline_id_fkey';
      columns: ['cicd_pipeline_id'];
      referencedRelation: 'cicd_pipeline';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'release_link_argocd_application_id_fkey';
      columns: ['argocd_application_id'];
      referencedRelation: 'argocd_application';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'release_link_model_deployment_id_fkey';
      columns: ['model_deployment_id'];
      referencedRelation: 'model_deployment';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// CI/CD TABLES COLLECTION
// ============================================================================

export interface CICDTables {
  gitlab_instance: GitLabInstanceTable;
  git_provider: GitProviderTable;
  repo_binding: RepoBindingTable;
  cicd_pipeline: CICDPipelineTable;
  cicd_stage: CICDStageTable;
  cicd_job: CICDJobTable;
  cicd_job_artifact: CICDJobArtifactTable;
  cicd_environment: CICDEnvironmentTable;
  cicd_deployment: CICDDeploymentTable;
  cicd_quality_gate: CICDQualityGateTable;
  cicd_pipeline_link: CICDPipelineLinkTable;
  argocd_instance: ArgoCDInstanceTable;
  argocd_application: ArgoCDApplicationTable;
  argocd_sync_history: ArgoCDSyncHistoryTable;
  argocd_resource_status: ArgoCDResourceStatusTable;
  argocd_event: ArgoCDEventTable;
  argocd_drift_finding: ArgoCDDriftFindingTable;
  release: ReleaseTable;
  release_link: ReleaseLinkTable;
}
