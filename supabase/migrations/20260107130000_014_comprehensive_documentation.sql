-- ============================================================================
-- Migration: Comprehensive Table and Column Documentation
-- MLOps Control Plane v3
-- Author: Armand AMOUSSOU
-- Date: 2026-01-07
-- ============================================================================
-- Description:
-- This migration adds COMMENT ON statements for ALL tables and ALL columns
-- in the MLOps platform database schema. Documentation is in English.
-- ============================================================================

-- ============================================================================
-- SECTION 1: CORE TENANCY TABLES (001)
-- ============================================================================

-- tenant table
COMMENT ON TABLE public.tenant IS 'Root multi-tenant entity for organization isolation. All data in the platform is scoped to a tenant.';
COMMENT ON COLUMN public.tenant.id IS 'Unique identifier (UUID v4) for the tenant.';
COMMENT ON COLUMN public.tenant.slug IS 'URL-friendly unique identifier used in URLs and API paths.';
COMMENT ON COLUMN public.tenant.name IS 'Human-readable display name for the tenant organization.';
COMMENT ON COLUMN public.tenant.status IS 'Tenant lifecycle status: active (operational), suspended (temporarily disabled), deleted (marked for removal).';
COMMENT ON COLUMN public.tenant.tier IS 'Subscription tier determining feature access and limits: free, pro, enterprise.';
COMMENT ON COLUMN public.tenant.timezone IS 'Default timezone for tenant (IANA format, e.g., America/New_York).';
COMMENT ON COLUMN public.tenant.locale IS 'Default locale for formatting dates, numbers, and translations (e.g., en-US, fr-FR).';
COMMENT ON COLUMN public.tenant.created_at IS 'Timestamp when the tenant was created.';
COMMENT ON COLUMN public.tenant.updated_at IS 'Timestamp when the tenant was last modified.';

-- org table
COMMENT ON TABLE public.org IS 'Organization unit within a tenant for departmental grouping.';
COMMENT ON COLUMN public.org.id IS 'Unique identifier (UUID v4) for the organization.';
COMMENT ON COLUMN public.org.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.org.name IS 'Human-readable name for the organization unit.';
COMMENT ON COLUMN public.org.description IS 'Optional description of the organization purpose and scope.';
COMMENT ON COLUMN public.org.created_at IS 'Timestamp when the organization was created.';
COMMENT ON COLUMN public.org.updated_at IS 'Timestamp when the organization was last modified.';

-- project table
COMMENT ON TABLE public.project IS 'MLOps project container for experiments, models, deployments, and workloads.';
COMMENT ON COLUMN public.project.id IS 'Unique identifier (UUID v4) for the project.';
COMMENT ON COLUMN public.project.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.project.org_id IS 'Optional reference to organization unit within tenant.';
COMMENT ON COLUMN public.project.key IS 'URL-friendly project identifier, unique per tenant.';
COMMENT ON COLUMN public.project.name IS 'Human-readable display name for the project.';
COMMENT ON COLUMN public.project.description IS 'Detailed description of project purpose and scope.';
COMMENT ON COLUMN public.project.visibility IS 'Access visibility: private (tenant only), internal (authenticated users), public (anyone).';
COMMENT ON COLUMN public.project.lifecycle_status IS 'Project lifecycle: initiating, active, paused, archived.';
COMMENT ON COLUMN public.project.criticality IS 'Business criticality level: low, medium, high.';
COMMENT ON COLUMN public.project.default_k8s_namespace IS 'Default Kubernetes namespace for project workloads.';
COMMENT ON COLUMN public.project.tags IS 'Array of tags for categorization and search.';
COMMENT ON COLUMN public.project.metadata IS 'Flexible key-value metadata for custom attributes.';
COMMENT ON COLUMN public.project.created_at IS 'Timestamp when the project was created.';
COMMENT ON COLUMN public.project.updated_at IS 'Timestamp when the project was last modified.';
COMMENT ON COLUMN public.project.created_by IS 'Reference to user who created the project.';
COMMENT ON COLUMN public.project.updated_by IS 'Reference to user who last modified the project.';
COMMENT ON COLUMN public.project.archived_at IS 'Timestamp when project was archived (null if active).';

-- project_progress_snapshot table
COMMENT ON TABLE public.project_progress_snapshot IS 'Daily/weekly progress snapshots for project tracking and reporting.';
COMMENT ON COLUMN public.project_progress_snapshot.id IS 'Unique identifier (UUID v4) for the snapshot.';
COMMENT ON COLUMN public.project_progress_snapshot.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.project_progress_snapshot.project_id IS 'Reference to parent project.';
COMMENT ON COLUMN public.project_progress_snapshot.date_key IS 'Date of the snapshot (YYYY-MM-DD).';
COMMENT ON COLUMN public.project_progress_snapshot.progress_percent IS 'Overall progress percentage (0-100).';
COMMENT ON COLUMN public.project_progress_snapshot.status IS 'RAG status: green (on track), amber (at risk), red (blocked).';
COMMENT ON COLUMN public.project_progress_snapshot.summary IS 'Brief summary of current progress.';
COMMENT ON COLUMN public.project_progress_snapshot.risks IS 'Identified risks and mitigation plans.';
COMMENT ON COLUMN public.project_progress_snapshot.blockers IS 'Current blockers preventing progress.';
COMMENT ON COLUMN public.project_progress_snapshot.next_steps IS 'Planned next steps and actions.';
COMMENT ON COLUMN public.project_progress_snapshot.kpis IS 'JSON object with key performance indicators.';
COMMENT ON COLUMN public.project_progress_snapshot.created_at IS 'Timestamp when the snapshot was created.';
COMMENT ON COLUMN public.project_progress_snapshot.created_by IS 'Reference to user who created the snapshot.';

-- milestone table
COMMENT ON TABLE public.milestone IS 'Project milestones for tracking major deliverables and deadlines.';
COMMENT ON COLUMN public.milestone.id IS 'Unique identifier (UUID v4) for the milestone.';
COMMENT ON COLUMN public.milestone.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.milestone.project_id IS 'Reference to parent project.';
COMMENT ON COLUMN public.milestone.title IS 'Brief title of the milestone.';
COMMENT ON COLUMN public.milestone.description IS 'Detailed description of milestone deliverables.';
COMMENT ON COLUMN public.milestone.due_date IS 'Target completion date.';
COMMENT ON COLUMN public.milestone.status IS 'Milestone status: planned, in_progress, done, canceled.';
COMMENT ON COLUMN public.milestone.weight IS 'Relative weight for progress calculation.';
COMMENT ON COLUMN public.milestone.progress_percent IS 'Completion percentage (0-100).';
COMMENT ON COLUMN public.milestone.created_at IS 'Timestamp when the milestone was created.';
COMMENT ON COLUMN public.milestone.updated_at IS 'Timestamp when the milestone was last modified.';
COMMENT ON COLUMN public.milestone.created_by IS 'Reference to user who created the milestone.';
COMMENT ON COLUMN public.milestone.updated_by IS 'Reference to user who last modified the milestone.';

-- kanban_board table
COMMENT ON TABLE public.kanban_board IS 'Kanban boards for visual work management and task tracking.';
COMMENT ON COLUMN public.kanban_board.id IS 'Unique identifier (UUID v4) for the board.';
COMMENT ON COLUMN public.kanban_board.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.kanban_board.project_id IS 'Reference to parent project.';
COMMENT ON COLUMN public.kanban_board.name IS 'Display name for the board.';
COMMENT ON COLUMN public.kanban_board.description IS 'Optional description of the board purpose.';
COMMENT ON COLUMN public.kanban_board.created_at IS 'Timestamp when the board was created.';
COMMENT ON COLUMN public.kanban_board.updated_at IS 'Timestamp when the board was last modified.';

-- kanban_column table
COMMENT ON TABLE public.kanban_column IS 'Kanban board columns representing workflow stages.';
COMMENT ON COLUMN public.kanban_column.id IS 'Unique identifier (UUID v4) for the column.';
COMMENT ON COLUMN public.kanban_column.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.kanban_column.board_id IS 'Reference to parent kanban board.';
COMMENT ON COLUMN public.kanban_column.name IS 'Display name for the column (e.g., To Do, In Progress, Done).';
COMMENT ON COLUMN public.kanban_column.position IS 'Display order position (0-indexed).';
COMMENT ON COLUMN public.kanban_column.wip_limit IS 'Work-in-progress limit for the column (null for unlimited).';

-- work_item table
COMMENT ON TABLE public.work_item IS 'Work items for project management: tasks, bugs, stories, epics, change requests.';
COMMENT ON COLUMN public.work_item.id IS 'Unique identifier (UUID v4) for the work item.';
COMMENT ON COLUMN public.work_item.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.work_item.project_id IS 'Reference to parent project.';
COMMENT ON COLUMN public.work_item.board_id IS 'Optional reference to Kanban board.';
COMMENT ON COLUMN public.work_item.column_id IS 'Optional reference to Kanban column for workflow state.';
COMMENT ON COLUMN public.work_item.type IS 'Work item type: task, bug, story, epic, change_request.';
COMMENT ON COLUMN public.work_item.title IS 'Brief title/summary of the work item.';
COMMENT ON COLUMN public.work_item.description IS 'Detailed description in markdown format.';
COMMENT ON COLUMN public.work_item.status IS 'Workflow status: open, in_progress, blocked, done, canceled.';
COMMENT ON COLUMN public.work_item.priority IS 'Priority level: low, medium, high, critical.';
COMMENT ON COLUMN public.work_item.severity IS 'Severity for bugs: minor, major, critical.';
COMMENT ON COLUMN public.work_item.labels IS 'Array of label strings for categorization.';
COMMENT ON COLUMN public.work_item.assignee_user_id IS 'Reference to user assigned to work on this item.';
COMMENT ON COLUMN public.work_item.reporter_user_id IS 'Reference to user who reported/created this item.';
COMMENT ON COLUMN public.work_item.due_date IS 'Target completion date.';
COMMENT ON COLUMN public.work_item.estimate_points IS 'Story points or effort estimate.';
COMMENT ON COLUMN public.work_item.progress_percent IS 'Completion percentage (0-100).';
COMMENT ON COLUMN public.work_item.external_refs IS 'JSON references to external systems (GitLab, Jira, etc.).';
COMMENT ON COLUMN public.work_item.created_at IS 'Timestamp when the work item was created.';
COMMENT ON COLUMN public.work_item.updated_at IS 'Timestamp when the work item was last modified.';
COMMENT ON COLUMN public.work_item.created_by IS 'Reference to user who created the work item.';
COMMENT ON COLUMN public.work_item.updated_by IS 'Reference to user who last modified the work item.';
COMMENT ON COLUMN public.work_item.closed_at IS 'Timestamp when the work item was closed.';

-- ============================================================================
-- SECTION 2: IDENTITY AND RBAC TABLES (002)
-- ============================================================================

-- user_account table
COMMENT ON TABLE public.user_account IS 'User accounts within the MLOps platform linked to external identity providers.';
COMMENT ON COLUMN public.user_account.id IS 'Unique identifier (UUID v4) for the user account.';
COMMENT ON COLUMN public.user_account.tenant_id IS 'Reference to tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.user_account.external_subject IS 'External identity provider subject ID (OIDC sub claim or SAML NameID).';
COMMENT ON COLUMN public.user_account.email IS 'User email address, unique within the tenant.';
COMMENT ON COLUMN public.user_account.display_name IS 'User display name shown in UI.';
COMMENT ON COLUMN public.user_account.status IS 'Account status: active (can log in), disabled (blocked from access).';
COMMENT ON COLUMN public.user_account.last_login_at IS 'Timestamp of last successful login.';
COMMENT ON COLUMN public.user_account.mfa_enabled IS 'Whether multi-factor authentication is enabled for this user.';
COMMENT ON COLUMN public.user_account.created_at IS 'Timestamp when the user account was created.';
COMMENT ON COLUMN public.user_account.updated_at IS 'Timestamp when the user account was last modified.';

-- group table
COMMENT ON TABLE public."group" IS 'Groups for organizing users and applying collective role bindings.';
COMMENT ON COLUMN public."group".id IS 'Unique identifier (UUID v4) for the group.';
COMMENT ON COLUMN public."group".tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public."group".name IS 'Unique group name within the tenant.';
COMMENT ON COLUMN public."group".description IS 'Optional description of the group purpose.';
COMMENT ON COLUMN public."group".created_at IS 'Timestamp when the group was created.';
COMMENT ON COLUMN public."group".updated_at IS 'Timestamp when the group was last modified.';

-- group_member table
COMMENT ON TABLE public.group_member IS 'Junction table for user-to-group membership relationships.';
COMMENT ON COLUMN public.group_member.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.group_member.group_id IS 'Reference to the group.';
COMMENT ON COLUMN public.group_member.user_id IS 'Reference to the user account.';
COMMENT ON COLUMN public.group_member.created_at IS 'Timestamp when the membership was created.';

-- role table
COMMENT ON TABLE public.role IS 'RBAC roles with scope-based access control (tenant, org, or project level).';
COMMENT ON COLUMN public.role.id IS 'Unique identifier (UUID v4) for the role.';
COMMENT ON COLUMN public.role.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.role.name IS 'Unique role name within the tenant.';
COMMENT ON COLUMN public.role.scope IS 'Scope level: tenant, org, or project.';
COMMENT ON COLUMN public.role.description IS 'Description of the role and its permissions.';
COMMENT ON COLUMN public.role.is_system IS 'Whether this is a system-defined role that cannot be modified.';
COMMENT ON COLUMN public.role.created_at IS 'Timestamp when the role was created.';
COMMENT ON COLUMN public.role.updated_at IS 'Timestamp when the role was last modified.';

-- permission table
COMMENT ON TABLE public.permission IS 'Permission definitions for RBAC (tenant-agnostic reference table).';
COMMENT ON COLUMN public.permission.code IS 'Unique permission code (e.g., project.read, mlops.run.create).';
COMMENT ON COLUMN public.permission.description IS 'Human-readable description of the permission.';
COMMENT ON COLUMN public.permission.category IS 'Permission category: admin, project, security, mlops, cicd, gitops.';

-- role_permission table
COMMENT ON TABLE public.role_permission IS 'Junction table mapping roles to their granted permissions.';
COMMENT ON COLUMN public.role_permission.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.role_permission.role_id IS 'Reference to the role.';
COMMENT ON COLUMN public.role_permission.permission_code IS 'Reference to the permission code.';

-- principal_role_binding table
COMMENT ON TABLE public.principal_role_binding IS 'Role bindings assigning roles to users, groups, or service accounts.';
COMMENT ON COLUMN public.principal_role_binding.id IS 'Unique identifier (UUID v4) for the binding.';
COMMENT ON COLUMN public.principal_role_binding.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.principal_role_binding.principal_type IS 'Type of principal: user, group, or service.';
COMMENT ON COLUMN public.principal_role_binding.principal_id IS 'ID of the principal (user, group, or service account).';
COMMENT ON COLUMN public.principal_role_binding.scope_type IS 'Scope level for the binding: tenant, org, or project.';
COMMENT ON COLUMN public.principal_role_binding.scope_id IS 'ID of the scope entity (null for tenant scope).';
COMMENT ON COLUMN public.principal_role_binding.role_id IS 'Reference to the role being assigned.';
COMMENT ON COLUMN public.principal_role_binding.created_at IS 'Timestamp when the binding was created.';
COMMENT ON COLUMN public.principal_role_binding.created_by IS 'Reference to user who created the binding.';

-- business_rule table
COMMENT ON TABLE public.business_rule IS 'Business rules for validation, naming conventions, approvals, quotas, and security.';
COMMENT ON COLUMN public.business_rule.id IS 'Unique identifier (UUID v4) for the rule.';
COMMENT ON COLUMN public.business_rule.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.business_rule.name IS 'Unique rule name within the tenant.';
COMMENT ON COLUMN public.business_rule.rule_type IS 'Rule type: validation, approval, naming, quota, security.';
COMMENT ON COLUMN public.business_rule.applies_to IS 'Entity type the rule applies to: project, run, deploy, env, registry, cicd, gitops, catalog.';
COMMENT ON COLUMN public.business_rule.expression IS 'JSON expression for rule evaluation (CEL, JSONPath, or custom).';
COMMENT ON COLUMN public.business_rule.enabled IS 'Whether the rule is currently active.';
COMMENT ON COLUMN public.business_rule.severity IS 'Rule severity: info (advisory), warn (warning), block (enforcement).';
COMMENT ON COLUMN public.business_rule.message IS 'Human-readable message shown when rule is triggered.';
COMMENT ON COLUMN public.business_rule.created_at IS 'Timestamp when the rule was created.';
COMMENT ON COLUMN public.business_rule.updated_at IS 'Timestamp when the rule was last modified.';
COMMENT ON COLUMN public.business_rule.created_by IS 'Reference to user who created the rule.';
COMMENT ON COLUMN public.business_rule.updated_by IS 'Reference to user who last modified the rule.';

-- feature_flag table
COMMENT ON TABLE public.feature_flag IS 'Feature flags for enabling/disabling features per tenant with targeting rules.';
COMMENT ON COLUMN public.feature_flag.id IS 'Unique identifier (UUID v4) for the feature flag.';
COMMENT ON COLUMN public.feature_flag.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.feature_flag.key IS 'Unique feature flag key within the tenant.';
COMMENT ON COLUMN public.feature_flag.description IS 'Description of what the feature flag controls.';
COMMENT ON COLUMN public.feature_flag.enabled IS 'Whether the feature is globally enabled.';
COMMENT ON COLUMN public.feature_flag.targeting IS 'JSON targeting rules (user segments, percentages, etc.).';
COMMENT ON COLUMN public.feature_flag.created_at IS 'Timestamp when the flag was created.';
COMMENT ON COLUMN public.feature_flag.updated_at IS 'Timestamp when the flag was last modified.';

