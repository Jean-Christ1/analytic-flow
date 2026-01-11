-- ============================================================================
-- MIGRATION: CI/CD and GitOps Tables
-- Schema: MLOps Control Plane v3
-- Author: Armand AMOUSSOU
-- Date: 2026-01-04
-- ============================================================================

-- ============================================================================
-- ENUMS FOR CI/CD AND GITOPS
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE public.git_provider_type AS ENUM ('gitlab', 'github', 'bitbucket');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.gitlab_mode AS ENUM ('saas', 'self_managed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.cicd_pipeline_source AS ENUM ('push', 'merge_request', 'schedule', 'web', 'api', 'parent_pipeline');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.cicd_pipeline_status AS ENUM ('created', 'pending', 'running', 'success', 'failed', 'canceled', 'skipped', 'manual');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.cicd_job_status AS ENUM ('created', 'pending', 'running', 'success', 'failed', 'canceled', 'skipped', 'manual');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.cicd_environment_tier AS ENUM ('development', 'staging', 'production');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.quality_gate_type AS ENUM ('tests', 'security', 'lint', 'coverage', 'sast', 'dast', 'license', 'iac_scan');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.quality_gate_status AS ENUM ('pass', 'warn', 'fail');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.cicd_artifact_type AS ENUM ('archive', 'dotenv', 'junit', 'coverage', 'sbom', 'container_scan', 'terraform_plan', 'helm_chart');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.argocd_sync_status AS ENUM ('unknown', 'syncing', 'synced', 'outofsync', 'error');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.argocd_health_status AS ENUM ('healthy', 'progressing', 'degraded', 'missing', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.drift_severity AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.drift_status AS ENUM ('open', 'acknowledged', 'resolved');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- TABLE: gitlab_instance
-- GitLab instance configurations
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.gitlab_instance (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    base_url VARCHAR(500) DEFAULT 'https://gitlab.com',
    mode public.gitlab_mode NOT NULL DEFAULT 'saas',
    api_version VARCHAR(10) DEFAULT 'v4',
    auth_secret_ref UUID REFERENCES public.secret_ref(id) ON DELETE SET NULL,
    webhook_secret_ref UUID REFERENCES public.secret_ref(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, name)
);

-- Enable RLS
ALTER TABLE public.gitlab_instance ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gitlab_instance_tenant_id ON public.gitlab_instance(tenant_id);

-- Comments
COMMENT ON TABLE public.gitlab_instance IS 'GitLab instance configurations for CI/CD integration';
COMMENT ON COLUMN public.gitlab_instance.mode IS 'GitLab mode: saas (gitlab.com) or self_managed';
COMMENT ON COLUMN public.gitlab_instance.auth_secret_ref IS 'Reference to API token secret';

-- ============================================================================
-- TABLE: git_provider
-- Generic Git provider configurations
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.git_provider (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type public.git_provider_type NOT NULL,
    base_url VARCHAR(500),
    app_installation_ref JSONB DEFAULT '{}'::jsonb,
    auth_secret_ref UUID REFERENCES public.secret_ref(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, name)
);

-- Enable RLS
ALTER TABLE public.git_provider ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_git_provider_tenant_id ON public.git_provider(tenant_id);
CREATE INDEX IF NOT EXISTS idx_git_provider_type ON public.git_provider(type);

-- Comments
COMMENT ON TABLE public.git_provider IS 'Git provider configurations (GitHub, GitLab, Bitbucket)';
COMMENT ON COLUMN public.git_provider.app_installation_ref IS 'GitHub App installation ID or similar';

-- ============================================================================
-- TABLE: repo_binding
-- Repository bindings to projects
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.repo_binding (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES public.git_provider(id) ON DELETE CASCADE,
    repo_full_name VARCHAR(500) NOT NULL,
    default_branch VARCHAR(100) DEFAULT 'main',
    webhook_secret_ref UUID REFERENCES public.secret_ref(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(project_id, repo_full_name)
);

-- Enable RLS
ALTER TABLE public.repo_binding ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_repo_binding_tenant_id ON public.repo_binding(tenant_id);
CREATE INDEX IF NOT EXISTS idx_repo_binding_project_id ON public.repo_binding(project_id);
CREATE INDEX IF NOT EXISTS idx_repo_binding_provider_id ON public.repo_binding(provider_id);
CREATE INDEX IF NOT EXISTS idx_repo_binding_repo ON public.repo_binding(repo_full_name);

-- Comments
COMMENT ON TABLE public.repo_binding IS 'Repository bindings linking Git repos to projects';
COMMENT ON COLUMN public.repo_binding.repo_full_name IS 'Full repository name (e.g., org/repo)';

-- ============================================================================
-- TABLE: cicd_pipeline
-- CI/CD pipeline executions (GitLab CI, GitHub Actions, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cicd_pipeline (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
    gitlab_instance_id UUID REFERENCES public.gitlab_instance(id) ON DELETE SET NULL,
    repo_full_name VARCHAR(500),
    pipeline_iid INTEGER,
    pipeline_id_external VARCHAR(100),
    source public.cicd_pipeline_source,
    ref VARCHAR(255),
    sha VARCHAR(40),
    mr_iid INTEGER,
    status public.cicd_pipeline_status NOT NULL DEFAULT 'created',
    detailed_status VARCHAR(100),
    started_at TIMESTAMP WITH TIME ZONE,
    finished_at TIMESTAMP WITH TIME ZONE,
    duration_sec INTEGER,
    queued_duration_sec INTEGER,
    user_external_id VARCHAR(255),
    web_url VARCHAR(1000),
    variables JSONB DEFAULT '{}'::jsonb,
    coverage DECIMAL(5, 2),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cicd_pipeline ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cicd_pipeline_tenant_id ON public.cicd_pipeline(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cicd_pipeline_project_id ON public.cicd_pipeline(project_id);
CREATE INDEX IF NOT EXISTS idx_cicd_pipeline_gitlab_instance ON public.cicd_pipeline(gitlab_instance_id);
CREATE INDEX IF NOT EXISTS idx_cicd_pipeline_status ON public.cicd_pipeline(status);
CREATE INDEX IF NOT EXISTS idx_cicd_pipeline_ref ON public.cicd_pipeline(ref);
CREATE INDEX IF NOT EXISTS idx_cicd_pipeline_sha ON public.cicd_pipeline(sha);
CREATE INDEX IF NOT EXISTS idx_cicd_pipeline_created_at ON public.cicd_pipeline(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cicd_pipeline_repo_iid ON public.cicd_pipeline(repo_full_name, pipeline_iid);

-- Comments
COMMENT ON TABLE public.cicd_pipeline IS 'CI/CD pipeline executions from GitLab CI, GitHub Actions, etc.';
COMMENT ON COLUMN public.cicd_pipeline.pipeline_iid IS 'GitLab internal pipeline ID';
COMMENT ON COLUMN public.cicd_pipeline.source IS 'Pipeline trigger source';
COMMENT ON COLUMN public.cicd_pipeline.coverage IS 'Test coverage percentage';

-- ============================================================================
-- TABLE: cicd_stage
-- CI/CD pipeline stages
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cicd_stage (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    pipeline_id UUID NOT NULL REFERENCES public.cicd_pipeline(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50),
    started_at TIMESTAMP WITH TIME ZONE,
    finished_at TIMESTAMP WITH TIME ZONE,
    duration_sec INTEGER,
    UNIQUE(pipeline_id, name)
);

-- Enable RLS
ALTER TABLE public.cicd_stage ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cicd_stage_tenant_id ON public.cicd_stage(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cicd_stage_pipeline_id ON public.cicd_stage(pipeline_id);

-- Comments
COMMENT ON TABLE public.cicd_stage IS 'CI/CD pipeline stages';

-- ============================================================================
-- TABLE: cicd_job
-- CI/CD pipeline jobs
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cicd_job (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    pipeline_id UUID NOT NULL REFERENCES public.cicd_pipeline(id) ON DELETE CASCADE,
    stage_id UUID REFERENCES public.cicd_stage(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    job_id_external VARCHAR(100),
    status public.cicd_job_status NOT NULL DEFAULT 'created',
    allow_failure BOOLEAN DEFAULT false,
    when_run VARCHAR(50),
    started_at TIMESTAMP WITH TIME ZONE,
    finished_at TIMESTAMP WITH TIME ZONE,
    duration_sec INTEGER,
    runner_description VARCHAR(255),
    runner_tags JSONB DEFAULT '[]'::jsonb,
    image VARCHAR(500),
    script_summary TEXT,
    artifacts_expire_at TIMESTAMP WITH TIME ZONE,
    log_url VARCHAR(1000),
    failure_reason TEXT,
    exit_code INTEGER,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cicd_job ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cicd_job_tenant_id ON public.cicd_job(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cicd_job_pipeline_id ON public.cicd_job(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_cicd_job_stage_id ON public.cicd_job(stage_id);
CREATE INDEX IF NOT EXISTS idx_cicd_job_status ON public.cicd_job(status);
CREATE INDEX IF NOT EXISTS idx_cicd_job_name ON public.cicd_job(name);

-- Comments
COMMENT ON TABLE public.cicd_job IS 'CI/CD pipeline jobs with execution details';
COMMENT ON COLUMN public.cicd_job.when_run IS 'Job trigger condition: on_success, on_failure, always, manual';
COMMENT ON COLUMN public.cicd_job.runner_tags IS 'GitLab runner tags used';

-- ============================================================================
-- TABLE: cicd_job_artifact
-- CI/CD job artifacts
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cicd_job_artifact (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES public.cicd_job(id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    type public.cicd_artifact_type,
    uri VARCHAR(1000),
    size_bytes BIGINT,
    checksum VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cicd_job_artifact ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cicd_job_artifact_tenant_id ON public.cicd_job_artifact(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cicd_job_artifact_job_id ON public.cicd_job_artifact(job_id);
CREATE INDEX IF NOT EXISTS idx_cicd_job_artifact_type ON public.cicd_job_artifact(type);

-- Comments
COMMENT ON TABLE public.cicd_job_artifact IS 'CI/CD job artifacts (test reports, coverage, SBOMs, etc.)';
COMMENT ON COLUMN public.cicd_job_artifact.type IS 'Artifact type: archive, junit, coverage, sbom, etc.';

-- ============================================================================
-- TABLE: cicd_environment
-- CI/CD deployment environments
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cicd_environment (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100),
    tier public.cicd_environment_tier DEFAULT 'development',
    external_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(project_id, name)
);

-- Enable RLS
ALTER TABLE public.cicd_environment ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cicd_environment_tenant_id ON public.cicd_environment(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cicd_environment_project_id ON public.cicd_environment(project_id);
CREATE INDEX IF NOT EXISTS idx_cicd_environment_tier ON public.cicd_environment(tier);

-- Comments
COMMENT ON TABLE public.cicd_environment IS 'CI/CD deployment environments (dev, staging, production)';
COMMENT ON COLUMN public.cicd_environment.tier IS 'Environment tier for deployment ordering';

-- ============================================================================
-- TABLE: cicd_deployment
-- CI/CD deployments to environments
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cicd_deployment (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    pipeline_id UUID NOT NULL REFERENCES public.cicd_pipeline(id) ON DELETE CASCADE,
    environment_id UUID NOT NULL REFERENCES public.cicd_environment(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'created',
    deployed_at TIMESTAMP WITH TIME ZONE,
    deployable_ref JSONB DEFAULT '{}'::jsonb,
    release_tag VARCHAR(100),
    change_log TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cicd_deployment ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cicd_deployment_tenant_id ON public.cicd_deployment(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cicd_deployment_pipeline_id ON public.cicd_deployment(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_cicd_deployment_environment_id ON public.cicd_deployment(environment_id);
CREATE INDEX IF NOT EXISTS idx_cicd_deployment_deployed_at ON public.cicd_deployment(deployed_at DESC);

-- Comments
COMMENT ON TABLE public.cicd_deployment IS 'CI/CD deployments to environments';
COMMENT ON COLUMN public.cicd_deployment.deployable_ref IS 'Reference to deployable resource';

-- ============================================================================
-- TABLE: cicd_quality_gate
-- CI/CD quality gates (tests, security, lint, coverage)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cicd_quality_gate (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    pipeline_id UUID NOT NULL REFERENCES public.cicd_pipeline(id) ON DELETE CASCADE,
    gate_type public.quality_gate_type NOT NULL,
    status public.quality_gate_status NOT NULL DEFAULT 'pass',
    summary TEXT,
    metrics JSONB DEFAULT '{}'::jsonb,
    report_artifact_id UUID REFERENCES public.cicd_job_artifact(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(pipeline_id, gate_type)
);

-- Enable RLS
ALTER TABLE public.cicd_quality_gate ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cicd_quality_gate_tenant_id ON public.cicd_quality_gate(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cicd_quality_gate_pipeline_id ON public.cicd_quality_gate(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_cicd_quality_gate_type ON public.cicd_quality_gate(gate_type);
CREATE INDEX IF NOT EXISTS idx_cicd_quality_gate_status ON public.cicd_quality_gate(status);

-- Comments
COMMENT ON TABLE public.cicd_quality_gate IS 'CI/CD quality gates for pipeline validation';
COMMENT ON COLUMN public.cicd_quality_gate.metrics IS 'Gate metrics (coverage %, test count, vulnerabilities, etc.)';

-- ============================================================================
-- TABLE: cicd_pipeline_link
-- Links CI/CD pipelines to other entities
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cicd_pipeline_link (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    pipeline_id UUID NOT NULL REFERENCES public.cicd_pipeline(id) ON DELETE CASCADE,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(pipeline_id, entity_type, entity_id)
);

-- Enable RLS
ALTER TABLE public.cicd_pipeline_link ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cicd_pipeline_link_tenant_id ON public.cicd_pipeline_link(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cicd_pipeline_link_pipeline_id ON public.cicd_pipeline_link(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_cicd_pipeline_link_entity ON public.cicd_pipeline_link(entity_type, entity_id);

-- Comments
COMMENT ON TABLE public.cicd_pipeline_link IS 'Links pipelines to other entities (builds, deployments, releases)';
COMMENT ON COLUMN public.cicd_pipeline_link.entity_type IS 'Entity type: environment_build, model_version, release, argocd_application, infra_change';

-- ============================================================================
-- TABLE: argocd_instance
-- ArgoCD instance configurations
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.argocd_instance (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    base_url VARCHAR(500),
    cluster_id UUID REFERENCES public.k8s_cluster(id) ON DELETE SET NULL,
    auth_secret_ref UUID REFERENCES public.secret_ref(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, name)
);

-- Enable RLS
ALTER TABLE public.argocd_instance ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_argocd_instance_tenant_id ON public.argocd_instance(tenant_id);
CREATE INDEX IF NOT EXISTS idx_argocd_instance_cluster_id ON public.argocd_instance(cluster_id);

-- Comments
COMMENT ON TABLE public.argocd_instance IS 'ArgoCD instance configurations for GitOps';

-- ============================================================================
-- TABLE: argocd_application
-- ArgoCD applications
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.argocd_application (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
    argocd_instance_id UUID NOT NULL REFERENCES public.argocd_instance(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    app_project VARCHAR(255) DEFAULT 'default',
    source_repo VARCHAR(500),
    source_path VARCHAR(500),
    source_target_revision VARCHAR(255) DEFAULT 'HEAD',
    helm_values JSONB DEFAULT '{}'::jsonb,
    kustomize JSONB DEFAULT '{}'::jsonb,
    destination_cluster VARCHAR(500),
    destination_namespace VARCHAR(63),
    sync_policy JSONB DEFAULT '{"automated": {"prune": false, "selfHeal": false}}'::jsonb,
    status public.argocd_sync_status NOT NULL DEFAULT 'unknown',
    health public.argocd_health_status NOT NULL DEFAULT 'missing',
    conditions JSONB DEFAULT '[]'::jsonb,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(argocd_instance_id, name)
);

-- Enable RLS
ALTER TABLE public.argocd_application ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_argocd_application_tenant_id ON public.argocd_application(tenant_id);
CREATE INDEX IF NOT EXISTS idx_argocd_application_project_id ON public.argocd_application(project_id);
CREATE INDEX IF NOT EXISTS idx_argocd_application_instance ON public.argocd_application(argocd_instance_id);
CREATE INDEX IF NOT EXISTS idx_argocd_application_status ON public.argocd_application(status);
CREATE INDEX IF NOT EXISTS idx_argocd_application_health ON public.argocd_application(health);

-- Comments
COMMENT ON TABLE public.argocd_application IS 'ArgoCD applications for GitOps deployments';
COMMENT ON COLUMN public.argocd_application.sync_policy IS 'ArgoCD sync policy (automated, selfHeal, prune)';

-- ============================================================================
-- TABLE: argocd_sync_history
-- ArgoCD sync history
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.argocd_sync_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES public.argocd_application(id) ON DELETE CASCADE,
    revision VARCHAR(100),
    initiated_by VARCHAR(255),
    operation_phase VARCHAR(50),
    sync_status VARCHAR(50),
    health_status VARCHAR(50),
    started_at TIMESTAMP WITH TIME ZONE,
    finished_at TIMESTAMP WITH TIME ZONE,
    message TEXT,
    resources JSONB DEFAULT '[]'::jsonb
);

-- Enable RLS
ALTER TABLE public.argocd_sync_history ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_argocd_sync_history_tenant_id ON public.argocd_sync_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_argocd_sync_history_application ON public.argocd_sync_history(application_id);
CREATE INDEX IF NOT EXISTS idx_argocd_sync_history_started_at ON public.argocd_sync_history(started_at DESC);

-- Comments
COMMENT ON TABLE public.argocd_sync_history IS 'ArgoCD application sync history';

-- ============================================================================
-- TABLE: argocd_resource_status
-- ArgoCD managed resource status
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.argocd_resource_status (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES public.argocd_application(id) ON DELETE CASCADE,
    group_name VARCHAR(255),
    kind VARCHAR(100),
    namespace VARCHAR(63),
    name VARCHAR(255),
    sync_status VARCHAR(50),
    health_status VARCHAR(50),
    hook BOOLEAN DEFAULT false,
    requires_pruning BOOLEAN DEFAULT false,
    message TEXT,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.argocd_resource_status ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_argocd_resource_status_tenant_id ON public.argocd_resource_status(tenant_id);
CREATE INDEX IF NOT EXISTS idx_argocd_resource_status_application ON public.argocd_resource_status(application_id);
CREATE INDEX IF NOT EXISTS idx_argocd_resource_status_kind ON public.argocd_resource_status(kind);

-- Comments
COMMENT ON TABLE public.argocd_resource_status IS 'ArgoCD managed Kubernetes resource status';

-- ============================================================================
-- TABLE: argocd_event
-- ArgoCD events
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.argocd_event (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES public.argocd_application(id) ON DELETE CASCADE,
    type VARCHAR(50),
    reason VARCHAR(255),
    message TEXT,
    involved_object JSONB DEFAULT '{}'::jsonb,
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.argocd_event ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_argocd_event_tenant_id ON public.argocd_event(tenant_id);
CREATE INDEX IF NOT EXISTS idx_argocd_event_application ON public.argocd_event(application_id);
CREATE INDEX IF NOT EXISTS idx_argocd_event_occurred_at ON public.argocd_event(occurred_at DESC);

-- Comments
COMMENT ON TABLE public.argocd_event IS 'ArgoCD application events';

-- ============================================================================
-- TABLE: argocd_drift_finding
-- ArgoCD configuration drift findings
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.argocd_drift_finding (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES public.argocd_application(id) ON DELETE CASCADE,
    severity public.drift_severity NOT NULL DEFAULT 'low',
    resource_key VARCHAR(500),
    diff_summary TEXT,
    diff_uri VARCHAR(500),
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    status public.drift_status NOT NULL DEFAULT 'open',
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES public.user_account(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.argocd_drift_finding ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_argocd_drift_finding_tenant_id ON public.argocd_drift_finding(tenant_id);
CREATE INDEX IF NOT EXISTS idx_argocd_drift_finding_application ON public.argocd_drift_finding(application_id);
CREATE INDEX IF NOT EXISTS idx_argocd_drift_finding_severity ON public.argocd_drift_finding(severity);
CREATE INDEX IF NOT EXISTS idx_argocd_drift_finding_status ON public.argocd_drift_finding(status);

-- Comments
COMMENT ON TABLE public.argocd_drift_finding IS 'Configuration drift findings from ArgoCD';
COMMENT ON COLUMN public.argocd_drift_finding.resource_key IS 'Resource identifier (group/kind/namespace/name)';

-- ============================================================================
-- TABLE: release
-- Software releases
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.release (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    version VARCHAR(100),
    git_ref VARCHAR(255),
    commit_sha VARCHAR(40),
    changelog TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.user_account(id) ON DELETE SET NULL,
    UNIQUE(project_id, version)
);

-- Enable RLS
ALTER TABLE public.release ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_release_tenant_id ON public.release(tenant_id);
CREATE INDEX IF NOT EXISTS idx_release_project_id ON public.release(project_id);
CREATE INDEX IF NOT EXISTS idx_release_version ON public.release(version);
CREATE INDEX IF NOT EXISTS idx_release_created_at ON public.release(created_at DESC);

-- Comments
COMMENT ON TABLE public.release IS 'Software releases with version tracking';
COMMENT ON COLUMN public.release.version IS 'Semantic version (e.g., 1.2.3)';

-- ============================================================================
-- TABLE: release_link
-- Links releases to deployments and pipelines
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.release_link (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    release_id UUID NOT NULL REFERENCES public.release(id) ON DELETE CASCADE,
    cicd_pipeline_id UUID REFERENCES public.cicd_pipeline(id) ON DELETE SET NULL,
    argocd_application_id UUID REFERENCES public.argocd_application(id) ON DELETE SET NULL,
    model_deployment_id UUID REFERENCES public.model_deployment(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.release_link ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_release_link_tenant_id ON public.release_link(tenant_id);
CREATE INDEX IF NOT EXISTS idx_release_link_release_id ON public.release_link(release_id);
CREATE INDEX IF NOT EXISTS idx_release_link_pipeline ON public.release_link(cicd_pipeline_id);
CREATE INDEX IF NOT EXISTS idx_release_link_argocd ON public.release_link(argocd_application_id);
CREATE INDEX IF NOT EXISTS idx_release_link_deployment ON public.release_link(model_deployment_id);

-- Comments
COMMENT ON TABLE public.release_link IS 'Links releases to CI/CD pipelines, ArgoCD apps, and deployments';

-- ============================================================================
-- TRIGGERS: Auto-update updated_at
-- ============================================================================

-- GitLab Instance
DROP TRIGGER IF EXISTS set_gitlab_instance_updated_at ON public.gitlab_instance;
CREATE TRIGGER set_gitlab_instance_updated_at
    BEFORE UPDATE ON public.gitlab_instance
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- Git Provider
DROP TRIGGER IF EXISTS set_git_provider_updated_at ON public.git_provider;
CREATE TRIGGER set_git_provider_updated_at
    BEFORE UPDATE ON public.git_provider
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- Repo Binding
DROP TRIGGER IF EXISTS set_repo_binding_updated_at ON public.repo_binding;
CREATE TRIGGER set_repo_binding_updated_at
    BEFORE UPDATE ON public.repo_binding
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- CICD Pipeline
DROP TRIGGER IF EXISTS set_cicd_pipeline_updated_at ON public.cicd_pipeline;
CREATE TRIGGER set_cicd_pipeline_updated_at
    BEFORE UPDATE ON public.cicd_pipeline
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- CICD Environment
DROP TRIGGER IF EXISTS set_cicd_environment_updated_at ON public.cicd_environment;
CREATE TRIGGER set_cicd_environment_updated_at
    BEFORE UPDATE ON public.cicd_environment
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- ArgoCD Instance
DROP TRIGGER IF EXISTS set_argocd_instance_updated_at ON public.argocd_instance;
CREATE TRIGGER set_argocd_instance_updated_at
    BEFORE UPDATE ON public.argocd_instance
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- ArgoCD Application
DROP TRIGGER IF EXISTS set_argocd_application_updated_at ON public.argocd_application;
CREATE TRIGGER set_argocd_application_updated_at
    BEFORE UPDATE ON public.argocd_application
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- END OF MIGRATION: CI/CD and GitOps Tables
-- ============================================================================
