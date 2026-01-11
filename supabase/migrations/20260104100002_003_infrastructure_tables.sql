-- ============================================================================
-- MIGRATION: Infrastructure Tables
-- Schema: MLOps Control Plane v3
-- Author: Armand AMOUSSOU
-- Date: 2026-01-04
-- ============================================================================

-- ============================================================================
-- ENUMS FOR INFRASTRUCTURE
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE public.cloud_provider AS ENUM ('aws', 'gcp', 'azure', 'onprem');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.k8s_environment AS ENUM ('dev', 'staging', 'prod', 'sandbox');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.k8s_cluster_status AS ENUM ('ready', 'degraded', 'down');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- TABLE: k8s_cluster
-- Kubernetes clusters for MLOps workloads
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.k8s_cluster (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    provider public.cloud_provider NOT NULL,
    region VARCHAR(50),
    environment public.k8s_environment NOT NULL DEFAULT 'dev',
    api_server_url VARCHAR(500),
    cluster_identity JSONB DEFAULT '{}'::jsonb,
    network_profile JSONB DEFAULT '{}'::jsonb,
    status public.k8s_cluster_status NOT NULL DEFAULT 'ready',
    version VARCHAR(20),
    labels JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, name)
);

-- Enable RLS
ALTER TABLE public.k8s_cluster ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_k8s_cluster_tenant_id ON public.k8s_cluster(tenant_id);
CREATE INDEX IF NOT EXISTS idx_k8s_cluster_provider ON public.k8s_cluster(provider);
CREATE INDEX IF NOT EXISTS idx_k8s_cluster_environment ON public.k8s_cluster(environment);
CREATE INDEX IF NOT EXISTS idx_k8s_cluster_status ON public.k8s_cluster(status);
CREATE INDEX IF NOT EXISTS idx_k8s_cluster_labels ON public.k8s_cluster USING gin(labels);

-- Comments
COMMENT ON TABLE public.k8s_cluster IS 'Kubernetes clusters for MLOps workloads';
COMMENT ON COLUMN public.k8s_cluster.provider IS 'Cloud provider: aws, gcp, azure, onprem';
COMMENT ON COLUMN public.k8s_cluster.environment IS 'Environment tier: dev, staging, prod, sandbox';
COMMENT ON COLUMN public.k8s_cluster.cluster_identity IS 'Cluster identity configuration (service account, role ARN, etc.)';
COMMENT ON COLUMN public.k8s_cluster.network_profile IS 'Network configuration (VPC, subnets, security groups)';

-- ============================================================================
-- TABLE: k8s_namespace_binding
-- Kubernetes namespace bindings for projects
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.k8s_namespace_binding (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
    cluster_id UUID NOT NULL REFERENCES public.k8s_cluster(id) ON DELETE CASCADE,
    namespace VARCHAR(63) NOT NULL,
    resource_quota JSONB DEFAULT '{}'::jsonb,
    limit_range JSONB DEFAULT '{}'::jsonb,
    network_policy_profile VARCHAR(100),
    pod_security_profile VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(cluster_id, namespace)
);

-- Enable RLS
ALTER TABLE public.k8s_namespace_binding ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_k8s_namespace_binding_tenant_id ON public.k8s_namespace_binding(tenant_id);
CREATE INDEX IF NOT EXISTS idx_k8s_namespace_binding_project_id ON public.k8s_namespace_binding(project_id);
CREATE INDEX IF NOT EXISTS idx_k8s_namespace_binding_cluster_id ON public.k8s_namespace_binding(cluster_id);
CREATE INDEX IF NOT EXISTS idx_k8s_namespace_binding_namespace ON public.k8s_namespace_binding(namespace);

-- Comments
COMMENT ON TABLE public.k8s_namespace_binding IS 'Project-to-namespace bindings in Kubernetes clusters';
COMMENT ON COLUMN public.k8s_namespace_binding.namespace IS 'Kubernetes namespace name (max 63 chars)';
COMMENT ON COLUMN public.k8s_namespace_binding.resource_quota IS 'Kubernetes ResourceQuota spec';
COMMENT ON COLUMN public.k8s_namespace_binding.limit_range IS 'Kubernetes LimitRange spec';
COMMENT ON COLUMN public.k8s_namespace_binding.network_policy_profile IS 'Name of pre-defined network policy profile';
COMMENT ON COLUMN public.k8s_namespace_binding.pod_security_profile IS 'Pod Security Standards profile (restricted, baseline, privileged)';

-- ============================================================================
-- TABLE: compute_profile
-- Compute resource profiles for workloads
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.compute_profile (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    cpu_request DECIMAL(10, 3),
    cpu_limit DECIMAL(10, 3),
    mem_request_mb INTEGER,
    mem_limit_mb INTEGER,
    gpu_count INTEGER DEFAULT 0,
    gpu_type VARCHAR(50),
    ephemeral_storage_mb INTEGER,
    node_selector JSONB DEFAULT '{}'::jsonb,
    tolerations JSONB DEFAULT '[]'::jsonb,
    affinity JSONB DEFAULT '{}'::jsonb,
    priority_class VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, name),
    CONSTRAINT chk_cpu_resources CHECK (cpu_request IS NULL OR cpu_limit IS NULL OR cpu_request <= cpu_limit),
    CONSTRAINT chk_mem_resources CHECK (mem_request_mb IS NULL OR mem_limit_mb IS NULL OR mem_request_mb <= mem_limit_mb)
);

