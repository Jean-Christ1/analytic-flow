/**
 * Common Database Types and Enums
 *
 * Shared type definitions used across multiple domains.
 */

// JSON type for flexible data storage
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Base timestamp fields for all entities
export interface TimestampFields {
  created_at: string;
  updated_at: string;
}

// Base audit fields for tracking changes
export interface AuditFields extends TimestampFields {
  created_by: string | null;
  updated_by: string | null;
}

// Base tenant-scoped entity
export interface TenantScoped {
  tenant_id: string;
}

// Common status enums
export type EntityStatus = 'active' | 'inactive' | 'suspended' | 'deleted';

export type TenantStatus = 'active' | 'suspended' | 'deleted';

export type TenantTier = 'free' | 'pro' | 'enterprise';

export type ProjectVisibility = 'private' | 'internal' | 'public';

export type ProjectLifecycle = 'initiating' | 'active' | 'paused' | 'archived';

export type Criticality = 'low' | 'medium' | 'high';

export type ProgressStatus = 'green' | 'amber' | 'red';

export type MilestoneStatus = 'planned' | 'in_progress' | 'done' | 'canceled';

export type WorkItemType = 'task' | 'bug' | 'story' | 'epic' | 'change_request';

export type WorkItemStatus = 'open' | 'in_progress' | 'blocked' | 'done' | 'canceled';

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export type Severity = 'minor' | 'major' | 'critical';

// User and account status
export type UserStatus = 'active' | 'disabled';

// Scope types for RBAC
export type ScopeType = 'tenant' | 'org' | 'project';

// Principal types for role bindings
export type PrincipalType = 'user' | 'group' | 'service';

// Business rule types
export type RuleType = 'validation' | 'approval' | 'naming' | 'quota' | 'security';

export type RuleAppliesTo = 'project' | 'run' | 'deploy' | 'env' | 'registry' | 'cicd' | 'gitops' | 'catalog';

export type RuleSeverity = 'info' | 'warn' | 'block';

// Permission categories
export type PermissionCategory = 'admin' | 'project' | 'security' | 'mlops' | 'cicd' | 'gitops';

// Secret backend types
export type SecretBackend = 'vault' | 'aws_sm' | 'gcp_sm' | 'azure_kv' | 'k8s_secret';

export type SecretPurpose = 'db' | 'git' | 'objectstore' | 'registry' | 'oidc' | 'gitlab' | 'argocd' | 'integrations';

// Identity provider types
export type IdpType = 'oidc' | 'saml' | 'ldap';

// Cloud provider types
export type CloudProvider = 'aws' | 'gcp' | 'azure' | 'onprem';

// Kubernetes environment types
export type K8sEnvironment = 'dev' | 'staging' | 'prod' | 'sandbox';

export type K8sClusterStatus = 'ready' | 'degraded' | 'down';

// Run types and status
export type RunType = 'job' | 'workspace' | 'pipeline_step' | 'app' | 'model_api';

export type RunStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled';

export type RunTrigger = 'manual' | 'schedule' | 'webhook' | 'api' | 'cicd';

// Model status
export type ModelVersionStatus = 'draft' | 'approved' | 'deprecated';

// Deployment status
export type DeploymentStatus = 'planned' | 'syncing' | 'healthy' | 'degraded' | 'failed' | 'paused';

export type RolloutStrategy = 'bluegreen' | 'canary' | 'rolling';

// IDE types for workspaces
export type IdeType = 'vscode' | 'jupyter' | 'rstudio';

// Workspace session status
export type SessionStatus = 'starting' | 'running' | 'stopped' | 'failed';

// App types
export type AppType = 'streamlit' | 'gradio' | 'custom';

// Notification types
export type NotificationType = 'mention' | 'assignment' | 'pipeline_failed' | 'deploy_drift' | 'approval' | 'incident';

export type NotificationChannel = 'inapp' | 'email' | 'webhook';

// Git provider types
export type GitProviderType = 'gitlab' | 'github' | 'bitbucket';

// CI/CD pipeline source
export type CicdPipelineSource = 'push' | 'merge_request' | 'schedule' | 'web' | 'api' | 'parent_pipeline';

export type CicdPipelineStatus = 'created' | 'pending' | 'running' | 'success' | 'failed' | 'canceled' | 'skipped' | 'manual';

// CI/CD environment tier
export type CicdEnvironmentTier = 'development' | 'staging' | 'production';

// Quality gate types
export type QualityGateType = 'tests' | 'security' | 'lint' | 'coverage' | 'sast' | 'dast' | 'license' | 'iac_scan';

export type QualityGateStatus = 'pass' | 'warn' | 'fail';

