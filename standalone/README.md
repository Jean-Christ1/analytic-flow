# APEX-ML-PLATFORM - Standalone PostgreSQL Deployment

**Version**: 1.0.0
**Author**: Armand AMOUSSOU
**Date**: 2026-01-07

## Overview

This directory contains all the resources needed to deploy APEX-ML-PLATFORM on a completely standalone PostgreSQL instance, independent of Supabase or any managed service.

## Directory Structure

```
standalone/
|-- docker/
|   |-- docker-compose.yml       # Docker Compose for full stack
|   |-- postgresql.conf          # PostgreSQL 16 configuration
|   |-- pgadmin-servers.json     # pgAdmin server configuration
|   |-- .env.example             # Environment variables template
|   |-- init-scripts/            # Database initialization scripts (auto-run)
|   |-- ssl/                     # SSL certificates (optional)
|-- scripts/
|   |-- sql/
|   |   |-- 00_init_database.sql          # Database initialization
|   |   |-- 01_rls_policies_standalone.sql # Standalone RLS policies
|   |-- bash/
|       |-- export_supabase.sh   # Export from Supabase
|       |-- import_standalone.sh # Import to standalone
|-- config/                      # Additional configuration files
|-- exports/                     # Export data storage (gitignored)
|-- README.md                    # This file
```

## Quick Start

### 1. Prerequisites

- Docker and Docker Compose v2+
- PostgreSQL client tools (`psql`, `pg_dump`, `pg_restore`)
- Bash shell (Git Bash on Windows)

### 2. Configure Environment

```bash
cd standalone/docker
cp .env.example .env
# Edit .env with your passwords (NEVER commit this file!)
```

### 3. Start the Stack

```bash
# Start core services (PostgreSQL, PgBouncer, MinIO)
docker compose up -d

# With authentication (Keycloak)
docker compose --profile auth up -d

# With management tools (pgAdmin)
docker compose --profile tools up -d

# With monitoring (Prometheus, Grafana)
docker compose --profile monitoring up -d

# All profiles
docker compose --profile auth --profile tools --profile monitoring up -d
```

### 4. Initialize Database

The database is automatically initialized when the container first starts. To manually reinitialize:

```bash
docker exec -i apex-postgres psql -U postgres -d apex_ml_platform < scripts/sql/00_init_database.sql
```

### 5. Apply RLS Policies

After importing data, apply standalone RLS policies:

```bash
docker exec -i apex-postgres psql -U postgres -d apex_ml_platform < scripts/sql/01_rls_policies_standalone.sql
```

## Migration from Supabase

### Step 1: Configure Supabase Credentials

Create `scripts/.env.supabase`:

```bash
SUPABASE_PROJECT_REF=your_project_ref
SUPABASE_DB_PASSWORD=your_db_password
```

### Step 2: Export from Supabase

```bash
chmod +x scripts/bash/export_supabase.sh
./scripts/bash/export_supabase.sh
```

This creates an export in `exports/YYYYMMDD_HHMMSS/`.

### Step 3: Configure Standalone Database

Create `scripts/.env.standalone`:

```bash
PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=your_password
PG_DATABASE=apex_ml_platform
```

### Step 4: Import to Standalone

```bash
chmod +x scripts/bash/import_standalone.sh
./scripts/bash/import_standalone.sh exports/YYYYMMDD_HHMMSS
```

## Service Endpoints

| Service | Port | URL |
|---------|------|-----|
| PostgreSQL | 5432 | `postgresql://postgres:password@localhost:5432/apex_ml_platform` |
| PgBouncer | 6432 | `postgresql://postgres:password@localhost:6432/apex_ml_platform` |
| MinIO API | 9000 | `http://localhost:9000` |
| MinIO Console | 9001 | `http://localhost:9001` |
| Keycloak | 8080 | `http://localhost:8080` |
| pgAdmin | 5050 | `http://localhost:5050` |
| Prometheus | 9090 | `http://localhost:9090` |
| Grafana | 3000 | `http://localhost:3000` |

## Connection Strings

### Application (via PgBouncer - recommended for production)

```
DATABASE_URL=postgresql://apex_service:password@localhost:6432/apex_ml_platform
```

### Direct (for migrations and admin)

```
DATABASE_URL_DIRECT=postgresql://postgres:password@localhost:5432/apex_ml_platform
```

## Setting User Context (for RLS)

The standalone database uses session variables instead of Supabase's `auth.uid()`. Your backend must set these before each request:

```sql
-- Set user context before queries
SET LOCAL app.current_user_id = 'user-uuid-here';
SET LOCAL app.current_tenant_id = 'tenant-uuid-here';
SET LOCAL app.is_platform_admin = false;
SET LOCAL app.is_tenant_admin = false;
```

Example in Node.js:

```typescript
const client = await pool.connect();
try {
  await client.query(`
    SET LOCAL app.current_user_id = $1;
    SET LOCAL app.current_tenant_id = $2;
    SET LOCAL app.is_platform_admin = $3;
    SET LOCAL app.is_tenant_admin = $4;
  `, [userId, tenantId, isPlatformAdmin, isTenantAdmin]);

  // Now run your queries with RLS applied
  const result = await client.query('SELECT * FROM public.project');
} finally {
  client.release();
}
```

## Backup and Restore

### Create Backup

```bash
docker exec apex-postgres pg_dump -U postgres -Fc apex_ml_platform > backup_$(date +%Y%m%d).dump
```

### Restore Backup

```bash
docker exec -i apex-postgres pg_restore -U postgres -d apex_ml_platform --clean < backup_20260107.dump
```

## Storage (MinIO)

### Access MinIO Console

1. Open http://localhost:9001
2. Login with `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD`

### Default Buckets

| Bucket | Purpose | Public |
|--------|---------|--------|
| avatars | User profile images | Yes |
| models | ML model artifacts | No |
| datasets | Dataset files | No |
| exports | Exported reports | No |
| experiments | Experiment logs | No |
| artifacts | General artifacts | No |
| logs | Application logs | No |

### Using MinIO Client

```bash
# Configure alias
docker exec apex-minio mc alias set local http://localhost:9000 $MINIO_ROOT_USER $MINIO_ROOT_PASSWORD

# List buckets
docker exec apex-minio mc ls local/

# Upload file
docker exec apex-minio mc cp myfile.csv local/datasets/
```

## Troubleshooting

### Database Connection Refused

```bash
# Check if PostgreSQL is running
docker logs apex-postgres

# Check port availability
netstat -an | grep 5432
```

### RLS Blocking All Queries

Ensure user context is set:

```sql
-- Debug: check current context
SELECT public.current_user_id(), public.current_tenant_id();
```

### MinIO Buckets Not Created

```bash
# Re-run bucket initialization
docker compose up minio-init
```

### Reset Everything

```bash
docker compose down -v
docker volume rm apex-postgres-data apex-minio-data
docker compose up -d
```

## Security Checklist

- [ ] Change all default passwords in `.env`
- [ ] Enable SSL for PostgreSQL in production
- [ ] Configure firewall rules
- [ ] Set up regular backups
- [ ] Enable audit logging
- [ ] Review and test RLS policies
- [ ] Configure Keycloak realm and clients
- [ ] Set up monitoring alerts

## Support

For issues and feature requests, refer to the main project documentation:
- [DB_STANDALONE_POSTGRESQL_PLAN.md](../docs/DB_STANDALONE_POSTGRESQL_PLAN.md)
- [ANALYSE-EXHAUSTIVE-PROJET.md](../docs/ANALYSE-EXHAUSTIVE-PROJET.md)
