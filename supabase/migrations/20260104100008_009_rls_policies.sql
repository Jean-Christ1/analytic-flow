-- ============================================================================
-- MIGRATION: Row Level Security (RLS) Policies
-- Schema: MLOps Control Plane v3
-- Author: Armand AMOUSSOU
-- Date: 2026-01-04
-- ============================================================================
-- This migration implements comprehensive RLS policies for multi-tenant
-- data isolation, project-level access control, and user-specific data protection.
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTIONS FOR RLS POLICIES
-- ============================================================================

-- Function to get current user's tenant_id from JWT claims
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
    -- Extract tenant_id from JWT claims (set by Supabase Auth)
    -- TODO: Implement proper JWT claim extraction based on your auth setup
    RETURN COALESCE(
        (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid,
        NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_current_tenant_id() IS
'Extracts tenant_id from JWT claims for RLS policy evaluation';

-- Function to get current user's id from JWT claims
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID AS $$
BEGIN
    -- Extract user_id from JWT claims (matches auth.uid())
    RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_current_user_id() IS
'Returns current authenticated user ID for RLS policy evaluation';

-- Function to check if current user is a platform admin
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- TODO: Implement platform admin check based on your admin role definition
    -- This could check a specific role binding or JWT claim
    RETURN COALESCE(
        (current_setting('request.jwt.claims', true)::jsonb ->> 'is_platform_admin')::boolean,
        false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_platform_admin() IS
'Checks if current user has platform admin privileges';

-- Function to check if current user is tenant admin
CREATE OR REPLACE FUNCTION public.is_tenant_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- TODO: Implement tenant admin check based on role bindings
    RETURN COALESCE(
        (current_setting('request.jwt.claims', true)::jsonb ->> 'is_tenant_admin')::boolean,
        false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_tenant_admin() IS
'Checks if current user has tenant admin privileges';

-- Function to check if user has access to a specific project
CREATE OR REPLACE FUNCTION public.has_project_access(p_project_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_has_access BOOLEAN;
BEGIN
    -- Check if user has any role binding to this project via scope_type/scope_id
    SELECT EXISTS (
        SELECT 1
        FROM public.principal_role_binding prb
        WHERE prb.scope_type = 'project' AND prb.scope_id = p_project_id
        AND (
            (prb.principal_type = 'user' AND prb.principal_id = auth.uid())
            OR (prb.principal_type = 'group' AND prb.principal_id IN (
                SELECT gm.group_id
                FROM public.group_member gm
                WHERE gm.user_id = auth.uid()
            ))
        )
    ) INTO v_has_access;

    RETURN v_has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.has_project_access(UUID) IS
'Checks if current user has access to a specific project via role bindings';

-- Function to check if user has specific permission on project
CREATE OR REPLACE FUNCTION public.has_project_permission(p_project_id UUID, p_permission_code VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    v_has_permission BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM public.principal_role_binding prb
        INNER JOIN public.role_permission rp ON rp.role_id = prb.role_id
        INNER JOIN public.permission p ON p.id = rp.permission_id
        WHERE prb.scope_type = 'project' AND prb.scope_id = p_project_id
        AND p.code = p_permission_code
        AND (
            (prb.principal_type = 'user' AND prb.principal_id = auth.uid())
            OR (prb.principal_type = 'group' AND prb.principal_id IN (
                SELECT gm.group_id
                FROM public.group_member gm
                WHERE gm.user_id = auth.uid()
            ))
        )
    ) INTO v_has_permission;

    RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.has_project_permission(UUID, VARCHAR) IS
'Checks if current user has a specific permission on a project';

-- ============================================================================
-- SECTION 1: TENANCY TABLES RLS POLICIES
-- ============================================================================

-- tenant: Only platform admins can manage tenants, tenant admins can view their own
DROP POLICY IF EXISTS tenant_select_policy ON public.tenant;
CREATE POLICY tenant_select_policy ON public.tenant
    FOR SELECT
    USING (
        public.is_platform_admin()
        OR id = public.get_current_tenant_id()
    );

DROP POLICY IF EXISTS tenant_insert_policy ON public.tenant;
CREATE POLICY tenant_insert_policy ON public.tenant
    FOR INSERT
    WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS tenant_update_policy ON public.tenant;
CREATE POLICY tenant_update_policy ON public.tenant
    FOR UPDATE
    USING (
        public.is_platform_admin()
        OR (id = public.get_current_tenant_id() AND public.is_tenant_admin())
    );

DROP POLICY IF EXISTS tenant_delete_policy ON public.tenant;
CREATE POLICY tenant_delete_policy ON public.tenant
    FOR DELETE
    USING (public.is_platform_admin());

-- org: Tenant-scoped access
DROP POLICY IF EXISTS org_select_policy ON public.org;
CREATE POLICY org_select_policy ON public.org
    FOR SELECT
    USING (tenant_id = public.get_current_tenant_id());

DROP POLICY IF EXISTS org_insert_policy ON public.org;
CREATE POLICY org_insert_policy ON public.org
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS org_update_policy ON public.org;
CREATE POLICY org_update_policy ON public.org
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS org_delete_policy ON public.org;
CREATE POLICY org_delete_policy ON public.org
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

-- project: Tenant-scoped with project access check
DROP POLICY IF EXISTS project_select_policy ON public.project;
CREATE POLICY project_select_policy ON public.project
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND (
            visibility = 'public'
            OR public.has_project_access(id)
            OR public.is_tenant_admin()
        )
    );

DROP POLICY IF EXISTS project_insert_policy ON public.project;
CREATE POLICY project_insert_policy ON public.project
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND (public.is_tenant_admin() OR created_by = auth.uid())
    );

DROP POLICY IF EXISTS project_update_policy ON public.project;
CREATE POLICY project_update_policy ON public.project
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND (
            public.is_tenant_admin()
            OR created_by = auth.uid()
            OR public.has_project_permission(id, 'project:update')
        )
    );

DROP POLICY IF EXISTS project_delete_policy ON public.project;
CREATE POLICY project_delete_policy ON public.project
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND (
            public.is_tenant_admin()
            OR created_by = auth.uid()
        )
    );

-- project_progress_snapshot: Project-scoped access
DROP POLICY IF EXISTS project_progress_snapshot_select_policy ON public.project_progress_snapshot;
CREATE POLICY project_progress_snapshot_select_policy ON public.project_progress_snapshot
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_access(project_id)
    );

DROP POLICY IF EXISTS project_progress_snapshot_insert_policy ON public.project_progress_snapshot;
CREATE POLICY project_progress_snapshot_insert_policy ON public.project_progress_snapshot
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_permission(project_id, 'project:update')
    );

-- milestone: Project-scoped access
DROP POLICY IF EXISTS milestone_select_policy ON public.milestone;
CREATE POLICY milestone_select_policy ON public.milestone
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_access(project_id)
    );

