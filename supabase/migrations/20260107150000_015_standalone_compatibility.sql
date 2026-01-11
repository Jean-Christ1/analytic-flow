-- ============================================================================
-- MIGRATION: Standalone Compatibility Layer
-- Schema: MLOps Control Plane v3
-- Author: Armand AMOUSSOU
-- Date: 2026-01-07
-- ============================================================================
-- This migration makes the database PORTABLE and AUTONOMOUS by:
-- 1. Creating standalone helper functions that abstract Supabase dependencies
-- 2. These functions currently use auth.uid() but can be replaced when deployed elsewhere
-- 3. RLS policies will be updated to use these portable functions
-- ============================================================================

-- ============================================================================
-- PORTABLE HELPER FUNCTIONS
-- ============================================================================
-- These functions provide a portability layer:
-- - On Supabase: they call auth.uid(), auth.role(), etc.
-- - On standalone: they read from session variables (app.current_user_id, etc.)
-- ============================================================================

-- Function to get current user ID (portable)
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID AS $$
BEGIN
    -- Try session variable first (for standalone deployment)
    IF current_setting('app.current_user_id', true) IS NOT NULL
       AND current_setting('app.current_user_id', true) != '' THEN
        RETURN current_setting('app.current_user_id', true)::UUID;
    END IF;

    -- Fall back to Supabase auth.uid() (for Supabase deployment)
    RETURN auth.uid();
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.current_user_id() IS 'Portable function to get current user ID. Uses session variable if set, otherwise falls back to auth.uid()';

-- Function to get current tenant ID (portable)
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS UUID AS $$
DECLARE
    v_tenant_id UUID;
