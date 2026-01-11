-- Create audit_logs table for tracking role changes (if not exists)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    performed_by UUID,
    performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    ip_address TEXT,
    user_agent TEXT
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs
FOR SELECT
USING (public.is_admin(auth.uid()));

-- System can insert audit logs (via trigger)
CREATE POLICY "System can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (true);

-- Create trigger function for role changes
CREATE OR REPLACE FUNCTION public.log_role_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_logs (action, table_name, record_id, new_data, performed_by)
        VALUES ('ROLE_ASSIGNED', 'user_roles', NEW.id,
            jsonb_build_object('user_id', NEW.user_id, 'role', NEW.role),
            auth.uid());
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.audit_logs (action, table_name, record_id, old_data, new_data, performed_by)
        VALUES ('ROLE_CHANGED', 'user_roles', NEW.id,
            jsonb_build_object('user_id', OLD.user_id, 'role', OLD.role),
            jsonb_build_object('user_id', NEW.user_id, 'role', NEW.role),
            auth.uid());
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_logs (action, table_name, record_id, old_data, performed_by)
        VALUES ('ROLE_REMOVED', 'user_roles', OLD.id,
            jsonb_build_object('user_id', OLD.user_id, 'role', OLD.role),
            auth.uid());
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_role_change ON public.user_roles;
CREATE TRIGGER on_role_change
    AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.log_role_changes();

-- Create indexes if not exists
CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_at ON public.audit_logs(performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);