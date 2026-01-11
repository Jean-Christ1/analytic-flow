-- ============================================================================
-- MIGRATION: Registries and Data Connections Tables
-- Schema: MLOps Control Plane v3
-- Author: Armand AMOUSSOU
-- Date: 2026-01-04
-- ============================================================================

-- ============================================================================
-- ENUMS FOR REGISTRIES
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE public.object_store_type AS ENUM ('s3', 'gcs', 'azure', 'minio');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.container_registry_type AS ENUM ('ecr', 'gar', 'acr', 'harbor', 'dockerhub', 'ghcr');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.environment_build_status AS ENUM ('queued', 'running', 'succeeded', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.environment_status AS ENUM ('active', 'deprecated', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.build_strategy AS ENUM ('dockerfile', 'buildkit', 'kaniko');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- TABLE: container_registry
-- Container image registries for storing Docker images
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.container_registry (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type public.container_registry_type NOT NULL,
    endpoint VARCHAR(500),
    auth_secret_ref UUID REFERENCES public.secret_ref(id) ON DELETE SET NULL,
    trust_policy JSONB DEFAULT '{}'::jsonb,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, name)
);

-- Enable RLS
ALTER TABLE public.container_registry ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_container_registry_tenant_id ON public.container_registry(tenant_id);
CREATE INDEX IF NOT EXISTS idx_container_registry_type ON public.container_registry(type);
CREATE INDEX IF NOT EXISTS idx_container_registry_is_default ON public.container_registry(tenant_id, is_default) WHERE is_default = true;

-- Comments
COMMENT ON TABLE public.container_registry IS 'Container image registries for storing Docker images';
COMMENT ON COLUMN public.container_registry.type IS 'Registry type: ecr, gar, acr, harbor, dockerhub, ghcr';
COMMENT ON COLUMN public.container_registry.endpoint IS 'Registry endpoint URL (e.g., 123456789.dkr.ecr.eu-west-1.amazonaws.com)';
COMMENT ON COLUMN public.container_registry.auth_secret_ref IS 'Reference to secret for registry authentication';
COMMENT ON COLUMN public.container_registry.trust_policy IS 'Image trust policy (signing, vulnerability thresholds)';
COMMENT ON COLUMN public.container_registry.is_default IS 'Whether this is the default registry for the tenant';

-- ============================================================================
-- TABLE: object_store
-- Object storage backends for artifacts and data
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.object_store (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type public.object_store_type NOT NULL,
    endpoint VARCHAR(500),
    bucket VARCHAR(255),
    prefix VARCHAR(255),
    auth_secret_ref UUID REFERENCES public.secret_ref(id) ON DELETE SET NULL,
    kms_key_ref VARCHAR(500),
    retention_policy JSONB DEFAULT '{}'::jsonb,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, name)
);

-- Enable RLS
ALTER TABLE public.object_store ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_object_store_tenant_id ON public.object_store(tenant_id);
CREATE INDEX IF NOT EXISTS idx_object_store_type ON public.object_store(type);
CREATE INDEX IF NOT EXISTS idx_object_store_is_default ON public.object_store(tenant_id, is_default) WHERE is_default = true;

-- Comments
COMMENT ON TABLE public.object_store IS 'Object storage backends for artifacts, datasets, and logs';
COMMENT ON COLUMN public.object_store.type IS 'Storage type: s3, gcs, azure, minio';
COMMENT ON COLUMN public.object_store.endpoint IS 'Custom endpoint for MinIO or S3-compatible storage';
COMMENT ON COLUMN public.object_store.bucket IS 'Bucket/container name';
COMMENT ON COLUMN public.object_store.prefix IS 'Key prefix for tenant isolation';
COMMENT ON COLUMN public.object_store.kms_key_ref IS 'KMS key reference for encryption';
COMMENT ON COLUMN public.object_store.retention_policy IS 'Retention policy rules (lifecycle, versioning)';

-- ============================================================================
-- TABLE: data_connection
-- External data source connections
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.data_connection (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    config JSONB DEFAULT '{}'::jsonb,
    secret_ref_id UUID REFERENCES public.secret_ref(id) ON DELETE SET NULL,
    test_query TEXT,
    last_tested_at TIMESTAMP WITH TIME ZONE,
    test_status VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.user_account(id) ON DELETE SET NULL,
    UNIQUE(tenant_id, name)
);

-- Enable RLS
ALTER TABLE public.data_connection ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_data_connection_tenant_id ON public.data_connection(tenant_id);
CREATE INDEX IF NOT EXISTS idx_data_connection_type ON public.data_connection(type);

-- Comments
COMMENT ON TABLE public.data_connection IS 'External data source connections for ML workflows';
COMMENT ON COLUMN public.data_connection.type IS 'Connection type: snowflake, databricks, jdbc, sftp, nfs, bigquery, redshift, postgres';
COMMENT ON COLUMN public.data_connection.config IS 'Connection configuration (host, port, database, etc.)';
COMMENT ON COLUMN public.data_connection.secret_ref_id IS 'Reference to credentials secret';
COMMENT ON COLUMN public.data_connection.test_query IS 'SQL query for testing connection';

