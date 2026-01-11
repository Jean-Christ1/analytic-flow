-- ============================================================================
-- MIGRATION: MLOps Extended Tables
-- Schema: MLOps Control Plane v3
-- Author: Armand AMOUSSOU
-- Date: 2026-01-04
-- Description: Additional MLOps tables for runs, metrics, artifacts, workspaces
-- ============================================================================

-- ============================================================================
-- TABLE: run_param
-- Run parameters (hyperparameters, configuration values)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.run_param (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    run_id UUID NOT NULL REFERENCES public.run(id) ON DELETE CASCADE,
    key VARCHAR(255) NOT NULL,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(run_id, key)
);

-- Enable RLS
ALTER TABLE public.run_param ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_run_param_tenant_id ON public.run_param(tenant_id);
CREATE INDEX IF NOT EXISTS idx_run_param_run_id ON public.run_param(run_id);
CREATE INDEX IF NOT EXISTS idx_run_param_key ON public.run_param(key);

-- Comments
COMMENT ON TABLE public.run_param IS 'Run parameters: hyperparameters and configuration values';
COMMENT ON COLUMN public.run_param.key IS 'Parameter name';
COMMENT ON COLUMN public.run_param.value IS 'Parameter value (stored as text)';

-- ============================================================================
-- TABLE: metric_definition
-- Metric definitions with goals and thresholds
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.metric_definition (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
    key VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    description TEXT,
    metric_type VARCHAR(50) DEFAULT 'scalar',
    unit VARCHAR(50),
    goal_direction VARCHAR(20) CHECK (goal_direction IN ('minimize', 'maximize')),
    goal_value DOUBLE PRECISION,
    warning_threshold DOUBLE PRECISION,
    alert_threshold DOUBLE PRECISION,
    tags JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(project_id, key)
);

-- Enable RLS
ALTER TABLE public.metric_definition ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_metric_definition_tenant_id ON public.metric_definition(tenant_id);
CREATE INDEX IF NOT EXISTS idx_metric_definition_project_id ON public.metric_definition(project_id);
CREATE INDEX IF NOT EXISTS idx_metric_definition_key ON public.metric_definition(key);
CREATE INDEX IF NOT EXISTS idx_metric_definition_tags ON public.metric_definition USING gin(tags);

-- Comments
COMMENT ON TABLE public.metric_definition IS 'Metric definitions with goals and alert thresholds';
COMMENT ON COLUMN public.metric_definition.metric_type IS 'Metric type: scalar, histogram, image, etc.';
COMMENT ON COLUMN public.metric_definition.goal_direction IS 'Whether to minimize or maximize this metric';
COMMENT ON COLUMN public.metric_definition.warning_threshold IS 'Threshold for warning alerts';
COMMENT ON COLUMN public.metric_definition.alert_threshold IS 'Threshold for critical alerts';

