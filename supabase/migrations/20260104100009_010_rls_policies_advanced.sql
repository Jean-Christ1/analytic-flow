-- ============================================================================
-- MIGRATION: Row Level Security (RLS) Policies - Advanced Tables
-- Schema: MLOps Control Plane v3
-- Author: Armand AMOUSSOU
-- Date: 2026-01-04
-- ============================================================================
-- This migration implements RLS policies for advanced feature tables including:
-- Pipelines, Policies, Catalog, Resources, IaC, Observability, Incidents,
-- Webhooks, FinOps, AI Governance, Data Contracts, and Dashboards.
-- ============================================================================

-- ============================================================================
-- SECTION 8: PIPELINES DAG TABLES RLS POLICIES
-- ============================================================================

-- pipeline_definition: Project-scoped access
DROP POLICY IF EXISTS pipeline_definition_select_policy ON public.pipeline_definition;
CREATE POLICY pipeline_definition_select_policy ON public.pipeline_definition
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_access(project_id)
    );

DROP POLICY IF EXISTS pipeline_definition_insert_policy ON public.pipeline_definition;
CREATE POLICY pipeline_definition_insert_policy ON public.pipeline_definition
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_permission(project_id, 'mlops:create_pipeline')
    );

DROP POLICY IF EXISTS pipeline_definition_update_policy ON public.pipeline_definition;
CREATE POLICY pipeline_definition_update_policy ON public.pipeline_definition
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_permission(project_id, 'mlops:update_pipeline')
    );

DROP POLICY IF EXISTS pipeline_definition_delete_policy ON public.pipeline_definition;
CREATE POLICY pipeline_definition_delete_policy ON public.pipeline_definition
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_permission(project_id, 'mlops:delete_pipeline')
    );

-- pipeline_node: Pipeline-scoped access
DROP POLICY IF EXISTS pipeline_node_select_policy ON public.pipeline_node;
CREATE POLICY pipeline_node_select_policy ON public.pipeline_node
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.pipeline_definition pd
            WHERE pd.id = pipeline_definition_id
            AND public.has_project_access(pd.project_id)
        )
    );

DROP POLICY IF EXISTS pipeline_node_insert_policy ON public.pipeline_node;
CREATE POLICY pipeline_node_insert_policy ON public.pipeline_node
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.pipeline_definition pd
            WHERE pd.id = pipeline_definition_id
            AND public.has_project_permission(pd.project_id, 'mlops:update_pipeline')
        )
    );

DROP POLICY IF EXISTS pipeline_node_update_policy ON public.pipeline_node;
CREATE POLICY pipeline_node_update_policy ON public.pipeline_node
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.pipeline_definition pd
            WHERE pd.id = pipeline_definition_id
            AND public.has_project_permission(pd.project_id, 'mlops:update_pipeline')
        )
    );

DROP POLICY IF EXISTS pipeline_node_delete_policy ON public.pipeline_node;
CREATE POLICY pipeline_node_delete_policy ON public.pipeline_node
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.pipeline_definition pd
            WHERE pd.id = pipeline_definition_id
            AND public.has_project_permission(pd.project_id, 'mlops:update_pipeline')
        )
    );

-- pipeline_edge: Pipeline-scoped access (read via nodes)
DROP POLICY IF EXISTS pipeline_edge_select_policy ON public.pipeline_edge;
CREATE POLICY pipeline_edge_select_policy ON public.pipeline_edge
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.pipeline_node pn
            INNER JOIN public.pipeline_definition pd ON pd.id = pn.pipeline_definition_id
            WHERE pn.id = from_node_id
            AND public.has_project_access(pd.project_id)
        )
    );

DROP POLICY IF EXISTS pipeline_edge_insert_policy ON public.pipeline_edge;
CREATE POLICY pipeline_edge_insert_policy ON public.pipeline_edge
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.pipeline_node pn
            INNER JOIN public.pipeline_definition pd ON pd.id = pn.pipeline_definition_id
            WHERE pn.id = from_node_id
            AND public.has_project_permission(pd.project_id, 'mlops:update_pipeline')
        )
    );

DROP POLICY IF EXISTS pipeline_edge_delete_policy ON public.pipeline_edge;
CREATE POLICY pipeline_edge_delete_policy ON public.pipeline_edge
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.pipeline_node pn
            INNER JOIN public.pipeline_definition pd ON pd.id = pn.pipeline_definition_id
            WHERE pn.id = from_node_id
            AND public.has_project_permission(pd.project_id, 'mlops:update_pipeline')
        )
    );

-- pipeline_run: Pipeline-scoped access (uses direct project_id)
DROP POLICY IF EXISTS pipeline_run_select_policy ON public.pipeline_run;
CREATE POLICY pipeline_run_select_policy ON public.pipeline_run
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_access(project_id)
    );

