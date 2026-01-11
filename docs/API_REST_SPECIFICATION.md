# API REST Specification - APEX ML PLATFORM

**Version:** 1.0
**Date:** 2026-01-03
**Base URL:** `https://api.apex-ml.io/api/v1`

---

## VUE D'ENSEMBLE

### Statistiques
- **Total Endpoints:** ~160
- **Domaines:** 14
- **WebSocket Endpoints:** 8

### Authentication
```
Authorization: Bearer <jwt_token>
X-Tenant-ID: <tenant_uuid>  # Multi-tenancy
```

---

## 1. AUTHENTICATION & USERS

### Auth Endpoints
```http
POST   /auth/login
       Body: { email, password }
       Response: { access_token, refresh_token, user }

POST   /auth/register
       Body: { email, password, full_name }
       Response: { user, confirmation_required }

POST   /auth/logout
       Response: { success }

POST   /auth/refresh
       Body: { refresh_token }
       Response: { access_token, refresh_token }

POST   /auth/forgot-password
       Body: { email }
       Response: { message }

POST   /auth/reset-password
       Body: { token, new_password }
       Response: { success }

GET    /auth/me
       Response: { user, roles, permissions }

POST   /auth/mfa/enable
       Response: { qr_code, secret }

POST   /auth/mfa/verify
       Body: { code }
       Response: { success }

POST   /auth/mfa/disable
       Body: { code }
       Response: { success }
```

### Users Endpoints
```http
GET    /users
       Query: ?page=1&limit=20&status=active&role=admin&search=john
       Response: { users[], total, page, limit }

GET    /users/:id
       Response: { user }

POST   /users/invite
       Body: { email, role, projects[] }
       Response: { invitation_id }

PUT    /users/:id
       Body: { full_name, avatar_url }
       Response: { user }

PUT    /users/:id/role
       Body: { role_id }
       Response: { user }

PUT    /users/:id/status
       Body: { status: "active" | "deactivated" }
       Response: { user }

DELETE /users/:id
       Response: { success }

GET    /users/:id/activity
       Query: ?page=1&limit=50
       Response: { activities[], total }
```

---

## 2. PROJECTS

```http
GET    /projects
       Query: ?page=1&limit=20&status=active&search=fraud&favorites=true
       Response: {
         projects: [{
           id, name, description, status,
           team_members: [{ id, name, avatar, role }],
           resources: { gpu, cpu, memory, monthly_cost, carbon },
           model_count, experiment_count, progress,
           created_at, updated_at
         }],
         total, page, limit
       }

GET    /projects/:id
       Response: { project }

POST   /projects
       Body: {
         name, description,
         team_members: [{ user_id, role }],
         resources: { gpu, cpu, memory, storage },
         tags: []
       }
       Response: { project }

PUT    /projects/:id
       Body: { name, description, status, tags }
       Response: { project }

DELETE /projects/:id
       Response: { success }

POST   /projects/:id/archive
       Response: { project }

POST   /projects/:id/clone
       Body: { new_name }
       Response: { project }

# Team Management
GET    /projects/:id/members
       Response: { members[] }

POST   /projects/:id/members
       Body: { user_id, role }
       Response: { member }

PUT    /projects/:id/members/:userId
       Body: { role }
       Response: { member }

DELETE /projects/:id/members/:userId
       Response: { success }

# Related Resources
GET    /projects/:id/models
       Response: { models[] }

GET    /projects/:id/experiments
       Response: { experiments[] }

GET    /projects/:id/pipelines
       Response: { pipelines[] }

GET    /projects/:id/datasets
       Response: { datasets[] }

# Settings
GET    /projects/:id/settings
       Response: { settings }

PUT    /projects/:id/settings
       Body: { budget_limit, notifications, auto_shutdown }
       Response: { settings }
```

---

## 3. EXPERIMENTS

