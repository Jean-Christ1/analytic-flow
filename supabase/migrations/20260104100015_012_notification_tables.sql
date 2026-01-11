-- ============================================================================
-- Migration: Notification System Tables
-- MLOps Control Plane v3
-- Author: Armand AMOUSSOU
-- Date: 2026-01-04
-- ============================================================================

-- ============================================================================
-- CREATE HELPER FUNCTION IF NOT EXISTS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- NOTIFICATION TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Notification content
    type TEXT NOT NULL CHECK (type IN (
        'info', 'success', 'warning', 'error',
        'run_completed', 'run_failed',
        'model_deployed', 'model_failed',
        'workspace_ready', 'workspace_stopped',
        'alert_triggered', 'resource_limit',
        'collaboration_invite', 'comment_mention'
    )),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    metadata JSONB DEFAULT '{}',

    -- Read status
    read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for notification
CREATE INDEX IF NOT EXISTS idx_notification_user_id ON notification(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_tenant_id ON notification(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notification_type ON notification(type);
CREATE INDEX IF NOT EXISTS idx_notification_created_at ON notification(created_at DESC);

-- Add read column if it doesn't exist (for existing tables)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification' AND column_name = 'read') THEN
        ALTER TABLE notification ADD COLUMN read BOOLEAN NOT NULL DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification' AND column_name = 'read_at') THEN
        ALTER TABLE notification ADD COLUMN read_at TIMESTAMPTZ;
    END IF;
END $$;

-- Create indexes that depend on read column
CREATE INDEX IF NOT EXISTS idx_notification_read ON notification(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notification_user_unread ON notification(user_id, read, created_at DESC) WHERE read = false;

-- ============================================================================
-- NOTIFICATION PREFERENCES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Channel preferences
    channels JSONB NOT NULL DEFAULT '{
        "in_app": true,
        "email": true,
        "slack": false,
        "webhook": false
    }',

    -- Type-specific preferences
    types JSONB NOT NULL DEFAULT '{}',

    -- Quiet hours configuration
    quiet_hours JSONB DEFAULT NULL,

    -- Email digest preference
    email_digest TEXT DEFAULT 'none' CHECK (email_digest IN ('none', 'daily', 'weekly')),

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- ALERT RULE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS alert_rule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Rule configuration
    name TEXT NOT NULL,
    description TEXT,
    enabled BOOLEAN NOT NULL DEFAULT true,

    -- Alert condition
    condition JSONB NOT NULL,
    -- Example: {
    --   "type": "metric_threshold",
    --   "metric": "accuracy",
    --   "operator": "lt",
    --   "threshold": 0.9,
    --   "duration": 300
    -- }

    -- Alert actions
    actions JSONB NOT NULL DEFAULT '[]',
    -- Example: [
    --   {"type": "notification", "config": {"priority": "high"}},
    --   {"type": "email", "config": {"to": ["admin@example.com"]}}
    -- ]

    -- Cooldown to prevent alert spam
    cooldown_minutes INTEGER NOT NULL DEFAULT 60,
    last_triggered_at TIMESTAMPTZ,

    -- Scope
    project_id UUID REFERENCES project(id) ON DELETE CASCADE,
    experiment_id UUID REFERENCES experiment(id) ON DELETE CASCADE,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for alert_rule
CREATE INDEX IF NOT EXISTS idx_alert_rule_user_id ON alert_rule(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_rule_tenant_id ON alert_rule(tenant_id);
CREATE INDEX IF NOT EXISTS idx_alert_rule_enabled ON alert_rule(enabled) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_alert_rule_project_id ON alert_rule(project_id);

-- ============================================================================
-- ALERT HISTORY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS alert_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    alert_rule_id UUID NOT NULL REFERENCES alert_rule(id) ON DELETE CASCADE,

    -- Trigger details
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    condition_value JSONB NOT NULL, -- The actual values that triggered the alert

    -- Resolution
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id),
    resolution_notes TEXT,

    -- Actions taken
    actions_executed JSONB NOT NULL DEFAULT '[]',

    -- Related entities
    run_id UUID REFERENCES run(id) ON DELETE SET NULL,
    model_version_id UUID REFERENCES model_version(id) ON DELETE SET NULL,
    workspace_id UUID REFERENCES workspace(id) ON DELETE SET NULL
);