DROP POLICY IF EXISTS pipeline_run_insert_policy ON public.pipeline_run;
CREATE POLICY pipeline_run_insert_policy ON public.pipeline_run
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_permission(project_id, 'mlops:run_pipeline')
    );

DROP POLICY IF EXISTS pipeline_run_update_policy ON public.pipeline_run;
CREATE POLICY pipeline_run_update_policy ON public.pipeline_run
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND (
            created_by = auth.uid()
            OR public.has_project_permission(project_id, 'mlops:update_pipeline')
        )
    );

-- pipeline_run_node: Run-scoped access
DROP POLICY IF EXISTS pipeline_run_node_select_policy ON public.pipeline_run_node;
CREATE POLICY pipeline_run_node_select_policy ON public.pipeline_run_node
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.pipeline_run pr
            WHERE pr.id = pipeline_run_id
            AND public.has_project_access(pr.project_id)
        )
    );

-- pipeline_schedule: Pipeline-scoped access (uses direct project_id)
DROP POLICY IF EXISTS pipeline_schedule_select_policy ON public.pipeline_schedule;
CREATE POLICY pipeline_schedule_select_policy ON public.pipeline_schedule
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_access(project_id)
    );

DROP POLICY IF EXISTS pipeline_schedule_insert_policy ON public.pipeline_schedule;
CREATE POLICY pipeline_schedule_insert_policy ON public.pipeline_schedule
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_permission(project_id, 'mlops:schedule_pipeline')
    );

DROP POLICY IF EXISTS pipeline_schedule_update_policy ON public.pipeline_schedule;
CREATE POLICY pipeline_schedule_update_policy ON public.pipeline_schedule
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_permission(project_id, 'mlops:schedule_pipeline')
    );

DROP POLICY IF EXISTS pipeline_schedule_delete_policy ON public.pipeline_schedule;
CREATE POLICY pipeline_schedule_delete_policy ON public.pipeline_schedule
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_permission(project_id, 'mlops:schedule_pipeline')
    );

-- ============================================================================
-- SECTION 9: OPA/REGO POLICY TABLES RLS POLICIES
-- ============================================================================

-- policy_bundle: Tenant-scoped admin access
DROP POLICY IF EXISTS policy_bundle_select_policy ON public.policy_bundle;
CREATE POLICY policy_bundle_select_policy ON public.policy_bundle
    FOR SELECT
    USING (tenant_id = public.get_current_tenant_id());

DROP POLICY IF EXISTS policy_bundle_insert_policy ON public.policy_bundle;
CREATE POLICY policy_bundle_insert_policy ON public.policy_bundle
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS policy_bundle_update_policy ON public.policy_bundle;
CREATE POLICY policy_bundle_update_policy ON public.policy_bundle
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS policy_bundle_delete_policy ON public.policy_bundle;
CREATE POLICY policy_bundle_delete_policy ON public.policy_bundle
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

-- policy_assignment: Scope-based access (uses scope_type and scope_id)
DROP POLICY IF EXISTS policy_assignment_select_policy ON public.policy_assignment;
CREATE POLICY policy_assignment_select_policy ON public.policy_assignment
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND (scope_type != 'project' OR scope_id IS NULL OR public.has_project_access(scope_id))
    );

DROP POLICY IF EXISTS policy_assignment_insert_policy ON public.policy_assignment;
CREATE POLICY policy_assignment_insert_policy ON public.policy_assignment
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND (
            (scope_type != 'project' AND public.is_tenant_admin())
            OR (scope_type = 'project' AND scope_id IS NOT NULL AND public.has_project_permission(scope_id, 'security:manage_policies'))
        )
    );

DROP POLICY IF EXISTS policy_assignment_update_policy ON public.policy_assignment;
CREATE POLICY policy_assignment_update_policy ON public.policy_assignment
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND (
            (scope_type != 'project' AND public.is_tenant_admin())
            OR (scope_type = 'project' AND scope_id IS NOT NULL AND public.has_project_permission(scope_id, 'security:manage_policies'))
        )
    );

DROP POLICY IF EXISTS policy_assignment_delete_policy ON public.policy_assignment;
CREATE POLICY policy_assignment_delete_policy ON public.policy_assignment
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND (
            (scope_type != 'project' AND public.is_tenant_admin())
            OR (scope_type = 'project' AND scope_id IS NOT NULL AND public.has_project_permission(scope_id, 'security:manage_policies'))
        )
    );

-- policy_decision_log: Read-only access for auditing (tenant-scoped via bundle_id)
DROP POLICY IF EXISTS policy_decision_log_select_policy ON public.policy_decision_log;
CREATE POLICY policy_decision_log_select_policy ON public.policy_decision_log
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
    );

DROP POLICY IF EXISTS policy_decision_log_insert_policy ON public.policy_decision_log;
CREATE POLICY policy_decision_log_insert_policy ON public.policy_decision_log
    FOR INSERT
    WITH CHECK (tenant_id = public.get_current_tenant_id());

