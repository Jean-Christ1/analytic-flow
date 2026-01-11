/**
 * MLOps Core Database Types
 *
 * Experiments, runs, metrics, artifacts, models, model versions,
 * deployments, workspace sessions, and applications.
 */

import type {
  Json,
  RunType,
  RunStatus,
  RunTrigger,
  ArtifactKind,
  ModelVersionStatus,
  DeploymentStatus,
  RolloutStrategy,
  WorkspaceIDE,
  WorkspaceSessionStatus,
  AppType,
} from './common';

// ============================================================================
// EXPERIMENT
// ============================================================================

export interface ExperimentRow {
  id: string;
  tenant_id: string;
  project_id: string;
  name: string;
  description: string | null;
  tags: Json | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface ExperimentInsert {
  id?: string;
  tenant_id: string;
  project_id: string;
  name: string;
  description?: string | null;
  tags?: Json | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface ExperimentUpdate {
  id?: string;
  tenant_id?: string;
  project_id?: string;
  name?: string;
  description?: string | null;
  tags?: Json | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface ExperimentTable {
  Row: ExperimentRow;
  Insert: ExperimentInsert;
  Update: ExperimentUpdate;
  Relationships: [
    {
      foreignKeyName: 'experiment_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'experiment_project_id_fkey';
      columns: ['project_id'];
      referencedRelation: 'project';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// RUN
// ============================================================================

export interface RunRow {
  id: string;
  tenant_id: string;
  project_id: string;
  experiment_id: string | null;
  parent_run_id: string | null;
  type: RunType;
  status: RunStatus;
  trigger: RunTrigger | null;
  status_message: string | null;
  started_at: string | null;
  ended_at: string | null;
  duration_ms: number | null;
  compute_profile_id: string | null;
  environment_build_id: string | null;
  cluster_id: string | null;
  namespace: string | null;
  k8s_workload_ref: Json | null;
  params: Json | null;
  metrics_summary: Json | null;
  logs_uri: string | null;
  artifacts_root_uri: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface RunInsert {
  id?: string;
  tenant_id: string;
  project_id: string;
  experiment_id?: string | null;
  parent_run_id?: string | null;
  type: RunType;
  status?: RunStatus;
  trigger?: RunTrigger | null;
  status_message?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
  duration_ms?: number | null;
  compute_profile_id?: string | null;
  environment_build_id?: string | null;
  cluster_id?: string | null;
  namespace?: string | null;
  k8s_workload_ref?: Json | null;
  params?: Json | null;
  metrics_summary?: Json | null;
  logs_uri?: string | null;
  artifacts_root_uri?: string | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface RunUpdate {
  id?: string;
  tenant_id?: string;
  project_id?: string;
  experiment_id?: string | null;
  parent_run_id?: string | null;
  type?: RunType;
  status?: RunStatus;
  trigger?: RunTrigger | null;
  status_message?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
  duration_ms?: number | null;
  compute_profile_id?: string | null;
  environment_build_id?: string | null;
  cluster_id?: string | null;
  namespace?: string | null;
  k8s_workload_ref?: Json | null;
  params?: Json | null;
  metrics_summary?: Json | null;
  logs_uri?: string | null;
  artifacts_root_uri?: string | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface RunTable {
  Row: RunRow;
  Insert: RunInsert;
  Update: RunUpdate;
  Relationships: [
    {
      foreignKeyName: 'run_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'run_project_id_fkey';
      columns: ['project_id'];
      referencedRelation: 'project';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'run_experiment_id_fkey';
      columns: ['experiment_id'];
      referencedRelation: 'experiment';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'run_parent_run_id_fkey';
      columns: ['parent_run_id'];
      referencedRelation: 'run';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'run_compute_profile_id_fkey';
      columns: ['compute_profile_id'];
      referencedRelation: 'compute_profile';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'run_environment_build_id_fkey';
      columns: ['environment_build_id'];
      referencedRelation: 'environment_build';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'run_cluster_id_fkey';
      columns: ['cluster_id'];
      referencedRelation: 'k8s_cluster';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// RUN METRIC
// ============================================================================

export interface RunMetricRow {
  id: string;
  tenant_id: string;
  run_id: string;
  name: string;
  step: number | null;
  value: number | null;
  unit: string | null;
  logged_at: string | null;
}

export interface RunMetricInsert {
  id?: string;
  tenant_id: string;
  run_id: string;
  name: string;
  step?: number | null;
  value?: number | null;
  unit?: string | null;
  logged_at?: string | null;
}

export interface RunMetricUpdate {
  id?: string;
  tenant_id?: string;
  run_id?: string;
  name?: string;
  step?: number | null;
  value?: number | null;
  unit?: string | null;
  logged_at?: string | null;
}

export interface RunMetricTable {
  Row: RunMetricRow;
  Insert: RunMetricInsert;
  Update: RunMetricUpdate;
  Relationships: [
    {
      foreignKeyName: 'run_metric_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'run_metric_run_id_fkey';
      columns: ['run_id'];
      referencedRelation: 'run';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// ARTIFACT
// ============================================================================

export interface ArtifactRow {
  id: string;
  tenant_id: string;
  project_id: string;
  run_id: string | null;
  kind: ArtifactKind;
  name: string;
  uri: string | null;
  content_hash: string | null;
  size_bytes: number | null;
  mime_type: string | null;
  metadata: Json | null;
  created_at: string;
  created_by: string | null;
}

export interface ArtifactInsert {
  id?: string;
  tenant_id: string;
  project_id: string;
  run_id?: string | null;
  kind: ArtifactKind;
  name: string;
  uri?: string | null;
  content_hash?: string | null;
  size_bytes?: number | null;
  mime_type?: string | null;
  metadata?: Json | null;
  created_at?: string;
  created_by?: string | null;
}

export interface ArtifactUpdate {
  id?: string;
  tenant_id?: string;
  project_id?: string;
  run_id?: string | null;
  kind?: ArtifactKind;
  name?: string;
  uri?: string | null;
  content_hash?: string | null;
  size_bytes?: number | null;
  mime_type?: string | null;
  metadata?: Json | null;
  created_at?: string;
  created_by?: string | null;
}

export interface ArtifactTable {
  Row: ArtifactRow;
  Insert: ArtifactInsert;
  Update: ArtifactUpdate;
  Relationships: [
    {
      foreignKeyName: 'artifact_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'artifact_project_id_fkey';
      columns: ['project_id'];
      referencedRelation: 'project';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'artifact_run_id_fkey';
      columns: ['run_id'];
      referencedRelation: 'run';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// MODEL
// ============================================================================

export interface ModelRow {
  id: string;
  tenant_id: string;
  project_id: string;
  name: string;
  description: string | null;
  tags: Json | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface ModelInsert {
  id?: string;
  tenant_id: string;
  project_id: string;
  name: string;
  description?: string | null;
  tags?: Json | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface ModelUpdate {
  id?: string;
  tenant_id?: string;
  project_id?: string;
  name?: string;
  description?: string | null;
  tags?: Json | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface ModelTable {
  Row: ModelRow;
  Insert: ModelInsert;
  Update: ModelUpdate;
  Relationships: [
    {
      foreignKeyName: 'model_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'model_project_id_fkey';
      columns: ['project_id'];
      referencedRelation: 'project';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// MODEL VERSION
// ============================================================================

export interface ModelVersionRow {
  id: string;
  tenant_id: string;
  model_id: string;
  version: number | null;
  source_run_id: string | null;
  artifact_id: string | null;
  signature: Json | null;
  metrics_summary: Json | null;
  status: ModelVersionStatus;
  approval_required: boolean | null;
  created_at: string;
  created_by: string | null;
}

export interface ModelVersionInsert {
  id?: string;
  tenant_id: string;
  model_id: string;
  version?: number | null;
  source_run_id?: string | null;
  artifact_id?: string | null;
  signature?: Json | null;
  metrics_summary?: Json | null;
  status?: ModelVersionStatus;
  approval_required?: boolean | null;
  created_at?: string;
  created_by?: string | null;
}

export interface ModelVersionUpdate {
  id?: string;
  tenant_id?: string;
  model_id?: string;
  version?: number | null;
  source_run_id?: string | null;
  artifact_id?: string | null;
  signature?: Json | null;
  metrics_summary?: Json | null;
  status?: ModelVersionStatus;
  approval_required?: boolean | null;
  created_at?: string;
  created_by?: string | null;
}

export interface ModelVersionTable {
  Row: ModelVersionRow;
  Insert: ModelVersionInsert;
  Update: ModelVersionUpdate;
  Relationships: [
    {
      foreignKeyName: 'model_version_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'model_version_model_id_fkey';
      columns: ['model_id'];
      referencedRelation: 'model';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'model_version_source_run_id_fkey';
      columns: ['source_run_id'];
      referencedRelation: 'run';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'model_version_artifact_id_fkey';
      columns: ['artifact_id'];
      referencedRelation: 'artifact';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// MODEL DEPLOYMENT
// ============================================================================

export interface ModelDeploymentRow {
  id: string;
  tenant_id: string;
  project_id: string;
  model_version_id: string;
  name: string;
  cluster_id: string | null;
  namespace: string | null;
  endpoint_url: string | null;
  auth_policy: Json | null;
  scaling: Json | null;
  resources: Json | null;
  rollout_strategy: RolloutStrategy | null;
  status: DeploymentStatus;
  status_message: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface ModelDeploymentInsert {
  id?: string;
  tenant_id: string;
  project_id: string;
  model_version_id: string;
  name: string;
  cluster_id?: string | null;
  namespace?: string | null;
  endpoint_url?: string | null;
  auth_policy?: Json | null;
  scaling?: Json | null;
  resources?: Json | null;
  rollout_strategy?: RolloutStrategy | null;
  status?: DeploymentStatus;
  status_message?: string | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface ModelDeploymentUpdate {
  id?: string;
  tenant_id?: string;
  project_id?: string;
  model_version_id?: string;
  name?: string;
  cluster_id?: string | null;
  namespace?: string | null;
  endpoint_url?: string | null;
  auth_policy?: Json | null;
  scaling?: Json | null;
  resources?: Json | null;
  rollout_strategy?: RolloutStrategy | null;
  status?: DeploymentStatus;
  status_message?: string | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface ModelDeploymentTable {
  Row: ModelDeploymentRow;
  Insert: ModelDeploymentInsert;
  Update: ModelDeploymentUpdate;
  Relationships: [
    {
      foreignKeyName: 'model_deployment_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'model_deployment_project_id_fkey';
      columns: ['project_id'];
      referencedRelation: 'project';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'model_deployment_model_version_id_fkey';
      columns: ['model_version_id'];
      referencedRelation: 'model_version';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'model_deployment_cluster_id_fkey';
      columns: ['cluster_id'];
      referencedRelation: 'k8s_cluster';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// WORKSPACE SESSION
// ============================================================================

export interface WorkspaceSessionRow {
  id: string;
  tenant_id: string;
  project_id: string;
  user_id: string;
  environment_build_id: string | null;
  cluster_id: string | null;
  namespace: string | null;
  ide: WorkspaceIDE | null;
  url: string | null;
  status: WorkspaceSessionStatus;
  k8s_pod_ref: Json | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

export interface WorkspaceSessionInsert {
  id?: string;
  tenant_id: string;
  project_id: string;
  user_id: string;
  environment_build_id?: string | null;
  cluster_id?: string | null;
  namespace?: string | null;
  ide?: WorkspaceIDE | null;
  url?: string | null;
  status?: WorkspaceSessionStatus;
  k8s_pod_ref?: Json | null;
  started_at?: string | null;
  ended_at?: string | null;
  created_at?: string;
}

export interface WorkspaceSessionUpdate {
  id?: string;
  tenant_id?: string;
  project_id?: string;
  user_id?: string;
  environment_build_id?: string | null;
  cluster_id?: string | null;
  namespace?: string | null;
  ide?: WorkspaceIDE | null;
  url?: string | null;
  status?: WorkspaceSessionStatus;
  k8s_pod_ref?: Json | null;
  started_at?: string | null;
  ended_at?: string | null;
  created_at?: string;
}

export interface WorkspaceSessionTable {
  Row: WorkspaceSessionRow;
  Insert: WorkspaceSessionInsert;
  Update: WorkspaceSessionUpdate;
  Relationships: [
    {
      foreignKeyName: 'workspace_session_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'workspace_session_project_id_fkey';
      columns: ['project_id'];
      referencedRelation: 'project';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'workspace_session_user_id_fkey';
      columns: ['user_id'];
      referencedRelation: 'user_account';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'workspace_session_environment_build_id_fkey';
      columns: ['environment_build_id'];
      referencedRelation: 'environment_build';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'workspace_session_cluster_id_fkey';
      columns: ['cluster_id'];
      referencedRelation: 'k8s_cluster';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// APP
// ============================================================================

export interface AppRow {
  id: string;
  tenant_id: string;
  project_id: string;
  name: string;
  type: AppType;
  spec: Json | null;
  url: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface AppInsert {
  id?: string;
  tenant_id: string;
  project_id: string;
  name: string;
  type: AppType;
  spec?: Json | null;
  url?: string | null;
  status?: string | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface AppUpdate {
  id?: string;
  tenant_id?: string;
  project_id?: string;
  name?: string;
  type?: AppType;
  spec?: Json | null;
  url?: string | null;
  status?: string | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface AppTable {
  Row: AppRow;
  Insert: AppInsert;
  Update: AppUpdate;
  Relationships: [
    {
      foreignKeyName: 'app_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'app_project_id_fkey';
      columns: ['project_id'];
      referencedRelation: 'project';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// MLOPS TABLES COLLECTION
// ============================================================================

export interface MLOpsTables {
  experiment: ExperimentTable;
  run: RunTable;
  run_metric: RunMetricTable;
  artifact: ArtifactTable;
  model: ModelTable;
  model_version: ModelVersionTable;
  model_deployment: ModelDeploymentTable;
  workspace_session: WorkspaceSessionTable;
  app: AppTable;
}
