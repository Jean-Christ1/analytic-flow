-- ============================================================================
-- Migration: Schema Fixes and Improvements
-- MLOps Control Plane v3
-- Author: Armand AMOUSSOU
-- Date: 2026-01-07
-- ============================================================================
-- Description:
-- This migration addresses critical schema issues identified during audit:
-- 1. Fixes duplicate notification table conflict (007 vs 012)
-- 2. Adds missing FK constraints on work_item (assignee_user_id, reporter_user_id)
-- 3. Adds tenant_id to workspace_session_log for multi-tenant consistency
-- 4. Fixes notify_model_deployment trigger (environment -> namespace)
-- 5. Fixes broadcast_notification_to_tenant function (profiles -> user_account)
-- 6. Standardizes trigger function naming
-- ============================================================================

-- ============================================================================
-- SECTION 1: STANDARDIZE TRIGGER FUNCTIONS
-- ============================================================================
-- Migration 012 created update_updated_at_column() but other migrations use
-- update_updated_at(). We standardize by creating an alias and updating triggers.

-- Create alias function that calls the canonical update_updated_at()
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.update_updated_at_column() IS 'Alias function for update_updated_at(). Maintains compatibility with migration 012 triggers.';

-- ============================================================================
-- SECTION 2: FIX WORK_ITEM FK CONSTRAINTS
-- ============================================================================
-- work_item.assignee_user_id and reporter_user_id are missing FK constraints

DO $$
BEGIN
    -- Add FK constraint for assignee_user_id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'work_item_assignee_user_id_fkey'
        AND table_name = 'work_item'
        AND table_schema = 'public'
    ) THEN
        -- Clean orphan data first
        UPDATE public.work_item SET assignee_user_id = NULL
        WHERE assignee_user_id IS NOT NULL
        AND assignee_user_id NOT IN (SELECT id FROM public.user_account);

        ALTER TABLE public.work_item
        ADD CONSTRAINT work_item_assignee_user_id_fkey
        FOREIGN KEY (assignee_user_id)
        REFERENCES public.user_account(id)
        ON DELETE SET NULL;
        RAISE NOTICE 'Added FK constraint work_item_assignee_user_id_fkey';
    ELSE
        RAISE NOTICE 'FK constraint work_item_assignee_user_id_fkey already exists';
    END IF;
END $$;

DO $$
BEGIN
    -- Add FK constraint for reporter_user_id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'work_item_reporter_user_id_fkey'
        AND table_name = 'work_item'
        AND table_schema = 'public'
    ) THEN
        -- Clean orphan data first
        UPDATE public.work_item SET reporter_user_id = NULL
        WHERE reporter_user_id IS NOT NULL
        AND reporter_user_id NOT IN (SELECT id FROM public.user_account);

        ALTER TABLE public.work_item
        ADD CONSTRAINT work_item_reporter_user_id_fkey
        FOREIGN KEY (reporter_user_id)
        REFERENCES public.user_account(id)
        ON DELETE SET NULL;
        RAISE NOTICE 'Added FK constraint work_item_reporter_user_id_fkey';
    ELSE
        RAISE NOTICE 'FK constraint work_item_reporter_user_id_fkey already exists';
    END IF;
END $$;

-- Add indexes for the FK columns if not exist
CREATE INDEX IF NOT EXISTS idx_work_item_reporter ON public.work_item(reporter_user_id);

-- ============================================================================
-- SECTION 3: ADD TENANT_ID TO WORKSPACE_SESSION_LOG
-- ============================================================================
-- workspace_session_log is missing tenant_id column required for multi-tenant RLS

DO $$
DECLARE
    col_exists BOOLEAN;
    fk_exists BOOLEAN;
