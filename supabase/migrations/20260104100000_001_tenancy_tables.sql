-- ============================================================================
-- MIGRATION: Core Tenancy Tables
-- Schema: MLOps Control Plane v3
-- Author: Armand AMOUSSOU
-- Date: 2026-01-04
-- ============================================================================

-- ============================================================================
-- ENUMS FOR TENANCY
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE public.tenant_status AS ENUM ('active', 'suspended', 'deleted');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.tenant_tier AS ENUM ('free', 'pro', 'enterprise');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.project_visibility AS ENUM ('private', 'internal', 'public');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.project_lifecycle AS ENUM ('initiating', 'active', 'paused', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.criticality AS ENUM ('low', 'medium', 'high');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.progress_status AS ENUM ('green', 'amber', 'red');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.milestone_status AS ENUM ('planned', 'in_progress', 'done', 'canceled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.work_item_type AS ENUM ('task', 'bug', 'story', 'epic', 'change_request');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.work_item_status AS ENUM ('open', 'in_progress', 'blocked', 'done', 'canceled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.priority AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.severity AS ENUM ('minor', 'major', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- TABLE: tenant
-- Root multi-tenant entity
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tenant (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    status public.tenant_status NOT NULL DEFAULT 'active',
    tier public.tenant_tier NOT NULL DEFAULT 'free',
    timezone VARCHAR(50) DEFAULT 'UTC',
    locale VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tenant ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tenant_slug ON public.tenant(slug);
CREATE INDEX IF NOT EXISTS idx_tenant_status ON public.tenant(status);

-- Comments
COMMENT ON TABLE public.tenant IS 'Root multi-tenant entity for organization isolation';
COMMENT ON COLUMN public.tenant.slug IS 'URL-friendly unique identifier';
COMMENT ON COLUMN public.tenant.tier IS 'Subscription tier: free, pro, enterprise';

-- ============================================================================
-- TABLE: org
-- Organization within a tenant
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.org (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.org ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_org_tenant_id ON public.org(tenant_id);
CREATE INDEX IF NOT EXISTS idx_org_name ON public.org(name);

-- Comments
COMMENT ON TABLE public.org IS 'Organization unit within a tenant';

-- ============================================================================
-- TABLE: project
-- MLOps project container
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.project (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    org_id UUID REFERENCES public.org(id) ON DELETE SET NULL,
    key VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    visibility public.project_visibility NOT NULL DEFAULT 'private',
    lifecycle_status public.project_lifecycle NOT NULL DEFAULT 'initiating',
    criticality public.criticality DEFAULT 'medium',
    default_k8s_namespace VARCHAR(63),
    tags JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID,
    updated_by UUID,
    archived_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(tenant_id, key)
);

-- Enable RLS
ALTER TABLE public.project ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_project_tenant_id ON public.project(tenant_id);
CREATE INDEX IF NOT EXISTS idx_project_org_id ON public.project(org_id);
CREATE INDEX IF NOT EXISTS idx_project_key ON public.project(tenant_id, key);
CREATE INDEX IF NOT EXISTS idx_project_visibility ON public.project(visibility);
CREATE INDEX IF NOT EXISTS idx_project_lifecycle ON public.project(lifecycle_status);
CREATE INDEX IF NOT EXISTS idx_project_tags ON public.project USING gin(tags);

-- Comments
COMMENT ON TABLE public.project IS 'MLOps project container for experiments, models, and deployments';
COMMENT ON COLUMN public.project.key IS 'URL-friendly project identifier, unique per tenant';
COMMENT ON COLUMN public.project.default_k8s_namespace IS 'Default Kubernetes namespace for workloads';

-- ============================================================================
-- TABLE: project_progress_snapshot
-- Project progress tracking over time
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.project_progress_snapshot (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
    date_key DATE NOT NULL,
    progress_percent INTEGER CHECK (progress_percent >= 0 AND progress_percent <= 100),
    status public.progress_status NOT NULL DEFAULT 'green',
    summary TEXT,
    risks TEXT,
    blockers TEXT,
    next_steps TEXT,
    kpis JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID,
    UNIQUE(project_id, date_key)
);

-- Enable RLS
ALTER TABLE public.project_progress_snapshot ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_progress_snapshot_tenant ON public.project_progress_snapshot(tenant_id);
CREATE INDEX IF NOT EXISTS idx_progress_snapshot_project ON public.project_progress_snapshot(project_id);
CREATE INDEX IF NOT EXISTS idx_progress_snapshot_date ON public.project_progress_snapshot(date_key DESC);

-- Comments
COMMENT ON TABLE public.project_progress_snapshot IS 'Daily/weekly progress snapshots for project tracking';

-- ============================================================================
-- TABLE: milestone
-- Project milestones
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.milestone (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    status public.milestone_status NOT NULL DEFAULT 'planned',
    weight INTEGER DEFAULT 1,
    progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID,
    updated_by UUID
);

-- Enable RLS
ALTER TABLE public.milestone ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_milestone_tenant ON public.milestone(tenant_id);
CREATE INDEX IF NOT EXISTS idx_milestone_project ON public.milestone(project_id);
CREATE INDEX IF NOT EXISTS idx_milestone_due_date ON public.milestone(due_date);
CREATE INDEX IF NOT EXISTS idx_milestone_status ON public.milestone(status);

-- Comments
COMMENT ON TABLE public.milestone IS 'Project milestones for tracking major deliverables';

-- ============================================================================
-- TABLE: kanban_board
-- Kanban boards for project work management
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.kanban_board (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.kanban_board ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_kanban_board_tenant ON public.kanban_board(tenant_id);
CREATE INDEX IF NOT EXISTS idx_kanban_board_project ON public.kanban_board(project_id);

-- Comments
COMMENT ON TABLE public.kanban_board IS 'Kanban boards for visual work management';

-- ============================================================================
-- TABLE: kanban_column
-- Columns within kanban boards
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.kanban_column (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    board_id UUID NOT NULL REFERENCES public.kanban_board(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    wip_limit INTEGER,
    UNIQUE(board_id, position)
);

-- Enable RLS
ALTER TABLE public.kanban_column ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_kanban_column_tenant ON public.kanban_column(tenant_id);
CREATE INDEX IF NOT EXISTS idx_kanban_column_board ON public.kanban_column(board_id);

-- Comments
COMMENT ON TABLE public.kanban_column IS 'Kanban board columns with WIP limits';
COMMENT ON COLUMN public.kanban_column.wip_limit IS 'Work-in-progress limit for the column';

-- ============================================================================
-- TABLE: work_item
-- Work items (tasks, bugs, stories, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.work_item (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
    board_id UUID REFERENCES public.kanban_board(id) ON DELETE SET NULL,
    column_id UUID REFERENCES public.kanban_column(id) ON DELETE SET NULL,
    type public.work_item_type NOT NULL DEFAULT 'task',
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status public.work_item_status NOT NULL DEFAULT 'open',
    priority public.priority DEFAULT 'medium',
    severity public.severity,
    labels JSONB DEFAULT '[]'::jsonb,
    assignee_user_id UUID,
    reporter_user_id UUID,
    due_date DATE,
    estimate_points INTEGER,
    progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
    external_refs JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID,
    updated_by UUID,
    closed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.work_item ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_work_item_tenant ON public.work_item(tenant_id);
CREATE INDEX IF NOT EXISTS idx_work_item_project ON public.work_item(project_id);
CREATE INDEX IF NOT EXISTS idx_work_item_board ON public.work_item(board_id);
CREATE INDEX IF NOT EXISTS idx_work_item_column ON public.work_item(column_id);
CREATE INDEX IF NOT EXISTS idx_work_item_type ON public.work_item(type);
CREATE INDEX IF NOT EXISTS idx_work_item_status ON public.work_item(status);
CREATE INDEX IF NOT EXISTS idx_work_item_assignee ON public.work_item(assignee_user_id);
CREATE INDEX IF NOT EXISTS idx_work_item_labels ON public.work_item USING gin(labels);
CREATE INDEX IF NOT EXISTS idx_work_item_due_date ON public.work_item(due_date);

-- Comments
COMMENT ON TABLE public.work_item IS 'Work items: tasks, bugs, stories, epics, change requests';
COMMENT ON COLUMN public.work_item.external_refs IS 'Links to external systems (GitLab issues, Jira, etc.)';

-- ============================================================================
-- TRIGGERS: Auto-update updated_at
-- ============================================================================

-- Tenant
DROP TRIGGER IF EXISTS set_tenant_updated_at ON public.tenant;
CREATE TRIGGER set_tenant_updated_at
    BEFORE UPDATE ON public.tenant
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- Org
DROP TRIGGER IF EXISTS set_org_updated_at ON public.org;
CREATE TRIGGER set_org_updated_at
    BEFORE UPDATE ON public.org
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- Project
DROP TRIGGER IF EXISTS set_project_updated_at ON public.project;
CREATE TRIGGER set_project_updated_at
    BEFORE UPDATE ON public.project
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- Milestone
DROP TRIGGER IF EXISTS set_milestone_updated_at ON public.milestone;
CREATE TRIGGER set_milestone_updated_at
    BEFORE UPDATE ON public.milestone
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- Kanban Board
DROP TRIGGER IF EXISTS set_kanban_board_updated_at ON public.kanban_board;
CREATE TRIGGER set_kanban_board_updated_at
    BEFORE UPDATE ON public.kanban_board
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- Work Item
DROP TRIGGER IF EXISTS set_work_item_updated_at ON public.work_item;
CREATE TRIGGER set_work_item_updated_at
    BEFORE UPDATE ON public.work_item
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- END OF MIGRATION: Core Tenancy Tables
-- ============================================================================