DROP POLICY IF EXISTS milestone_insert_policy ON public.milestone;
CREATE POLICY milestone_insert_policy ON public.milestone
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_permission(project_id, 'project:update')
    );

DROP POLICY IF EXISTS milestone_update_policy ON public.milestone;
CREATE POLICY milestone_update_policy ON public.milestone
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_permission(project_id, 'project:update')
    );

DROP POLICY IF EXISTS milestone_delete_policy ON public.milestone;
CREATE POLICY milestone_delete_policy ON public.milestone
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_permission(project_id, 'project:update')
    );

-- kanban_board: Project-scoped access
DROP POLICY IF EXISTS kanban_board_select_policy ON public.kanban_board;
CREATE POLICY kanban_board_select_policy ON public.kanban_board
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_access(project_id)
    );

DROP POLICY IF EXISTS kanban_board_insert_policy ON public.kanban_board;
CREATE POLICY kanban_board_insert_policy ON public.kanban_board
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_permission(project_id, 'project:update')
    );

DROP POLICY IF EXISTS kanban_board_update_policy ON public.kanban_board;
CREATE POLICY kanban_board_update_policy ON public.kanban_board
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_permission(project_id, 'project:update')
    );

DROP POLICY IF EXISTS kanban_board_delete_policy ON public.kanban_board;
CREATE POLICY kanban_board_delete_policy ON public.kanban_board
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_permission(project_id, 'project:update')
    );

-- kanban_column: Project-scoped via board
DROP POLICY IF EXISTS kanban_column_select_policy ON public.kanban_column;
CREATE POLICY kanban_column_select_policy ON public.kanban_column
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.kanban_board kb
            WHERE kb.id = board_id
            AND public.has_project_access(kb.project_id)
        )
    );

DROP POLICY IF EXISTS kanban_column_insert_policy ON public.kanban_column;
CREATE POLICY kanban_column_insert_policy ON public.kanban_column
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.kanban_board kb
            WHERE kb.id = board_id
            AND public.has_project_permission(kb.project_id, 'project:update')
        )
    );

DROP POLICY IF EXISTS kanban_column_update_policy ON public.kanban_column;
CREATE POLICY kanban_column_update_policy ON public.kanban_column
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.kanban_board kb
            WHERE kb.id = board_id
            AND public.has_project_permission(kb.project_id, 'project:update')
        )
    );

DROP POLICY IF EXISTS kanban_column_delete_policy ON public.kanban_column;
CREATE POLICY kanban_column_delete_policy ON public.kanban_column
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.kanban_board kb
            WHERE kb.id = board_id
            AND public.has_project_permission(kb.project_id, 'project:update')
        )
    );

-- work_item: Project-scoped access
DROP POLICY IF EXISTS work_item_select_policy ON public.work_item;
CREATE POLICY work_item_select_policy ON public.work_item
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_access(project_id)
    );

DROP POLICY IF EXISTS work_item_insert_policy ON public.work_item;
CREATE POLICY work_item_insert_policy ON public.work_item
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_access(project_id)
    );

DROP POLICY IF EXISTS work_item_update_policy ON public.work_item;
CREATE POLICY work_item_update_policy ON public.work_item
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_access(project_id)
    );

DROP POLICY IF EXISTS work_item_delete_policy ON public.work_item;
CREATE POLICY work_item_delete_policy ON public.work_item
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND (
            public.has_project_permission(project_id, 'project:update')
            OR created_by = auth.uid()
        )
    );

-- ============================================================================
-- SECTION 2: IDENTITY TABLES RLS POLICIES
-- ============================================================================

-- user_account: Users can view tenant members, update own profile
DROP POLICY IF EXISTS user_account_select_policy ON public.user_account;
CREATE POLICY user_account_select_policy ON public.user_account
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        OR id = auth.uid()
    );

DROP POLICY IF EXISTS user_account_insert_policy ON public.user_account;
CREATE POLICY user_account_insert_policy ON public.user_account
    FOR INSERT
    WITH CHECK (
        public.is_tenant_admin()
        OR id = auth.uid()
    );

DROP POLICY IF EXISTS user_account_update_policy ON public.user_account;
CREATE POLICY user_account_update_policy ON public.user_account
    FOR UPDATE
    USING (
        id = auth.uid()
        OR (tenant_id = public.get_current_tenant_id() AND public.is_tenant_admin())
    );

DROP POLICY IF EXISTS user_account_delete_policy ON public.user_account;
CREATE POLICY user_account_delete_policy ON public.user_account
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

-- group: Tenant-scoped access
DROP POLICY IF EXISTS group_select_policy ON public.group;
CREATE POLICY group_select_policy ON public.group
    FOR SELECT
    USING (tenant_id = public.get_current_tenant_id());

DROP POLICY IF EXISTS group_insert_policy ON public.group;
CREATE POLICY group_insert_policy ON public.group
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS group_update_policy ON public.group;
CREATE POLICY group_update_policy ON public.group
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS group_delete_policy ON public.group;
CREATE POLICY group_delete_policy ON public.group
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

-- group_member: Tenant-scoped access
DROP POLICY IF EXISTS group_member_select_policy ON public.group_member;
CREATE POLICY group_member_select_policy ON public.group_member
    FOR SELECT
    USING (tenant_id = public.get_current_tenant_id());

DROP POLICY IF EXISTS group_member_insert_policy ON public.group_member;
CREATE POLICY group_member_insert_policy ON public.group_member
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS group_member_delete_policy ON public.group_member;
CREATE POLICY group_member_delete_policy ON public.group_member
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

-- role: Tenant-scoped (or system-wide for built-in roles)
DROP POLICY IF EXISTS role_select_policy ON public.role;
CREATE POLICY role_select_policy ON public.role
    FOR SELECT
    USING (
        is_system = true
        OR tenant_id = public.get_current_tenant_id()
    );

DROP POLICY IF EXISTS role_insert_policy ON public.role;
CREATE POLICY role_insert_policy ON public.role
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
        AND is_system = false
    );

DROP POLICY IF EXISTS role_update_policy ON public.role;
CREATE POLICY role_update_policy ON public.role
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
        AND is_system = false
    );

DROP POLICY IF EXISTS role_delete_policy ON public.role;
CREATE POLICY role_delete_policy ON public.role
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
        AND is_system = false
    );

-- permission: Read-only for all authenticated users
DROP POLICY IF EXISTS permission_select_policy ON public.permission;
CREATE POLICY permission_select_policy ON public.permission
    FOR SELECT
    USING (true);

