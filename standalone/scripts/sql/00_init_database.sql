-- ============================================================================
-- APEX-ML-PLATFORM - Standalone PostgreSQL Initialization
-- Version: 1.0.0
-- Author: Armand AMOUSSOU
-- Date: 2026-01-07
-- PostgreSQL: 16.x LTS
-- ============================================================================
-- This script initializes a completely standalone PostgreSQL database
-- independent of Supabase or any managed service.
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ============================================================================
-- SCHEMAS
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS auth_v2;
CREATE SCHEMA IF NOT EXISTS storage_v2;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS _migration;

COMMENT ON SCHEMA auth_v2 IS 'Authentication schema - replaces Supabase auth';
COMMENT ON SCHEMA storage_v2 IS 'Storage metadata schema - replaces Supabase storage';
COMMENT ON SCHEMA audit IS 'Audit logging schema';
COMMENT ON SCHEMA _migration IS 'Migration tracking and staging';

-- ============================================================================
-- APPLICATION ROLES
-- ============================================================================

DO $$
BEGIN
    -- Main application role
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'apex_app') THEN
        CREATE ROLE apex_app WITH LOGIN PASSWORD 'CHANGE_ME_APP_PASSWORD';
    END IF;

    -- Read-only role for reporting
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'apex_readonly') THEN
        CREATE ROLE apex_readonly WITH LOGIN PASSWORD 'CHANGE_ME_READONLY_PASSWORD';
    END IF;

    -- Admin role
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'apex_admin') THEN
        CREATE ROLE apex_admin WITH LOGIN PASSWORD 'CHANGE_ME_ADMIN_PASSWORD' CREATEROLE;
    END IF;

    -- Service role for backend API
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'apex_service') THEN
        CREATE ROLE apex_service WITH LOGIN PASSWORD 'CHANGE_ME_SERVICE_PASSWORD';
    END IF;

    -- Migration role
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'apex_migration') THEN
        CREATE ROLE apex_migration WITH LOGIN PASSWORD 'CHANGE_ME_MIGRATION_PASSWORD';
    END IF;

    -- Backup role
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'apex_backup') THEN
        CREATE ROLE apex_backup WITH LOGIN PASSWORD 'CHANGE_ME_BACKUP_PASSWORD';
    END IF;
END
$$;

-- Role hierarchy
GRANT apex_readonly TO apex_app;
GRANT apex_app TO apex_service;
GRANT apex_service TO apex_admin;
GRANT apex_migration TO apex_admin;
GRANT apex_backup TO apex_admin;

-- Schema grants
GRANT USAGE ON SCHEMA public TO apex_app, apex_readonly, apex_service;
GRANT USAGE ON SCHEMA auth_v2 TO apex_app, apex_service;
GRANT USAGE ON SCHEMA storage_v2 TO apex_app, apex_service;
GRANT USAGE ON SCHEMA audit TO apex_app, apex_readonly, apex_service;
GRANT ALL ON SCHEMA _migration TO apex_migration;

-- ============================================================================
-- AUTH_V2 SCHEMA - Replaces Supabase auth
-- ============================================================================

CREATE TABLE IF NOT EXISTS auth_v2.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMPTZ,
    phone VARCHAR(50),
    phone_verified BOOLEAN DEFAULT false,
    encrypted_password VARCHAR(255),
    raw_user_meta_data JSONB DEFAULT '{}'::jsonb,
    raw_app_meta_data JSONB DEFAULT '{}'::jsonb,
    is_super_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_sign_in_at TIMESTAMPTZ,
    banned_until TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX IF NOT EXISTS idx_auth_v2_users_email ON auth_v2.users(email);
CREATE INDEX IF NOT EXISTS idx_auth_v2_users_external_id ON auth_v2.users(external_id);
CREATE INDEX IF NOT EXISTS idx_auth_v2_users_created ON auth_v2.users(created_at);

COMMENT ON TABLE auth_v2.users IS 'User accounts - replaces Supabase auth.users';
COMMENT ON COLUMN auth_v2.users.external_id IS 'External identity provider ID (Keycloak, Auth0, etc.)';
COMMENT ON COLUMN auth_v2.users.encrypted_password IS 'bcrypt hashed password';

CREATE TABLE IF NOT EXISTS auth_v2.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth_v2.users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_auth_v2_sessions_user ON auth_v2.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_v2_sessions_expires ON auth_v2.sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_v2_sessions_token ON auth_v2.sessions(token_hash);

COMMENT ON TABLE auth_v2.sessions IS 'Active user sessions';

