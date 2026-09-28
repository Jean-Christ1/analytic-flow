CREATE TABLE IF NOT EXISTS public.task (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  task_type text NOT NULL DEFAULT 'other',
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'todo',
  assignee_id uuid,
  reporter_id uuid,
  parent_task_id uuid REFERENCES public.task(id) ON DELETE SET NULL,
  labels text[] NOT NULL DEFAULT '{}'::text[],
  due_date timestamptz,
  estimated_hours numeric,
  actual_hours numeric,
  sprint_id uuid,
  external_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.task TO authenticated;
GRANT ALL ON public.task TO service_role;
ALTER TABLE public.task ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_select_same_tenant" ON public.task FOR SELECT TO authenticated
  USING (public.user_belongs_to_tenant(tenant_id));
CREATE POLICY "task_insert_same_tenant" ON public.task FOR INSERT TO authenticated
  WITH CHECK (public.user_belongs_to_tenant(tenant_id));
CREATE POLICY "task_update_same_tenant" ON public.task FOR UPDATE TO authenticated
  USING (public.user_belongs_to_tenant(tenant_id))
  WITH CHECK (public.user_belongs_to_tenant(tenant_id));
CREATE POLICY "task_delete_admin" ON public.task FOR DELETE TO authenticated
  USING (public.is_tenant_admin() AND public.user_belongs_to_tenant(tenant_id));

CREATE INDEX IF NOT EXISTS task_project_idx ON public.task (project_id, status);

CREATE TRIGGER task_set_updated_at BEFORE UPDATE ON public.task
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.task_dependency (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenant(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES public.task(id) ON DELETE CASCADE,
  depends_on_task_id uuid NOT NULL REFERENCES public.task(id) ON DELETE CASCADE,
  dependency_type text NOT NULL DEFAULT 'blocks',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (task_id, depends_on_task_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_dependency TO authenticated;
GRANT ALL ON public.task_dependency TO service_role;
ALTER TABLE public.task_dependency ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_dependency_select_same_tenant" ON public.task_dependency FOR SELECT TO authenticated
  USING (public.user_belongs_to_tenant(tenant_id));
CREATE POLICY "task_dependency_insert_same_tenant" ON public.task_dependency FOR INSERT TO authenticated
  WITH CHECK (public.user_belongs_to_tenant(tenant_id));
CREATE POLICY "task_dependency_delete_same_tenant" ON public.task_dependency FOR DELETE TO authenticated
  USING (public.user_belongs_to_tenant(tenant_id));