-- ============================================================================
-- SECTION 10: CATALOG TABLES RLS POLICIES
-- ============================================================================

-- catalog_item: Tenant-scoped with status-based visibility
DROP POLICY IF EXISTS catalog_item_select_policy ON public.catalog_item;
CREATE POLICY catalog_item_select_policy ON public.catalog_item
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND (
            status = 'active'
            OR public.is_tenant_admin()
            OR created_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS catalog_item_insert_policy ON public.catalog_item;
CREATE POLICY catalog_item_insert_policy ON public.catalog_item
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND (public.is_tenant_admin() OR created_by = auth.uid())
    );

DROP POLICY IF EXISTS catalog_item_update_policy ON public.catalog_item;
CREATE POLICY catalog_item_update_policy ON public.catalog_item
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND (public.is_tenant_admin() OR created_by = auth.uid())
    );

DROP POLICY IF EXISTS catalog_item_delete_policy ON public.catalog_item;
CREATE POLICY catalog_item_delete_policy ON public.catalog_item
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND (public.is_tenant_admin() OR created_by = auth.uid())
    );

-- catalog_item_dependency: Catalog item-scoped access
DROP POLICY IF EXISTS catalog_item_dependency_select_policy ON public.catalog_item_dependency;
CREATE POLICY catalog_item_dependency_select_policy ON public.catalog_item_dependency
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.catalog_item ci
            WHERE ci.id = item_id
            AND (ci.status = 'active' OR public.is_tenant_admin() OR ci.created_by = auth.uid())
        )
    );

-- template_instance: Project-scoped access
DROP POLICY IF EXISTS template_instance_select_policy ON public.template_instance;
CREATE POLICY template_instance_select_policy ON public.template_instance
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_access(project_id)
    );

DROP POLICY IF EXISTS template_instance_insert_policy ON public.template_instance;
CREATE POLICY template_instance_insert_policy ON public.template_instance
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_access(project_id)
    );

DROP POLICY IF EXISTS template_instance_update_policy ON public.template_instance;
CREATE POLICY template_instance_update_policy ON public.template_instance
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND (created_by = auth.uid() OR public.has_project_permission(project_id, 'project:update'))
    );

-- ============================================================================
-- SECTION 11: RESOURCE INVENTORY TABLES RLS POLICIES
-- ============================================================================

-- managed_resource: Project-scoped access
DROP POLICY IF EXISTS managed_resource_select_policy ON public.managed_resource;
CREATE POLICY managed_resource_select_policy ON public.managed_resource
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND (project_id IS NULL OR public.has_project_access(project_id))
    );

DROP POLICY IF EXISTS managed_resource_insert_policy ON public.managed_resource;
CREATE POLICY managed_resource_insert_policy ON public.managed_resource
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND (
            (project_id IS NULL AND public.is_tenant_admin())
            OR (project_id IS NOT NULL AND public.has_project_permission(project_id, 'admin:manage_resources'))
        )
    );

DROP POLICY IF EXISTS managed_resource_update_policy ON public.managed_resource;
CREATE POLICY managed_resource_update_policy ON public.managed_resource
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND (
            (project_id IS NULL AND public.is_tenant_admin())
            OR (project_id IS NOT NULL AND public.has_project_permission(project_id, 'admin:manage_resources'))
        )
    );

DROP POLICY IF EXISTS managed_resource_delete_policy ON public.managed_resource;
CREATE POLICY managed_resource_delete_policy ON public.managed_resource
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND (
            (project_id IS NULL AND public.is_tenant_admin())
            OR (project_id IS NOT NULL AND public.has_project_permission(project_id, 'admin:manage_resources'))
        )
    );

-- resource_relation: Resource-scoped access
DROP POLICY IF EXISTS resource_relation_select_policy ON public.resource_relation;
CREATE POLICY resource_relation_select_policy ON public.resource_relation
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.managed_resource mr
            WHERE mr.id = from_resource_id
            AND (mr.project_id IS NULL OR public.has_project_access(mr.project_id))
        )
    );

-- drift_event: Resource-scoped access
DROP POLICY IF EXISTS drift_event_select_policy ON public.drift_event;
CREATE POLICY drift_event_select_policy ON public.drift_event
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.managed_resource mr
            WHERE mr.id = resource_id
            AND (mr.project_id IS NULL OR public.has_project_access(mr.project_id))
        )
    );

-- ============================================================================
-- SECTION 12: IaC TABLES RLS POLICIES
-- ============================================================================

-- iac_workspace: Project-scoped access
DROP POLICY IF EXISTS iac_workspace_select_policy ON public.iac_workspace;
CREATE POLICY iac_workspace_select_policy ON public.iac_workspace
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_access(project_id)
    );

