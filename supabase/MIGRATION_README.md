# Supabase Migration Guide - MLOps Control Plane v3

## Author: Armand AMOUSSOU
## Date: 2026-01-04

---

## Overview

This directory contains the complete database schema for the MLOps Control Plane v3. The schema includes approximately **112+ tables** across 8 domain modules with comprehensive RLS (Row Level Security) policies.

## Migration Files

The migrations are organized in sequential order:

| File | Description | Tables |
|------|-------------|--------|
| `20260104100000_001_tenancy_tables.sql` | Core tenancy schema (tenant, org, project, kanban, work items) | 8 tables |
| `20260104100001_002_identity_tables.sql` | Identity and RBAC (users, groups, roles, permissions) | 16 tables |
| `20260104100002_003_infrastructure_tables.sql` | K8s clusters, namespaces, compute profiles | 4 tables |
| `20260104100003_004_registries_tables.sql` | Container registries, object stores, environments | 5 tables |
| `20260104100004_005_mlops_tables.sql` | ML experiments, runs, models, deployments | 9 tables |
| `20260104100005_006_cicd_tables.sql` | CI/CD pipelines, GitLab, ArgoCD integration | 19 tables |
| `20260104100006_007_collaboration_tables.sql` | Comments, notifications, approvals, audit | 9 tables |
| `20260104100007_008_advanced_tables.sql` | Pipelines DAG, policies, FinOps, AI governance | 42 tables |
| `20260104100008_009_rls_policies.sql` | RLS policies for core tables | N/A |
| `20260104100009_010_rls_policies_advanced.sql` | RLS policies for advanced tables | N/A |

## Running Migrations

### Prerequisites

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   # or
   brew install supabase/tap/supabase
   ```

2. Link to your Supabase project:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

### Apply Migrations

```bash
# Apply all pending migrations
supabase db push

# Or reset and apply all migrations (WARNING: destroys data)
supabase db reset
```

### Generate TypeScript Types

After applying migrations, regenerate the TypeScript types:

```bash
# Generate types from remote database
supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts

# Or from local database
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

## RLS Policies

All tables have Row Level Security (RLS) enabled with the following policy patterns:

### Tenant Isolation
- All tables include `tenant_id` column
- Users can only access data from their tenant
- Platform admins can access all tenants

### Project Access Control
- Project-scoped tables use `has_project_access()` function
- Permission-based access via `has_project_permission()` function

### User-Specific Data
- Personal data (notifications, tokens) restricted to owner
- Tenant admins can view/manage all user data

### Helper Functions

The RLS policies depend on these helper functions:

- `get_current_tenant_id()` - Extracts tenant_id from JWT claims
- `get_current_user_id()` - Returns auth.uid()
- `is_platform_admin()` - Checks platform admin role
- `is_tenant_admin()` - Checks tenant admin role
- `has_project_access(project_id)` - Checks project access
- `has_project_permission(project_id, permission_code)` - Checks specific permission

## ENUMs

The schema defines numerous PostgreSQL ENUMs for type safety:

### Tenancy
- `tenant_status`, `tenant_tier`, `project_visibility`, `project_lifecycle`
- `criticality`, `progress_status`, `milestone_status`
- `work_item_type`, `work_item_status`, `priority`, `severity`

### Identity
- `user_status`, `role_scope_type`, `principal_type`, `permission_category`
- `secret_backend`, `secret_status`, `idp_type`, `api_token_status`

### Infrastructure
- `cloud_provider`, `k8s_environment`, `k8s_cluster_status`

### MLOps
- `run_status`, `artifact_type`, `model_stage`, `model_version_status`
- `deployment_status`, `deployment_target`, `workspace_type`, `app_type`

### CI/CD
- `pipeline_status`, `job_status`, `cicd_env_tier`
- `argocd_health_status`, `argocd_sync_status`, `drift_status`, `release_status`

### Advanced
- `pipeline_run_status`, `node_type`, `policy_bundle_status`, `policy_decision_result`
- `catalog_item_type`, `resource_provider`, `iac_run_type`, `incident_severity`
- `budget_scope`, `budget_period`, `ai_risk_category`, `eu_ai_risk_level`
- Many more...

## React Query Hooks

The project includes pre-built React Query hooks in `src/hooks/api/`:

```typescript
// Example usage
import { useProjects, useCreateProject } from '@/hooks/api';

function ProjectList() {
  const { data, isLoading } = useProjects({
    pagination: { page: 1, pageSize: 20 },
    sort: { column: 'updated_at', ascending: false },
    filters: [{ column: 'lifecycle', operator: 'eq', value: 'production' }],
  });

  const createProject = useCreateProject({
    onSuccess: (project) => console.log('Created:', project.name),
  });

  // ...
}
```

### Available Domains

- **Tenancy**: `useTenants`, `useProjects`, `useOrganizations`
- **Identity**: `useUsers`, `useRoles`, `usePermissions`
- **MLOps**: `useExperiments`, `useModels`, `useModelVersions`

### TODO: Remaining Domains
- Infrastructure hooks
- Registries hooks
- CI/CD hooks
- Collaboration hooks
- Advanced hooks

## Seed Data

The migrations include seed data for:

- **Default Permissions** (32 permissions across 6 categories):
  - admin, project, security, mlops, cicd, gitops

## Development Notes

### Adding New Tables

1. Create a new migration file with proper naming convention
2. Define ENUM types first (with `DO $$ BEGIN ... EXCEPTION ... END $$` pattern)
3. Create table with `tenant_id` reference
4. Enable RLS: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
5. Add indexes on foreign keys and frequently queried columns
6. Add comments for documentation
7. Create RLS policies in the RLS migration file
8. Add React Query hooks for the new table

### Testing Migrations

```bash
# Test migrations locally
supabase start
supabase db reset

# Check for errors
supabase db lint
```

## Troubleshooting

### Migration Fails

1. Check for syntax errors in SQL
2. Ensure ENUMs are created with duplicate handling
3. Verify foreign key references exist
4. Check trigger function dependencies

### RLS Policy Issues

1. Verify JWT claims include required fields (`tenant_id`, `is_platform_admin`)
2. Check helper functions are created before policies
3. Test with different user roles

### Type Generation Fails

1. Ensure all migrations are applied
2. Check for circular references
3. Verify Supabase CLI version is up to date

---

## Next Steps

1. [ ] Apply migrations to Supabase project
2. [ ] Regenerate TypeScript types
3. [ ] Complete remaining React Query hooks
4. [ ] Set up Supabase Edge Functions for complex operations
5. [ ] Configure Supabase Realtime for live updates
6. [ ] Set up Supabase Storage buckets for artifacts