-- role_permission: Tenant-scoped access
DROP POLICY IF EXISTS role_permission_select_policy ON public.role_permission;
CREATE POLICY role_permission_select_policy ON public.role_permission
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.role r
            WHERE r.id = role_id
            AND (r.is_system = true OR r.tenant_id = public.get_current_tenant_id())
        )
    );

DROP POLICY IF EXISTS role_permission_insert_policy ON public.role_permission;
CREATE POLICY role_permission_insert_policy ON public.role_permission
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.role r
            WHERE r.id = role_id
            AND r.tenant_id = public.get_current_tenant_id()
            AND r.is_system = false
        )
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS role_permission_delete_policy ON public.role_permission;
CREATE POLICY role_permission_delete_policy ON public.role_permission
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.role r
            WHERE r.id = role_id
            AND r.tenant_id = public.get_current_tenant_id()
            AND r.is_system = false
        )
        AND public.is_tenant_admin()
    );

-- principal_role_binding: Tenant and project scoped
DROP POLICY IF EXISTS principal_role_binding_select_policy ON public.principal_role_binding;
CREATE POLICY principal_role_binding_select_policy ON public.principal_role_binding
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND (
            scope_type != 'project'
            OR scope_id IS NULL
            OR public.has_project_access(scope_id)
            OR public.is_tenant_admin()
        )
    );

DROP POLICY IF EXISTS principal_role_binding_insert_policy ON public.principal_role_binding;
CREATE POLICY principal_role_binding_insert_policy ON public.principal_role_binding
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND (
            public.is_tenant_admin()
            OR (scope_type = 'project' AND scope_id IS NOT NULL AND public.has_project_permission(scope_id, 'security:manage_access'))
        )
    );

DROP POLICY IF EXISTS principal_role_binding_delete_policy ON public.principal_role_binding;
CREATE POLICY principal_role_binding_delete_policy ON public.principal_role_binding
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND (
            public.is_tenant_admin()
            OR (scope_type = 'project' AND scope_id IS NOT NULL AND public.has_project_permission(scope_id, 'security:manage_access'))
        )
    );

-- business_rule: Tenant-scoped admin access
DROP POLICY IF EXISTS business_rule_select_policy ON public.business_rule;
CREATE POLICY business_rule_select_policy ON public.business_rule
    FOR SELECT
    USING (tenant_id = public.get_current_tenant_id());

DROP POLICY IF EXISTS business_rule_insert_policy ON public.business_rule;
CREATE POLICY business_rule_insert_policy ON public.business_rule
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS business_rule_update_policy ON public.business_rule;
CREATE POLICY business_rule_update_policy ON public.business_rule
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS business_rule_delete_policy ON public.business_rule;
CREATE POLICY business_rule_delete_policy ON public.business_rule
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

-- feature_flag: Tenant-scoped read, admin write
DROP POLICY IF EXISTS feature_flag_select_policy ON public.feature_flag;
CREATE POLICY feature_flag_select_policy ON public.feature_flag
    FOR SELECT
    USING (tenant_id = public.get_current_tenant_id());

DROP POLICY IF EXISTS feature_flag_insert_policy ON public.feature_flag;
CREATE POLICY feature_flag_insert_policy ON public.feature_flag
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS feature_flag_update_policy ON public.feature_flag;
CREATE POLICY feature_flag_update_policy ON public.feature_flag
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS feature_flag_delete_policy ON public.feature_flag;
CREATE POLICY feature_flag_delete_policy ON public.feature_flag
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

-- quota_policy: Tenant-scoped admin access
DROP POLICY IF EXISTS quota_policy_select_policy ON public.quota_policy;
CREATE POLICY quota_policy_select_policy ON public.quota_policy
    FOR SELECT
    USING (tenant_id = public.get_current_tenant_id());

DROP POLICY IF EXISTS quota_policy_insert_policy ON public.quota_policy;
CREATE POLICY quota_policy_insert_policy ON public.quota_policy
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS quota_policy_update_policy ON public.quota_policy;
CREATE POLICY quota_policy_update_policy ON public.quota_policy
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS quota_policy_delete_policy ON public.quota_policy;
CREATE POLICY quota_policy_delete_policy ON public.quota_policy
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

-- admin_setting: Tenant-scoped admin access
DROP POLICY IF EXISTS admin_setting_select_policy ON public.admin_setting;
CREATE POLICY admin_setting_select_policy ON public.admin_setting
    FOR SELECT
    USING (tenant_id = public.get_current_tenant_id());

DROP POLICY IF EXISTS admin_setting_insert_policy ON public.admin_setting;
CREATE POLICY admin_setting_insert_policy ON public.admin_setting
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS admin_setting_update_policy ON public.admin_setting;
CREATE POLICY admin_setting_update_policy ON public.admin_setting
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS admin_setting_delete_policy ON public.admin_setting;
CREATE POLICY admin_setting_delete_policy ON public.admin_setting
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

-- service_account: Tenant-scoped admin access
DROP POLICY IF EXISTS service_account_select_policy ON public.service_account;
CREATE POLICY service_account_select_policy ON public.service_account
    FOR SELECT
    USING (tenant_id = public.get_current_tenant_id());

DROP POLICY IF EXISTS service_account_insert_policy ON public.service_account;
CREATE POLICY service_account_insert_policy ON public.service_account
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS service_account_update_policy ON public.service_account;
CREATE POLICY service_account_update_policy ON public.service_account
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS service_account_delete_policy ON public.service_account;
CREATE POLICY service_account_delete_policy ON public.service_account
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

-- service_account_token: Tenant-scoped admin access (sensitive)
DROP POLICY IF EXISTS service_account_token_select_policy ON public.service_account_token;
CREATE POLICY service_account_token_select_policy ON public.service_account_token
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS service_account_token_insert_policy ON public.service_account_token;
CREATE POLICY service_account_token_insert_policy ON public.service_account_token
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS service_account_token_delete_policy ON public.service_account_token;
CREATE POLICY service_account_token_delete_policy ON public.service_account_token
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

-- secret_ref: Tenant-scoped admin access (sensitive)
DROP POLICY IF EXISTS secret_ref_select_policy ON public.secret_ref;
CREATE POLICY secret_ref_select_policy ON public.secret_ref
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS secret_ref_insert_policy ON public.secret_ref;
CREATE POLICY secret_ref_insert_policy ON public.secret_ref
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS secret_ref_update_policy ON public.secret_ref;
CREATE POLICY secret_ref_update_policy ON public.secret_ref
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS secret_ref_delete_policy ON public.secret_ref;
CREATE POLICY secret_ref_delete_policy ON public.secret_ref
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

-- identity_provider: Tenant-scoped admin access
DROP POLICY IF EXISTS identity_provider_select_policy ON public.identity_provider;
CREATE POLICY identity_provider_select_policy ON public.identity_provider
    FOR SELECT
    USING (tenant_id = public.get_current_tenant_id());