-- quota_policy table
COMMENT ON TABLE public.quota_policy IS 'Quota policies for limiting resource usage at tenant, org, or project level.';
COMMENT ON COLUMN public.quota_policy.id IS 'Unique identifier (UUID v4) for the quota policy.';
COMMENT ON COLUMN public.quota_policy.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.quota_policy.scope_type IS 'Scope level: tenant, org, or project.';
COMMENT ON COLUMN public.quota_policy.scope_id IS 'ID of the scope entity (null for tenant scope).';
COMMENT ON COLUMN public.quota_policy.name IS 'Descriptive name for the quota policy.';
COMMENT ON COLUMN public.quota_policy.limits IS 'JSON object with quota limits (e.g., {"max_runs": 100, "max_storage_gb": 500}).';
COMMENT ON COLUMN public.quota_policy.enforced IS 'Whether the quota is actively enforced.';
COMMENT ON COLUMN public.quota_policy.created_at IS 'Timestamp when the policy was created.';
COMMENT ON COLUMN public.quota_policy.updated_at IS 'Timestamp when the policy was last modified.';

-- admin_setting table
COMMENT ON TABLE public.admin_setting IS 'Tenant-level admin settings and configuration key-value store.';
COMMENT ON COLUMN public.admin_setting.id IS 'Unique identifier (UUID v4) for the setting.';
COMMENT ON COLUMN public.admin_setting.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.admin_setting.key IS 'Unique setting key within the tenant.';
COMMENT ON COLUMN public.admin_setting.value IS 'JSON value for the setting.';
COMMENT ON COLUMN public.admin_setting.description IS 'Description of what the setting controls.';
COMMENT ON COLUMN public.admin_setting.updated_at IS 'Timestamp when the setting was last modified.';
COMMENT ON COLUMN public.admin_setting.updated_by IS 'Reference to user who last modified the setting.';

-- service_account table
COMMENT ON TABLE public.service_account IS 'Machine identities for automation, CI/CD, and integrations.';
COMMENT ON COLUMN public.service_account.id IS 'Unique identifier (UUID v4) for the service account.';
COMMENT ON COLUMN public.service_account.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.service_account.name IS 'Unique service account name within the tenant.';
COMMENT ON COLUMN public.service_account.description IS 'Description of the service account purpose.';
COMMENT ON COLUMN public.service_account.status IS 'Account status: active or disabled.';
COMMENT ON COLUMN public.service_account.created_at IS 'Timestamp when the service account was created.';
COMMENT ON COLUMN public.service_account.updated_at IS 'Timestamp when the service account was last modified.';
COMMENT ON COLUMN public.service_account.created_by IS 'Reference to user who created the service account.';
COMMENT ON COLUMN public.service_account.updated_by IS 'Reference to user who last modified the service account.';

-- service_account_token table
COMMENT ON TABLE public.service_account_token IS 'Authentication tokens for service accounts with scoped permissions.';
COMMENT ON COLUMN public.service_account_token.id IS 'Unique identifier (UUID v4) for the token.';
COMMENT ON COLUMN public.service_account_token.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.service_account_token.service_account_id IS 'Reference to the owning service account.';
COMMENT ON COLUMN public.service_account_token.token_hash IS 'SHA-256 hash of the token (never store plain text).';
COMMENT ON COLUMN public.service_account_token.scopes IS 'Array of permission scopes for this token.';
COMMENT ON COLUMN public.service_account_token.expires_at IS 'Token expiration timestamp (null for non-expiring).';
COMMENT ON COLUMN public.service_account_token.last_used_at IS 'Timestamp when the token was last used.';
COMMENT ON COLUMN public.service_account_token.created_at IS 'Timestamp when the token was created.';
COMMENT ON COLUMN public.service_account_token.revoked_at IS 'Timestamp when the token was revoked (null if active).';

-- secret_ref table
COMMENT ON TABLE public.secret_ref IS 'References to secrets stored in external secret backends (Vault, AWS SM, etc.).';
COMMENT ON COLUMN public.secret_ref.id IS 'Unique identifier (UUID v4) for the secret reference.';
COMMENT ON COLUMN public.secret_ref.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.secret_ref.backend IS 'Secret backend: vault, aws_sm, gcp_sm, azure_kv, k8s_secret.';
COMMENT ON COLUMN public.secret_ref.ref IS 'Secret reference path in the backend (e.g., Vault path, ARN).';
COMMENT ON COLUMN public.secret_ref.purpose IS 'Secret purpose: db, git, objectstore, registry, oidc, gitlab, argocd, integrations.';
COMMENT ON COLUMN public.secret_ref.rotation_hint IS 'Hint for secret rotation schedule (e.g., "90d", "monthly").';
COMMENT ON COLUMN public.secret_ref.created_at IS 'Timestamp when the reference was created.';
COMMENT ON COLUMN public.secret_ref.updated_at IS 'Timestamp when the reference was last modified.';

-- identity_provider table
COMMENT ON TABLE public.identity_provider IS 'External identity providers for SSO (OIDC, SAML, LDAP).';
COMMENT ON COLUMN public.identity_provider.id IS 'Unique identifier (UUID v4) for the identity provider.';
COMMENT ON COLUMN public.identity_provider.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.identity_provider.type IS 'Provider type: oidc, saml, ldap.';
COMMENT ON COLUMN public.identity_provider.issuer_url IS 'OIDC issuer URL or SAML entity ID.';
COMMENT ON COLUMN public.identity_provider.client_id IS 'OIDC client ID (null for SAML/LDAP).';
COMMENT ON COLUMN public.identity_provider.sso_metadata IS 'Provider-specific configuration metadata (SAML metadata, LDAP config).';
COMMENT ON COLUMN public.identity_provider.enabled IS 'Whether the identity provider is active.';
COMMENT ON COLUMN public.identity_provider.created_at IS 'Timestamp when the provider was configured.';
COMMENT ON COLUMN public.identity_provider.updated_at IS 'Timestamp when the provider was last modified.';

-- api_token table
COMMENT ON TABLE public.api_token IS 'User API tokens for programmatic access to the platform.';
COMMENT ON COLUMN public.api_token.id IS 'Unique identifier (UUID v4) for the API token.';
COMMENT ON COLUMN public.api_token.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.api_token.user_id IS 'Reference to the owning user account.';
COMMENT ON COLUMN public.api_token.token_hash IS 'SHA-256 hash of the token (never store plain text).';
COMMENT ON COLUMN public.api_token.name IS 'User-defined name for the token.';
COMMENT ON COLUMN public.api_token.scopes IS 'Array of permission scopes for this token.';
COMMENT ON COLUMN public.api_token.expires_at IS 'Token expiration timestamp (null for non-expiring).';
COMMENT ON COLUMN public.api_token.last_used_at IS 'Timestamp when the token was last used.';
COMMENT ON COLUMN public.api_token.created_at IS 'Timestamp when the token was created.';
COMMENT ON COLUMN public.api_token.revoked_at IS 'Timestamp when the token was revoked (null if active).';

-- ============================================================================
-- SECTION 3: INFRASTRUCTURE TABLES (003)
-- ============================================================================

-- k8s_cluster table
COMMENT ON TABLE public.k8s_cluster IS 'Kubernetes clusters registered for running MLOps workloads.';
COMMENT ON COLUMN public.k8s_cluster.id IS 'Unique identifier (UUID v4) for the cluster.';
COMMENT ON COLUMN public.k8s_cluster.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.k8s_cluster.name IS 'Unique cluster name within the tenant.';
COMMENT ON COLUMN public.k8s_cluster.provider IS 'Cloud provider: aws, gcp, azure, onprem.';
COMMENT ON COLUMN public.k8s_cluster.region IS 'Cloud region or datacenter location.';
COMMENT ON COLUMN public.k8s_cluster.environment IS 'Environment tier: dev, staging, prod, sandbox.';
COMMENT ON COLUMN public.k8s_cluster.api_server_url IS 'Kubernetes API server endpoint URL.';
COMMENT ON COLUMN public.k8s_cluster.cluster_identity IS 'Cluster identity configuration (service account, role ARN, etc.).';
COMMENT ON COLUMN public.k8s_cluster.network_profile IS 'Network configuration (VPC, subnets, security groups).';
COMMENT ON COLUMN public.k8s_cluster.status IS 'Cluster status: ready, degraded, down.';
COMMENT ON COLUMN public.k8s_cluster.version IS 'Kubernetes version (e.g., 1.28.0).';
COMMENT ON COLUMN public.k8s_cluster.labels IS 'JSON object with cluster labels for selection.';
COMMENT ON COLUMN public.k8s_cluster.created_at IS 'Timestamp when the cluster was registered.';
COMMENT ON COLUMN public.k8s_cluster.updated_at IS 'Timestamp when the cluster was last modified.';

-- k8s_namespace_binding table
COMMENT ON TABLE public.k8s_namespace_binding IS 'Bindings between projects and Kubernetes namespaces.';
COMMENT ON COLUMN public.k8s_namespace_binding.id IS 'Unique identifier (UUID v4) for the binding.';
COMMENT ON COLUMN public.k8s_namespace_binding.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.k8s_namespace_binding.project_id IS 'Reference to the project.';
COMMENT ON COLUMN public.k8s_namespace_binding.cluster_id IS 'Reference to the Kubernetes cluster.';
COMMENT ON COLUMN public.k8s_namespace_binding.namespace IS 'Kubernetes namespace name (max 63 chars).';
COMMENT ON COLUMN public.k8s_namespace_binding.resource_quota IS 'Kubernetes ResourceQuota spec.';
COMMENT ON COLUMN public.k8s_namespace_binding.limit_range IS 'Kubernetes LimitRange spec.';
COMMENT ON COLUMN public.k8s_namespace_binding.network_policy_profile IS 'Name of pre-defined network policy profile.';
COMMENT ON COLUMN public.k8s_namespace_binding.pod_security_profile IS 'Pod Security Standards profile (restricted, baseline, privileged).';
COMMENT ON COLUMN public.k8s_namespace_binding.status IS 'Namespace binding status.';
COMMENT ON COLUMN public.k8s_namespace_binding.created_at IS 'Timestamp when the binding was created.';
COMMENT ON COLUMN public.k8s_namespace_binding.updated_at IS 'Timestamp when the binding was last modified.';

-- compute_profile table
COMMENT ON TABLE public.compute_profile IS 'Compute resource profiles defining CPU, memory, and GPU configurations.';
COMMENT ON COLUMN public.compute_profile.id IS 'Unique identifier (UUID v4) for the profile.';
COMMENT ON COLUMN public.compute_profile.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.compute_profile.name IS 'Unique profile name within the tenant.';
COMMENT ON COLUMN public.compute_profile.cpu_request IS 'CPU request in cores (e.g., 0.5, 1, 2).';
COMMENT ON COLUMN public.compute_profile.cpu_limit IS 'CPU limit in cores.';
COMMENT ON COLUMN public.compute_profile.mem_request_mb IS 'Memory request in MB.';
COMMENT ON COLUMN public.compute_profile.mem_limit_mb IS 'Memory limit in MB.';
COMMENT ON COLUMN public.compute_profile.gpu_count IS 'Number of GPUs required.';
COMMENT ON COLUMN public.compute_profile.gpu_type IS 'GPU type (e.g., nvidia-tesla-v100, nvidia-a100).';
COMMENT ON COLUMN public.compute_profile.ephemeral_storage_mb IS 'Ephemeral storage limit in MB.';
COMMENT ON COLUMN public.compute_profile.node_selector IS 'Kubernetes node selector labels.';
COMMENT ON COLUMN public.compute_profile.tolerations IS 'Kubernetes tolerations array.';
COMMENT ON COLUMN public.compute_profile.affinity IS 'Kubernetes affinity rules.';
COMMENT ON COLUMN public.compute_profile.priority_class IS 'Kubernetes priority class name.';
COMMENT ON COLUMN public.compute_profile.created_at IS 'Timestamp when the profile was created.';
COMMENT ON COLUMN public.compute_profile.updated_at IS 'Timestamp when the profile was last modified.';

-- runtime_policy table
COMMENT ON TABLE public.runtime_policy IS 'Runtime security policies for workload isolation.';
COMMENT ON COLUMN public.runtime_policy.id IS 'Unique identifier (UUID v4) for the policy.';
COMMENT ON COLUMN public.runtime_policy.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.runtime_policy.name IS 'Unique policy name within the tenant.';
COMMENT ON COLUMN public.runtime_policy.allowed_images IS 'Array of allowed container image patterns.';
COMMENT ON COLUMN public.runtime_policy.allowed_registries IS 'Array of allowed container registries.';
COMMENT ON COLUMN public.runtime_policy.egress_rules IS 'Network egress rules (destinations, ports).';
COMMENT ON COLUMN public.runtime_policy.ingress_rules IS 'Network ingress rules (sources, ports).';
COMMENT ON COLUMN public.runtime_policy.pod_security_profile IS 'Pod Security Standards: restricted, baseline, privileged.';
COMMENT ON COLUMN public.runtime_policy.env_var_allowlist IS 'Allowed environment variable names.';
COMMENT ON COLUMN public.runtime_policy.secret_mount_policy IS 'Rules for secret mounting (paths, secret names).';
COMMENT ON COLUMN public.runtime_policy.created_at IS 'Timestamp when the policy was created.';
COMMENT ON COLUMN public.runtime_policy.updated_at IS 'Timestamp when the policy was last modified.';

-- ============================================================================
-- SECTION 4: REGISTRIES TABLES (004)
-- ============================================================================

-- container_registry table
COMMENT ON TABLE public.container_registry IS 'Container image registries for storing Docker images.';
COMMENT ON COLUMN public.container_registry.id IS 'Unique identifier (UUID v4) for the registry.';
COMMENT ON COLUMN public.container_registry.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.container_registry.name IS 'Unique registry name within the tenant.';
COMMENT ON COLUMN public.container_registry.type IS 'Registry type: ecr, gar, acr, harbor, dockerhub, ghcr.';
COMMENT ON COLUMN public.container_registry.endpoint IS 'Registry endpoint URL (e.g., 123456789.dkr.ecr.eu-west-1.amazonaws.com).';
COMMENT ON COLUMN public.container_registry.auth_secret_ref IS 'Reference to secret for registry authentication.';
COMMENT ON COLUMN public.container_registry.trust_policy IS 'Image trust policy (signing, vulnerability thresholds).';
COMMENT ON COLUMN public.container_registry.is_default IS 'Whether this is the default registry for the tenant.';
COMMENT ON COLUMN public.container_registry.created_at IS 'Timestamp when the registry was registered.';
COMMENT ON COLUMN public.container_registry.updated_at IS 'Timestamp when the registry was last modified.';

-- object_store table
COMMENT ON TABLE public.object_store IS 'Object storage backends for artifacts, datasets, and logs.';
COMMENT ON COLUMN public.object_store.id IS 'Unique identifier (UUID v4) for the object store.';
COMMENT ON COLUMN public.object_store.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.object_store.name IS 'Unique object store name within the tenant.';
COMMENT ON COLUMN public.object_store.type IS 'Storage type: s3, gcs, azure, minio.';
COMMENT ON COLUMN public.object_store.endpoint IS 'Custom endpoint for MinIO or S3-compatible storage.';
COMMENT ON COLUMN public.object_store.bucket IS 'Bucket/container name.';
COMMENT ON COLUMN public.object_store.prefix IS 'Key prefix for tenant isolation.';
COMMENT ON COLUMN public.object_store.auth_secret_ref IS 'Reference to secret for storage authentication.';
COMMENT ON COLUMN public.object_store.kms_key_ref IS 'KMS key reference for encryption.';
COMMENT ON COLUMN public.object_store.retention_policy IS 'Retention policy rules (lifecycle, versioning).';
COMMENT ON COLUMN public.object_store.is_default IS 'Whether this is the default object store for the tenant.';
COMMENT ON COLUMN public.object_store.created_at IS 'Timestamp when the object store was registered.';
COMMENT ON COLUMN public.object_store.updated_at IS 'Timestamp when the object store was last modified.';

-- data_connection table
COMMENT ON TABLE public.data_connection IS 'External data source connections for ML workflows.';
COMMENT ON COLUMN public.data_connection.id IS 'Unique identifier (UUID v4) for the connection.';
COMMENT ON COLUMN public.data_connection.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.data_connection.name IS 'Unique connection name within the tenant.';
COMMENT ON COLUMN public.data_connection.type IS 'Connection type: snowflake, databricks, jdbc, sftp, nfs, bigquery, redshift, postgres.';
COMMENT ON COLUMN public.data_connection.config IS 'Connection configuration (host, port, database, etc.).';
COMMENT ON COLUMN public.data_connection.secret_ref_id IS 'Reference to credentials secret.';
COMMENT ON COLUMN public.data_connection.test_query IS 'SQL query for testing connection.';
COMMENT ON COLUMN public.data_connection.last_tested_at IS 'Timestamp of last connection test.';
COMMENT ON COLUMN public.data_connection.test_status IS 'Result of last connection test.';
COMMENT ON COLUMN public.data_connection.created_at IS 'Timestamp when the connection was created.';
COMMENT ON COLUMN public.data_connection.updated_at IS 'Timestamp when the connection was last modified.';
COMMENT ON COLUMN public.data_connection.created_by IS 'Reference to user who created the connection.';

-- environment table
COMMENT ON TABLE public.environment IS 'Compute environment definitions for ML workloads.';
COMMENT ON COLUMN public.environment.id IS 'Unique identifier (UUID v4) for the environment.';
COMMENT ON COLUMN public.environment.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.environment.project_id IS 'NULL for tenant-wide environments, set for project-specific.';
COMMENT ON COLUMN public.environment.name IS 'Environment name, unique within scope.';
COMMENT ON COLUMN public.environment.description IS 'Description of the environment and its use case.';
COMMENT ON COLUMN public.environment.base_image IS 'Base Docker image (e.g., python:3.11-slim).';
COMMENT ON COLUMN public.environment.spec IS 'Environment specification (conda.yaml, requirements.txt, poetry.lock).';
COMMENT ON COLUMN public.environment.build_strategy IS 'Container build strategy: dockerfile, buildkit, kaniko.';
COMMENT ON COLUMN public.environment.registry_id IS 'Reference to container registry for built images.';
COMMENT ON COLUMN public.environment.runtime_policy_id IS 'Reference to runtime policy for security constraints.';
COMMENT ON COLUMN public.environment.status IS 'Environment status: active, deprecated, archived.';
COMMENT ON COLUMN public.environment.is_default IS 'Whether this is the default environment for the scope.';
COMMENT ON COLUMN public.environment.created_at IS 'Timestamp when the environment was created.';
COMMENT ON COLUMN public.environment.updated_at IS 'Timestamp when the environment was last modified.';
COMMENT ON COLUMN public.environment.created_by IS 'Reference to user who created the environment.';
COMMENT ON COLUMN public.environment.updated_by IS 'Reference to user who last modified the environment.';

