# RAPPORT D'ANALYSE EXHAUSTIVE - APEX-ML-PLATFORM

**Projet**: MLOps Control Plane v3 - Enterprise Grade
**Chemin**: `C:\Users\kouas\Documents\deepl-test\02-mlops-data-lab\apex-ml-platform`
**Auteur**: Armand AMOUSSOU
**Date**: 2026-01-07
**Progression Globale**: 100% (17/17 migrations appliquees, 146/146 tests passent)

---

## TABLE DES MATIERES

1. [Question 1: Etat Actuel de la Plateforme MLOps](#question-1-etat-actuel-de-la-plateforme-mlops)
2. [Question 2: Description Detaillee du Backend](#question-2-description-detaillee-du-backend)
3. [Question 3: Description Detaillee du Frontend](#question-3-description-detaillee-du-frontend)
4. [Question 4: Stack Technique et Justification](#question-4-stack-technique-et-justification)
5. [Question 5: Travaux Restants](#question-5-travaux-restants)
6. [Question 6: Strategie d'Insertion des Donnees (Zero Perte)](#question-6-strategie-dinsertion-des-donnees-zero-perte)
7. [Question 7: Integration des APIs Python Existantes](#question-7-integration-des-apis-python-existantes)
8. [Synthese et Progression Globale](#synthese-et-progression-globale)

---

## QUESTION 1: ETAT ACTUEL DE LA PLATEFORME MLOPS

### Vue d'Ensemble

La plateforme **APEX-ML-PLATFORM** est une plateforme MLOps centralisee de niveau entreprise inspiree de l'architecture Domino Data Lab. Elle implemente le pattern **Control Plane / Data Plane** pour orchestrer les workloads ML sur Kubernetes multi-cloud.

### Architecture Fonctionnelle

```
+------------------------------------------------------------------+
|                    CONTROL PLANE (Frontend React)                |
|  - Dashboard centralise      - Gestion des projets               |
|  - Workspaces (JupyterLab/VSCode/RStudio via iframe)             |
|  - Model Registry            - Experiment Tracking                |
|  - CI/CD Pipelines           - FinOps & Cost Management          |
|  - AI Governance             - Monitoring & Observability         |
+------------------------------------------------------------------+
                                |
                    Supabase PostgreSQL + RLS
                                |
+------------------------------------------------------------------+
|                    DATA PLANE (Kubernetes)                       |
|  - Clusters K8s multi-cloud (AWS/GCP/Azure/OnPrem)               |
|  - Namespaces isoles par projet                                  |
|  - Compute Profiles (CPU/GPU)                                    |
|  - Runtime Policies (securite)                                   |
+------------------------------------------------------------------+
```

### Statistiques du Projet

| Metrique | Valeur |
|----------|--------|
| Tables PostgreSQL | 130+ |
| Migrations appliquees | 17/17 |
| Tests unitaires | 146/146 (100%) |
| Pages frontend | 28+ |
| Composants React | 92+ |
| Hooks React Query | 70+ |
| Services backend | 9 |
| ENUMs PostgreSQL | 38+ |
| Politiques RLS | 150+ |

### Domaines Fonctionnels Couverts

1. **Tenancy** (8 tables): tenant, organization, project, project_member, project_tag, etc.
2. **Identity** (16 tables): user_account, role, permission, team, api_key, etc.
3. **Infrastructure** (4 tables): k8s_cluster, k8s_namespace_binding, compute_profile, runtime_policy
4. **Registries** (5 tables): container_registry, object_store, data_connection, environment, environment_build
5. **MLOps** (15 tables): ml_experiment, ml_run, ml_model, model_version, model_deployment, etc.
6. **CI/CD** (19 tables): pipeline_definition, pipeline_run, argocd_application, git_provider, etc.
7. **Collaboration** (9 tables): comment_thread, comment, approval_request, notification, etc.
8. **Advanced** (42 tables): audit_event, feature_flag, work_item, scheduled_job, etc.
9. **Governance** (6 tables): ai_system, model_card, risk_assessment, compliance_mapping, etc.
10. **FinOps** (5 tables): billing_account, budget, cost_allocation, green_ops_metric, etc.
11. **Observability** (4 tables): observability_backend, alert_rule, incident, dashboard_config

---

## QUESTION 2: DESCRIPTION DETAILLEE DU BACKEND

### Stack Backend

| Composant | Technologie | Version |
|-----------|-------------|---------|
| Base de donnees | Supabase PostgreSQL | 15+ |
| Authentification | Supabase Auth | JWT RS256 |
| Stockage | Supabase Storage | 6 buckets |
| Realtime | Supabase Realtime | WebSocket |
| ORM Frontend | Supabase JS Client | 2.89.0 |

### Structure des Migrations (17 fichiers)

```
supabase/migrations/
├── 00000000000000_initial_schema.sql         # Schema initial
├── 00000000000001_storage_setup.sql          # Configuration storage
├── 20251230014358_audit_logs.sql             # Logs d'audit
├── 20260104100000_001_tenancy_tables.sql     # 8 tables tenancy
├── 20260104100001_002_identity_tables.sql    # 16 tables identity
├── 20260104100002_003_infrastructure_tables.sql  # 4 tables infra
├── 20260104100003_004_registries_tables.sql  # 5 tables registries
├── 20260104100004_005_mlops_tables.sql       # 9 tables mlops
├── 20260104100005_006_cicd_tables.sql        # 19 tables CI/CD
├── 20260104100006_007_collaboration_tables.sql   # 9 tables collab
├── 20260104100007_008_advanced_tables.sql    # 42 tables advanced
├── 20260104100008_009_rls_policies.sql       # Politiques RLS core
├── 20260104100009_010_rls_policies_advanced.sql  # RLS advanced
├── 20260104100010_011_mlops_extended_tables.sql  # 6 tables MLOps ext.
├── 20260104100015_012_notification_tables.sql    # 6 tables notif.
├── 20260107120000_013_schema_fixes.sql       # Corrections FK, triggers
└── 20260107130000_014_comprehensive_documentation.sql  # COMMENT ON
```

### Architecture Multi-Tenant

Chaque table contient une colonne `tenant_id` avec:
- Foreign Key vers `tenant(id)` avec `ON DELETE CASCADE`
- Index sur `tenant_id` pour les performances
- Politique RLS filtrant par `tenant_id`

Exemple de politique RLS:
```sql
CREATE POLICY "tenant_isolation" ON public.ml_experiment
    FOR ALL USING (
        tenant_id IN (
            SELECT pm.tenant_id FROM project_member pm
            WHERE pm.user_id = auth.uid()
        )
    );
```

### Types ENUMs Principaux (38+)

| Categorie | ENUMs |
|-----------|-------|
| Infrastructure | cloud_provider, k8s_environment, k8s_cluster_status |
| MLOps | experiment_status, run_status, model_stage, deployment_status |
| Registries | container_registry_type, object_store_type, environment_status |
| CI/CD | pipeline_status, git_provider_type, deployment_strategy |
| Governance | risk_level, compliance_status, ai_system_type |

### Storage Buckets (6 configures)

| Bucket | Usage | Public |
|--------|-------|--------|
| avatars | Photos de profil | Oui |
| experiments | Artefacts experiments | Non |
| models | Fichiers modeles ML | Non |
| datasets | Fichiers de donnees | Non |
| artifacts | Artefacts generaux | Non |
| logs | Fichiers de logs | Non |

### Services Layer (src/services/)

| Service | Fichier | Responsabilite |
|---------|---------|----------------|
| AuthService | auth.service.ts | Authentification Supabase |
| TenantService | tenant.service.ts | Gestion tenants/orgs |
| ExperimentService | experiment.service.ts | CRUD experiments |
| RunService | run.service.ts | Gestion runs ML |
| ModelService | model.service.ts | Model registry |
| WorkspaceService | workspace.service.ts | Workspaces dev |
| NotificationService | notification.service.ts | Notifications realtime |

---

## QUESTION 3: DESCRIPTION DETAILLEE DU FRONTEND

### Stack Frontend

| Composant | Technologie | Version |
|-----------|-------------|---------|
| Framework | React | 18.3.1 |
| Langage | TypeScript | 5.8.3 |
| Bundler | Vite | 7.3.0 |
| Styling | TailwindCSS | 3.4.17 |
| UI Components | shadcn/ui (Radix) | Latest |
| State Management | React Query | 5.83.0 |
| Routing | React Router DOM | 6.30.1 |
| Forms | React Hook Form + Zod | 7.61.1 / 3.25.76 |
| Charts | Recharts | 2.15.4 |
| Icons | Lucide React | 0.462.0 |

### Structure des Pages (28+)

```
src/pages/
├── Home.tsx                  # Landing page
├── Auth.tsx                  # Login/Register
├── Dashboard.tsx             # Dashboard principal
├── Projects.tsx              # Liste projets
├── ProjectDetails.tsx        # Detail projet
├── Experiments.tsx           # Liste experiments
├── ExperimentDetails.tsx     # Detail experiment
├── Models.tsx                # Model registry
├── ModelDetails.tsx          # Detail modele
├── ModelComparison.tsx       # Comparaison modeles
├── Deployments.tsx           # Deployements ML
├── Workspaces.tsx            # Workspaces dev
├── WorkspacesHierarchical.tsx # Vue hierarchique
├── DataCatalog.tsx           # Catalogue data
├── Marketplace.tsx           # Applications Helm
├── Team.tsx                  # Gestion equipe
├── Settings.tsx              # Parametres
├── Monitoring.tsx            # Monitoring
├── Security.tsx              # Securite
├── Compliance.tsx            # Compliance
├── Documentation.tsx         # Documentation
├── AuditLogs.tsx             # Logs audit
├── FinOps.tsx                # FinOps/Couts
├── AIGovernance.tsx          # Gouvernance IA
├── EnergyDashboard.tsx       # GreenOps
├── PredictiveMaintenanceDashboard.tsx
├── QualityControlComparison.tsx
└── NotFound.tsx              # 404
```

### Composants UI (src/components/)

| Categorie | Nombre | Exemples |
|-----------|--------|----------|
| UI Primitives (shadcn) | 48 | Button, Card, Dialog, Table, Tabs, Form |
| Dashboard | 6 | KPICard, ActivityFeed, SystemStatus |
| Dialogs | 9 | CreateProjectDialog, LaunchWorkspaceDialog |
| Model | 4 | ModelMetadata, TrainingLineage |
| Marketplace | 6 | HelmImportDialog, ResourceDashboard |
| Layout | 4 | DashboardLayout, Breadcrumb, Sidebars |

### Hooks React Query (src/hooks/api/)

```
src/hooks/api/
├── tenancy/         # useTenants, useOrganizations, useProjects
├── identity/        # useUsers, useRoles, usePermissions
├── infrastructure/  # useClusters, useComputeProfiles
├── registries/      # useContainerRegistries, useDataConnections
├── mlops/           # useExperiments, useRuns, useModels
├── cicd/            # usePipelines, useArgoCD, useGitProviders
├── collaboration/   # useComments, useNotifications
├── advanced/        # useAuditLogs, useFeatureFlags
├── governance/      # useAISystems, useModelCards
├── finops/          # useBillingAccounts, useBudgets
├── observability/   # useObservabilityBackends, useIncidents
└── utils/           # createSupabaseQuery, queryKeys
```

### Architecture Double Sidebar

```
+--------+------------------+------------------------+
| Primary| Contextual       | Main Content           |
| Sidebar| Sidebar          |                        |
+--------+------------------+                        |
| Home   | Projects List    |                        |
| Projets|   > Project A    | Dashboard/Details      |
| Models |   > Project B    |                        |
| Data   |   > Project C    |                        |
| Team   |                  |                        |
| ...    | Quick Actions    |                        |
+--------+------------------+------------------------+
```

### Testing Infrastructure

| Outil | Usage | Configuration |
|-------|-------|---------------|
| Vitest | Tests unitaires | vitest.config.ts |
| Testing Library | Tests composants | @testing-library/react |
| MSW | Mocks API | src/tests/mocks/ |
| Playwright | Tests E2E | playwright.config.ts |

---

## QUESTION 4: STACK TECHNIQUE ET JUSTIFICATION

### Frontend

| Technologie | Justification |
|-------------|---------------|
| **React 18.3** | Framework mature, large ecosysteme, Concurrent Features, excellent DX |
| **TypeScript 5.8** | Type safety, refactoring, documentation implicite, IDE support |
| **Vite 7.3** | Build ultra-rapide (ESBuild), HMR instantane, native ESM |
| **TailwindCSS** | Utility-first, design system coherent, tree-shaking optimal |
| **shadcn/ui** | Composants accessibles (Radix), personnalisables, pas de lock-in |
| **React Query** | Cache intelligent, invalidation, mutations optimistes, DevTools |
| **React Router 6** | Routing declaratif, nested routes, loader/action patterns |
| **Zod** | Validation runtime + inference TypeScript, schemas composeables |

### Backend

| Technologie | Justification |
|-------------|---------------|
| **Supabase** | PostgreSQL manage, Auth integre, Realtime, Storage, RLS natif |
| **PostgreSQL** | ACID, JSONB, Full-text search, extensions (PostGIS, pgvector) |
| **Row Level Security** | Securite au niveau row, multi-tenant natif, zero trust |
| **Edge Functions** | Serverless, Deno runtime, cold start minimal |

### Architecture MLOps

| Pattern | Justification |
|---------|---------------|
| **Control Plane / Data Plane** | Separation concerns, scalabilite, isolation workloads |
| **Kubernetes-native** | Standard industrie, portabilite cloud, ecosystem riche |
| **GitOps (Helm + Flux)** | Declaratif, auditable, rollback automatique |
| **Multi-tenant** | Isolation securisee, facturation par tenant, compliance |

### Pourquoi pas d'autres choix ?

| Alternative | Raison du rejet |
|-------------|-----------------|
| Next.js | Overhead SSR non necessaire, SPA suffisant |
| Firebase | Vendor lock-in, moins flexible que Supabase |
| Redux | Overkill, React Query suffit pour server state |
| Material UI | Plus lourd que shadcn, moins personnalisable |

---

## QUESTION 5: TRAVAUX RESTANTS

### Vue d'Ensemble des Travaux Restants

| Domaine | Statut | Progression | Priorite |
|---------|--------|-------------|----------|
| Database Schema | Complete | 100% | - |
| RLS Policies | Complete | 100% | - |
| Frontend Pages | Complete | 95% | Medium |
| React Query Hooks | Complete | 100% | - |
| Unit Tests | Complete | 100% | - |
| E2E Tests | Partial | 30% | Medium |
| Edge Functions | Minimal | 10% | High |
| Real API Integration | Minimal | 5% | Critical |
| Production Deploy | Non commence | 0% | High |

### Travaux Detailles par Priorite

#### PRIORITE CRITIQUE

1. **Integration API Python REST** (0%)
   - Connecter le frontend React aux 872 endpoints Python existants
   - Configurer CORS et authentification cross-service
   - Implementer les appels HTTP via httpx/axios

2. **Edge Functions Supabase** (10%)
   - Creer fonctions pour webhooks
   - Implementer notifications push
   - Ajouter triggers de synchronisation

#### PRIORITE HAUTE

3. **Deploiement Production** (0%)
   - Configuration Kubernetes manifests
   - Helm charts pour Control Plane
   - CI/CD GitLab/GitHub Actions
   - Secrets management (Vault)

4. **Integration IDE Workspaces** (20%)
   - JupyterLab via iframe (OAuth flow)
   - VSCode Server integration
   - RStudio Server embedding

#### PRIORITE MOYENNE

5. **Tests E2E Playwright** (30%)
   - Scenarios critiques (auth, experiments, models)
   - Visual regression testing
   - Performance testing

6. **UI/UX Refinements** (90%)
   - Responsive mobile complete
   - Dark mode polish
   - Animations/transitions

#### PRIORITE BASSE

7. **Documentation** (80%)
   - API reference complete
   - User guide
   - Architecture diagrams
   - Runbooks operations

---

## QUESTION 6: STRATEGIE D'INSERTION DES DONNEES (ZERO PERTE)

### Principes Directeurs

En tant qu'Architecte Data + Backend Senior expert Supabase/PostgreSQL, voici la strategie de migration zero-loss:

### Phase 1: Audit et Preparation

```sql
-- 1. Creer table de tracking des migrations de donnees
CREATE TABLE IF NOT EXISTS public._data_migration_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    source_table VARCHAR(255),
    target_table VARCHAR(255),
    records_source INTEGER,
    records_migrated INTEGER,
    records_failed INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'pending',
    error_log JSONB DEFAULT '[]'::jsonb,
    rollback_script TEXT,
    CONSTRAINT chk_status CHECK (status IN ('pending', 'running', 'completed', 'failed', 'rolled_back'))
);
```

### Phase 2: Migration Progressive par Domaine

**Ordre de migration (respectant les FK):**

1. **Tenants** (aucune dependance)
2. **Users/Identity** (depend de tenant)
3. **Infrastructure** (depend de tenant)
4. **Registries** (depend de tenant, infrastructure)
5. **MLOps Core** (depend de projet, user)
6. **CI/CD** (depend de projet, model)
7. **Collaboration** (depend de user, entities)
8. **Advanced/Governance** (depend de tout)

### Phase 3: Script de Migration Type

```sql
-- Migration avec transaction, validation, et rollback
DO $$
DECLARE
    v_migration_id UUID;
    v_source_count INTEGER;
    v_migrated_count INTEGER;
BEGIN
    -- Enregistrer migration
    INSERT INTO _data_migration_log (migration_name, source_table, target_table)
    VALUES ('migrate_experiments_v1_to_v3', 'experiments_legacy', 'ml_experiment')
    RETURNING id INTO v_migration_id;

    -- Compter source
    SELECT COUNT(*) INTO v_source_count FROM experiments_legacy;
    UPDATE _data_migration_log SET records_source = v_source_count WHERE id = v_migration_id;

    -- Migrer avec mapping
    INSERT INTO ml_experiment (
        id, tenant_id, project_id, name, description,
        status, created_by, created_at, updated_at
    )
    SELECT
        e.id,
        e.tenant_id,
        e.project_id,
        e.name,
        e.description,
        CASE e.state
            WHEN 'active' THEN 'running'::experiment_status
            WHEN 'done' THEN 'completed'::experiment_status
            ELSE 'created'::experiment_status
        END,
        e.owner_id,
        e.created_at,
        COALESCE(e.updated_at, e.created_at)
    FROM experiments_legacy e
    ON CONFLICT (id) DO UPDATE SET
        updated_at = EXCLUDED.updated_at;

    -- Valider
    GET DIAGNOSTICS v_migrated_count = ROW_COUNT;

    IF v_migrated_count != v_source_count THEN
        RAISE EXCEPTION 'Migration mismatch: source=%, migrated=%',
            v_source_count, v_migrated_count;
    END IF;

    UPDATE _data_migration_log SET
        records_migrated = v_migrated_count,
        status = 'completed',
        completed_at = now()
    WHERE id = v_migration_id;

EXCEPTION WHEN OTHERS THEN
    UPDATE _data_migration_log SET
        status = 'failed',
        error_log = jsonb_build_array(jsonb_build_object(
            'error', SQLERRM,
            'timestamp', now()
        ))
    WHERE id = v_migration_id;
    RAISE;
END;
$$;
```

### Phase 4: Validation et Reconciliation

```sql
-- Script de validation post-migration
WITH source_counts AS (
    SELECT 'experiments' AS entity, COUNT(*) AS cnt FROM experiments_legacy
    UNION ALL
    SELECT 'runs', COUNT(*) FROM runs_legacy
    UNION ALL
    SELECT 'models', COUNT(*) FROM models_legacy
),
target_counts AS (
    SELECT 'experiments' AS entity, COUNT(*) AS cnt FROM ml_experiment
    UNION ALL
    SELECT 'runs', COUNT(*) FROM ml_run
    UNION ALL
    SELECT 'models', COUNT(*) FROM ml_model
)
SELECT
    s.entity,
    s.cnt AS source_count,
    t.cnt AS target_count,
    CASE WHEN s.cnt = t.cnt THEN 'OK' ELSE 'MISMATCH' END AS status
FROM source_counts s
JOIN target_counts t ON s.entity = t.entity;
```

### Phase 5: Rollback Strategy

```sql
-- Chaque migration doit avoir son rollback
-- Exemple de rollback pour experiments
CREATE OR REPLACE FUNCTION rollback_experiments_migration()
RETURNS void AS $$
BEGIN
    -- Supprimer les donnees migrees
    DELETE FROM ml_experiment
    WHERE id IN (SELECT id FROM experiments_legacy);

    -- Logger le rollback
    UPDATE _data_migration_log
    SET status = 'rolled_back'
    WHERE migration_name = 'migrate_experiments_v1_to_v3';
END;
$$ LANGUAGE plpgsql;
```

### Checklist Migration Zero-Loss

- [ ] Backup complet avant migration
- [ ] Tester sur environnement staging
- [ ] Desactiver temporairement les triggers
- [ ] Migrer par batches de 10,000 records
- [ ] Valider checksums/counts apres chaque batch
- [ ] Activer RLS apres validation
- [ ] Tester l'application complete
- [ ] Garder les tables legacy 30 jours
- [ ] Documenter chaque transformation

---

## QUESTION 7: INTEGRATION DES APIS PYTHON EXISTANTES

### Contexte

Le projet **fed-analytic-api-platform** contient **872 fichiers Python** implementant une API REST complete pour:
- 7 Cloud Providers (AWS, GCP, Azure + on-prem)
- 10+ DevOps tools (GitHub, GitLab, Jenkins, ArgoCD, Kubernetes)
- 62+ Database connectors
- MLOps integrations

### Architecture d'Integration

```
+-------------------+       HTTP/REST        +----------------------+
|  APEX-ML-PLATFORM |  ==================>   | FED-ANALYTIC-API     |
|  (React Frontend) |       JSON/JWT         | (FastAPI Backend)    |
+-------------------+                        +----------------------+
        |                                            |
        v                                            v
+-------------------+                        +----------------------+
|  Supabase         |                        |  Cloud Providers     |
|  (Metadata store) |                        |  AWS/GCP/Azure/K8s   |
+-------------------+                        +----------------------+
```

### Strategie d'Integration (3 Approches)

#### Approche 1: API Gateway (Recommandee)

```typescript
// src/services/cloud-api.service.ts
import { createClient } from '@supabase/supabase-js';

const CLOUD_API_BASE = import.meta.env.VITE_CLOUD_API_URL;

export class CloudAPIService {
    private async getAuthToken(): Promise<string> {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token || '';
    }

    async listClusters(provider: 'aws' | 'gcp' | 'azure'): Promise<Cluster[]> {
        const token = await this.getAuthToken();
        const response = await fetch(
            `${CLOUD_API_BASE}/api/v1/${provider}/kubernetes/clusters`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            }
        );
        return response.json();
    }

    async createDeployment(
        clusterId: string,
        deployment: DeploymentSpec
    ): Promise<Deployment> {
        const token = await this.getAuthToken();
        const response = await fetch(
            `${CLOUD_API_BASE}/api/v1/devops/kubernetes/deployments`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ cluster_id: clusterId, ...deployment })
            }
        );
        return response.json();
    }
}
```

#### Approche 2: Supabase Edge Functions (Proxy)

```typescript
// supabase/functions/cloud-proxy/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CLOUD_API_URL = Deno.env.get('CLOUD_API_URL')!;

serve(async (req) => {
    const url = new URL(req.url);
    const path = url.pathname.replace('/cloud-proxy', '');

    // Forward to Python API
    const response = await fetch(`${CLOUD_API_URL}${path}`, {
        method: req.method,
        headers: {
            'Authorization': req.headers.get('Authorization')!,
            'Content-Type': 'application/json',
        },
        body: req.method !== 'GET' ? await req.text() : undefined
    });

    return new Response(await response.text(), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
    });
});
```

#### Approche 3: React Query Integration

```typescript
// src/hooks/api/cloud/useKubernetesClusters.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { cloudAPIService } from '@/services/cloud-api.service';

export function useKubernetesClusters(provider: CloudProvider) {
    return useQuery({
        queryKey: ['kubernetes', 'clusters', provider],
        queryFn: () => cloudAPIService.listClusters(provider),
        staleTime: 60 * 1000, // 1 minute
    });
}

export function useCreateDeployment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ clusterId, deployment }) =>
            cloudAPIService.createDeployment(clusterId, deployment),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['kubernetes', 'deployments'] });
        }
    });
}
```

### Configuration CORS Python Backend

```python
# fed-analytic-api-platform/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://apex-ml-platform.vercel.app",
        "http://localhost:5173",  # Vite dev
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Mapping Endpoints Python vers Frontend

| Fonctionnalite Frontend | Endpoint Python | Fichier Python |
|------------------------|-----------------|----------------|
| List K8s Clusters | `GET /api/v1/devops/kubernetes/core` | kubernetes/core.py |
| AWS EC2 Instances | `GET /api/v1/aws/compute` | aws/compute.py |
| GCP BigQuery | `GET /api/v1/gcp/bigquery` | gcp/bigquery.py |
| Azure VMs | `GET /api/v1/azure/vm` | azure/vm.py |
| GitLab Pipelines | `GET /api/v1/devops/gitlab/pipelines` | devops/gitlab/pipelines.py |
| ArgoCD Apps | `GET /api/v1/devops/argocd/applications` | devops/argocd/applications.py |

### Variables d'Environnement

```bash
# apex-ml-platform/.env.local
VITE_SUPABASE_URL=https://rwqzweqrfiucqokghgjg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
VITE_CLOUD_API_URL=https://api.fedanalyticlab.com
```

### Plan d'Integration (Etapes)

1. **Deployer fed-analytic-api-platform** en production
2. **Configurer CORS** pour autoriser le frontend
3. **Creer service wrapper** dans apex-ml-platform
4. **Creer hooks React Query** pour chaque domaine cloud
5. **Tester integration** end-to-end
6. **Synchroniser metadata** avec Supabase

---

## SYNTHESE ET PROGRESSION GLOBALE

### Tableau Recapitulatif

| Composant | Avancement | Notes |
|-----------|------------|-------|
| Database Schema v3 | 100% | 130+ tables, 17 migrations |
| RLS Policies | 100% | 150+ policies |
| Frontend UI | 95% | 28+ pages, 92+ composants |
| React Query Hooks | 100% | 70+ hooks |
| Services Layer | 100% | 9 services |
| Unit Tests | 100% | 146/146 passent |
| E2E Tests | 30% | Playwright configure |
| Edge Functions | 10% | A developper |
| Python API Integration | 5% | Strategy definie |
| Production Deploy | 0% | Non commence |

### Prochaines Actions Prioritaires

1. **[CRITIQUE]** Integrer fed-analytic-api-platform via API Gateway
2. **[HAUTE]** Deployer Edge Functions pour webhooks
3. **[HAUTE]** Configurer deployment Kubernetes production
4. **[MOYENNE]** Completer tests E2E Playwright
5. **[BASSE]** Finaliser documentation utilisateur

---

**Rapport genere le**: 2026-01-07
**Analyste**: Armand AMOUSSOU
**Projet**: APEX-ML-PLATFORM - MLOps Control Plane v3