DROP POLICY IF EXISTS iac_workspace_insert_policy ON public.iac_workspace;
CREATE POLICY iac_workspace_insert_policy ON public.iac_workspace
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_permission(project_id, 'admin:manage_iac')
    );

DROP POLICY IF EXISTS iac_workspace_update_policy ON public.iac_workspace;
CREATE POLICY iac_workspace_update_policy ON public.iac_workspace
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_permission(project_id, 'admin:manage_iac')
    );

DROP POLICY IF EXISTS iac_workspace_delete_policy ON public.iac_workspace;
CREATE POLICY iac_workspace_delete_policy ON public.iac_workspace
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_permission(project_id, 'admin:manage_iac')
    );

-- iac_run: Workspace-scoped access
DROP POLICY IF EXISTS iac_run_select_policy ON public.iac_run;
CREATE POLICY iac_run_select_policy ON public.iac_run
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.iac_workspace iw
            WHERE iw.id = workspace_id
            AND public.has_project_access(iw.project_id)
        )
    );

DROP POLICY IF EXISTS iac_run_insert_policy ON public.iac_run;
CREATE POLICY iac_run_insert_policy ON public.iac_run
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.iac_workspace iw
            WHERE iw.id = workspace_id
            AND public.has_project_permission(iw.project_id, 'admin:run_iac')
        )
    );

-- iac_change_summary: Run-scoped access
DROP POLICY IF EXISTS iac_change_summary_select_policy ON public.iac_change_summary;
CREATE POLICY iac_change_summary_select_policy ON public.iac_change_summary
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.iac_run ir
            INNER JOIN public.iac_workspace iw ON iw.id = ir.workspace_id
            WHERE ir.id = iac_run_id
            AND public.has_project_access(iw.project_id)
        )
    );

-- ============================================================================
-- SECTION 13: OBSERVABILITY TABLES RLS POLICIES
-- ============================================================================

-- observability_backend: Tenant-scoped admin access
DROP POLICY IF EXISTS observability_backend_select_policy ON public.observability_backend;
CREATE POLICY observability_backend_select_policy ON public.observability_backend
    FOR SELECT
    USING (tenant_id = public.get_current_tenant_id());

DROP POLICY IF EXISTS observability_backend_insert_policy ON public.observability_backend;
CREATE POLICY observability_backend_insert_policy ON public.observability_backend
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS observability_backend_update_policy ON public.observability_backend;
CREATE POLICY observability_backend_update_policy ON public.observability_backend
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS observability_backend_delete_policy ON public.observability_backend;
CREATE POLICY observability_backend_delete_policy ON public.observability_backend
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

-- observability_link: Resource-scoped access
DROP POLICY IF EXISTS observability_link_select_policy ON public.observability_link;
CREATE POLICY observability_link_select_policy ON public.observability_link
    FOR SELECT
    USING (tenant_id = public.get_current_tenant_id());

DROP POLICY IF EXISTS observability_link_insert_policy ON public.observability_link;
CREATE POLICY observability_link_insert_policy ON public.observability_link
    FOR INSERT
    WITH CHECK (tenant_id = public.get_current_tenant_id());

-- ============================================================================
-- SECTION 14: INCIDENTS AND SLA TABLES RLS POLICIES
-- ============================================================================

-- incident: Project-scoped access
DROP POLICY IF EXISTS incident_select_policy ON public.incident;
CREATE POLICY incident_select_policy ON public.incident
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND (
            public.is_tenant_admin()
            OR owner_user_id = auth.uid()
            OR public.has_project_access(project_id)
        )
    );

DROP POLICY IF EXISTS incident_insert_policy ON public.incident;
CREATE POLICY incident_insert_policy ON public.incident
    FOR INSERT
    WITH CHECK (tenant_id = public.get_current_tenant_id());

DROP POLICY IF EXISTS incident_update_policy ON public.incident;
CREATE POLICY incident_update_policy ON public.incident
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND (
            public.is_tenant_admin()
            OR owner_user_id = auth.uid()
            OR public.has_project_permission(project_id, 'observability:manage_incidents')
        )
    );

-- incident_update: Incident-scoped access
DROP POLICY IF EXISTS incident_update_select_policy ON public.incident_update;
CREATE POLICY incident_update_select_policy ON public.incident_update
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.incident i
            WHERE i.id = incident_id
            AND (
                public.is_tenant_admin()
                OR i.owner_user_id = auth.uid()
                OR public.has_project_access(i.project_id)
            )
        )
    );

DROP POLICY IF EXISTS incident_update_insert_policy ON public.incident_update;
CREATE POLICY incident_update_insert_policy ON public.incident_update
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND author_user_id = auth.uid()
    );

-- sla_policy: Tenant-scoped admin access
DROP POLICY IF EXISTS sla_policy_select_policy ON public.sla_policy;
CREATE POLICY sla_policy_select_policy ON public.sla_policy
    FOR SELECT
    USING (tenant_id = public.get_current_tenant_id());