-- environment_build table
COMMENT ON TABLE public.environment_build IS 'Environment build history with container images.';
COMMENT ON COLUMN public.environment_build.id IS 'Unique identifier (UUID v4) for the build.';
COMMENT ON COLUMN public.environment_build.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.environment_build.environment_id IS 'Reference to the environment being built.';
COMMENT ON COLUMN public.environment_build.version IS 'Incrementing version number for this environment.';
COMMENT ON COLUMN public.environment_build.git_commit_sha IS 'Git commit SHA of the environment definition.';
COMMENT ON COLUMN public.environment_build.build_log_uri IS 'URI to build logs in object store.';
COMMENT ON COLUMN public.environment_build.image_name IS 'Full container image name.';
COMMENT ON COLUMN public.environment_build.image_tag IS 'Docker image tag for this build.';
COMMENT ON COLUMN public.environment_build.image_digest IS 'Container image digest (sha256:...).';
COMMENT ON COLUMN public.environment_build.sbom_uri IS 'URI to Software Bill of Materials.';
COMMENT ON COLUMN public.environment_build.vuln_report_uri IS 'URI to vulnerability scan report.';
COMMENT ON COLUMN public.environment_build.status IS 'Build status: queued, running, succeeded, failed.';
COMMENT ON COLUMN public.environment_build.failure_reason IS 'Failure reason if build failed.';
COMMENT ON COLUMN public.environment_build.started_at IS 'Timestamp when the build started.';
COMMENT ON COLUMN public.environment_build.finished_at IS 'Timestamp when the build finished.';
COMMENT ON COLUMN public.environment_build.duration_seconds IS 'Build duration in seconds (computed).';
COMMENT ON COLUMN public.environment_build.created_at IS 'Timestamp when the build was created.';
COMMENT ON COLUMN public.environment_build.created_by IS 'Reference to user who triggered the build.';

-- ============================================================================
-- SECTION 5: MLOPS TABLES (005)
-- ============================================================================

-- experiment table
COMMENT ON TABLE public.experiment IS 'ML experiment containers for organizing related runs.';
COMMENT ON COLUMN public.experiment.id IS 'Unique identifier (UUID v4) for the experiment.';
COMMENT ON COLUMN public.experiment.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.experiment.project_id IS 'Reference to parent project.';
COMMENT ON COLUMN public.experiment.name IS 'Experiment name, unique within the project.';
COMMENT ON COLUMN public.experiment.description IS 'Description of the experiment objectives and approach.';
COMMENT ON COLUMN public.experiment.tags IS 'Array of tags for categorization.';
COMMENT ON COLUMN public.experiment.created_at IS 'Timestamp when the experiment was created.';
COMMENT ON COLUMN public.experiment.updated_at IS 'Timestamp when the experiment was last modified.';
COMMENT ON COLUMN public.experiment.created_by IS 'Reference to user who created the experiment.';
COMMENT ON COLUMN public.experiment.updated_by IS 'Reference to user who last modified the experiment.';

-- run table
COMMENT ON TABLE public.run IS 'ML runs: training jobs, workspaces, pipeline steps, apps, model APIs.';
COMMENT ON COLUMN public.run.id IS 'Unique identifier (UUID v4) for the run.';
COMMENT ON COLUMN public.run.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.run.project_id IS 'Reference to parent project.';
COMMENT ON COLUMN public.run.experiment_id IS 'Optional reference to parent experiment.';
COMMENT ON COLUMN public.run.parent_run_id IS 'Reference to parent run (for nested runs).';
COMMENT ON COLUMN public.run.type IS 'Run type: job, workspace, pipeline_step, app, model_api.';
COMMENT ON COLUMN public.run.status IS 'Run status: queued, running, succeeded, failed, canceled.';
COMMENT ON COLUMN public.run.trigger IS 'Trigger source: manual, schedule, webhook, api, cicd.';
COMMENT ON COLUMN public.run.status_message IS 'Human-readable status message or error details.';
COMMENT ON COLUMN public.run.started_at IS 'Timestamp when the run started execution.';
COMMENT ON COLUMN public.run.ended_at IS 'Timestamp when the run completed.';
COMMENT ON COLUMN public.run.duration_ms IS 'Run duration in milliseconds (computed).';
COMMENT ON COLUMN public.run.compute_profile_id IS 'Reference to compute profile used.';
COMMENT ON COLUMN public.run.environment_build_id IS 'Reference to environment build used.';
COMMENT ON COLUMN public.run.cluster_id IS 'Reference to Kubernetes cluster where run executed.';
COMMENT ON COLUMN public.run.namespace IS 'Kubernetes namespace for the run.';
COMMENT ON COLUMN public.run.k8s_workload_ref IS 'JSON reference to Kubernetes workload (pod name, job name).';
COMMENT ON COLUMN public.run.params IS 'JSON object with run parameters (hyperparameters, config).';
COMMENT ON COLUMN public.run.metrics_summary IS 'JSON object with summary metrics (accuracy, loss, etc.).';
COMMENT ON COLUMN public.run.logs_uri IS 'URI to run logs.';
COMMENT ON COLUMN public.run.artifacts_root_uri IS 'Root URI for run artifacts.';
COMMENT ON COLUMN public.run.created_at IS 'Timestamp when the run was created.';
COMMENT ON COLUMN public.run.updated_at IS 'Timestamp when the run was last modified.';
COMMENT ON COLUMN public.run.created_by IS 'Reference to user who created the run.';
COMMENT ON COLUMN public.run.updated_by IS 'Reference to user who last modified the run.';

-- run_metric table
COMMENT ON TABLE public.run_metric IS 'Time-series metrics logged during ML runs.';
COMMENT ON COLUMN public.run_metric.id IS 'Unique identifier (UUID v4) for the metric record.';
COMMENT ON COLUMN public.run_metric.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.run_metric.run_id IS 'Reference to parent run.';
COMMENT ON COLUMN public.run_metric.name IS 'Metric name (e.g., loss, accuracy, f1_score).';
COMMENT ON COLUMN public.run_metric.step IS 'Training step or epoch number.';
COMMENT ON COLUMN public.run_metric.value IS 'Metric value (double precision).';
COMMENT ON COLUMN public.run_metric.unit IS 'Metric unit (%, ms, GB, etc.).';
COMMENT ON COLUMN public.run_metric.logged_at IS 'Timestamp when the metric was logged.';

-- artifact table
COMMENT ON TABLE public.artifact IS 'ML artifacts: models, datasets, reports, files, plots.';
COMMENT ON COLUMN public.artifact.id IS 'Unique identifier (UUID v4) for the artifact.';
COMMENT ON COLUMN public.artifact.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.artifact.project_id IS 'Reference to parent project.';
COMMENT ON COLUMN public.artifact.run_id IS 'Optional reference to source run.';
COMMENT ON COLUMN public.artifact.kind IS 'Artifact type: model, dataset, report, file, plot.';
COMMENT ON COLUMN public.artifact.name IS 'Artifact name/path.';
COMMENT ON COLUMN public.artifact.uri IS 'Storage URI (s3://, gs://, etc.).';
COMMENT ON COLUMN public.artifact.content_hash IS 'SHA-256 hash for deduplication and integrity.';
COMMENT ON COLUMN public.artifact.size_bytes IS 'Artifact size in bytes.';
COMMENT ON COLUMN public.artifact.mime_type IS 'MIME type of the artifact.';
COMMENT ON COLUMN public.artifact.metadata IS 'JSON metadata (format, version, schema, etc.).';
COMMENT ON COLUMN public.artifact.created_at IS 'Timestamp when the artifact was created.';
COMMENT ON COLUMN public.artifact.created_by IS 'Reference to user who created the artifact.';

-- model table
COMMENT ON TABLE public.model IS 'Model registry entries for tracking ML models.';
COMMENT ON COLUMN public.model.id IS 'Unique identifier (UUID v4) for the model.';
COMMENT ON COLUMN public.model.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.model.project_id IS 'Reference to parent project.';
COMMENT ON COLUMN public.model.name IS 'Model name, unique within the project.';
COMMENT ON COLUMN public.model.description IS 'Description of the model purpose and architecture.';
COMMENT ON COLUMN public.model.tags IS 'Array of tags for categorization.';
COMMENT ON COLUMN public.model.created_at IS 'Timestamp when the model was registered.';
COMMENT ON COLUMN public.model.updated_at IS 'Timestamp when the model was last modified.';
COMMENT ON COLUMN public.model.created_by IS 'Reference to user who registered the model.';
COMMENT ON COLUMN public.model.updated_by IS 'Reference to user who last modified the model.';

-- model_version table
COMMENT ON TABLE public.model_version IS 'Model versions with lineage tracking and approval workflow.';
COMMENT ON COLUMN public.model_version.id IS 'Unique identifier (UUID v4) for the model version.';
COMMENT ON COLUMN public.model_version.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.model_version.model_id IS 'Reference to parent model.';
COMMENT ON COLUMN public.model_version.version IS 'Version number (auto-incremented).';
COMMENT ON COLUMN public.model_version.source_run_id IS 'Reference to run that produced this version.';
COMMENT ON COLUMN public.model_version.artifact_id IS 'Reference to model artifact.';
COMMENT ON COLUMN public.model_version.signature IS 'JSON model input/output signature (schema).';
COMMENT ON COLUMN public.model_version.metrics_summary IS 'JSON model performance metrics.';
COMMENT ON COLUMN public.model_version.status IS 'Version status: draft, approved, deprecated.';
COMMENT ON COLUMN public.model_version.approval_required IS 'Whether approval is required before deployment.';
COMMENT ON COLUMN public.model_version.created_at IS 'Timestamp when the version was created.';
COMMENT ON COLUMN public.model_version.created_by IS 'Reference to user who created the version.';

-- model_deployment table
COMMENT ON TABLE public.model_deployment IS 'Model deployments for inference endpoints.';
COMMENT ON COLUMN public.model_deployment.id IS 'Unique identifier (UUID v4) for the deployment.';
COMMENT ON COLUMN public.model_deployment.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.model_deployment.project_id IS 'Reference to parent project.';
COMMENT ON COLUMN public.model_deployment.model_version_id IS 'Reference to deployed model version.';
COMMENT ON COLUMN public.model_deployment.name IS 'Deployment name, unique per project.';
COMMENT ON COLUMN public.model_deployment.cluster_id IS 'Reference to Kubernetes cluster for deployment.';
COMMENT ON COLUMN public.model_deployment.namespace IS 'Kubernetes namespace for deployment resources.';
COMMENT ON COLUMN public.model_deployment.endpoint_url IS 'Public URL for inference API endpoint.';
COMMENT ON COLUMN public.model_deployment.auth_policy IS 'JSON authentication policy (API key, OAuth, mTLS).';
COMMENT ON COLUMN public.model_deployment.scaling IS 'JSON autoscaling configuration (min/max replicas, metrics).';
COMMENT ON COLUMN public.model_deployment.resources IS 'JSON resource configuration (CPU, memory, GPU).';
COMMENT ON COLUMN public.model_deployment.rollout_strategy IS 'Deployment strategy: bluegreen, canary, rolling.';
COMMENT ON COLUMN public.model_deployment.status IS 'Deployment status: planned, syncing, healthy, degraded, failed, paused.';
COMMENT ON COLUMN public.model_deployment.status_message IS 'Human-readable status message or error details.';
COMMENT ON COLUMN public.model_deployment.created_at IS 'Timestamp when the deployment was created.';
COMMENT ON COLUMN public.model_deployment.updated_at IS 'Timestamp when the deployment was last modified.';
COMMENT ON COLUMN public.model_deployment.created_by IS 'Reference to user who created the deployment.';
COMMENT ON COLUMN public.model_deployment.updated_by IS 'Reference to user who last modified the deployment.';

-- workspace_session table
COMMENT ON TABLE public.workspace_session IS 'Interactive workspace sessions (VSCode, Jupyter, RStudio).';
COMMENT ON COLUMN public.workspace_session.id IS 'Unique identifier (UUID v4) for the session.';
COMMENT ON COLUMN public.workspace_session.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.workspace_session.project_id IS 'Reference to parent project.';
COMMENT ON COLUMN public.workspace_session.user_id IS 'Reference to user who owns the session.';
COMMENT ON COLUMN public.workspace_session.environment_build_id IS 'Reference to environment build used.';
COMMENT ON COLUMN public.workspace_session.cluster_id IS 'Reference to Kubernetes cluster.';
COMMENT ON COLUMN public.workspace_session.namespace IS 'Kubernetes namespace for the session.';
COMMENT ON COLUMN public.workspace_session.ide IS 'IDE type: vscode, jupyter, rstudio.';
COMMENT ON COLUMN public.workspace_session.url IS 'Access URL for the workspace.';
COMMENT ON COLUMN public.workspace_session.status IS 'Session status: starting, running, stopped, failed.';
COMMENT ON COLUMN public.workspace_session.k8s_pod_ref IS 'JSON Kubernetes pod reference.';
COMMENT ON COLUMN public.workspace_session.started_at IS 'Timestamp when the session started.';
COMMENT ON COLUMN public.workspace_session.ended_at IS 'Timestamp when the session ended.';
COMMENT ON COLUMN public.workspace_session.created_at IS 'Timestamp when the session was created.';

-- app table
COMMENT ON TABLE public.app IS 'Deployed applications: Streamlit, Gradio, custom.';
COMMENT ON COLUMN public.app.id IS 'Unique identifier (UUID v4) for the app.';
COMMENT ON COLUMN public.app.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.app.project_id IS 'Reference to parent project.';
COMMENT ON COLUMN public.app.name IS 'App name, unique within the project.';
COMMENT ON COLUMN public.app.type IS 'Application type: streamlit, gradio, custom.';
COMMENT ON COLUMN public.app.spec IS 'JSON application specification (entrypoint, args, env vars).';
COMMENT ON COLUMN public.app.url IS 'Public URL for accessing the app.';
COMMENT ON COLUMN public.app.status IS 'App status: stopped, starting, running, failed.';
COMMENT ON COLUMN public.app.environment_build_id IS 'Reference to environment build used.';
COMMENT ON COLUMN public.app.cluster_id IS 'Reference to Kubernetes cluster.';
COMMENT ON COLUMN public.app.namespace IS 'Kubernetes namespace for the app.';
COMMENT ON COLUMN public.app.created_at IS 'Timestamp when the app was created.';
COMMENT ON COLUMN public.app.updated_at IS 'Timestamp when the app was last modified.';
COMMENT ON COLUMN public.app.created_by IS 'Reference to user who created the app.';
COMMENT ON COLUMN public.app.updated_by IS 'Reference to user who last modified the app.';

-- ============================================================================
-- SECTION 6: COLLABORATION TABLES (007)
-- ============================================================================

-- comment_thread table
COMMENT ON TABLE public.comment_thread IS 'Comment threads attached to any entity.';
COMMENT ON COLUMN public.comment_thread.id IS 'Unique identifier (UUID v4) for the thread.';
COMMENT ON COLUMN public.comment_thread.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.comment_thread.project_id IS 'Reference to parent project.';
COMMENT ON COLUMN public.comment_thread.entity_type IS 'Entity type: project, run, model, deployment, work_item, pipeline, argocd_app, resource.';
COMMENT ON COLUMN public.comment_thread.entity_id IS 'ID of the entity this thread is attached to.';
COMMENT ON COLUMN public.comment_thread.title IS 'Optional thread title/subject.';
COMMENT ON COLUMN public.comment_thread.is_resolved IS 'Whether the thread is resolved.';
COMMENT ON COLUMN public.comment_thread.resolved_at IS 'Timestamp when the thread was resolved.';
COMMENT ON COLUMN public.comment_thread.resolved_by IS 'Reference to user who resolved the thread.';
COMMENT ON COLUMN public.comment_thread.created_at IS 'Timestamp when the thread was created.';
COMMENT ON COLUMN public.comment_thread.created_by IS 'Reference to user who created the thread.';

-- comment table
COMMENT ON TABLE public.comment IS 'Individual comments in comment threads.';
COMMENT ON COLUMN public.comment.id IS 'Unique identifier (UUID v4) for the comment.';
COMMENT ON COLUMN public.comment.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.comment.thread_id IS 'Reference to parent comment thread.';
COMMENT ON COLUMN public.comment.author_user_id IS 'Reference to user who wrote the comment.';
COMMENT ON COLUMN public.comment.body IS 'Comment body content.';
COMMENT ON COLUMN public.comment.mentions IS 'Array of mentioned user IDs.';
COMMENT ON COLUMN public.comment.attachments IS 'Array of attachment references.';
COMMENT ON COLUMN public.comment.created_at IS 'Timestamp when the comment was created.';
COMMENT ON COLUMN public.comment.updated_at IS 'Timestamp when the comment was last modified.';
COMMENT ON COLUMN public.comment.edited IS 'Whether the comment has been edited.';
COMMENT ON COLUMN public.comment.deleted_at IS 'Timestamp when the comment was soft-deleted (null if active).';

-- notification table
COMMENT ON TABLE public.notification IS 'User notifications for platform events and alerts.';
COMMENT ON COLUMN public.notification.id IS 'Unique identifier (UUID v4) for the notification.';
COMMENT ON COLUMN public.notification.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.notification.user_id IS 'Reference to recipient user.';
COMMENT ON COLUMN public.notification.type IS 'Notification type: mention, assignment, pipeline_failed, deploy_drift, approval, incident.';
COMMENT ON COLUMN public.notification.title IS 'Notification title/subject.';
COMMENT ON COLUMN public.notification.message IS 'Notification body text.';
COMMENT ON COLUMN public.notification.entity_type IS 'Type of entity this notification relates to.';
COMMENT ON COLUMN public.notification.entity_id IS 'ID of entity this notification relates to.';
COMMENT ON COLUMN public.notification.channel IS 'Delivery channel: inapp, email, webhook.';
COMMENT ON COLUMN public.notification.read_at IS 'Timestamp when notification was read (null if unread).';
COMMENT ON COLUMN public.notification.action_url IS 'URL to navigate when notification is clicked.';
COMMENT ON COLUMN public.notification.created_at IS 'Timestamp when the notification was created.';