```http
GET    /experiments
       Query: ?project_id=xxx&status=running&author=user_id&page=1&limit=20
       Response: {
         experiments: [{
           id, name, project_id, project_name,
           status: "queued" | "running" | "completed" | "failed",
           metrics: { accuracy, loss, f1_score },
           hyperparameters: {},
           duration, author, created_at
         }],
         total, page, limit
       }

GET    /experiments/:id
       Response: { experiment }

POST   /experiments
       Body: {
         name, project_id,
         hyperparameters: { learning_rate, batch_size, epochs },
         dataset_id, model_config: {}
       }
       Response: { experiment }

POST   /experiments/:id/start
       Response: { experiment, job_id }

POST   /experiments/:id/stop
       Response: { experiment }

POST   /experiments/:id/clone
       Body: { new_name, modify_params: {} }
       Response: { experiment }

DELETE /experiments/:id
       Response: { success }

GET    /experiments/:id/metrics
       Query: ?step_interval=10
       Response: {
         metrics: [{ step, accuracy, loss, f1_score, timestamp }]
       }

GET    /experiments/:id/logs
       Query: ?tail=1000&level=info
       Response: { logs: [{ timestamp, level, message }] }

GET    /experiments/:id/artifacts
       Response: { artifacts: [{ name, path, size, type }] }

GET    /experiments/:id/artifacts/:name/download
       Response: binary file

POST   /experiments/compare
       Body: { experiment_ids: [id1, id2, id3] }
       Response: { comparison: { metrics_diff, params_diff } }
```

---

## 4. MODELS

```http
GET    /models
       Query: ?project_id=xxx&stage=production&framework=pytorch&page=1
       Response: {
         models: [{
           id, name, description, framework,
           stage: "development" | "staging" | "production",
           latest_version, versions_count, deployments_count,
           metrics: { accuracy, latency },
           project_id, author, created_at, updated_at
         }],
         total, page, limit
       }

GET    /models/:id
       Response: { model, versions[] }

POST   /models
       Body: {
         name, description, framework,
         project_id, tags: []
       }
       Response: { model }

PUT    /models/:id
       Body: { name, description, tags }
       Response: { model }

DELETE /models/:id
       Response: { success }

# Versions
GET    /models/:id/versions
       Response: { versions[] }

POST   /models/:id/versions
       Body: multipart/form-data {
         version_name, description,
         model_file, metadata: {}
       }
       Response: { version }

GET    /models/:id/versions/:version
       Response: { version }

PUT    /models/:id/versions/:version
       Body: { description, stage }
       Response: { version }

DELETE /models/:id/versions/:version
       Response: { success }

GET    /models/:id/versions/:version/download
       Response: binary file

# Stage Management
POST   /models/:id/promote
       Body: { version, target_stage }
       Response: { version }

POST   /models/:id/demote
       Body: { version, target_stage }
       Response: { version }

# Metrics & Monitoring
GET    /models/:id/metrics
       Query: ?range=7d&version=latest
       Response: { metrics[] }

GET    /models/:id/drift
       Response: { drift_score, feature_drifts[], status }

GET    /models/:id/lineage
       Response: {
         upstream: [{ type, id, name }],
         downstream: [{ type, id, name }]
       }

# Deployment
POST   /models/:id/deploy
       Body: {
         version, environment,
         replicas, resources: { cpu, memory, gpu }
       }
       Response: { deployment }

# Compare
POST   /models/compare
       Body: { model_ids: [] }
       Response: { comparison }
```

---

## 5. DEPLOYMENTS

```http
GET    /deployments
       Query: ?project_id=xxx&status=healthy&model_id=xxx&page=1
       Response: {
         deployments: [{
           id, name, model_id, model_name, project_id,
           status: "healthy" | "degraded" | "failed" | "deploying",
           region, endpoint_url,
           metrics: { requests_per_day, latency_p50, error_rate },
           replicas: { current, min, max },
           resources: { cpu, memory, gpu },
           created_at, updated_at
         }],
         total, page, limit
       }

GET    /deployments/:id
       Response: { deployment }

POST   /deployments
       Body: {
         name, model_id, model_version,
         replicas: { min, max },
         resources: { cpu, memory, gpu },
         autoscaling: { enabled, target_cpu },
         environment: "production" | "staging"
       }
       Response: { deployment }

PUT    /deployments/:id
       Body: { replicas, resources, autoscaling }
       Response: { deployment }

DELETE /deployments/:id
       Response: { success }

POST   /deployments/:id/scale
       Body: { replicas }
       Response: { deployment }

POST   /deployments/:id/rollback
       Body: { target_version }
       Response: { deployment }

POST   /deployments/:id/stop
       Response: { deployment }

POST   /deployments/:id/restart
       Response: { deployment }

GET    /deployments/:id/metrics
       Query: ?range=24h&interval=5m
       Response: {
         metrics: [{ timestamp, requests, latency, errors }]
       }

GET    /deployments/:id/logs
       Query: ?tail=500&since=1h
       Response: { logs[] }

# Canary & Traffic
POST   /deployments/:id/canary
       Body: { new_version, traffic_percentage }
       Response: { canary_deployment }

PUT    /deployments/:id/traffic-split
       Body: {
         versions: [
           { version, percentage },
           { version, percentage }
         ]
       }
       Response: { deployment }

# Inference
POST   /deployments/:id/predict
       Body: { inputs: {} }
       Response: { predictions: {} }
```

