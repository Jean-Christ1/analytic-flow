// ============================================================================
// Supabase Database Types Extension
// MLOps Control Plane v3
// Author: Armand AMOUSSOU
// Date: 2026-01-04
// ============================================================================
//
// This file provides type definitions for the MLOps Control Plane database schema.
// After deploying migrations, regenerate types with:
// npx supabase gen types typescript --local > src/integrations/supabase/types.ts
//
// These types can be used as a reference or as temporary type definitions
// until the auto-generated types are available.
//
// ============================================================================

import type { Json } from './types';

// ============================================================================
// ENUMS
// ============================================================================

export type TenantStatus = 'active' | 'inactive' | 'suspended';
export type ProjectVisibility = 'private' | 'team' | 'public';
export type TeamRole = 'owner' | 'admin' | 'maintainer' | 'developer' | 'viewer';
export type CloudProvider = 'aws' | 'gcp' | 'azure' | 'onprem';
export type K8sEnvironment = 'dev' | 'staging' | 'prod' | 'sandbox';
export type K8sClusterStatus = 'ready' | 'degraded' | 'down';
export type ExperimentStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type ModelStage = 'development' | 'staging' | 'production' | 'archived';
export type DeploymentStatus = 'pending' | 'deploying' | 'running' | 'failed' | 'stopped' | 'scaled_to_zero';
export type PipelineStatus = 'pending' | 'running' | 'success' | 'failed' | 'cancelled' | 'skipped';
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';
export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';
export type FeatureFlagStatus = 'active' | 'inactive' | 'archived';
export type QuotaPeriod = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'unlimited';
export type WebhookStatus = 'active' | 'paused' | 'disabled';

// ============================================================================
// TABLE TYPES - TENANCY DOMAIN
// ============================================================================

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  settings: Json;
  feature_flags: Json;
  status: TenantStatus;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  description: string | null;
  owner_id: string;
  visibility: ProjectVisibility;
  settings: Json;
  tags: string[];
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_team_id: string | null;
  avatar_url: string | null;
  settings: Json;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  invited_by: string | null;
  invited_at: string | null;
  joined_at: string;
}

export interface ProjectTeam {
  id: string;
  project_id: string;
  team_id: string;
  role: TeamRole;
  assigned_at: string;
  assigned_by: string | null;
}

// ============================================================================
// TABLE TYPES - IDENTITY DOMAIN
// ============================================================================