-- Enable RLS
ALTER TABLE public.compute_profile ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_compute_profile_tenant_id ON public.compute_profile(tenant_id);
CREATE INDEX IF NOT EXISTS idx_compute_profile_name ON public.compute_profile(name);
CREATE INDEX IF NOT EXISTS idx_compute_profile_gpu ON public.compute_profile(gpu_count) WHERE gpu_count > 0;

-- Comments
COMMENT ON TABLE public.compute_profile IS 'Compute resource profiles for ML workloads';
COMMENT ON COLUMN public.compute_profile.cpu_request IS 'CPU request in cores (e.g., 0.5, 1, 2)';
COMMENT ON COLUMN public.compute_profile.cpu_limit IS 'CPU limit in cores';
COMMENT ON COLUMN public.compute_profile.mem_request_mb IS 'Memory request in MB';
COMMENT ON COLUMN public.compute_profile.mem_limit_mb IS 'Memory limit in MB';
COMMENT ON COLUMN public.compute_profile.gpu_type IS 'GPU type (e.g., nvidia-tesla-v100, nvidia-a100)';
COMMENT ON COLUMN public.compute_profile.node_selector IS 'Kubernetes node selector labels';
COMMENT ON COLUMN public.compute_profile.tolerations IS 'Kubernetes tolerations array';
COMMENT ON COLUMN public.compute_profile.affinity IS 'Kubernetes affinity rules';
COMMENT ON COLUMN public.compute_profile.priority_class IS 'Kubernetes priority class name';

-- ============================================================================
-- TABLE: runtime_policy
-- Runtime security policies for workloads
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.runtime_policy (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    allowed_images JSONB DEFAULT '[]'::jsonb,
    allowed_registries JSONB DEFAULT '[]'::jsonb,
    egress_rules JSONB DEFAULT '[]'::jsonb,
    ingress_rules JSONB DEFAULT '[]'::jsonb,
    pod_security_profile VARCHAR(50) DEFAULT 'restricted',
    env_var_allowlist JSONB DEFAULT '[]'::jsonb,
    secret_mount_policy JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, name)
);

-- Enable RLS
ALTER TABLE public.runtime_policy ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_runtime_policy_tenant_id ON public.runtime_policy(tenant_id);
CREATE INDEX IF NOT EXISTS idx_runtime_policy_name ON public.runtime_policy(name);

-- Comments
COMMENT ON TABLE public.runtime_policy IS 'Runtime security policies for workload isolation';
COMMENT ON COLUMN public.runtime_policy.allowed_images IS 'Array of allowed container image patterns';
COMMENT ON COLUMN public.runtime_policy.allowed_registries IS 'Array of allowed container registries';
COMMENT ON COLUMN public.runtime_policy.egress_rules IS 'Network egress rules (destinations, ports)';
COMMENT ON COLUMN public.runtime_policy.ingress_rules IS 'Network ingress rules (sources, ports)';
COMMENT ON COLUMN public.runtime_policy.pod_security_profile IS 'Pod Security Standards: restricted, baseline, privileged';
COMMENT ON COLUMN public.runtime_policy.env_var_allowlist IS 'Allowed environment variable names';
COMMENT ON COLUMN public.runtime_policy.secret_mount_policy IS 'Rules for secret mounting (paths, secret names)';

-- ============================================================================
-- TRIGGERS: Auto-update updated_at
-- ============================================================================

-- K8s Cluster
DROP TRIGGER IF EXISTS set_k8s_cluster_updated_at ON public.k8s_cluster;
CREATE TRIGGER set_k8s_cluster_updated_at
    BEFORE UPDATE ON public.k8s_cluster
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- K8s Namespace Binding
DROP TRIGGER IF EXISTS set_k8s_namespace_binding_updated_at ON public.k8s_namespace_binding;
CREATE TRIGGER set_k8s_namespace_binding_updated_at
    BEFORE UPDATE ON public.k8s_namespace_binding
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- Compute Profile
DROP TRIGGER IF EXISTS set_compute_profile_updated_at ON public.compute_profile;
CREATE TRIGGER set_compute_profile_updated_at
    BEFORE UPDATE ON public.compute_profile
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- Runtime Policy
DROP TRIGGER IF EXISTS set_runtime_policy_updated_at ON public.runtime_policy;
CREATE TRIGGER set_runtime_policy_updated_at
    BEFORE UPDATE ON public.runtime_policy
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- SEED DATA: Default compute profiles
-- ============================================================================

-- Note: These will be inserted per tenant when the tenant is created.
-- This is just a reference for the expected profiles.

-- INSERT INTO public.compute_profile (tenant_id, name, cpu_request, cpu_limit, mem_request_mb, mem_limit_mb) VALUES
--     ('tenant-id', 'small', 0.5, 1, 512, 1024),
--     ('tenant-id', 'medium', 1, 2, 2048, 4096),
--     ('tenant-id', 'large', 2, 4, 4096, 8192),
--     ('tenant-id', 'xlarge', 4, 8, 8192, 16384),
--     ('tenant-id', 'gpu-small', 2, 4, 4096, 8192),  -- gpu_count: 1
--     ('tenant-id', 'gpu-large', 4, 8, 16384, 32768);  -- gpu_count: 2

-- ============================================================================
-- END OF MIGRATION: Infrastructure Tables
-- ============================================================================