BEGIN
    -- Check if tenant_id column already exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'workspace_session_log'
        AND column_name = 'tenant_id'
    ) INTO col_exists;

    IF NOT col_exists THEN
        -- Add tenant_id column
        ALTER TABLE public.workspace_session_log
        ADD COLUMN tenant_id UUID;
        RAISE NOTICE 'Added tenant_id column to workspace_session_log';
    ELSE
        RAISE NOTICE 'tenant_id column already exists in workspace_session_log';
    END IF;

    -- Clean orphan records (workspace_id not in workspace table)
    DELETE FROM public.workspace_session_log
    WHERE workspace_id NOT IN (SELECT id FROM public.workspace);

    -- Backfill tenant_id from workspace table
    UPDATE public.workspace_session_log wsl
    SET tenant_id = w.tenant_id
    FROM public.workspace w
    WHERE wsl.workspace_id = w.id
    AND wsl.tenant_id IS NULL;

    -- Check if we can add NOT NULL constraint
    IF EXISTS (SELECT 1 FROM public.workspace_session_log WHERE tenant_id IS NULL) THEN
        -- Delete remaining orphans
        DELETE FROM public.workspace_session_log WHERE tenant_id IS NULL;
    END IF;

    -- Add NOT NULL constraint if not already set
    BEGIN
        ALTER TABLE public.workspace_session_log
        ALTER COLUMN tenant_id SET NOT NULL;
    EXCEPTION
        WHEN others THEN
            -- Constraint might already be set
            NULL;
    END;

    -- Check if FK constraint exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'workspace_session_log_tenant_id_fkey'
        AND table_name = 'workspace_session_log'
        AND table_schema = 'public'
    ) INTO fk_exists;

    IF NOT fk_exists THEN
        ALTER TABLE public.workspace_session_log
        ADD CONSTRAINT workspace_session_log_tenant_id_fkey
        FOREIGN KEY (tenant_id)
        REFERENCES public.tenant(id)
        ON DELETE CASCADE;
        RAISE NOTICE 'Added FK constraint workspace_session_log_tenant_id_fkey';
    ELSE
        RAISE NOTICE 'FK constraint workspace_session_log_tenant_id_fkey already exists';
    END IF;
END $$;

-- Add index for tenant_id
CREATE INDEX IF NOT EXISTS idx_workspace_session_log_tenant_id
ON public.workspace_session_log(tenant_id);

-- ============================================================================
-- SECTION 4: FIX NOTIFY_MODEL_DEPLOYMENT TRIGGER FUNCTION
-- ============================================================================
-- The function references NEW.environment but model_deployment has namespace column