-- ============================================================================
-- TABLE: metric_alert
-- Metric alerts when thresholds are breached
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.metric_alert (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    metric_key VARCHAR(255) NOT NULL,
    run_id UUID NOT NULL REFERENCES public.run(id) ON DELETE CASCADE,
    alert_type VARCHAR(20) NOT NULL CHECK (alert_type IN ('warning', 'critical')),
    message TEXT,
    current_value DOUBLE PRECISION,
    threshold_value DOUBLE PRECISION,
    acknowledged BOOLEAN NOT NULL DEFAULT false,
    acknowledged_by UUID REFERENCES public.user_account(id) ON DELETE SET NULL,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.metric_alert ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_metric_alert_tenant_id ON public.metric_alert(tenant_id);
CREATE INDEX IF NOT EXISTS idx_metric_alert_run_id ON public.metric_alert(run_id);
CREATE INDEX IF NOT EXISTS idx_metric_alert_metric_key ON public.metric_alert(metric_key);
CREATE INDEX IF NOT EXISTS idx_metric_alert_alert_type ON public.metric_alert(alert_type);
CREATE INDEX IF NOT EXISTS idx_metric_alert_acknowledged ON public.metric_alert(acknowledged);
CREATE INDEX IF NOT EXISTS idx_metric_alert_created_at ON public.metric_alert(created_at DESC);

-- Comments
COMMENT ON TABLE public.metric_alert IS 'Metric alerts when thresholds are breached';
COMMENT ON COLUMN public.metric_alert.alert_type IS 'Alert type: warning or critical';
COMMENT ON COLUMN public.metric_alert.acknowledged IS 'Whether the alert has been acknowledged';

-- ============================================================================
-- TABLE: workspace
-- ML Workspaces (extended from workspace_session)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.workspace (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_account(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    workspace_type VARCHAR(50) NOT NULL DEFAULT 'jupyter',
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    size VARCHAR(50) DEFAULT 'medium',
    compute_profile_id UUID REFERENCES public.compute_profile(id) ON DELETE SET NULL,
    cluster_id UUID NOT NULL REFERENCES public.k8s_cluster(id) ON DELETE CASCADE,
    namespace VARCHAR(63) DEFAULT 'default',
    image VARCHAR(500) NOT NULL,
    image_version VARCHAR(100),
    environment_id UUID REFERENCES public.environment(id) ON DELETE SET NULL,
    git_repo_url VARCHAR(500),
    git_branch VARCHAR(255),
    auto_shutdown_minutes INTEGER,
    idle_timeout_minutes INTEGER,
    endpoint_url VARCHAR(500),
    internal_url VARCHAR(500),
    pod_name VARCHAR(255),
    resources_allocated JSONB DEFAULT '{}'::jsonb,
    resources_used JSONB DEFAULT '{}'::jsonb,
    environment_vars JSONB DEFAULT '{}'::jsonb,
    volumes JSONB DEFAULT '[]'::jsonb,
    ports JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    started_at TIMESTAMP WITH TIME ZONE,
    stopped_at TIMESTAMP WITH TIME ZONE,
    last_activity_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workspace ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workspace_tenant_id ON public.workspace(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workspace_project_id ON public.workspace(project_id);
CREATE INDEX IF NOT EXISTS idx_workspace_user_id ON public.workspace(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_status ON public.workspace(status);
CREATE INDEX IF NOT EXISTS idx_workspace_workspace_type ON public.workspace(workspace_type);
CREATE INDEX IF NOT EXISTS idx_workspace_cluster_id ON public.workspace(cluster_id);
CREATE INDEX IF NOT EXISTS idx_workspace_created_at ON public.workspace(created_at DESC);

-- Comments
COMMENT ON TABLE public.workspace IS 'ML Workspaces: Jupyter, VSCode, RStudio, Terminal';
COMMENT ON COLUMN public.workspace.workspace_type IS 'Workspace type: jupyter, vscode, rstudio, terminal, custom';
COMMENT ON COLUMN public.workspace.status IS 'Workspace status: pending, provisioning, running, stopping, stopped, failed, terminated';
COMMENT ON COLUMN public.workspace.size IS 'Resource size preset: small, medium, large, xlarge, custom';
COMMENT ON COLUMN public.workspace.volumes IS 'Array of volume mount configurations';
COMMENT ON COLUMN public.workspace.ports IS 'Array of port configurations';

-- ============================================================================
-- TABLE: workspace_template
-- Workspace templates for quick creation
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.workspace_template (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    workspace_type VARCHAR(50) NOT NULL DEFAULT 'jupyter',
    image VARCHAR(500) NOT NULL,
    image_version VARCHAR(100),
    default_size VARCHAR(50) DEFAULT 'medium',
    default_compute_profile_id UUID REFERENCES public.compute_profile(id) ON DELETE SET NULL,
    default_environment_vars JSONB DEFAULT '{}'::jsonb,
    default_volumes JSONB DEFAULT '[]'::jsonb,
    default_ports JSONB DEFAULT '[]'::jsonb,
    is_public BOOLEAN NOT NULL DEFAULT false,
    is_default BOOLEAN NOT NULL DEFAULT false,
    tags JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workspace_template ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workspace_template_tenant_id ON public.workspace_template(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workspace_template_workspace_type ON public.workspace_template(workspace_type);
CREATE INDEX IF NOT EXISTS idx_workspace_template_is_public ON public.workspace_template(is_public);
CREATE INDEX IF NOT EXISTS idx_workspace_template_is_default ON public.workspace_template(is_default);
CREATE INDEX IF NOT EXISTS idx_workspace_template_tags ON public.workspace_template USING gin(tags);

-- Comments
COMMENT ON TABLE public.workspace_template IS 'Workspace templates for quick workspace creation';
COMMENT ON COLUMN public.workspace_template.is_public IS 'Whether template is available to all tenants';
COMMENT ON COLUMN public.workspace_template.is_default IS 'Whether this is the default template for its type';

-- ============================================================================
-- TABLE: workspace_session_log
-- Workspace session activity logs
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.workspace_session_log (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES public.workspace(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_account(id) ON DELETE CASCADE,
    session_type VARCHAR(50) DEFAULT 'interactive',
    status VARCHAR(50) DEFAULT 'active',
    token VARCHAR(500),
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    ended_at TIMESTAMP WITH TIME ZONE,
    last_heartbeat_at TIMESTAMP WITH TIME ZONE,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.workspace_session_log ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workspace_session_log_workspace_id ON public.workspace_session_log(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_session_log_user_id ON public.workspace_session_log(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_session_log_status ON public.workspace_session_log(status);
CREATE INDEX IF NOT EXISTS idx_workspace_session_log_started_at ON public.workspace_session_log(started_at DESC);

-- Comments
COMMENT ON TABLE public.workspace_session_log IS 'Workspace session activity logs';
COMMENT ON COLUMN public.workspace_session_log.session_type IS 'Session type: interactive, api, scheduled';
COMMENT ON COLUMN public.workspace_session_log.status IS 'Session status: active, closed, expired';

-- ============================================================================
-- TRIGGERS: Auto-update updated_at for new tables
-- ============================================================================

-- Metric Definition
DROP TRIGGER IF EXISTS set_metric_definition_updated_at ON public.metric_definition;
CREATE TRIGGER set_metric_definition_updated_at
    BEFORE UPDATE ON public.metric_definition
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- Workspace
DROP TRIGGER IF EXISTS set_workspace_updated_at ON public.workspace;
CREATE TRIGGER set_workspace_updated_at
    BEFORE UPDATE ON public.workspace
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- Workspace Template
DROP TRIGGER IF EXISTS set_workspace_template_updated_at ON public.workspace_template;
CREATE TRIGGER set_workspace_template_updated_at
    BEFORE UPDATE ON public.workspace_template
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- RLS POLICIES FOR NEW TABLES
-- ============================================================================

-- run_param policies
CREATE POLICY "Users can view run params in their tenant"
    ON public.run_param FOR SELECT
    USING (tenant_id IN (
        SELECT tenant_id FROM public.user_account WHERE id = auth.uid()
    ));

CREATE POLICY "Users can insert run params in their tenant"
    ON public.run_param FOR INSERT
    WITH CHECK (tenant_id IN (
        SELECT tenant_id FROM public.user_account WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update run params in their tenant"
    ON public.run_param FOR UPDATE
    USING (tenant_id IN (
        SELECT tenant_id FROM public.user_account WHERE id = auth.uid()
    ));

CREATE POLICY "Users can delete run params in their tenant"
    ON public.run_param FOR DELETE
    USING (tenant_id IN (
        SELECT tenant_id FROM public.user_account WHERE id = auth.uid()
    ));

-- metric_definition policies
CREATE POLICY "Users can view metric definitions in their tenant"
    ON public.metric_definition FOR SELECT
    USING (tenant_id IN (
        SELECT tenant_id FROM public.user_account WHERE id = auth.uid()
    ));

CREATE POLICY "Users can insert metric definitions in their tenant"
    ON public.metric_definition FOR INSERT
    WITH CHECK (tenant_id IN (
        SELECT tenant_id FROM public.user_account WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update metric definitions in their tenant"
    ON public.metric_definition FOR UPDATE
    USING (tenant_id IN (
        SELECT tenant_id FROM public.user_account WHERE id = auth.uid()
    ));

CREATE POLICY "Users can delete metric definitions in their tenant"
    ON public.metric_definition FOR DELETE
    USING (tenant_id IN (
        SELECT tenant_id FROM public.user_account WHERE id = auth.uid()
    ));

-- metric_alert policies
CREATE POLICY "Users can view metric alerts in their tenant"
    ON public.metric_alert FOR SELECT
    USING (tenant_id IN (
        SELECT tenant_id FROM public.user_account WHERE id = auth.uid()
    ));

CREATE POLICY "Users can insert metric alerts in their tenant"
    ON public.metric_alert FOR INSERT
    WITH CHECK (tenant_id IN (
        SELECT tenant_id FROM public.user_account WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update metric alerts in their tenant"
    ON public.metric_alert FOR UPDATE
    USING (tenant_id IN (
        SELECT tenant_id FROM public.user_account WHERE id = auth.uid()
    ));

-- workspace policies
CREATE POLICY "Users can view workspaces in their tenant"
    ON public.workspace FOR SELECT
    USING (tenant_id IN (
        SELECT tenant_id FROM public.user_account WHERE id = auth.uid()
    ));

CREATE POLICY "Users can insert workspaces in their tenant"
    ON public.workspace FOR INSERT
    WITH CHECK (tenant_id IN (
        SELECT tenant_id FROM public.user_account WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update their own workspaces"
    ON public.workspace FOR UPDATE
    USING (
        user_id = auth.uid() OR
        tenant_id IN (
            SELECT tenant_id FROM public.user_account WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own workspaces"
    ON public.workspace FOR DELETE
    USING (
        user_id = auth.uid() OR
        tenant_id IN (
            SELECT tenant_id FROM public.user_account WHERE id = auth.uid()
        )
    );

-- workspace_template policies
CREATE POLICY "Users can view workspace templates"
    ON public.workspace_template FOR SELECT
    USING (
        is_public = true OR
        tenant_id IN (
            SELECT tenant_id FROM public.user_account WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert workspace templates in their tenant"
    ON public.workspace_template FOR INSERT
    WITH CHECK (tenant_id IN (
        SELECT tenant_id FROM public.user_account WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update workspace templates in their tenant"
    ON public.workspace_template FOR UPDATE
    USING (tenant_id IN (
        SELECT tenant_id FROM public.user_account WHERE id = auth.uid()
    ));

CREATE POLICY "Users can delete workspace templates in their tenant"
    ON public.workspace_template FOR DELETE
    USING (tenant_id IN (
        SELECT tenant_id FROM public.user_account WHERE id = auth.uid()
    ));

-- workspace_session_log policies
CREATE POLICY "Users can view workspace session logs for their workspaces"
    ON public.workspace_session_log FOR SELECT
    USING (
        user_id = auth.uid() OR
        workspace_id IN (
            SELECT id FROM public.workspace WHERE tenant_id IN (
                SELECT tenant_id FROM public.user_account WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert workspace session logs"
    ON public.workspace_session_log FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own session logs"
    ON public.workspace_session_log FOR UPDATE
    USING (user_id = auth.uid());

-- ============================================================================
-- VIEWS FOR CONVENIENCE
-- ============================================================================

-- View: ml_run (alias for run table for compatibility)
CREATE OR REPLACE VIEW public.ml_run AS
SELECT
    r.id,
    r.tenant_id,
    r.experiment_id,
    r.project_id,
    r.parent_run_id,
    COALESCE(e.name, 'Run-' || substr(r.id::text, 1, 8)) as name,
    NULL::text as description,
    r.status::text as status,
    r.trigger::text as source,
    NULL::text as source_name,
    NULL::text as source_version,
    NULL::text as entry_point,
    r.created_by as user_id,
    r.started_at as start_time,
    r.ended_at as end_time,
    r.duration_ms / 1000 as duration_seconds,
    r.artifacts_root_uri as artifact_uri,
    'active' as lifecycle_stage,
    COALESCE((r.params->>'tags')::text[], ARRAY[]::text[]) as tags,
    r.params,
    r.metrics_summary as metadata,
    r.created_at,
    r.updated_at
FROM public.run r
LEFT JOIN public.experiment e ON r.experiment_id = e.id;

COMMENT ON VIEW public.ml_run IS 'Compatibility view for ml_run referencing the run table';

-- View: ml_run_metric (alias for run_metric table)
CREATE OR REPLACE VIEW public.ml_run_metric AS
SELECT
    id,
    tenant_id,
    run_id,
    name as key,
    value,
    logged_at as timestamp,
    step,
    false as is_nan,
    NULL::jsonb as context
FROM public.run_metric;

COMMENT ON VIEW public.ml_run_metric IS 'Compatibility view for ml_run_metric referencing the run_metric table';

-- View: ml_run_param (alias for run_param table)
CREATE OR REPLACE VIEW public.ml_run_param AS
SELECT
    id,
    run_id,
    key,
    value
FROM public.run_param;

COMMENT ON VIEW public.ml_run_param IS 'Compatibility view for ml_run_param referencing the run_param table';

-- View: ml_artifact (alias for artifact table)
CREATE OR REPLACE VIEW public.ml_artifact AS
SELECT
    a.id,
    a.tenant_id,
    a.run_id,
    NULL::uuid as experiment_id,
    NULL::uuid as model_version_id,
    a.name,
    a.name as path,
    a.kind::text as artifact_type,
    'supabase'::text as storage_type,
    a.uri as storage_uri,
    a.size_bytes,
    a.mime_type,
    a.content_hash as checksum,
    'sha256'::text as checksum_algorithm,
    NULL::text as description,
    ARRAY[]::text[] as tags,
    a.metadata,
    false as is_directory,
    NULL::uuid as parent_id,
    a.created_by,
    a.created_at,
    a.created_at as updated_at
FROM public.artifact a;

COMMENT ON VIEW public.ml_artifact IS 'Compatibility view for ml_artifact referencing the artifact table';

-- View: ml_workspace (alias for workspace table)
CREATE OR REPLACE VIEW public.ml_workspace AS
SELECT * FROM public.workspace;

COMMENT ON VIEW public.ml_workspace IS 'Compatibility view for ml_workspace referencing the workspace table';

-- View: ml_workspace_session (alias for workspace_session_log)
CREATE OR REPLACE VIEW public.ml_workspace_session AS
SELECT * FROM public.workspace_session_log;

COMMENT ON VIEW public.ml_workspace_session IS 'Compatibility view for ml_workspace_session referencing workspace_session_log table';

-- View: ml_workspace_template (alias for workspace_template)
CREATE OR REPLACE VIEW public.ml_workspace_template AS
SELECT * FROM public.workspace_template;

COMMENT ON VIEW public.ml_workspace_template IS 'Compatibility view for ml_workspace_template referencing workspace_template table';

-- View: ml_metric_definition (alias)
CREATE OR REPLACE VIEW public.ml_metric_definition AS
SELECT * FROM public.metric_definition;

COMMENT ON VIEW public.ml_metric_definition IS 'Compatibility view for ml_metric_definition';

-- View: ml_metric_alert (alias)
CREATE OR REPLACE VIEW public.ml_metric_alert AS
SELECT * FROM public.metric_alert;

COMMENT ON VIEW public.ml_metric_alert IS 'Compatibility view for ml_metric_alert';

-- ============================================================================
-- END OF MIGRATION: MLOps Extended Tables
-- ============================================================================
