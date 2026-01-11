# PLAN DE MIGRATION VERS POSTGRESQL AUTONOME

## APEX-ML-PLATFORM - Base de Donnees Standalone

**Version**: 1.0.0
**Date**: 2026-01-07
**Auteur**: Armand AMOUSSOU
**PostgreSQL Cible**: 16.x LTS

---

## TABLE DES MATIERES

1. [Inventaire et Analyse de l'Existant](#1-inventaire-et-analyse-de-lexistant)
2. [Architecture Cible Autonome](#2-architecture-cible-autonome)
3. [Plan de Reconstruction BDD](#3-plan-de-reconstruction-bdd)
4. [Modele de Securite](#4-modele-de-securite)
5. [Scripts et Automatisation](#5-scripts-et-automatisation)
6. [Deploiement et Portabilite](#6-deploiement-et-portabilite)
7. [Impact Applicatif](#7-impact-applicatif)
8. [Qualite et Coherence des Donnees](#8-qualite-et-coherence-des-donnees)

---

## 1. INVENTAIRE ET ANALYSE DE L'EXISTANT

### 1.1 Vue d'Ensemble du Schema Actuel

| Metrique | Valeur |
|----------|--------|
| **Tables metier** | 130+ |
| **Types ENUM** | 38+ |
| **Migrations** | 17 fichiers |
| **Politiques RLS** | 150+ |
| **Triggers** | 30+ |
| **Fonctions** | 20+ |
| **Index** | 100+ |
| **Buckets Storage** | 6 |

### 1.2 Dependances Supabase Identifiees

#### 1.2.1 Schema `auth` (Supabase Auth)

| Objet | Type | Occurrences | Impact |
|-------|------|-------------|--------|
| `auth.users` | Table | 5 | **CRITIQUE** |
| `auth.uid()` | Fonction | 140+ | **CRITIQUE** |
| `auth.role()` | Fonction | 6 | **CRITIQUE** |
| `auth.jwt()` | Fonction | Indirect | MODERE |
| `current_setting('request.jwt.claims')` | Setting | 10+ | **CRITIQUE** |

**Tables referençant `auth.users`:**
```sql
-- profiles.user_id -> auth.users(id)
-- user_roles.user_id -> auth.users(id)
-- user_roles.assigned_by -> auth.users(id)
```

**Trigger sur `auth.users`:**
```sql
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
```

#### 1.2.2 Schema `storage` (Supabase Storage)

| Objet | Type | Occurrences | Impact |
|-------|------|-------------|--------|
| `storage.buckets` | Table | 4 INSERT | **CRITIQUE** |
| `storage.objects` | Table | 12 policies | **CRITIQUE** |
| `storage.foldername()` | Fonction | 8 | MODERE |

**Buckets Configures:**

| Bucket | Public | Limite | MIME Types |
|--------|--------|--------|------------|
| `avatars` | Oui | 5MB | image/* |
| `models` | Non | 100MB | octet-stream, zip, tar, gzip |
| `datasets` | Non | 500MB | csv, json, parquet |
| `exports` | Non | 100MB | csv, json, pdf, zip |
| `experiments` | Non | - | - |
| `artifacts` | Non | - | - |
| `logs` | Non | - | - |

#### 1.2.3 Fonctions RLS Dependantes de Supabase

```sql
-- Fonctions utilisant auth.uid()
public.get_current_user_id()    -- Wrapper pour auth.uid()
public.is_admin(_user_id)       -- Utilise auth.uid() implicitement
public.has_role(_user_id)       -- Reference auth
public.has_project_access()     -- Utilise auth.uid()
public.has_project_permission() -- Utilise auth.uid()

-- Fonctions utilisant JWT claims
public.get_current_tenant_id()  -- request.jwt.claims
public.is_platform_admin()      -- request.jwt.claims
public.is_tenant_admin()        -- request.jwt.claims
```

### 1.3 Extensions PostgreSQL Utilisees

| Extension | Usage | Disponible Standard |
|-----------|-------|---------------------|
| `uuid-ossp` | Generation UUID | Oui (inclus PG 16) |
| `pgcrypto` | Fonctions crypto | Oui |
| `pg_trgm` | Recherche trigram | Oui |
| `btree_gin` | Index GIN | Oui |

**Note**: Aucune extension proprietaire Supabase n'est utilisee dans le schema metier.

### 1.4 Analyse des Risques

| Risque | Probabilite | Impact | Mitigation |
|--------|-------------|--------|------------|
| Perte de donnees | Faible | Critique | Backup pre-migration, validation checksums |
| Incompatibilite RLS | Moyenne | Eleve | Re-implementation avec roles PostgreSQL natifs |
| Auth non-fonctionnelle | Elevee | Critique | Nouveau service auth (Keycloak/Authelia) |
| Storage inaccessible | Elevee | Eleve | Migration vers MinIO/S3 |
| Realtime casse | Moyenne | Modere | Implementation WebSocket standalone |

---

## 2. ARCHITECTURE CIBLE AUTONOME

### 2.1 Diagramme d'Architecture

```
+------------------------------------------------------------------+
|                     FRONTEND (React + TypeScript)                |
|  - Auth via JWT (depuis Auth Service)                            |
|  - API REST vers Backend                                         |
|  - Storage via presigned URLs                                    |
+------------------------------------------------------------------+
                                |
                    HTTPS / REST API
                                |
+------------------------------------------------------------------+
|                     BACKEND API (FastAPI/Node.js)                |
|  +------------------+  +------------------+  +----------------+  |
|  | Auth Service     |  | Storage Service  |  | Realtime WS    |  |
|  | (Keycloak/Auth0) |  | (MinIO/S3)       |  | (WebSocket)    |  |
|  +------------------+  +------------------+  +----------------+  |
|                                |                                 |
|                    +------------------------+                    |
|                    | Connection Pooler      |                    |
|                    | (PgBouncer)            |                    |
|                    +------------------------+                    |
+------------------------------------------------------------------+
                                |
                    PostgreSQL Wire Protocol
                                |
+------------------------------------------------------------------+
|                     POSTGRESQL 16 STANDALONE                     |
|  +------------------+  +------------------+  +----------------+  |
|  | Schema: public   |  | Schema: auth_v2  |  | Schema: storage|  |
|  | 130+ tables      |  | (remplacant)     |  | (metadonnees)  |  |
|  +------------------+  +------------------+  +----------------+  |
|                                                                  |
|  +------------------+  +------------------+  +----------------+  |
|  | Roles RBAC       |  | RLS Policies     |  | Audit Log      |  |
|  | (natifs PG)      |  | (standalone)     |  | (built-in)     |  |
|  +------------------+  +------------------+  +----------------+  |
+------------------------------------------------------------------+
```

### 2.2 Composants de l'Architecture Cible

#### 2.2.1 PostgreSQL 16.x LTS

**Justification du choix:**
- Version LTS avec support jusqu'en 2028
- Performance accrue (parallelisme ameliore)
- Logical replication native
- Fonctions JSON ameliorees
- Row-level security mature

**Configuration recommandee:**
```ini
# postgresql.conf - Production
max_connections = 200
shared_buffers = 4GB
effective_cache_size = 12GB
maintenance_work_mem = 1GB
checkpoint_completion_target = 0.9
wal_buffers = 64MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
min_wal_size = 2GB
max_wal_size = 8GB
max_worker_processes = 8
max_parallel_workers_per_gather = 4
max_parallel_workers = 8
max_parallel_maintenance_workers = 4
```

#### 2.2.2 Service d'Authentification (Remplacement Supabase Auth)

**Option Recommandee: Keycloak 24.x**

| Critere | Keycloak | Authelia | Auth0 |
|---------|----------|----------|-------|
| Open Source | Oui | Oui | Non |
| Self-hosted | Oui | Oui | Cloud |
| SSO/OIDC | Natif | Natif | Natif |
| User Federation | Oui | Limite | Oui |
| Admin UI | Complet | Minimal | Cloud |
| Complexite | Moyenne | Faible | Faible |

**Integration avec PostgreSQL:**
```sql
-- Nouveau schema auth_v2 (remplacant auth)
CREATE SCHEMA IF NOT EXISTS auth_v2;

CREATE TABLE auth_v2.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(255) UNIQUE,  -- ID Keycloak
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT false,
    phone VARCHAR(50),
    phone_verified BOOLEAN DEFAULT false,
    encrypted_password VARCHAR(255),
    raw_user_meta_data JSONB DEFAULT '{}'::jsonb,
    raw_app_meta_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    last_sign_in_at TIMESTAMPTZ,
    banned_until TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_auth_users_email ON auth_v2.users(email);
CREATE INDEX idx_auth_users_external_id ON auth_v2.users(external_id);
```

#### 2.2.3 Service de Stockage (Remplacement Supabase Storage)

**Option Recommandee: MinIO**

| Critere | MinIO | Garage | SeaweedFS |
|---------|-------|--------|-----------|
| API S3 | 100% | Partiel | Partiel |
| Performance | Excellente | Bonne | Excellente |
| Complexite | Faible | Moyenne | Elevee |
| Erasure Coding | Oui | Oui | Oui |
| Kubernetes | Operator | Helm | Helm |

**Schema metadonnees storage:**
```sql
CREATE SCHEMA IF NOT EXISTS storage_v2;

CREATE TABLE storage_v2.buckets (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    owner_id UUID REFERENCES auth_v2.users(id),
    public BOOLEAN DEFAULT false,
    file_size_limit BIGINT,
    allowed_mime_types TEXT[],
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE storage_v2.objects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bucket_id VARCHAR(255) REFERENCES storage_v2.buckets(id),
    name TEXT NOT NULL,
    owner_id UUID REFERENCES auth_v2.users(id),
    metadata JSONB DEFAULT '{}'::jsonb,
    path_tokens TEXT[] GENERATED ALWAYS AS (string_to_array(name, '/')) STORED,
    version VARCHAR(50),
    size BIGINT,
    mime_type VARCHAR(255),
    etag VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    last_accessed_at TIMESTAMPTZ,
    UNIQUE(bucket_id, name)
);

CREATE INDEX idx_objects_bucket ON storage_v2.objects(bucket_id);
CREATE INDEX idx_objects_path ON storage_v2.objects USING GIN(path_tokens);
```

#### 2.2.4 Connection Pooler (PgBouncer)

**Configuration:**
```ini
[databases]
apex_ml_platform = host=127.0.0.1 port=5432 dbname=apex_ml_platform

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432
auth_type = scram-sha-256
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 50
min_pool_size = 10
reserve_pool_size = 25
reserve_pool_timeout = 5
server_lifetime = 3600
server_idle_timeout = 600
```

### 2.3 Flux de Donnees et Securite

```
+-------------+     JWT Token      +-------------+
|   Client    | =================> |   Backend   |
| (Frontend)  |                    |   (API)     |
+-------------+                    +-------------+
                                         |
                    +--------------------+--------------------+
                    |                    |                    |
              +-----v-----+        +-----v-----+        +-----v-----+
              |  Keycloak |        |   MinIO   |        | PostgreSQL|
              |  (Auth)   |        | (Storage) |        |   (Data)  |
              +-----------+        +-----------+        +-----------+
                    |                    |                    |
                    |   OIDC Token       |   S3 API          |  SQL
                    |   Validation       |   Presigned URLs  |  + RLS
                    v                    v                    v
              +---------------------------------------------------+
              |              Audit Log (PostgreSQL)               |
              +---------------------------------------------------+
```

---

## 3. PLAN DE RECONSTRUCTION BDD

### 3.1 Phases de Migration

```
Phase 0: Preparation (J-7 a J-1)
    |
    v
Phase 1: Export Supabase (J0)
    |
    v
Phase 2: Creation Schema Standalone (J0-J1)
    |
    v
Phase 3: Migration Donnees (J1-J2)
    |
    v
Phase 4: Reconfiguration Auth/Storage (J2-J3)
    |
    v
Phase 5: Validation et Tests (J3-J4)
    |
    v
Phase 6: Bascule Production (J5)
    |
    v
Phase 7: Monitoring Post-Migration (J5-J12)
```

### 3.2 Phase 0: Preparation

#### 3.2.1 Checklist Pre-Migration

```markdown
[ ] Backup complet Supabase (pg_dump + storage)
[ ] Snapshot environnement de test
[ ] PostgreSQL 16 installe et configure
[ ] Keycloak/Auth service deploye
[ ] MinIO deploye et configure
[ ] Scripts de migration testes en staging
[ ] Plan de rollback documente
[ ] Equipe notifiee (maintenance programmee)
[ ] Monitoring configure
```

#### 3.2.2 Backup Supabase

```bash
#!/bin/bash
# backup_supabase.sh

SUPABASE_PROJECT_REF="rwqzweqrfiucqokghgjg"
SUPABASE_DB_PASSWORD="${SUPABASE_DB_PASSWORD}"
BACKUP_DIR="/backups/$(date +%Y%m%d_%H%M%S)"

mkdir -p ${BACKUP_DIR}

# Export schema + data
pg_dump \
    --host=db.${SUPABASE_PROJECT_REF}.supabase.co \
    --port=5432 \
    --username=postgres \
    --dbname=postgres \
    --format=custom \
    --file=${BACKUP_DIR}/full_backup.dump \
    --verbose \
    --no-owner \
    --no-privileges \
    --exclude-schema='supabase_*' \
    --exclude-schema='extensions' \
    --exclude-schema='graphql*' \
    --exclude-schema='vault' \
    --exclude-schema='pgsodium*'

# Export schema only (for reference)
pg_dump \
    --host=db.${SUPABASE_PROJECT_REF}.supabase.co \
    --port=5432 \
    --username=postgres \
    --dbname=postgres \
    --schema-only \
    --file=${BACKUP_DIR}/schema_only.sql \
    --no-owner \
    --no-privileges \
    --exclude-schema='supabase_*' \
    --exclude-schema='auth' \
    --exclude-schema='storage'

# Export auth.users data (for migration)
psql \
    --host=db.${SUPABASE_PROJECT_REF}.supabase.co \
    --port=5432 \
    --username=postgres \
    --dbname=postgres \
    --command="COPY (SELECT id, email, email_confirmed_at, encrypted_password,
                     raw_user_meta_data, raw_app_meta_data, created_at, updated_at
                     FROM auth.users) TO STDOUT WITH CSV HEADER" \
    > ${BACKUP_DIR}/auth_users.csv

echo "Backup complete: ${BACKUP_DIR}"
```

### 3.3 Phase 1: Export Supabase

#### 3.3.1 Script d'Export Complet

```bash
#!/bin/bash
# export_supabase_complete.sh

set -e

SUPABASE_PROJECT_REF="rwqzweqrfiucqokghgjg"
EXPORT_DIR="./supabase_export_$(date +%Y%m%d)"

mkdir -p ${EXPORT_DIR}/{schema,data,storage}

echo "=== Exporting Supabase Database ==="

# 1. Export public schema
pg_dump \
    --host=db.${SUPABASE_PROJECT_REF}.supabase.co \
    --port=5432 \
    --username=postgres \
    --dbname=postgres \
    --schema=public \
    --format=plain \
    --file=${EXPORT_DIR}/schema/public_schema.sql \
    --no-owner \
    --no-privileges

# 2. Export data only
pg_dump \
    --host=db.${SUPABASE_PROJECT_REF}.supabase.co \
    --port=5432 \
    --username=postgres \
    --dbname=postgres \
    --schema=public \
    --data-only \
    --format=plain \
    --file=${EXPORT_DIR}/data/public_data.sql

# 3. Export table counts for validation
psql \
    --host=db.${SUPABASE_PROJECT_REF}.supabase.co \
    --port=5432 \
    --username=postgres \
    --dbname=postgres \
    --command="
    SELECT schemaname, tablename,
           (xpath('/row/cnt/text()',
                  query_to_xml(format('SELECT COUNT(*) AS cnt FROM %I.%I',
                                      schemaname, tablename), false, true, '')))[1]::text::bigint AS row_count
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename;
    " > ${EXPORT_DIR}/table_counts.txt

echo "=== Export Complete ==="
echo "Files: ${EXPORT_DIR}"
```

### 3.4 Phase 2: Creation Schema Standalone

#### 3.4.1 Script d'Initialisation PostgreSQL Autonome

```sql
-- 00_init_standalone_database.sql
-- Initialisation PostgreSQL autonome pour APEX-ML-PLATFORM

-- ============================================================================
-- DATABASE CREATION
-- ============================================================================

-- Run as superuser
\c postgres

DROP DATABASE IF EXISTS apex_ml_platform;
CREATE DATABASE apex_ml_platform
    WITH
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TEMPLATE = template0;

\c apex_ml_platform

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ============================================================================
-- SCHEMAS
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS auth_v2;
CREATE SCHEMA IF NOT EXISTS storage_v2;
CREATE SCHEMA IF NOT EXISTS audit;

-- ============================================================================
-- APPLICATION ROLES (remplacant Supabase roles)
-- ============================================================================

-- Role applicatif principal
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'apex_app') THEN
        CREATE ROLE apex_app WITH LOGIN PASSWORD 'CHANGE_ME_SECURE_PASSWORD';
    END IF;
END
$$;

-- Role lecture seule
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'apex_readonly') THEN
        CREATE ROLE apex_readonly WITH LOGIN PASSWORD 'CHANGE_ME_READONLY_PASSWORD';
    END IF;
END
$$;

-- Role admin
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'apex_admin') THEN
        CREATE ROLE apex_admin WITH LOGIN PASSWORD 'CHANGE_ME_ADMIN_PASSWORD' CREATEROLE;
    END IF;
END
$$;

-- Role service (pour backend API)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'apex_service') THEN
        CREATE ROLE apex_service WITH LOGIN PASSWORD 'CHANGE_ME_SERVICE_PASSWORD';
    END IF;
END
$$;

-- Grants sur les schemas
GRANT USAGE ON SCHEMA public TO apex_app, apex_readonly, apex_service;
GRANT USAGE ON SCHEMA auth_v2 TO apex_app, apex_service;
GRANT USAGE ON SCHEMA storage_v2 TO apex_app, apex_service;
GRANT USAGE ON SCHEMA audit TO apex_app, apex_readonly, apex_service;

-- Grants sur les tables (a executer apres creation des tables)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO apex_app;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO apex_readonly;

-- ============================================================================
-- AUTH_V2 SCHEMA (Remplacement auth Supabase)
-- ============================================================================

CREATE TABLE IF NOT EXISTS auth_v2.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMPTZ,
    phone VARCHAR(50),
    phone_verified BOOLEAN DEFAULT false,
    encrypted_password VARCHAR(255),
    raw_user_meta_data JSONB DEFAULT '{}'::jsonb,
    raw_app_meta_data JSONB DEFAULT '{}'::jsonb,
    is_super_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_sign_in_at TIMESTAMPTZ,
    banned_until TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_auth_v2_users_email ON auth_v2.users(email);
CREATE INDEX idx_auth_v2_users_external_id ON auth_v2.users(external_id);
CREATE INDEX idx_auth_v2_users_created ON auth_v2.users(created_at);

CREATE TABLE IF NOT EXISTS auth_v2.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth_v2.users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ
);

CREATE INDEX idx_auth_v2_sessions_user ON auth_v2.sessions(user_id);
CREATE INDEX idx_auth_v2_sessions_expires ON auth_v2.sessions(expires_at);

CREATE TABLE IF NOT EXISTS auth_v2.refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES auth_v2.sessions(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ
);

COMMENT ON TABLE auth_v2.users IS 'User accounts - replaces Supabase auth.users';
COMMENT ON TABLE auth_v2.sessions IS 'Active user sessions';
COMMENT ON TABLE auth_v2.refresh_tokens IS 'JWT refresh tokens';

-- ============================================================================
-- STORAGE_V2 SCHEMA (Remplacement storage Supabase)
-- ============================================================================

CREATE TABLE IF NOT EXISTS storage_v2.buckets (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    owner_id UUID REFERENCES auth_v2.users(id) ON DELETE SET NULL,
    public BOOLEAN NOT NULL DEFAULT false,
    file_size_limit BIGINT,
    allowed_mime_types TEXT[],
    avif_autodetection BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS storage_v2.objects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bucket_id VARCHAR(255) NOT NULL REFERENCES storage_v2.buckets(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    owner_id UUID REFERENCES auth_v2.users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    path_tokens TEXT[] GENERATED ALWAYS AS (string_to_array(name, '/')) STORED,
    version VARCHAR(50) DEFAULT '1',
    size BIGINT,
    mime_type VARCHAR(255),
    etag VARCHAR(255),
    storage_backend VARCHAR(50) DEFAULT 'minio',
    storage_path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_accessed_at TIMESTAMPTZ,
    UNIQUE(bucket_id, name)
);

CREATE INDEX idx_storage_v2_objects_bucket ON storage_v2.objects(bucket_id);
CREATE INDEX idx_storage_v2_objects_owner ON storage_v2.objects(owner_id);
CREATE INDEX idx_storage_v2_objects_path ON storage_v2.objects USING GIN(path_tokens);

COMMENT ON TABLE storage_v2.buckets IS 'Storage buckets metadata - replaces Supabase storage.buckets';
COMMENT ON TABLE storage_v2.objects IS 'Object metadata - actual files in MinIO/S3';

-- ============================================================================
-- AUDIT SCHEMA
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit.logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    actor_id UUID,
    actor_email VARCHAR(255),
    actor_ip INET,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    old_data JSONB,
    new_data JSONB,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_audit_logs_timestamp ON audit.logs(timestamp DESC);
CREATE INDEX idx_audit_logs_actor ON audit.logs(actor_id);
CREATE INDEX idx_audit_logs_action ON audit.logs(action);
CREATE INDEX idx_audit_logs_resource ON audit.logs(resource_type, resource_id);

-- Partitionner par mois pour la performance
-- CREATE TABLE audit.logs_y2026m01 PARTITION OF audit.logs
--     FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

COMMENT ON TABLE audit.logs IS 'Comprehensive audit log for all database operations';

-- ============================================================================
-- STANDALONE HELPER FUNCTIONS (Remplacement des fonctions Supabase)
-- ============================================================================

-- Variable de session pour stocker l'ID utilisateur courant
-- Sera set par le backend avant chaque requete

-- Fonction pour obtenir l'ID utilisateur courant
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_user_id', true), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Fonction pour obtenir le tenant_id courant
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant_id', true), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Fonction pour verifier si l'utilisateur est admin plateforme
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(
        current_setting('app.is_platform_admin', true)::boolean,
        false
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Fonction pour verifier si l'utilisateur est admin tenant
CREATE OR REPLACE FUNCTION public.is_tenant_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(
        current_setting('app.is_tenant_admin', true)::boolean,
        false
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Alias pour compatibilite avec code existant
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN public.current_user_id();
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN public.current_tenant_id();
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.current_user_id() IS 'Returns current user ID from session variable - replaces auth.uid()';
COMMENT ON FUNCTION public.current_tenant_id() IS 'Returns current tenant ID from session variable';
COMMENT ON FUNCTION public.is_platform_admin() IS 'Checks if current user is platform admin';
COMMENT ON FUNCTION public.is_tenant_admin() IS 'Checks if current user is tenant admin';

-- ============================================================================
-- TRIGGER FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INITIALIZATION COMPLETE
-- ============================================================================

SELECT 'Standalone PostgreSQL initialization complete' AS status;
```

### 3.5 Phase 3: Migration des Donnees

#### 3.5.1 Script de Migration des Utilisateurs

```sql
-- migrate_users.sql
-- Migration des utilisateurs de Supabase auth vers auth_v2

BEGIN;

-- Migrer les utilisateurs
INSERT INTO auth_v2.users (
    id,
    email,
    email_verified,
    email_verified_at,
    encrypted_password,
    raw_user_meta_data,
    raw_app_meta_data,
    created_at,
    updated_at,
    last_sign_in_at
)
SELECT
    id,
    email,
    email_confirmed_at IS NOT NULL,
    email_confirmed_at,
    encrypted_password,
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    COALESCE(raw_app_meta_data, '{}'::jsonb),
    created_at,
    updated_at,
    last_sign_in_at
FROM _migration_staging.auth_users
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    email_verified = EXCLUDED.email_verified,
    updated_at = now();

-- Valider le nombre de lignes
DO $$
DECLARE
    v_source_count INTEGER;
    v_target_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_source_count FROM _migration_staging.auth_users;
    SELECT COUNT(*) INTO v_target_count FROM auth_v2.users;

    IF v_source_count != v_target_count THEN
        RAISE EXCEPTION 'User migration mismatch: source=%, target=%',
            v_source_count, v_target_count;
    END IF;

    RAISE NOTICE 'Users migrated successfully: %', v_target_count;
END;
$$;

COMMIT;
```

#### 3.5.2 Script de Migration des Tables Metier

```sql
-- migrate_business_tables.sql
-- Migration des tables metier public.*

BEGIN;

-- Desactiver temporairement les triggers et FK pour la performance
SET session_replication_role = replica;

-- Table de log de migration
CREATE TABLE IF NOT EXISTS _migration.log (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(255) NOT NULL,
    source_count BIGINT,
    target_count BIGINT,
    migrated_at TIMESTAMPTZ DEFAULT now(),
    status VARCHAR(20) DEFAULT 'pending',
    error_message TEXT
);

-- Migration tenant
INSERT INTO _migration.log (table_name, source_count)
SELECT 'tenant', COUNT(*) FROM _staging.tenant;

INSERT INTO public.tenant SELECT * FROM _staging.tenant
ON CONFLICT (id) DO NOTHING;

UPDATE _migration.log
SET target_count = (SELECT COUNT(*) FROM public.tenant),
    status = 'completed'
WHERE table_name = 'tenant';

-- Migration org
INSERT INTO _migration.log (table_name, source_count)
SELECT 'org', COUNT(*) FROM _staging.org;

INSERT INTO public.org SELECT * FROM _staging.org
ON CONFLICT (id) DO NOTHING;

UPDATE _migration.log
SET target_count = (SELECT COUNT(*) FROM public.org),
    status = 'completed'
WHERE table_name = 'org';

-- Migration project
INSERT INTO _migration.log (table_name, source_count)
SELECT 'project', COUNT(*) FROM _staging.project;

INSERT INTO public.project SELECT * FROM _staging.project
ON CONFLICT (id) DO NOTHING;

UPDATE _migration.log
SET target_count = (SELECT COUNT(*) FROM public.project),
    status = 'completed'
WHERE table_name = 'project';

-- [Continuer pour toutes les 130+ tables...]
-- Generer dynamiquement avec:
-- SELECT 'INSERT INTO public.' || tablename || ' SELECT * FROM _staging.' || tablename || ' ON CONFLICT (id) DO NOTHING;'
-- FROM pg_tables WHERE schemaname = 'public';

-- Reactiver les triggers et FK
SET session_replication_role = DEFAULT;

-- Verification finale
SELECT
    table_name,
    source_count,
    target_count,
    CASE WHEN source_count = target_count THEN 'OK' ELSE 'MISMATCH' END AS validation
FROM _migration.log
ORDER BY table_name;

COMMIT;
```

### 3.6 Phase 4: Reconfiguration RLS

#### 3.6.1 Adaptation des Politiques RLS

```sql
-- adapt_rls_policies.sql
-- Adaptation des politiques RLS pour fonctionner sans Supabase

-- ============================================================================
-- Supprimer les anciennes politiques dependantes de auth.uid()
-- ============================================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
                       r.policyname, r.schemaname, r.tablename);
    END LOOP;
END;
$$;

-- ============================================================================
-- Nouvelles politiques utilisant public.current_user_id()
-- ============================================================================

-- TENANT
CREATE POLICY tenant_select_policy ON public.tenant
    FOR SELECT
    USING (
        public.is_platform_admin()
        OR id = public.current_tenant_id()
    );

CREATE POLICY tenant_insert_policy ON public.tenant
    FOR INSERT
    WITH CHECK (public.is_platform_admin());

CREATE POLICY tenant_update_policy ON public.tenant
    FOR UPDATE
    USING (
        public.is_platform_admin()
        OR (id = public.current_tenant_id() AND public.is_tenant_admin())
    );

CREATE POLICY tenant_delete_policy ON public.tenant
    FOR DELETE
    USING (public.is_platform_admin());

-- ORG
CREATE POLICY org_select_policy ON public.org
    FOR SELECT
    USING (tenant_id = public.current_tenant_id());

CREATE POLICY org_insert_policy ON public.org
    FOR INSERT
    WITH CHECK (
        tenant_id = public.current_tenant_id()
        AND public.is_tenant_admin()
    );

CREATE POLICY org_update_policy ON public.org
    FOR UPDATE
    USING (
        tenant_id = public.current_tenant_id()
        AND public.is_tenant_admin()
    );

CREATE POLICY org_delete_policy ON public.org
    FOR DELETE
    USING (
        tenant_id = public.current_tenant_id()
        AND public.is_tenant_admin()
    );

-- PROJECT
CREATE POLICY project_select_policy ON public.project
    FOR SELECT
    USING (
        tenant_id = public.current_tenant_id()
        AND (
            visibility = 'public'
            OR visibility = 'internal'
            OR public.has_project_access(id)
            OR public.is_tenant_admin()
        )
    );

CREATE POLICY project_insert_policy ON public.project
    FOR INSERT
    WITH CHECK (
        tenant_id = public.current_tenant_id()
        AND public.is_tenant_admin()
    );

CREATE POLICY project_update_policy ON public.project
    FOR UPDATE
    USING (
        tenant_id = public.current_tenant_id()
        AND (
            public.has_project_permission(id, 'project:update')
            OR public.is_tenant_admin()
        )
    );

CREATE POLICY project_delete_policy ON public.project
    FOR DELETE
    USING (
        tenant_id = public.current_tenant_id()
        AND public.is_tenant_admin()
    );

-- [Continuer pour toutes les tables avec RLS...]

-- ============================================================================
-- Fonction has_project_access adaptee
-- ============================================================================

CREATE OR REPLACE FUNCTION public.has_project_access(p_project_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_has_access BOOLEAN;
    v_current_user UUID;
BEGIN
    v_current_user := public.current_user_id();

    IF v_current_user IS NULL THEN
        RETURN false;
    END IF;

    SELECT EXISTS (
        SELECT 1
        FROM public.principal_role_binding prb
        WHERE prb.scope_type = 'project' AND prb.scope_id = p_project_id
        AND (
            (prb.principal_type = 'user' AND prb.principal_id = v_current_user)
            OR (prb.principal_type = 'group' AND prb.principal_id IN (
                SELECT gm.group_id
                FROM public.group_member gm
                WHERE gm.user_id = v_current_user
            ))
        )
    ) INTO v_has_access;

    RETURN v_has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- Fonction has_project_permission adaptee
-- ============================================================================

CREATE OR REPLACE FUNCTION public.has_project_permission(p_project_id UUID, p_permission_code VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    v_has_permission BOOLEAN;
    v_current_user UUID;
BEGIN
    v_current_user := public.current_user_id();

    IF v_current_user IS NULL THEN
        RETURN false;
    END IF;

    SELECT EXISTS (
        SELECT 1
        FROM public.principal_role_binding prb
        INNER JOIN public.role_permission rp ON rp.role_id = prb.role_id
        INNER JOIN public.permission p ON p.id = rp.permission_id
        WHERE prb.scope_type = 'project' AND prb.scope_id = p_project_id
        AND p.code = p_permission_code
        AND (
            (prb.principal_type = 'user' AND prb.principal_id = v_current_user)
            OR (prb.principal_type = 'group' AND prb.principal_id IN (
                SELECT gm.group_id
                FROM public.group_member gm
                WHERE gm.user_id = v_current_user
            ))
        )
    ) INTO v_has_permission;

    RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

---

## 4. MODELE DE SECURITE

### 4.1 Roles et Privileges

```sql
-- security_model.sql

-- ============================================================================
-- ROLE HIERARCHY
-- ============================================================================

/*
  apex_superadmin (superuser - DBA only)
      |
      +-- apex_admin (can create roles, manage schema)
      |       |
      |       +-- apex_service (backend API role)
      |       |       |
      |       |       +-- apex_app (standard application role)
      |       |       |
      |       |       +-- apex_readonly (read-only for reporting)
      |       |
      |       +-- apex_migration (for data migrations)
      |
      +-- apex_backup (backup operations)
*/

-- Creer la hierarchie
GRANT apex_readonly TO apex_app;
GRANT apex_app TO apex_service;
GRANT apex_service TO apex_admin;
GRANT apex_migration TO apex_admin;
GRANT apex_backup TO apex_admin;

-- ============================================================================
-- GRANTS PAR SCHEMA
-- ============================================================================

-- Schema public (tables metier)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO apex_app;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO apex_readonly;
GRANT ALL ON ALL TABLES IN SCHEMA public TO apex_service;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO apex_app, apex_service;

-- Schema auth_v2
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA auth_v2 TO apex_service;
GRANT SELECT ON ALL TABLES IN SCHEMA auth_v2 TO apex_app;

-- Schema storage_v2
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA storage_v2 TO apex_service;
GRANT SELECT ON ALL TABLES IN SCHEMA storage_v2 TO apex_app;

-- Schema audit
GRANT INSERT ON audit.logs TO apex_app, apex_service;
GRANT SELECT ON audit.logs TO apex_readonly, apex_admin;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Activer RLS sur toutes les tables public
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename NOT LIKE '_%'  -- Exclure tables systeme
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
        EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', r.tablename);
    END LOOP;
END;
$$;

-- ============================================================================
-- AUDIT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION audit.log_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit.logs (
        actor_id,
        actor_ip,
        action,
        resource_type,
        resource_id,
        old_data,
        new_data
    )
    VALUES (
        public.current_user_id(),
        inet_client_addr(),
        TG_OP,
        TG_TABLE_NAME,
        CASE TG_OP
            WHEN 'DELETE' THEN (OLD).id
            ELSE (NEW).id
        END,
        CASE TG_OP
            WHEN 'INSERT' THEN NULL
            ELSE to_jsonb(OLD)
        END,
        CASE TG_OP
            WHEN 'DELETE' THEN NULL
            ELSE to_jsonb(NEW)
        END
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Appliquer audit sur tables critiques
CREATE TRIGGER audit_tenant_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.tenant
    FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

CREATE TRIGGER audit_project_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.project
    FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

CREATE TRIGGER audit_user_account_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.user_account
    FOR EACH ROW EXECUTE FUNCTION audit.log_changes();
```

### 4.2 Chiffrement et Secrets

```sql
-- encryption_setup.sql

-- ============================================================================
-- CHIFFREMENT DES DONNEES SENSIBLES
-- ============================================================================

-- Extension pgcrypto est deja installee

-- Cle de chiffrement (a stocker dans Vault, pas en base)
-- CREATE EXTENSION IF NOT EXISTS pgsodium;  -- Alternative plus moderne

-- Fonction pour chiffrer les secrets
CREATE OR REPLACE FUNCTION public.encrypt_secret(p_plaintext TEXT)
RETURNS TEXT AS $$
DECLARE
    v_key BYTEA;
BEGIN
    -- Recuperer la cle depuis la configuration (definie par le backend)
    v_key := decode(current_setting('app.encryption_key', true), 'hex');

    IF v_key IS NULL THEN
        RAISE EXCEPTION 'Encryption key not configured';
    END IF;

    RETURN encode(
        pgp_sym_encrypt(p_plaintext, encode(v_key, 'escape')),
        'base64'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour dechiffrer les secrets
CREATE OR REPLACE FUNCTION public.decrypt_secret(p_ciphertext TEXT)
RETURNS TEXT AS $$
DECLARE
    v_key BYTEA;
BEGIN
    v_key := decode(current_setting('app.encryption_key', true), 'hex');

    IF v_key IS NULL THEN
        RAISE EXCEPTION 'Encryption key not configured';
    END IF;

    RETURN pgp_sym_decrypt(
        decode(p_ciphertext, 'base64'),
        encode(v_key, 'escape')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SSL/TLS CONFIGURATION
-- ============================================================================

-- Dans postgresql.conf:
-- ssl = on
-- ssl_cert_file = '/etc/postgresql/ssl/server.crt'
-- ssl_key_file = '/etc/postgresql/ssl/server.key'
-- ssl_ca_file = '/etc/postgresql/ssl/ca.crt'

-- Forcer SSL pour les connexions externes
-- Dans pg_hba.conf:
-- hostssl all all 0.0.0.0/0 scram-sha-256

-- ============================================================================
-- PASSWORD POLICY
-- ============================================================================

-- Fonction pour valider la complexite du mot de passe
CREATE OR REPLACE FUNCTION auth_v2.validate_password(p_password TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Minimum 12 caracteres
    IF length(p_password) < 12 THEN
        RAISE EXCEPTION 'Password must be at least 12 characters';
    END IF;

    -- Au moins une majuscule
    IF p_password !~ '[A-Z]' THEN
        RAISE EXCEPTION 'Password must contain at least one uppercase letter';
    END IF;

    -- Au moins une minuscule
    IF p_password !~ '[a-z]' THEN
        RAISE EXCEPTION 'Password must contain at least one lowercase letter';
    END IF;

    -- Au moins un chiffre
    IF p_password !~ '[0-9]' THEN
        RAISE EXCEPTION 'Password must contain at least one digit';
    END IF;

    -- Au moins un caractere special
    IF p_password !~ '[!@#$%^&*(),.?":{}|<>]' THEN
        RAISE EXCEPTION 'Password must contain at least one special character';
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour valider le mot de passe avant insertion
CREATE OR REPLACE FUNCTION auth_v2.hash_password()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.encrypted_password IS NOT NULL AND
       NEW.encrypted_password NOT LIKE '$2a$%' AND
       NEW.encrypted_password NOT LIKE '$2b$%' THEN
        -- Valider puis hasher
        PERFORM auth_v2.validate_password(NEW.encrypted_password);
        NEW.encrypted_password := crypt(NEW.encrypted_password, gen_salt('bf', 12));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hash_user_password
    BEFORE INSERT OR UPDATE OF encrypted_password ON auth_v2.users
    FOR EACH ROW EXECUTE FUNCTION auth_v2.hash_password();
```

---

## 5. SCRIPTS ET AUTOMATISATION

### 5.1 Script d'Export Complet

```bash
#!/bin/bash
# scripts/export_complete.sh
# Export complet de la base Supabase

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXPORT_DIR="${SCRIPT_DIR}/../exports/$(date +%Y%m%d_%H%M%S)"
LOG_FILE="${EXPORT_DIR}/export.log"

# Charger les variables d'environnement
source "${SCRIPT_DIR}/.env.export"

# Fonctions
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "${LOG_FILE}"
}

error_exit() {
    log "ERROR: $1"
    exit 1
}

# Creer repertoire d'export
mkdir -p "${EXPORT_DIR}"/{schema,data,storage,validation}

log "=== Starting Supabase Export ==="
log "Export directory: ${EXPORT_DIR}"

# 1. Export schema
log "Exporting schema..."
pg_dump \
    --host="${SUPABASE_DB_HOST}" \
    --port=5432 \
    --username=postgres \
    --dbname=postgres \
    --schema=public \
    --schema-only \
    --no-owner \
    --no-privileges \
    --file="${EXPORT_DIR}/schema/public_schema.sql" \
    2>> "${LOG_FILE}" || error_exit "Schema export failed"

# 2. Export data
log "Exporting data..."
pg_dump \
    --host="${SUPABASE_DB_HOST}" \
    --port=5432 \
    --username=postgres \
    --dbname=postgres \
    --schema=public \
    --data-only \
    --format=custom \
    --file="${EXPORT_DIR}/data/public_data.dump" \
    2>> "${LOG_FILE}" || error_exit "Data export failed"

# 3. Export auth users
log "Exporting auth users..."
psql \
    --host="${SUPABASE_DB_HOST}" \
    --port=5432 \
    --username=postgres \
    --dbname=postgres \
    --command="COPY (
        SELECT id, email, email_confirmed_at, encrypted_password,
               raw_user_meta_data, raw_app_meta_data,
               created_at, updated_at, last_sign_in_at
        FROM auth.users
        WHERE deleted_at IS NULL
    ) TO STDOUT WITH (FORMAT CSV, HEADER TRUE)" \
    > "${EXPORT_DIR}/data/auth_users.csv" \
    2>> "${LOG_FILE}" || error_exit "Auth users export failed"

# 4. Export storage metadata
log "Exporting storage metadata..."
psql \
    --host="${SUPABASE_DB_HOST}" \
    --port=5432 \
    --username=postgres \
    --dbname=postgres \
    --command="COPY (
        SELECT * FROM storage.buckets
    ) TO STDOUT WITH (FORMAT CSV, HEADER TRUE)" \
    > "${EXPORT_DIR}/storage/buckets.csv" \
    2>> "${LOG_FILE}"

psql \
    --host="${SUPABASE_DB_HOST}" \
    --port=5432 \
    --username=postgres \
    --dbname=postgres \
    --command="COPY (
        SELECT id, bucket_id, name, owner, metadata,
               created_at, updated_at, last_accessed_at
        FROM storage.objects
    ) TO STDOUT WITH (FORMAT CSV, HEADER TRUE)" \
    > "${EXPORT_DIR}/storage/objects.csv" \
    2>> "${LOG_FILE}"

# 5. Validation counts
log "Generating validation data..."
psql \
    --host="${SUPABASE_DB_HOST}" \
    --port=5432 \
    --username=postgres \
    --dbname=postgres \
    --tuples-only \
    --command="
    SELECT json_agg(row_to_json(t))
    FROM (
        SELECT
            schemaname,
            tablename,
            (xpath('/row/cnt/text()',
                   query_to_xml(format('SELECT COUNT(*) AS cnt FROM %I.%I',
                                       schemaname, tablename), false, true, '')))[1]::text::bigint AS row_count
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY tablename
    ) t" \
    > "${EXPORT_DIR}/validation/table_counts.json" \
    2>> "${LOG_FILE}"

# 6. Checksum des donnees
log "Computing checksums..."
md5sum "${EXPORT_DIR}"/data/* > "${EXPORT_DIR}/validation/checksums.md5"

# 7. Compresser l'export
log "Compressing export..."
tar -czf "${EXPORT_DIR}.tar.gz" -C "$(dirname "${EXPORT_DIR}")" "$(basename "${EXPORT_DIR}")"

log "=== Export Complete ==="
log "Archive: ${EXPORT_DIR}.tar.gz"
log "Size: $(du -h "${EXPORT_DIR}.tar.gz" | cut -f1)"
```

### 5.2 Script d'Import Standalone

```bash
#!/bin/bash
# scripts/import_standalone.sh
# Import des donnees dans PostgreSQL standalone

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IMPORT_DIR="$1"
LOG_FILE="${IMPORT_DIR}/import.log"

# Charger les variables d'environnement
source "${SCRIPT_DIR}/.env.standalone"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "${LOG_FILE}"
}

error_exit() {
    log "ERROR: $1"
    exit 1
}

# Verifier les prerequisites
[ -d "${IMPORT_DIR}" ] || error_exit "Import directory not found: ${IMPORT_DIR}"
[ -f "${IMPORT_DIR}/data/public_data.dump" ] || error_exit "Data dump not found"

log "=== Starting Import to Standalone PostgreSQL ==="
log "Import directory: ${IMPORT_DIR}"

# 1. Verifier la connectivite
log "Testing database connection..."
psql \
    --host="${PG_HOST}" \
    --port="${PG_PORT}" \
    --username="${PG_USER}" \
    --dbname="${PG_DATABASE}" \
    --command="SELECT 1" \
    > /dev/null 2>&1 || error_exit "Cannot connect to database"

# 2. Creer les schemas de staging
log "Creating staging schemas..."
psql \
    --host="${PG_HOST}" \
    --port="${PG_PORT}" \
    --username="${PG_USER}" \
    --dbname="${PG_DATABASE}" \
    --command="
    CREATE SCHEMA IF NOT EXISTS _staging;
    CREATE SCHEMA IF NOT EXISTS _migration;
    CREATE TABLE IF NOT EXISTS _migration.log (
        id SERIAL PRIMARY KEY,
        step VARCHAR(100),
        status VARCHAR(20),
        started_at TIMESTAMPTZ DEFAULT now(),
        completed_at TIMESTAMPTZ,
        details JSONB
    );
    "

# 3. Importer les users auth
log "Importing auth users..."
psql \
    --host="${PG_HOST}" \
    --port="${PG_PORT}" \
    --username="${PG_USER}" \
    --dbname="${PG_DATABASE}" \
    --command="
    CREATE TABLE IF NOT EXISTS _staging.auth_users (
        id UUID PRIMARY KEY,
        email VARCHAR(255),
        email_confirmed_at TIMESTAMPTZ,
        encrypted_password VARCHAR(255),
        raw_user_meta_data JSONB,
        raw_app_meta_data JSONB,
        created_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ,
        last_sign_in_at TIMESTAMPTZ
    );
    "

psql \
    --host="${PG_HOST}" \
    --port="${PG_PORT}" \
    --username="${PG_USER}" \
    --dbname="${PG_DATABASE}" \
    --command="\COPY _staging.auth_users FROM '${IMPORT_DIR}/data/auth_users.csv' WITH (FORMAT CSV, HEADER TRUE)"

# 4. Importer les donnees public
log "Importing public data..."
pg_restore \
    --host="${PG_HOST}" \
    --port="${PG_PORT}" \
    --username="${PG_USER}" \
    --dbname="${PG_DATABASE}" \
    --schema=_staging \
    --no-owner \
    --no-privileges \
    --verbose \
    "${IMPORT_DIR}/data/public_data.dump" \
    2>> "${LOG_FILE}" || log "Warning: Some restore errors (may be OK)"

# 5. Migrer vers schemas definitifs
log "Migrating to final schemas..."
psql \
    --host="${PG_HOST}" \
    --port="${PG_PORT}" \
    --username="${PG_USER}" \
    --dbname="${PG_DATABASE}" \
    --file="${SCRIPT_DIR}/sql/migrate_to_final.sql" \
    2>> "${LOG_FILE}"

# 6. Valider les counts
log "Validating data..."
psql \
    --host="${PG_HOST}" \
    --port="${PG_PORT}" \
    --username="${PG_USER}" \
    --dbname="${PG_DATABASE}" \
    --command="
    SELECT
        schemaname,
        tablename,
        (xpath('/row/cnt/text()',
               query_to_xml(format('SELECT COUNT(*) AS cnt FROM %I.%I',
                                   schemaname, tablename), false, true, '')))[1]::text::bigint AS row_count
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename;
    " > "${IMPORT_DIR}/validation/post_import_counts.txt"

# 7. Comparer les counts
log "Comparing counts..."
python3 "${SCRIPT_DIR}/validate_counts.py" \
    "${IMPORT_DIR}/validation/table_counts.json" \
    "${IMPORT_DIR}/validation/post_import_counts.txt" \
    || error_exit "Count validation failed"

# 8. Nettoyer staging
log "Cleaning up staging..."
psql \
    --host="${PG_HOST}" \
    --port="${PG_PORT}" \
    --username="${PG_USER}" \
    --dbname="${PG_DATABASE}" \
    --command="DROP SCHEMA IF EXISTS _staging CASCADE;"

log "=== Import Complete ==="
```

### 5.3 Script de Validation

```python
#!/usr/bin/env python3
# scripts/validate_counts.py
"""Validation des counts apres migration."""

import json
import sys
from pathlib import Path


def load_source_counts(json_file: Path) -> dict:
    """Load source counts from JSON."""
    with open(json_file) as f:
        data = json.load(f)
    return {row['tablename']: row['row_count'] for row in data}


def load_target_counts(txt_file: Path) -> dict:
    """Load target counts from psql output."""
    counts = {}
    with open(txt_file) as f:
        for line in f:
            parts = line.strip().split('|')
            if len(parts) >= 3:
                schema = parts[0].strip()
                table = parts[1].strip()
                count = parts[2].strip()
                if schema == 'public' and count.isdigit():
                    counts[table] = int(count)
    return counts


def validate(source_file: str, target_file: str) -> bool:
    """Compare source and target counts."""
    source = load_source_counts(Path(source_file))
    target = load_target_counts(Path(target_file))

    all_tables = set(source.keys()) | set(target.keys())
    errors = []

    for table in sorted(all_tables):
        src_count = source.get(table, 0)
        tgt_count = target.get(table, 0)

        if src_count != tgt_count:
            errors.append(f"  {table}: source={src_count}, target={tgt_count}")
        else:
            print(f"OK: {table} ({src_count} rows)")

    if errors:
        print("\nMISMATCHES:")
        print("\n".join(errors))
        return False

    print(f"\nAll {len(all_tables)} tables validated successfully!")
    return True


if __name__ == '__main__':
    if len(sys.argv) != 3:
        print("Usage: validate_counts.py <source_json> <target_txt>")
        sys.exit(1)

    success = validate(sys.argv[1], sys.argv[2])
    sys.exit(0 if success else 1)
```

---

## 6. DEPLOIEMENT ET PORTABILITE

### 6.1 Docker Compose pour Developpement

```yaml
# docker-compose.standalone.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: apex-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: apex_ml_platform
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d:ro
      - ./ssl:/etc/postgresql/ssl:ro
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    command:
      - "postgres"
      - "-c"
      - "ssl=on"
      - "-c"
      - "ssl_cert_file=/etc/postgresql/ssl/server.crt"
      - "-c"
      - "ssl_key_file=/etc/postgresql/ssl/server.key"

  pgbouncer:
    image: bitnami/pgbouncer:latest
    container_name: apex-pgbouncer
    environment:
      PGBOUNCER_DATABASE: apex_ml_platform
      POSTGRESQL_HOST: postgres
      POSTGRESQL_USERNAME: postgres
      POSTGRESQL_PASSWORD: ${POSTGRES_PASSWORD}
      PGBOUNCER_POOL_MODE: transaction
      PGBOUNCER_MAX_CLIENT_CONN: 1000
      PGBOUNCER_DEFAULT_POOL_SIZE: 50
    ports:
      - "6432:6432"
    depends_on:
      postgres:
        condition: service_healthy

  minio:
    image: minio/minio:latest
    container_name: apex-minio
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

  keycloak:
    image: quay.io/keycloak/keycloak:24.0
    container_name: apex-keycloak
    environment:
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://postgres:5432/keycloak
      KC_DB_USERNAME: postgres
      KC_DB_PASSWORD: ${POSTGRES_PASSWORD}
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: ${KEYCLOAK_ADMIN_PASSWORD}
    ports:
      - "8080:8080"
    command: start-dev
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  postgres_data:
  minio_data:
```

### 6.2 Kubernetes Manifests

```yaml
# k8s/postgres-statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: apex-postgres
  namespace: apex-ml-platform
spec:
  serviceName: apex-postgres
  replicas: 1
  selector:
    matchLabels:
      app: apex-postgres
  template:
    metadata:
      labels:
        app: apex-postgres
    spec:
      containers:
      - name: postgres
        image: postgres:16-alpine
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: postgres-credentials
              key: username
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-credentials
              key: password
        - name: POSTGRES_DB
          value: apex_ml_platform
        volumeMounts:
        - name: postgres-data
          mountPath: /var/lib/postgresql/data
        - name: postgres-config
          mountPath: /etc/postgresql/postgresql.conf
          subPath: postgresql.conf
        - name: postgres-ssl
          mountPath: /etc/postgresql/ssl
        resources:
          requests:
            memory: "2Gi"
            cpu: "1"
          limits:
            memory: "4Gi"
            cpu: "2"
        livenessProbe:
          exec:
            command:
            - pg_isready
            - -U
            - postgres
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          exec:
            command:
            - pg_isready
            - -U
            - postgres
          initialDelaySeconds: 5
          periodSeconds: 5
      volumes:
      - name: postgres-config
        configMap:
          name: postgres-config
      - name: postgres-ssl
        secret:
          secretName: postgres-ssl-certs
  volumeClaimTemplates:
  - metadata:
      name: postgres-data
    spec:
      accessModes: ["ReadWriteOnce"]
      storageClassName: fast-ssd
      resources:
        requests:
          storage: 100Gi
---
apiVersion: v1
kind: Service
metadata:
  name: apex-postgres
  namespace: apex-ml-platform
spec:
  selector:
    app: apex-postgres
  ports:
  - port: 5432
    targetPort: 5432
  clusterIP: None
```

### 6.3 Backup et Restauration

```bash
#!/bin/bash
# scripts/backup.sh
# Backup automatique PostgreSQL standalone

set -euo pipefail

BACKUP_DIR="/backups/postgres"
RETENTION_DAYS=30
S3_BUCKET="apex-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/apex_ml_platform_${TIMESTAMP}.dump"

# Creer le backup
pg_dump \
    --host="${PG_HOST}" \
    --port="${PG_PORT}" \
    --username="${PG_USER}" \
    --dbname="${PG_DATABASE}" \
    --format=custom \
    --compress=9 \
    --file="${BACKUP_FILE}"

# Verifier le backup
pg_restore --list "${BACKUP_FILE}" > /dev/null

# Calculer checksum
md5sum "${BACKUP_FILE}" > "${BACKUP_FILE}.md5"

# Upload vers S3 (optionnel)
if [ -n "${S3_BUCKET:-}" ]; then
    aws s3 cp "${BACKUP_FILE}" "s3://${S3_BUCKET}/postgres/"
    aws s3 cp "${BACKUP_FILE}.md5" "s3://${S3_BUCKET}/postgres/"
fi

# Nettoyer les anciens backups
find "${BACKUP_DIR}" -name "*.dump" -mtime +${RETENTION_DAYS} -delete
find "${BACKUP_DIR}" -name "*.md5" -mtime +${RETENTION_DAYS} -delete

echo "Backup complete: ${BACKUP_FILE}"
```

---

## 7. IMPACT APPLICATIF

### 7.1 Modifications Backend (API)

#### 7.1.1 Configuration de Connexion

```typescript
// src/config/database.ts
import { Pool } from 'pg';

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: boolean;
  max: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
}

export const dbConfig: DatabaseConfig = {
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5432'),
  database: process.env.PG_DATABASE || 'apex_ml_platform',
  user: process.env.PG_USER || 'apex_service',
  password: process.env.PG_PASSWORD!,
  ssl: process.env.PG_SSL === 'true',
  max: parseInt(process.env.PG_POOL_MAX || '20'),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

export const pool = new Pool(dbConfig);

// Middleware pour setter le contexte utilisateur
export async function setUserContext(
  client: PoolClient,
  userId: string,
  tenantId: string,
  isAdmin: boolean = false
): Promise<void> {
  await client.query(`
    SET LOCAL app.current_user_id = '${userId}';
    SET LOCAL app.current_tenant_id = '${tenantId}';
    SET LOCAL app.is_platform_admin = ${isAdmin};
    SET LOCAL app.is_tenant_admin = ${isAdmin};
  `);
}
```

#### 7.1.2 Service d'Authentification

```typescript
// src/services/auth.service.ts
import { pool, setUserContext } from '../config/database';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

interface User {
  id: string;
  email: string;
  tenantId: string;
  roles: string[];
}

export class AuthService {
  private readonly jwtSecret = process.env.JWT_SECRET!;
  private readonly jwtExpiry = '24h';

  async validateCredentials(email: string, password: string): Promise<User | null> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT u.id, u.email, u.encrypted_password,
               pm.tenant_id,
               ARRAY_AGG(r.name) as roles
        FROM auth_v2.users u
        LEFT JOIN public.project_member pm ON pm.user_id = u.id
        LEFT JOIN public.principal_role_binding prb ON prb.principal_id = u.id
        LEFT JOIN public.role r ON r.id = prb.role_id
        WHERE u.email = $1 AND u.deleted_at IS NULL
        GROUP BY u.id, u.email, u.encrypted_password, pm.tenant_id
      `, [email]);

      if (result.rows.length === 0) {
        return null;
      }

      const user = result.rows[0];
      const valid = await bcrypt.compare(password, user.encrypted_password);

      if (!valid) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        tenantId: user.tenant_id,
        roles: user.roles.filter(Boolean),
      };
    } finally {
      client.release();
    }
  }

  generateToken(user: User): string {
    return jwt.sign(
      {
        sub: user.id,
        email: user.email,
        tenant_id: user.tenantId,
        roles: user.roles,
        is_platform_admin: user.roles.includes('platform_admin'),
        is_tenant_admin: user.roles.includes('tenant_admin'),
      },
      this.jwtSecret,
      { expiresIn: this.jwtExpiry }
    );
  }

  verifyToken(token: string): User {
    const decoded = jwt.verify(token, this.jwtSecret) as any;
    return {
      id: decoded.sub,
      email: decoded.email,
      tenantId: decoded.tenant_id,
      roles: decoded.roles,
    };
  }
}
```

#### 7.1.3 Middleware Express

```typescript
// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { pool, setUserContext } from '../config/database';
import { AuthService } from '../services/auth.service';

const authService = new AuthService();

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization header' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const user = authService.verifyToken(token);
    req.user = user;

    // Injecter le contexte pour les requetes DB de cette request
    req.dbContext = {
      userId: user.id,
      tenantId: user.tenantId,
      isAdmin: user.roles.includes('platform_admin') || user.roles.includes('tenant_admin'),
    };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Middleware pour wrapper les requetes DB avec contexte
export function withDbContext(handler: Function) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const client = await pool.connect();
    try {
      await setUserContext(
        client,
        req.dbContext.userId,
        req.dbContext.tenantId,
        req.dbContext.isAdmin
      );
      req.dbClient = client;
      await handler(req, res, next);
    } finally {
      client.release();
    }
  };
}
```

### 7.2 Modifications Frontend

#### 7.2.1 Client API Standalone

```typescript
// src/lib/api-client.ts
interface ApiConfig {
  baseUrl: string;
  getToken: () => string | null;
}

export class ApiClient {
  private config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = config;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const token = this.config.getToken();

    const response = await fetch(`${this.config.baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }

    return response.json();
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  put<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('PUT', path, body);
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }
}

// Instance par defaut
export const apiClient = new ApiClient({
  baseUrl: import.meta.env.VITE_API_URL,
  getToken: () => localStorage.getItem('auth_token'),
});
```

#### 7.2.2 AuthContext Modifie

```typescript
// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { apiClient } from "@/lib/api-client";

interface User {
  id: string;
  email: string;
  tenantId: string;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verifier le token existant
    const token = localStorage.getItem('auth_token');
    if (token) {
      validateToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const validateToken = async (token: string) => {
    try {
      const user = await apiClient.get<User>('/auth/me');
      setUser(user);
    } catch {
      localStorage.removeItem('auth_token');
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      await apiClient.post('/auth/signup', { email, password, fullName });
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { token, user } = await apiClient.post<{ token: string; user: User }>(
        '/auth/signin',
        { email, password }
      );
      localStorage.setItem('auth_token', token);
      setUser(user);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
```

---

## 8. QUALITE ET COHERENCE DES DONNEES

### 8.1 Scripts de Validation

```sql
-- validation/data_quality_checks.sql

-- ============================================================================
-- CHECKS D'INTEGRITE REFERENTIELLE
-- ============================================================================

-- Verifier les FK orphelines
WITH fk_checks AS (
    SELECT
        'project.org_id' AS relation,
        COUNT(*) AS orphans
    FROM public.project p
    LEFT JOIN public.org o ON p.org_id = o.id
    WHERE p.org_id IS NOT NULL AND o.id IS NULL

    UNION ALL

    SELECT
        'ml_experiment.project_id',
        COUNT(*)
    FROM public.ml_experiment e
    LEFT JOIN public.project p ON e.project_id = p.id
    WHERE e.project_id IS NOT NULL AND p.id IS NULL

    -- [Ajouter pour toutes les FK...]
)
SELECT * FROM fk_checks WHERE orphans > 0;

-- ============================================================================
-- CHECKS DE COHERENCE METIER
-- ============================================================================

-- Projets sans tenant
SELECT 'Projects without tenant' AS issue, COUNT(*) AS count
FROM public.project WHERE tenant_id IS NULL;

-- Experiments sans projet
SELECT 'Experiments without project' AS issue, COUNT(*) AS count
FROM public.ml_experiment WHERE project_id IS NULL;

-- Models sans version
SELECT 'Models without versions' AS issue, COUNT(*) AS count
FROM public.ml_model m
WHERE NOT EXISTS (
    SELECT 1 FROM public.model_version v WHERE v.model_id = m.id
);

-- ============================================================================
-- CHECKS DE DOUBLONS
-- ============================================================================

-- Doublons tenant.slug
SELECT 'Duplicate tenant slugs' AS issue, slug, COUNT(*) AS count
FROM public.tenant
GROUP BY slug
HAVING COUNT(*) > 1;

-- Doublons user email
SELECT 'Duplicate user emails' AS issue, email, COUNT(*) AS count
FROM auth_v2.users
WHERE deleted_at IS NULL
GROUP BY email
HAVING COUNT(*) > 1;

-- ============================================================================
-- CHECKS DE VALEURS
-- ============================================================================

-- Valeurs enum invalides (impossible avec PostgreSQL mais verifions les JSONB)
SELECT 'Invalid status in metadata' AS issue, id, metadata->>'status'
FROM public.project
WHERE metadata->>'status' IS NOT NULL
AND metadata->>'status' NOT IN ('draft', 'active', 'archived');

-- Dates incoherentes
SELECT 'Updated before created' AS issue, 'project' AS table_name, id
FROM public.project
WHERE updated_at < created_at;
```

### 8.2 Script de Correction

```sql
-- validation/data_corrections.sql
-- Corrections non-destructives avec audit

BEGIN;

-- Sauvegarder les corrections
CREATE TABLE IF NOT EXISTS _migration.corrections (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100),
    record_id UUID,
    field_name VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    reason TEXT,
    corrected_at TIMESTAMPTZ DEFAULT now()
);

-- Correction: updated_at < created_at
INSERT INTO _migration.corrections (table_name, record_id, field_name, old_value, new_value, reason)
SELECT
    'project', id, 'updated_at',
    updated_at::text, created_at::text,
    'updated_at was before created_at'
FROM public.project
WHERE updated_at < created_at;

UPDATE public.project
SET updated_at = created_at
WHERE updated_at < created_at;

-- Correction: Null tenant_id (si possible de deduire)
-- [Ajouter selon les regles metier...]

COMMIT;
```

---

## ANNEXES

### A. Checklist de Migration

```markdown
## Pre-Migration
- [ ] Backup Supabase complet
- [ ] PostgreSQL 16 installe
- [ ] Keycloak deploye et configure
- [ ] MinIO deploye et configure
- [ ] Scripts testes en staging
- [ ] Equipe notifiee

## Phase 1: Export
- [ ] Schema exporte
- [ ] Donnees exportees
- [ ] Users auth exportes
- [ ] Storage metadata exportee
- [ ] Checksums calcules

## Phase 2: Creation Schema
- [ ] Database creee
- [ ] Extensions installees
- [ ] Schemas auth_v2, storage_v2, audit crees
- [ ] Roles et grants configures
- [ ] Fonctions helper creees

## Phase 3: Import
- [ ] Users migres vers auth_v2
- [ ] Tables metier importees
- [ ] Storage metadata migree
- [ ] Counts valides

## Phase 4: Reconfiguration
- [ ] Politiques RLS adaptees
- [ ] Triggers recrees
- [ ] Backend reconfigure
- [ ] Frontend reconfigure

## Phase 5: Validation
- [ ] Tests unitaires passent
- [ ] Tests integration passent
- [ ] Tests E2E passent
- [ ] Performance validee

## Phase 6: Bascule
- [ ] DNS/Load balancer bascule
- [ ] Monitoring actif
- [ ] Rollback pret

## Post-Migration
- [ ] Monitoring 24h
- [ ] Documentation mise a jour
- [ ] Supabase desactive
```

### B. Variables d'Environnement

```bash
# .env.standalone

# PostgreSQL
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=apex_ml_platform
PG_USER=apex_service
PG_PASSWORD=<secure_password>
PG_SSL=true
PG_POOL_MAX=50

# Auth
JWT_SECRET=<256_bit_secret>
JWT_EXPIRY=24h

# Storage (MinIO)
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=<access_key>
MINIO_SECRET_KEY=<secret_key>
MINIO_USE_SSL=false

# Keycloak (optionnel)
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=apex
KEYCLOAK_CLIENT_ID=apex-api
KEYCLOAK_CLIENT_SECRET=<client_secret>

# Encryption
ENCRYPTION_KEY=<hex_encoded_256_bit_key>
```

---

**Document genere le**: 2026-01-07
**Auteur**: Armand AMOUSSOU
**Version**: 1.0.0
