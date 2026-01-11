-- ============================================================================
-- MIGRATION: Fix Polymorphic FK Validation
-- MLOps Control Plane v3
-- Author: Armand AMOUSSOU
-- Date: 2026-01-09
-- Description: Ajoute la validation des relations polymorphes et indexes manquants
-- ============================================================================

-- ============================================================================
-- SECTION 1: VALIDATION TRIGGERS POUR RELATIONS POLYMORPHES
-- ============================================================================

-- Fonction de validation pour principal_role_binding.principal_id
CREATE OR REPLACE FUNCTION public.validate_principal_role_binding_principal()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.principal_type = 'user'::public.principal_type THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.user_account
      WHERE id = NEW.principal_id AND tenant_id = NEW.tenant_id
    ) THEN
      RAISE EXCEPTION 'Invalid principal_id: user % not found in tenant %',
        NEW.principal_id, NEW.tenant_id;
    END IF;

  ELSIF NEW.principal_type = 'group'::public.principal_type THEN
    IF NOT EXISTS (
      SELECT 1 FROM public."group"
      WHERE id = NEW.principal_id AND tenant_id = NEW.tenant_id
    ) THEN
      RAISE EXCEPTION 'Invalid principal_id: group % not found in tenant %',
        NEW.principal_id, NEW.tenant_id;
    END IF;

  ELSIF NEW.principal_type = 'service'::public.principal_type THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.service_account
      WHERE id = NEW.principal_id AND tenant_id = NEW.tenant_id
    ) THEN
      RAISE EXCEPTION 'Invalid principal_id: service account % not found in tenant %',
        NEW.principal_id, NEW.tenant_id;
    END IF;

  ELSE
    RAISE EXCEPTION 'Invalid principal_type: %', NEW.principal_type;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger
DROP TRIGGER IF EXISTS validate_principal_role_binding_principal_trg
  ON public.principal_role_binding;

CREATE TRIGGER validate_principal_role_binding_principal_trg
  BEFORE INSERT OR UPDATE ON public.principal_role_binding
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_principal_role_binding_principal();

COMMENT ON FUNCTION public.validate_principal_role_binding_principal() IS
  'Valide que principal_id référence une entité valide selon principal_type';

-- ============================================================================
-- SECTION 2: INDEXES MANQUANTS SUR FK
-- ============================================================================

-- Index pour relations polymorphes
CREATE INDEX IF NOT EXISTS idx_comment_thread_entity
  ON public.comment_thread(entity_type, entity_id)
  WHERE entity_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notification_entity
  ON public.notification(entity_type, entity_id)
  WHERE entity_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_approval_request_entity
  ON public.approval_request(entity_type, entity_id)
  WHERE entity_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_attachment_entity
  ON public.attachment(entity_type, entity_id)
  WHERE entity_type IS NOT NULL;

-- Index pour colonnes fréquemment filtrées
CREATE INDEX IF NOT EXISTS idx_work_item_assignee
  ON public.work_item(assignee_user_id)
  WHERE assignee_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_work_item_reporter
  ON public.work_item(reporter_user_id)
  WHERE reporter_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_metric_alert_acknowledged
  ON public.metric_alert(run_id, acknowledged_at)
  WHERE acknowledged_at IS NOT NULL;

-- ============================================================================
-- SECTION 3: VUES DE MONITORING POUR ORPHELINS
-- ============================================================================

-- Vue pour détecter les principal_role_binding orphelins
CREATE OR REPLACE VIEW public.invalid_principal_role_bindings AS
SELECT
  prb.*,
  'Invalid principal_id for type ' || prb.principal_type::TEXT as error_reason
FROM public.principal_role_binding prb
WHERE (
  (prb.principal_type = 'user'::public.principal_type AND NOT EXISTS (
    SELECT 1 FROM public.user_account WHERE id = prb.principal_id
  ))
  OR
  (prb.principal_type = 'group'::public.principal_type AND NOT EXISTS (
    SELECT 1 FROM public."group" WHERE id = prb.principal_id
  ))
  OR
  (prb.principal_type = 'service'::public.principal_type AND NOT EXISTS (
    SELECT 1 FROM public.service_account WHERE id = prb.principal_id
  ))
);

COMMENT ON VIEW public.invalid_principal_role_bindings IS
  'Détecte les principal_role_binding avec des principal_id invalides (orphelins)';

-- Vue pour détecter les comment_thread orphelins
CREATE OR REPLACE VIEW public.invalid_comment_threads AS
SELECT
  ct.*,
  'Invalid entity_id for type ' || ct.entity_type as error_reason
FROM public.comment_thread ct
WHERE ct.entity_type = 'project' AND NOT EXISTS (
  SELECT 1 FROM public.project WHERE id = ct.entity_id
)
OR ct.entity_type = 'work_item' AND NOT EXISTS (
  SELECT 1 FROM public.work_item WHERE id = ct.entity_id
);

COMMENT ON VIEW public.invalid_comment_threads IS
  'Détecte les comment_thread avec des entity_id invalides (orphelins)';

-- ============================================================================
-- SECTION 4: FONCTION UTILITAIRE DE VÉRIFICATION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_referential_integrity()
RETURNS TABLE(
  table_name TEXT,
  invalid_count BIGINT,
  severity TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    'principal_role_binding'::TEXT,
    COUNT(*)::BIGINT,
    'HIGH'::TEXT
  FROM public.invalid_principal_role_bindings

  UNION ALL

  SELECT
    'comment_thread'::TEXT,
    COUNT(*)::BIGINT,
    'MEDIUM'::TEXT
  FROM public.invalid_comment_threads;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.check_referential_integrity() IS
  'Vérifie l''intégrité référentielle des relations polymorphes';

-- ============================================================================
-- SECTION 5: COMMENTS DE DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN public.principal_role_binding.principal_id IS
  'FK polymorphe vers user_account, group, ou service_account selon principal_type. Validation par trigger.';

COMMENT ON COLUMN public.cicd_pipeline_link.entity_id IS
  'FK polymorphe vers environment_build, model_version, release, argocd_application selon entity_type. Pas de validation DB.';

COMMENT ON COLUMN public.execution_link.source_id IS
  'FK polymorphe vers run, pipeline, deployment, release selon source_type. Pas de validation DB.';

COMMENT ON COLUMN public.execution_link.target_id IS
  'FK polymorphe vers run, pipeline, deployment, release selon target_type. Pas de validation DB.';

COMMENT ON COLUMN public.comment_thread.entity_id IS
  'FK polymorphe vers project, work_item, run, model, deployment selon entity_type. Pas de validation DB.';

COMMENT ON COLUMN public.notification.entity_id IS
  'FK polymorphe vers project, work_item, run, model, deployment selon entity_type. Pas de validation DB.';

-- ============================================================================
-- END OF MIGRATION: Fix Polymorphic FK Validation
-- ============================================================================