---

## 6. WORKSPACES

```http
GET    /workspaces
       Query: ?status=running&type=jupyter&page=1
       Response: {
         workspaces: [{
           id, name, type: "jupyter" | "vscode" | "rstudio",
           status: "running" | "paused" | "stopped" | "creating",
           resources: { cpu, memory, gpu, storage },
           usage: { cpu_percent, memory_percent },
           project_id, owner_id, created_at, last_accessed
         }],
         total, page, limit
       }

GET    /workspaces/:id
       Response: { workspace, access_urls: { jupyter, vscode, rstudio, terminal } }

POST   /workspaces
       Body: {
         name, type, project_id,
         image: "gpu-pytorch" | "cpu-sklearn" | "custom",
         resources: { cpu, memory, gpu, storage },
         environment: { key: value },
         git_clone_url, auto_shutdown_hours
       }
       Response: { workspace }

PUT    /workspaces/:id
       Body: { name, resources, auto_shutdown_hours }
       Response: { workspace }

DELETE /workspaces/:id
       Response: { success }

POST   /workspaces/:id/start
       Response: { workspace, access_urls }

POST   /workspaces/:id/stop
       Response: { workspace }

POST   /workspaces/:id/pause
       Response: { workspace }

POST   /workspaces/:id/resume
       Response: { workspace }

POST   /workspaces/:id/snapshot
       Body: { name, description }
       Response: { snapshot }

GET    /workspaces/:id/snapshots
       Response: { snapshots[] }

POST   /workspaces/:id/restore
       Body: { snapshot_id }
       Response: { workspace }

GET    /workspaces/:id/metrics
       Query: ?range=1h
       Response: { metrics[] }

GET    /workspaces/:id/logs
       Query: ?tail=500
       Response: { logs[] }

# File Operations
GET    /workspaces/:id/files
       Query: ?path=/home/user
       Response: { files: [{ name, type, size, modified }] }

POST   /workspaces/:id/files/upload
       Body: multipart/form-data { file, path }
       Response: { file }

GET    /workspaces/:id/files/download
       Query: ?path=/home/user/file.py
       Response: binary file

POST   /workspaces/:id/files/mkdir
       Body: { path }
       Response: { success }

DELETE /workspaces/:id/files
       Query: ?path=/home/user/file.py
       Response: { success }

# Templates & Images
GET    /workspaces/templates
       Response: { templates[] }

GET    /workspaces/images
       Response: { images[] }
```

### WebSocket - Terminal
```
WS /ws/workspaces/:id/terminal
   Connect: Opens shell session
   Send: { type: "input", data: "ls -la\n" }
   Receive: { type: "output", data: "..." }
   Send: { type: "resize", cols: 120, rows: 40 }
```

---

## 7. MONITORING