-- activity_event table
COMMENT ON TABLE public.activity_event IS 'Activity feed events for project timelines.';
COMMENT ON COLUMN public.activity_event.id IS 'Unique identifier (UUID v4) for the event.';
COMMENT ON COLUMN public.activity_event.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.activity_event.project_id IS 'Optional reference to project context.';
COMMENT ON COLUMN public.activity_event.actor_user_id IS 'Reference to user who performed the action.';
COMMENT ON COLUMN public.activity_event.action IS 'Action type: created, updated, deleted, started, completed, failed, etc.';
COMMENT ON COLUMN public.activity_event.entity_type IS 'Type of entity affected by the action.';
COMMENT ON COLUMN public.activity_event.entity_id IS 'ID of the entity affected.';
COMMENT ON COLUMN public.activity_event.entity_name IS 'Name of the entity for display purposes.';
COMMENT ON COLUMN public.activity_event.payload IS 'Additional event context data.';
COMMENT ON COLUMN public.activity_event.created_at IS 'Timestamp when the event occurred.';

-- attachment table
COMMENT ON TABLE public.attachment IS 'File attachments for various entities.';
COMMENT ON COLUMN public.attachment.id IS 'Unique identifier (UUID v4) for the attachment.';
COMMENT ON COLUMN public.attachment.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.attachment.project_id IS 'Reference to parent project.';
COMMENT ON COLUMN public.attachment.entity_type IS 'Type of entity this attachment is linked to.';
COMMENT ON COLUMN public.attachment.entity_id IS 'ID of the entity this attachment is linked to.';
COMMENT ON COLUMN public.attachment.artifact_id IS 'Optional reference to artifact.';
COMMENT ON COLUMN public.attachment.filename IS 'Original filename.';
COMMENT ON COLUMN public.attachment.mime_type IS 'MIME type of the file.';
COMMENT ON COLUMN public.attachment.size_bytes IS 'File size in bytes.';
COMMENT ON COLUMN public.attachment.storage_uri IS 'Storage URI for the file.';
COMMENT ON COLUMN public.attachment.created_at IS 'Timestamp when the attachment was created.';
COMMENT ON COLUMN public.attachment.created_by IS 'Reference to user who uploaded the attachment.';

-- approval_request table
COMMENT ON TABLE public.approval_request IS 'Approval requests for model versions, deployments, releases, policies.';
COMMENT ON COLUMN public.approval_request.id IS 'Unique identifier (UUID v4) for the request.';
COMMENT ON COLUMN public.approval_request.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.approval_request.project_id IS 'Reference to parent project.';
COMMENT ON COLUMN public.approval_request.entity_type IS 'Entity type: model_version, deployment, release, pipeline, policy, catalog_item.';
COMMENT ON COLUMN public.approval_request.entity_id IS 'ID of the entity requiring approval.';
COMMENT ON COLUMN public.approval_request.requested_by IS 'Reference to user who requested approval.';
COMMENT ON COLUMN public.approval_request.status IS 'Request status: pending, approved, rejected, canceled.';
COMMENT ON COLUMN public.approval_request.required_approvers IS 'Array of required approver user IDs or role IDs.';
COMMENT ON COLUMN public.approval_request.rationale IS 'Reason/justification for the request.';
COMMENT ON COLUMN public.approval_request.expires_at IS 'Timestamp when the request expires.';
COMMENT ON COLUMN public.approval_request.created_at IS 'Timestamp when the request was created.';
COMMENT ON COLUMN public.approval_request.updated_at IS 'Timestamp when the request was last modified.';

-- approval_decision table
COMMENT ON TABLE public.approval_decision IS 'Individual approval decisions by approvers.';
COMMENT ON COLUMN public.approval_decision.id IS 'Unique identifier (UUID v4) for the decision.';
COMMENT ON COLUMN public.approval_decision.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.approval_decision.approval_request_id IS 'Reference to the approval request.';
COMMENT ON COLUMN public.approval_decision.approver_user_id IS 'Reference to user who made the decision.';
COMMENT ON COLUMN public.approval_decision.decision IS 'Decision: approve or reject.';
COMMENT ON COLUMN public.approval_decision.comment IS 'Optional comment explaining the decision.';
COMMENT ON COLUMN public.approval_decision.decided_at IS 'Timestamp when the decision was made.';

-- audit_event table
COMMENT ON TABLE public.audit_event IS 'Audit trail for security, compliance, and debugging.';
COMMENT ON COLUMN public.audit_event.id IS 'Unique identifier (UUID v4) for the audit event.';
COMMENT ON COLUMN public.audit_event.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.audit_event.actor_type IS 'Actor type: user or service.';
COMMENT ON COLUMN public.audit_event.actor_id IS 'ID of the actor.';
COMMENT ON COLUMN public.audit_event.action IS 'Action: login, logout, create, update, delete, view, export, etc.';
COMMENT ON COLUMN public.audit_event.resource_type IS 'Type of resource affected.';
COMMENT ON COLUMN public.audit_event.resource_id IS 'ID of the resource affected.';
COMMENT ON COLUMN public.audit_event.resource_name IS 'Name of the resource for display.';
COMMENT ON COLUMN public.audit_event.ip IS 'Client IP address.';
COMMENT ON COLUMN public.audit_event.user_agent IS 'Client user agent string.';
COMMENT ON COLUMN public.audit_event.payload IS 'Additional context (old/new values for updates).';
COMMENT ON COLUMN public.audit_event.status IS 'Event status: success, failure.';
COMMENT ON COLUMN public.audit_event.error_message IS 'Error message if status is failure.';
COMMENT ON COLUMN public.audit_event.created_at IS 'Timestamp when the event occurred.';

-- event_outbox table
COMMENT ON TABLE public.event_outbox IS 'Transactional outbox pattern for reliable event publishing.';
COMMENT ON COLUMN public.event_outbox.id IS 'Unique identifier (UUID v4) for the outbox entry.';
COMMENT ON COLUMN public.event_outbox.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.event_outbox.event_type IS 'Event type (e.g., model.version.created, deployment.failed).';
COMMENT ON COLUMN public.event_outbox.aggregate_type IS 'Aggregate type (e.g., model, deployment, run).';
COMMENT ON COLUMN public.event_outbox.aggregate_id IS 'Aggregate entity ID.';
COMMENT ON COLUMN public.event_outbox.payload IS 'JSON event payload.';
COMMENT ON COLUMN public.event_outbox.status IS 'Delivery status: pending, sent, failed.';
COMMENT ON COLUMN public.event_outbox.attempts IS 'Number of delivery attempts.';
COMMENT ON COLUMN public.event_outbox.max_attempts IS 'Maximum number of delivery attempts.';
COMMENT ON COLUMN public.event_outbox.next_retry_at IS 'Next scheduled retry time.';
COMMENT ON COLUMN public.event_outbox.last_error IS 'Last error message if delivery failed.';
COMMENT ON COLUMN public.event_outbox.created_at IS 'Timestamp when the event was created.';
COMMENT ON COLUMN public.event_outbox.sent_at IS 'Timestamp when the event was successfully sent.';

-- ============================================================================
-- SECTION 7: MLOPS EXTENDED TABLES (011)
-- ============================================================================

-- run_param table
COMMENT ON TABLE public.run_param IS 'Run parameters: hyperparameters and configuration values.';
COMMENT ON COLUMN public.run_param.id IS 'Unique identifier (UUID v4) for the parameter.';
COMMENT ON COLUMN public.run_param.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.run_param.run_id IS 'Reference to parent run.';
COMMENT ON COLUMN public.run_param.key IS 'Parameter name/key.';
COMMENT ON COLUMN public.run_param.value IS 'Parameter value (stored as text).';
COMMENT ON COLUMN public.run_param.created_at IS 'Timestamp when the parameter was logged.';

-- metric_definition table
COMMENT ON TABLE public.metric_definition IS 'Metric definitions with goals and alert thresholds.';
COMMENT ON COLUMN public.metric_definition.id IS 'Unique identifier (UUID v4) for the metric definition.';
COMMENT ON COLUMN public.metric_definition.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.metric_definition.project_id IS 'Reference to parent project.';
COMMENT ON COLUMN public.metric_definition.key IS 'Metric key/name, unique within the project.';
COMMENT ON COLUMN public.metric_definition.display_name IS 'Human-readable display name.';
COMMENT ON COLUMN public.metric_definition.description IS 'Description of what the metric measures.';
COMMENT ON COLUMN public.metric_definition.metric_type IS 'Metric type: scalar, histogram, image, etc.';
COMMENT ON COLUMN public.metric_definition.unit IS 'Metric unit (%, ms, GB, etc.).';
COMMENT ON COLUMN public.metric_definition.goal_direction IS 'Whether to minimize or maximize this metric.';
COMMENT ON COLUMN public.metric_definition.goal_value IS 'Target goal value.';
COMMENT ON COLUMN public.metric_definition.warning_threshold IS 'Threshold for warning alerts.';
COMMENT ON COLUMN public.metric_definition.alert_threshold IS 'Threshold for critical alerts.';
COMMENT ON COLUMN public.metric_definition.tags IS 'Array of tags for categorization.';
COMMENT ON COLUMN public.metric_definition.metadata IS 'JSON metadata for custom attributes.';
COMMENT ON COLUMN public.metric_definition.created_at IS 'Timestamp when the definition was created.';
COMMENT ON COLUMN public.metric_definition.updated_at IS 'Timestamp when the definition was last modified.';

-- metric_alert table
COMMENT ON TABLE public.metric_alert IS 'Metric alerts when thresholds are breached.';
COMMENT ON COLUMN public.metric_alert.id IS 'Unique identifier (UUID v4) for the alert.';
COMMENT ON COLUMN public.metric_alert.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.metric_alert.metric_key IS 'Key of the metric that triggered the alert.';
COMMENT ON COLUMN public.metric_alert.run_id IS 'Reference to run where alert was triggered.';
COMMENT ON COLUMN public.metric_alert.alert_type IS 'Alert type: warning or critical.';
COMMENT ON COLUMN public.metric_alert.message IS 'Human-readable alert message.';
COMMENT ON COLUMN public.metric_alert.current_value IS 'Current metric value that triggered the alert.';
COMMENT ON COLUMN public.metric_alert.threshold_value IS 'Threshold value that was breached.';
COMMENT ON COLUMN public.metric_alert.acknowledged IS 'Whether the alert has been acknowledged.';
COMMENT ON COLUMN public.metric_alert.acknowledged_by IS 'Reference to user who acknowledged the alert.';
COMMENT ON COLUMN public.metric_alert.acknowledged_at IS 'Timestamp when the alert was acknowledged.';
COMMENT ON COLUMN public.metric_alert.created_at IS 'Timestamp when the alert was created.';

-- workspace table
COMMENT ON TABLE public.workspace IS 'ML Workspaces: Jupyter, VSCode, RStudio, Terminal.';
COMMENT ON COLUMN public.workspace.id IS 'Unique identifier (UUID v4) for the workspace.';
COMMENT ON COLUMN public.workspace.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.workspace.project_id IS 'Reference to parent project.';
COMMENT ON COLUMN public.workspace.user_id IS 'Reference to user who owns the workspace.';
COMMENT ON COLUMN public.workspace.name IS 'User-defined workspace name.';
COMMENT ON COLUMN public.workspace.description IS 'Optional description of the workspace purpose.';
COMMENT ON COLUMN public.workspace.workspace_type IS 'Workspace type: jupyter, vscode, rstudio, terminal, custom.';
COMMENT ON COLUMN public.workspace.status IS 'Workspace status: pending, provisioning, running, stopping, stopped, failed, terminated.';
COMMENT ON COLUMN public.workspace.size IS 'Resource size preset: small, medium, large, xlarge, custom.';
COMMENT ON COLUMN public.workspace.compute_profile_id IS 'Reference to compute profile used.';
COMMENT ON COLUMN public.workspace.cluster_id IS 'Reference to Kubernetes cluster.';
COMMENT ON COLUMN public.workspace.namespace IS 'Kubernetes namespace.';
COMMENT ON COLUMN public.workspace.image IS 'Container image for the workspace.';
COMMENT ON COLUMN public.workspace.image_version IS 'Container image version/tag.';
COMMENT ON COLUMN public.workspace.environment_id IS 'Reference to environment configuration.';
COMMENT ON COLUMN public.workspace.git_repo_url IS 'Git repository URL to clone.';
COMMENT ON COLUMN public.workspace.git_branch IS 'Git branch to checkout.';
COMMENT ON COLUMN public.workspace.auto_shutdown_minutes IS 'Minutes of inactivity before auto-shutdown.';
COMMENT ON COLUMN public.workspace.idle_timeout_minutes IS 'Minutes of idle before timeout.';
COMMENT ON COLUMN public.workspace.endpoint_url IS 'Public URL to access the workspace.';
COMMENT ON COLUMN public.workspace.internal_url IS 'Internal cluster URL.';
COMMENT ON COLUMN public.workspace.pod_name IS 'Kubernetes pod name.';
COMMENT ON COLUMN public.workspace.resources_allocated IS 'JSON allocated resources (CPU, memory, GPU).';
COMMENT ON COLUMN public.workspace.resources_used IS 'JSON current resource usage.';
COMMENT ON COLUMN public.workspace.environment_vars IS 'JSON environment variables.';
COMMENT ON COLUMN public.workspace.volumes IS 'JSON array of volume mount configurations.';
COMMENT ON COLUMN public.workspace.ports IS 'JSON array of port configurations.';
COMMENT ON COLUMN public.workspace.metadata IS 'JSON additional metadata.';
COMMENT ON COLUMN public.workspace.started_at IS 'Timestamp when workspace started.';
COMMENT ON COLUMN public.workspace.stopped_at IS 'Timestamp when workspace stopped.';
COMMENT ON COLUMN public.workspace.last_activity_at IS 'Timestamp of last user activity.';
COMMENT ON COLUMN public.workspace.created_at IS 'Timestamp when workspace was created.';
COMMENT ON COLUMN public.workspace.updated_at IS 'Timestamp when workspace was last modified.';

-- workspace_template table
COMMENT ON TABLE public.workspace_template IS 'Workspace templates for quick workspace creation.';
COMMENT ON COLUMN public.workspace_template.id IS 'Unique identifier (UUID v4) for the template.';
COMMENT ON COLUMN public.workspace_template.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.workspace_template.name IS 'Template name, unique within the tenant.';
COMMENT ON COLUMN public.workspace_template.description IS 'Description of the template purpose.';
COMMENT ON COLUMN public.workspace_template.workspace_type IS 'Workspace type: jupyter, vscode, rstudio, terminal, custom.';
COMMENT ON COLUMN public.workspace_template.image IS 'Container image for workspaces.';
COMMENT ON COLUMN public.workspace_template.image_version IS 'Default image version/tag.';
COMMENT ON COLUMN public.workspace_template.default_size IS 'Default resource size preset.';
COMMENT ON COLUMN public.workspace_template.default_compute_profile_id IS 'Default compute profile reference.';
COMMENT ON COLUMN public.workspace_template.default_environment_vars IS 'JSON default environment variables.';
COMMENT ON COLUMN public.workspace_template.default_volumes IS 'JSON default volume configurations.';
COMMENT ON COLUMN public.workspace_template.default_ports IS 'JSON default port configurations.';
COMMENT ON COLUMN public.workspace_template.is_public IS 'Whether template is available to all tenants.';
COMMENT ON COLUMN public.workspace_template.is_default IS 'Whether this is the default template for its type.';
COMMENT ON COLUMN public.workspace_template.tags IS 'Array of tags for categorization.';
COMMENT ON COLUMN public.workspace_template.metadata IS 'JSON additional metadata.';
COMMENT ON COLUMN public.workspace_template.created_at IS 'Timestamp when template was created.';
COMMENT ON COLUMN public.workspace_template.updated_at IS 'Timestamp when template was last modified.';

-- workspace_session_log table
COMMENT ON TABLE public.workspace_session_log IS 'Audit log of workspace sessions for security and usage tracking.';
COMMENT ON COLUMN public.workspace_session_log.id IS 'Unique identifier (UUID v4) for the session log entry.';
COMMENT ON COLUMN public.workspace_session_log.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.workspace_session_log.workspace_id IS 'Reference to parent workspace.';
COMMENT ON COLUMN public.workspace_session_log.user_id IS 'Reference to user who created this session.';
COMMENT ON COLUMN public.workspace_session_log.session_type IS 'Session type: interactive, api, scheduled.';
COMMENT ON COLUMN public.workspace_session_log.status IS 'Session status: active, closed, expired.';
COMMENT ON COLUMN public.workspace_session_log.token IS 'Session token (hashed).';
COMMENT ON COLUMN public.workspace_session_log.started_at IS 'Timestamp when session started.';
COMMENT ON COLUMN public.workspace_session_log.ended_at IS 'Timestamp when session ended.';
COMMENT ON COLUMN public.workspace_session_log.last_heartbeat_at IS 'Timestamp of last activity heartbeat.';
COMMENT ON COLUMN public.workspace_session_log.ip_address IS 'Client IP address.';
COMMENT ON COLUMN public.workspace_session_log.user_agent IS 'Client user agent string.';
COMMENT ON COLUMN public.workspace_session_log.metadata IS 'JSON additional session metadata.';

-- ============================================================================
-- SECTION 8: CI/CD AND GITOPS TABLES (006)
-- ============================================================================

