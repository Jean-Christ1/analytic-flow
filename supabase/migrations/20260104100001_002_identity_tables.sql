-- ============================================================================
-- MIGRATION: Identity and RBAC Tables
-- Schema: MLOps Control Plane v3
-- Author: Armand AMOUSSOU
-- Date: 2026-01-04
-- ============================================================================

-- ============================================================================
-- ENUMS FOR IDENTITY
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE public.user_status AS ENUM ('active', 'disabled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.scope_type AS ENUM ('tenant', 'org', 'project');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.principal_type AS ENUM ('user', 'group', 'service');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.rule_type AS ENUM ('validation', 'approval', 'naming', 'quota', 'security');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.rule_applies_to AS ENUM ('project', 'run', 'deploy', 'env', 'registry', 'cicd', 'gitops', 'catalog');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.rule_severity AS ENUM ('info', 'warn', 'block');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.permission_category AS ENUM ('admin', 'project', 'security', 'mlops', 'cicd', 'gitops');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.secret_backend AS ENUM ('vault', 'aws_sm', 'gcp_sm', 'azure_kv', 'k8s_secret');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.secret_purpose AS ENUM ('db', 'git', 'objectstore', 'registry', 'oidc', 'gitlab', 'argocd', 'integrations');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.idp_type AS ENUM ('oidc', 'saml', 'ldap');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- TABLE: user_account
-- User accounts within a tenant
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_account (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    external_subject VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    status public.user_status NOT NULL DEFAULT 'active',
    last_login_at TIMESTAMP WITH TIME ZONE,
    mfa_enabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, email)
);

-- Enable RLS
ALTER TABLE public.user_account ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_account_tenant_id ON public.user_account(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_account_email ON public.user_account(email);
CREATE INDEX IF NOT EXISTS idx_user_account_external_subject ON public.user_account(external_subject);
CREATE INDEX IF NOT EXISTS idx_user_account_status ON public.user_account(status);

-- Comments
COMMENT ON TABLE public.user_account IS 'User accounts for authentication and authorization';
COMMENT ON COLUMN public.user_account.external_subject IS 'External identity provider subject ID (OIDC sub claim)';
COMMENT ON COLUMN public.user_account.mfa_enabled IS 'Whether MFA is enabled for this user';

-- ============================================================================
-- TABLE: group
-- Groups for organizing users
-- ============================================================================

CREATE TABLE IF NOT EXISTS public."group" (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, name)
);

-- Enable RLS
ALTER TABLE public."group" ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_group_tenant_id ON public."group"(tenant_id);
CREATE INDEX IF NOT EXISTS idx_group_name ON public."group"(name);

-- Comments
COMMENT ON TABLE public."group" IS 'Groups for organizing users and applying role bindings';

-- ============================================================================
-- TABLE: group_member
-- Junction table for group membership
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.group_member (
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES public."group"(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_account(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    PRIMARY KEY (group_id, user_id)
);

-- Enable RLS
ALTER TABLE public.group_member ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_group_member_tenant_id ON public.group_member(tenant_id);
CREATE INDEX IF NOT EXISTS idx_group_member_group_id ON public.group_member(group_id);
CREATE INDEX IF NOT EXISTS idx_group_member_user_id ON public.group_member(user_id);

-- Comments
COMMENT ON TABLE public.group_member IS 'Group membership junction table';

-- ============================================================================
-- TABLE: role
-- RBAC roles
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.role (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    scope public.scope_type NOT NULL DEFAULT 'project',
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, name)
);

-- Enable RLS
ALTER TABLE public.role ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_role_tenant_id ON public.role(tenant_id);
CREATE INDEX IF NOT EXISTS idx_role_name ON public.role(name);
CREATE INDEX IF NOT EXISTS idx_role_scope ON public.role(scope);
CREATE INDEX IF NOT EXISTS idx_role_is_system ON public.role(is_system);

-- Comments
COMMENT ON TABLE public.role IS 'RBAC roles with scope-based access control';
COMMENT ON COLUMN public.role.scope IS 'Scope level: tenant, org, or project';
COMMENT ON COLUMN public.role.is_system IS 'System roles cannot be modified';

-- ============================================================================
-- TABLE: permission
-- Permissions reference table (tenant-agnostic)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.permission (
    code VARCHAR(100) NOT NULL PRIMARY KEY,
    description TEXT,
    category public.permission_category NOT NULL
);

-- Comments
COMMENT ON TABLE public.permission IS 'Permission definitions for RBAC';
COMMENT ON COLUMN public.permission.code IS 'Unique permission code (e.g., project.read, mlops.run.create)';
COMMENT ON COLUMN public.permission.category IS 'Permission category for grouping';

-- ============================================================================
-- TABLE: role_permission
-- Junction table for role-permission mapping
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.role_permission (
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.role(id) ON DELETE CASCADE,
    permission_code VARCHAR(100) NOT NULL REFERENCES public.permission(code) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_code)
);