// Artifact types
export type ArtifactKind = 'model' | 'dataset' | 'report' | 'file' | 'plot';

export type CicdArtifactType = 'archive' | 'dotenv' | 'junit' | 'coverage' | 'sbom' | 'container_scan' | 'terraform_plan' | 'helm_chart';

// ArgoCD status types
export type ArgoCdSyncStatus = 'unknown' | 'syncing' | 'synced' | 'outofsync' | 'error';

export type ArgoCdHealthStatus = 'healthy' | 'progressing' | 'degraded' | 'missing' | 'suspended';

// Drift severity
export type DriftSeverity = 'low' | 'medium' | 'high' | 'critical';

export type DriftStatus = 'open' | 'acknowledged' | 'resolved';

// Approval status
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'canceled';

export type ApprovalDecision = 'approve' | 'reject';

// Audit actor type
export type AuditActorType = 'user' | 'service';

// Event outbox status
export type EventOutboxStatus = 'pending' | 'sent' | 'failed';

// Object store types
export type ObjectStoreType = 's3' | 'gcs' | 'azure' | 'minio';

// Environment build status
export type EnvironmentBuildStatus = 'queued' | 'running' | 'succeeded' | 'failed';

// Alias for workspace IDE (same as IdeType)
export type WorkspaceIDE = IdeType;

// Alias for workspace session status (same as SessionStatus)
export type WorkspaceSessionStatus = SessionStatus;

// CI/CD types (PascalCase aliases)
export type CICDPipelineStatus = CicdPipelineStatus;
export type CICDPipelineSource = CicdPipelineSource;
export type CICDJobStatus = 'created' | 'pending' | 'running' | 'success' | 'failed' | 'canceled' | 'skipped' | 'manual';
export type CICDEnvironmentTier = CicdEnvironmentTier;
export type CICDQualityGateType = QualityGateType;
export type CICDQualityGateStatus = QualityGateStatus;

// ArgoCD types (PascalCase aliases)
export type ArgoCDSyncStatus = ArgoCdSyncStatus;
export type ArgoCDHealthStatus = ArgoCdHealthStatus;

// Approval decision type (alias)
export type ApprovalDecisionType = ApprovalDecision;

// Pipeline DAG types
export type PipelineNodeType = 'task' | 'condition' | 'join' | 'subpipeline';
export type PipelineStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled' | 'skipped';
export type PipelineTrigger = 'manual' | 'schedule' | 'api' | 'webhook' | 'cicd';

// Policy types
export type PolicyEnforcementMode = 'dry_run' | 'enforce';

// Catalog types
export type CatalogItemKind = 'env_template' | 'pipeline_template' | 'app_template' | 'infra_module' | 'dataset_contract';
export type CatalogItemStatus = 'draft' | 'published' | 'deprecated';

// Resource inventory types
export type ResourceProviderType = 'aws' | 'gcp' | 'azure' | 'onprem' | 'kubernetes';
export type ManagedResourceStatus = 'planned' | 'provisioning' | 'ready' | 'degraded' | 'failed' | 'deleted';

// IaC/Terraform types
export type IaCBackendType = 's3' | 'gcs' | 'azblob' | 'remote' | 'local';
export type IaCAction = 'plan' | 'apply' | 'destroy';
export type IaCRunStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled';

// Observability types
export type ObservabilityKind = 'logs' | 'metrics' | 'traces';
export type ObservabilityType = 'loki' | 'elastic' | 'opensearch' | 'prometheus' | 'victoriametrics' | 'tempo' | 'jaeger' | 'datadog';

// Incident types
export type IncidentSeverity = 'sev0' | 'sev1' | 'sev2' | 'sev3' | 'sev4';
export type IncidentStatus = 'open' | 'mitigating' | 'resolved' | 'closed';

// Integration types
export type IntegrationType = 'slack' | 'teams' | 'jira' | 'email' | 'webhook' | 'pagerduty';
export type WebhookDeliveryStatus = 'queued' | 'sent' | 'failed';

// FinOps types
export type BudgetPeriod = 'monthly' | 'quarterly' | 'yearly';

// AI Governance types (EU AI Act)
export type AIRiskClass = 'minimal' | 'limited' | 'high' | 'unacceptable';
export type AISystemStatus = 'draft' | 'active' | 'retired';

// Data privacy classification
export type PrivacyClassification = 'public' | 'internal' | 'confidential' | 'restricted';

// Compliance types
export type ComplianceEvidenceStatus = 'provided' | 'validated' | 'rejected';

// Governance incident types
export type GovernanceIncidentType = 'bias' | 'safety' | 'privacy' | 'performance' | 'security';
export type GovernanceIncidentStatus = 'open' | 'investigating' | 'resolved' | 'closed';