-- gitlab_instance table
COMMENT ON TABLE public.gitlab_instance IS 'GitLab instance configurations for CI/CD integration with SaaS or self-managed GitLab.';
COMMENT ON COLUMN public.gitlab_instance.id IS 'Unique identifier (UUID v4) for the GitLab instance.';
COMMENT ON COLUMN public.gitlab_instance.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.gitlab_instance.name IS 'Unique instance name within the tenant.';
COMMENT ON COLUMN public.gitlab_instance.base_url IS 'GitLab instance URL (https://gitlab.com for SaaS).';
COMMENT ON COLUMN public.gitlab_instance.mode IS 'GitLab mode: saas (gitlab.com) or self_managed.';
COMMENT ON COLUMN public.gitlab_instance.api_version IS 'GitLab API version (default v4).';
COMMENT ON COLUMN public.gitlab_instance.auth_secret_ref IS 'Reference to secret containing API token.';
COMMENT ON COLUMN public.gitlab_instance.webhook_secret_ref IS 'Reference to secret for webhook validation.';
COMMENT ON COLUMN public.gitlab_instance.created_at IS 'Timestamp when the instance was registered.';
COMMENT ON COLUMN public.gitlab_instance.updated_at IS 'Timestamp when the instance was last modified.';

-- git_provider table
COMMENT ON TABLE public.git_provider IS 'Git provider configurations (GitHub, GitLab, Bitbucket) for repository integration.';
COMMENT ON COLUMN public.git_provider.id IS 'Unique identifier (UUID v4) for the git provider.';
COMMENT ON COLUMN public.git_provider.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.git_provider.name IS 'Unique provider name within the tenant.';
COMMENT ON COLUMN public.git_provider.type IS 'Provider type: gitlab, github, bitbucket.';
COMMENT ON COLUMN public.git_provider.base_url IS 'Provider API base URL (for self-hosted instances).';
COMMENT ON COLUMN public.git_provider.app_installation_ref IS 'JSON GitHub App installation ID or similar OAuth reference.';
COMMENT ON COLUMN public.git_provider.auth_secret_ref IS 'Reference to secret containing authentication credentials.';
COMMENT ON COLUMN public.git_provider.created_at IS 'Timestamp when the provider was registered.';
COMMENT ON COLUMN public.git_provider.updated_at IS 'Timestamp when the provider was last modified.';

-- repo_binding table
COMMENT ON TABLE public.repo_binding IS 'Repository bindings linking Git repositories to MLOps projects.';
COMMENT ON COLUMN public.repo_binding.id IS 'Unique identifier (UUID v4) for the binding.';
COMMENT ON COLUMN public.repo_binding.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.repo_binding.project_id IS 'Reference to the MLOps project.';
COMMENT ON COLUMN public.repo_binding.provider_id IS 'Reference to the git provider.';
COMMENT ON COLUMN public.repo_binding.repo_full_name IS 'Full repository name (e.g., org/repo-name).';
COMMENT ON COLUMN public.repo_binding.default_branch IS 'Default branch for CI/CD triggers (default: main).';
COMMENT ON COLUMN public.repo_binding.webhook_secret_ref IS 'Reference to secret for webhook validation.';
COMMENT ON COLUMN public.repo_binding.created_at IS 'Timestamp when the binding was created.';
COMMENT ON COLUMN public.repo_binding.updated_at IS 'Timestamp when the binding was last modified.';

-- cicd_pipeline table
COMMENT ON TABLE public.cicd_pipeline IS 'CI/CD pipeline executions from GitLab CI, GitHub Actions, or other CI systems.';
COMMENT ON COLUMN public.cicd_pipeline.id IS 'Unique identifier (UUID v4) for the pipeline execution.';
COMMENT ON COLUMN public.cicd_pipeline.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.cicd_pipeline.project_id IS 'Reference to the MLOps project.';
COMMENT ON COLUMN public.cicd_pipeline.gitlab_instance_id IS 'Reference to GitLab instance (if GitLab CI).';
COMMENT ON COLUMN public.cicd_pipeline.repo_full_name IS 'Full repository name for this pipeline.';
COMMENT ON COLUMN public.cicd_pipeline.pipeline_iid IS 'GitLab internal pipeline ID.';
COMMENT ON COLUMN public.cicd_pipeline.pipeline_id_external IS 'External pipeline ID from CI system.';
COMMENT ON COLUMN public.cicd_pipeline.source IS 'Pipeline trigger source: push, merge_request, schedule, web, api, parent_pipeline.';
COMMENT ON COLUMN public.cicd_pipeline.ref IS 'Git reference (branch/tag) that triggered the pipeline.';
COMMENT ON COLUMN public.cicd_pipeline.sha IS 'Git commit SHA (40 characters).';
COMMENT ON COLUMN public.cicd_pipeline.mr_iid IS 'Merge request IID if triggered by MR.';
COMMENT ON COLUMN public.cicd_pipeline.status IS 'Pipeline status: created, pending, running, success, failed, canceled, skipped, manual.';
COMMENT ON COLUMN public.cicd_pipeline.detailed_status IS 'Detailed status message from CI system.';
COMMENT ON COLUMN public.cicd_pipeline.started_at IS 'Timestamp when the pipeline started execution.';
COMMENT ON COLUMN public.cicd_pipeline.finished_at IS 'Timestamp when the pipeline completed.';
COMMENT ON COLUMN public.cicd_pipeline.duration_sec IS 'Pipeline duration in seconds.';
COMMENT ON COLUMN public.cicd_pipeline.queued_duration_sec IS 'Time spent in queue before execution.';
COMMENT ON COLUMN public.cicd_pipeline.user_external_id IS 'External user ID who triggered the pipeline.';
COMMENT ON COLUMN public.cicd_pipeline.web_url IS 'URL to view pipeline in CI system UI.';
COMMENT ON COLUMN public.cicd_pipeline.variables IS 'JSON object with pipeline variables.';
COMMENT ON COLUMN public.cicd_pipeline.coverage IS 'Test coverage percentage from pipeline.';
COMMENT ON COLUMN public.cicd_pipeline.created_at IS 'Timestamp when the pipeline record was created.';
COMMENT ON COLUMN public.cicd_pipeline.updated_at IS 'Timestamp when the pipeline record was last updated.';

-- cicd_stage table
COMMENT ON TABLE public.cicd_stage IS 'CI/CD pipeline stages representing workflow phases.';
COMMENT ON COLUMN public.cicd_stage.id IS 'Unique identifier (UUID v4) for the stage.';
COMMENT ON COLUMN public.cicd_stage.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.cicd_stage.pipeline_id IS 'Reference to the parent pipeline.';
COMMENT ON COLUMN public.cicd_stage.name IS 'Stage name (e.g., build, test, deploy).';
COMMENT ON COLUMN public.cicd_stage.status IS 'Stage execution status.';
COMMENT ON COLUMN public.cicd_stage.started_at IS 'Timestamp when the stage started.';
COMMENT ON COLUMN public.cicd_stage.finished_at IS 'Timestamp when the stage finished.';
COMMENT ON COLUMN public.cicd_stage.duration_sec IS 'Stage duration in seconds.';

-- cicd_job table
COMMENT ON TABLE public.cicd_job IS 'CI/CD pipeline jobs with detailed execution information.';
COMMENT ON COLUMN public.cicd_job.id IS 'Unique identifier (UUID v4) for the job.';
COMMENT ON COLUMN public.cicd_job.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.cicd_job.pipeline_id IS 'Reference to the parent pipeline.';
COMMENT ON COLUMN public.cicd_job.stage_id IS 'Reference to the parent stage.';
COMMENT ON COLUMN public.cicd_job.name IS 'Job name from CI configuration.';
COMMENT ON COLUMN public.cicd_job.job_id_external IS 'External job ID from CI system.';
COMMENT ON COLUMN public.cicd_job.status IS 'Job status: created, pending, running, success, failed, canceled, skipped, manual.';
COMMENT ON COLUMN public.cicd_job.allow_failure IS 'Whether job failure should not fail the pipeline.';
COMMENT ON COLUMN public.cicd_job.when_run IS 'Job trigger condition: on_success, on_failure, always, manual.';
COMMENT ON COLUMN public.cicd_job.started_at IS 'Timestamp when the job started.';
COMMENT ON COLUMN public.cicd_job.finished_at IS 'Timestamp when the job finished.';
COMMENT ON COLUMN public.cicd_job.duration_sec IS 'Job duration in seconds.';
COMMENT ON COLUMN public.cicd_job.runner_description IS 'Description of the runner that executed the job.';
COMMENT ON COLUMN public.cicd_job.runner_tags IS 'JSON array of runner tags used.';
COMMENT ON COLUMN public.cicd_job.image IS 'Docker image used for the job.';
COMMENT ON COLUMN public.cicd_job.script_summary IS 'Summary of job script or commands.';
COMMENT ON COLUMN public.cicd_job.artifacts_expire_at IS 'Timestamp when job artifacts expire.';
COMMENT ON COLUMN public.cicd_job.log_url IS 'URL to view job logs.';
COMMENT ON COLUMN public.cicd_job.failure_reason IS 'Reason for job failure if failed.';
COMMENT ON COLUMN public.cicd_job.exit_code IS 'Job exit code.';
COMMENT ON COLUMN public.cicd_job.retry_count IS 'Number of retry attempts.';
COMMENT ON COLUMN public.cicd_job.created_at IS 'Timestamp when the job record was created.';

-- cicd_job_artifact table
COMMENT ON TABLE public.cicd_job_artifact IS 'CI/CD job artifacts: test reports, coverage, SBOMs, container scans.';
COMMENT ON COLUMN public.cicd_job_artifact.id IS 'Unique identifier (UUID v4) for the artifact.';
COMMENT ON COLUMN public.cicd_job_artifact.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.cicd_job_artifact.job_id IS 'Reference to the parent job.';
COMMENT ON COLUMN public.cicd_job_artifact.name IS 'Artifact name or path.';
COMMENT ON COLUMN public.cicd_job_artifact.type IS 'Artifact type: archive, dotenv, junit, coverage, sbom, container_scan, terraform_plan, helm_chart.';
COMMENT ON COLUMN public.cicd_job_artifact.uri IS 'Storage URI for the artifact.';
COMMENT ON COLUMN public.cicd_job_artifact.size_bytes IS 'Artifact size in bytes.';
COMMENT ON COLUMN public.cicd_job_artifact.checksum IS 'SHA-256 checksum for integrity.';
COMMENT ON COLUMN public.cicd_job_artifact.created_at IS 'Timestamp when the artifact was created.';

-- cicd_environment table
COMMENT ON TABLE public.cicd_environment IS 'CI/CD deployment environments (development, staging, production).';
COMMENT ON COLUMN public.cicd_environment.id IS 'Unique identifier (UUID v4) for the environment.';
COMMENT ON COLUMN public.cicd_environment.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.cicd_environment.project_id IS 'Reference to the parent project.';
COMMENT ON COLUMN public.cicd_environment.name IS 'Environment name (e.g., production, staging).';
COMMENT ON COLUMN public.cicd_environment.slug IS 'URL-friendly environment identifier.';
COMMENT ON COLUMN public.cicd_environment.tier IS 'Environment tier: development, staging, production.';
COMMENT ON COLUMN public.cicd_environment.external_url IS 'External URL for the deployed environment.';
COMMENT ON COLUMN public.cicd_environment.created_at IS 'Timestamp when the environment was created.';
COMMENT ON COLUMN public.cicd_environment.updated_at IS 'Timestamp when the environment was last modified.';

-- cicd_deployment table
COMMENT ON TABLE public.cicd_deployment IS 'CI/CD deployments to environments from pipelines.';
COMMENT ON COLUMN public.cicd_deployment.id IS 'Unique identifier (UUID v4) for the deployment.';
COMMENT ON COLUMN public.cicd_deployment.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.cicd_deployment.pipeline_id IS 'Reference to the source pipeline.';
COMMENT ON COLUMN public.cicd_deployment.environment_id IS 'Reference to the target environment.';
COMMENT ON COLUMN public.cicd_deployment.status IS 'Deployment status.';
COMMENT ON COLUMN public.cicd_deployment.deployed_at IS 'Timestamp when deployment completed.';
COMMENT ON COLUMN public.cicd_deployment.deployable_ref IS 'JSON reference to deployable resource.';
COMMENT ON COLUMN public.cicd_deployment.release_tag IS 'Release tag for this deployment.';
COMMENT ON COLUMN public.cicd_deployment.change_log IS 'Changelog or release notes.';
COMMENT ON COLUMN public.cicd_deployment.created_at IS 'Timestamp when the deployment record was created.';

-- cicd_quality_gate table
COMMENT ON TABLE public.cicd_quality_gate IS 'CI/CD quality gates for pipeline validation (tests, security, coverage).';
COMMENT ON COLUMN public.cicd_quality_gate.id IS 'Unique identifier (UUID v4) for the quality gate.';
COMMENT ON COLUMN public.cicd_quality_gate.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.cicd_quality_gate.pipeline_id IS 'Reference to the parent pipeline.';
COMMENT ON COLUMN public.cicd_quality_gate.gate_type IS 'Gate type: tests, security, lint, coverage, sast, dast, license, iac_scan.';
COMMENT ON COLUMN public.cicd_quality_gate.status IS 'Gate status: pass, warn, fail.';
COMMENT ON COLUMN public.cicd_quality_gate.summary IS 'Summary of quality gate results.';
COMMENT ON COLUMN public.cicd_quality_gate.metrics IS 'JSON metrics: coverage %, test count, vulnerabilities, etc.';
COMMENT ON COLUMN public.cicd_quality_gate.report_artifact_id IS 'Reference to artifact containing detailed report.';
COMMENT ON COLUMN public.cicd_quality_gate.created_at IS 'Timestamp when the gate was evaluated.';

-- cicd_pipeline_link table
COMMENT ON TABLE public.cicd_pipeline_link IS 'Links pipelines to other entities (builds, deployments, releases).';
COMMENT ON COLUMN public.cicd_pipeline_link.id IS 'Unique identifier (UUID v4) for the link.';
COMMENT ON COLUMN public.cicd_pipeline_link.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.cicd_pipeline_link.pipeline_id IS 'Reference to the pipeline.';
COMMENT ON COLUMN public.cicd_pipeline_link.entity_type IS 'Entity type: environment_build, model_version, release, argocd_application, infra_change.';
COMMENT ON COLUMN public.cicd_pipeline_link.entity_id IS 'ID of the linked entity.';
COMMENT ON COLUMN public.cicd_pipeline_link.created_at IS 'Timestamp when the link was created.';

-- argocd_instance table
COMMENT ON TABLE public.argocd_instance IS 'ArgoCD instance configurations for GitOps deployments.';
COMMENT ON COLUMN public.argocd_instance.id IS 'Unique identifier (UUID v4) for the ArgoCD instance.';
COMMENT ON COLUMN public.argocd_instance.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.argocd_instance.name IS 'Unique instance name within the tenant.';
COMMENT ON COLUMN public.argocd_instance.base_url IS 'ArgoCD server URL.';
COMMENT ON COLUMN public.argocd_instance.cluster_id IS 'Reference to Kubernetes cluster running ArgoCD.';
COMMENT ON COLUMN public.argocd_instance.auth_secret_ref IS 'Reference to secret containing ArgoCD credentials.';
COMMENT ON COLUMN public.argocd_instance.created_at IS 'Timestamp when the instance was registered.';
COMMENT ON COLUMN public.argocd_instance.updated_at IS 'Timestamp when the instance was last modified.';

-- argocd_application table
COMMENT ON TABLE public.argocd_application IS 'ArgoCD applications for GitOps deployments with sync status.';
COMMENT ON COLUMN public.argocd_application.id IS 'Unique identifier (UUID v4) for the application.';
COMMENT ON COLUMN public.argocd_application.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.argocd_application.project_id IS 'Reference to the MLOps project.';
COMMENT ON COLUMN public.argocd_application.argocd_instance_id IS 'Reference to the ArgoCD instance.';
COMMENT ON COLUMN public.argocd_application.name IS 'ArgoCD application name.';
COMMENT ON COLUMN public.argocd_application.app_project IS 'ArgoCD project name (default: default).';
COMMENT ON COLUMN public.argocd_application.source_repo IS 'Git repository URL for application manifests.';
COMMENT ON COLUMN public.argocd_application.source_path IS 'Path within repository to manifests.';
COMMENT ON COLUMN public.argocd_application.source_target_revision IS 'Git revision (branch, tag, commit) to sync.';
COMMENT ON COLUMN public.argocd_application.helm_values IS 'JSON Helm values overrides.';
COMMENT ON COLUMN public.argocd_application.kustomize IS 'JSON Kustomize configuration.';
COMMENT ON COLUMN public.argocd_application.destination_cluster IS 'Target Kubernetes cluster URL.';
COMMENT ON COLUMN public.argocd_application.destination_namespace IS 'Target Kubernetes namespace.';
COMMENT ON COLUMN public.argocd_application.sync_policy IS 'JSON sync policy (automated, selfHeal, prune).';
COMMENT ON COLUMN public.argocd_application.status IS 'Sync status: unknown, syncing, synced, outofsync, error.';
COMMENT ON COLUMN public.argocd_application.health IS 'Health status: healthy, progressing, degraded, missing, suspended.';
COMMENT ON COLUMN public.argocd_application.conditions IS 'JSON array of ArgoCD conditions.';
COMMENT ON COLUMN public.argocd_application.last_sync_at IS 'Timestamp of last successful sync.';
COMMENT ON COLUMN public.argocd_application.created_at IS 'Timestamp when the application was created.';
COMMENT ON COLUMN public.argocd_application.updated_at IS 'Timestamp when the application was last modified.';

-- argocd_sync_history table
COMMENT ON TABLE public.argocd_sync_history IS 'ArgoCD application sync history for audit trail.';
COMMENT ON COLUMN public.argocd_sync_history.id IS 'Unique identifier (UUID v4) for the sync record.';
COMMENT ON COLUMN public.argocd_sync_history.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.argocd_sync_history.application_id IS 'Reference to the ArgoCD application.';
COMMENT ON COLUMN public.argocd_sync_history.revision IS 'Git revision that was synced.';
COMMENT ON COLUMN public.argocd_sync_history.initiated_by IS 'User or system that initiated the sync.';
COMMENT ON COLUMN public.argocd_sync_history.operation_phase IS 'Operation phase (Sync, Rollback).';
COMMENT ON COLUMN public.argocd_sync_history.sync_status IS 'Sync result status.';
COMMENT ON COLUMN public.argocd_sync_history.health_status IS 'Health status after sync.';
COMMENT ON COLUMN public.argocd_sync_history.started_at IS 'Timestamp when sync started.';
COMMENT ON COLUMN public.argocd_sync_history.finished_at IS 'Timestamp when sync finished.';
COMMENT ON COLUMN public.argocd_sync_history.message IS 'Sync result message or error.';
COMMENT ON COLUMN public.argocd_sync_history.resources IS 'JSON array of synced resources.';