DROP POLICY IF EXISTS identity_provider_insert_policy ON public.identity_provider;
CREATE POLICY identity_provider_insert_policy ON public.identity_provider
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS identity_provider_update_policy ON public.identity_provider;
CREATE POLICY identity_provider_update_policy ON public.identity_provider
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS identity_provider_delete_policy ON public.identity_provider;
CREATE POLICY identity_provider_delete_policy ON public.identity_provider
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

-- api_token: User owns their tokens
DROP POLICY IF EXISTS api_token_select_policy ON public.api_token;
CREATE POLICY api_token_select_policy ON public.api_token
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND (user_id = auth.uid() OR public.is_tenant_admin())
    );

DROP POLICY IF EXISTS api_token_insert_policy ON public.api_token;
CREATE POLICY api_token_insert_policy ON public.api_token
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND user_id = auth.uid()
    );

DROP POLICY IF EXISTS api_token_update_policy ON public.api_token;
CREATE POLICY api_token_update_policy ON public.api_token
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND user_id = auth.uid()
    );

DROP POLICY IF EXISTS api_token_delete_policy ON public.api_token;
CREATE POLICY api_token_delete_policy ON public.api_token
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND (user_id = auth.uid() OR public.is_tenant_admin())
    );

-- ============================================================================
-- SECTION 3: INFRASTRUCTURE TABLES RLS POLICIES
-- ============================================================================

-- k8s_cluster: Tenant-scoped admin access
DROP POLICY IF EXISTS k8s_cluster_select_policy ON public.k8s_cluster;
CREATE POLICY k8s_cluster_select_policy ON public.k8s_cluster
    FOR SELECT
    USING (tenant_id = public.get_current_tenant_id());

DROP POLICY IF EXISTS k8s_cluster_insert_policy ON public.k8s_cluster;
CREATE POLICY k8s_cluster_insert_policy ON public.k8s_cluster
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS k8s_cluster_update_policy ON public.k8s_cluster;
CREATE POLICY k8s_cluster_update_policy ON public.k8s_cluster
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS k8s_cluster_delete_policy ON public.k8s_cluster;
CREATE POLICY k8s_cluster_delete_policy ON public.k8s_cluster
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

-- k8s_namespace_binding: Project-scoped access
DROP POLICY IF EXISTS k8s_namespace_binding_select_policy ON public.k8s_namespace_binding;
CREATE POLICY k8s_namespace_binding_select_policy ON public.k8s_namespace_binding
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_access(project_id)
    );

DROP POLICY IF EXISTS k8s_namespace_binding_insert_policy ON public.k8s_namespace_binding;
CREATE POLICY k8s_namespace_binding_insert_policy ON public.k8s_namespace_binding
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS k8s_namespace_binding_update_policy ON public.k8s_namespace_binding;
CREATE POLICY k8s_namespace_binding_update_policy ON public.k8s_namespace_binding
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS k8s_namespace_binding_delete_policy ON public.k8s_namespace_binding;
CREATE POLICY k8s_namespace_binding_delete_policy ON public.k8s_namespace_binding
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

-- compute_profile: Tenant-scoped read, admin write
DROP POLICY IF EXISTS compute_profile_select_policy ON public.compute_profile;
CREATE POLICY compute_profile_select_policy ON public.compute_profile
    FOR SELECT
    USING (tenant_id = public.get_current_tenant_id());

DROP POLICY IF EXISTS compute_profile_insert_policy ON public.compute_profile;
CREATE POLICY compute_profile_insert_policy ON public.compute_profile
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS compute_profile_update_policy ON public.compute_profile;
CREATE POLICY compute_profile_update_policy ON public.compute_profile
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS compute_profile_delete_policy ON public.compute_profile;
CREATE POLICY compute_profile_delete_policy ON public.compute_profile
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

-- runtime_policy: Tenant-scoped admin access
DROP POLICY IF EXISTS runtime_policy_select_policy ON public.runtime_policy;
CREATE POLICY runtime_policy_select_policy ON public.runtime_policy
    FOR SELECT
    USING (tenant_id = public.get_current_tenant_id());

DROP POLICY IF EXISTS runtime_policy_insert_policy ON public.runtime_policy;
CREATE POLICY runtime_policy_insert_policy ON public.runtime_policy
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS runtime_policy_update_policy ON public.runtime_policy;
CREATE POLICY runtime_policy_update_policy ON public.runtime_policy
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS runtime_policy_delete_policy ON public.runtime_policy;
CREATE POLICY runtime_policy_delete_policy ON public.runtime_policy
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

-- ============================================================================
-- SECTION 4: REGISTRIES TABLES RLS POLICIES
-- ============================================================================

-- container_registry: Tenant-scoped admin access
DROP POLICY IF EXISTS container_registry_select_policy ON public.container_registry;
CREATE POLICY container_registry_select_policy ON public.container_registry
    FOR SELECT
    USING (tenant_id = public.get_current_tenant_id());

DROP POLICY IF EXISTS container_registry_insert_policy ON public.container_registry;
CREATE POLICY container_registry_insert_policy ON public.container_registry
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS container_registry_update_policy ON public.container_registry;
CREATE POLICY container_registry_update_policy ON public.container_registry
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS container_registry_delete_policy ON public.container_registry;
CREATE POLICY container_registry_delete_policy ON public.container_registry
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

-- object_store: Tenant-scoped admin access
DROP POLICY IF EXISTS object_store_select_policy ON public.object_store;
CREATE POLICY object_store_select_policy ON public.object_store
    FOR SELECT
    USING (tenant_id = public.get_current_tenant_id());

DROP POLICY IF EXISTS object_store_insert_policy ON public.object_store;
CREATE POLICY object_store_insert_policy ON public.object_store
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS object_store_update_policy ON public.object_store;
CREATE POLICY object_store_update_policy ON public.object_store
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS object_store_delete_policy ON public.object_store;
CREATE POLICY object_store_delete_policy ON public.object_store
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

-- data_connection: Tenant-scoped admin access
DROP POLICY IF EXISTS data_connection_select_policy ON public.data_connection;
CREATE POLICY data_connection_select_policy ON public.data_connection
    FOR SELECT
    USING (tenant_id = public.get_current_tenant_id());

DROP POLICY IF EXISTS data_connection_insert_policy ON public.data_connection;
CREATE POLICY data_connection_insert_policy ON public.data_connection
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS data_connection_update_policy ON public.data_connection;
CREATE POLICY data_connection_update_policy ON public.data_connection
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS data_connection_delete_policy ON public.data_connection;
CREATE POLICY data_connection_delete_policy ON public.data_connection
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

-- environment: Tenant and project-scoped access
DROP POLICY IF EXISTS environment_select_policy ON public.environment;
CREATE POLICY environment_select_policy ON public.environment
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND (
            project_id IS NULL
            OR public.has_project_access(project_id)
        )
    );