BEGIN
    -- Try session variable first
    IF current_setting('app.current_tenant_id', true) IS NOT NULL
       AND current_setting('app.current_tenant_id', true) != '' THEN
        RETURN current_setting('app.current_tenant_id', true)::UUID;
    END IF;

    -- Fall back to JWT claim (Supabase)
    BEGIN
        v_tenant_id := (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::UUID;
        IF v_tenant_id IS NOT NULL THEN
            RETURN v_tenant_id;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -- Fall back to user's default tenant from user_account
    SELECT ua.tenant_id INTO v_tenant_id
    FROM public.user_account ua
    WHERE ua.id = public.current_user_id()
    LIMIT 1;

    RETURN v_tenant_id;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.current_tenant_id() IS 'Portable function to get current tenant ID. Uses session variable, JWT claim, or user default tenant';

-- Function to check if current user is platform admin (portable)
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN AS $$
DECLARE
    v_is_admin BOOLEAN;
BEGIN
    -- Try session variable first
    IF current_setting('app.is_platform_admin', true) IS NOT NULL
       AND current_setting('app.is_platform_admin', true) != '' THEN
        RETURN current_setting('app.is_platform_admin', true)::BOOLEAN;
    END IF;

    -- Try JWT claim (Supabase)
    BEGIN
        v_is_admin := (current_setting('request.jwt.claims', true)::jsonb ->> 'is_platform_admin')::BOOLEAN;
        IF v_is_admin IS NOT NULL THEN
            RETURN v_is_admin;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -- Check user role in database
    SELECT EXISTS (
        SELECT 1
        FROM public.principal_role_binding prb
        INNER JOIN public.role r ON r.id = prb.role_id
        WHERE prb.principal_type = 'user'
        AND prb.principal_id = public.current_user_id()
        AND r.name IN ('platform_admin', 'super_admin')
    ) INTO v_is_admin;

    RETURN COALESCE(v_is_admin, false);
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.is_platform_admin() IS 'Portable function to check if current user is platform admin';

-- Function to check if current user is tenant admin (portable)
CREATE OR REPLACE FUNCTION public.is_tenant_admin()
RETURNS BOOLEAN AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_current_tenant UUID;
BEGIN
    -- Try session variable first
    IF current_setting('app.is_tenant_admin', true) IS NOT NULL
       AND current_setting('app.is_tenant_admin', true) != '' THEN
        RETURN current_setting('app.is_tenant_admin', true)::BOOLEAN;
    END IF;

    -- Try JWT claim (Supabase)
    BEGIN
        v_is_admin := (current_setting('request.jwt.claims', true)::jsonb ->> 'is_tenant_admin')::BOOLEAN;
        IF v_is_admin IS NOT NULL THEN
            RETURN v_is_admin;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -- Check user role in database for current tenant
    v_current_tenant := public.current_tenant_id();

    SELECT EXISTS (
        SELECT 1
        FROM public.principal_role_binding prb
        INNER JOIN public.role r ON r.id = prb.role_id
        WHERE prb.principal_type = 'user'
        AND prb.principal_id = public.current_user_id()
        AND prb.scope_type = 'tenant'
        AND prb.scope_id = v_current_tenant
        AND r.name IN ('tenant_admin', 'admin')
    ) INTO v_is_admin;

    RETURN COALESCE(v_is_admin, false);
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.is_tenant_admin() IS 'Portable function to check if current user is tenant admin';

-- Alias functions for backward compatibility
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN public.current_user_id();
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN public.current_tenant_id();
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- PORTABLE PROJECT ACCESS FUNCTIONS
-- ============================================================================

-- Check if user has access to a project (portable)
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

    RETURN COALESCE(v_has_access, false);
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.has_project_access(UUID) IS 'Portable function to check if current user has any access to the project';

-- Check if user has specific permission on a project (portable)
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

    RETURN COALESCE(v_has_permission, false);
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.has_project_permission(UUID, VARCHAR) IS 'Portable function to check if current user has specific permission on the project';

-- Check if user belongs to tenant (portable)
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

    -- Check current tenant from session/context
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

    RETURN COALESCE(v_belongs, false);
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.user_belongs_to_tenant(UUID) IS 'Portable function to check if current user belongs to the tenant';

-- ============================================================================
-- PORTABLE STORAGE HELPER
-- ============================================================================

-- Storage folder name extractor (replaces storage.foldername)
CREATE OR REPLACE FUNCTION public.storage_foldername(p_path TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN (string_to_array(p_path, '/'))[1];
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.storage_foldername(TEXT) IS 'Portable function to extract folder name from path. Replaces storage.foldername()';

-- ============================================================================
-- DATABASE PORTABILITY METADATA
-- ============================================================================

-- Create a metadata table to track portability status
CREATE TABLE IF NOT EXISTS public._database_metadata (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert portability markers
INSERT INTO public._database_metadata (key, value) VALUES
    ('schema_version', '3.0.0'),
    ('portability_layer', 'enabled'),
    ('portability_version', '1.0.0'),
    ('original_platform', 'supabase'),
    ('migration_date', now()::TEXT),
    ('auth_abstraction', 'public.current_user_id()'),
    ('tenant_abstraction', 'public.current_tenant_id()'),
    ('admin_check_abstraction', 'public.is_platform_admin(), public.is_tenant_admin()'),
    ('storage_abstraction', 'public.storage_foldername()')
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = now();

COMMENT ON TABLE public._database_metadata IS 'Database metadata for tracking portability status and configuration';

-- ============================================================================
-- VERIFICATION FUNCTION
-- ============================================================================

-- Function to verify portability layer is working
CREATE OR REPLACE FUNCTION public.verify_portability()
RETURNS TABLE (
    check_name TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check current_user_id function
    RETURN QUERY SELECT
        'current_user_id'::TEXT,
        CASE WHEN public.current_user_id() IS NOT NULL THEN 'OK' ELSE 'NULL (expected if not authenticated)' END,
        COALESCE(public.current_user_id()::TEXT, 'No user context');

    -- Check current_tenant_id function
    RETURN QUERY SELECT
        'current_tenant_id'::TEXT,
        CASE WHEN public.current_tenant_id() IS NOT NULL THEN 'OK' ELSE 'NULL (expected if no tenant)' END,
        COALESCE(public.current_tenant_id()::TEXT, 'No tenant context');

    -- Check is_platform_admin function
    RETURN QUERY SELECT
        'is_platform_admin'::TEXT,
        'OK'::TEXT,
        public.is_platform_admin()::TEXT;

    -- Check is_tenant_admin function
    RETURN QUERY SELECT
        'is_tenant_admin'::TEXT,
        'OK'::TEXT,
        public.is_tenant_admin()::TEXT;

    -- Check metadata table
    RETURN QUERY SELECT
        'portability_layer'::TEXT,
        CASE WHEN EXISTS (SELECT 1 FROM public._database_metadata WHERE key = 'portability_layer') THEN 'ENABLED' ELSE 'MISSING' END,
        (SELECT value FROM public._database_metadata WHERE key = 'portability_version');

    -- Check function count
    RETURN QUERY SELECT
        'portable_functions'::TEXT,
        'OK'::TEXT,
        (SELECT COUNT(*)::TEXT || ' functions' FROM pg_proc p
         JOIN pg_namespace n ON p.pronamespace = n.oid
         WHERE n.nspname = 'public'
         AND p.proname IN ('current_user_id', 'current_tenant_id', 'is_platform_admin', 'is_tenant_admin',
                           'has_project_access', 'has_project_permission', 'user_belongs_to_tenant'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.verify_portability() IS 'Verifies that the portability layer is correctly installed and functioning';

-- ============================================================================
-- COMPLETION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'STANDALONE COMPATIBILITY LAYER INSTALLED';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'The database is now PORTABLE and can be deployed:';
    RAISE NOTICE '  - On Supabase (current) using auth.uid() fallback';
    RAISE NOTICE '  - On standalone PostgreSQL using session variables';
    RAISE NOTICE '';
    RAISE NOTICE 'Portable functions installed:';
    RAISE NOTICE '  - public.current_user_id()';
    RAISE NOTICE '  - public.current_tenant_id()';
    RAISE NOTICE '  - public.is_platform_admin()';
    RAISE NOTICE '  - public.is_tenant_admin()';
    RAISE NOTICE '  - public.has_project_access(uuid)';
    RAISE NOTICE '  - public.has_project_permission(uuid, varchar)';
    RAISE NOTICE '  - public.user_belongs_to_tenant(uuid)';
    RAISE NOTICE '  - public.storage_foldername(text)';
    RAISE NOTICE '';
    RAISE NOTICE 'Run SELECT * FROM public.verify_portability(); to verify';
    RAISE NOTICE '============================================================';
END;
$$;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