-- ============================================================================
-- TABLE: environment
-- Compute environment definitions (base images, dependencies)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.environment (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.project(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    base_image VARCHAR(500),
    spec JSONB DEFAULT '{}'::jsonb,
    build_strategy public.build_strategy DEFAULT 'dockerfile',
    registry_id UUID REFERENCES public.container_registry(id) ON DELETE SET NULL,
    runtime_policy_id UUID REFERENCES public.runtime_policy(id) ON DELETE SET NULL,
    status public.environment_status NOT NULL DEFAULT 'active',
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.user_account(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.user_account(id) ON DELETE SET NULL
);

-- Unique constraint using index for environments (handles NULL project_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_environment_tenant_project_name
    ON public.environment(tenant_id, COALESCE(project_id, '00000000-0000-0000-0000-000000000000'::uuid), name);

-- Enable RLS
ALTER TABLE public.environment ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_environment_tenant_id ON public.environment(tenant_id);
CREATE INDEX IF NOT EXISTS idx_environment_project_id ON public.environment(project_id);
CREATE INDEX IF NOT EXISTS idx_environment_status ON public.environment(status);
CREATE INDEX IF NOT EXISTS idx_environment_is_default ON public.environment(tenant_id, is_default) WHERE is_default = true;

-- Comments
COMMENT ON TABLE public.environment IS 'Compute environment definitions for ML workloads';
COMMENT ON COLUMN public.environment.base_image IS 'Base Docker image (e.g., python:3.11-slim)';
COMMENT ON COLUMN public.environment.spec IS 'Environment specification (conda.yaml, requirements.txt, poetry.lock)';
COMMENT ON COLUMN public.environment.build_strategy IS 'Container build strategy: dockerfile, buildkit, kaniko';
COMMENT ON COLUMN public.environment.project_id IS 'NULL for tenant-wide environments, set for project-specific';

-- ============================================================================
-- TABLE: environment_build
-- Environment build history and artifacts
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.environment_build (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    environment_id UUID NOT NULL REFERENCES public.environment(id) ON DELETE CASCADE,
    version INTEGER NOT NULL DEFAULT 1,
    git_commit_sha VARCHAR(40),
    build_log_uri VARCHAR(500),
    image_name VARCHAR(500),
    image_tag VARCHAR(128),
    image_digest VARCHAR(100),
    sbom_uri VARCHAR(500),
    vuln_report_uri VARCHAR(500),
    status public.environment_build_status NOT NULL DEFAULT 'queued',
    failure_reason TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    finished_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER GENERATED ALWAYS AS (
        CASE
            WHEN finished_at IS NOT NULL AND started_at IS NOT NULL
            THEN EXTRACT(EPOCH FROM (finished_at - started_at))::INTEGER
            ELSE NULL
        END
    ) STORED,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.user_account(id) ON DELETE SET NULL,
    UNIQUE(environment_id, version)
);

-- Enable RLS
ALTER TABLE public.environment_build ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_environment_build_tenant_id ON public.environment_build(tenant_id);
CREATE INDEX IF NOT EXISTS idx_environment_build_environment_id ON public.environment_build(environment_id);
CREATE INDEX IF NOT EXISTS idx_environment_build_status ON public.environment_build(status);
CREATE INDEX IF NOT EXISTS idx_environment_build_created_at ON public.environment_build(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_environment_build_image_digest ON public.environment_build(image_digest);

-- Comments
COMMENT ON TABLE public.environment_build IS 'Environment build history with container images';
COMMENT ON COLUMN public.environment_build.version IS 'Incrementing version number for this environment';
COMMENT ON COLUMN public.environment_build.git_commit_sha IS 'Git commit SHA of the environment definition';
COMMENT ON COLUMN public.environment_build.build_log_uri IS 'URI to build logs in object store';
COMMENT ON COLUMN public.environment_build.image_digest IS 'Container image digest (sha256:...)';
COMMENT ON COLUMN public.environment_build.sbom_uri IS 'URI to Software Bill of Materials';
COMMENT ON COLUMN public.environment_build.vuln_report_uri IS 'URI to vulnerability scan report';

-- ============================================================================
-- FUNCTION: Auto-increment environment build version
-- ============================================================================

CREATE OR REPLACE FUNCTION public.increment_environment_build_version()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.version IS NULL OR NEW.version = 1 THEN
        SELECT COALESCE(MAX(version), 0) + 1 INTO NEW.version
        FROM public.environment_build
        WHERE environment_id = NEW.environment_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-incrementing version
DROP TRIGGER IF EXISTS trigger_increment_environment_build_version ON public.environment_build;
CREATE TRIGGER trigger_increment_environment_build_version
    BEFORE INSERT ON public.environment_build
    FOR EACH ROW
    EXECUTE FUNCTION public.increment_environment_build_version();

-- ============================================================================
-- TRIGGERS: Auto-update updated_at
-- ============================================================================

-- Container Registry
DROP TRIGGER IF EXISTS set_container_registry_updated_at ON public.container_registry;
CREATE TRIGGER set_container_registry_updated_at
    BEFORE UPDATE ON public.container_registry
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- Object Store
DROP TRIGGER IF EXISTS set_object_store_updated_at ON public.object_store;
CREATE TRIGGER set_object_store_updated_at
    BEFORE UPDATE ON public.object_store
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- Data Connection
DROP TRIGGER IF EXISTS set_data_connection_updated_at ON public.data_connection;
CREATE TRIGGER set_data_connection_updated_at
    BEFORE UPDATE ON public.data_connection
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- Environment
DROP TRIGGER IF EXISTS set_environment_updated_at ON public.environment;
CREATE TRIGGER set_environment_updated_at
    BEFORE UPDATE ON public.environment
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- END OF MIGRATION: Registries and Data Connections Tables
-- ============================================================================