DROP POLICY IF EXISTS environment_insert_policy ON public.environment;
CREATE POLICY environment_insert_policy ON public.environment
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND (
            (project_id IS NULL AND public.is_tenant_admin())
            OR (project_id IS NOT NULL AND public.has_project_permission(project_id, 'mlops:create_environment'))
        )
    );

DROP POLICY IF EXISTS environment_update_policy ON public.environment;
CREATE POLICY environment_update_policy ON public.environment
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND (
            (project_id IS NULL AND public.is_tenant_admin())
            OR (project_id IS NOT NULL AND public.has_project_permission(project_id, 'mlops:update_environment'))
        )
    );

DROP POLICY IF EXISTS environment_delete_policy ON public.environment;
CREATE POLICY environment_delete_policy ON public.environment
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND (
            (project_id IS NULL AND public.is_tenant_admin())
            OR (project_id IS NOT NULL AND public.has_project_permission(project_id, 'mlops:delete_environment'))
        )
    );

-- environment_build: Environment-scoped access
DROP POLICY IF EXISTS environment_build_select_policy ON public.environment_build;
CREATE POLICY environment_build_select_policy ON public.environment_build
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.environment e
            WHERE e.id = environment_id
            AND (e.project_id IS NULL OR public.has_project_access(e.project_id))
        )
    );

DROP POLICY IF EXISTS environment_build_insert_policy ON public.environment_build;
CREATE POLICY environment_build_insert_policy ON public.environment_build
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.environment e
            WHERE e.id = environment_id
            AND (
                (e.project_id IS NULL AND public.is_tenant_admin())
                OR (e.project_id IS NOT NULL AND public.has_project_permission(e.project_id, 'mlops:create_environment'))
            )
        )
    );

-- ============================================================================
-- SECTION 5: MLOPS TABLES RLS POLICIES
-- ============================================================================

-- experiment: Project-scoped access
DROP POLICY IF EXISTS experiment_select_policy ON public.experiment;
CREATE POLICY experiment_select_policy ON public.experiment
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_access(project_id)
    );

DROP POLICY IF EXISTS experiment_insert_policy ON public.experiment;
CREATE POLICY experiment_insert_policy ON public.experiment
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_permission(project_id, 'mlops:create_experiment')
    );

DROP POLICY IF EXISTS experiment_update_policy ON public.experiment;
CREATE POLICY experiment_update_policy ON public.experiment
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_permission(project_id, 'mlops:update_experiment')
    );

DROP POLICY IF EXISTS experiment_delete_policy ON public.experiment;
CREATE POLICY experiment_delete_policy ON public.experiment
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_permission(project_id, 'mlops:delete_experiment')
    );

-- run: Experiment-scoped access
DROP POLICY IF EXISTS run_select_policy ON public.run;
CREATE POLICY run_select_policy ON public.run
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.experiment e
            WHERE e.id = experiment_id
            AND public.has_project_access(e.project_id)
        )
    );

DROP POLICY IF EXISTS run_insert_policy ON public.run;
CREATE POLICY run_insert_policy ON public.run
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.experiment e
            WHERE e.id = experiment_id
            AND public.has_project_permission(e.project_id, 'mlops:create_run')
        )
    );

DROP POLICY IF EXISTS run_update_policy ON public.run;
CREATE POLICY run_update_policy ON public.run
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND (
            created_by = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.experiment e
                WHERE e.id = experiment_id
                AND public.has_project_permission(e.project_id, 'mlops:update_run')
            )
        )
    );

-- run_metric: Run-scoped access
DROP POLICY IF EXISTS run_metric_select_policy ON public.run_metric;
CREATE POLICY run_metric_select_policy ON public.run_metric
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.run r
            INNER JOIN public.experiment e ON e.id = r.experiment_id
            WHERE r.id = run_id
            AND public.has_project_access(e.project_id)
        )
    );

DROP POLICY IF EXISTS run_metric_insert_policy ON public.run_metric;
CREATE POLICY run_metric_insert_policy ON public.run_metric
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.run r
            WHERE r.id = run_id
            AND r.created_by = auth.uid()
        )
    );

-- artifact: Run-scoped access
DROP POLICY IF EXISTS artifact_select_policy ON public.artifact;
CREATE POLICY artifact_select_policy ON public.artifact
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.run r
            INNER JOIN public.experiment e ON e.id = r.experiment_id
            WHERE r.id = run_id
            AND public.has_project_access(e.project_id)
        )
    );

DROP POLICY IF EXISTS artifact_insert_policy ON public.artifact;
CREATE POLICY artifact_insert_policy ON public.artifact
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.run r
            WHERE r.id = run_id
            AND r.created_by = auth.uid()
        )
    );

-- model: Project-scoped access
DROP POLICY IF EXISTS model_select_policy ON public.model;
CREATE POLICY model_select_policy ON public.model
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_access(project_id)
    );

DROP POLICY IF EXISTS model_insert_policy ON public.model;
CREATE POLICY model_insert_policy ON public.model
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_permission(project_id, 'mlops:create_model')
    );

DROP POLICY IF EXISTS model_update_policy ON public.model;
CREATE POLICY model_update_policy ON public.model
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_permission(project_id, 'mlops:update_model')
    );

DROP POLICY IF EXISTS model_delete_policy ON public.model;
CREATE POLICY model_delete_policy ON public.model
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_permission(project_id, 'mlops:delete_model')
    );

-- model_version: Model-scoped access
DROP POLICY IF EXISTS model_version_select_policy ON public.model_version;
CREATE POLICY model_version_select_policy ON public.model_version
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.model m
            WHERE m.id = model_id
            AND public.has_project_access(m.project_id)
        )
    );

DROP POLICY IF EXISTS model_version_insert_policy ON public.model_version;
CREATE POLICY model_version_insert_policy ON public.model_version
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.model m
            WHERE m.id = model_id
            AND public.has_project_permission(m.project_id, 'mlops:create_model')
        )
    );

DROP POLICY IF EXISTS model_version_update_policy ON public.model_version;
CREATE POLICY model_version_update_policy ON public.model_version
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.model m
            WHERE m.id = model_id
            AND public.has_project_permission(m.project_id, 'mlops:update_model')
        )
    );

-- model_deployment: Project-scoped access with deploy permission
DROP POLICY IF EXISTS model_deployment_select_policy ON public.model_deployment;
CREATE POLICY model_deployment_select_policy ON public.model_deployment
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_access(project_id)
    );

DROP POLICY IF EXISTS model_deployment_insert_policy ON public.model_deployment;
CREATE POLICY model_deployment_insert_policy ON public.model_deployment
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_permission(project_id, 'mlops:deploy_model')
    );

