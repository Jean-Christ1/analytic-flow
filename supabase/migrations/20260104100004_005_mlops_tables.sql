-- ============================================================================
-- MIGRATION: MLOps Core Tables
-- Schema: MLOps Control Plane v3
-- Author: Armand AMOUSSOU
-- Date: 2026-01-04
-- ============================================================================

-- ============================================================================
-- ENUMS FOR MLOPS
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE public.run_type AS ENUM ('job', 'workspace', 'pipeline_step', 'app', 'model_api');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.run_status AS ENUM ('queued', 'running', 'succeeded', 'failed', 'canceled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.run_trigger AS ENUM ('manual', 'schedule', 'webhook', 'api', 'cicd');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.artifact_kind AS ENUM ('model', 'dataset', 'report', 'file', 'plot');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.model_version_status AS ENUM ('draft', 'approved', 'deprecated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.deployment_status AS ENUM ('planned', 'syncing', 'healthy', 'degraded', 'failed', 'paused');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.rollout_strategy AS ENUM ('bluegreen', 'canary', 'rolling');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.workspace_ide AS ENUM ('vscode', 'jupyter', 'rstudio');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.workspace_session_status AS ENUM ('starting', 'running', 'stopped', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.app_type AS ENUM ('streamlit', 'gradio', 'custom');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- TABLE: experiment
-- Experiment containers for organizing ML runs
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.experiment (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.user_account(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.user_account(id) ON DELETE SET NULL,
    UNIQUE(project_id, name)
);

-- Enable RLS
ALTER TABLE public.experiment ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_experiment_tenant_id ON public.experiment(tenant_id);
CREATE INDEX IF NOT EXISTS idx_experiment_project_id ON public.experiment(project_id);
CREATE INDEX IF NOT EXISTS idx_experiment_name ON public.experiment(name);
CREATE INDEX IF NOT EXISTS idx_experiment_tags ON public.experiment USING gin(tags);

-- Comments
COMMENT ON TABLE public.experiment IS 'Experiment containers for organizing ML runs';
COMMENT ON COLUMN public.experiment.tags IS 'Array of tags for categorization';

-- ============================================================================
-- TABLE: run
-- ML runs (training jobs, workspaces, pipeline steps)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.run (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
    experiment_id UUID REFERENCES public.experiment(id) ON DELETE SET NULL,
    parent_run_id UUID REFERENCES public.run(id) ON DELETE SET NULL,
    type public.run_type NOT NULL DEFAULT 'job',
    status public.run_status NOT NULL DEFAULT 'queued',
    trigger public.run_trigger DEFAULT 'manual',
    status_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER GENERATED ALWAYS AS (
        CASE
            WHEN ended_at IS NOT NULL AND started_at IS NOT NULL
            THEN EXTRACT(EPOCH FROM (ended_at - started_at))::INTEGER * 1000
            ELSE NULL
        END
    ) STORED,
    compute_profile_id UUID REFERENCES public.compute_profile(id) ON DELETE SET NULL,
    environment_build_id UUID REFERENCES public.environment_build(id) ON DELETE SET NULL,
    cluster_id UUID REFERENCES public.k8s_cluster(id) ON DELETE SET NULL,
    namespace VARCHAR(63),
    k8s_workload_ref JSONB DEFAULT '{}'::jsonb,
    params JSONB DEFAULT '{}'::jsonb,
    metrics_summary JSONB DEFAULT '{}'::jsonb,
    logs_uri VARCHAR(500),
    artifacts_root_uri VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.user_account(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.user_account(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.run ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_run_tenant_id ON public.run(tenant_id);
CREATE INDEX IF NOT EXISTS idx_run_project_id ON public.run(project_id);
CREATE INDEX IF NOT EXISTS idx_run_experiment_id ON public.run(experiment_id);
CREATE INDEX IF NOT EXISTS idx_run_parent_run_id ON public.run(parent_run_id);
CREATE INDEX IF NOT EXISTS idx_run_type ON public.run(type);
CREATE INDEX IF NOT EXISTS idx_run_status ON public.run(status);
CREATE INDEX IF NOT EXISTS idx_run_trigger ON public.run(trigger);
CREATE INDEX IF NOT EXISTS idx_run_created_at ON public.run(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_run_created_by ON public.run(created_by);
CREATE INDEX IF NOT EXISTS idx_run_cluster_id ON public.run(cluster_id);

-- Comments
COMMENT ON TABLE public.run IS 'ML runs: training jobs, workspaces, pipeline steps, apps, model APIs';
COMMENT ON COLUMN public.run.type IS 'Run type: job, workspace, pipeline_step, app, model_api';
COMMENT ON COLUMN public.run.status IS 'Run status: queued, running, succeeded, failed, canceled';
COMMENT ON COLUMN public.run.k8s_workload_ref IS 'Kubernetes workload reference (pod name, job name, etc.)';
COMMENT ON COLUMN public.run.params IS 'Run parameters (hyperparameters, config)';
COMMENT ON COLUMN public.run.metrics_summary IS 'Summary metrics (accuracy, loss, etc.)';

-- ============================================================================
-- TABLE: run_metric
-- Time-series metrics for ML runs
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.run_metric (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    run_id UUID NOT NULL REFERENCES public.run(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    step INTEGER,
    value DOUBLE PRECISION,
    unit VARCHAR(50),
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.run_metric ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_run_metric_tenant_id ON public.run_metric(tenant_id);
CREATE INDEX IF NOT EXISTS idx_run_metric_run_id ON public.run_metric(run_id);
CREATE INDEX IF NOT EXISTS idx_run_metric_name ON public.run_metric(name);
CREATE INDEX IF NOT EXISTS idx_run_metric_step ON public.run_metric(run_id, name, step);
CREATE INDEX IF NOT EXISTS idx_run_metric_logged_at ON public.run_metric(logged_at DESC);

-- Comments
COMMENT ON TABLE public.run_metric IS 'Time-series metrics logged during ML runs';
COMMENT ON COLUMN public.run_metric.step IS 'Training step or epoch number';
COMMENT ON COLUMN public.run_metric.unit IS 'Metric unit (%, ms, GB, etc.)';

-- ============================================================================
-- TABLE: artifact
-- ML artifacts (models, datasets, reports, plots)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.artifact (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
    run_id UUID REFERENCES public.run(id) ON DELETE SET NULL,
    kind public.artifact_kind NOT NULL DEFAULT 'file',
    name VARCHAR(500) NOT NULL,
    uri VARCHAR(1000),
    content_hash VARCHAR(64),
    size_bytes BIGINT,
    mime_type VARCHAR(100),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.user_account(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.artifact ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_artifact_tenant_id ON public.artifact(tenant_id);
CREATE INDEX IF NOT EXISTS idx_artifact_project_id ON public.artifact(project_id);
CREATE INDEX IF NOT EXISTS idx_artifact_run_id ON public.artifact(run_id);
CREATE INDEX IF NOT EXISTS idx_artifact_kind ON public.artifact(kind);
CREATE INDEX IF NOT EXISTS idx_artifact_name ON public.artifact(name);
CREATE INDEX IF NOT EXISTS idx_artifact_content_hash ON public.artifact(content_hash);
CREATE INDEX IF NOT EXISTS idx_artifact_created_at ON public.artifact(created_at DESC);

-- Comments
COMMENT ON TABLE public.artifact IS 'ML artifacts: models, datasets, reports, files, plots';
COMMENT ON COLUMN public.artifact.kind IS 'Artifact type: model, dataset, report, file, plot';
COMMENT ON COLUMN public.artifact.uri IS 'Storage URI (s3://, gs://, etc.)';
COMMENT ON COLUMN public.artifact.content_hash IS 'SHA-256 hash for deduplication and integrity';
COMMENT ON COLUMN public.artifact.metadata IS 'Artifact metadata (format, version, schema, etc.)';

-- ============================================================================
-- TABLE: model
-- Model registry entries
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.model (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.user_account(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.user_account(id) ON DELETE SET NULL,
    UNIQUE(project_id, name)
);

-- Enable RLS
ALTER TABLE public.model ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_model_tenant_id ON public.model(tenant_id);
CREATE INDEX IF NOT EXISTS idx_model_project_id ON public.model(project_id);
CREATE INDEX IF NOT EXISTS idx_model_name ON public.model(name);
CREATE INDEX IF NOT EXISTS idx_model_tags ON public.model USING gin(tags);

-- Comments
COMMENT ON TABLE public.model IS 'Model registry for tracking ML models';
COMMENT ON COLUMN public.model.tags IS 'Array of tags for categorization';

-- ============================================================================
-- TABLE: model_version
-- Model versions with lineage and approval workflow
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.model_version (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    model_id UUID NOT NULL REFERENCES public.model(id) ON DELETE CASCADE,
    version INTEGER NOT NULL DEFAULT 1,
    source_run_id UUID REFERENCES public.run(id) ON DELETE SET NULL,
    artifact_id UUID REFERENCES public.artifact(id) ON DELETE SET NULL,
    signature JSONB DEFAULT '{}'::jsonb,
    metrics_summary JSONB DEFAULT '{}'::jsonb,
    status public.model_version_status NOT NULL DEFAULT 'draft',
    approval_required BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.user_account(id) ON DELETE SET NULL,
    UNIQUE(model_id, version)
);

-- Enable RLS
ALTER TABLE public.model_version ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_model_version_tenant_id ON public.model_version(tenant_id);
CREATE INDEX IF NOT EXISTS idx_model_version_model_id ON public.model_version(model_id);
CREATE INDEX IF NOT EXISTS idx_model_version_status ON public.model_version(status);
CREATE INDEX IF NOT EXISTS idx_model_version_source_run ON public.model_version(source_run_id);
CREATE INDEX IF NOT EXISTS idx_model_version_created_at ON public.model_version(created_at DESC);

-- Comments
COMMENT ON TABLE public.model_version IS 'Model versions with lineage tracking';
COMMENT ON COLUMN public.model_version.signature IS 'Model input/output signature (schema)';
COMMENT ON COLUMN public.model_version.metrics_summary IS 'Model performance metrics';
COMMENT ON COLUMN public.model_version.status IS 'Version status: draft, approved, deprecated';
COMMENT ON COLUMN public.model_version.approval_required IS 'Whether approval is required before deployment';

-- ============================================================================
-- FUNCTION: Auto-increment model version
-- ============================================================================

CREATE OR REPLACE FUNCTION public.increment_model_version()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.version IS NULL OR NEW.version = 1 THEN
        SELECT COALESCE(MAX(version), 0) + 1 INTO NEW.version
        FROM public.model_version
        WHERE model_id = NEW.model_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-incrementing version
DROP TRIGGER IF EXISTS trigger_increment_model_version ON public.model_version;
CREATE TRIGGER trigger_increment_model_version
    BEFORE INSERT ON public.model_version
    FOR EACH ROW
    EXECUTE FUNCTION public.increment_model_version();

-- ============================================================================
-- TABLE: model_deployment
-- Model deployments for inference endpoints
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.model_deployment (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
    model_version_id UUID NOT NULL REFERENCES public.model_version(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    cluster_id UUID REFERENCES public.k8s_cluster(id) ON DELETE SET NULL,
    namespace VARCHAR(63),
    endpoint_url VARCHAR(500),
    auth_policy JSONB DEFAULT '{}'::jsonb,
    scaling JSONB DEFAULT '{"min_replicas": 1, "max_replicas": 3}'::jsonb,
    resources JSONB DEFAULT '{}'::jsonb,
    rollout_strategy public.rollout_strategy DEFAULT 'rolling',
    status public.deployment_status NOT NULL DEFAULT 'planned',
    status_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.user_account(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.user_account(id) ON DELETE SET NULL,
    UNIQUE(project_id, name)
);

-- Enable RLS
ALTER TABLE public.model_deployment ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_model_deployment_tenant_id ON public.model_deployment(tenant_id);
CREATE INDEX IF NOT EXISTS idx_model_deployment_project_id ON public.model_deployment(project_id);
CREATE INDEX IF NOT EXISTS idx_model_deployment_model_version_id ON public.model_deployment(model_version_id);
CREATE INDEX IF NOT EXISTS idx_model_deployment_status ON public.model_deployment(status);
CREATE INDEX IF NOT EXISTS idx_model_deployment_cluster_id ON public.model_deployment(cluster_id);

-- Comments
COMMENT ON TABLE public.model_deployment IS 'Model deployments for inference endpoints';
COMMENT ON COLUMN public.model_deployment.endpoint_url IS 'Public endpoint URL for inference';
COMMENT ON COLUMN public.model_deployment.auth_policy IS 'Authentication policy (API key, OAuth, etc.)';
COMMENT ON COLUMN public.model_deployment.scaling IS 'Autoscaling configuration (min/max replicas, metrics)';
COMMENT ON COLUMN public.model_deployment.resources IS 'Resource configuration (CPU, memory, GPU)';
COMMENT ON COLUMN public.model_deployment.rollout_strategy IS 'Deployment rollout: bluegreen, canary, rolling';

-- ============================================================================
-- TABLE: workspace_session
-- Interactive workspace sessions (VSCode, Jupyter, RStudio)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.workspace_session (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_account(id) ON DELETE CASCADE,
    environment_build_id UUID REFERENCES public.environment_build(id) ON DELETE SET NULL,
    cluster_id UUID REFERENCES public.k8s_cluster(id) ON DELETE SET NULL,
    namespace VARCHAR(63),
    ide public.workspace_ide DEFAULT 'jupyter',
    url VARCHAR(500),
    status public.workspace_session_status NOT NULL DEFAULT 'starting',
    k8s_pod_ref JSONB DEFAULT '{}'::jsonb,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workspace_session ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workspace_session_tenant_id ON public.workspace_session(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workspace_session_project_id ON public.workspace_session(project_id);
CREATE INDEX IF NOT EXISTS idx_workspace_session_user_id ON public.workspace_session(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_session_status ON public.workspace_session(status);
CREATE INDEX IF NOT EXISTS idx_workspace_session_created_at ON public.workspace_session(created_at DESC);

-- Comments
COMMENT ON TABLE public.workspace_session IS 'Interactive workspace sessions for development';
COMMENT ON COLUMN public.workspace_session.ide IS 'IDE type: vscode, jupyter, rstudio';
COMMENT ON COLUMN public.workspace_session.url IS 'Access URL for the workspace';
COMMENT ON COLUMN public.workspace_session.k8s_pod_ref IS 'Kubernetes pod reference';

-- ============================================================================
-- TABLE: app
-- Deployed applications (Streamlit, Gradio, custom)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.app (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type public.app_type NOT NULL DEFAULT 'streamlit',
    spec JSONB DEFAULT '{}'::jsonb,
    url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'stopped',
    environment_build_id UUID REFERENCES public.environment_build(id) ON DELETE SET NULL,
    cluster_id UUID REFERENCES public.k8s_cluster(id) ON DELETE SET NULL,
    namespace VARCHAR(63),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.user_account(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.user_account(id) ON DELETE SET NULL,
    UNIQUE(project_id, name)
);

-- Enable RLS
ALTER TABLE public.app ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_app_tenant_id ON public.app(tenant_id);
CREATE INDEX IF NOT EXISTS idx_app_project_id ON public.app(project_id);
CREATE INDEX IF NOT EXISTS idx_app_type ON public.app(type);
CREATE INDEX IF NOT EXISTS idx_app_status ON public.app(status);

-- Comments
COMMENT ON TABLE public.app IS 'Deployed applications: Streamlit, Gradio, custom';
COMMENT ON COLUMN public.app.type IS 'Application type: streamlit, gradio, custom';
COMMENT ON COLUMN public.app.spec IS 'Application specification (entrypoint, args, env vars)';
COMMENT ON COLUMN public.app.url IS 'Public URL for accessing the app';

-- ============================================================================
-- TRIGGERS: Auto-update updated_at
-- ============================================================================

-- Experiment
DROP TRIGGER IF EXISTS set_experiment_updated_at ON public.experiment;
CREATE TRIGGER set_experiment_updated_at
    BEFORE UPDATE ON public.experiment
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- Run
DROP TRIGGER IF EXISTS set_run_updated_at ON public.run;
CREATE TRIGGER set_run_updated_at
    BEFORE UPDATE ON public.run
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- Model
DROP TRIGGER IF EXISTS set_model_updated_at ON public.model;
CREATE TRIGGER set_model_updated_at
    BEFORE UPDATE ON public.model
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- Model Deployment
DROP TRIGGER IF EXISTS set_model_deployment_updated_at ON public.model_deployment;
CREATE TRIGGER set_model_deployment_updated_at
    BEFORE UPDATE ON public.model_deployment
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- App
DROP TRIGGER IF EXISTS set_app_updated_at ON public.app;
CREATE TRIGGER set_app_updated_at
    BEFORE UPDATE ON public.app
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- END OF MIGRATION: MLOps Core Tables
-- ============================================================================