CREATE TABLE IF NOT EXISTS auth_v2.refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES auth_v2.sessions(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_auth_v2_refresh_tokens_session ON auth_v2.refresh_tokens(session_id);
CREATE INDEX IF NOT EXISTS idx_auth_v2_refresh_tokens_expires ON auth_v2.refresh_tokens(expires_at);

COMMENT ON TABLE auth_v2.refresh_tokens IS 'JWT refresh tokens';

-- ============================================================================
-- STORAGE_V2 SCHEMA - Replaces Supabase storage
-- ============================================================================

CREATE TABLE IF NOT EXISTS storage_v2.buckets (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    owner_id UUID REFERENCES auth_v2.users(id) ON DELETE SET NULL,
    public BOOLEAN NOT NULL DEFAULT false,
    file_size_limit BIGINT,
    allowed_mime_types TEXT[],
    avif_autodetection BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE storage_v2.buckets IS 'Storage buckets metadata - actual storage in MinIO/S3';
COMMENT ON COLUMN storage_v2.buckets.file_size_limit IS 'Maximum file size in bytes';
COMMENT ON COLUMN storage_v2.buckets.allowed_mime_types IS 'Array of allowed MIME types';

CREATE TABLE IF NOT EXISTS storage_v2.objects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bucket_id VARCHAR(255) NOT NULL REFERENCES storage_v2.buckets(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    owner_id UUID REFERENCES auth_v2.users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    path_tokens TEXT[] GENERATED ALWAYS AS (string_to_array(name, '/')) STORED,
    version VARCHAR(50) DEFAULT '1',
    size BIGINT,
    mime_type VARCHAR(255),
    etag VARCHAR(255),
    storage_backend VARCHAR(50) DEFAULT 'minio',
    storage_path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_accessed_at TIMESTAMPTZ,
    UNIQUE(bucket_id, name)
);

CREATE INDEX IF NOT EXISTS idx_storage_v2_objects_bucket ON storage_v2.objects(bucket_id);
CREATE INDEX IF NOT EXISTS idx_storage_v2_objects_owner ON storage_v2.objects(owner_id);
CREATE INDEX IF NOT EXISTS idx_storage_v2_objects_path ON storage_v2.objects USING GIN(path_tokens);
CREATE INDEX IF NOT EXISTS idx_storage_v2_objects_name ON storage_v2.objects(name);

COMMENT ON TABLE storage_v2.objects IS 'Object metadata - actual files stored in MinIO/S3';
COMMENT ON COLUMN storage_v2.objects.storage_backend IS 'Storage backend: minio, s3, gcs, azure';
COMMENT ON COLUMN storage_v2.objects.storage_path IS 'Full path in storage backend';

-- ============================================================================
-- AUDIT SCHEMA
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit.logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    actor_id UUID,
    actor_email VARCHAR(255),
    actor_ip INET,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    tenant_id UUID,
    old_data JSONB,
    new_data JSONB,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit.logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit.logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit.logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit.logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit.logs(tenant_id);

COMMENT ON TABLE audit.logs IS 'Comprehensive audit log for all database operations';

-- ============================================================================
-- MIGRATION TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS _migration.log (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL,
    table_name VARCHAR(255),
    source_count BIGINT,
    target_count BIGINT,
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'pending',
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS _migration.corrections (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100),
    record_id UUID,
    field_name VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    reason TEXT,
    corrected_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- STANDALONE HELPER FUNCTIONS - Replaces Supabase auth functions
-- ============================================================================

-- Session variable for current user ID (set by backend before each request)
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_user_id', true), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.current_user_id() IS 'Returns current user ID from session variable - replaces auth.uid()';

-- Session variable for current tenant ID
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant_id', true), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.current_tenant_id() IS 'Returns current tenant ID from session variable';

-- Check if current user is platform admin
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(
        current_setting('app.is_platform_admin', true)::boolean,
        false
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.is_platform_admin() IS 'Checks if current user is platform admin';

-- Check if current user is tenant admin
CREATE OR REPLACE FUNCTION public.is_tenant_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(
        current_setting('app.is_tenant_admin', true)::boolean,
        false
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.is_tenant_admin() IS 'Checks if current user is tenant admin';

-- Alias functions for backward compatibility with existing code
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
-- UTILITY FUNCTIONS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.update_updated_at() IS 'Trigger function to auto-update updated_at column';

-- Alias for compatibility
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- AUDIT TRIGGER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION audit.log_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit.logs (
        actor_id,
        actor_ip,
        action,
        resource_type,
        resource_id,
        tenant_id,
        old_data,
        new_data
    )
    VALUES (
        public.current_user_id(),
        inet_client_addr(),
        TG_OP,
        TG_TABLE_NAME,
        CASE TG_OP
            WHEN 'DELETE' THEN (OLD).id
            ELSE (NEW).id
        END,
        CASE TG_OP
            WHEN 'DELETE' THEN
                CASE WHEN TG_TABLE_NAME != 'tenant' THEN (OLD).tenant_id ELSE (OLD).id END
            ELSE
                CASE WHEN TG_TABLE_NAME != 'tenant' THEN (NEW).tenant_id ELSE (NEW).id END
        END,
        CASE TG_OP
            WHEN 'INSERT' THEN NULL
            ELSE to_jsonb(OLD)
        END,
        CASE TG_OP
            WHEN 'DELETE' THEN NULL
            ELSE to_jsonb(NEW)
        END
    );

    RETURN COALESCE(NEW, OLD);
EXCEPTION
    WHEN OTHERS THEN
        -- Don't fail the main operation if audit fails
        RAISE WARNING 'Audit log failed: %', SQLERRM;
        RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION audit.log_changes() IS 'Trigger function to log all changes to audit.logs';

-- ============================================================================
-- PASSWORD HASHING FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION auth_v2.validate_password(p_password TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Minimum 12 characters
    IF length(p_password) < 12 THEN
        RAISE EXCEPTION 'Password must be at least 12 characters';
    END IF;

    -- At least one uppercase
    IF p_password !~ '[A-Z]' THEN
        RAISE EXCEPTION 'Password must contain at least one uppercase letter';
    END IF;

    -- At least one lowercase
    IF p_password !~ '[a-z]' THEN
        RAISE EXCEPTION 'Password must contain at least one lowercase letter';
    END IF;

    -- At least one digit
    IF p_password !~ '[0-9]' THEN
        RAISE EXCEPTION 'Password must contain at least one digit';
    END IF;

    -- At least one special character
    IF p_password !~ '[!@#$%^&*(),.?":{}|<>]' THEN
        RAISE EXCEPTION 'Password must contain at least one special character';
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auth_v2.validate_password(TEXT) IS 'Validates password complexity requirements';

CREATE OR REPLACE FUNCTION auth_v2.hash_password()
RETURNS TRIGGER AS $$
BEGIN
    -- Only hash if password is not already hashed (bcrypt format)
    IF NEW.encrypted_password IS NOT NULL AND
       NEW.encrypted_password NOT LIKE '$2a$%' AND
       NEW.encrypted_password NOT LIKE '$2b$%' THEN
        -- Validate then hash
        PERFORM auth_v2.validate_password(NEW.encrypted_password);
        NEW.encrypted_password := crypt(NEW.encrypted_password, gen_salt('bf', 12));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS hash_user_password ON auth_v2.users;
CREATE TRIGGER hash_user_password
    BEFORE INSERT OR UPDATE OF encrypted_password ON auth_v2.users
    FOR EACH ROW EXECUTE FUNCTION auth_v2.hash_password();

-- Function to verify password
CREATE OR REPLACE FUNCTION auth_v2.verify_password(p_email TEXT, p_password TEXT)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
    v_stored_password VARCHAR(255);
BEGIN
    SELECT id, encrypted_password INTO v_user_id, v_stored_password
    FROM auth_v2.users
    WHERE email = p_email
    AND deleted_at IS NULL
    AND (banned_until IS NULL OR banned_until < now());

    IF v_user_id IS NULL THEN
        RETURN NULL;
    END IF;

    IF v_stored_password = crypt(p_password, v_stored_password) THEN
        -- Update last sign in
        UPDATE auth_v2.users SET last_sign_in_at = now() WHERE id = v_user_id;
        RETURN v_user_id;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION auth_v2.verify_password(TEXT, TEXT) IS 'Verifies user password and returns user ID if valid';

-- ============================================================================
-- STORAGE HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION storage_v2.get_folder_name(p_path TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN (string_to_array(p_path, '/'))[1];
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION storage_v2.get_folder_name(TEXT) IS 'Extracts first folder from path - replaces storage.foldername()';

-- ============================================================================
-- DEFAULT BUCKETS
-- ============================================================================

INSERT INTO storage_v2.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
    ('models', 'models', false, 104857600, ARRAY['application/octet-stream', 'application/zip', 'application/x-tar', 'application/gzip']),
    ('datasets', 'datasets', false, 524288000, ARRAY['text/csv', 'application/json', 'application/x-parquet', 'application/octet-stream']),
    ('exports', 'exports', false, 104857600, ARRAY['text/csv', 'application/json', 'application/pdf', 'application/zip']),
    ('experiments', 'experiments', false, NULL, NULL),
    ('artifacts', 'artifacts', false, NULL, NULL),
    ('logs', 'logs', false, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- GRANT PERMISSIONS ON NEW OBJECTS
-- ============================================================================

-- auth_v2 schema
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA auth_v2 TO apex_service;
GRANT SELECT ON ALL TABLES IN SCHEMA auth_v2 TO apex_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA auth_v2 TO apex_service;

-- storage_v2 schema
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA storage_v2 TO apex_service;
GRANT SELECT ON ALL TABLES IN SCHEMA storage_v2 TO apex_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA storage_v2 TO apex_service;

-- audit schema
GRANT INSERT ON audit.logs TO apex_app, apex_service;
GRANT SELECT ON audit.logs TO apex_readonly, apex_admin;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA audit TO apex_app, apex_service;

-- _migration schema
GRANT ALL ON ALL TABLES IN SCHEMA _migration TO apex_migration;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA _migration TO apex_migration;

-- ============================================================================
-- INITIALIZATION COMPLETE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'APEX-ML-PLATFORM Standalone PostgreSQL Initialization Complete';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'Schemas created: auth_v2, storage_v2, audit, _migration';
    RAISE NOTICE 'Roles created: apex_app, apex_readonly, apex_admin, apex_service';
    RAISE NOTICE 'Default buckets: avatars, models, datasets, exports, experiments, artifacts, logs';
    RAISE NOTICE '';
    RAISE NOTICE 'IMPORTANT: Change default passwords before production use!';
    RAISE NOTICE '============================================================';
END;
$$;