CREATE OR REPLACE FUNCTION public.notify_model_deployment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IN ('healthy', 'failed') AND OLD.status NOT IN ('healthy', 'failed') THEN
        PERFORM public.send_notification(
            NEW.created_by,
            NEW.tenant_id,
            CASE WHEN NEW.status = 'healthy' THEN 'model_deployed' ELSE 'model_failed' END,
            CASE WHEN NEW.status = 'healthy'
                THEN 'Model Deployed: ' || NEW.name
                ELSE 'Deployment Failed: ' || NEW.name
            END,
            CASE WHEN NEW.status = 'healthy'
                THEN 'Your model has been successfully deployed to namespace ' || COALESCE(NEW.namespace, 'default') || '.'
                ELSE 'Model deployment has failed. Check the logs for details.'
            END,
            '/deployments/' || NEW.id,
            jsonb_build_object('deployment_id', NEW.id, 'model_version_id', NEW.model_version_id),
            CASE WHEN NEW.status = 'failed' THEN 'high' ELSE 'normal' END
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.notify_model_deployment() IS 'Trigger function to send notification when model deployment status changes to healthy or failed. Uses namespace column (not environment).';

-- ============================================================================
-- SECTION 5: FIX BROADCAST_NOTIFICATION_TO_TENANT FUNCTION
-- ============================================================================
-- The function references profiles.tenant_id but profiles table does not have
-- tenant_id. It should query user_account which has tenant_id.

CREATE OR REPLACE FUNCTION public.broadcast_notification_to_tenant(
    p_tenant_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_link TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::JSONB,
    p_priority TEXT DEFAULT 'normal'
)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
    v_user RECORD;
BEGIN
    -- Query user_account table which has tenant_id column
    FOR v_user IN
        SELECT id AS user_id
        FROM public.user_account
        WHERE tenant_id = p_tenant_id
    LOOP
        INSERT INTO public.notification (user_id, tenant_id, type, title, message, action_url, channel)
        VALUES (
            v_user.user_id,
            p_tenant_id,
            p_type::public.notification_type,
            p_title,
            p_message,
            p_link,
            'inapp'::public.notification_channel
        );
        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
EXCEPTION
    WHEN invalid_text_representation THEN
        -- If notification_type enum doesn't have the provided type, use a default approach
        RAISE NOTICE 'Invalid notification type: %. Skipping broadcast.', p_type;
        RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.broadcast_notification_to_tenant(UUID, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT) IS 'Broadcasts a notification to all users in a tenant. Uses user_account table for tenant membership lookup.';

-- ============================================================================
-- SECTION 6: FIX NOTIFICATION TABLE REFERENCE ISSUES
-- ============================================================================
-- The send_notification function may have issues with the notification table
-- structure differences between migration 007 and 012.

CREATE OR REPLACE FUNCTION public.send_notification(
    p_user_id UUID,
    p_tenant_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_link TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::JSONB,
    p_priority TEXT DEFAULT 'normal'
)
RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    -- Insert into notification table using migration 007 structure
    -- (type as notification_type enum, action_url instead of link)
    INSERT INTO public.notification (
        user_id,
        tenant_id,
        type,
        title,
        message,
        action_url,
        channel
    )
    VALUES (
        p_user_id,
        p_tenant_id,
        p_type::public.notification_type,
        p_title,
        p_message,
        p_link,
        'inapp'::public.notification_channel
    )
    RETURNING id INTO v_notification_id;

    RETURN v_notification_id;
EXCEPTION
    WHEN invalid_text_representation THEN
        -- If the type doesn't match the enum, fall back to 'mention' as default
        INSERT INTO public.notification (
            user_id,
            tenant_id,
            type,
            title,
            message,
            action_url,
            channel
        )
        VALUES (
            p_user_id,
            p_tenant_id,
            'mention'::public.notification_type,
            p_title,
            p_message,
            p_link,
            'inapp'::public.notification_channel
        )
        RETURNING id INTO v_notification_id;

        RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.send_notification(UUID, UUID, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT) IS 'Sends a notification to a specific user. Compatible with migration 007 notification table structure.';

-- ============================================================================
-- SECTION 7: UPDATE RLS POLICIES FOR WORKSPACE_SESSION_LOG
-- ============================================================================
-- Add tenant-based RLS policies now that tenant_id column exists

-- Drop existing policies that may conflict
DROP POLICY IF EXISTS "Users can view workspace session logs for their workspaces" ON public.workspace_session_log;
DROP POLICY IF EXISTS "Users can insert workspace session logs" ON public.workspace_session_log;
DROP POLICY IF EXISTS "Users can update their own session logs" ON public.workspace_session_log;

-- Create new tenant-aware policies
CREATE POLICY "workspace_session_log_select_tenant"
    ON public.workspace_session_log FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.user_account WHERE id = auth.uid()
        )
    );

CREATE POLICY "workspace_session_log_insert_tenant"
    ON public.workspace_session_log FOR INSERT
    WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM public.user_account WHERE id = auth.uid()
        )
    );

CREATE POLICY "workspace_session_log_update_own"
    ON public.workspace_session_log FOR UPDATE
    USING (
        user_id = auth.uid() OR
        tenant_id IN (
            SELECT tenant_id FROM public.user_account WHERE id = auth.uid()
        )
    );

CREATE POLICY "workspace_session_log_delete_own"
    ON public.workspace_session_log FOR DELETE
    USING (
        user_id = auth.uid() OR
        tenant_id IN (
            SELECT tenant_id FROM public.user_account WHERE id = auth.uid()
        )
    );

-- ============================================================================
-- SECTION 8: ADD COMPREHENSIVE COMMENTS FOR CORE TABLES
-- ============================================================================

