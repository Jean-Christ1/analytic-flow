CREATE OR REPLACE FUNCTION public.ensure_user_tenant(_user_id uuid, _email text, _name text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_tenant uuid; v_role uuid;
BEGIN
  SELECT tenant_id INTO v_tenant FROM public.user_account WHERE id = _user_id;
  IF v_tenant IS NOT NULL THEN RETURN v_tenant; END IF;

  SELECT id INTO v_tenant FROM public.tenant ORDER BY created_at LIMIT 1;
  IF v_tenant IS NULL THEN
    INSERT INTO public.tenant (slug, name, tier) VALUES ('default', 'Default Workspace', 'enterprise') RETURNING id INTO v_tenant;
  END IF;

  INSERT INTO public.user_account (id, tenant_id, email, display_name)
  VALUES (_user_id, v_tenant, COALESCE(_email, _user_id::text), _name)
  ON CONFLICT (id) DO NOTHING;

  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin') THEN
    SELECT id INTO v_role FROM public.role WHERE tenant_id = v_tenant AND name = 'tenant_admin' LIMIT 1;
    IF v_role IS NULL THEN
      INSERT INTO public.role (tenant_id, name, scope, description, is_system)
      VALUES (v_tenant, 'tenant_admin', 'tenant', 'Full administration of the workspace', true) RETURNING id INTO v_role;
    END IF;
    INSERT INTO public.principal_role_binding (tenant_id, principal_type, principal_id, scope_type, scope_id, role_id)
    SELECT v_tenant, 'user', _user_id, 'tenant', v_tenant, v_role
    WHERE NOT EXISTS (SELECT 1 FROM public.principal_role_binding WHERE principal_id = _user_id AND role_id = v_role);
  END IF;
  RETURN v_tenant;
END; $$;

REVOKE EXECUTE ON FUNCTION public.ensure_user_tenant(uuid, text, text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');

  IF NOT EXISTS (SELECT 1 FROM public.user_roles LIMIT 1) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;

  PERFORM public.ensure_user_tenant(NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END; $$;

DO $$ DECLARE u record; BEGIN
  FOR u IN SELECT id, email, raw_user_meta_data->>'full_name' AS n FROM auth.users LOOP
    PERFORM public.ensure_user_tenant(u.id, u.email, u.n);
  END LOOP;
END $$;