-- Indexes for alert_history
CREATE INDEX IF NOT EXISTS idx_alert_history_rule_id ON alert_history(alert_rule_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_triggered_at ON alert_history(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_history_resolved ON alert_history(resolved_at) WHERE resolved_at IS NULL;

-- ============================================================================
-- WEBHOOK CONFIGURATION TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS webhook_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Webhook configuration
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    secret TEXT, -- For HMAC signature verification

    -- Event subscriptions
    events TEXT[] NOT NULL DEFAULT '{}',

    -- Status
    enabled BOOLEAN NOT NULL DEFAULT true,
    last_triggered_at TIMESTAMPTZ,
    last_response_code INTEGER,

    -- Retry configuration
    retry_count INTEGER NOT NULL DEFAULT 3,
    retry_delay_seconds INTEGER NOT NULL DEFAULT 60,

    -- Headers to include
    headers JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for webhook_config
CREATE INDEX IF NOT EXISTS idx_webhook_config_tenant_id ON webhook_config(tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhook_config_user_id ON webhook_config(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_config_enabled ON webhook_config(enabled) WHERE enabled = true;

-- ============================================================================
-- WEBHOOK DELIVERY LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS webhook_delivery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Event details
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,

    -- Delivery status
    status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'retrying')),
    attempt_count INTEGER NOT NULL DEFAULT 0,

    -- Response details
    response_code INTEGER,
    response_body TEXT,
    error_message TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    next_retry_at TIMESTAMPTZ
);

-- Add webhook_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'webhook_delivery' AND column_name = 'webhook_id') THEN
        ALTER TABLE webhook_delivery ADD COLUMN webhook_id UUID;
    END IF;
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'webhook_delivery_webhook_id_fkey'
        AND table_name = 'webhook_delivery'
    ) THEN
        ALTER TABLE webhook_delivery ADD CONSTRAINT webhook_delivery_webhook_id_fkey
        FOREIGN KEY (webhook_id) REFERENCES webhook_config(id) ON DELETE CASCADE;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Indexes for webhook_delivery (only create if column exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'webhook_delivery' AND column_name = 'webhook_id') THEN
        CREATE INDEX IF NOT EXISTS idx_webhook_delivery_webhook_id ON webhook_delivery(webhook_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_webhook_delivery_status ON webhook_delivery(status);

-- Create retry index conditionally (handles both enum and text types)
DO $$
BEGIN
    -- Try to create the index with string literal
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_webhook_delivery_retry ON webhook_delivery(next_retry_at) WHERE status::text = ''retrying''';
EXCEPTION
    WHEN others THEN
        -- If it fails, the status type doesn't support 'retrying', skip
        NULL;
END $$;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE notification ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rule ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_delivery ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS notification_select_policy ON notification;
DROP POLICY IF EXISTS notification_insert_policy ON notification;
DROP POLICY IF EXISTS notification_update_policy ON notification;
DROP POLICY IF EXISTS notification_delete_policy ON notification;
DROP POLICY IF EXISTS notification_preferences_select_policy ON notification_preferences;
DROP POLICY IF EXISTS notification_preferences_insert_policy ON notification_preferences;
DROP POLICY IF EXISTS notification_preferences_update_policy ON notification_preferences;
DROP POLICY IF EXISTS alert_rule_select_policy ON alert_rule;
DROP POLICY IF EXISTS alert_rule_insert_policy ON alert_rule;
DROP POLICY IF EXISTS alert_rule_update_policy ON alert_rule;
DROP POLICY IF EXISTS alert_rule_delete_policy ON alert_rule;
DROP POLICY IF EXISTS alert_history_select_policy ON alert_history;
DROP POLICY IF EXISTS webhook_config_select_policy ON webhook_config;
DROP POLICY IF EXISTS webhook_config_insert_policy ON webhook_config;
DROP POLICY IF EXISTS webhook_config_update_policy ON webhook_config;
DROP POLICY IF EXISTS webhook_config_delete_policy ON webhook_config;
DROP POLICY IF EXISTS webhook_delivery_select_policy ON webhook_delivery;

-- Notification policies
CREATE POLICY notification_select_policy ON notification
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY notification_insert_policy ON notification
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY notification_update_policy ON notification
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY notification_delete_policy ON notification
    FOR DELETE USING (user_id = auth.uid());

-- Notification preferences policies
CREATE POLICY notification_preferences_select_policy ON notification_preferences
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY notification_preferences_insert_policy ON notification_preferences
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY notification_preferences_update_policy ON notification_preferences
    FOR UPDATE USING (user_id = auth.uid());

-- Alert rule policies
CREATE POLICY alert_rule_select_policy ON alert_rule
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY alert_rule_insert_policy ON alert_rule
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY alert_rule_update_policy ON alert_rule
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY alert_rule_delete_policy ON alert_rule
    FOR DELETE USING (user_id = auth.uid());

-- Alert history policies
CREATE POLICY alert_history_select_policy ON alert_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM alert_rule ar
            WHERE ar.id = alert_history.alert_rule_id
            AND ar.user_id = auth.uid()
        )
    );

-- Webhook config policies
CREATE POLICY webhook_config_select_policy ON webhook_config
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY webhook_config_insert_policy ON webhook_config
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY webhook_config_update_policy ON webhook_config
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY webhook_config_delete_policy ON webhook_config
    FOR DELETE USING (user_id = auth.uid());

-- Webhook delivery policies
CREATE POLICY webhook_delivery_select_policy ON webhook_delivery
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM webhook_config wc
            WHERE wc.id = webhook_delivery.webhook_id
            AND wc.user_id = auth.uid()
        )
    );

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

DROP TRIGGER IF EXISTS notification_updated_at ON notification;
CREATE TRIGGER notification_updated_at
    BEFORE UPDATE ON notification
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS alert_rule_updated_at ON alert_rule;
CREATE TRIGGER alert_rule_updated_at
    BEFORE UPDATE ON alert_rule
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS webhook_config_updated_at ON webhook_config;
CREATE TRIGGER webhook_config_updated_at
    BEFORE UPDATE ON webhook_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTIONS FOR NOTIFICATION MANAGEMENT
-- ============================================================================

-- Function to send notification (can be called from triggers)
CREATE OR REPLACE FUNCTION send_notification(
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
    INSERT INTO notification (user_id, tenant_id, type, title, message, link, metadata, priority)
    VALUES (p_user_id, p_tenant_id, p_type, p_title, p_message, p_link, p_metadata, p_priority)
    RETURNING id INTO v_notification_id;

    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to broadcast notification to tenant
CREATE OR REPLACE FUNCTION broadcast_notification_to_tenant(
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
    v_profile RECORD;
BEGIN
    FOR v_profile IN SELECT user_id FROM profiles WHERE tenant_id = p_tenant_id LOOP
        INSERT INTO notification (user_id, tenant_id, type, title, message, link, metadata, priority)
        VALUES (v_profile.user_id, p_tenant_id, p_type, p_title, p_message, p_link, p_metadata, p_priority);
        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean old notifications
CREATE OR REPLACE FUNCTION cleanup_old_notifications(p_days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM notification
        WHERE read = true
        AND created_at < NOW() - (p_days_old || ' days')::INTERVAL
        RETURNING id
    )
    SELECT COUNT(*) INTO v_deleted FROM deleted;

    RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- AUTO-NOTIFICATION TRIGGERS
-- ============================================================================

-- Trigger function for run completion notification
CREATE OR REPLACE FUNCTION notify_run_completion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IN ('completed', 'failed') AND OLD.status NOT IN ('completed', 'failed') THEN
        PERFORM send_notification(
            NEW.user_id,
            NEW.tenant_id,
            CASE WHEN NEW.status = 'completed' THEN 'run_completed' ELSE 'run_failed' END,
            CASE WHEN NEW.status = 'completed'
                THEN 'Run Completed: ' || NEW.name
                ELSE 'Run Failed: ' || NEW.name
            END,
            CASE WHEN NEW.status = 'completed'
                THEN 'Your ML run has completed successfully.'
                ELSE 'Your ML run has failed. Check the logs for details.'
            END,
            '/runs/' || NEW.id,
            jsonb_build_object('run_id', NEW.id, 'experiment_id', NEW.experiment_id),
            CASE WHEN NEW.status = 'failed' THEN 'high' ELSE 'normal' END
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply run completion trigger
DROP TRIGGER IF EXISTS run_completion_notification ON run;
CREATE TRIGGER run_completion_notification
    AFTER UPDATE ON run
    FOR EACH ROW
    EXECUTE FUNCTION notify_run_completion();

-- Trigger function for model deployment notification
CREATE OR REPLACE FUNCTION notify_model_deployment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IN ('active', 'failed') AND OLD.status NOT IN ('active', 'failed') THEN
        PERFORM send_notification(
            NEW.created_by,
            NEW.tenant_id,
            CASE WHEN NEW.status = 'active' THEN 'model_deployed' ELSE 'model_failed' END,
            CASE WHEN NEW.status = 'active'
                THEN 'Model Deployed: ' || NEW.name
                ELSE 'Deployment Failed: ' || NEW.name
            END,
            CASE WHEN NEW.status = 'active'
                THEN 'Your model has been successfully deployed to ' || NEW.environment || '.'
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

-- Apply model deployment trigger
DROP TRIGGER IF EXISTS model_deployment_notification ON model_deployment;
CREATE TRIGGER model_deployment_notification
    AFTER UPDATE ON model_deployment
    FOR EACH ROW
    EXECUTE FUNCTION notify_model_deployment();

-- Trigger function for workspace ready notification
CREATE OR REPLACE FUNCTION notify_workspace_ready()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'running' AND OLD.status != 'running' THEN
        PERFORM send_notification(
            NEW.user_id,
            NEW.tenant_id,
            'workspace_ready',
            'Workspace Ready: ' || NEW.name,
            'Your workspace is now running and ready to use.',
            NEW.endpoint_url,
            jsonb_build_object('workspace_id', NEW.id, 'workspace_type', NEW.workspace_type),
            'normal'
        );
    ELSIF NEW.status = 'stopped' AND OLD.status = 'running' THEN
        PERFORM send_notification(
            NEW.user_id,
            NEW.tenant_id,
            'workspace_stopped',
            'Workspace Stopped: ' || NEW.name,
            'Your workspace has been stopped.',
            '/workspaces/' || NEW.id,
            jsonb_build_object('workspace_id', NEW.id),
            'low'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply workspace notification trigger
DROP TRIGGER IF EXISTS workspace_status_notification ON workspace;
CREATE TRIGGER workspace_status_notification
    AFTER UPDATE ON workspace
    FOR EACH ROW
    EXECUTE FUNCTION notify_workspace_ready();

-- ============================================================================
-- COMPATIBILITY VIEWS (skip if columns don't exist)
-- ============================================================================

-- Note: Views are skipped since the existing notification table
-- has a different structure. These will be created in a separate
-- migration after the table is fully reconciled.

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE notification IS 'User notifications for platform events';
COMMENT ON TABLE notification_preferences IS 'User preferences for notification delivery';
COMMENT ON TABLE alert_rule IS 'Custom alert rules defined by users';
COMMENT ON TABLE alert_history IS 'History of triggered alerts';
COMMENT ON TABLE webhook_config IS 'Webhook endpoint configurations';
COMMENT ON TABLE webhook_delivery IS 'Webhook delivery attempts and status';

-- ============================================================================
-- TODO: Additional notification features to implement
-- ============================================================================
-- TODO: Add notification templates table for customizable messages
-- TODO: Add notification batching for digest emails
-- TODO: Add notification channel integrations (Slack, Teams, Discord)
-- TODO: Add notification rate limiting table
-- TODO: Add notification analytics aggregation
-- TODO: Add push notification subscriptions table
-- TODO: Add scheduled notifications table
-- TODO: Add notification translation/i18n support