-- Tenant table
COMMENT ON TABLE public.tenant IS 'Root multi-tenant entity for organization isolation. All data in the platform is scoped to a tenant.';
COMMENT ON COLUMN public.tenant.id IS 'Unique identifier (UUID v4) for the tenant.';
COMMENT ON COLUMN public.tenant.slug IS 'URL-friendly unique identifier used in URLs and API paths.';
COMMENT ON COLUMN public.tenant.name IS 'Human-readable display name for the tenant/organization.';
COMMENT ON COLUMN public.tenant.status IS 'Tenant lifecycle status: active (operational), suspended (temporarily disabled), deleted (marked for removal).';
COMMENT ON COLUMN public.tenant.tier IS 'Subscription tier determining feature access and limits: free, pro, enterprise.';
COMMENT ON COLUMN public.tenant.timezone IS 'Default timezone for tenant (IANA format, e.g., America/New_York).';
COMMENT ON COLUMN public.tenant.locale IS 'Default locale for formatting dates, numbers, and translations (e.g., en-US, fr-FR).';
COMMENT ON COLUMN public.tenant.created_at IS 'Timestamp when the tenant was created.';
COMMENT ON COLUMN public.tenant.updated_at IS 'Timestamp when the tenant was last modified.';

-- Project table
COMMENT ON TABLE public.project IS 'MLOps project container for experiments, models, deployments, and workloads. Central organizing entity for ML work.';
COMMENT ON COLUMN public.project.id IS 'Unique identifier (UUID v4) for the project.';
COMMENT ON COLUMN public.project.tenant_id IS 'Reference to parent tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.project.org_id IS 'Optional reference to organization unit within tenant.';
COMMENT ON COLUMN public.project.key IS 'URL-friendly project identifier, unique per tenant. Used in URLs and API paths.';
COMMENT ON COLUMN public.project.name IS 'Human-readable display name for the project.';
COMMENT ON COLUMN public.project.description IS 'Detailed description of project purpose and scope.';
COMMENT ON COLUMN public.project.visibility IS 'Access visibility: private (tenant only), internal (authenticated users), public (anyone).';
COMMENT ON COLUMN public.project.lifecycle_status IS 'Project lifecycle: initiating, active, paused, archived.';
COMMENT ON COLUMN public.project.criticality IS 'Business criticality level: low, medium, high. Affects SLA and alerting priority.';
COMMENT ON COLUMN public.project.default_k8s_namespace IS 'Default Kubernetes namespace for project workloads.';
COMMENT ON COLUMN public.project.tags IS 'Array of tags for categorization and search.';
COMMENT ON COLUMN public.project.metadata IS 'Flexible key-value metadata for custom attributes.';
COMMENT ON COLUMN public.project.archived_at IS 'Timestamp when project was archived (null if active).';

-- User Account table
COMMENT ON TABLE public.user_account IS 'User accounts within the MLOps platform. Links external identity provider to tenant membership.';
COMMENT ON COLUMN public.user_account.id IS 'Unique identifier (UUID v4) for the user account.';
COMMENT ON COLUMN public.user_account.tenant_id IS 'Reference to tenant for multi-tenant isolation. User belongs to exactly one tenant.';
COMMENT ON COLUMN public.user_account.external_subject IS 'External identity provider subject ID (OIDC sub claim or SAML NameID).';
COMMENT ON COLUMN public.user_account.email IS 'User email address, unique within the tenant.';
COMMENT ON COLUMN public.user_account.display_name IS 'User display name shown in UI.';
COMMENT ON COLUMN public.user_account.status IS 'Account status: active (can log in), disabled (blocked from access).';
COMMENT ON COLUMN public.user_account.last_login_at IS 'Timestamp of last successful login.';
COMMENT ON COLUMN public.user_account.mfa_enabled IS 'Whether multi-factor authentication is enabled for this user.';
COMMENT ON COLUMN public.user_account.created_at IS 'Timestamp when the user account was created.';
COMMENT ON COLUMN public.user_account.updated_at IS 'Timestamp when the user account was last modified.';