DROP POLICY IF EXISTS sla_policy_insert_policy ON public.sla_policy;
CREATE POLICY sla_policy_insert_policy ON public.sla_policy
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS sla_policy_update_policy ON public.sla_policy;
CREATE POLICY sla_policy_update_policy ON public.sla_policy
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS sla_policy_delete_policy ON public.sla_policy;
CREATE POLICY sla_policy_delete_policy ON public.sla_policy
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

-- ============================================================================
-- SECTION 15: WEBHOOKS AND INTEGRATIONS TABLES RLS POLICIES
-- ============================================================================

-- integration_endpoint: Tenant-scoped admin access
DROP POLICY IF EXISTS integration_endpoint_select_policy ON public.integration_endpoint;
CREATE POLICY integration_endpoint_select_policy ON public.integration_endpoint
    FOR SELECT
    USING (tenant_id = public.get_current_tenant_id());

DROP POLICY IF EXISTS integration_endpoint_insert_policy ON public.integration_endpoint;
CREATE POLICY integration_endpoint_insert_policy ON public.integration_endpoint
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS integration_endpoint_update_policy ON public.integration_endpoint;
CREATE POLICY integration_endpoint_update_policy ON public.integration_endpoint
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS integration_endpoint_delete_policy ON public.integration_endpoint;
CREATE POLICY integration_endpoint_delete_policy ON public.integration_endpoint
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

-- webhook_subscription: Tenant-scoped with project access
DROP POLICY IF EXISTS webhook_subscription_select_policy ON public.webhook_subscription;
CREATE POLICY webhook_subscription_select_policy ON public.webhook_subscription
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND (project_id IS NULL OR public.has_project_access(project_id))
    );

DROP POLICY IF EXISTS webhook_subscription_insert_policy ON public.webhook_subscription;
CREATE POLICY webhook_subscription_insert_policy ON public.webhook_subscription
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND (
            (project_id IS NULL AND public.is_tenant_admin())
            OR (project_id IS NOT NULL AND public.has_project_permission(project_id, 'admin:manage_webhooks'))
        )
    );

DROP POLICY IF EXISTS webhook_subscription_update_policy ON public.webhook_subscription;
CREATE POLICY webhook_subscription_update_policy ON public.webhook_subscription
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND (
            (project_id IS NULL AND public.is_tenant_admin())
            OR (project_id IS NOT NULL AND public.has_project_permission(project_id, 'admin:manage_webhooks'))
        )
    );

DROP POLICY IF EXISTS webhook_subscription_delete_policy ON public.webhook_subscription;
CREATE POLICY webhook_subscription_delete_policy ON public.webhook_subscription
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND (
            (project_id IS NULL AND public.is_tenant_admin())
            OR (project_id IS NOT NULL AND public.has_project_permission(project_id, 'admin:manage_webhooks'))
        )
    );

-- webhook_delivery: Subscription-scoped access
DROP POLICY IF EXISTS webhook_delivery_select_policy ON public.webhook_delivery;
CREATE POLICY webhook_delivery_select_policy ON public.webhook_delivery
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.webhook_subscription ws
            WHERE ws.id = subscription_id
            AND (ws.project_id IS NULL OR public.has_project_access(ws.project_id))
        )
    );

-- ============================================================================
-- SECTION 16: FINOPS TABLES RLS POLICIES
-- ============================================================================

-- billing_account: Tenant-scoped admin access
DROP POLICY IF EXISTS billing_account_select_policy ON public.billing_account;
CREATE POLICY billing_account_select_policy ON public.billing_account
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS billing_account_insert_policy ON public.billing_account;
CREATE POLICY billing_account_insert_policy ON public.billing_account
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS billing_account_update_policy ON public.billing_account;
CREATE POLICY billing_account_update_policy ON public.billing_account
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

-- cost_allocation_rule: Tenant-scoped admin access
DROP POLICY IF EXISTS cost_allocation_rule_select_policy ON public.cost_allocation_rule;
CREATE POLICY cost_allocation_rule_select_policy ON public.cost_allocation_rule
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS cost_allocation_rule_insert_policy ON public.cost_allocation_rule;
CREATE POLICY cost_allocation_rule_insert_policy ON public.cost_allocation_rule
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS cost_allocation_rule_update_policy ON public.cost_allocation_rule;
CREATE POLICY cost_allocation_rule_update_policy ON public.cost_allocation_rule
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS cost_allocation_rule_delete_policy ON public.cost_allocation_rule;
CREATE POLICY cost_allocation_rule_delete_policy ON public.cost_allocation_rule
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

-- cost_record: Project-scoped read access
DROP POLICY IF EXISTS cost_record_select_policy ON public.cost_record;
CREATE POLICY cost_record_select_policy ON public.cost_record
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND (
            public.is_tenant_admin()
            OR (project_id IS NOT NULL AND public.has_project_access(project_id))
        )
    );