-- Enable RLS
ALTER TABLE public.role_permission ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_role_permission_tenant_id ON public.role_permission(tenant_id);
CREATE INDEX IF NOT EXISTS idx_role_permission_role_id ON public.role_permission(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permission_permission_code ON public.role_permission(permission_code);

-- Comments
COMMENT ON TABLE public.role_permission IS 'Role-permission mapping for RBAC';

-- ============================================================================
-- TABLE: principal_role_binding
-- Role bindings for users, groups, and service accounts
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.principal_role_binding (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    principal_type public.principal_type NOT NULL,
    principal_id UUID NOT NULL,
    scope_type public.scope_type NOT NULL,
    scope_id UUID,
    role_id UUID NOT NULL REFERENCES public.role(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.user_account(id) ON DELETE SET NULL,
    UNIQUE(tenant_id, principal_type, principal_id, scope_type, scope_id, role_id)
);

-- Enable RLS
ALTER TABLE public.principal_role_binding ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_principal_role_binding_tenant_id ON public.principal_role_binding(tenant_id);
CREATE INDEX IF NOT EXISTS idx_principal_role_binding_principal ON public.principal_role_binding(principal_type, principal_id);
CREATE INDEX IF NOT EXISTS idx_principal_role_binding_scope ON public.principal_role_binding(scope_type, scope_id);
CREATE INDEX IF NOT EXISTS idx_principal_role_binding_role_id ON public.principal_role_binding(role_id);

-- Comments
COMMENT ON TABLE public.principal_role_binding IS 'Role bindings for users, groups, and service accounts';
COMMENT ON COLUMN public.principal_role_binding.principal_type IS 'Type of principal: user, group, or service';
COMMENT ON COLUMN public.principal_role_binding.scope_type IS 'Scope level for the binding';
COMMENT ON COLUMN public.principal_role_binding.scope_id IS 'ID of the scope entity (null for tenant scope)';

-- ============================================================================
-- TABLE: business_rule
-- Business rules for validation, naming, approvals, etc.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.business_rule (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    rule_type public.rule_type NOT NULL,
    applies_to public.rule_applies_to NOT NULL,
    expression JSONB NOT NULL DEFAULT '{}'::jsonb,
    enabled BOOLEAN NOT NULL DEFAULT true,
    severity public.rule_severity NOT NULL DEFAULT 'warn',
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.user_account(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.user_account(id) ON DELETE SET NULL,
    UNIQUE(tenant_id, name)
);

-- Enable RLS
ALTER TABLE public.business_rule ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_business_rule_tenant_id ON public.business_rule(tenant_id);
CREATE INDEX IF NOT EXISTS idx_business_rule_rule_type ON public.business_rule(rule_type);
CREATE INDEX IF NOT EXISTS idx_business_rule_applies_to ON public.business_rule(applies_to);
CREATE INDEX IF NOT EXISTS idx_business_rule_enabled ON public.business_rule(enabled);

-- Comments
COMMENT ON TABLE public.business_rule IS 'Business rules for validation, naming, approvals, quotas, and security';
COMMENT ON COLUMN public.business_rule.expression IS 'JSON expression for rule evaluation';
COMMENT ON COLUMN public.business_rule.severity IS 'Rule severity: info, warn, or block';

-- ============================================================================
-- TABLE: feature_flag
-- Feature flags for tenant features
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.feature_flag (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    key VARCHAR(100) NOT NULL,
    description TEXT,
    enabled BOOLEAN NOT NULL DEFAULT false,
    targeting JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, key)
);

-- Enable RLS
ALTER TABLE public.feature_flag ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_feature_flag_tenant_id ON public.feature_flag(tenant_id);
CREATE INDEX IF NOT EXISTS idx_feature_flag_key ON public.feature_flag(key);
CREATE INDEX IF NOT EXISTS idx_feature_flag_enabled ON public.feature_flag(enabled);

-- Comments
COMMENT ON TABLE public.feature_flag IS 'Feature flags for enabling/disabling features per tenant';
COMMENT ON COLUMN public.feature_flag.targeting IS 'JSON targeting rules (user segments, percentages, etc.)';

-- ============================================================================
-- TABLE: quota_policy
-- Quota policies for resources
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.quota_policy (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    scope_type public.scope_type NOT NULL DEFAULT 'tenant',
    scope_id UUID,
    name VARCHAR(255) NOT NULL,
    limits JSONB NOT NULL DEFAULT '{}'::jsonb,
    enforced BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, scope_type, scope_id, name)
);

-- Enable RLS
ALTER TABLE public.quota_policy ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_quota_policy_tenant_id ON public.quota_policy(tenant_id);
CREATE INDEX IF NOT EXISTS idx_quota_policy_scope ON public.quota_policy(scope_type, scope_id);
CREATE INDEX IF NOT EXISTS idx_quota_policy_enforced ON public.quota_policy(enforced);

-- Comments
COMMENT ON TABLE public.quota_policy IS 'Quota policies for limiting resource usage';
COMMENT ON COLUMN public.quota_policy.limits IS 'JSON object with quota limits (e.g., {"max_runs": 100, "max_storage_gb": 500})';

-- ============================================================================
-- TABLE: admin_setting
-- Admin settings for tenant configuration
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_setting (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    key VARCHAR(100) NOT NULL,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES public.user_account(id) ON DELETE SET NULL,
    UNIQUE(tenant_id, key)
);

-- Enable RLS
ALTER TABLE public.admin_setting ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_setting_tenant_id ON public.admin_setting(tenant_id);
CREATE INDEX IF NOT EXISTS idx_admin_setting_key ON public.admin_setting(key);

-- Comments
COMMENT ON TABLE public.admin_setting IS 'Tenant-level admin settings and configuration';

-- ============================================================================
-- TABLE: service_account
-- Machine identities for automation and integrations
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.service_account (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status public.user_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.user_account(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.user_account(id) ON DELETE SET NULL,
    UNIQUE(tenant_id, name)
);

-- Enable RLS
ALTER TABLE public.service_account ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_service_account_tenant_id ON public.service_account(tenant_id);
CREATE INDEX IF NOT EXISTS idx_service_account_name ON public.service_account(name);
CREATE INDEX IF NOT EXISTS idx_service_account_status ON public.service_account(status);

-- Comments
COMMENT ON TABLE public.service_account IS 'Service accounts for machine-to-machine authentication';

-- ============================================================================
-- TABLE: service_account_token
-- Tokens for service account authentication
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.service_account_token (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    service_account_id UUID NOT NULL REFERENCES public.service_account(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    scopes JSONB DEFAULT '[]'::jsonb,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    revoked_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.service_account_token ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_service_account_token_tenant_id ON public.service_account_token(tenant_id);
CREATE INDEX IF NOT EXISTS idx_service_account_token_service_account_id ON public.service_account_token(service_account_id);
CREATE INDEX IF NOT EXISTS idx_service_account_token_hash ON public.service_account_token(token_hash);
CREATE INDEX IF NOT EXISTS idx_service_account_token_expires_at ON public.service_account_token(expires_at);

-- Comments
COMMENT ON TABLE public.service_account_token IS 'Authentication tokens for service accounts';
COMMENT ON COLUMN public.service_account_token.token_hash IS 'Hashed token value (never store plain text)';
COMMENT ON COLUMN public.service_account_token.scopes IS 'Array of permission scopes for this token';

-- ============================================================================
-- TABLE: secret_ref
-- References to external secret stores
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.secret_ref (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    backend public.secret_backend NOT NULL,
    ref VARCHAR(500) NOT NULL,
    purpose public.secret_purpose NOT NULL,
    rotation_hint VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, backend, ref)
);

-- Enable RLS
ALTER TABLE public.secret_ref ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_secret_ref_tenant_id ON public.secret_ref(tenant_id);
CREATE INDEX IF NOT EXISTS idx_secret_ref_backend ON public.secret_ref(backend);
CREATE INDEX IF NOT EXISTS idx_secret_ref_purpose ON public.secret_ref(purpose);

-- Comments
COMMENT ON TABLE public.secret_ref IS 'References to secrets stored in external secret backends';
COMMENT ON COLUMN public.secret_ref.backend IS 'Secret backend: vault, aws_sm, gcp_sm, azure_kv, k8s_secret';
COMMENT ON COLUMN public.secret_ref.ref IS 'Secret reference path (e.g., vault path, ARN, etc.)';
COMMENT ON COLUMN public.secret_ref.rotation_hint IS 'Hint for secret rotation schedule';

-- ============================================================================
-- TABLE: identity_provider
-- External identity providers (OIDC, SAML, LDAP)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.identity_provider (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    type public.idp_type NOT NULL,
    issuer_url VARCHAR(500),
    client_id VARCHAR(255),
    sso_metadata JSONB DEFAULT '{}'::jsonb,
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, type, issuer_url)
);

-- Enable RLS
ALTER TABLE public.identity_provider ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_identity_provider_tenant_id ON public.identity_provider(tenant_id);
CREATE INDEX IF NOT EXISTS idx_identity_provider_type ON public.identity_provider(type);
CREATE INDEX IF NOT EXISTS idx_identity_provider_enabled ON public.identity_provider(enabled);

-- Comments
COMMENT ON TABLE public.identity_provider IS 'External identity providers for SSO';
COMMENT ON COLUMN public.identity_provider.type IS 'Provider type: oidc, saml, ldap';
COMMENT ON COLUMN public.identity_provider.sso_metadata IS 'Provider-specific configuration metadata';

-- ============================================================================
-- TABLE: api_token
-- User API tokens for programmatic access
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.api_token (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_account(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    scopes JSONB DEFAULT '[]'::jsonb,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    revoked_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.api_token ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_api_token_tenant_id ON public.api_token(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_token_user_id ON public.api_token(user_id);
CREATE INDEX IF NOT EXISTS idx_api_token_hash ON public.api_token(token_hash);
CREATE INDEX IF NOT EXISTS idx_api_token_expires_at ON public.api_token(expires_at);

-- Comments
COMMENT ON TABLE public.api_token IS 'User API tokens for programmatic access';
COMMENT ON COLUMN public.api_token.token_hash IS 'Hashed token value (never store plain text)';
COMMENT ON COLUMN public.api_token.scopes IS 'Array of permission scopes for this token';

-- ============================================================================
-- TRIGGERS: Auto-update updated_at
-- ============================================================================

-- User Account
DROP TRIGGER IF EXISTS set_user_account_updated_at ON public.user_account;
CREATE TRIGGER set_user_account_updated_at
    BEFORE UPDATE ON public.user_account
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- Group
DROP TRIGGER IF EXISTS set_group_updated_at ON public."group";
CREATE TRIGGER set_group_updated_at
    BEFORE UPDATE ON public."group"
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- Role
DROP TRIGGER IF EXISTS set_role_updated_at ON public.role;
CREATE TRIGGER set_role_updated_at
    BEFORE UPDATE ON public.role
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- Business Rule
DROP TRIGGER IF EXISTS set_business_rule_updated_at ON public.business_rule;
CREATE TRIGGER set_business_rule_updated_at
    BEFORE UPDATE ON public.business_rule
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- Feature Flag
DROP TRIGGER IF EXISTS set_feature_flag_updated_at ON public.feature_flag;
CREATE TRIGGER set_feature_flag_updated_at
    BEFORE UPDATE ON public.feature_flag
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- Quota Policy
DROP TRIGGER IF EXISTS set_quota_policy_updated_at ON public.quota_policy;
CREATE TRIGGER set_quota_policy_updated_at
    BEFORE UPDATE ON public.quota_policy
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- Admin Setting
DROP TRIGGER IF EXISTS set_admin_setting_updated_at ON public.admin_setting;
CREATE TRIGGER set_admin_setting_updated_at
    BEFORE UPDATE ON public.admin_setting
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- Service Account
DROP TRIGGER IF EXISTS set_service_account_updated_at ON public.service_account;
CREATE TRIGGER set_service_account_updated_at
    BEFORE UPDATE ON public.service_account
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- Secret Ref
DROP TRIGGER IF EXISTS set_secret_ref_updated_at ON public.secret_ref;
CREATE TRIGGER set_secret_ref_updated_at
    BEFORE UPDATE ON public.secret_ref
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- Identity Provider
DROP TRIGGER IF EXISTS set_identity_provider_updated_at ON public.identity_provider;
CREATE TRIGGER set_identity_provider_updated_at
    BEFORE UPDATE ON public.identity_provider
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- SEED DATA: Default permissions
-- ============================================================================

INSERT INTO public.permission (code, description, category) VALUES
    -- Admin permissions
    ('admin.tenant.manage', 'Manage tenant settings', 'admin'),
    ('admin.users.manage', 'Manage users and groups', 'admin'),
    ('admin.roles.manage', 'Manage roles and permissions', 'admin'),
    ('admin.billing.manage', 'Manage billing and subscriptions', 'admin'),
    ('admin.audit.read', 'View audit logs', 'admin'),
    ('admin.settings.manage', 'Manage admin settings', 'admin'),

    -- Project permissions
    ('project.create', 'Create projects', 'project'),
    ('project.read', 'View project details', 'project'),
    ('project.update', 'Update project settings', 'project'),
    ('project.delete', 'Delete projects', 'project'),
    ('project.members.manage', 'Manage project members', 'project'),

    -- Security permissions
    ('security.secrets.manage', 'Manage secrets', 'security'),
    ('security.tokens.manage', 'Manage API tokens', 'security'),
    ('security.idp.manage', 'Manage identity providers', 'security'),
    ('security.service_accounts.manage', 'Manage service accounts', 'security'),

    -- MLOps permissions
    ('mlops.run.create', 'Create ML runs', 'mlops'),
    ('mlops.run.read', 'View ML runs', 'mlops'),
    ('mlops.run.cancel', 'Cancel ML runs', 'mlops'),
    ('mlops.model.create', 'Register models', 'mlops'),
    ('mlops.model.read', 'View models', 'mlops'),
    ('mlops.model.approve', 'Approve model versions', 'mlops'),
    ('mlops.deploy.create', 'Create deployments', 'mlops'),
    ('mlops.deploy.manage', 'Manage deployments', 'mlops'),
    ('mlops.workspace.create', 'Create workspaces', 'mlops'),
    ('mlops.workspace.manage', 'Manage workspaces', 'mlops'),

    -- CI/CD permissions
    ('cicd.pipeline.create', 'Create CI/CD pipelines', 'cicd'),
    ('cicd.pipeline.read', 'View CI/CD pipelines', 'cicd'),
    ('cicd.pipeline.run', 'Run CI/CD pipelines', 'cicd'),
    ('cicd.environment.manage', 'Manage CI/CD environments', 'cicd'),

    -- GitOps permissions
    ('gitops.app.create', 'Create GitOps applications', 'gitops'),
    ('gitops.app.read', 'View GitOps applications', 'gitops'),
    ('gitops.app.sync', 'Sync GitOps applications', 'gitops'),
    ('gitops.app.manage', 'Manage GitOps applications', 'gitops')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- END OF MIGRATION: Identity and RBAC Tables
-- ============================================================================
