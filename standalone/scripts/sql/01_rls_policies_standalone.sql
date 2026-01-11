-- ============================================================================
-- APEX-ML-PLATFORM - Standalone RLS Policies
-- Version: 1.0.0
-- Author: Armand AMOUSSOU
-- Date: 2026-01-07
-- ============================================================================
-- This script adapts all RLS policies to use standalone helper functions
-- instead of Supabase auth.uid() and auth.role()
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTIONS FOR RLS
-- ============================================================================

-- Check if user has access to a project
CREATE OR REPLACE FUNCTION public.has_project_access(p_project_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_has_access BOOLEAN;
    v_current_user UUID;
BEGIN
    v_current_user := public.current_user_id();

    IF v_current_user IS NULL THEN
        RETURN false;
    END IF;

    -- Platform admin has access to everything
    IF public.is_platform_admin() THEN
        RETURN true;
    END IF;

    -- Check direct membership or group membership
    SELECT EXISTS (
        SELECT 1
        FROM public.principal_role_binding prb
        WHERE prb.scope_type = 'project' AND prb.scope_id = p_project_id
        AND (
            (prb.principal_type = 'user' AND prb.principal_id = v_current_user)
            OR (prb.principal_type = 'group' AND prb.principal_id IN (
                SELECT gm.group_id
                FROM public.group_member gm
                WHERE gm.user_id = v_current_user
            ))
        )
    ) INTO v_has_access;

    RETURN v_has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.has_project_access(UUID) IS 'Checks if current user has any access to the project';

-- Check if user has specific permission on a project
CREATE OR REPLACE FUNCTION public.has_project_permission(p_project_id UUID, p_permission_code VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    v_has_permission BOOLEAN;
    v_current_user UUID;
BEGIN
    v_current_user := public.current_user_id();

    IF v_current_user IS NULL THEN
        RETURN false;
    END IF;

    -- Platform admin has all permissions
    IF public.is_platform_admin() THEN
        RETURN true;
    END IF;

    -- Check permission through roles
    SELECT EXISTS (
        SELECT 1
        FROM public.principal_role_binding prb
        INNER JOIN public.role_permission rp ON rp.role_id = prb.role_id
        INNER JOIN public.permission p ON p.id = rp.permission_id
        WHERE prb.scope_type = 'project' AND prb.scope_id = p_project_id
        AND p.code = p_permission_code
        AND (
            (prb.principal_type = 'user' AND prb.principal_id = v_current_user)
            OR (prb.principal_type = 'group' AND prb.principal_id IN (
                SELECT gm.group_id
                FROM public.group_member gm
                WHERE gm.user_id = v_current_user
            ))
        )
    ) INTO v_has_permission;

    RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.has_project_permission(UUID, VARCHAR) IS 'Checks if current user has specific permission on the project';

-- Check if user belongs to tenant
CREATE OR REPLACE FUNCTION public.user_belongs_to_tenant(p_tenant_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_user UUID;
    v_belongs BOOLEAN;
BEGIN
    v_current_user := public.current_user_id();

    IF v_current_user IS NULL THEN
        RETURN false;
    END IF;

    -- Platform admin can access all tenants
    IF public.is_platform_admin() THEN
        RETURN true;
    END IF;

    -- Check current tenant from session
    IF p_tenant_id = public.current_tenant_id() THEN
        RETURN true;
    END IF;

    -- Check through user_account membership
    SELECT EXISTS (
        SELECT 1
        FROM public.user_account ua
        WHERE ua.id = v_current_user
        AND ua.tenant_id = p_tenant_id
    ) INTO v_belongs;

    RETURN v_belongs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.user_belongs_to_tenant(UUID) IS 'Checks if current user belongs to the tenant';

-- ============================================================================
-- DROP ALL EXISTING RLS POLICIES
-- ============================================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies in public schema
    FOR r IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
                       r.policyname, r.schemaname, r.tablename);
        RAISE NOTICE 'Dropped policy: %.%.%', r.schemaname, r.tablename, r.policyname;
    END LOOP;
END;
$$;

-- ============================================================================
-- TENANT POLICIES
-- ============================================================================

CREATE POLICY tenant_select_policy ON public.tenant
    FOR SELECT
    USING (
        public.is_platform_admin()
        OR id = public.current_tenant_id()
        OR public.user_belongs_to_tenant(id)
    );

CREATE POLICY tenant_insert_policy ON public.tenant
    FOR INSERT
    WITH CHECK (public.is_platform_admin());

CREATE POLICY tenant_update_policy ON public.tenant
    FOR UPDATE
    USING (
        public.is_platform_admin()
        OR (id = public.current_tenant_id() AND public.is_tenant_admin())
    );

CREATE POLICY tenant_delete_policy ON public.tenant
    FOR DELETE
    USING (public.is_platform_admin());

-- ============================================================================
-- ORG POLICIES
-- ============================================================================

CREATE POLICY org_select_policy ON public.org
    FOR SELECT
    USING (
        public.is_platform_admin()
        OR tenant_id = public.current_tenant_id()
    );

CREATE POLICY org_insert_policy ON public.org
    FOR INSERT
    WITH CHECK (
        public.is_platform_admin()
        OR (tenant_id = public.current_tenant_id() AND public.is_tenant_admin())
    );

CREATE POLICY org_update_policy ON public.org
    FOR UPDATE
    USING (
        public.is_platform_admin()
        OR (tenant_id = public.current_tenant_id() AND public.is_tenant_admin())
    );

CREATE POLICY org_delete_policy ON public.org
    FOR DELETE
    USING (
        public.is_platform_admin()
        OR (tenant_id = public.current_tenant_id() AND public.is_tenant_admin())
    );

-- ============================================================================
-- PROJECT POLICIES
-- ============================================================================

CREATE POLICY project_select_policy ON public.project
    FOR SELECT
    USING (
        public.is_platform_admin()
        OR (
            tenant_id = public.current_tenant_id()
            AND (
                visibility = 'public'
                OR visibility = 'internal'
                OR public.has_project_access(id)
                OR public.is_tenant_admin()
            )
        )
    );

CREATE POLICY project_insert_policy ON public.project
    FOR INSERT
    WITH CHECK (
        public.is_platform_admin()
        OR (tenant_id = public.current_tenant_id() AND public.is_tenant_admin())
    );

CREATE POLICY project_update_policy ON public.project
    FOR UPDATE
    USING (
        public.is_platform_admin()
        OR (
            tenant_id = public.current_tenant_id()
            AND (
                public.has_project_permission(id, 'project:update')
                OR public.is_tenant_admin()
            )
        )
    );

CREATE POLICY project_delete_policy ON public.project
    FOR DELETE
    USING (
        public.is_platform_admin()
        OR (tenant_id = public.current_tenant_id() AND public.is_tenant_admin())
    );

-- ============================================================================
-- USER_ACCOUNT POLICIES
-- ============================================================================

CREATE POLICY user_account_select_policy ON public.user_account
    FOR SELECT
    USING (
        public.is_platform_admin()
        OR tenant_id = public.current_tenant_id()
        OR id = public.current_user_id()
    );

CREATE POLICY user_account_insert_policy ON public.user_account
    FOR INSERT
    WITH CHECK (
        public.is_platform_admin()
        OR (tenant_id = public.current_tenant_id() AND public.is_tenant_admin())
    );

CREATE POLICY user_account_update_policy ON public.user_account
    FOR UPDATE
    USING (
        public.is_platform_admin()
        OR id = public.current_user_id()
        OR (tenant_id = public.current_tenant_id() AND public.is_tenant_admin())
    );

CREATE POLICY user_account_delete_policy ON public.user_account
    FOR DELETE
    USING (
        public.is_platform_admin()
        OR (tenant_id = public.current_tenant_id() AND public.is_tenant_admin())
    );

-- ============================================================================
-- ML_EXPERIMENT POLICIES
-- ============================================================================

CREATE POLICY ml_experiment_select_policy ON public.ml_experiment
    FOR SELECT
    USING (
        public.is_platform_admin()
        OR (
            tenant_id = public.current_tenant_id()
            AND public.has_project_access(project_id)
        )
    );

CREATE POLICY ml_experiment_insert_policy ON public.ml_experiment
    FOR INSERT
    WITH CHECK (
        public.is_platform_admin()
        OR (
            tenant_id = public.current_tenant_id()
            AND public.has_project_permission(project_id, 'experiment:create')
        )
    );

CREATE POLICY ml_experiment_update_policy ON public.ml_experiment
    FOR UPDATE
    USING (
        public.is_platform_admin()
        OR (
            tenant_id = public.current_tenant_id()
            AND public.has_project_permission(project_id, 'experiment:update')
        )
    );

CREATE POLICY ml_experiment_delete_policy ON public.ml_experiment
    FOR DELETE
    USING (
        public.is_platform_admin()
        OR (
            tenant_id = public.current_tenant_id()
            AND public.has_project_permission(project_id, 'experiment:delete')
        )
    );

-- ============================================================================
-- ML_RUN POLICIES
-- ============================================================================

CREATE POLICY ml_run_select_policy ON public.ml_run
    FOR SELECT
    USING (
        public.is_platform_admin()
        OR (
            tenant_id = public.current_tenant_id()
            AND EXISTS (
                SELECT 1 FROM public.ml_experiment e
                WHERE e.id = experiment_id
                AND public.has_project_access(e.project_id)
            )
        )
    );

CREATE POLICY ml_run_insert_policy ON public.ml_run
    FOR INSERT
    WITH CHECK (
        public.is_platform_admin()
        OR (
            tenant_id = public.current_tenant_id()
            AND EXISTS (
                SELECT 1 FROM public.ml_experiment e
                WHERE e.id = experiment_id
                AND public.has_project_permission(e.project_id, 'run:create')
            )
        )
    );

CREATE POLICY ml_run_update_policy ON public.ml_run
    FOR UPDATE
    USING (
        public.is_platform_admin()
        OR (
            tenant_id = public.current_tenant_id()
            AND EXISTS (
                SELECT 1 FROM public.ml_experiment e
                WHERE e.id = experiment_id
                AND public.has_project_permission(e.project_id, 'run:update')
            )
        )
    );

CREATE POLICY ml_run_delete_policy ON public.ml_run
    FOR DELETE
    USING (
        public.is_platform_admin()
        OR (
            tenant_id = public.current_tenant_id()
            AND EXISTS (
                SELECT 1 FROM public.ml_experiment e
                WHERE e.id = experiment_id
                AND public.has_project_permission(e.project_id, 'run:delete')
            )
        )
    );

-- ============================================================================
-- ML_MODEL POLICIES
-- ============================================================================

CREATE POLICY ml_model_select_policy ON public.ml_model
    FOR SELECT
    USING (
        public.is_platform_admin()
        OR (
            tenant_id = public.current_tenant_id()
            AND public.has_project_access(project_id)
        )
    );

CREATE POLICY ml_model_insert_policy ON public.ml_model
    FOR INSERT
    WITH CHECK (
        public.is_platform_admin()
        OR (
            tenant_id = public.current_tenant_id()
            AND public.has_project_permission(project_id, 'model:create')
        )
    );

CREATE POLICY ml_model_update_policy ON public.ml_model
    FOR UPDATE
    USING (
        public.is_platform_admin()
        OR (
            tenant_id = public.current_tenant_id()
            AND public.has_project_permission(project_id, 'model:update')
        )
    );

CREATE POLICY ml_model_delete_policy ON public.ml_model
    FOR DELETE
    USING (
        public.is_platform_admin()
        OR (
            tenant_id = public.current_tenant_id()
            AND public.has_project_permission(project_id, 'model:delete')
        )
    );

-- ============================================================================
-- GENERIC TENANT-SCOPED TABLE POLICY GENERATOR
-- ============================================================================

-- This function creates standard RLS policies for tenant-scoped tables
CREATE OR REPLACE FUNCTION public.create_tenant_rls_policies(p_table_name TEXT)
RETURNS VOID AS $$
DECLARE
    v_policy_prefix TEXT;
BEGIN
    v_policy_prefix := p_table_name;

    -- Drop existing policies
    EXECUTE format('DROP POLICY IF EXISTS %I_select_policy ON public.%I', v_policy_prefix, p_table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I_insert_policy ON public.%I', v_policy_prefix, p_table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I_update_policy ON public.%I', v_policy_prefix, p_table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I_delete_policy ON public.%I', v_policy_prefix, p_table_name);

    -- Create new policies
    EXECUTE format('
        CREATE POLICY %I_select_policy ON public.%I
            FOR SELECT
            USING (
                public.is_platform_admin()
                OR tenant_id = public.current_tenant_id()
            )', v_policy_prefix, p_table_name);

    EXECUTE format('
        CREATE POLICY %I_insert_policy ON public.%I
            FOR INSERT
            WITH CHECK (
                public.is_platform_admin()
                OR tenant_id = public.current_tenant_id()
            )', v_policy_prefix, p_table_name);

    EXECUTE format('
        CREATE POLICY %I_update_policy ON public.%I
            FOR UPDATE
            USING (
                public.is_platform_admin()
                OR tenant_id = public.current_tenant_id()
            )', v_policy_prefix, p_table_name);

    EXECUTE format('
        CREATE POLICY %I_delete_policy ON public.%I
            FOR DELETE
            USING (
                public.is_platform_admin()
                OR (tenant_id = public.current_tenant_id() AND public.is_tenant_admin())
            )', v_policy_prefix, p_table_name);

    RAISE NOTICE 'Created RLS policies for table: %', p_table_name;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.create_tenant_rls_policies(TEXT) IS 'Creates standard tenant-scoped RLS policies for a table';

-- ============================================================================
-- APPLY POLICIES TO ALL TENANT-SCOPED TABLES
-- ============================================================================

DO $$
DECLARE
    v_tables TEXT[] := ARRAY[
        -- Infrastructure
        'k8s_cluster',
        'k8s_namespace_binding',
        'compute_profile',
        'runtime_policy',
        -- Registries
        'container_registry',
        'object_store',
        'data_connection',
        'environment',
        'environment_build',
        -- Identity
        'role',
        'permission',
        'role_permission',
        'principal_role_binding',
        'group',
        'group_member',
        'api_key',
        'secret_ref',
        -- MLOps
        'model_version',
        'model_artifact',
        'model_deployment',
        'dataset',
        'dataset_version',
        'feature_store',
        'feature_group',
        'feature',
        -- CI/CD
        'git_provider',
        'git_repository',
        'pipeline',
        'pipeline_run',
        'pipeline_stage',
        'argocd_app',
        -- Collaboration
        'comment_thread',
        'comment',
        'notification',
        'approval_request',
        'approval_decision',
        -- Advanced
        'workspace_session',
        'workspace_session_log',
        'scheduled_job',
        'work_item',
        'audit_event',
        'event_outbox',
        'feature_flag',
        'quota',
        'quota_usage',
        -- Governance
        'ai_system',
        'model_card',
        'risk_assessment',
        'compliance_requirement',
        'compliance_check',
        'compliance_evidence',
        -- FinOps
        'billing_account',
        'budget',
        'cost_allocation',
        'resource_cost',
        'carbon_footprint',
        -- Observability
        'observability_backend',
        'alert_rule',
        'incident',
        'slo'
    ];
    v_table TEXT;
BEGIN
    FOREACH v_table IN ARRAY v_tables
    LOOP
        -- Check if table exists before creating policies
        IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = v_table
        ) THEN
            PERFORM public.create_tenant_rls_policies(v_table);
        ELSE
            RAISE NOTICE 'Table % does not exist, skipping', v_table;
        END IF;
    END LOOP;
END;
$$;

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename NOT LIKE '_%'
        AND tablename NOT IN ('schema_migrations', 'spatial_ref_sys')
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
        EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', r.tablename);
        RAISE NOTICE 'Enabled RLS on table: %', r.tablename;
    END LOOP;
END;
$$;

-- ============================================================================
-- COMPLETION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'Standalone RLS Policies Applied Successfully';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'All policies now use:';
    RAISE NOTICE '  - public.current_user_id() instead of auth.uid()';
    RAISE NOTICE '  - public.current_tenant_id() for tenant isolation';
    RAISE NOTICE '  - public.is_platform_admin() for admin checks';
    RAISE NOTICE '  - public.is_tenant_admin() for tenant admin checks';
    RAISE NOTICE '============================================================';
END;
$$;