DROP POLICY IF EXISTS cost_record_insert_policy ON public.cost_record;
CREATE POLICY cost_record_insert_policy ON public.cost_record
    FOR INSERT
    WITH CHECK (tenant_id = public.get_current_tenant_id());

-- budget: Scope-based access (tenant/org/project)
DROP POLICY IF EXISTS budget_select_policy ON public.budget;
CREATE POLICY budget_select_policy ON public.budget
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND (
            public.is_tenant_admin()
            OR (scope_type = 'project' AND scope_id IS NOT NULL AND public.has_project_access(scope_id))
        )
    );

DROP POLICY IF EXISTS budget_insert_policy ON public.budget;
CREATE POLICY budget_insert_policy ON public.budget
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND (
            (scope_type != 'project' AND public.is_tenant_admin())
            OR (scope_type = 'project' AND scope_id IS NOT NULL AND public.has_project_permission(scope_id, 'admin:manage_budget'))
        )
    );

DROP POLICY IF EXISTS budget_update_policy ON public.budget;
CREATE POLICY budget_update_policy ON public.budget
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND (
            (scope_type != 'project' AND public.is_tenant_admin())
            OR (scope_type = 'project' AND scope_id IS NOT NULL AND public.has_project_permission(scope_id, 'admin:manage_budget'))
        )
    );

-- carbon_record: Tenant-scoped read access
DROP POLICY IF EXISTS carbon_record_select_policy ON public.carbon_record;
CREATE POLICY carbon_record_select_policy ON public.carbon_record
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
    );

DROP POLICY IF EXISTS carbon_record_insert_policy ON public.carbon_record;
CREATE POLICY carbon_record_insert_policy ON public.carbon_record
    FOR INSERT
    WITH CHECK (tenant_id = public.get_current_tenant_id());

-- efficiency_kpi_snapshot: Project-scoped read access
DROP POLICY IF EXISTS efficiency_kpi_snapshot_select_policy ON public.efficiency_kpi_snapshot;
CREATE POLICY efficiency_kpi_snapshot_select_policy ON public.efficiency_kpi_snapshot
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND (
            public.is_tenant_admin()
            OR (project_id IS NOT NULL AND public.has_project_access(project_id))
        )
    );

DROP POLICY IF EXISTS efficiency_kpi_snapshot_insert_policy ON public.efficiency_kpi_snapshot;
CREATE POLICY efficiency_kpi_snapshot_insert_policy ON public.efficiency_kpi_snapshot
    FOR INSERT
    WITH CHECK (tenant_id = public.get_current_tenant_id());

-- ============================================================================
-- SECTION 17: AI GOVERNANCE TABLES RLS POLICIES
-- ============================================================================

-- ai_system: Project-scoped access
DROP POLICY IF EXISTS ai_system_select_policy ON public.ai_system;
CREATE POLICY ai_system_select_policy ON public.ai_system
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_access(project_id)
    );

DROP POLICY IF EXISTS ai_system_insert_policy ON public.ai_system;
CREATE POLICY ai_system_insert_policy ON public.ai_system
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_permission(project_id, 'mlops:create_ai_system')
    );

DROP POLICY IF EXISTS ai_system_update_policy ON public.ai_system;
CREATE POLICY ai_system_update_policy ON public.ai_system
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_permission(project_id, 'mlops:update_ai_system')
    );

DROP POLICY IF EXISTS ai_system_delete_policy ON public.ai_system;
CREATE POLICY ai_system_delete_policy ON public.ai_system
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_permission(project_id, 'mlops:delete_ai_system')
    );

-- model_card: Model-scoped access (via model_version -> model)
DROP POLICY IF EXISTS model_card_select_policy ON public.model_card;
CREATE POLICY model_card_select_policy ON public.model_card
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.model_version mv
            INNER JOIN public.model m ON m.id = mv.model_id
            WHERE mv.id = model_version_id
            AND public.has_project_access(m.project_id)
        )
    );

DROP POLICY IF EXISTS model_card_insert_policy ON public.model_card;
CREATE POLICY model_card_insert_policy ON public.model_card
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.model_version mv
            INNER JOIN public.model m ON m.id = mv.model_id
            WHERE mv.id = model_version_id
            AND public.has_project_permission(m.project_id, 'mlops:update_model')
        )
    );

DROP POLICY IF EXISTS model_card_update_policy ON public.model_card;
CREATE POLICY model_card_update_policy ON public.model_card
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.model_version mv
            INNER JOIN public.model m ON m.id = mv.model_id
            WHERE mv.id = model_version_id
            AND public.has_project_permission(m.project_id, 'mlops:update_model')
        )
    );