```http
GET    /monitoring/overview
       Response: {
         system_health: 98.5,
         active_alerts: 3,
         uptime: "99.99%",
         avg_latency: "24ms"
       }

# Model Monitoring
GET    /monitoring/models
       Response: { models_status[] }

GET    /monitoring/models/:id/metrics
       Query: ?range=24h&interval=1h
       Response: {
         accuracy: [{ timestamp, value }],
         latency: [{ timestamp, p50, p95, p99 }],
         throughput: [{ timestamp, requests }]
       }

# Data Drift
GET    /monitoring/drift
       Response: {
         models: [{ model_id, psi_score, status, features[] }]
       }

GET    /monitoring/drift/:modelId
       Query: ?range=7d
       Response: { drift_history[], feature_drifts[] }

# Data Quality
GET    /monitoring/quality
       Response: {
         metrics: [
           { name: "completeness", value: 98.5, threshold: 95 },
           { name: "accuracy", value: 96.2, threshold: 90 }
         ]
       }

GET    /monitoring/quality/rules
       Response: { rules[] }

POST   /monitoring/quality/rules
       Body: { name, type, dataset_id, config }
       Response: { rule }

# Infrastructure
GET    /monitoring/infrastructure
       Query: ?range=24h
       Response: {
         cpu: [{ timestamp, usage }],
         memory: [{ timestamp, usage }],
         gpu: [{ timestamp, usage }]
       }

# Traces
GET    /monitoring/traces
       Query: ?service=fraud-detector&status=error&limit=20
       Response: { traces[] }

GET    /monitoring/traces/:traceId
       Response: { trace, spans[] }

# Alerts
GET    /monitoring/alerts
       Query: ?status=firing&severity=critical
       Response: { alerts[] }

GET    /monitoring/alerts/:id
       Response: { alert }

POST   /monitoring/alerts/:id/acknowledge
       Response: { alert }

POST   /monitoring/alerts/:id/resolve
       Body: { resolution_note }
       Response: { alert }

GET    /monitoring/alerts/rules
       Response: { rules[] }

POST   /monitoring/alerts/rules
       Body: {
         name, condition, threshold,
         severity, notification_channels: []
       }
       Response: { rule }

PUT    /monitoring/alerts/rules/:id
       Body: { enabled, threshold }
       Response: { rule }

DELETE /monitoring/alerts/rules/:id
       Response: { success }
```

### WebSocket - Real-time Metrics
```
WS /ws/monitoring/realtime
   Subscribe: { models: ["id1"], infrastructure: true, alerts: true }
   Receive: { type: "metric", model_id, metrics: {} }
   Receive: { type: "alert", alert: {} }
```

---

## 8. DATA CATALOG

```http
GET    /datasets
       Query: ?project_id=xxx&classification=sensitive&pii=true&page=1
       Response: {
         datasets: [{
           id, name, schema, version, format,
           classification: "public" | "sensitive" | "regulated" | "restricted",
           pii: boolean, quality: 98.5,
           size, records, project_id,
           lineage: { sources[], consumers[] },
           created_at, updated_at
         }],
         total, page, limit
       }

GET    /datasets/:id
       Response: { dataset }

POST   /datasets
       Body: {
         name, schema, format, project_id,
         classification, description,
         source: { type, config }
       }
       Response: { dataset }

PUT    /datasets/:id
       Body: { name, description, classification }
       Response: { dataset }

DELETE /datasets/:id
       Response: { success }

GET    /datasets/:id/preview
       Query: ?limit=100&offset=0
       Response: {
         columns: [{ name, type }],
         rows: [{}]
       }

GET    /datasets/:id/schema
       Response: {
         columns: [{ name, type, nullable, description, pii }]
       }

GET    /datasets/:id/profile
       Response: {
         row_count, column_count,
         columns: [{
           name, type, distinct_count, null_count,
           min, max, mean, std_dev,
           histogram: []
         }]
       }

GET    /datasets/:id/lineage
       Response: { upstream[], downstream[] }

POST   /datasets/:id/versions
       Body: { version_name, description }
       Response: { version }

GET    /datasets/:id/versions
       Response: { versions[] }

# Policies
GET    /datasets/policies
       Response: { policies[] }

POST   /datasets/policies
       Body: {
         name, type: "retention" | "masking" | "access",
         rules: [], applies_to: { classifications: [] }
       }
       Response: { policy }

PUT    /datasets/policies/:id
       Body: { enabled, rules }
       Response: { policy }

DELETE /datasets/policies/:id
       Response: { success }
```

---

## 9. FINOPS

