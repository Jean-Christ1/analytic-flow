-- ============================================================================
-- MIGRATION: Advanced Features Tables
-- Schema: MLOps Control Plane v3
-- Author: Armand AMOUSSOU
-- Date: 2026-01-04
-- ============================================================================
-- Includes: Pipelines DAG, OPA/Rego Policies, Catalog/Templates, Resource Inventory,
-- IaC/Terraform, Observability, Incidents/SLA, Webhooks/Integrations,
-- FinOps/GreenOps, AI Governance (EU AI Act), Data Contracts, Dashboards
-- ============================================================================

-- ============================================================================
-- ENUMS FOR ADVANCED FEATURES
-- ============================================================================

-- Pipeline Enums
DO $$ BEGIN
    CREATE TYPE public.pipeline_node_type AS ENUM ('ingestion', 'preprocess', 'train', 'evaluate', 'postprocess', 'deploy', 'notify');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.pipeline_status AS ENUM ('pending', 'running', 'succeeded', 'failed', 'canceled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.pipeline_trigger AS ENUM ('manual', 'schedule', 'api', 'cicd');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Policy Enums
DO $$ BEGIN
    CREATE TYPE public.policy_enforcement_mode AS ENUM ('audit', 'enforce');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.policy_bundle_status AS ENUM ('active', 'deprecated');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Catalog Enums
DO $$ BEGIN
    CREATE TYPE public.catalog_item_kind AS ENUM ('template', 'helm_chart', 'kustomize', 'terraform', 'workflow', 'prompt');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.catalog_item_status AS ENUM ('draft', 'active', 'deprecated', 'archived');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.catalog_dependency_relation AS ENUM ('requires', 'optional', 'conflicts');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.template_instance_status AS ENUM ('created', 'applied', 'failed', 'deleted');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Resource Inventory Enums
DO $$ BEGIN
    CREATE TYPE public.resource_provider_type AS ENUM ('aws', 'gcp', 'azure', 'k8s', 'terraform');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.managed_resource_status AS ENUM ('desired', 'synced', 'drifted', 'failed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.resource_relation_type AS ENUM ('depends_on', 'uses', 'owns', 'contains');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- IaC Enums
DO $$ BEGIN
    CREATE TYPE public.iac_backend_type AS ENUM ('local', 's3', 'gcs', 'azurerm', 'pg', 'tfc');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.iac_action AS ENUM ('plan', 'apply', 'destroy');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.iac_run_status AS ENUM ('queued', 'planning', 'applying', 'succeeded', 'failed', 'canceled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Observability Enums
DO $$ BEGIN
    CREATE TYPE public.observability_kind AS ENUM ('logs', 'metrics', 'traces');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.observability_type AS ENUM ('prometheus', 'grafana', 'loki', 'tempo', 'datadog', 'splunk');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Incident Enums
DO $$ BEGIN
    CREATE TYPE public.incident_severity AS ENUM ('p1', 'p2', 'p3', 'p4');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.incident_status AS ENUM ('open', 'investigating', 'mitigating', 'resolved', 'postmortem');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.incident_update_type AS ENUM ('info', 'mitigation', 'resolution');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Integration Enums
DO $$ BEGIN
    CREATE TYPE public.integration_type AS ENUM ('slack', 'teams', 'pagerduty', 'email', 'webhook');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.webhook_delivery_status AS ENUM ('pending', 'sent', 'failed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- FinOps Enums
DO $$ BEGIN
    CREATE TYPE public.budget_period AS ENUM ('monthly', 'quarterly', 'yearly');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.cost_allocation_rule_type AS ENUM ('tag_based', 'namespace', 'project_mapping', 'custom');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AI Governance Enums
DO $$ BEGIN
    CREATE TYPE public.ai_risk_class AS ENUM ('unacceptable', 'high', 'limited', 'minimal');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.ai_system_status AS ENUM ('draft', 'active', 'suspended', 'decommissioned');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.privacy_classification AS ENUM ('public', 'internal', 'confidential', 'restricted');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.compliance_evidence_status AS ENUM ('pending', 'valid', 'invalid', 'expired');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.governance_incident_type AS ENUM ('bias', 'drift', 'fairness', 'privacy', 'security');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.governance_incident_status AS ENUM ('open', 'investigating', 'resolved');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.data_contract_status AS ENUM ('draft', 'active', 'deprecated');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================================================
-- SECTION 1: PIPELINES DAG ENGINE
-- ============================================================================

-- Pipeline Definition
CREATE TABLE IF NOT EXISTS public.pipeline_definition (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    version INTEGER DEFAULT 1,
    spec JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.user_account(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.user_account(id) ON DELETE SET NULL,
    UNIQUE(project_id, name, version)
);
ALTER TABLE public.pipeline_definition ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_pipeline_definition_tenant ON public.pipeline_definition(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_definition_project ON public.pipeline_definition(project_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_definition_active ON public.pipeline_definition(is_active);
COMMENT ON TABLE public.pipeline_definition IS 'DAG pipeline definitions for ML workflows';

-- Pipeline Node
CREATE TABLE IF NOT EXISTS public.pipeline_node (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    pipeline_definition_id UUID NOT NULL REFERENCES public.pipeline_definition(id) ON DELETE CASCADE,
    node_key VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    node_type public.pipeline_node_type NOT NULL,
    run_template JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(pipeline_definition_id, node_key)
);
ALTER TABLE public.pipeline_node ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_pipeline_node_tenant ON public.pipeline_node(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_node_definition ON public.pipeline_node(pipeline_definition_id);
COMMENT ON TABLE public.pipeline_node IS 'Nodes in pipeline DAGs';

-- Pipeline Edge
CREATE TABLE IF NOT EXISTS public.pipeline_edge (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    pipeline_definition_id UUID NOT NULL REFERENCES public.pipeline_definition(id) ON DELETE CASCADE,
    from_node_id UUID NOT NULL REFERENCES public.pipeline_node(id) ON DELETE CASCADE,
    to_node_id UUID NOT NULL REFERENCES public.pipeline_node(id) ON DELETE CASCADE,
    condition_expr TEXT,
    UNIQUE(pipeline_definition_id, from_node_id, to_node_id)
);
ALTER TABLE public.pipeline_edge ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_pipeline_edge_tenant ON public.pipeline_edge(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_edge_definition ON public.pipeline_edge(pipeline_definition_id);
COMMENT ON TABLE public.pipeline_edge IS 'Edges connecting pipeline nodes';

-- Pipeline Run
CREATE TABLE IF NOT EXISTS public.pipeline_run (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
    pipeline_definition_id UUID NOT NULL REFERENCES public.pipeline_definition(id) ON DELETE CASCADE,
    trigger public.pipeline_trigger DEFAULT 'manual',
    status public.pipeline_status NOT NULL DEFAULT 'pending',
    status_message TEXT,
    params JSONB DEFAULT '{}'::jsonb,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.user_account(id) ON DELETE SET NULL
);
ALTER TABLE public.pipeline_run ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_pipeline_run_tenant ON public.pipeline_run(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_run_project ON public.pipeline_run(project_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_run_definition ON public.pipeline_run(pipeline_definition_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_run_status ON public.pipeline_run(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_run_created_at ON public.pipeline_run(created_at DESC);
COMMENT ON TABLE public.pipeline_run IS 'Pipeline execution instances';

-- Pipeline Run Node
CREATE TABLE IF NOT EXISTS public.pipeline_run_node (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    pipeline_run_id UUID NOT NULL REFERENCES public.pipeline_run(id) ON DELETE CASCADE,
    node_id UUID NOT NULL REFERENCES public.pipeline_node(id) ON DELETE CASCADE,
    status public.pipeline_status NOT NULL DEFAULT 'pending',
    run_id UUID REFERENCES public.run(id) ON DELETE SET NULL,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    attempts INTEGER DEFAULT 0,
    error_message TEXT,
    UNIQUE(pipeline_run_id, node_id)
);
ALTER TABLE public.pipeline_run_node ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_pipeline_run_node_tenant ON public.pipeline_run_node(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_run_node_run ON public.pipeline_run_node(pipeline_run_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_run_node_status ON public.pipeline_run_node(status);
COMMENT ON TABLE public.pipeline_run_node IS 'Individual node executions in pipeline runs';

-- Pipeline Schedule
CREATE TABLE IF NOT EXISTS public.pipeline_schedule (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
    pipeline_definition_id UUID NOT NULL REFERENCES public.pipeline_definition(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    cron VARCHAR(100),
    timezone VARCHAR(50) DEFAULT 'UTC',
    enabled BOOLEAN DEFAULT true,
    default_params JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(project_id, name)
);
ALTER TABLE public.pipeline_schedule ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_pipeline_schedule_tenant ON public.pipeline_schedule(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_schedule_enabled ON public.pipeline_schedule(enabled);
COMMENT ON TABLE public.pipeline_schedule IS 'Scheduled pipeline executions';

-- ============================================================================
-- SECTION 2: OPA/REGO POLICIES
-- ============================================================================

-- Policy Bundle
CREATE TABLE IF NOT EXISTS public.policy_bundle (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50),
    source_repo VARCHAR(500),
    source_ref VARCHAR(255),
    bundle_uri VARCHAR(1000),
    checksum VARCHAR(64),
    status public.policy_bundle_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.user_account(id) ON DELETE SET NULL,
    UNIQUE(tenant_id, name, version)
);
ALTER TABLE public.policy_bundle ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_policy_bundle_tenant ON public.policy_bundle(tenant_id);
CREATE INDEX IF NOT EXISTS idx_policy_bundle_status ON public.policy_bundle(status);
COMMENT ON TABLE public.policy_bundle IS 'OPA/Rego policy bundles';

-- Policy Assignment
CREATE TABLE IF NOT EXISTS public.policy_assignment (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    bundle_id UUID NOT NULL REFERENCES public.policy_bundle(id) ON DELETE CASCADE,
    scope_type VARCHAR(50) NOT NULL,
    scope_id UUID,
    enforcement_mode public.policy_enforcement_mode DEFAULT 'audit',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.user_account(id) ON DELETE SET NULL,
    UNIQUE(bundle_id, scope_type, scope_id)
);
ALTER TABLE public.policy_assignment ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_policy_assignment_tenant ON public.policy_assignment(tenant_id);
CREATE INDEX IF NOT EXISTS idx_policy_assignment_bundle ON public.policy_assignment(bundle_id);
CREATE INDEX IF NOT EXISTS idx_policy_assignment_scope ON public.policy_assignment(scope_type, scope_id);
COMMENT ON TABLE public.policy_assignment IS 'Policy assignments to scopes';

-- Policy Decision Log
CREATE TABLE IF NOT EXISTS public.policy_decision_log (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    bundle_id UUID NOT NULL REFERENCES public.policy_bundle(id) ON DELETE CASCADE,
    decision_point VARCHAR(50) NOT NULL,
    input_hash VARCHAR(64),
    result JSONB,
    allow BOOLEAN,
    reason TEXT,
    entity_type VARCHAR(100),
    entity_id UUID,
    evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.policy_decision_log ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_policy_decision_log_tenant ON public.policy_decision_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_policy_decision_log_bundle ON public.policy_decision_log(bundle_id);
CREATE INDEX IF NOT EXISTS idx_policy_decision_log_evaluated ON public.policy_decision_log(evaluated_at DESC);
CREATE INDEX IF NOT EXISTS idx_policy_decision_log_allow ON public.policy_decision_log(allow);
COMMENT ON TABLE public.policy_decision_log IS 'Policy evaluation decision logs';

-- ============================================================================
-- SECTION 3: CATALOG & TEMPLATES
-- ============================================================================

-- Catalog Item
CREATE TABLE IF NOT EXISTS public.catalog_item (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.project(id) ON DELETE CASCADE,
    kind public.catalog_item_kind NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    version VARCHAR(50),
    tags JSONB DEFAULT '[]'::jsonb,
    spec JSONB DEFAULT '{}'::jsonb,
    status public.catalog_item_status DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.user_account(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.user_account(id) ON DELETE SET NULL,
    UNIQUE(tenant_id, kind, name, version)
);
ALTER TABLE public.catalog_item ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_catalog_item_tenant ON public.catalog_item(tenant_id);
CREATE INDEX IF NOT EXISTS idx_catalog_item_kind ON public.catalog_item(kind);
CREATE INDEX IF NOT EXISTS idx_catalog_item_status ON public.catalog_item(status);
CREATE INDEX IF NOT EXISTS idx_catalog_item_tags ON public.catalog_item USING gin(tags);
COMMENT ON TABLE public.catalog_item IS 'Reusable catalog items (templates, charts, etc.)';

-- Catalog Item Dependency
CREATE TABLE IF NOT EXISTS public.catalog_item_dependency (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.catalog_item(id) ON DELETE CASCADE,
    depends_on_item_id UUID NOT NULL REFERENCES public.catalog_item(id) ON DELETE CASCADE,
    relation public.catalog_dependency_relation NOT NULL,
    UNIQUE(item_id, depends_on_item_id)
);
ALTER TABLE public.catalog_item_dependency ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_catalog_item_dependency_tenant ON public.catalog_item_dependency(tenant_id);
CREATE INDEX IF NOT EXISTS idx_catalog_item_dependency_item ON public.catalog_item_dependency(item_id);
COMMENT ON TABLE public.catalog_item_dependency IS 'Dependencies between catalog items';

-- Template Instance
CREATE TABLE IF NOT EXISTS public.template_instance (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
    catalog_item_id UUID NOT NULL REFERENCES public.catalog_item(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    params JSONB DEFAULT '{}'::jsonb,
    status public.template_instance_status DEFAULT 'created',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.user_account(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.user_account(id) ON DELETE SET NULL
);
ALTER TABLE public.template_instance ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_template_instance_tenant ON public.template_instance(tenant_id);
CREATE INDEX IF NOT EXISTS idx_template_instance_project ON public.template_instance(project_id);
CREATE INDEX IF NOT EXISTS idx_template_instance_catalog ON public.template_instance(catalog_item_id);
COMMENT ON TABLE public.template_instance IS 'Instantiated templates in projects';

-- ============================================================================
-- SECTION 4: RESOURCE INVENTORY
-- ============================================================================

-- Managed Resource
CREATE TABLE IF NOT EXISTS public.managed_resource (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
    provider public.resource_provider_type NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_name VARCHAR(255) NOT NULL,
    resource_id_external VARCHAR(500),
    region VARCHAR(50),
    environment VARCHAR(50),
    desired_state JSONB DEFAULT '{}'::jsonb,
    observed_state JSONB DEFAULT '{}'::jsonb,
    status public.managed_resource_status DEFAULT 'desired',
    last_reconciled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.user_account(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.user_account(id) ON DELETE SET NULL
);
ALTER TABLE public.managed_resource ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_managed_resource_tenant ON public.managed_resource(tenant_id);
CREATE INDEX IF NOT EXISTS idx_managed_resource_project ON public.managed_resource(project_id);
CREATE INDEX IF NOT EXISTS idx_managed_resource_provider ON public.managed_resource(provider);
CREATE INDEX IF NOT EXISTS idx_managed_resource_status ON public.managed_resource(status);
COMMENT ON TABLE public.managed_resource IS 'Managed cloud/K8s resources inventory';

-- Resource Relation
CREATE TABLE IF NOT EXISTS public.resource_relation (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    from_resource_id UUID NOT NULL REFERENCES public.managed_resource(id) ON DELETE CASCADE,
    to_resource_id UUID NOT NULL REFERENCES public.managed_resource(id) ON DELETE CASCADE,
    relation public.resource_relation_type NOT NULL,
    UNIQUE(from_resource_id, to_resource_id, relation)
);
ALTER TABLE public.resource_relation ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_resource_relation_tenant ON public.resource_relation(tenant_id);
CREATE INDEX IF NOT EXISTS idx_resource_relation_from ON public.resource_relation(from_resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_relation_to ON public.resource_relation(to_resource_id);
COMMENT ON TABLE public.resource_relation IS 'Relationships between managed resources';

-- Drift Event
CREATE TABLE IF NOT EXISTS public.drift_event (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES public.managed_resource(id) ON DELETE CASCADE,
    severity public.drift_severity DEFAULT 'low',
    summary TEXT,
    diff_uri VARCHAR(500),
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    status public.drift_status DEFAULT 'open',
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by UUID REFERENCES public.user_account(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES public.user_account(id) ON DELETE SET NULL
);
ALTER TABLE public.drift_event ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_drift_event_tenant ON public.drift_event(tenant_id);
CREATE INDEX IF NOT EXISTS idx_drift_event_resource ON public.drift_event(resource_id);
CREATE INDEX IF NOT EXISTS idx_drift_event_status ON public.drift_event(status);
CREATE INDEX IF NOT EXISTS idx_drift_event_severity ON public.drift_event(severity);
COMMENT ON TABLE public.drift_event IS 'Configuration drift events for managed resources';

-- ============================================================================
-- SECTION 5: IAC / TERRAFORM
-- ============================================================================

-- IaC Workspace
CREATE TABLE IF NOT EXISTS public.iac_workspace (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    backend_type public.iac_backend_type,
    backend_config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(project_id, name)
);
ALTER TABLE public.iac_workspace ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_iac_workspace_tenant ON public.iac_workspace(tenant_id);
CREATE INDEX IF NOT EXISTS idx_iac_workspace_project ON public.iac_workspace(project_id);
COMMENT ON TABLE public.iac_workspace IS 'Terraform/IaC workspaces';

-- IaC Run
CREATE TABLE IF NOT EXISTS public.iac_run (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES public.iac_workspace(id) ON DELETE CASCADE,
    trigger VARCHAR(50),
    action public.iac_action NOT NULL,
    status public.iac_run_status DEFAULT 'queued',
    plan_artifact_id UUID REFERENCES public.cicd_job_artifact(id) ON DELETE SET NULL,
    state_uri VARCHAR(500),
    lock_id VARCHAR(100),
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.user_account(id) ON DELETE SET NULL
);
ALTER TABLE public.iac_run ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_iac_run_tenant ON public.iac_run(tenant_id);
CREATE INDEX IF NOT EXISTS idx_iac_run_workspace ON public.iac_run(workspace_id);
CREATE INDEX IF NOT EXISTS idx_iac_run_status ON public.iac_run(status);
CREATE INDEX IF NOT EXISTS idx_iac_run_created_at ON public.iac_run(created_at DESC);
COMMENT ON TABLE public.iac_run IS 'Terraform/IaC execution runs';

-- IaC Change Summary
CREATE TABLE IF NOT EXISTS public.iac_change_summary (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    iac_run_id UUID NOT NULL REFERENCES public.iac_run(id) ON DELETE CASCADE,
    add_count INTEGER DEFAULT 0,
    change_count INTEGER DEFAULT 0,
    destroy_count INTEGER DEFAULT 0,
    summary TEXT,
    details_uri VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.iac_change_summary ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_iac_change_summary_tenant ON public.iac_change_summary(tenant_id);
CREATE INDEX IF NOT EXISTS idx_iac_change_summary_run ON public.iac_change_summary(iac_run_id);
COMMENT ON TABLE public.iac_change_summary IS 'Terraform plan change summaries';

-- ============================================================================
-- SECTION 6: OBSERVABILITY
-- ============================================================================

-- Observability Backend
CREATE TABLE IF NOT EXISTS public.observability_backend (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    kind public.observability_kind NOT NULL,
    type public.observability_type NOT NULL,
    endpoint VARCHAR(500),
    auth_secret_ref UUID REFERENCES public.secret_ref(id) ON DELETE SET NULL,
    default_labels JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, kind, type)
);
ALTER TABLE public.observability_backend ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_observability_backend_tenant ON public.observability_backend(tenant_id);
CREATE INDEX IF NOT EXISTS idx_observability_backend_kind ON public.observability_backend(kind);
COMMENT ON TABLE public.observability_backend IS 'Observability backends (Prometheus, Grafana, etc.)';

-- Observability Link
CREATE TABLE IF NOT EXISTS public.observability_link (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    backend_id UUID NOT NULL REFERENCES public.observability_backend(id) ON DELETE CASCADE,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    query JSONB DEFAULT '{}'::jsonb,
    url VARCHAR(1000),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.observability_link ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_observability_link_tenant ON public.observability_link(tenant_id);
CREATE INDEX IF NOT EXISTS idx_observability_link_entity ON public.observability_link(entity_type, entity_id);
COMMENT ON TABLE public.observability_link IS 'Links entities to observability dashboards';

-- ============================================================================
-- SECTION 7: INCIDENTS & SLA
-- ============================================================================

-- Incident
CREATE TABLE IF NOT EXISTS public.incident (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    severity public.incident_severity DEFAULT 'p3',
    status public.incident_status DEFAULT 'open',
    detected_at TIMESTAMP WITH TIME ZONE,
    declared_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    owner_user_id UUID REFERENCES public.user_account(id) ON DELETE SET NULL,
    related_entity JSONB DEFAULT '{}'::jsonb,
    root_cause TEXT,
    impact TEXT,
    timeline_uri VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.incident ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_incident_tenant ON public.incident(tenant_id);
CREATE INDEX IF NOT EXISTS idx_incident_project ON public.incident(project_id);
CREATE INDEX IF NOT EXISTS idx_incident_severity ON public.incident(severity);
CREATE INDEX IF NOT EXISTS idx_incident_status ON public.incident(status);
CREATE INDEX IF NOT EXISTS idx_incident_declared_at ON public.incident(declared_at DESC);
COMMENT ON TABLE public.incident IS 'Operational incidents';

-- Incident Update
CREATE TABLE IF NOT EXISTS public.incident_update (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    incident_id UUID NOT NULL REFERENCES public.incident(id) ON DELETE CASCADE,
    author_user_id UUID NOT NULL REFERENCES public.user_account(id) ON DELETE CASCADE,
    message TEXT,
    status public.incident_update_type DEFAULT 'info',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.incident_update ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_incident_update_tenant ON public.incident_update(tenant_id);
CREATE INDEX IF NOT EXISTS idx_incident_update_incident ON public.incident_update(incident_id);
COMMENT ON TABLE public.incident_update IS 'Incident timeline updates';

-- SLA Policy
CREATE TABLE IF NOT EXISTS public.sla_policy (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    scope_type VARCHAR(50) NOT NULL,
    scope_id UUID,
    targets JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, name)
);
ALTER TABLE public.sla_policy ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_sla_policy_tenant ON public.sla_policy(tenant_id);
COMMENT ON TABLE public.sla_policy IS 'Service Level Agreement policies';

-- ============================================================================
-- SECTION 8: WEBHOOKS & INTEGRATIONS
-- ============================================================================

-- Integration Endpoint
CREATE TABLE IF NOT EXISTS public.integration_endpoint (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    type public.integration_type NOT NULL,
    name VARCHAR(255) NOT NULL,
    config JSONB DEFAULT '{}'::jsonb,
    secret_ref_id UUID REFERENCES public.secret_ref(id) ON DELETE SET NULL,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, name)
);
ALTER TABLE public.integration_endpoint ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_integration_endpoint_tenant ON public.integration_endpoint(tenant_id);
CREATE INDEX IF NOT EXISTS idx_integration_endpoint_type ON public.integration_endpoint(type);
CREATE INDEX IF NOT EXISTS idx_integration_endpoint_enabled ON public.integration_endpoint(enabled);
COMMENT ON TABLE public.integration_endpoint IS 'Integration endpoints (Slack, Teams, etc.)';

-- Webhook Subscription
CREATE TABLE IF NOT EXISTS public.webhook_subscription (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
    endpoint_id UUID NOT NULL REFERENCES public.integration_endpoint(id) ON DELETE CASCADE,
    event_types JSONB DEFAULT '[]'::jsonb,
    filter JSONB DEFAULT '{}'::jsonb,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.webhook_subscription ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_webhook_subscription_tenant ON public.webhook_subscription(tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhook_subscription_endpoint ON public.webhook_subscription(endpoint_id);
CREATE INDEX IF NOT EXISTS idx_webhook_subscription_enabled ON public.webhook_subscription(enabled);
COMMENT ON TABLE public.webhook_subscription IS 'Webhook subscriptions for events';

-- Webhook Delivery
CREATE TABLE IF NOT EXISTS public.webhook_delivery (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES public.webhook_subscription(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    status public.webhook_delivery_status DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    sent_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE public.webhook_delivery ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_tenant ON public.webhook_delivery(tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_subscription ON public.webhook_delivery(subscription_id);
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_status ON public.webhook_delivery(status);
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_pending ON public.webhook_delivery(status) WHERE status = 'pending';
COMMENT ON TABLE public.webhook_delivery IS 'Webhook delivery attempts';

-- ============================================================================
-- SECTION 9: FINOPS & GREENOPS
-- ============================================================================

-- Billing Account
CREATE TABLE IF NOT EXISTS public.billing_account (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    provider public.cloud_provider NOT NULL,
    name VARCHAR(255) NOT NULL,
    external_id VARCHAR(255),
    currency VARCHAR(10) DEFAULT 'USD',
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, provider, external_id)
);
ALTER TABLE public.billing_account ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_billing_account_tenant ON public.billing_account(tenant_id);
CREATE INDEX IF NOT EXISTS idx_billing_account_provider ON public.billing_account(provider);
COMMENT ON TABLE public.billing_account IS 'Cloud billing accounts for cost tracking';

-- Cost Allocation Rule
CREATE TABLE IF NOT EXISTS public.cost_allocation_rule (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    rule_type public.cost_allocation_rule_type NOT NULL,
    expression JSONB DEFAULT '{}'::jsonb,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, name)
);
ALTER TABLE public.cost_allocation_rule ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_cost_allocation_rule_tenant ON public.cost_allocation_rule(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cost_allocation_rule_enabled ON public.cost_allocation_rule(enabled);
COMMENT ON TABLE public.cost_allocation_rule IS 'Rules for allocating costs to projects';

-- Cost Record
CREATE TABLE IF NOT EXISTS public.cost_record (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    billing_account_id UUID NOT NULL REFERENCES public.billing_account(id) ON DELETE CASCADE,
    provider public.cloud_provider NOT NULL,
    service VARCHAR(100),
    sku VARCHAR(255),
    usage_start TIMESTAMP WITH TIME ZONE,
    usage_end TIMESTAMP WITH TIME ZONE,
    cost_amount DECIMAL(18, 6),
    currency VARCHAR(10) DEFAULT 'USD',
    usage_quantity DECIMAL(18, 6),
    usage_unit VARCHAR(50),
    tags JSONB DEFAULT '{}'::jsonb,
    resource_external_id VARCHAR(500),
    project_id UUID REFERENCES public.project(id) ON DELETE SET NULL,
    run_id UUID REFERENCES public.run(id) ON DELETE SET NULL,
    pipeline_id UUID REFERENCES public.cicd_pipeline(id) ON DELETE SET NULL,
    deployment_id UUID REFERENCES public.model_deployment(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.cost_record ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_cost_record_tenant ON public.cost_record(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cost_record_billing_account ON public.cost_record(billing_account_id);
CREATE INDEX IF NOT EXISTS idx_cost_record_project ON public.cost_record(project_id);
CREATE INDEX IF NOT EXISTS idx_cost_record_usage_start ON public.cost_record(usage_start);
CREATE INDEX IF NOT EXISTS idx_cost_record_service ON public.cost_record(service);
COMMENT ON TABLE public.cost_record IS 'Cloud cost records for FinOps';

-- Budget
CREATE TABLE IF NOT EXISTS public.budget (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    scope_type VARCHAR(50) NOT NULL,
    scope_id UUID,
    name VARCHAR(255) NOT NULL,
    period public.budget_period NOT NULL,
    amount DECIMAL(18, 2),
    currency VARCHAR(10) DEFAULT 'USD',
    threshold_percentages JSONB DEFAULT '[50, 80, 100]'::jsonb,
    alert_channels JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.budget ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_budget_tenant ON public.budget(tenant_id);
CREATE INDEX IF NOT EXISTS idx_budget_scope ON public.budget(scope_type, scope_id);
COMMENT ON TABLE public.budget IS 'Cost budgets with alerts';

-- Carbon Record
CREATE TABLE IF NOT EXISTS public.carbon_record (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    provider public.cloud_provider NOT NULL,
    region VARCHAR(50),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    kwh DECIMAL(18, 6),
    co2e_kg DECIMAL(18, 6),
    methodology VARCHAR(100),
    attribution JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.carbon_record ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_carbon_record_tenant ON public.carbon_record(tenant_id);
CREATE INDEX IF NOT EXISTS idx_carbon_record_provider ON public.carbon_record(provider);
CREATE INDEX IF NOT EXISTS idx_carbon_record_start_time ON public.carbon_record(start_time);
COMMENT ON TABLE public.carbon_record IS 'Carbon emissions records for GreenOps';

-- Efficiency KPI Snapshot
CREATE TABLE IF NOT EXISTS public.efficiency_kpi_snapshot (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
    date_key DATE NOT NULL,
    cpu_hours DECIMAL(18, 2),
    gpu_hours DECIMAL(18, 2),
    cost_amount DECIMAL(18, 2),
    co2e_kg DECIMAL(18, 6),
    success_rate DECIMAL(5, 2),
    mean_duration_sec INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(project_id, date_key)
);
ALTER TABLE public.efficiency_kpi_snapshot ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_efficiency_kpi_snapshot_tenant ON public.efficiency_kpi_snapshot(tenant_id);
CREATE INDEX IF NOT EXISTS idx_efficiency_kpi_snapshot_project ON public.efficiency_kpi_snapshot(project_id);
CREATE INDEX IF NOT EXISTS idx_efficiency_kpi_snapshot_date ON public.efficiency_kpi_snapshot(date_key DESC);
COMMENT ON TABLE public.efficiency_kpi_snapshot IS 'Daily efficiency KPI snapshots';

-- ============================================================================
-- SECTION 10: AI GOVERNANCE (EU AI ACT)
-- ============================================================================

-- AI System
CREATE TABLE IF NOT EXISTS public.ai_system (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    risk_class public.ai_risk_class DEFAULT 'minimal',
    intended_purpose TEXT,
    users_affected TEXT,
    deployment_context TEXT,
    owner_user_id UUID REFERENCES public.user_account(id) ON DELETE SET NULL,
    status public.ai_system_status DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(project_id, name)
);
ALTER TABLE public.ai_system ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_ai_system_tenant ON public.ai_system(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_system_project ON public.ai_system(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_system_risk_class ON public.ai_system(risk_class);
CREATE INDEX IF NOT EXISTS idx_ai_system_status ON public.ai_system(status);
COMMENT ON TABLE public.ai_system IS 'AI systems for EU AI Act compliance';

-- Model Card
CREATE TABLE IF NOT EXISTS public.model_card (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    model_version_id UUID NOT NULL REFERENCES public.model_version(id) ON DELETE CASCADE,
    ai_system_id UUID REFERENCES public.ai_system(id) ON DELETE SET NULL,
    summary TEXT,
    training_data TEXT,
    evaluation_data TEXT,
    performance JSONB DEFAULT '{}'::jsonb,
    limitations TEXT,
    ethical_considerations TEXT,
    caveats TEXT,
    version VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.user_account(id) ON DELETE SET NULL,
    UNIQUE(model_version_id)
);
ALTER TABLE public.model_card ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_model_card_tenant ON public.model_card(tenant_id);
CREATE INDEX IF NOT EXISTS idx_model_card_model_version ON public.model_card(model_version_id);
CREATE INDEX IF NOT EXISTS idx_model_card_ai_system ON public.model_card(ai_system_id);
COMMENT ON TABLE public.model_card IS 'Model documentation cards';

-- Risk Assessment
CREATE TABLE IF NOT EXISTS public.risk_assessment (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    ai_system_id UUID NOT NULL REFERENCES public.ai_system(id) ON DELETE CASCADE,
    methodology VARCHAR(100),
    hazards JSONB DEFAULT '[]'::jsonb,
    mitigations JSONB DEFAULT '[]'::jsonb,
    residual_risk VARCHAR(20),
    decision TEXT,
    assessor_user_id UUID REFERENCES public.user_account(id) ON DELETE SET NULL,
    assessed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    next_review_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE public.risk_assessment ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_risk_assessment_tenant ON public.risk_assessment(tenant_id);
CREATE INDEX IF NOT EXISTS idx_risk_assessment_ai_system ON public.risk_assessment(ai_system_id);
COMMENT ON TABLE public.risk_assessment IS 'AI risk assessments';

-- Compliance Control
CREATE TABLE IF NOT EXISTS public.compliance_control (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    framework VARCHAR(100) NOT NULL,
    control_code VARCHAR(100) NOT NULL,
    title VARCHAR(500),
    description TEXT,
    evidence_required TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, framework, control_code)
);
ALTER TABLE public.compliance_control ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_compliance_control_tenant ON public.compliance_control(tenant_id);
CREATE INDEX IF NOT EXISTS idx_compliance_control_framework ON public.compliance_control(framework);
COMMENT ON TABLE public.compliance_control IS 'Compliance framework controls';

-- Compliance Evidence
CREATE TABLE IF NOT EXISTS public.compliance_evidence (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    control_id UUID NOT NULL REFERENCES public.compliance_control(id) ON DELETE CASCADE,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    artifact_id UUID REFERENCES public.artifact(id) ON DELETE SET NULL,
    notes TEXT,
    status public.compliance_evidence_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    validated_at TIMESTAMP WITH TIME ZONE,
    validated_by UUID REFERENCES public.user_account(id) ON DELETE SET NULL
);
ALTER TABLE public.compliance_evidence ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_compliance_evidence_tenant ON public.compliance_evidence(tenant_id);
CREATE INDEX IF NOT EXISTS idx_compliance_evidence_control ON public.compliance_evidence(control_id);
CREATE INDEX IF NOT EXISTS idx_compliance_evidence_entity ON public.compliance_evidence(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_compliance_evidence_status ON public.compliance_evidence(status);
COMMENT ON TABLE public.compliance_evidence IS 'Evidence for compliance controls';

-- Monitoring Plan
CREATE TABLE IF NOT EXISTS public.monitoring_plan (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    ai_system_id UUID NOT NULL REFERENCES public.ai_system(id) ON DELETE CASCADE,
    plan JSONB DEFAULT '{}'::jsonb,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.monitoring_plan ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_monitoring_plan_tenant ON public.monitoring_plan(tenant_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_plan_ai_system ON public.monitoring_plan(ai_system_id);
COMMENT ON TABLE public.monitoring_plan IS 'AI system monitoring plans';

-- Governance Incident
CREATE TABLE IF NOT EXISTS public.governance_incident (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    ai_system_id UUID NOT NULL REFERENCES public.ai_system(id) ON DELETE CASCADE,
    model_deployment_id UUID REFERENCES public.model_deployment(id) ON DELETE SET NULL,
    type public.governance_incident_type NOT NULL,
    severity VARCHAR(20),
    description TEXT,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    status public.governance_incident_status DEFAULT 'open',
    resolution TEXT,
    closed_at TIMESTAMP WITH TIME ZONE,
    owner_user_id UUID REFERENCES public.user_account(id) ON DELETE SET NULL
);
ALTER TABLE public.governance_incident ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_governance_incident_tenant ON public.governance_incident(tenant_id);
CREATE INDEX IF NOT EXISTS idx_governance_incident_ai_system ON public.governance_incident(ai_system_id);
CREATE INDEX IF NOT EXISTS idx_governance_incident_type ON public.governance_incident(type);
CREATE INDEX IF NOT EXISTS idx_governance_incident_status ON public.governance_incident(status);
COMMENT ON TABLE public.governance_incident IS 'AI governance incidents (bias, drift, etc.)';

-- ============================================================================
-- SECTION 11: DATA CONTRACTS
-- ============================================================================

-- Data Contract
CREATE TABLE IF NOT EXISTS public.data_contract (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50),
    schema JSONB DEFAULT '{}'::jsonb,
    sla JSONB DEFAULT '{}'::jsonb,
    privacy_classification public.privacy_classification,
    retention_days INTEGER,
    owner_user_id UUID REFERENCES public.user_account(id) ON DELETE SET NULL,
    status public.data_contract_status DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(project_id, name, version)
);
ALTER TABLE public.data_contract ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_data_contract_tenant ON public.data_contract(tenant_id);
CREATE INDEX IF NOT EXISTS idx_data_contract_project ON public.data_contract(project_id);
CREATE INDEX IF NOT EXISTS idx_data_contract_status ON public.data_contract(status);
CREATE INDEX IF NOT EXISTS idx_data_contract_privacy ON public.data_contract(privacy_classification);
COMMENT ON TABLE public.data_contract IS 'Data contracts defining data ownership and SLAs';

-- Data Contract Binding
CREATE TABLE IF NOT EXISTS public.data_contract_binding (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    contract_id UUID NOT NULL REFERENCES public.data_contract(id) ON DELETE CASCADE,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(contract_id, entity_type, entity_id)
);
ALTER TABLE public.data_contract_binding ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_data_contract_binding_tenant ON public.data_contract_binding(tenant_id);
CREATE INDEX IF NOT EXISTS idx_data_contract_binding_contract ON public.data_contract_binding(contract_id);
CREATE INDEX IF NOT EXISTS idx_data_contract_binding_entity ON public.data_contract_binding(entity_type, entity_id);
COMMENT ON TABLE public.data_contract_binding IS 'Bindings of data contracts to entities';

-- ============================================================================
-- SECTION 12: DASHBOARDS
-- ============================================================================

-- Dashboard
CREATE TABLE IF NOT EXISTS public.dashboard (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    layout JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.user_account(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.user_account(id) ON DELETE SET NULL,
    UNIQUE(project_id, name)
);
ALTER TABLE public.dashboard ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_dashboard_tenant ON public.dashboard(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_project ON public.dashboard(project_id);
COMMENT ON TABLE public.dashboard IS 'Custom project dashboards';

-- Dashboard Widget
CREATE TABLE IF NOT EXISTS public.dashboard_widget (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    dashboard_id UUID NOT NULL REFERENCES public.dashboard(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    config JSONB DEFAULT '{}'::jsonb,
    position JSONB DEFAULT '{"x": 0, "y": 0, "w": 4, "h": 2}'::jsonb
);
ALTER TABLE public.dashboard_widget ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_dashboard_widget_tenant ON public.dashboard_widget(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_widget_dashboard ON public.dashboard_widget(dashboard_id);
COMMENT ON TABLE public.dashboard_widget IS 'Widgets in dashboards';

-- ============================================================================
-- SECTION 13: EXECUTION LINKS
-- ============================================================================

-- Execution Link
CREATE TABLE IF NOT EXISTS public.execution_link (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
    source_type VARCHAR(100) NOT NULL,
    source_id UUID NOT NULL,
    target_type VARCHAR(100) NOT NULL,
    target_id UUID NOT NULL,
    relation VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(source_type, source_id, target_type, target_id, relation)
);
ALTER TABLE public.execution_link ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_execution_link_tenant ON public.execution_link(tenant_id);
CREATE INDEX IF NOT EXISTS idx_execution_link_project ON public.execution_link(project_id);
CREATE INDEX IF NOT EXISTS idx_execution_link_source ON public.execution_link(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_execution_link_target ON public.execution_link(target_type, target_id);
COMMENT ON TABLE public.execution_link IS 'Links between execution entities for lineage tracking';

-- ============================================================================
-- TRIGGERS: Auto-update updated_at
-- ============================================================================

-- Pipeline Definition
DROP TRIGGER IF EXISTS set_pipeline_definition_updated_at ON public.pipeline_definition;
CREATE TRIGGER set_pipeline_definition_updated_at BEFORE UPDATE ON public.pipeline_definition
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Pipeline Schedule
DROP TRIGGER IF EXISTS set_pipeline_schedule_updated_at ON public.pipeline_schedule;
CREATE TRIGGER set_pipeline_schedule_updated_at BEFORE UPDATE ON public.pipeline_schedule
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Catalog Item
DROP TRIGGER IF EXISTS set_catalog_item_updated_at ON public.catalog_item;
CREATE TRIGGER set_catalog_item_updated_at BEFORE UPDATE ON public.catalog_item
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Template Instance
DROP TRIGGER IF EXISTS set_template_instance_updated_at ON public.template_instance;
CREATE TRIGGER set_template_instance_updated_at BEFORE UPDATE ON public.template_instance
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Managed Resource
DROP TRIGGER IF EXISTS set_managed_resource_updated_at ON public.managed_resource;
CREATE TRIGGER set_managed_resource_updated_at BEFORE UPDATE ON public.managed_resource
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- IaC Workspace
DROP TRIGGER IF EXISTS set_iac_workspace_updated_at ON public.iac_workspace;
CREATE TRIGGER set_iac_workspace_updated_at BEFORE UPDATE ON public.iac_workspace
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Observability Backend
DROP TRIGGER IF EXISTS set_observability_backend_updated_at ON public.observability_backend;
CREATE TRIGGER set_observability_backend_updated_at BEFORE UPDATE ON public.observability_backend
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Incident
DROP TRIGGER IF EXISTS set_incident_updated_at ON public.incident;
CREATE TRIGGER set_incident_updated_at BEFORE UPDATE ON public.incident
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- SLA Policy
DROP TRIGGER IF EXISTS set_sla_policy_updated_at ON public.sla_policy;
CREATE TRIGGER set_sla_policy_updated_at BEFORE UPDATE ON public.sla_policy
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Integration Endpoint
DROP TRIGGER IF EXISTS set_integration_endpoint_updated_at ON public.integration_endpoint;
CREATE TRIGGER set_integration_endpoint_updated_at BEFORE UPDATE ON public.integration_endpoint
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Webhook Subscription
DROP TRIGGER IF EXISTS set_webhook_subscription_updated_at ON public.webhook_subscription;
CREATE TRIGGER set_webhook_subscription_updated_at BEFORE UPDATE ON public.webhook_subscription
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Billing Account
DROP TRIGGER IF EXISTS set_billing_account_updated_at ON public.billing_account;
CREATE TRIGGER set_billing_account_updated_at BEFORE UPDATE ON public.billing_account
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Cost Allocation Rule
DROP TRIGGER IF EXISTS set_cost_allocation_rule_updated_at ON public.cost_allocation_rule;
CREATE TRIGGER set_cost_allocation_rule_updated_at BEFORE UPDATE ON public.cost_allocation_rule
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Budget
DROP TRIGGER IF EXISTS set_budget_updated_at ON public.budget;
CREATE TRIGGER set_budget_updated_at BEFORE UPDATE ON public.budget
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- AI System
DROP TRIGGER IF EXISTS set_ai_system_updated_at ON public.ai_system;
CREATE TRIGGER set_ai_system_updated_at BEFORE UPDATE ON public.ai_system
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Model Card
DROP TRIGGER IF EXISTS set_model_card_updated_at ON public.model_card;
CREATE TRIGGER set_model_card_updated_at BEFORE UPDATE ON public.model_card
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Monitoring Plan
DROP TRIGGER IF EXISTS set_monitoring_plan_updated_at ON public.monitoring_plan;
CREATE TRIGGER set_monitoring_plan_updated_at BEFORE UPDATE ON public.monitoring_plan
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Data Contract
DROP TRIGGER IF EXISTS set_data_contract_updated_at ON public.data_contract;
CREATE TRIGGER set_data_contract_updated_at BEFORE UPDATE ON public.data_contract
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Dashboard
DROP TRIGGER IF EXISTS set_dashboard_updated_at ON public.dashboard;
CREATE TRIGGER set_dashboard_updated_at BEFORE UPDATE ON public.dashboard
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- END OF MIGRATION: Advanced Features Tables
-- ============================================================================