-- risk_assessment: AI System-scoped access
DROP POLICY IF EXISTS risk_assessment_select_policy ON public.risk_assessment;
CREATE POLICY risk_assessment_select_policy ON public.risk_assessment
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.ai_system ais
            WHERE ais.id = ai_system_id
            AND public.has_project_access(ais.project_id)
        )
    );

DROP POLICY IF EXISTS risk_assessment_insert_policy ON public.risk_assessment;
CREATE POLICY risk_assessment_insert_policy ON public.risk_assessment
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.ai_system ais
            WHERE ais.id = ai_system_id
            AND public.has_project_permission(ais.project_id, 'mlops:update_ai_system')
        )
    );

DROP POLICY IF EXISTS risk_assessment_update_policy ON public.risk_assessment;
CREATE POLICY risk_assessment_update_policy ON public.risk_assessment
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.ai_system ais
            WHERE ais.id = ai_system_id
            AND public.has_project_permission(ais.project_id, 'mlops:update_ai_system')
        )
    );

-- compliance_control: Tenant-scoped admin access
DROP POLICY IF EXISTS compliance_control_select_policy ON public.compliance_control;
CREATE POLICY compliance_control_select_policy ON public.compliance_control
    FOR SELECT
    USING (tenant_id = public.get_current_tenant_id());

DROP POLICY IF EXISTS compliance_control_insert_policy ON public.compliance_control;
CREATE POLICY compliance_control_insert_policy ON public.compliance_control
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS compliance_control_update_policy ON public.compliance_control;
CREATE POLICY compliance_control_update_policy ON public.compliance_control
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

-- compliance_evidence: Control-scoped access (tenant level)
DROP POLICY IF EXISTS compliance_evidence_select_policy ON public.compliance_evidence;
CREATE POLICY compliance_evidence_select_policy ON public.compliance_evidence
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
    );

DROP POLICY IF EXISTS compliance_evidence_insert_policy ON public.compliance_evidence;
CREATE POLICY compliance_evidence_insert_policy ON public.compliance_evidence
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

-- monitoring_plan: AI System-scoped access
DROP POLICY IF EXISTS monitoring_plan_select_policy ON public.monitoring_plan;
CREATE POLICY monitoring_plan_select_policy ON public.monitoring_plan
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.ai_system ais
            WHERE ais.id = ai_system_id
            AND public.has_project_access(ais.project_id)
        )
    );

DROP POLICY IF EXISTS monitoring_plan_insert_policy ON public.monitoring_plan;
CREATE POLICY monitoring_plan_insert_policy ON public.monitoring_plan
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.ai_system ais
            WHERE ais.id = ai_system_id
            AND public.has_project_permission(ais.project_id, 'mlops:update_ai_system')
        )
    );

DROP POLICY IF EXISTS monitoring_plan_update_policy ON public.monitoring_plan;
CREATE POLICY monitoring_plan_update_policy ON public.monitoring_plan
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.ai_system ais
            WHERE ais.id = ai_system_id
            AND public.has_project_permission(ais.project_id, 'mlops:update_ai_system')
        )
    );

-- governance_incident: AI System-scoped access
DROP POLICY IF EXISTS governance_incident_select_policy ON public.governance_incident;
CREATE POLICY governance_incident_select_policy ON public.governance_incident
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.ai_system ais
            WHERE ais.id = ai_system_id
            AND public.has_project_access(ais.project_id)
        )
    );

DROP POLICY IF EXISTS governance_incident_insert_policy ON public.governance_incident;
CREATE POLICY governance_incident_insert_policy ON public.governance_incident
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.ai_system ais
            WHERE ais.id = ai_system_id
            AND public.has_project_permission(ais.project_id, 'mlops:create_ai_system')
        )
    );

DROP POLICY IF EXISTS governance_incident_update_policy ON public.governance_incident;
CREATE POLICY governance_incident_update_policy ON public.governance_incident
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND (
            owner_user_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.ai_system ais
                WHERE ais.id = ai_system_id
                AND public.has_project_permission(ais.project_id, 'mlops:update_ai_system')
            )
        )
    );

-- ============================================================================
-- SECTION 18: DATA CONTRACTS TABLES RLS POLICIES
-- ============================================================================

-- data_contract: Project-scoped access
DROP POLICY IF EXISTS data_contract_select_policy ON public.data_contract;
CREATE POLICY data_contract_select_policy ON public.data_contract
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_access(project_id)
    );

DROP POLICY IF EXISTS data_contract_insert_policy ON public.data_contract;
CREATE POLICY data_contract_insert_policy ON public.data_contract
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_permission(project_id, 'mlops:create_data_contract')
    );

DROP POLICY IF EXISTS data_contract_update_policy ON public.data_contract;
CREATE POLICY data_contract_update_policy ON public.data_contract
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_permission(project_id, 'mlops:update_data_contract')
    );