```http
GET    /finops/overview
       Query: ?project_id=all
       Response: {
         monthly_cost, monthly_change_percent,
         carbon_emissions, energy_kwh,
         potential_savings, budget_used_percent
       }

GET    /finops/costs
       Query: ?range=14d&project_id=all&group_by=day
       Response: {
         data: [{
           date, compute, storage, gpu, network, total
         }]
       }

GET    /finops/costs/by-project
       Response: {
         projects: [{ project_id, name, cost, percentage }]
       }

GET    /finops/costs/by-resource
       Response: {
         resources: [{ type, cost, percentage }]
       }

GET    /finops/costs/by-service
       Query: ?project_id=xxx
       Response: {
         services: [{ name, cost, usage_hours }]
       }

GET    /finops/recommendations
       Response: {
         recommendations: [{
           id, type, description,
           potential_savings, impact,
           resources_affected: []
         }],
         total_potential_savings
       }

POST   /finops/recommendations/:id/apply
       Response: { success, applied_changes }

POST   /finops/recommendations/:id/dismiss
       Body: { reason }
       Response: { success }

GET    /finops/carbon
       Query: ?range=6m
       Response: {
         data: [{ month, emissions, target, energy_kwh }],
         total_emissions, offset_credits
       }

GET    /finops/budget
       Response: {
         total_budget, used, remaining,
         alerts: [{ threshold, triggered }]
       }

PUT    /finops/budget
       Body: { total_budget, alerts: [] }
       Response: { budget }

GET    /finops/forecast
       Query: ?months=3
       Response: {
         forecast: [{ month, projected_cost, confidence }]
       }

GET    /finops/reports
       Response: { reports[] }

POST   /finops/reports
       Body: { type, range, format }
       Response: { report_url }
```

---

## 10. MARKETPLACE

```http
GET    /marketplace/apps
       Query: ?category=MLOps&status=running&search=mlflow&page=1
       Response: {
         apps: [{
           id, name, description, category, icon,
           version, status, tags: [], stars, downloads,
           featured, trending, new
         }],
         total, page, limit
       }

GET    /marketplace/apps/:id
       Response: {
         app,
         available_versions: [],
         dependencies: [],
         resources_required: {}
       }

POST   /marketplace/apps/:id/install
       Body: { version, config: {} }
       Response: { installation_id, status }

POST   /marketplace/apps/:id/uninstall
       Response: { success }

POST   /marketplace/apps/:id/start
       Response: { app }

POST   /marketplace/apps/:id/stop
       Response: { app }

POST   /marketplace/apps/:id/restart
       Response: { app }

POST   /marketplace/apps/:id/update
       Body: { target_version }
       Response: { app }

GET    /marketplace/apps/:id/config
       Response: { config, schema }

PUT    /marketplace/apps/:id/config
       Body: { config: {} }
       Response: { config }

GET    /marketplace/apps/:id/logs
       Query: ?tail=500&since=1h
       Response: { logs[] }

GET    /marketplace/apps/:id/metrics
       Response: {
         cpu, memory, network,
         restarts, uptime
       }

POST   /marketplace/apps/:id/backup
       Body: { name }
       Response: { backup }

GET    /marketplace/apps/:id/backups
       Response: { backups[] }

POST   /marketplace/apps/:id/restore
       Body: { backup_id }
       Response: { success }

GET    /marketplace/dependencies
       Response: {
         nodes: [{ id, name }],
         edges: [{ from, to }]
       }

POST   /marketplace/helm/import
       Body: {
         chart_url, values: {}
       }
       Response: { app }

GET    /marketplace/categories
       Response: { categories[] }
```

### WebSocket - App Logs
```
WS /ws/marketplace/apps/:id/logs
   Subscribe: { follow: true }
   Receive: { timestamp, level, message }
```

---

## 11. GOVERNANCE

### Roles
```http
GET    /roles
       Response: { roles[] }

GET    /roles/:id
       Response: { role, permissions[] }

POST   /roles
       Body: { name, description, permissions: [] }
       Response: { role }

PUT    /roles/:id
       Body: { name, description, permissions: [] }
       Response: { role }

DELETE /roles/:id
       Response: { success }
```

### Permissions
```http
GET    /permissions
       Response: {
         permissions: [{
           id, name, resource, actions: ["read", "write", "delete"]
         }]
       }

GET    /permissions/resources
       Response: {
         resources: ["projects", "models", "experiments", ...]
       }
```

