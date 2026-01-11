/**
 * Registries and Data Connections Database Types
 *
 * Container registries, object stores, data connections,
 * and environment definitions for MLOps workloads.
 */

import type { Json, ObjectStoreType, EnvironmentBuildStatus } from './common';

// ============================================================================
// CONTAINER REGISTRY
// ============================================================================

export interface ContainerRegistryRow {
  id: string;
  tenant_id: string;
  type: string; // ecr|gar|acr|harbor
  endpoint: string | null;
  auth_secret_ref: string | null;
  trust_policy: Json | null;
  created_at: string;
  updated_at: string;
}

export interface ContainerRegistryInsert {
  id?: string;
  tenant_id: string;
  type: string;
  endpoint?: string | null;
  auth_secret_ref?: string | null;
  trust_policy?: Json | null;
  created_at?: string;
  updated_at?: string;
}

export interface ContainerRegistryUpdate {
  id?: string;
  tenant_id?: string;
  type?: string;
  endpoint?: string | null;
  auth_secret_ref?: string | null;
  trust_policy?: Json | null;
  created_at?: string;
  updated_at?: string;
}

export interface ContainerRegistryTable {
  Row: ContainerRegistryRow;
  Insert: ContainerRegistryInsert;
  Update: ContainerRegistryUpdate;
  Relationships: [
    {
      foreignKeyName: 'container_registry_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'container_registry_auth_secret_ref_fkey';
      columns: ['auth_secret_ref'];
      referencedRelation: 'secret_ref';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// OBJECT STORE
// ============================================================================

export interface ObjectStoreRow {
  id: string;
  tenant_id: string;
  type: ObjectStoreType;
  endpoint: string | null;
  bucket: string | null;
  prefix: string | null;
  auth_secret_ref: string | null;
  kms_key_ref: string | null;
  retention_policy: Json | null;
  created_at: string;
  updated_at: string;
}

export interface ObjectStoreInsert {
  id?: string;
  tenant_id: string;
  type: ObjectStoreType;
  endpoint?: string | null;
  bucket?: string | null;
  prefix?: string | null;
  auth_secret_ref?: string | null;
  kms_key_ref?: string | null;
  retention_policy?: Json | null;
  created_at?: string;
  updated_at?: string;
}

export interface ObjectStoreUpdate {
  id?: string;
  tenant_id?: string;
  type?: ObjectStoreType;
  endpoint?: string | null;
  bucket?: string | null;
  prefix?: string | null;
  auth_secret_ref?: string | null;
  kms_key_ref?: string | null;
  retention_policy?: Json | null;
  created_at?: string;
  updated_at?: string;
}

export interface ObjectStoreTable {
  Row: ObjectStoreRow;
  Insert: ObjectStoreInsert;
  Update: ObjectStoreUpdate;
  Relationships: [
    {
      foreignKeyName: 'object_store_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'object_store_auth_secret_ref_fkey';
      columns: ['auth_secret_ref'];
      referencedRelation: 'secret_ref';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// DATA CONNECTION
// ============================================================================

export interface DataConnectionRow {
  id: string;
  tenant_id: string;
  name: string;
  type: string; // snowflake|databricks|jdbc|sftp|nfs|bigquery|...
  config: Json | null;
  secret_ref_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DataConnectionInsert {
  id?: string;
  tenant_id: string;
  name: string;
  type: string;
  config?: Json | null;
  secret_ref_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DataConnectionUpdate {
  id?: string;
  tenant_id?: string;
  name?: string;
  type?: string;
  config?: Json | null;
  secret_ref_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DataConnectionTable {
  Row: DataConnectionRow;
  Insert: DataConnectionInsert;
  Update: DataConnectionUpdate;
  Relationships: [
    {
      foreignKeyName: 'data_connection_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'data_connection_secret_ref_id_fkey';
      columns: ['secret_ref_id'];
      referencedRelation: 'secret_ref';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// ENVIRONMENT
// ============================================================================

export interface EnvironmentRow {
  id: string;
  tenant_id: string;
  project_id: string | null;
  name: string;
  description: string | null;
  base_image: string | null;
  spec: Json | null; // conda.yaml/poetry/requirements + runtime
  build_strategy: string | null; // dockerfile|buildkit|kaniko
  registry_id: string | null;
  runtime_policy_id: string | null;
  status: string | null; // active|deprecated
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface EnvironmentInsert {
  id?: string;
  tenant_id: string;
  project_id?: string | null;
  name: string;
  description?: string | null;
  base_image?: string | null;
  spec?: Json | null;
  build_strategy?: string | null;
  registry_id?: string | null;
  runtime_policy_id?: string | null;
  status?: string | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface EnvironmentUpdate {
  id?: string;
  tenant_id?: string;
  project_id?: string | null;
  name?: string;
  description?: string | null;
  base_image?: string | null;
  spec?: Json | null;
  build_strategy?: string | null;
  registry_id?: string | null;
  runtime_policy_id?: string | null;
  status?: string | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface EnvironmentTable {
  Row: EnvironmentRow;
  Insert: EnvironmentInsert;
  Update: EnvironmentUpdate;
  Relationships: [
    {
      foreignKeyName: 'environment_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'environment_project_id_fkey';
      columns: ['project_id'];
      referencedRelation: 'project';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'environment_registry_id_fkey';
      columns: ['registry_id'];
      referencedRelation: 'container_registry';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'environment_runtime_policy_id_fkey';
      columns: ['runtime_policy_id'];
      referencedRelation: 'runtime_policy';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// ENVIRONMENT BUILD
// ============================================================================

export interface EnvironmentBuildRow {
  id: string;
  tenant_id: string;
  environment_id: string;
  version: number | null;
  git_commit_sha: string | null;
  build_log_uri: string | null;
  image_name: string | null;
  image_tag: string | null;
  image_digest: string | null;
  sbom_uri: string | null;
  vuln_report_uri: string | null;
  status: EnvironmentBuildStatus;
  failure_reason: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  created_by: string | null;
}

export interface EnvironmentBuildInsert {
  id?: string;
  tenant_id: string;
  environment_id: string;
  version?: number | null;
  git_commit_sha?: string | null;
  build_log_uri?: string | null;
  image_name?: string | null;
  image_tag?: string | null;
  image_digest?: string | null;
  sbom_uri?: string | null;
  vuln_report_uri?: string | null;
  status?: EnvironmentBuildStatus;
  failure_reason?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  created_at?: string;
  created_by?: string | null;
}

export interface EnvironmentBuildUpdate {
  id?: string;
  tenant_id?: string;
  environment_id?: string;
  version?: number | null;
  git_commit_sha?: string | null;
  build_log_uri?: string | null;
  image_name?: string | null;
  image_tag?: string | null;
  image_digest?: string | null;
  sbom_uri?: string | null;
  vuln_report_uri?: string | null;
  status?: EnvironmentBuildStatus;
  failure_reason?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  created_at?: string;
  created_by?: string | null;
}

export interface EnvironmentBuildTable {
  Row: EnvironmentBuildRow;
  Insert: EnvironmentBuildInsert;
  Update: EnvironmentBuildUpdate;
  Relationships: [
    {
      foreignKeyName: 'environment_build_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'environment_build_environment_id_fkey';
      columns: ['environment_id'];
      referencedRelation: 'environment';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// REGISTRIES TABLES COLLECTION
// ============================================================================

export interface RegistriesTables {
  container_registry: ContainerRegistryTable;
  object_store: ObjectStoreTable;
  data_connection: DataConnectionTable;
  environment: EnvironmentTable;
  environment_build: EnvironmentBuildTable;
}