-- argocd_resource_status table
COMMENT ON TABLE public.argocd_resource_status IS 'ArgoCD managed Kubernetes resource status.';
COMMENT ON COLUMN public.argocd_resource_status.id IS 'Unique identifier (UUID v4) for the resource status.';
COMMENT ON COLUMN public.argocd_resource_status.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.argocd_resource_status.application_id IS 'Reference to the ArgoCD application.';
COMMENT ON COLUMN public.argocd_resource_status.group_name IS 'Kubernetes API group.';
COMMENT ON COLUMN public.argocd_resource_status.kind IS 'Kubernetes resource kind (Deployment, Service, etc.).';
COMMENT ON COLUMN public.argocd_resource_status.namespace IS 'Kubernetes namespace.';
COMMENT ON COLUMN public.argocd_resource_status.name IS 'Resource name.';
COMMENT ON COLUMN public.argocd_resource_status.sync_status IS 'Resource sync status.';
COMMENT ON COLUMN public.argocd_resource_status.health_status IS 'Resource health status.';
COMMENT ON COLUMN public.argocd_resource_status.hook IS 'Whether this is a sync hook resource.';
COMMENT ON COLUMN public.argocd_resource_status.requires_pruning IS 'Whether resource should be pruned.';
COMMENT ON COLUMN public.argocd_resource_status.message IS 'Status message or error.';
COMMENT ON COLUMN public.argocd_resource_status.last_seen_at IS 'Timestamp when resource was last observed.';

-- argocd_event table
COMMENT ON TABLE public.argocd_event IS 'ArgoCD application events for monitoring and alerting.';
COMMENT ON COLUMN public.argocd_event.id IS 'Unique identifier (UUID v4) for the event.';
COMMENT ON COLUMN public.argocd_event.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.argocd_event.application_id IS 'Reference to the ArgoCD application.';
COMMENT ON COLUMN public.argocd_event.type IS 'Event type (Normal, Warning).';
COMMENT ON COLUMN public.argocd_event.reason IS 'Event reason from ArgoCD.';
COMMENT ON COLUMN public.argocd_event.message IS 'Event message details.';
COMMENT ON COLUMN public.argocd_event.involved_object IS 'JSON reference to involved Kubernetes object.';
COMMENT ON COLUMN public.argocd_event.occurred_at IS 'Timestamp when the event occurred.';

-- argocd_drift_finding table
COMMENT ON TABLE public.argocd_drift_finding IS 'Configuration drift findings from ArgoCD for compliance tracking.';
COMMENT ON COLUMN public.argocd_drift_finding.id IS 'Unique identifier (UUID v4) for the drift finding.';
COMMENT ON COLUMN public.argocd_drift_finding.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.argocd_drift_finding.application_id IS 'Reference to the ArgoCD application.';
COMMENT ON COLUMN public.argocd_drift_finding.severity IS 'Drift severity: low, medium, high, critical.';
COMMENT ON COLUMN public.argocd_drift_finding.resource_key IS 'Resource identifier (group/kind/namespace/name).';
COMMENT ON COLUMN public.argocd_drift_finding.diff_summary IS 'Summary of configuration differences.';
COMMENT ON COLUMN public.argocd_drift_finding.diff_uri IS 'URI to detailed diff view.';
COMMENT ON COLUMN public.argocd_drift_finding.detected_at IS 'Timestamp when drift was detected.';
COMMENT ON COLUMN public.argocd_drift_finding.status IS 'Drift status: open, acknowledged, resolved.';
COMMENT ON COLUMN public.argocd_drift_finding.resolved_at IS 'Timestamp when drift was resolved.';
COMMENT ON COLUMN public.argocd_drift_finding.resolved_by IS 'Reference to user who resolved the drift.';

-- release table
COMMENT ON TABLE public.release IS 'Software releases with semantic versioning and changelog.';
COMMENT ON COLUMN public.release.id IS 'Unique identifier (UUID v4) for the release.';
COMMENT ON COLUMN public.release.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.release.project_id IS 'Reference to the parent project.';
COMMENT ON COLUMN public.release.name IS 'Release name or title.';
COMMENT ON COLUMN public.release.version IS 'Semantic version (e.g., 1.2.3).';
COMMENT ON COLUMN public.release.git_ref IS 'Git reference (tag, branch) for this release.';
COMMENT ON COLUMN public.release.commit_sha IS 'Git commit SHA for this release.';
COMMENT ON COLUMN public.release.changelog IS 'Release changelog or notes.';
COMMENT ON COLUMN public.release.created_at IS 'Timestamp when the release was created.';
COMMENT ON COLUMN public.release.created_by IS 'Reference to user who created the release.';

-- release_link table
COMMENT ON TABLE public.release_link IS 'Links releases to CI/CD pipelines, ArgoCD apps, and deployments.';
COMMENT ON COLUMN public.release_link.id IS 'Unique identifier (UUID v4) for the link.';
COMMENT ON COLUMN public.release_link.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.release_link.release_id IS 'Reference to the release.';
COMMENT ON COLUMN public.release_link.cicd_pipeline_id IS 'Reference to CI/CD pipeline that built this release.';
COMMENT ON COLUMN public.release_link.argocd_application_id IS 'Reference to ArgoCD app deploying this release.';
COMMENT ON COLUMN public.release_link.model_deployment_id IS 'Reference to model deployment using this release.';
COMMENT ON COLUMN public.release_link.created_at IS 'Timestamp when the link was created.';

-- ============================================================================
-- SECTION 9: ADVANCED FEATURES TABLES (008)
-- ============================================================================

-- pipeline_definition table
COMMENT ON TABLE public.pipeline_definition IS 'DAG pipeline definitions for ML workflows with versioning.';
COMMENT ON COLUMN public.pipeline_definition.id IS 'Unique identifier (UUID v4) for the pipeline definition.';
COMMENT ON COLUMN public.pipeline_definition.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.pipeline_definition.project_id IS 'Reference to the parent project.';
COMMENT ON COLUMN public.pipeline_definition.name IS 'Pipeline name, unique within project.';
COMMENT ON COLUMN public.pipeline_definition.description IS 'Description of pipeline purpose and workflow.';
COMMENT ON COLUMN public.pipeline_definition.version IS 'Pipeline version number.';
COMMENT ON COLUMN public.pipeline_definition.spec IS 'JSON pipeline specification (DAG structure, parameters).';
COMMENT ON COLUMN public.pipeline_definition.is_active IS 'Whether this pipeline version is active.';
COMMENT ON COLUMN public.pipeline_definition.created_at IS 'Timestamp when the definition was created.';
COMMENT ON COLUMN public.pipeline_definition.updated_at IS 'Timestamp when the definition was last modified.';
COMMENT ON COLUMN public.pipeline_definition.created_by IS 'Reference to user who created the definition.';
COMMENT ON COLUMN public.pipeline_definition.updated_by IS 'Reference to user who last modified the definition.';

-- pipeline_node table
COMMENT ON TABLE public.pipeline_node IS 'Nodes in pipeline DAGs representing workflow steps.';
COMMENT ON COLUMN public.pipeline_node.id IS 'Unique identifier (UUID v4) for the node.';
COMMENT ON COLUMN public.pipeline_node.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.pipeline_node.pipeline_definition_id IS 'Reference to the parent pipeline definition.';
COMMENT ON COLUMN public.pipeline_node.node_key IS 'Unique node key within the pipeline.';
COMMENT ON COLUMN public.pipeline_node.name IS 'Human-readable node name.';
COMMENT ON COLUMN public.pipeline_node.node_type IS 'Node type: ingestion, preprocess, train, evaluate, postprocess, deploy, notify.';
COMMENT ON COLUMN public.pipeline_node.run_template IS 'JSON run template for executing this node.';
COMMENT ON COLUMN public.pipeline_node.created_at IS 'Timestamp when the node was created.';

-- pipeline_edge table
COMMENT ON TABLE public.pipeline_edge IS 'Edges connecting pipeline nodes with optional conditions.';
COMMENT ON COLUMN public.pipeline_edge.id IS 'Unique identifier (UUID v4) for the edge.';
COMMENT ON COLUMN public.pipeline_edge.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.pipeline_edge.pipeline_definition_id IS 'Reference to the parent pipeline definition.';
COMMENT ON COLUMN public.pipeline_edge.from_node_id IS 'Reference to source node.';
COMMENT ON COLUMN public.pipeline_edge.to_node_id IS 'Reference to target node.';
COMMENT ON COLUMN public.pipeline_edge.condition_expr IS 'Optional condition expression for edge traversal.';

-- pipeline_run table
COMMENT ON TABLE public.pipeline_run IS 'Pipeline execution instances with status tracking.';
COMMENT ON COLUMN public.pipeline_run.id IS 'Unique identifier (UUID v4) for the pipeline run.';
COMMENT ON COLUMN public.pipeline_run.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.pipeline_run.project_id IS 'Reference to the parent project.';
COMMENT ON COLUMN public.pipeline_run.pipeline_definition_id IS 'Reference to the pipeline definition.';
COMMENT ON COLUMN public.pipeline_run.trigger IS 'Trigger source: manual, schedule, api, cicd.';
COMMENT ON COLUMN public.pipeline_run.status IS 'Run status: pending, running, succeeded, failed, canceled.';
COMMENT ON COLUMN public.pipeline_run.status_message IS 'Status message or error details.';
COMMENT ON COLUMN public.pipeline_run.params IS 'JSON parameters for this run.';
COMMENT ON COLUMN public.pipeline_run.started_at IS 'Timestamp when execution started.';
COMMENT ON COLUMN public.pipeline_run.ended_at IS 'Timestamp when execution completed.';
COMMENT ON COLUMN public.pipeline_run.created_at IS 'Timestamp when the run was created.';
COMMENT ON COLUMN public.pipeline_run.created_by IS 'Reference to user who triggered the run.';

-- pipeline_run_node table
COMMENT ON TABLE public.pipeline_run_node IS 'Individual node executions within pipeline runs.';
COMMENT ON COLUMN public.pipeline_run_node.id IS 'Unique identifier (UUID v4) for the node execution.';
COMMENT ON COLUMN public.pipeline_run_node.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.pipeline_run_node.pipeline_run_id IS 'Reference to the parent pipeline run.';
COMMENT ON COLUMN public.pipeline_run_node.node_id IS 'Reference to the pipeline node definition.';
COMMENT ON COLUMN public.pipeline_run_node.status IS 'Node execution status: pending, running, succeeded, failed, canceled.';
COMMENT ON COLUMN public.pipeline_run_node.run_id IS 'Reference to ML run created by this node.';
COMMENT ON COLUMN public.pipeline_run_node.started_at IS 'Timestamp when node execution started.';
COMMENT ON COLUMN public.pipeline_run_node.ended_at IS 'Timestamp when node execution completed.';
COMMENT ON COLUMN public.pipeline_run_node.attempts IS 'Number of execution attempts.';
COMMENT ON COLUMN public.pipeline_run_node.error_message IS 'Error message if failed.';

-- pipeline_schedule table
COMMENT ON TABLE public.pipeline_schedule IS 'Scheduled pipeline executions with cron expressions.';
COMMENT ON COLUMN public.pipeline_schedule.id IS 'Unique identifier (UUID v4) for the schedule.';
COMMENT ON COLUMN public.pipeline_schedule.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.pipeline_schedule.project_id IS 'Reference to the parent project.';
COMMENT ON COLUMN public.pipeline_schedule.pipeline_definition_id IS 'Reference to the pipeline definition.';
COMMENT ON COLUMN public.pipeline_schedule.name IS 'Schedule name, unique within project.';
COMMENT ON COLUMN public.pipeline_schedule.cron IS 'Cron expression for schedule (e.g., 0 0 * * *).';
COMMENT ON COLUMN public.pipeline_schedule.timezone IS 'Timezone for cron evaluation (IANA format).';
COMMENT ON COLUMN public.pipeline_schedule.enabled IS 'Whether the schedule is active.';
COMMENT ON COLUMN public.pipeline_schedule.default_params IS 'JSON default parameters for scheduled runs.';
COMMENT ON COLUMN public.pipeline_schedule.created_at IS 'Timestamp when the schedule was created.';
COMMENT ON COLUMN public.pipeline_schedule.updated_at IS 'Timestamp when the schedule was last modified.';

-- policy_bundle table
COMMENT ON TABLE public.policy_bundle IS 'OPA/Rego policy bundles for enforcement and compliance.';
COMMENT ON COLUMN public.policy_bundle.id IS 'Unique identifier (UUID v4) for the policy bundle.';
COMMENT ON COLUMN public.policy_bundle.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.policy_bundle.name IS 'Bundle name, unique within tenant.';
COMMENT ON COLUMN public.policy_bundle.version IS 'Bundle version.';
COMMENT ON COLUMN public.policy_bundle.source_repo IS 'Git repository URL for policy source.';
COMMENT ON COLUMN public.policy_bundle.source_ref IS 'Git reference for policy version.';
COMMENT ON COLUMN public.policy_bundle.bundle_uri IS 'URI to compiled policy bundle.';
COMMENT ON COLUMN public.policy_bundle.checksum IS 'SHA-256 checksum for integrity.';
COMMENT ON COLUMN public.policy_bundle.status IS 'Bundle status: active, deprecated.';
COMMENT ON COLUMN public.policy_bundle.created_at IS 'Timestamp when the bundle was created.';
COMMENT ON COLUMN public.policy_bundle.created_by IS 'Reference to user who created the bundle.';

-- policy_assignment table
COMMENT ON TABLE public.policy_assignment IS 'Policy assignments to scopes with enforcement mode.';
COMMENT ON COLUMN public.policy_assignment.id IS 'Unique identifier (UUID v4) for the assignment.';
COMMENT ON COLUMN public.policy_assignment.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.policy_assignment.bundle_id IS 'Reference to the policy bundle.';
COMMENT ON COLUMN public.policy_assignment.scope_type IS 'Scope type: tenant, org, project.';
COMMENT ON COLUMN public.policy_assignment.scope_id IS 'ID of scope entity (null for tenant scope).';
COMMENT ON COLUMN public.policy_assignment.enforcement_mode IS 'Enforcement mode: audit (log only), enforce (block).';
COMMENT ON COLUMN public.policy_assignment.created_at IS 'Timestamp when the assignment was created.';
COMMENT ON COLUMN public.policy_assignment.created_by IS 'Reference to user who created the assignment.';

-- policy_decision_log table
COMMENT ON TABLE public.policy_decision_log IS 'Policy evaluation decision logs for audit and debugging.';
COMMENT ON COLUMN public.policy_decision_log.id IS 'Unique identifier (UUID v4) for the decision log.';
COMMENT ON COLUMN public.policy_decision_log.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.policy_decision_log.bundle_id IS 'Reference to the policy bundle.';
COMMENT ON COLUMN public.policy_decision_log.decision_point IS 'Decision point in workflow (pre-run, pre-deploy, etc.).';
COMMENT ON COLUMN public.policy_decision_log.input_hash IS 'SHA-256 hash of evaluation input.';
COMMENT ON COLUMN public.policy_decision_log.result IS 'JSON policy evaluation result.';
COMMENT ON COLUMN public.policy_decision_log.allow IS 'Whether the action was allowed.';
COMMENT ON COLUMN public.policy_decision_log.reason IS 'Human-readable reason for decision.';
COMMENT ON COLUMN public.policy_decision_log.entity_type IS 'Type of entity being evaluated.';
COMMENT ON COLUMN public.policy_decision_log.entity_id IS 'ID of entity being evaluated.';
COMMENT ON COLUMN public.policy_decision_log.evaluated_at IS 'Timestamp when evaluation occurred.';

-- catalog_item table
COMMENT ON TABLE public.catalog_item IS 'Reusable catalog items: templates, Helm charts, Kustomize, Terraform modules.';
COMMENT ON COLUMN public.catalog_item.id IS 'Unique identifier (UUID v4) for the catalog item.';
COMMENT ON COLUMN public.catalog_item.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.catalog_item.project_id IS 'Optional project scope (null for tenant-wide).';
COMMENT ON COLUMN public.catalog_item.kind IS 'Item kind: template, helm_chart, kustomize, terraform, workflow, prompt.';
COMMENT ON COLUMN public.catalog_item.name IS 'Item name.';
COMMENT ON COLUMN public.catalog_item.description IS 'Description of the catalog item.';
COMMENT ON COLUMN public.catalog_item.version IS 'Item version.';
COMMENT ON COLUMN public.catalog_item.tags IS 'JSON array of tags for categorization.';
COMMENT ON COLUMN public.catalog_item.spec IS 'JSON specification for the item.';
COMMENT ON COLUMN public.catalog_item.status IS 'Item status: draft, active, deprecated, archived.';
COMMENT ON COLUMN public.catalog_item.created_at IS 'Timestamp when the item was created.';
COMMENT ON COLUMN public.catalog_item.updated_at IS 'Timestamp when the item was last modified.';
COMMENT ON COLUMN public.catalog_item.created_by IS 'Reference to user who created the item.';
COMMENT ON COLUMN public.catalog_item.updated_by IS 'Reference to user who last modified the item.';

-- catalog_item_dependency table
COMMENT ON TABLE public.catalog_item_dependency IS 'Dependencies between catalog items.';
COMMENT ON COLUMN public.catalog_item_dependency.id IS 'Unique identifier (UUID v4) for the dependency.';
COMMENT ON COLUMN public.catalog_item_dependency.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.catalog_item_dependency.item_id IS 'Reference to the dependent item.';
COMMENT ON COLUMN public.catalog_item_dependency.depends_on_item_id IS 'Reference to the required item.';
COMMENT ON COLUMN public.catalog_item_dependency.relation IS 'Dependency relation: requires, optional, conflicts.';