DROP POLICY IF EXISTS model_deployment_update_policy ON public.model_deployment;
CREATE POLICY model_deployment_update_policy ON public.model_deployment
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_permission(project_id, 'mlops:deploy_model')
    );

DROP POLICY IF EXISTS model_deployment_delete_policy ON public.model_deployment;
CREATE POLICY model_deployment_delete_policy ON public.model_deployment
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_permission(project_id, 'mlops:deploy_model')
    );

-- workspace_session: Project-scoped, user owns their sessions
DROP POLICY IF EXISTS workspace_session_select_policy ON public.workspace_session;
CREATE POLICY workspace_session_select_policy ON public.workspace_session
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND (
            user_id = auth.uid()
            OR public.has_project_permission(project_id, 'mlops:view_workspaces')
        )
    );

DROP POLICY IF EXISTS workspace_session_insert_policy ON public.workspace_session;
CREATE POLICY workspace_session_insert_policy ON public.workspace_session
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND user_id = auth.uid()
        AND public.has_project_permission(project_id, 'mlops:create_workspace')
    );

DROP POLICY IF EXISTS workspace_session_update_policy ON public.workspace_session;
CREATE POLICY workspace_session_update_policy ON public.workspace_session
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND user_id = auth.uid()
    );

DROP POLICY IF EXISTS workspace_session_delete_policy ON public.workspace_session;
CREATE POLICY workspace_session_delete_policy ON public.workspace_session
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND (user_id = auth.uid() OR public.is_tenant_admin())
    );

-- app: Project-scoped access
DROP POLICY IF EXISTS app_select_policy ON public.app;
CREATE POLICY app_select_policy ON public.app
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_access(project_id)
    );

DROP POLICY IF EXISTS app_insert_policy ON public.app;
CREATE POLICY app_insert_policy ON public.app
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_permission(project_id, 'mlops:create_app')
    );

DROP POLICY IF EXISTS app_update_policy ON public.app;
CREATE POLICY app_update_policy ON public.app
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_permission(project_id, 'mlops:update_app')
    );

DROP POLICY IF EXISTS app_delete_policy ON public.app;
CREATE POLICY app_delete_policy ON public.app
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_permission(project_id, 'mlops:delete_app')
    );

-- ============================================================================
-- SECTION 6: CI/CD TABLES RLS POLICIES
-- ============================================================================

-- gitlab_instance: Tenant-scoped admin access
DROP POLICY IF EXISTS gitlab_instance_select_policy ON public.gitlab_instance;
CREATE POLICY gitlab_instance_select_policy ON public.gitlab_instance
    FOR SELECT
    USING (tenant_id = public.get_current_tenant_id());

DROP POLICY IF EXISTS gitlab_instance_insert_policy ON public.gitlab_instance;
CREATE POLICY gitlab_instance_insert_policy ON public.gitlab_instance
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS gitlab_instance_update_policy ON public.gitlab_instance;
CREATE POLICY gitlab_instance_update_policy ON public.gitlab_instance
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS gitlab_instance_delete_policy ON public.gitlab_instance;
CREATE POLICY gitlab_instance_delete_policy ON public.gitlab_instance
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

-- git_provider: Tenant-scoped admin access
DROP POLICY IF EXISTS git_provider_select_policy ON public.git_provider;
CREATE POLICY git_provider_select_policy ON public.git_provider
    FOR SELECT
    USING (tenant_id = public.get_current_tenant_id());

DROP POLICY IF EXISTS git_provider_insert_policy ON public.git_provider;
CREATE POLICY git_provider_insert_policy ON public.git_provider
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS git_provider_update_policy ON public.git_provider;
CREATE POLICY git_provider_update_policy ON public.git_provider
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS git_provider_delete_policy ON public.git_provider;
CREATE POLICY git_provider_delete_policy ON public.git_provider
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

-- repo_binding: Project-scoped access
DROP POLICY IF EXISTS repo_binding_select_policy ON public.repo_binding;
CREATE POLICY repo_binding_select_policy ON public.repo_binding
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_access(project_id)
    );

DROP POLICY IF EXISTS repo_binding_insert_policy ON public.repo_binding;
CREATE POLICY repo_binding_insert_policy ON public.repo_binding
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_permission(project_id, 'cicd:configure_repo')
    );

DROP POLICY IF EXISTS repo_binding_update_policy ON public.repo_binding;
CREATE POLICY repo_binding_update_policy ON public.repo_binding
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_permission(project_id, 'cicd:configure_repo')
    );

DROP POLICY IF EXISTS repo_binding_delete_policy ON public.repo_binding;
CREATE POLICY repo_binding_delete_policy ON public.repo_binding
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_permission(project_id, 'cicd:configure_repo')
    );

-- cicd_pipeline: Project-scoped access
DROP POLICY IF EXISTS cicd_pipeline_select_policy ON public.cicd_pipeline;
CREATE POLICY cicd_pipeline_select_policy ON public.cicd_pipeline
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_access(project_id)
    );

DROP POLICY IF EXISTS cicd_pipeline_insert_policy ON public.cicd_pipeline;
CREATE POLICY cicd_pipeline_insert_policy ON public.cicd_pipeline
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_permission(project_id, 'cicd:create_pipeline')
    );

DROP POLICY IF EXISTS cicd_pipeline_update_policy ON public.cicd_pipeline;
CREATE POLICY cicd_pipeline_update_policy ON public.cicd_pipeline
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_permission(project_id, 'cicd:update_pipeline')
    );

-- cicd_stage: Pipeline-scoped access
DROP POLICY IF EXISTS cicd_stage_select_policy ON public.cicd_stage;
CREATE POLICY cicd_stage_select_policy ON public.cicd_stage
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.cicd_pipeline p
            WHERE p.id = pipeline_id
            AND public.has_project_access(p.project_id)
        )
    );

DROP POLICY IF EXISTS cicd_stage_insert_policy ON public.cicd_stage;
CREATE POLICY cicd_stage_insert_policy ON public.cicd_stage
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.cicd_pipeline p
            WHERE p.id = pipeline_id
            AND public.has_project_permission(p.project_id, 'cicd:update_pipeline')
        )
    );

-- cicd_job: Pipeline-scoped access
DROP POLICY IF EXISTS cicd_job_select_policy ON public.cicd_job;
CREATE POLICY cicd_job_select_policy ON public.cicd_job
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.cicd_pipeline p
            WHERE p.id = pipeline_id
            AND public.has_project_access(p.project_id)
        )
    );

DROP POLICY IF EXISTS cicd_job_insert_policy ON public.cicd_job;
CREATE POLICY cicd_job_insert_policy ON public.cicd_job
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.cicd_pipeline p
            WHERE p.id = pipeline_id
            AND public.has_project_permission(p.project_id, 'cicd:update_pipeline')
        )
    );