export interface Profile {
  id: string;
  user_id: string;
  tenant_id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  timezone: string;
  locale: string;
  preferences: Json;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiKey {
  id: string;
  tenant_id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  key_hash: string;
  scopes: string[];
  expires_at: string | null;
  last_used_at: string | null;
  created_at: string;
  revoked_at: string | null;
}

// ============================================================================
// TABLE TYPES - INFRASTRUCTURE DOMAIN
// ============================================================================

export interface K8sCluster {
  id: string;
  tenant_id: string;
  name: string;
  provider: CloudProvider;
  region: string | null;
  environment: K8sEnvironment;
  api_server_url: string | null;
  cluster_identity: Json;
  network_profile: Json;
  status: K8sClusterStatus;
  version: string | null;
  labels: Json;
  created_at: string;
  updated_at: string;
}

export interface K8sNamespaceBinding {
  id: string;
  tenant_id: string;
  project_id: string;
  cluster_id: string;
  namespace: string;
  resource_quota: Json;
  limit_range: Json;
  network_policy_profile: string | null;
  pod_security_profile: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ComputeProfile {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  cpu_request: string;
  cpu_limit: string;
  memory_request: string;
  memory_limit: string;
  gpu_type: string | null;
  gpu_count: number;
  ephemeral_storage: string | null;
  node_selector: Json;
  tolerations: Json;
  affinity: Json;
  priority_class: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// TABLE TYPES - MLOPS DOMAIN
// ============================================================================

export interface MlExperiment {
  id: string;
  tenant_id: string;
  project_id: string;
  name: string;
  description: string | null;
  created_by: string;
  status: ExperimentStatus;
  start_time: string | null;
  end_time: string | null;
  tags: string[];
  artifact_location: string | null;
  created_at: string;
  updated_at: string;
}

export interface MlRun {
  id: string;
  tenant_id: string;
  experiment_id: string;
  name: string;
  source_name: string | null;
  source_version: string | null;
  entry_point: string | null;
  user_id: string;
  status: ExperimentStatus;
  start_time: string | null;
  end_time: string | null;
  artifact_uri: string | null;
  lifecycle_stage: string;
  created_at: string;
  updated_at: string;
}

export interface MlModel {
  id: string;
  tenant_id: string;
  project_id: string;
  name: string;
  description: string | null;
  created_by: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface MlModelVersion {
  id: string;
  tenant_id: string;
  model_id: string;
  version: number;
  run_id: string | null;
  source: string | null;
  description: string | null;
  stage: ModelStage;
  stage_changed_at: string | null;
  stage_changed_by: string | null;
  created_by: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface MlDeployment {
  id: string;
  tenant_id: string;
  project_id: string;
  model_version_id: string;
  name: string;
  description: string | null;
  environment: string;
  cluster_id: string;
  namespace: string;
  compute_profile_id: string | null;
  replicas: number;
  min_replicas: number;
  max_replicas: number;
  autoscaling_enabled: boolean;
  endpoint_url: string | null;
  status: DeploymentStatus;
  deployed_at: string | null;
  deployed_by: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// TABLE TYPES - CI/CD DOMAIN
// ============================================================================

export interface GitLabInstance {
  id: string;
  tenant_id: string;
  name: string;
  url: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CicdPipeline {
  id: string;
  tenant_id: string;
  project_id: string;
  repo_binding_id: string;
  name: string;
  ref: string | null;
  commit_sha: string | null;
  source: string | null;
  status: PipelineStatus;
  started_at: string | null;
  finished_at: string | null;
  duration_seconds: number | null;
  web_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ArgoCdInstance {
  id: string;
  tenant_id: string;
  name: string;
  url: string;
  description: string | null;
  cluster_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// TABLE TYPES - COLLABORATION DOMAIN
// ============================================================================

export interface Comment {
  id: string;
  tenant_id: string;
  entity_type: string;
  entity_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  mentions: string[];
  attachments: Json;
  is_resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  edited_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  tenant_id: string;
  project_id: string;
  title: string;
  description: string | null;
  task_type: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignee_id: string | null;
  reporter_id: string;
  parent_task_id: string | null;
  labels: string[];
  due_date: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  sprint_id: string | null;
  external_reference: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface Notification {
  id: string;
  tenant_id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  channels: string[];
  entity_type: string | null;
  entity_id: string | null;
  action_url: string | null;
  action_label: string | null;
  metadata: Json;
  is_read: boolean;
  read_at: string | null;
  is_archived: boolean;
  archived_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface ActivityFeed {
  id: string;
  tenant_id: string;
  project_id: string | null;
  user_id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  entity_name: string | null;
  description: string;
  metadata: Json;
  changes: Json;
  is_public: boolean;
  created_at: string;
}

// ============================================================================
// TABLE TYPES - ADVANCED DOMAIN
// ============================================================================

export interface AuditLog {
  id: string;
  tenant_id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  resource_name: string | null;
  severity: AuditSeverity;
  description: string;
  changes: Json;
  metadata: Json;
  ip_address: string | null;
  user_agent: string | null;
  request_id: string | null;
  session_id: string | null;
  status: 'success' | 'failure';
  error_message: string | null;
  created_at: string;
}

export interface FeatureFlag {
  id: string;
  tenant_id: string;
  key: string;
  name: string;
  description: string | null;
  flag_type: string;
  enabled: boolean;
  default_value: Json;
  rules: Json;
  targeting: Json;
  status: FeatureFlagStatus;
  tags: string[];
  metadata: Json;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Quota {
  id: string;
  tenant_id: string;
  scope: string;
  scope_id: string | null;
  resource_type: string;
  limit_value: number;
  current_usage: number;
  period: QuotaPeriod;
  period_start: string | null;
  period_end: string | null;
  soft_limit: number | null;
  hard_limit: number;
  alert_threshold: number;
  alert_sent: boolean;
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export interface Webhook {
  id: string;
  tenant_id: string;
  project_id: string | null;
  name: string;
  description: string | null;
  url: string;
  secret: string | null;
  events: string[];
  headers: Json;
  status: WebhookStatus;
  retry_count: number;
  retry_delay_seconds: number;
  timeout_seconds: number;
  verify_ssl: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_type: string;
  event_id: string;
  payload: Json;
  request_headers: Json;
  response_status: number | null;
  response_body: string | null;
  response_headers: Json | null;
  response_time_ms: number | null;
  status: string;
  attempt_count: number;
  max_attempts: number;
  next_retry_at: string | null;
  error_message: string | null;
  delivered_at: string | null;
  created_at: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Type helper for extracting Row type from a table definition
 */
export type TableRow<T extends { Row: unknown }> = T['Row'];

/**
 * Type helper for extracting Insert type from a table definition
 */
export type TableInsert<T extends { Insert: unknown }> = T['Insert'];

/**
 * Type helper for extracting Update type from a table definition
 */
export type TableUpdate<T extends { Update: unknown }> = T['Update'];

// ============================================================================
// TYPE REGENERATION INSTRUCTIONS
// ============================================================================
//
// After deploying new migrations to Supabase, regenerate the types:
//
// 1. If using Supabase CLI locally:
//    npx supabase gen types typescript --local > src/integrations/supabase/types.ts
//
// 2. If using remote Supabase project:
//    npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts
//
// 3. Alternatively, download from Supabase Dashboard:
//    Settings > API > Generate TypeScript Types
//
// ============================================================================