-- template_instance table
COMMENT ON TABLE public.template_instance IS 'Instantiated templates applied to projects.';
COMMENT ON COLUMN public.template_instance.id IS 'Unique identifier (UUID v4) for the instance.';
COMMENT ON COLUMN public.template_instance.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.template_instance.project_id IS 'Reference to the target project.';
COMMENT ON COLUMN public.template_instance.catalog_item_id IS 'Reference to the source catalog item.';
COMMENT ON COLUMN public.template_instance.name IS 'Instance name.';
COMMENT ON COLUMN public.template_instance.params IS 'JSON parameters used for instantiation.';
COMMENT ON COLUMN public.template_instance.status IS 'Instance status: created, applied, failed, deleted.';
COMMENT ON COLUMN public.template_instance.created_at IS 'Timestamp when the instance was created.';
COMMENT ON COLUMN public.template_instance.updated_at IS 'Timestamp when the instance was last modified.';
COMMENT ON COLUMN public.template_instance.created_by IS 'Reference to user who created the instance.';
COMMENT ON COLUMN public.template_instance.updated_by IS 'Reference to user who last modified the instance.';

-- managed_resource table
COMMENT ON TABLE public.managed_resource IS 'Managed cloud/K8s resources inventory with drift detection.';
COMMENT ON COLUMN public.managed_resource.id IS 'Unique identifier (UUID v4) for the resource.';
COMMENT ON COLUMN public.managed_resource.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.managed_resource.project_id IS 'Reference to the parent project.';
COMMENT ON COLUMN public.managed_resource.provider IS 'Cloud provider: aws, gcp, azure, k8s, terraform.';
COMMENT ON COLUMN public.managed_resource.resource_type IS 'Resource type (e.g., aws_s3_bucket, kubernetes_deployment).';
COMMENT ON COLUMN public.managed_resource.resource_name IS 'Resource name.';
COMMENT ON COLUMN public.managed_resource.resource_id_external IS 'External resource ID from provider.';
COMMENT ON COLUMN public.managed_resource.region IS 'Cloud region or datacenter.';
COMMENT ON COLUMN public.managed_resource.environment IS 'Environment (dev, staging, prod).';
COMMENT ON COLUMN public.managed_resource.desired_state IS 'JSON desired state configuration.';
COMMENT ON COLUMN public.managed_resource.observed_state IS 'JSON observed state from provider.';
COMMENT ON COLUMN public.managed_resource.status IS 'Resource status: desired, synced, drifted, failed.';
COMMENT ON COLUMN public.managed_resource.last_reconciled_at IS 'Timestamp of last reconciliation.';
COMMENT ON COLUMN public.managed_resource.created_at IS 'Timestamp when the resource was created.';
COMMENT ON COLUMN public.managed_resource.updated_at IS 'Timestamp when the resource was last modified.';
COMMENT ON COLUMN public.managed_resource.created_by IS 'Reference to user who created the resource.';
COMMENT ON COLUMN public.managed_resource.updated_by IS 'Reference to user who last modified the resource.';

-- resource_relation table
COMMENT ON TABLE public.resource_relation IS 'Relationships between managed resources for dependency tracking.';
COMMENT ON COLUMN public.resource_relation.id IS 'Unique identifier (UUID v4) for the relation.';
COMMENT ON COLUMN public.resource_relation.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.resource_relation.from_resource_id IS 'Reference to source resource.';
COMMENT ON COLUMN public.resource_relation.to_resource_id IS 'Reference to target resource.';
COMMENT ON COLUMN public.resource_relation.relation IS 'Relation type: depends_on, uses, owns, contains.';

-- drift_event table
COMMENT ON TABLE public.drift_event IS 'Configuration drift events for managed resources.';
COMMENT ON COLUMN public.drift_event.id IS 'Unique identifier (UUID v4) for the drift event.';
COMMENT ON COLUMN public.drift_event.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.drift_event.resource_id IS 'Reference to the drifted resource.';
COMMENT ON COLUMN public.drift_event.severity IS 'Drift severity: low, medium, high, critical.';
COMMENT ON COLUMN public.drift_event.summary IS 'Summary of configuration drift.';
COMMENT ON COLUMN public.drift_event.diff_uri IS 'URI to detailed diff view.';
COMMENT ON COLUMN public.drift_event.detected_at IS 'Timestamp when drift was detected.';
COMMENT ON COLUMN public.drift_event.status IS 'Drift status: open, acknowledged, resolved.';
COMMENT ON COLUMN public.drift_event.acknowledged_at IS 'Timestamp when drift was acknowledged.';
COMMENT ON COLUMN public.drift_event.acknowledged_by IS 'Reference to user who acknowledged.';
COMMENT ON COLUMN public.drift_event.resolved_at IS 'Timestamp when drift was resolved.';
COMMENT ON COLUMN public.drift_event.resolved_by IS 'Reference to user who resolved.';

-- iac_workspace table
COMMENT ON TABLE public.iac_workspace IS 'Terraform/IaC workspaces for infrastructure management.';
COMMENT ON COLUMN public.iac_workspace.id IS 'Unique identifier (UUID v4) for the workspace.';
COMMENT ON COLUMN public.iac_workspace.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.iac_workspace.project_id IS 'Reference to the parent project.';
COMMENT ON COLUMN public.iac_workspace.name IS 'Workspace name, unique within project.';
COMMENT ON COLUMN public.iac_workspace.backend_type IS 'State backend: local, s3, gcs, azurerm, pg, tfc.';
COMMENT ON COLUMN public.iac_workspace.backend_config IS 'JSON backend configuration.';
COMMENT ON COLUMN public.iac_workspace.created_at IS 'Timestamp when the workspace was created.';
COMMENT ON COLUMN public.iac_workspace.updated_at IS 'Timestamp when the workspace was last modified.';

-- iac_run table
COMMENT ON TABLE public.iac_run IS 'Terraform/IaC execution runs (plan, apply, destroy).';
COMMENT ON COLUMN public.iac_run.id IS 'Unique identifier (UUID v4) for the run.';
COMMENT ON COLUMN public.iac_run.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.iac_run.project_id IS 'Reference to the parent project.';
COMMENT ON COLUMN public.iac_run.workspace_id IS 'Reference to the IaC workspace.';
COMMENT ON COLUMN public.iac_run.trigger IS 'Run trigger (manual, api, cicd).';
COMMENT ON COLUMN public.iac_run.action IS 'IaC action: plan, apply, destroy.';
COMMENT ON COLUMN public.iac_run.status IS 'Run status: queued, planning, applying, succeeded, failed, canceled.';
COMMENT ON COLUMN public.iac_run.plan_artifact_id IS 'Reference to plan artifact.';
COMMENT ON COLUMN public.iac_run.state_uri IS 'URI to state file.';
COMMENT ON COLUMN public.iac_run.lock_id IS 'State lock ID.';
COMMENT ON COLUMN public.iac_run.started_at IS 'Timestamp when run started.';
COMMENT ON COLUMN public.iac_run.ended_at IS 'Timestamp when run completed.';
COMMENT ON COLUMN public.iac_run.error_message IS 'Error message if failed.';
COMMENT ON COLUMN public.iac_run.created_at IS 'Timestamp when the run was created.';
COMMENT ON COLUMN public.iac_run.created_by IS 'Reference to user who triggered the run.';

-- iac_change_summary table
COMMENT ON TABLE public.iac_change_summary IS 'Terraform plan change summaries showing resource counts.';
COMMENT ON COLUMN public.iac_change_summary.id IS 'Unique identifier (UUID v4) for the summary.';
COMMENT ON COLUMN public.iac_change_summary.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.iac_change_summary.iac_run_id IS 'Reference to the IaC run.';
COMMENT ON COLUMN public.iac_change_summary.add_count IS 'Number of resources to add.';
COMMENT ON COLUMN public.iac_change_summary.change_count IS 'Number of resources to change.';
COMMENT ON COLUMN public.iac_change_summary.destroy_count IS 'Number of resources to destroy.';
COMMENT ON COLUMN public.iac_change_summary.summary IS 'Human-readable summary.';
COMMENT ON COLUMN public.iac_change_summary.details_uri IS 'URI to detailed change plan.';
COMMENT ON COLUMN public.iac_change_summary.created_at IS 'Timestamp when the summary was created.';

-- observability_backend table
COMMENT ON TABLE public.observability_backend IS 'Observability backends: Prometheus, Grafana, Loki, Tempo, Datadog, Splunk.';
COMMENT ON COLUMN public.observability_backend.id IS 'Unique identifier (UUID v4) for the backend.';
COMMENT ON COLUMN public.observability_backend.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.observability_backend.kind IS 'Observability kind: logs, metrics, traces.';
COMMENT ON COLUMN public.observability_backend.type IS 'Backend type: prometheus, grafana, loki, tempo, datadog, splunk.';
COMMENT ON COLUMN public.observability_backend.endpoint IS 'Backend endpoint URL.';
COMMENT ON COLUMN public.observability_backend.auth_secret_ref IS 'Reference to authentication secret.';
COMMENT ON COLUMN public.observability_backend.default_labels IS 'JSON default labels applied to all queries.';
COMMENT ON COLUMN public.observability_backend.created_at IS 'Timestamp when the backend was registered.';
COMMENT ON COLUMN public.observability_backend.updated_at IS 'Timestamp when the backend was last modified.';

-- observability_link table
COMMENT ON TABLE public.observability_link IS 'Links entities to observability dashboards and queries.';
COMMENT ON COLUMN public.observability_link.id IS 'Unique identifier (UUID v4) for the link.';
COMMENT ON COLUMN public.observability_link.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.observability_link.backend_id IS 'Reference to the observability backend.';
COMMENT ON COLUMN public.observability_link.entity_type IS 'Type of linked entity.';
COMMENT ON COLUMN public.observability_link.entity_id IS 'ID of linked entity.';
COMMENT ON COLUMN public.observability_link.query IS 'JSON query configuration.';
COMMENT ON COLUMN public.observability_link.url IS 'Direct URL to dashboard or view.';
COMMENT ON COLUMN public.observability_link.created_at IS 'Timestamp when the link was created.';

-- incident table
COMMENT ON TABLE public.incident IS 'Operational incidents with severity and status tracking.';
COMMENT ON COLUMN public.incident.id IS 'Unique identifier (UUID v4) for the incident.';
COMMENT ON COLUMN public.incident.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.incident.project_id IS 'Reference to the affected project.';
COMMENT ON COLUMN public.incident.title IS 'Incident title.';
COMMENT ON COLUMN public.incident.description IS 'Detailed incident description.';
COMMENT ON COLUMN public.incident.severity IS 'Incident severity: p1 (critical), p2 (high), p3 (medium), p4 (low).';
COMMENT ON COLUMN public.incident.status IS 'Incident status: open, investigating, mitigating, resolved, postmortem.';
COMMENT ON COLUMN public.incident.detected_at IS 'Timestamp when incident was detected.';
COMMENT ON COLUMN public.incident.declared_at IS 'Timestamp when incident was declared.';
COMMENT ON COLUMN public.incident.resolved_at IS 'Timestamp when incident was resolved.';
COMMENT ON COLUMN public.incident.owner_user_id IS 'Reference to incident owner/commander.';
COMMENT ON COLUMN public.incident.related_entity IS 'JSON reference to related entities.';
COMMENT ON COLUMN public.incident.root_cause IS 'Root cause analysis.';
COMMENT ON COLUMN public.incident.impact IS 'Description of incident impact.';
COMMENT ON COLUMN public.incident.timeline_uri IS 'URI to incident timeline.';
COMMENT ON COLUMN public.incident.created_at IS 'Timestamp when the incident was created.';
COMMENT ON COLUMN public.incident.updated_at IS 'Timestamp when the incident was last modified.';

-- incident_update table
COMMENT ON TABLE public.incident_update IS 'Incident timeline updates for communication.';
COMMENT ON COLUMN public.incident_update.id IS 'Unique identifier (UUID v4) for the update.';
COMMENT ON COLUMN public.incident_update.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.incident_update.incident_id IS 'Reference to the parent incident.';
COMMENT ON COLUMN public.incident_update.author_user_id IS 'Reference to update author.';
COMMENT ON COLUMN public.incident_update.message IS 'Update message.';
COMMENT ON COLUMN public.incident_update.status IS 'Update type: info, mitigation, resolution.';
COMMENT ON COLUMN public.incident_update.created_at IS 'Timestamp when the update was posted.';

-- sla_policy table
COMMENT ON TABLE public.sla_policy IS 'Service Level Agreement policies with targets.';
COMMENT ON COLUMN public.sla_policy.id IS 'Unique identifier (UUID v4) for the SLA policy.';
COMMENT ON COLUMN public.sla_policy.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.sla_policy.name IS 'Policy name, unique within tenant.';
COMMENT ON COLUMN public.sla_policy.scope_type IS 'Scope type: tenant, org, project.';
COMMENT ON COLUMN public.sla_policy.scope_id IS 'ID of scope entity.';
COMMENT ON COLUMN public.sla_policy.targets IS 'JSON SLA targets (uptime %, response time, etc.).';
COMMENT ON COLUMN public.sla_policy.created_at IS 'Timestamp when the policy was created.';
COMMENT ON COLUMN public.sla_policy.updated_at IS 'Timestamp when the policy was last modified.';

-- integration_endpoint table
COMMENT ON TABLE public.integration_endpoint IS 'Integration endpoints for Slack, Teams, PagerDuty, webhooks.';
COMMENT ON COLUMN public.integration_endpoint.id IS 'Unique identifier (UUID v4) for the endpoint.';
COMMENT ON COLUMN public.integration_endpoint.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.integration_endpoint.type IS 'Integration type: slack, teams, pagerduty, email, webhook.';
COMMENT ON COLUMN public.integration_endpoint.name IS 'Endpoint name, unique within tenant.';
COMMENT ON COLUMN public.integration_endpoint.config IS 'JSON endpoint configuration.';
COMMENT ON COLUMN public.integration_endpoint.secret_ref_id IS 'Reference to authentication secret.';
COMMENT ON COLUMN public.integration_endpoint.enabled IS 'Whether the endpoint is active.';
COMMENT ON COLUMN public.integration_endpoint.created_at IS 'Timestamp when the endpoint was created.';
COMMENT ON COLUMN public.integration_endpoint.updated_at IS 'Timestamp when the endpoint was last modified.';

-- webhook_subscription table
COMMENT ON TABLE public.webhook_subscription IS 'Webhook subscriptions for event notifications.';
COMMENT ON COLUMN public.webhook_subscription.id IS 'Unique identifier (UUID v4) for the subscription.';
COMMENT ON COLUMN public.webhook_subscription.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.webhook_subscription.project_id IS 'Reference to the parent project.';
COMMENT ON COLUMN public.webhook_subscription.endpoint_id IS 'Reference to the integration endpoint.';
COMMENT ON COLUMN public.webhook_subscription.event_types IS 'JSON array of subscribed event types.';
COMMENT ON COLUMN public.webhook_subscription.filter IS 'JSON filter conditions.';
COMMENT ON COLUMN public.webhook_subscription.enabled IS 'Whether the subscription is active.';
COMMENT ON COLUMN public.webhook_subscription.created_at IS 'Timestamp when the subscription was created.';
COMMENT ON COLUMN public.webhook_subscription.updated_at IS 'Timestamp when the subscription was last modified.';

-- webhook_delivery table
COMMENT ON TABLE public.webhook_delivery IS 'Webhook delivery attempts with retry tracking.';
COMMENT ON COLUMN public.webhook_delivery.id IS 'Unique identifier (UUID v4) for the delivery.';
COMMENT ON COLUMN public.webhook_delivery.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.webhook_delivery.subscription_id IS 'Reference to the webhook subscription.';
COMMENT ON COLUMN public.webhook_delivery.event_type IS 'Type of event being delivered.';
COMMENT ON COLUMN public.webhook_delivery.payload IS 'JSON event payload.';
COMMENT ON COLUMN public.webhook_delivery.status IS 'Delivery status: pending, sent, failed.';
COMMENT ON COLUMN public.webhook_delivery.attempts IS 'Number of delivery attempts.';
COMMENT ON COLUMN public.webhook_delivery.last_error IS 'Error message from last attempt.';
COMMENT ON COLUMN public.webhook_delivery.created_at IS 'Timestamp when delivery was queued.';
COMMENT ON COLUMN public.webhook_delivery.sent_at IS 'Timestamp when successfully sent.';

-- billing_account table
COMMENT ON TABLE public.billing_account IS 'Cloud billing accounts for FinOps cost tracking.';
COMMENT ON COLUMN public.billing_account.id IS 'Unique identifier (UUID v4) for the billing account.';
COMMENT ON COLUMN public.billing_account.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.billing_account.provider IS 'Cloud provider: aws, gcp, azure.';
COMMENT ON COLUMN public.billing_account.name IS 'Account name.';
COMMENT ON COLUMN public.billing_account.external_id IS 'External account ID from provider.';
COMMENT ON COLUMN public.billing_account.currency IS 'Billing currency (default: USD).';
COMMENT ON COLUMN public.billing_account.config IS 'JSON account configuration.';
COMMENT ON COLUMN public.billing_account.created_at IS 'Timestamp when the account was linked.';
COMMENT ON COLUMN public.billing_account.updated_at IS 'Timestamp when the account was last modified.';

-- cost_allocation_rule table
COMMENT ON TABLE public.cost_allocation_rule IS 'Rules for allocating cloud costs to projects.';
COMMENT ON COLUMN public.cost_allocation_rule.id IS 'Unique identifier (UUID v4) for the rule.';
COMMENT ON COLUMN public.cost_allocation_rule.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.cost_allocation_rule.name IS 'Rule name, unique within tenant.';
COMMENT ON COLUMN public.cost_allocation_rule.rule_type IS 'Rule type: tag_based, namespace, project_mapping, custom.';
COMMENT ON COLUMN public.cost_allocation_rule.expression IS 'JSON rule expression.';
COMMENT ON COLUMN public.cost_allocation_rule.enabled IS 'Whether the rule is active.';
COMMENT ON COLUMN public.cost_allocation_rule.created_at IS 'Timestamp when the rule was created.';
COMMENT ON COLUMN public.cost_allocation_rule.updated_at IS 'Timestamp when the rule was last modified.';