-- cicd_job_artifact: Job-scoped access
DROP POLICY IF EXISTS cicd_job_artifact_select_policy ON public.cicd_job_artifact;
CREATE POLICY cicd_job_artifact_select_policy ON public.cicd_job_artifact
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.cicd_job j
            INNER JOIN public.cicd_pipeline p ON p.id = j.pipeline_id
            WHERE j.id = job_id
            AND public.has_project_access(p.project_id)
        )
    );

-- cicd_environment: Project-scoped access
DROP POLICY IF EXISTS cicd_environment_select_policy ON public.cicd_environment;
CREATE POLICY cicd_environment_select_policy ON public.cicd_environment
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_access(project_id)
    );

DROP POLICY IF EXISTS cicd_environment_insert_policy ON public.cicd_environment;
CREATE POLICY cicd_environment_insert_policy ON public.cicd_environment
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_permission(project_id, 'cicd:manage_environments')
    );

DROP POLICY IF EXISTS cicd_environment_update_policy ON public.cicd_environment;
CREATE POLICY cicd_environment_update_policy ON public.cicd_environment
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_permission(project_id, 'cicd:manage_environments')
    );

DROP POLICY IF EXISTS cicd_environment_delete_policy ON public.cicd_environment;
CREATE POLICY cicd_environment_delete_policy ON public.cicd_environment
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_permission(project_id, 'cicd:manage_environments')
    );

-- cicd_deployment: Environment-scoped access
DROP POLICY IF EXISTS cicd_deployment_select_policy ON public.cicd_deployment;
CREATE POLICY cicd_deployment_select_policy ON public.cicd_deployment
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.cicd_environment e
            WHERE e.id = environment_id
            AND public.has_project_access(e.project_id)
        )
    );

DROP POLICY IF EXISTS cicd_deployment_insert_policy ON public.cicd_deployment;
CREATE POLICY cicd_deployment_insert_policy ON public.cicd_deployment
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.cicd_environment e
            WHERE e.id = environment_id
            AND public.has_project_permission(e.project_id, 'cicd:deploy')
        )
    );

-- cicd_quality_gate: Pipeline-scoped access
DROP POLICY IF EXISTS cicd_quality_gate_select_policy ON public.cicd_quality_gate;
CREATE POLICY cicd_quality_gate_select_policy ON public.cicd_quality_gate
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.cicd_pipeline p
            WHERE p.id = pipeline_id
            AND public.has_project_access(p.project_id)
        )
    );

DROP POLICY IF EXISTS cicd_quality_gate_insert_policy ON public.cicd_quality_gate;
CREATE POLICY cicd_quality_gate_insert_policy ON public.cicd_quality_gate
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.cicd_pipeline p
            WHERE p.id = pipeline_id
            AND public.has_project_permission(p.project_id, 'cicd:update_pipeline')
        )
    );

-- cicd_pipeline_link: Pipeline-scoped access
DROP POLICY IF EXISTS cicd_pipeline_link_select_policy ON public.cicd_pipeline_link;
CREATE POLICY cicd_pipeline_link_select_policy ON public.cicd_pipeline_link
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.cicd_pipeline p
            WHERE p.id = pipeline_id
            AND public.has_project_access(p.project_id)
        )
    );

-- argocd_instance: Tenant-scoped admin access
DROP POLICY IF EXISTS argocd_instance_select_policy ON public.argocd_instance;
CREATE POLICY argocd_instance_select_policy ON public.argocd_instance
    FOR SELECT
    USING (tenant_id = public.get_current_tenant_id());

DROP POLICY IF EXISTS argocd_instance_insert_policy ON public.argocd_instance;
CREATE POLICY argocd_instance_insert_policy ON public.argocd_instance
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS argocd_instance_update_policy ON public.argocd_instance;
CREATE POLICY argocd_instance_update_policy ON public.argocd_instance
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS argocd_instance_delete_policy ON public.argocd_instance;
CREATE POLICY argocd_instance_delete_policy ON public.argocd_instance
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

-- argocd_application: Project-scoped access
DROP POLICY IF EXISTS argocd_application_select_policy ON public.argocd_application;
CREATE POLICY argocd_application_select_policy ON public.argocd_application
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_access(project_id)
    );

DROP POLICY IF EXISTS argocd_application_insert_policy ON public.argocd_application;
CREATE POLICY argocd_application_insert_policy ON public.argocd_application
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_permission(project_id, 'gitops:create_application')
    );

DROP POLICY IF EXISTS argocd_application_update_policy ON public.argocd_application;
CREATE POLICY argocd_application_update_policy ON public.argocd_application
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_permission(project_id, 'gitops:update_application')
    );

DROP POLICY IF EXISTS argocd_application_delete_policy ON public.argocd_application;
CREATE POLICY argocd_application_delete_policy ON public.argocd_application
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_permission(project_id, 'gitops:delete_application')
    );

-- argocd_sync_history: Application-scoped access
DROP POLICY IF EXISTS argocd_sync_history_select_policy ON public.argocd_sync_history;
CREATE POLICY argocd_sync_history_select_policy ON public.argocd_sync_history
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.argocd_application a
            WHERE a.id = application_id
            AND public.has_project_access(a.project_id)
        )
    );

-- argocd_resource_status: Application-scoped access
DROP POLICY IF EXISTS argocd_resource_status_select_policy ON public.argocd_resource_status;
CREATE POLICY argocd_resource_status_select_policy ON public.argocd_resource_status
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.argocd_application a
            WHERE a.id = application_id
            AND public.has_project_access(a.project_id)
        )
    );

-- argocd_event: Application-scoped access
DROP POLICY IF EXISTS argocd_event_select_policy ON public.argocd_event;
CREATE POLICY argocd_event_select_policy ON public.argocd_event
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.argocd_application a
            WHERE a.id = application_id
            AND public.has_project_access(a.project_id)
        )
    );

-- argocd_drift_finding: Application-scoped access
DROP POLICY IF EXISTS argocd_drift_finding_select_policy ON public.argocd_drift_finding;
CREATE POLICY argocd_drift_finding_select_policy ON public.argocd_drift_finding
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.argocd_application a
            WHERE a.id = application_id
            AND public.has_project_access(a.project_id)
        )
    );

-- release: Project-scoped access
DROP POLICY IF EXISTS release_select_policy ON public.release;
CREATE POLICY release_select_policy ON public.release
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_access(project_id)
    );

DROP POLICY IF EXISTS release_insert_policy ON public.release;
CREATE POLICY release_insert_policy ON public.release
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_permission(project_id, 'cicd:create_release')
    );

DROP POLICY IF EXISTS release_update_policy ON public.release;
CREATE POLICY release_update_policy ON public.release
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.has_project_permission(project_id, 'cicd:update_release')
    );

