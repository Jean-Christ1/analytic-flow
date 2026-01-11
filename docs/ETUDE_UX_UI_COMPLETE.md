# Étude UX/UI Complète - APEX ML PLATFORM

**Date:** 2026-01-03
**Version:** 1.0
**Objectif:** Analyse exhaustive de toutes les pages et onglets du frontend

---

## VUE D'ENSEMBLE

### Structure de Navigation

```
APEX ML PLATFORM
├── Dashboard (4 onglets)
├── Projects (liste + détails)
│   └── ProjectDetails (5 onglets)
├── Experiments (2 vues)
│   └── ExperimentDetails (4 onglets)
├── Models (2 vues)
│   └── ModelDetails (5 onglets)
├── Deployments (liste + filtres)
├── Workspaces (2 vues) ⚠️ À AMÉLIORER
├── Monitoring (6 onglets)
├── DataCatalog (3 onglets)
├── FinOps (4 onglets)
├── Marketplace (4 onglets)
├── Governance
│   ├── Users Management
│   ├── Roles Management
│   └── Permissions Management
├── Compliance
├── Security
├── AuditLogs
└── Settings
```

---

## 1. DASHBOARD

### État Actuel
| Élément | Status | Notes |
|---------|:------:|-------|
| Layout | ✅ | 4 onglets fonctionnels |
| KPI Cards | ✅ | 6 métriques avec tooltips |
| Activity Feed | ✅ | Liste d'activités récentes |
| Charts | ✅ | Graphiques temps réel (mock) |
| Refresh | ❌ | Pas de refresh automatique |

### 4 Onglets
1. **Overview** - Vue d'ensemble avec KPIs
2. **Projects** - Grille des projets récents
3. **Activity** - Feed d'activités
4. **Resources** - Utilisation infrastructure

### KPI Cards Affichées
- Total Models
- Active Experiments
- Deployments
- Data Processed
- Monthly Cost
- Carbon Footprint

### Améliorations Suggérées
- [ ] WebSocket pour refresh temps réel
- [ ] Graphiques interactifs cliquables
- [ ] Personnalisation du dashboard (drag & drop widgets)
- [ ] Date range picker pour les graphiques
- [ ] Export en PDF/PNG

### APIs Requises
```
GET  /api/v1/dashboard/overview
GET  /api/v1/dashboard/activity?limit=10
GET  /api/v1/dashboard/metrics?range=7d
GET  /api/v1/dashboard/resources
WS   /api/v1/ws/dashboard/realtime
```

---

## 2. PROJECTS

### Page Liste
| Élément | Status | Notes |
|---------|:------:|-------|
| Grid View | ✅ | Cards avec infos projet |
| List View | ✅ | Table alternative |
| Search | ✅ | Recherche par nom |
| Filters | ✅ | Status, favoris, récents |
| Pagination | ✅ | 4 items/page |
| Create Dialog | ✅ | Dialog mais non fonctionnel |

### ProjectDetails (5 Onglets)
1. **Overview** - Résumé projet, équipe, ressources
2. **Models** - Liste des modèles du projet
3. **Experiments** - Expériences liées
4. **Pipelines** - DAGs de pipelines (mock)
5. **Settings** - Configuration projet

### Champs Affichés
- Nom, Description, Status
- Team Members (avatars)
- Progress (%)
- Monthly Cost
- Carbon Emissions
- GPU/CPU allocation
- Models count
- Experiments count

### Améliorations Suggérées
- [ ] CRUD complet (Create/Edit/Delete)
- [ ] Invitation de membres
- [ ] Clone de projet
- [ ] Archive de projet
- [ ] Historique des modifications
- [ ] Tags personnalisés
- [ ] Budget alerts

### APIs Requises
```
GET    /api/v1/projects
GET    /api/v1/projects/:id
POST   /api/v1/projects
PUT    /api/v1/projects/:id
DELETE /api/v1/projects/:id
GET    /api/v1/projects/:id/members
POST   /api/v1/projects/:id/members
DELETE /api/v1/projects/:id/members/:userId
GET    /api/v1/projects/:id/models
GET    /api/v1/projects/:id/experiments
GET    /api/v1/projects/:id/pipelines
GET    /api/v1/projects/:id/settings
PUT    /api/v1/projects/:id/settings
```