-- Work Item table
COMMENT ON TABLE public.work_item IS 'Work items for project management: tasks, bugs, stories, epics, change requests. Supports Kanban workflow.';
COMMENT ON COLUMN public.work_item.id IS 'Unique identifier (UUID v4) for the work item.';
COMMENT ON COLUMN public.work_item.tenant_id IS 'Reference to tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.work_item.project_id IS 'Reference to parent project.';
COMMENT ON COLUMN public.work_item.board_id IS 'Optional reference to Kanban board.';
COMMENT ON COLUMN public.work_item.column_id IS 'Optional reference to Kanban column for workflow state.';
COMMENT ON COLUMN public.work_item.type IS 'Work item type: task, bug, story, epic, change_request.';
COMMENT ON COLUMN public.work_item.title IS 'Brief title/summary of the work item.';
COMMENT ON COLUMN public.work_item.description IS 'Detailed description in markdown format.';
COMMENT ON COLUMN public.work_item.status IS 'Workflow status: open, in_progress, blocked, done, canceled.';
COMMENT ON COLUMN public.work_item.priority IS 'Priority level: low, medium, high, critical.';
COMMENT ON COLUMN public.work_item.severity IS 'Severity for bugs: minor, major, critical.';
COMMENT ON COLUMN public.work_item.labels IS 'Array of label strings for categorization.';
COMMENT ON COLUMN public.work_item.assignee_user_id IS 'Reference to user assigned to work on this item.';
COMMENT ON COLUMN public.work_item.reporter_user_id IS 'Reference to user who reported/created this item.';
COMMENT ON COLUMN public.work_item.due_date IS 'Target completion date.';
COMMENT ON COLUMN public.work_item.estimate_points IS 'Story points or effort estimate.';
COMMENT ON COLUMN public.work_item.progress_percent IS 'Completion percentage (0-100).';
COMMENT ON COLUMN public.work_item.external_refs IS 'JSON references to external systems (GitLab, Jira, etc.).';
COMMENT ON COLUMN public.work_item.closed_at IS 'Timestamp when item was closed (done/canceled).';

-- Workspace table
COMMENT ON TABLE public.workspace IS 'ML Workspaces for interactive development: Jupyter, VSCode, RStudio, Terminal.';
COMMENT ON COLUMN public.workspace.id IS 'Unique identifier (UUID v4) for the workspace.';
COMMENT ON COLUMN public.workspace.tenant_id IS 'Reference to tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.workspace.project_id IS 'Reference to parent project.';
COMMENT ON COLUMN public.workspace.user_id IS 'Reference to user who owns this workspace.';
COMMENT ON COLUMN public.workspace.name IS 'User-defined workspace name.';
COMMENT ON COLUMN public.workspace.workspace_type IS 'IDE type: jupyter, vscode, rstudio, terminal, custom.';
COMMENT ON COLUMN public.workspace.status IS 'Workspace status: pending, provisioning, running, stopping, stopped, failed, terminated.';
COMMENT ON COLUMN public.workspace.size IS 'Resource size preset: small, medium, large, xlarge, custom.';
COMMENT ON COLUMN public.workspace.cluster_id IS 'Reference to Kubernetes cluster where workspace runs.';
COMMENT ON COLUMN public.workspace.namespace IS 'Kubernetes namespace for workspace pod.';
COMMENT ON COLUMN public.workspace.image IS 'Container image for the workspace.';
COMMENT ON COLUMN public.workspace.endpoint_url IS 'Public URL to access the workspace IDE.';
COMMENT ON COLUMN public.workspace.resources_allocated IS 'JSON specification of allocated resources (CPU, memory, GPU).';
COMMENT ON COLUMN public.workspace.auto_shutdown_minutes IS 'Minutes of inactivity before automatic shutdown.';
COMMENT ON COLUMN public.workspace.last_activity_at IS 'Timestamp of last user activity in workspace.';

