CREATE TABLE IF NOT EXISTS public.quota (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
  scope text NOT NULL DEFAULT 'tenant',
  scope_id uuid,
  resource_type text NOT NULL,
  limit_value numeric NOT NULL DEFAULT 0,
  current_usage numeric NOT NULL DEFAULT 0,
  period text NOT NULL DEFAULT 'monthly',
  period_start timestamptz,
  period_end timestamptz,
  soft_limit numeric,
  hard_limit numeric NOT NULL DEFAULT 0,
  alert_threshold numeric NOT NULL DEFAULT 80,
  alert_sent boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quota TO authenticated;
GRANT ALL ON public.quota TO service_role;

ALTER TABLE public.quota ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quota_select_same_tenant" ON public.quota
  FOR SELECT TO authenticated
  USING (public.user_belongs_to_tenant(tenant_id));

CREATE POLICY "quota_insert_same_tenant" ON public.quota
  FOR INSERT TO authenticated
  WITH CHECK (public.user_belongs_to_tenant(tenant_id));

CREATE POLICY "quota_update_same_tenant" ON public.quota
  FOR UPDATE TO authenticated
  USING (public.user_belongs_to_tenant(tenant_id))
  WITH CHECK (public.user_belongs_to_tenant(tenant_id));

CREATE POLICY "quota_delete_admin" ON public.quota
  FOR DELETE TO authenticated
  USING (public.is_tenant_admin() AND public.user_belongs_to_tenant(tenant_id));

CREATE INDEX IF NOT EXISTS quota_tenant_scope_idx ON public.quota (tenant_id, scope, scope_id);

CREATE TRIGGER quota_set_updated_at
  BEFORE UPDATE ON public.quota
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();