-- release_link: Release-scoped access
DROP POLICY IF EXISTS release_link_select_policy ON public.release_link;
CREATE POLICY release_link_select_policy ON public.release_link
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.release r
            WHERE r.id = release_id
            AND public.has_project_access(r.project_id)
        )
    );

-- ============================================================================
-- SECTION 7: COLLABORATION TABLES RLS POLICIES
-- ============================================================================

-- comment_thread: Project-scoped access
DROP POLICY IF EXISTS comment_thread_select_policy ON public.comment_thread;
CREATE POLICY comment_thread_select_policy ON public.comment_thread
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND (project_id IS NULL OR public.has_project_access(project_id))
    );

DROP POLICY IF EXISTS comment_thread_insert_policy ON public.comment_thread;
CREATE POLICY comment_thread_insert_policy ON public.comment_thread
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND (project_id IS NULL OR public.has_project_access(project_id))
    );

DROP POLICY IF EXISTS comment_thread_update_policy ON public.comment_thread;
CREATE POLICY comment_thread_update_policy ON public.comment_thread
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND created_by = auth.uid()
    );

-- comment: Thread-scoped access
DROP POLICY IF EXISTS comment_select_policy ON public.comment;
CREATE POLICY comment_select_policy ON public.comment
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.comment_thread t
            WHERE t.id = thread_id
            AND (t.project_id IS NULL OR public.has_project_access(t.project_id))
        )
    );

DROP POLICY IF EXISTS comment_insert_policy ON public.comment;
CREATE POLICY comment_insert_policy ON public.comment
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND author_user_id = auth.uid()
    );

DROP POLICY IF EXISTS comment_update_policy ON public.comment;
CREATE POLICY comment_update_policy ON public.comment
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND author_user_id = auth.uid()
    );

DROP POLICY IF EXISTS comment_delete_policy ON public.comment;
CREATE POLICY comment_delete_policy ON public.comment
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND (author_user_id = auth.uid() OR public.is_tenant_admin())
    );

-- notification: User owns their notifications
DROP POLICY IF EXISTS notification_select_policy ON public.notification;
CREATE POLICY notification_select_policy ON public.notification
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND user_id = auth.uid()
    );

DROP POLICY IF EXISTS notification_insert_policy ON public.notification;
CREATE POLICY notification_insert_policy ON public.notification
    FOR INSERT
    WITH CHECK (tenant_id = public.get_current_tenant_id());

DROP POLICY IF EXISTS notification_update_policy ON public.notification;
CREATE POLICY notification_update_policy ON public.notification
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND user_id = auth.uid()
    );

DROP POLICY IF EXISTS notification_delete_policy ON public.notification;
CREATE POLICY notification_delete_policy ON public.notification
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND user_id = auth.uid()
    );

-- activity_event: Project-scoped access (read-only)
DROP POLICY IF EXISTS activity_event_select_policy ON public.activity_event;
CREATE POLICY activity_event_select_policy ON public.activity_event
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND (project_id IS NULL OR public.has_project_access(project_id))
    );

DROP POLICY IF EXISTS activity_event_insert_policy ON public.activity_event;
CREATE POLICY activity_event_insert_policy ON public.activity_event
    FOR INSERT
    WITH CHECK (tenant_id = public.get_current_tenant_id());

-- attachment: Resource-scoped access
DROP POLICY IF EXISTS attachment_select_policy ON public.attachment;
CREATE POLICY attachment_select_policy ON public.attachment
    FOR SELECT
    USING (tenant_id = public.get_current_tenant_id());

DROP POLICY IF EXISTS attachment_insert_policy ON public.attachment;
CREATE POLICY attachment_insert_policy ON public.attachment
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND created_by = auth.uid()
    );

DROP POLICY IF EXISTS attachment_delete_policy ON public.attachment;
CREATE POLICY attachment_delete_policy ON public.attachment
    FOR DELETE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND (created_by = auth.uid() OR public.is_tenant_admin())
    );

-- approval_request: Project-scoped access
DROP POLICY IF EXISTS approval_request_select_policy ON public.approval_request;
CREATE POLICY approval_request_select_policy ON public.approval_request
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND (
            public.has_project_access(project_id)
            OR requested_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS approval_request_insert_policy ON public.approval_request;
CREATE POLICY approval_request_insert_policy ON public.approval_request
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND requested_by = auth.uid()
    );

DROP POLICY IF EXISTS approval_request_update_policy ON public.approval_request;
CREATE POLICY approval_request_update_policy ON public.approval_request
    FOR UPDATE
    USING (
        tenant_id = public.get_current_tenant_id()
        AND (requested_by = auth.uid() OR public.is_tenant_admin())
    );

-- approval_decision: Approval request-scoped access
DROP POLICY IF EXISTS approval_decision_select_policy ON public.approval_decision;
CREATE POLICY approval_decision_select_policy ON public.approval_decision
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.approval_request ar
            WHERE ar.id = approval_request_id
            AND (public.has_project_access(ar.project_id) OR ar.requested_by = auth.uid())
        )
    );

DROP POLICY IF EXISTS approval_decision_insert_policy ON public.approval_decision;
CREATE POLICY approval_decision_insert_policy ON public.approval_decision
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_current_tenant_id()
        AND approver_user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.approval_request ar
            WHERE ar.id = approval_request_id
            AND public.has_project_permission(ar.project_id, 'project:approve')
        )
    );

-- audit_event: Tenant-scoped admin access (read-only for security)
DROP POLICY IF EXISTS audit_event_select_policy ON public.audit_event;
CREATE POLICY audit_event_select_policy ON public.audit_event
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND (
            public.is_tenant_admin()
            OR actor_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS audit_event_insert_policy ON public.audit_event;
CREATE POLICY audit_event_insert_policy ON public.audit_event
    FOR INSERT
    WITH CHECK (tenant_id = public.get_current_tenant_id());

-- event_outbox: System table, admin access only
DROP POLICY IF EXISTS event_outbox_select_policy ON public.event_outbox;
CREATE POLICY event_outbox_select_policy ON public.event_outbox
    FOR SELECT
    USING (
        tenant_id = public.get_current_tenant_id()
        AND public.is_tenant_admin()
    );

DROP POLICY IF EXISTS event_outbox_insert_policy ON public.event_outbox;
CREATE POLICY event_outbox_insert_policy ON public.event_outbox
    FOR INSERT
    WITH CHECK (tenant_id = public.get_current_tenant_id());

-- ============================================================================
-- END OF MIGRATION: Row Level Security Policies (Part 1)
-- ============================================================================
-- Note: Advanced tables RLS policies are in a separate migration file
-- to maintain manageable file size and clear separation of concerns.
-- ============================================================================
