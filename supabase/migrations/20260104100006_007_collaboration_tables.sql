-- ============================================================================
-- MIGRATION: Collaboration Tables
-- Schema: MLOps Control Plane v3
-- Author: Armand AMOUSSOU
-- Date: 2026-01-04
-- ============================================================================

-- ============================================================================
-- ENUMS FOR COLLABORATION
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE public.notification_type AS ENUM ('mention', 'assignment', 'pipeline_failed', 'deploy_drift', 'approval', 'incident');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.notification_channel AS ENUM ('inapp', 'email', 'webhook');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected', 'canceled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.approval_decision_type AS ENUM ('approve', 'reject');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.audit_actor_type AS ENUM ('user', 'service');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.event_outbox_status AS ENUM ('pending', 'sent', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- TABLE: comment_thread
-- Comment threads on any entity
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.comment_thread (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    title VARCHAR(500),
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES public.user_account(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.user_account(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.comment_thread ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_comment_thread_tenant_id ON public.comment_thread(tenant_id);
CREATE INDEX IF NOT EXISTS idx_comment_thread_project_id ON public.comment_thread(project_id);
CREATE INDEX IF NOT EXISTS idx_comment_thread_entity ON public.comment_thread(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_comment_thread_resolved ON public.comment_thread(is_resolved);

-- Comments
COMMENT ON TABLE public.comment_thread IS 'Comment threads attached to any entity';
COMMENT ON COLUMN public.comment_thread.entity_type IS 'Entity type: project, run, model, deployment, work_item, pipeline, argocd_app, resource';

-- ============================================================================
-- TABLE: comment
-- Individual comments in threads
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.comment (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    thread_id UUID NOT NULL REFERENCES public.comment_thread(id) ON DELETE CASCADE,
    author_user_id UUID NOT NULL REFERENCES public.user_account(id) ON DELETE CASCADE,
    body TEXT,
    mentions JSONB DEFAULT '[]'::jsonb,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    edited BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.comment ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_comment_tenant_id ON public.comment(tenant_id);
CREATE INDEX IF NOT EXISTS idx_comment_thread_id ON public.comment(thread_id);
CREATE INDEX IF NOT EXISTS idx_comment_author ON public.comment(author_user_id);
CREATE INDEX IF NOT EXISTS idx_comment_created_at ON public.comment(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comment_mentions ON public.comment USING gin(mentions);

-- Comments
COMMENT ON TABLE public.comment IS 'Individual comments in comment threads';
COMMENT ON COLUMN public.comment.mentions IS 'Array of mentioned user IDs';
COMMENT ON COLUMN public.comment.attachments IS 'Array of attachment references';

-- ============================================================================
-- TABLE: notification
-- User notifications
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notification (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_account(id) ON DELETE CASCADE,
    type public.notification_type NOT NULL,
    title VARCHAR(500),
    message TEXT,
    entity_type VARCHAR(100),
    entity_id UUID,
    channel public.notification_channel DEFAULT 'inapp',
    read_at TIMESTAMP WITH TIME ZONE,
    action_url VARCHAR(1000),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notification_tenant_id ON public.notification(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notification_user_id ON public.notification(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_type ON public.notification(type);
CREATE INDEX IF NOT EXISTS idx_notification_read ON public.notification(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notification_created_at ON public.notification(created_at DESC);

-- Comments
COMMENT ON TABLE public.notification IS 'User notifications for various events';
COMMENT ON COLUMN public.notification.type IS 'Notification type: mention, assignment, pipeline_failed, deploy_drift, approval, incident';
COMMENT ON COLUMN public.notification.channel IS 'Delivery channel: inapp, email, webhook';

-- ============================================================================
-- TABLE: activity_event
-- Activity feed events
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.activity_event (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.project(id) ON DELETE CASCADE,
    actor_user_id UUID REFERENCES public.user_account(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    entity_name VARCHAR(500),
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_event ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_activity_event_tenant_id ON public.activity_event(tenant_id);
CREATE INDEX IF NOT EXISTS idx_activity_event_project_id ON public.activity_event(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_event_actor ON public.activity_event(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_activity_event_action ON public.activity_event(action);
CREATE INDEX IF NOT EXISTS idx_activity_event_entity ON public.activity_event(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_event_created_at ON public.activity_event(created_at DESC);

-- Comments
COMMENT ON TABLE public.activity_event IS 'Activity feed events for project timelines';
COMMENT ON COLUMN public.activity_event.action IS 'Action type: created, updated, deleted, started, completed, failed, etc.';
COMMENT ON COLUMN public.activity_event.payload IS 'Additional event context data';

-- ============================================================================
-- TABLE: attachment
-- File attachments for various entities
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.attachment (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
    entity_type VARCHAR(100),
    entity_id UUID,
    artifact_id UUID REFERENCES public.artifact(id) ON DELETE SET NULL,
    filename VARCHAR(500),
    mime_type VARCHAR(100),
    size_bytes BIGINT,
    storage_uri VARCHAR(1000),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.user_account(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.attachment ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_attachment_tenant_id ON public.attachment(tenant_id);
CREATE INDEX IF NOT EXISTS idx_attachment_project_id ON public.attachment(project_id);
CREATE INDEX IF NOT EXISTS idx_attachment_entity ON public.attachment(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_attachment_artifact ON public.attachment(artifact_id);

-- Comments
COMMENT ON TABLE public.attachment IS 'File attachments for comments, work items, etc.';
COMMENT ON COLUMN public.attachment.artifact_id IS 'Reference to artifact if stored in artifact system';
COMMENT ON COLUMN public.attachment.storage_uri IS 'Direct storage URI if not using artifact system';

-- ============================================================================
-- TABLE: approval_request
-- Approval requests for model versions, deployments, releases
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.approval_request (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    requested_by UUID REFERENCES public.user_account(id) ON DELETE SET NULL,
    status public.approval_status NOT NULL DEFAULT 'pending',
    required_approvers JSONB DEFAULT '[]'::jsonb,
    rationale TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(entity_type, entity_id)
);

-- Enable RLS
ALTER TABLE public.approval_request ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_approval_request_tenant_id ON public.approval_request(tenant_id);
CREATE INDEX IF NOT EXISTS idx_approval_request_project_id ON public.approval_request(project_id);
CREATE INDEX IF NOT EXISTS idx_approval_request_entity ON public.approval_request(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_approval_request_status ON public.approval_request(status);
CREATE INDEX IF NOT EXISTS idx_approval_request_requested_by ON public.approval_request(requested_by);
CREATE INDEX IF NOT EXISTS idx_approval_request_pending ON public.approval_request(status) WHERE status = 'pending';

-- Comments
COMMENT ON TABLE public.approval_request IS 'Approval requests for model versions, deployments, releases, policies';
COMMENT ON COLUMN public.approval_request.entity_type IS 'Entity type: model_version, deployment, release, pipeline, policy, catalog_item';
COMMENT ON COLUMN public.approval_request.required_approvers IS 'Array of required approver user IDs or role IDs';

-- ============================================================================
-- TABLE: approval_decision
-- Individual approval decisions
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.approval_decision (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    approval_request_id UUID NOT NULL REFERENCES public.approval_request(id) ON DELETE CASCADE,
    approver_user_id UUID NOT NULL REFERENCES public.user_account(id) ON DELETE CASCADE,
    decision public.approval_decision_type NOT NULL,
    comment TEXT,
    decided_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(approval_request_id, approver_user_id)
);

-- Enable RLS
ALTER TABLE public.approval_decision ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_approval_decision_tenant_id ON public.approval_decision(tenant_id);
CREATE INDEX IF NOT EXISTS idx_approval_decision_request ON public.approval_decision(approval_request_id);
CREATE INDEX IF NOT EXISTS idx_approval_decision_approver ON public.approval_decision(approver_user_id);
CREATE INDEX IF NOT EXISTS idx_approval_decision_type ON public.approval_decision(decision);

-- Comments
COMMENT ON TABLE public.approval_decision IS 'Individual approval decisions by approvers';
COMMENT ON COLUMN public.approval_decision.decision IS 'Decision: approve or reject';

-- ============================================================================
-- TABLE: audit_event
-- Audit trail for security and compliance
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_event (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    actor_type public.audit_actor_type NOT NULL,
    actor_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    resource_name VARCHAR(500),
    ip VARCHAR(45),
    user_agent TEXT,
    payload JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(20) DEFAULT 'success',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_event ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_event_tenant_id ON public.audit_event(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_event_actor ON public.audit_event(actor_type, actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_event_action ON public.audit_event(action);
CREATE INDEX IF NOT EXISTS idx_audit_event_resource ON public.audit_event(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_event_created_at ON public.audit_event(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_event_ip ON public.audit_event(ip);

-- Partitioning consideration: In production, this table should be partitioned by created_at
-- for better query performance and retention management

-- Comments
COMMENT ON TABLE public.audit_event IS 'Audit trail for security, compliance, and debugging';
COMMENT ON COLUMN public.audit_event.actor_type IS 'Actor type: user or service';
COMMENT ON COLUMN public.audit_event.action IS 'Action: login, logout, create, update, delete, view, export, etc.';
COMMENT ON COLUMN public.audit_event.payload IS 'Additional context (old/new values for updates)';

-- ============================================================================
-- TABLE: event_outbox
-- Transactional outbox for event publishing
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.event_outbox (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    aggregate_type VARCHAR(100),
    aggregate_id UUID,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status public.event_outbox_status NOT NULL DEFAULT 'pending',
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    last_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    sent_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.event_outbox ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_event_outbox_tenant_id ON public.event_outbox(tenant_id);
CREATE INDEX IF NOT EXISTS idx_event_outbox_status ON public.event_outbox(status);
CREATE INDEX IF NOT EXISTS idx_event_outbox_pending ON public.event_outbox(status, next_retry_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_event_outbox_aggregate ON public.event_outbox(aggregate_type, aggregate_id);
CREATE INDEX IF NOT EXISTS idx_event_outbox_created_at ON public.event_outbox(created_at DESC);

-- Comments
COMMENT ON TABLE public.event_outbox IS 'Transactional outbox pattern for reliable event publishing';
COMMENT ON COLUMN public.event_outbox.event_type IS 'Event type (e.g., model.version.created, deployment.failed)';
COMMENT ON COLUMN public.event_outbox.aggregate_type IS 'Aggregate type (e.g., model, deployment, run)';
COMMENT ON COLUMN public.event_outbox.attempts IS 'Number of delivery attempts';
COMMENT ON COLUMN public.event_outbox.next_retry_at IS 'Next scheduled retry time';

-- ============================================================================
-- TRIGGERS: Auto-update updated_at
-- ============================================================================

-- Comment
DROP TRIGGER IF EXISTS set_comment_updated_at ON public.comment;
CREATE TRIGGER set_comment_updated_at
    BEFORE UPDATE ON public.comment
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- Approval Request
DROP TRIGGER IF EXISTS set_approval_request_updated_at ON public.approval_request;
CREATE TRIGGER set_approval_request_updated_at
    BEFORE UPDATE ON public.approval_request
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- FUNCTION: Update approval request status based on decisions
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_approval_request_status()
RETURNS TRIGGER AS $$
DECLARE
    required_count INTEGER;
    approve_count INTEGER;
    reject_count INTEGER;
BEGIN
    -- Get the number of required approvers
    SELECT jsonb_array_length(required_approvers) INTO required_count
    FROM public.approval_request
    WHERE id = NEW.approval_request_id;

    -- Count approvals and rejections
    SELECT
        COUNT(*) FILTER (WHERE decision = 'approve') AS approve_count,
        COUNT(*) FILTER (WHERE decision = 'reject') AS reject_count
    INTO approve_count, reject_count
    FROM public.approval_decision
    WHERE approval_request_id = NEW.approval_request_id;

    -- Update approval request status
    IF reject_count > 0 THEN
        UPDATE public.approval_request
        SET status = 'rejected', updated_at = now()
        WHERE id = NEW.approval_request_id;
    ELSIF required_count IS NULL OR required_count = 0 OR approve_count >= required_count THEN
        UPDATE public.approval_request
        SET status = 'approved', updated_at = now()
        WHERE id = NEW.approval_request_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating approval request status
DROP TRIGGER IF EXISTS trigger_update_approval_status ON public.approval_decision;
CREATE TRIGGER trigger_update_approval_status
    AFTER INSERT ON public.approval_decision
    FOR EACH ROW
    EXECUTE FUNCTION public.update_approval_request_status();

-- ============================================================================
-- END OF MIGRATION: Collaboration Tables
-- ============================================================================