DROP POLICY IF EXISTS data_contract_delete_policy ON public.data_contract;
CREATE POLICY data_contract_delete_policy ON public.data_contract
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_permission(project_id, 'mlops:delete_data_contract')
    );

-- data_contract_binding: Contract-scoped access (via contract_id -> data_contract.project_id)
DROP POLICY IF EXISTS data_contract_binding_select_policy ON public.data_contract_binding;
CREATE POLICY data_contract_binding_select_policy ON public.data_contract_binding
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.data_contract dc
            WHERE dc.id = contract_id
            AND public.has_project_access(dc.project_id)
        )
    );

DROP POLICY IF EXISTS data_contract_binding_insert_policy ON public.data_contract_binding;
CREATE POLICY data_contract_binding_insert_policy ON public.data_contract_binding
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.data_contract dc
            WHERE dc.id = contract_id
            AND public.has_project_permission(dc.project_id, 'mlops:update_data_contract')
        )
    );

DROP POLICY IF EXISTS data_contract_binding_update_policy ON public.data_contract_binding;
CREATE POLICY data_contract_binding_update_policy ON public.data_contract_binding
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.data_contract dc
            WHERE dc.id = contract_id
            AND public.has_project_permission(dc.project_id, 'mlops:update_data_contract')
        )
    );

-- ============================================================================
-- SECTION 19: DASHBOARDS TABLES RLS POLICIES
-- ============================================================================

-- dashboard: Project-scoped access
DROP POLICY IF EXISTS dashboard_select_policy ON public.dashboard;
CREATE POLICY dashboard_select_policy ON public.dashboard
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND (
            public.has_project_access(project_id)
            OR created_by = auth.uid()
            OR public.is_tenant_admin()
        )
    );

DROP POLICY IF EXISTS dashboard_insert_policy ON public.dashboard;
CREATE POLICY dashboard_insert_policy ON public.dashboard
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_permission(project_id, 'project:create_dashboard')
    );

DROP POLICY IF EXISTS dashboard_update_policy ON public.dashboard;
CREATE POLICY dashboard_update_policy ON public.dashboard
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND (created_by = auth.uid() OR public.has_project_permission(project_id, 'project:update_dashboard') OR public.is_tenant_admin())
    );

DROP POLICY IF EXISTS dashboard_delete_policy ON public.dashboard;
CREATE POLICY dashboard_delete_policy ON public.dashboard
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND (created_by = auth.uid() OR public.has_project_permission(project_id, 'project:delete_dashboard') OR public.is_tenant_admin())
    );

-- dashboard_widget: Dashboard-scoped access (via dashboard.project_id)
DROP POLICY IF EXISTS dashboard_widget_select_policy ON public.dashboard_widget;
CREATE POLICY dashboard_widget_select_policy ON public.dashboard_widget
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.dashboard d
            WHERE d.id = dashboard_id
            AND (public.has_project_access(d.project_id) OR d.created_by = auth.uid() OR public.is_tenant_admin())
        )
    );

DROP POLICY IF EXISTS dashboard_widget_insert_policy ON public.dashboard_widget;
CREATE POLICY dashboard_widget_insert_policy ON public.dashboard_widget
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.dashboard d
            WHERE d.id = dashboard_id
            AND (d.created_by = auth.uid() OR public.has_project_permission(d.project_id, 'project:update_dashboard') OR public.is_tenant_admin())
        )
    );

DROP POLICY IF EXISTS dashboard_widget_update_policy ON public.dashboard_widget;
CREATE POLICY dashboard_widget_update_policy ON public.dashboard_widget
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.dashboard d
            WHERE d.id = dashboard_id
            AND (d.created_by = auth.uid() OR public.has_project_permission(d.project_id, 'project:update_dashboard') OR public.is_tenant_admin())
        )
    );

DROP POLICY IF EXISTS dashboard_widget_delete_policy ON public.dashboard_widget;
CREATE POLICY dashboard_widget_delete_policy ON public.dashboard_widget
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.dashboard d
            WHERE d.id = dashboard_id
            AND (d.created_by = auth.uid() OR public.has_project_permission(d.project_id, 'project:update_dashboard') OR public.is_tenant_admin())
        )
    );

-- ============================================================================
-- SECTION 20: EXECUTION LINKS TABLES RLS POLICIES
-- ============================================================================

-- execution_link: Tenant-scoped access
DROP POLICY IF EXISTS execution_link_select_policy ON public.execution_link;
CREATE POLICY execution_link_select_policy ON public.execution_link
    FOR SELECT
    USING (tenant_id = public.get_current_tenant_id());

DROP POLICY IF EXISTS execution_link_insert_policy ON public.execution_link;
CREATE POLICY execution_link_insert_policy ON public.execution_link
    FOR INSERT
    WITH CHECK (tenant_id = public.get_current_tenant_id());

-- ============================================================================
-- END OF MIGRATION: Row Level Security Policies - Advanced Tables
-- ============================================================================