---

## 3. EXPERIMENTS

### Page Liste
| Élément | Status | Notes |
|---------|:------:|-------|
| By Project View | ✅ | Groupé par projet collapsible |
| Table View | ✅ | Vue liste classique |
| Status Tabs | ✅ | All/Completed/Running/Failed |
| Sparklines | ✅ | Mini graphiques accuracy |
| Create Dialog | ✅ | NewExperimentDialog |
| Compare | ✅ | Lien vers comparaison |

### Stats Cards (4)
- Total Experiments
- Completed
- Running
- Failed

### ExperimentDetails (4 Onglets)
1. **Overview** - Métriques, hyperparams
2. **Metrics** - Graphiques détaillés
3. **Logs** - Console logs
4. **Datasets** - Données utilisées

### Métriques Affichées
- Accuracy (%)
- Loss
- F1 Score
- Duration
- Created At
- Author

### Améliorations Suggérées
- [ ] Lancer experiment depuis UI
- [ ] Stop/Cancel en cours
- [ ] Duplicate experiment
- [ ] Export metrics CSV
- [ ] Compare side-by-side (jusqu'à 4)
- [ ] Hyperparameter search UI
- [ ] Integration MLflow réelle

### APIs Requises
```
GET    /api/v1/experiments
GET    /api/v1/experiments/:id
POST   /api/v1/experiments
POST   /api/v1/experiments/:id/start
POST   /api/v1/experiments/:id/stop
GET    /api/v1/experiments/:id/metrics
GET    /api/v1/experiments/:id/logs
GET    /api/v1/experiments/:id/artifacts
POST   /api/v1/experiments/compare
```

---

## 4. MODELS

### Page Liste
| Élément | Status | Notes |
|---------|:------:|-------|
| Grid View | ✅ | Cards avec métriques |
| Registry View | ✅ | ModelVersionRegistry |
| Stage Tabs | ✅ | All/Prod/Staging/Dev |
| Search | ✅ | Par nom |
| Import/Register | ✅ | Buttons (non fonctionnels) |
| Compare | ✅ | Lien vers comparaison |

### Stats Cards (4)
- Total Models
- In Production
- Daily Requests
- Avg Latency

### ModelDetails (5 Onglets)
1. **Overview** - Infos modèle, versions
2. **Versions** - Historique versions
3. **Performance** - Métriques déploiement
4. **Drift** - Détection de drift
5. **Lineage** - Graphe de lignée

### Champs par Modèle
- Name, Description
- Framework (PyTorch, TensorFlow, etc.)
- Stage (Production/Staging/Dev)
- Latest Version
- Accuracy, Latency
- Versions count
- Deployments count
- Author, Last Updated

### Améliorations Suggérées
- [ ] Upload modèle (fichier + métadonnées)
- [ ] Version management (promote/demote)
- [ ] Deploy to endpoint
- [ ] A/B testing setup
- [ ] Model card generation
- [ ] ONNX export
- [ ] Drift monitoring réel

### APIs Requises
```
GET    /api/v1/models
GET    /api/v1/models/:id
POST   /api/v1/models
POST   /api/v1/models/:id/versions
GET    /api/v1/models/:id/versions
PUT    /api/v1/models/:id/versions/:version
DELETE /api/v1/models/:id
GET    /api/v1/models/:id/metrics
GET    /api/v1/models/:id/drift
GET    /api/v1/models/:id/lineage
POST   /api/v1/models/:id/deploy
POST   /api/v1/models/:id/promote
```

---

## 5. WORKSPACES (⚠️ À AMÉLIORER SIGNIFICATIVEMENT)

### État Actuel
| Élément | Status | Notes |
|---------|:------:|-------|
| Workspace Cards | ✅ | Affichage basique |
| Resource Display | ✅ | CPU, Memory, GPU, Storage |
| Status Badges | ✅ | Running/Paused/Stopped |
| Start/Stop | ⚠️ | Buttons présents, non fonctionnels |
| IDE Integration | ❌ | **MANQUANT - Priorité haute** |
| Terminal | ❌ | **MANQUANT** |
| File Browser | ❌ | **MANQUANT** |

### Ce qui MANQUE (Comme Domino Data Lab)

#### 5.1 IDE Workbench
```
┌─────────────────────────────────────────────────────────────────┐
│  WORKSPACE: fraud-detection-workspace                     [x]   │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│ │JupyterLab│ │ VS Code │ │ RStudio │ │Terminal │ │ Files   │    │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │         [EMBEDDED IDE IFRAME]                           │    │
│  │                                                         │    │
│  │  - JupyterLab: /workspace/:id/jupyter                   │    │
│  │  - VS Code:    /workspace/:id/vscode                    │    │
│  │  - RStudio:    /workspace/:id/rstudio                   │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│  Resources: CPU 4/8 | Memory 16GB/32GB | GPU 1x A100 | 50GB     │
└─────────────────────────────────────────────────────────────────┘
```

#### 5.2 Fonctionnalités Manquantes

**IDE Integration**
- [ ] JupyterLab embedded (iframe ou redirect)
- [ ] VS Code Server embedded
- [ ] RStudio Server embedded
- [ ] Terminal web (xterm.js)
- [ ] File browser avec upload/download

**Workspace Management**
- [ ] Create workspace wizard
  - Nom, Description
  - Image selection (CPU, GPU, custom)
  - Resource allocation
  - Environment variables
  - Git clone auto
- [ ] Start/Stop/Pause réels
- [ ] Snapshot/Restore
- [ ] Schedule auto-shutdown
- [ ] Shared workspaces (collaboration)

**Resource Monitoring**
- [ ] CPU/Memory/GPU temps réel
- [ ] Disk usage
- [ ] Network I/O
- [ ] Cost tracking en cours

### Page Cible (WorkspacesHierarchical)

```
/workspaces
├── Quick Launch (cards IDE types)
├── My Workspaces (liste)
│   ├── Running (expandable)
│   ├── Paused
│   └── Stopped
├── Shared With Me
└── Templates
```

### APIs Requises
```
GET    /api/v1/workspaces
GET    /api/v1/workspaces/:id
POST   /api/v1/workspaces
DELETE /api/v1/workspaces/:id
POST   /api/v1/workspaces/:id/start
POST   /api/v1/workspaces/:id/stop
POST   /api/v1/workspaces/:id/pause
POST   /api/v1/workspaces/:id/snapshot
GET    /api/v1/workspaces/:id/metrics
GET    /api/v1/workspaces/:id/logs
GET    /api/v1/workspaces/:id/files
POST   /api/v1/workspaces/:id/files/upload
GET    /api/v1/workspaces/:id/files/download
GET    /api/v1/workspaces/:id/terminal/ws  (WebSocket)
GET    /api/v1/workspaces/templates
GET    /api/v1/workspaces/images
```

---

## 6. DEPLOYMENTS

### État Actuel
| Élément | Status | Notes |
|---------|:------:|-------|
| Deployment Cards | ✅ | Liste compacte |
| Status Tabs | ✅ | All/Healthy/Degraded/Failed |
| Metrics Display | ✅ | Requests, Latency, Replicas |
| Scaling Bar | ✅ | Progress bar CPU |
| Actions Menu | ✅ | View/Scale/Rollback/Stop |

### Stats Cards (4)
- Total Endpoints
- Healthy
- Requests/day
- Avg Latency

### Champs par Deployment
- Name, Model, Project
- Status (healthy/degraded/failed)
- Region
- Requests, Latency
- Replicas count
- CPU scaling (current/max)
- Updated At

### Améliorations Suggérées
- [ ] Create deployment wizard
- [ ] Scale replicas UI
- [ ] Rollback version UI
- [ ] Canary deployment
- [ ] A/B testing config
- [ ] Traffic split visualization
- [ ] Real-time metrics (WebSocket)
- [ ] Logs streaming
- [ ] Alerts configuration

### APIs Requises
```
GET    /api/v1/deployments
GET    /api/v1/deployments/:id
POST   /api/v1/deployments
DELETE /api/v1/deployments/:id
POST   /api/v1/deployments/:id/scale
POST   /api/v1/deployments/:id/rollback
POST   /api/v1/deployments/:id/stop
GET    /api/v1/deployments/:id/metrics
GET    /api/v1/deployments/:id/logs
WS     /api/v1/ws/deployments/:id/logs
POST   /api/v1/deployments/:id/canary
PUT    /api/v1/deployments/:id/traffic-split
```

---

## 7. MONITORING

### État Actuel (6 Onglets)
| Onglet | Status | Notes |
|--------|:------:|-------|
| Models | ✅ | Accuracy/Latency charts |
| Data Drift | ✅ | PSI metrics, drift status |
| Data Quality | ✅ | 6 quality metrics |
| Infrastructure | ✅ | CPU/Memory/GPU charts |
| Traces | ✅ | Distributed traces list |
| Alerts | ✅ | Liste des alertes |

### Stats Cards (5)
- System Health
- Active Alerts
- Avg Latency
- Uptime
- Active Models

### Composants par Onglet

**Models Tab**
- Model Accuracy AreaChart (24h)
- Inference Latency LineChart

**Data Drift Tab**
- PSI Score AreaChart
- Model Drift Status cards (4 models)

**Data Quality Tab**
- 6 Quality Metrics cards (Completeness, Accuracy, etc.)
- Data Validation Rules list

**Infrastructure Tab**
- CPU & Memory AreaChart
- GPU Utilization AreaChart

**Traces Tab**
- Distributed Traces list (trace ID, service, duration, spans)

**Alerts Tab**
- Alerts list avec severity/status badges

### Améliorations Suggérées
- [ ] Custom time range picker
- [ ] Drill-down dans les métriques
- [ ] Alert rules configuration
- [ ] Slack/Email notifications setup
- [ ] Dashboard personnalisable
- [ ] Export metrics
- [ ] SLO/SLI configuration

### APIs Requises
```
GET  /api/v1/monitoring/models
GET  /api/v1/monitoring/models/:id/metrics?range=24h
GET  /api/v1/monitoring/drift
GET  /api/v1/monitoring/drift/:modelId
GET  /api/v1/monitoring/quality
GET  /api/v1/monitoring/quality/rules
GET  /api/v1/monitoring/infrastructure
GET  /api/v1/monitoring/traces?limit=20
GET  /api/v1/monitoring/traces/:traceId
GET  /api/v1/monitoring/alerts
POST /api/v1/monitoring/alerts/:id/acknowledge
POST /api/v1/monitoring/alerts/:id/resolve
GET  /api/v1/monitoring/alerts/rules
POST /api/v1/monitoring/alerts/rules
WS   /api/v1/ws/monitoring/realtime
```

---

## 8. DATA CATALOG

### État Actuel (3 Onglets)
| Onglet | Status | Notes |
|--------|:------:|-------|
| Catalog | ✅ | Table des datasets |
| Lineage | ✅ | DataLineageGraph |
| Policies | ✅ | Liste des politiques |

### Stats Cards (4)
- Total Assets
- PII Detected
- Data Quality
- Pending Review

### Champs par Dataset
- Name, Schema, Version
- Project link
- Classification (Public/Sensitive/Regulated/Restricted)
- PII indicator
- Quality score (%)
- Last Updated
- Format, Size, Records

### Améliorations Suggérées
- [ ] Register new dataset
- [ ] Dataset preview (sample rows)
- [ ] Schema explorer
- [ ] Column-level lineage
- [ ] Data profiling
- [ ] Access request workflow
- [ ] PII detection auto
- [ ] Schema versioning

### APIs Requises
```
GET    /api/v1/datasets
GET    /api/v1/datasets/:id
POST   /api/v1/datasets
PUT    /api/v1/datasets/:id
DELETE /api/v1/datasets/:id
GET    /api/v1/datasets/:id/preview?limit=100
GET    /api/v1/datasets/:id/schema
GET    /api/v1/datasets/:id/profile
GET    /api/v1/datasets/:id/lineage
GET    /api/v1/datasets/policies
POST   /api/v1/datasets/policies
PUT    /api/v1/datasets/policies/:id
```

---

## 9. FINOPS

### État Actuel (4 Onglets)
| Onglet | Status | Notes |
|--------|:------:|-------|
| Overview | ✅ | Cost trend + pie chart |
| By Project | ✅ | Liste projets avec coûts |
| Savings | ✅ | Recommendations |
| Carbon | ✅ | Emissions bar chart |

### Stats Cards (5)
- Monthly Cost
- CO2 Emissions
- Energy (kWh)
- Potential Savings
- Budget Used

### Graphiques
- Cost Trend (14 days) - AreaChart stacked
- Cost by Project - PieChart
- Carbon Emissions vs Target - BarChart

### Recommendations Affichées
- Reserved Instances
- Spot Instances
- Rightsizing
- Storage Optimization

### Améliorations Suggérées
- [ ] Real cloud cost APIs (AWS Cost Explorer, etc.)
- [ ] Budget configuration
- [ ] Cost alerts
- [ ] Apply recommendations auto
- [ ] Cost forecasting
- [ ] Chargeback reports
- [ ] Carbon offset tracking

### APIs Requises
```
GET  /api/v1/finops/overview
GET  /api/v1/finops/costs?range=14d
GET  /api/v1/finops/costs/by-project
GET  /api/v1/finops/costs/by-resource
GET  /api/v1/finops/recommendations
POST /api/v1/finops/recommendations/:id/apply
GET  /api/v1/finops/carbon
GET  /api/v1/finops/budget
PUT  /api/v1/finops/budget
GET  /api/v1/finops/forecast
```

---

## 10. MARKETPLACE

### État Actuel (4 Onglets)
| Onglet | Status | Notes |
|--------|:------:|-------|
| Applications | ✅ | 69 apps, 11 catégories |
| Featured | ✅ | Featured/Trending/New |
| Dependencies | ✅ | DependencyGraph (mock) |
| Resources | ✅ | ResourceDashboard (mock) |

### Stats Cards (4)
- Total Apps
- Running
- Installed
- Available

### Catégories (11)
1. MLOps (8 apps)
2. Data (9 apps)
3. Observability (7 apps)
4. Security (8 apps)
5. FinOps (5 apps)
6. GreenOps (4 apps)
7. Development (5 apps)
8. CI/CD (5 apps)
9. Testing (5 apps)
10. Infrastructure (7 apps)

### Actions par Application
- Install/Start/Stop/Update
- View Details
- Configure
- Backup/Restore
- View Logs

### Dialogs Présents
- HelmImportDialog
- BackupRestoreDialog
- ApplicationDetailsDialog
- ApplicationLogsDialog
- ApplicationConfigDialog

### Améliorations Suggérées
- [ ] Real Helm chart deployment
- [ ] App logs streaming
- [ ] Resource usage per app
- [ ] Dependency resolution
- [ ] Health checks
- [ ] Auto-update toggle
- [ ] Custom app registry

### APIs Requises
```
GET    /api/v1/marketplace/apps
GET    /api/v1/marketplace/apps/:id
POST   /api/v1/marketplace/apps/:id/install
POST   /api/v1/marketplace/apps/:id/uninstall
POST   /api/v1/marketplace/apps/:id/start
POST   /api/v1/marketplace/apps/:id/stop
POST   /api/v1/marketplace/apps/:id/update
GET    /api/v1/marketplace/apps/:id/config
PUT    /api/v1/marketplace/apps/:id/config
GET    /api/v1/marketplace/apps/:id/logs
WS     /api/v1/ws/marketplace/apps/:id/logs
POST   /api/v1/marketplace/apps/:id/backup
POST   /api/v1/marketplace/apps/:id/restore
GET    /api/v1/marketplace/dependencies
POST   /api/v1/marketplace/helm/import
```

---

## 11. GOVERNANCE

### Users Management
| Élément | Status | Notes |
|---------|:------:|-------|
| User List | ✅ | Table avec search |
| Role Badges | ✅ | Admin/Moderator/User/Viewer |
| Status | ✅ | Active/Pending/Deactivated |
| Actions | ⚠️ | Edit/Deactivate (non fonctionnel) |
| Admin Check | ✅ | AccessDenied component |

### Champs Utilisateur
- Avatar, Name, Email
- Role, Status
- Last Active
- Created At

### Améliorations Suggérées
- [ ] Invite user workflow
- [ ] Bulk actions
- [ ] User details page
- [ ] Activity log per user
- [ ] MFA management
- [ ] SSO/SAML integration

### APIs Requises
```
GET    /api/v1/users
GET    /api/v1/users/:id
POST   /api/v1/users/invite
PUT    /api/v1/users/:id
DELETE /api/v1/users/:id
PUT    /api/v1/users/:id/role
PUT    /api/v1/users/:id/status
GET    /api/v1/users/:id/activity
GET    /api/v1/roles
POST   /api/v1/roles
PUT    /api/v1/roles/:id
DELETE /api/v1/roles/:id
GET    /api/v1/permissions
```

---

## 12. COMPLIANCE & SECURITY

### Compliance Page (Skeleton)
- Compliance dashboards
- Audit checklist
- Certification status

### Security Page (Skeleton)
- Security posture
- Vulnerability scans
- Access reviews

### Améliorations Suggérées
- [ ] Compliance frameworks (SOC2, HIPAA, GDPR)
- [ ] Control status tracking
- [ ] Evidence collection
- [ ] Audit preparation
- [ ] Vulnerability dashboard
- [ ] Access review workflow

### APIs Requises
```
GET  /api/v1/compliance/frameworks
GET  /api/v1/compliance/controls
PUT  /api/v1/compliance/controls/:id
GET  /api/v1/compliance/audits
POST /api/v1/compliance/evidence
GET  /api/v1/security/vulnerabilities
GET  /api/v1/security/access-reviews
POST /api/v1/security/access-reviews
```

---

## RÉCAPITULATIF DES APIs NÉCESSAIRES

### Comptage par Domaine

| Domaine | Endpoints | Priorité |
|---------|:---------:|:--------:|
| Auth | 10 | P0 |
| Dashboard | 5 | P0 |
| Projects | 12 | P0 |
| Experiments | 10 | P0 |
| Models | 14 | P0 |
| Deployments | 14 | P0 |
| Workspaces | 18 | P1 |
| Monitoring | 16 | P1 |
| DataCatalog | 12 | P1 |
| FinOps | 10 | P2 |
| Marketplace | 16 | P2 |
| Governance | 15 | P1 |
| Compliance | 8 | P3 |
| **TOTAL** | **~160** | - |

### Priorités

**P0 - Critique (Sprint 1-2)**
- Auth/Users CRUD
- Projects CRUD
- Experiments CRUD
- Models CRUD
- Deployments CRUD

**P1 - Important (Sprint 3-4)**
- Workspaces + IDE
- Monitoring endpoints
- DataCatalog
- Governance

**P2 - Nice to Have (Sprint 5-6)**
- FinOps avec cloud APIs
- Marketplace avec Helm

**P3 - Future (Backlog)**
- Compliance
- Advanced Security

---

## COMPOSANTS UI MANQUANTS

### Globaux
- [ ] Global search (Cmd+K)
- [ ] Notifications panel
- [ ] User preferences
- [ ] Keyboard shortcuts
- [ ] Onboarding wizard

### Par Page
- [ ] Workspaces: IDE embed (iframe)
- [ ] Workspaces: Terminal (xterm.js)
- [ ] Workspaces: File browser
- [ ] Models: Upload modal
- [ ] Experiments: Run configuration
- [ ] Deployments: Traffic split UI
- [ ] Monitoring: Custom dashboard builder

---

## RECOMMANDATIONS POUR WORKSPACES (Priorité)

### Architecture Cible

```
Frontend (React)
└── WorkspacePage
    ├── WorkspaceHeader
    │   ├── Workspace Name + Status
    │   ├── IDE Selector Tabs
    │   └── Actions (Stop, Settings)
    ├── IDEContainer
    │   ├── JupyterEmbed (iframe → /jupyter/:id)
    │   ├── VSCodeEmbed (iframe → /vscode/:id)
    │   ├── RStudioEmbed (iframe → /rstudio/:id)
    │   └── TerminalEmbed (xterm.js WebSocket)
    ├── FileBrowser (sidebar)
    └── ResourceMonitor (footer)

Backend
├── JupyterHub (K8s)
├── code-server (VS Code)
├── RStudio Server
└── Workspace Proxy (routing)
```

### Étapes Implémentation

1. **Créer WorkspaceLauncher component**
   - Sélection type IDE
   - Configuration ressources
   - Git clone optionnel

2. **Créer IDEEmbed component**
   - Iframe avec URL dynamique
   - Loading state
   - Error handling
   - Full-screen toggle

3. **Créer TerminalEmbed component**
   - xterm.js integration
   - WebSocket connection
   - Multiple terminals

4. **Créer FileBrowser component**
   - Tree view
   - Upload/Download
   - Context menu

---

*Document généré le 2026-01-03*