-- cost_record table
COMMENT ON TABLE public.cost_record IS 'Cloud cost records with usage and cost data.';
COMMENT ON COLUMN public.cost_record.id IS 'Unique identifier (UUID v4) for the cost record.';
COMMENT ON COLUMN public.cost_record.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.cost_record.billing_account_id IS 'Reference to the billing account.';
COMMENT ON COLUMN public.cost_record.provider IS 'Cloud provider.';
COMMENT ON COLUMN public.cost_record.service IS 'Cloud service name.';
COMMENT ON COLUMN public.cost_record.sku IS 'Service SKU.';
COMMENT ON COLUMN public.cost_record.usage_start IS 'Usage period start.';
COMMENT ON COLUMN public.cost_record.usage_end IS 'Usage period end.';
COMMENT ON COLUMN public.cost_record.cost_amount IS 'Cost amount in billing currency.';
COMMENT ON COLUMN public.cost_record.currency IS 'Cost currency.';
COMMENT ON COLUMN public.cost_record.usage_quantity IS 'Usage quantity.';
COMMENT ON COLUMN public.cost_record.usage_unit IS 'Usage unit (hours, GB, requests, etc.).';
COMMENT ON COLUMN public.cost_record.tags IS 'JSON resource tags for allocation.';
COMMENT ON COLUMN public.cost_record.resource_external_id IS 'External resource ID.';
COMMENT ON COLUMN public.cost_record.project_id IS 'Reference to allocated project.';
COMMENT ON COLUMN public.cost_record.run_id IS 'Reference to ML run if applicable.';
COMMENT ON COLUMN public.cost_record.pipeline_id IS 'Reference to CI/CD pipeline if applicable.';
COMMENT ON COLUMN public.cost_record.deployment_id IS 'Reference to model deployment if applicable.';
COMMENT ON COLUMN public.cost_record.created_at IS 'Timestamp when the record was imported.';

-- budget table
COMMENT ON TABLE public.budget IS 'Cost budgets with threshold alerts.';
COMMENT ON COLUMN public.budget.id IS 'Unique identifier (UUID v4) for the budget.';
COMMENT ON COLUMN public.budget.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.budget.scope_type IS 'Budget scope: tenant, org, project.';
COMMENT ON COLUMN public.budget.scope_id IS 'ID of scope entity.';
COMMENT ON COLUMN public.budget.name IS 'Budget name.';
COMMENT ON COLUMN public.budget.period IS 'Budget period: monthly, quarterly, yearly.';
COMMENT ON COLUMN public.budget.amount IS 'Budget amount.';
COMMENT ON COLUMN public.budget.currency IS 'Budget currency.';
COMMENT ON COLUMN public.budget.threshold_percentages IS 'JSON array of alert thresholds (e.g., [50, 80, 100]).';
COMMENT ON COLUMN public.budget.alert_channels IS 'JSON array of alert channel references.';
COMMENT ON COLUMN public.budget.created_at IS 'Timestamp when the budget was created.';
COMMENT ON COLUMN public.budget.updated_at IS 'Timestamp when the budget was last modified.';

-- carbon_record table
COMMENT ON TABLE public.carbon_record IS 'Carbon emissions records for GreenOps sustainability tracking.';
COMMENT ON COLUMN public.carbon_record.id IS 'Unique identifier (UUID v4) for the carbon record.';
COMMENT ON COLUMN public.carbon_record.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.carbon_record.provider IS 'Cloud provider.';
COMMENT ON COLUMN public.carbon_record.region IS 'Cloud region.';
COMMENT ON COLUMN public.carbon_record.start_time IS 'Measurement period start.';
COMMENT ON COLUMN public.carbon_record.end_time IS 'Measurement period end.';
COMMENT ON COLUMN public.carbon_record.kwh IS 'Energy consumption in kWh.';
COMMENT ON COLUMN public.carbon_record.co2e_kg IS 'CO2 equivalent emissions in kg.';
COMMENT ON COLUMN public.carbon_record.methodology IS 'Calculation methodology used.';
COMMENT ON COLUMN public.carbon_record.attribution IS 'JSON attribution to projects/workloads.';
COMMENT ON COLUMN public.carbon_record.created_at IS 'Timestamp when the record was imported.';

-- efficiency_kpi_snapshot table
COMMENT ON TABLE public.efficiency_kpi_snapshot IS 'Daily efficiency KPI snapshots for resource optimization.';
COMMENT ON COLUMN public.efficiency_kpi_snapshot.id IS 'Unique identifier (UUID v4) for the snapshot.';
COMMENT ON COLUMN public.efficiency_kpi_snapshot.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.efficiency_kpi_snapshot.project_id IS 'Reference to the project.';
COMMENT ON COLUMN public.efficiency_kpi_snapshot.date_key IS 'Snapshot date.';
COMMENT ON COLUMN public.efficiency_kpi_snapshot.cpu_hours IS 'Total CPU hours consumed.';
COMMENT ON COLUMN public.efficiency_kpi_snapshot.gpu_hours IS 'Total GPU hours consumed.';
COMMENT ON COLUMN public.efficiency_kpi_snapshot.cost_amount IS 'Total cost for the day.';
COMMENT ON COLUMN public.efficiency_kpi_snapshot.co2e_kg IS 'Carbon emissions for the day.';
COMMENT ON COLUMN public.efficiency_kpi_snapshot.success_rate IS 'Run success rate percentage.';
COMMENT ON COLUMN public.efficiency_kpi_snapshot.mean_duration_sec IS 'Mean run duration in seconds.';
COMMENT ON COLUMN public.efficiency_kpi_snapshot.created_at IS 'Timestamp when the snapshot was created.';

-- ai_system table
COMMENT ON TABLE public.ai_system IS 'AI systems for EU AI Act compliance and governance.';
COMMENT ON COLUMN public.ai_system.id IS 'Unique identifier (UUID v4) for the AI system.';
COMMENT ON COLUMN public.ai_system.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.ai_system.project_id IS 'Reference to the parent project.';
COMMENT ON COLUMN public.ai_system.name IS 'AI system name, unique within project.';
COMMENT ON COLUMN public.ai_system.description IS 'Description of the AI system.';
COMMENT ON COLUMN public.ai_system.risk_class IS 'EU AI Act risk class: unacceptable, high, limited, minimal.';
COMMENT ON COLUMN public.ai_system.intended_purpose IS 'Intended purpose of the AI system.';
COMMENT ON COLUMN public.ai_system.users_affected IS 'Description of users affected by the system.';
COMMENT ON COLUMN public.ai_system.deployment_context IS 'Deployment context and use cases.';
COMMENT ON COLUMN public.ai_system.owner_user_id IS 'Reference to system owner.';
COMMENT ON COLUMN public.ai_system.status IS 'System status: draft, active, suspended, decommissioned.';
COMMENT ON COLUMN public.ai_system.created_at IS 'Timestamp when the system was registered.';
COMMENT ON COLUMN public.ai_system.updated_at IS 'Timestamp when the system was last modified.';

-- model_card table
COMMENT ON TABLE public.model_card IS 'Model documentation cards for transparency and compliance.';
COMMENT ON COLUMN public.model_card.id IS 'Unique identifier (UUID v4) for the model card.';
COMMENT ON COLUMN public.model_card.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.model_card.model_version_id IS 'Reference to the model version.';
COMMENT ON COLUMN public.model_card.ai_system_id IS 'Reference to parent AI system.';
COMMENT ON COLUMN public.model_card.summary IS 'Model summary and overview.';
COMMENT ON COLUMN public.model_card.training_data IS 'Description of training data.';
COMMENT ON COLUMN public.model_card.evaluation_data IS 'Description of evaluation data.';
COMMENT ON COLUMN public.model_card.performance IS 'JSON performance metrics.';
COMMENT ON COLUMN public.model_card.limitations IS 'Known limitations and constraints.';
COMMENT ON COLUMN public.model_card.ethical_considerations IS 'Ethical considerations and risks.';
COMMENT ON COLUMN public.model_card.caveats IS 'Usage caveats and recommendations.';
COMMENT ON COLUMN public.model_card.version IS 'Model card version.';
COMMENT ON COLUMN public.model_card.created_at IS 'Timestamp when the card was created.';
COMMENT ON COLUMN public.model_card.updated_at IS 'Timestamp when the card was last modified.';
COMMENT ON COLUMN public.model_card.created_by IS 'Reference to user who created the card.';

-- risk_assessment table
COMMENT ON TABLE public.risk_assessment IS 'AI risk assessments for compliance.';
COMMENT ON COLUMN public.risk_assessment.id IS 'Unique identifier (UUID v4) for the assessment.';
COMMENT ON COLUMN public.risk_assessment.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.risk_assessment.ai_system_id IS 'Reference to the AI system.';
COMMENT ON COLUMN public.risk_assessment.methodology IS 'Assessment methodology used.';
COMMENT ON COLUMN public.risk_assessment.hazards IS 'JSON array of identified hazards.';
COMMENT ON COLUMN public.risk_assessment.mitigations IS 'JSON array of risk mitigations.';
COMMENT ON COLUMN public.risk_assessment.residual_risk IS 'Residual risk level after mitigations.';
COMMENT ON COLUMN public.risk_assessment.decision IS 'Assessment decision and rationale.';
COMMENT ON COLUMN public.risk_assessment.assessor_user_id IS 'Reference to assessor.';
COMMENT ON COLUMN public.risk_assessment.assessed_at IS 'Timestamp of assessment.';
COMMENT ON COLUMN public.risk_assessment.next_review_at IS 'Timestamp for next review.';

-- compliance_control table
COMMENT ON TABLE public.compliance_control IS 'Compliance framework controls (GDPR, SOC2, ISO27001, etc.).';
COMMENT ON COLUMN public.compliance_control.id IS 'Unique identifier (UUID v4) for the control.';
COMMENT ON COLUMN public.compliance_control.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.compliance_control.framework IS 'Compliance framework name.';
COMMENT ON COLUMN public.compliance_control.control_code IS 'Control identifier within framework.';
COMMENT ON COLUMN public.compliance_control.title IS 'Control title.';
COMMENT ON COLUMN public.compliance_control.description IS 'Control description.';
COMMENT ON COLUMN public.compliance_control.evidence_required IS 'Description of required evidence.';
COMMENT ON COLUMN public.compliance_control.created_at IS 'Timestamp when the control was defined.';

-- compliance_evidence table
COMMENT ON TABLE public.compliance_evidence IS 'Evidence artifacts for compliance controls.';
COMMENT ON COLUMN public.compliance_evidence.id IS 'Unique identifier (UUID v4) for the evidence.';
COMMENT ON COLUMN public.compliance_evidence.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.compliance_evidence.control_id IS 'Reference to the compliance control.';
COMMENT ON COLUMN public.compliance_evidence.entity_type IS 'Type of entity providing evidence.';
COMMENT ON COLUMN public.compliance_evidence.entity_id IS 'ID of entity providing evidence.';
COMMENT ON COLUMN public.compliance_evidence.artifact_id IS 'Reference to evidence artifact.';
COMMENT ON COLUMN public.compliance_evidence.notes IS 'Additional notes about the evidence.';
COMMENT ON COLUMN public.compliance_evidence.status IS 'Evidence status: pending, valid, invalid, expired.';
COMMENT ON COLUMN public.compliance_evidence.created_at IS 'Timestamp when evidence was submitted.';
COMMENT ON COLUMN public.compliance_evidence.validated_at IS 'Timestamp when evidence was validated.';
COMMENT ON COLUMN public.compliance_evidence.validated_by IS 'Reference to validator.';

-- monitoring_plan table
COMMENT ON TABLE public.monitoring_plan IS 'AI system monitoring plans for ongoing compliance.';
COMMENT ON COLUMN public.monitoring_plan.id IS 'Unique identifier (UUID v4) for the plan.';
COMMENT ON COLUMN public.monitoring_plan.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.monitoring_plan.ai_system_id IS 'Reference to the AI system.';
COMMENT ON COLUMN public.monitoring_plan.plan IS 'JSON monitoring plan specification.';
COMMENT ON COLUMN public.monitoring_plan.active IS 'Whether the plan is active.';
COMMENT ON COLUMN public.monitoring_plan.created_at IS 'Timestamp when the plan was created.';
COMMENT ON COLUMN public.monitoring_plan.updated_at IS 'Timestamp when the plan was last modified.';

-- governance_incident table
COMMENT ON TABLE public.governance_incident IS 'AI governance incidents: bias, drift, fairness, privacy, security.';
COMMENT ON COLUMN public.governance_incident.id IS 'Unique identifier (UUID v4) for the incident.';
COMMENT ON COLUMN public.governance_incident.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.governance_incident.ai_system_id IS 'Reference to the AI system.';
COMMENT ON COLUMN public.governance_incident.model_deployment_id IS 'Reference to affected model deployment.';
COMMENT ON COLUMN public.governance_incident.type IS 'Incident type: bias, drift, fairness, privacy, security.';
COMMENT ON COLUMN public.governance_incident.severity IS 'Incident severity.';
COMMENT ON COLUMN public.governance_incident.description IS 'Incident description.';
COMMENT ON COLUMN public.governance_incident.detected_at IS 'Timestamp when incident was detected.';
COMMENT ON COLUMN public.governance_incident.status IS 'Incident status: open, investigating, resolved.';
COMMENT ON COLUMN public.governance_incident.resolution IS 'Resolution description.';
COMMENT ON COLUMN public.governance_incident.closed_at IS 'Timestamp when incident was closed.';
COMMENT ON COLUMN public.governance_incident.owner_user_id IS 'Reference to incident owner.';

-- data_contract table
COMMENT ON TABLE public.data_contract IS 'Data contracts defining data ownership, schema, and SLAs.';
COMMENT ON COLUMN public.data_contract.id IS 'Unique identifier (UUID v4) for the contract.';
COMMENT ON COLUMN public.data_contract.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.data_contract.project_id IS 'Reference to the parent project.';
COMMENT ON COLUMN public.data_contract.name IS 'Contract name, unique within project.';
COMMENT ON COLUMN public.data_contract.version IS 'Contract version.';
COMMENT ON COLUMN public.data_contract.schema IS 'JSON schema definition.';
COMMENT ON COLUMN public.data_contract.sla IS 'JSON SLA definition (freshness, quality, etc.).';
COMMENT ON COLUMN public.data_contract.privacy_classification IS 'Privacy level: public, internal, confidential, restricted.';
COMMENT ON COLUMN public.data_contract.retention_days IS 'Data retention period in days.';
COMMENT ON COLUMN public.data_contract.owner_user_id IS 'Reference to contract owner.';
COMMENT ON COLUMN public.data_contract.status IS 'Contract status: draft, active, deprecated.';
COMMENT ON COLUMN public.data_contract.created_at IS 'Timestamp when the contract was created.';
COMMENT ON COLUMN public.data_contract.updated_at IS 'Timestamp when the contract was last modified.';

-- data_contract_binding table
COMMENT ON TABLE public.data_contract_binding IS 'Bindings of data contracts to entities (datasets, runs).';
COMMENT ON COLUMN public.data_contract_binding.id IS 'Unique identifier (UUID v4) for the binding.';
COMMENT ON COLUMN public.data_contract_binding.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.data_contract_binding.contract_id IS 'Reference to the data contract.';
COMMENT ON COLUMN public.data_contract_binding.entity_type IS 'Type of bound entity.';
COMMENT ON COLUMN public.data_contract_binding.entity_id IS 'ID of bound entity.';
COMMENT ON COLUMN public.data_contract_binding.created_at IS 'Timestamp when the binding was created.';

-- dashboard table
COMMENT ON TABLE public.dashboard IS 'Custom project dashboards for visualization.';
COMMENT ON COLUMN public.dashboard.id IS 'Unique identifier (UUID v4) for the dashboard.';
COMMENT ON COLUMN public.dashboard.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.dashboard.project_id IS 'Reference to the parent project.';
COMMENT ON COLUMN public.dashboard.name IS 'Dashboard name, unique within project.';
COMMENT ON COLUMN public.dashboard.description IS 'Dashboard description.';
COMMENT ON COLUMN public.dashboard.layout IS 'JSON layout configuration.';
COMMENT ON COLUMN public.dashboard.created_at IS 'Timestamp when the dashboard was created.';
COMMENT ON COLUMN public.dashboard.updated_at IS 'Timestamp when the dashboard was last modified.';
COMMENT ON COLUMN public.dashboard.created_by IS 'Reference to user who created the dashboard.';
COMMENT ON COLUMN public.dashboard.updated_by IS 'Reference to user who last modified the dashboard.';

-- dashboard_widget table
COMMENT ON TABLE public.dashboard_widget IS 'Widgets in custom dashboards.';
COMMENT ON COLUMN public.dashboard_widget.id IS 'Unique identifier (UUID v4) for the widget.';
COMMENT ON COLUMN public.dashboard_widget.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.dashboard_widget.dashboard_id IS 'Reference to the parent dashboard.';
COMMENT ON COLUMN public.dashboard_widget.type IS 'Widget type (chart, table, metric, etc.).';
COMMENT ON COLUMN public.dashboard_widget.config IS 'JSON widget configuration.';
COMMENT ON COLUMN public.dashboard_widget.position IS 'JSON position in dashboard grid (x, y, w, h).';

-- execution_link table
COMMENT ON TABLE public.execution_link IS 'Links between execution entities for lineage and dependency tracking.';
COMMENT ON COLUMN public.execution_link.id IS 'Unique identifier (UUID v4) for the link.';
COMMENT ON COLUMN public.execution_link.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.execution_link.project_id IS 'Reference to the parent project.';
COMMENT ON COLUMN public.execution_link.source_type IS 'Type of source entity.';
COMMENT ON COLUMN public.execution_link.source_id IS 'ID of source entity.';
COMMENT ON COLUMN public.execution_link.target_type IS 'Type of target entity.';
COMMENT ON COLUMN public.execution_link.target_id IS 'ID of target entity.';
COMMENT ON COLUMN public.execution_link.relation IS 'Relation type (produced, consumed, triggered, etc.).';
COMMENT ON COLUMN public.execution_link.created_at IS 'Timestamp when the link was created.';

-- ============================================================================
-- END OF MIGRATION: Comprehensive Table and Column Documentation
-- ============================================================================