-- Workspace Session Log table
COMMENT ON TABLE public.workspace_session_log IS 'Audit log of workspace sessions for security and usage tracking.';
COMMENT ON COLUMN public.workspace_session_log.id IS 'Unique identifier (UUID v4) for the session log entry.';
COMMENT ON COLUMN public.workspace_session_log.tenant_id IS 'Reference to tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.workspace_session_log.workspace_id IS 'Reference to parent workspace.';
COMMENT ON COLUMN public.workspace_session_log.user_id IS 'Reference to user who created this session.';
COMMENT ON COLUMN public.workspace_session_log.session_type IS 'Session type: interactive, api, scheduled.';
COMMENT ON COLUMN public.workspace_session_log.status IS 'Session status: active, closed, expired.';
COMMENT ON COLUMN public.workspace_session_log.started_at IS 'Timestamp when session started.';
COMMENT ON COLUMN public.workspace_session_log.ended_at IS 'Timestamp when session ended.';
COMMENT ON COLUMN public.workspace_session_log.ip_address IS 'Client IP address for audit.';
COMMENT ON COLUMN public.workspace_session_log.user_agent IS 'Client user agent string.';

-- Model Deployment table
COMMENT ON TABLE public.model_deployment IS 'Model deployments for inference endpoints. Tracks deployed model versions and their runtime configuration.';
COMMENT ON COLUMN public.model_deployment.id IS 'Unique identifier (UUID v4) for the deployment.';
COMMENT ON COLUMN public.model_deployment.tenant_id IS 'Reference to tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.model_deployment.project_id IS 'Reference to parent project.';
COMMENT ON COLUMN public.model_deployment.model_version_id IS 'Reference to deployed model version.';
COMMENT ON COLUMN public.model_deployment.name IS 'Deployment name, unique per project.';
COMMENT ON COLUMN public.model_deployment.cluster_id IS 'Reference to Kubernetes cluster for deployment.';
COMMENT ON COLUMN public.model_deployment.namespace IS 'Kubernetes namespace for deployment resources.';
COMMENT ON COLUMN public.model_deployment.endpoint_url IS 'Public URL for inference API endpoint.';
COMMENT ON COLUMN public.model_deployment.auth_policy IS 'JSON authentication policy (API key, OAuth, mTLS).';
COMMENT ON COLUMN public.model_deployment.scaling IS 'JSON autoscaling configuration (min/max replicas, metrics).';
COMMENT ON COLUMN public.model_deployment.resources IS 'JSON resource configuration (CPU, memory, GPU requests/limits).';
COMMENT ON COLUMN public.model_deployment.rollout_strategy IS 'Deployment strategy: bluegreen, canary, rolling.';
COMMENT ON COLUMN public.model_deployment.status IS 'Deployment status: planned, syncing, healthy, degraded, failed, paused.';
COMMENT ON COLUMN public.model_deployment.status_message IS 'Human-readable status message or error details.';

-- Notification table
COMMENT ON TABLE public.notification IS 'User notifications for platform events and alerts. Supports in-app, email, and webhook delivery.';
COMMENT ON COLUMN public.notification.id IS 'Unique identifier (UUID v4) for the notification.';
COMMENT ON COLUMN public.notification.tenant_id IS 'Reference to tenant for multi-tenant isolation.';
COMMENT ON COLUMN public.notification.user_id IS 'Reference to recipient user.';
COMMENT ON COLUMN public.notification.type IS 'Notification type: mention, assignment, pipeline_failed, deploy_drift, approval, incident.';
COMMENT ON COLUMN public.notification.title IS 'Notification title/subject.';
COMMENT ON COLUMN public.notification.message IS 'Notification body text.';
COMMENT ON COLUMN public.notification.entity_type IS 'Type of entity this notification relates to.';
COMMENT ON COLUMN public.notification.entity_id IS 'ID of entity this notification relates to.';
COMMENT ON COLUMN public.notification.channel IS 'Delivery channel: inapp, email, webhook.';
COMMENT ON COLUMN public.notification.read_at IS 'Timestamp when notification was read (null if unread).';
COMMENT ON COLUMN public.notification.action_url IS 'URL to navigate when notification is clicked.';

-- ============================================================================
-- SECTION 9: VERIFICATION QUERIES (for manual validation)
-- ============================================================================

-- These queries can be run to verify the migration succeeded:
-- SELECT constraint_name FROM information_schema.table_constraints
--   WHERE table_name = 'work_item' AND constraint_type = 'FOREIGN KEY';
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'workspace_session_log' AND column_name = 'tenant_id';

-- ============================================================================
-- END OF MIGRATION: Schema Fixes and Improvements
-- ============================================================================