### Audit Logs
```http
GET    /audit-logs
       Query: ?user_id=xxx&action=create&resource=model&from=date&to=date&page=1
       Response: {
         logs: [{
           id, user_id, user_name, action, resource, resource_id,
           details: {}, ip_address, user_agent, timestamp
         }],
         total, page, limit
       }

GET    /audit-logs/:id
       Response: { log }

POST   /audit-logs/export
       Body: { format: "csv" | "json", filters: {} }
       Response: { download_url }
```

---

## 12. COMPLIANCE

```http
GET    /compliance/frameworks
       Response: {
         frameworks: [{ id, name, status, controls_total, controls_passed }]
       }

GET    /compliance/frameworks/:id
       Response: { framework, controls[] }

GET    /compliance/controls
       Query: ?framework=soc2&status=passed
       Response: { controls[] }

GET    /compliance/controls/:id
       Response: { control, evidence[], history[] }

PUT    /compliance/controls/:id
       Body: { status, notes }
       Response: { control }

POST   /compliance/evidence
       Body: multipart/form-data { control_id, file, description }
       Response: { evidence }

GET    /compliance/audits
       Response: { audits[] }

POST   /compliance/audits
       Body: { framework_id, scheduled_date }
       Response: { audit }
```

---

## 13. SETTINGS

```http
GET    /settings/profile
       Response: { user }

PUT    /settings/profile
       Body: { full_name, avatar_url, timezone, language }
       Response: { user }

GET    /settings/notifications
       Response: { notification_settings }

PUT    /settings/notifications
       Body: { email, slack, in_app }
       Response: { notification_settings }

GET    /settings/api-keys
       Response: { api_keys[] }

POST   /settings/api-keys
       Body: { name, scopes: [], expires_at }
       Response: { api_key, secret } # secret shown only once

DELETE /settings/api-keys/:id
       Response: { success }

GET    /settings/integrations
       Response: { integrations[] }

POST   /settings/integrations/:type
       Body: { config }
       Response: { integration }

DELETE /settings/integrations/:type
       Response: { success }
```

---

## 14. PIPELINES (Future)

```http
GET    /pipelines
       Query: ?project_id=xxx&status=running
       Response: { pipelines[] }

GET    /pipelines/:id
       Response: { pipeline, dag, runs[] }

POST   /pipelines
       Body: {
         name, project_id,
         dag: { nodes: [], edges: [] },
         schedule: "0 0 * * *"
       }
       Response: { pipeline }

PUT    /pipelines/:id
       Body: { dag, schedule }
       Response: { pipeline }

DELETE /pipelines/:id
       Response: { success }

POST   /pipelines/:id/run
       Body: { parameters: {} }
       Response: { run }

GET    /pipelines/:id/runs
       Response: { runs[] }

GET    /pipelines/:id/runs/:runId
       Response: { run, steps[] }

POST   /pipelines/:id/runs/:runId/cancel
       Response: { run }

GET    /pipelines/:id/runs/:runId/logs
       Response: { logs[] }
```

---

## RÉSUMÉ PAR PRIORITÉ

### P0 - MVP (Sprint 1-2)
| Domaine | Endpoints |
|---------|:---------:|
| Auth | 10 |
| Users | 10 |
| Projects | 15 |
| Experiments | 12 |
| Models | 18 |
| Deployments | 16 |
| **Total P0** | **81** |

### P1 - Core (Sprint 3-4)
| Domaine | Endpoints |
|---------|:---------:|
| Workspaces | 20 |
| Monitoring | 18 |
| DataCatalog | 14 |
| Governance | 12 |
| **Total P1** | **64** |

### P2 - Extended (Sprint 5-6)
| Domaine | Endpoints |
|---------|:---------:|
| FinOps | 12 |
| Marketplace | 18 |
| Settings | 10 |
| **Total P2** | **40** |

### P3 - Future
| Domaine | Endpoints |
|---------|:---------:|
| Compliance | 10 |
| Pipelines | 12 |
| **Total P3** | **22** |

---

## WebSocket Endpoints

```
WS /ws/dashboard/realtime
WS /ws/deployments/:id/logs
WS /ws/workspaces/:id/terminal
WS /ws/monitoring/realtime
WS /ws/marketplace/apps/:id/logs
WS /ws/experiments/:id/metrics
WS /ws/experiments/:id/logs
WS /ws/pipelines/:id/runs/:runId/logs
```

---

*Document généré le 2026-01-03*
