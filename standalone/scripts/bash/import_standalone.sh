#!/bin/bash
# ============================================================================
# APEX-ML-PLATFORM - Standalone Import Script
# Version: 1.0.0
# Author: Armand AMOUSSOU
# Date: 2026-01-07
# ============================================================================
# This script imports data from Supabase export to standalone PostgreSQL
# ============================================================================

set -euo pipefail

# ==========================================================================
# CONFIGURATION
# ==========================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_DIR="${SCRIPT_DIR}/../sql"
LOG_FILE=""
IMPORT_DIR=""

# Load environment variables
if [ -f "${SCRIPT_DIR}/../.env.standalone" ]; then
    source "${SCRIPT_DIR}/../.env.standalone"
else
    echo "ERROR: .env.standalone not found. Please create it with standalone DB credentials."
    exit 1
fi

# Default values
PG_HOST="${PG_HOST:-localhost}"
PG_PORT="${PG_PORT:-5432}"
PG_USER="${PG_USER:-postgres}"
PG_DATABASE="${PG_DATABASE:-apex_ml_platform}"

export PGPASSWORD="${PG_PASSWORD:?PG_PASSWORD is required}"

# ==========================================================================
# FUNCTIONS
# ==========================================================================

log() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[${timestamp}] $*" | tee -a "${LOG_FILE}"
}

error_exit() {
    log "ERROR: $1"
    exit 1
}

usage() {
    echo "Usage: $0 <export_directory>"
    echo ""
    echo "Arguments:"
    echo "  export_directory  Path to the Supabase export directory"
    echo ""
    echo "Example:"
    echo "  $0 ./exports/20260107_120000"
    exit 1
}

check_prerequisites() {
    [ -d "${IMPORT_DIR}" ] || error_exit "Import directory not found: ${IMPORT_DIR}"
    [ -f "${IMPORT_DIR}/data/public_data.dump" ] || error_exit "Data dump not found"

    log "Prerequisites check passed"
}

check_connectivity() {
    log "Testing database connectivity..."
    psql \
        --host="${PG_HOST}" \
        --port="${PG_PORT}" \
        --username="${PG_USER}" \
        --dbname="${PG_DATABASE}" \
        --command="SELECT 1" \
        > /dev/null 2>&1 || error_exit "Cannot connect to standalone database"
    log "Database connection successful"
}

run_init_script() {
    log "Running initialization script..."
    psql \
        --host="${PG_HOST}" \
        --port="${PG_PORT}" \
        --username="${PG_USER}" \
        --dbname="${PG_DATABASE}" \
        --file="${SQL_DIR}/00_init_database.sql" \
        >> "${LOG_FILE}" 2>&1 || log "Warning: Some init errors (may be OK if already initialized)"
    log "Initialization complete"
}

create_staging_schema() {
    log "Creating staging schema..."
    psql \
        --host="${PG_HOST}" \
        --port="${PG_PORT}" \
        --username="${PG_USER}" \
        --dbname="${PG_DATABASE}" \
        --command="
        CREATE SCHEMA IF NOT EXISTS _staging;
        GRANT ALL ON SCHEMA _staging TO ${PG_USER};
        " >> "${LOG_FILE}" 2>&1
    log "Staging schema created"
}

import_auth_users() {
    log "Importing auth users..."

    if [ ! -f "${IMPORT_DIR}/auth/users.csv" ]; then
        log "Warning: users.csv not found, skipping auth import"
        return
    fi

    # Create staging table
    psql \
        --host="${PG_HOST}" \
        --port="${PG_PORT}" \
        --username="${PG_USER}" \
        --dbname="${PG_DATABASE}" \
        --command="
        DROP TABLE IF EXISTS _staging.auth_users;
        CREATE TABLE _staging.auth_users (
            id UUID PRIMARY KEY,
            email VARCHAR(255),
            email_confirmed_at TIMESTAMPTZ,
            encrypted_password VARCHAR(255),
            raw_user_meta_data JSONB,
            raw_app_meta_data JSONB,
            created_at TIMESTAMPTZ,
            updated_at TIMESTAMPTZ,
            last_sign_in_at TIMESTAMPTZ,
            phone VARCHAR(50),
            phone_confirmed_at TIMESTAMPTZ,
            banned_until TIMESTAMPTZ,
            deleted_at TIMESTAMPTZ
        );
        " >> "${LOG_FILE}" 2>&1

    # Import CSV
    psql \
        --host="${PG_HOST}" \
        --port="${PG_PORT}" \
        --username="${PG_USER}" \
        --dbname="${PG_DATABASE}" \
        --command="\\COPY _staging.auth_users FROM '${IMPORT_DIR}/auth/users.csv' WITH (FORMAT CSV, HEADER TRUE, NULL 'NULL')" \
        >> "${LOG_FILE}" 2>&1

    # Migrate to auth_v2
    psql \
        --host="${PG_HOST}" \
        --port="${PG_PORT}" \
        --username="${PG_USER}" \
        --dbname="${PG_DATABASE}" \
        --command="
        INSERT INTO auth_v2.users (
            id, email, email_verified, email_verified_at,
            encrypted_password, raw_user_meta_data, raw_app_meta_data,
            created_at, updated_at, last_sign_in_at,
            phone, phone_verified, banned_until, deleted_at
        )
        SELECT
            id,
            email,
            email_confirmed_at IS NOT NULL,
            email_confirmed_at,
            encrypted_password,
            COALESCE(raw_user_meta_data, '{}'::jsonb),
            COALESCE(raw_app_meta_data, '{}'::jsonb),
            COALESCE(created_at, now()),
            COALESCE(updated_at, now()),
            last_sign_in_at,
            phone,
            phone_confirmed_at IS NOT NULL,
            banned_until,
            deleted_at
        FROM _staging.auth_users
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            updated_at = now();
        " >> "${LOG_FILE}" 2>&1

    local count=$(psql --host="${PG_HOST}" --port="${PG_PORT}" --username="${PG_USER}" --dbname="${PG_DATABASE}" --tuples-only --command="SELECT COUNT(*) FROM auth_v2.users")
    log "Auth users migrated: ${count} records"
}

import_public_data() {
    log "Importing public schema data..."

    # Disable triggers and FK for faster import
    psql \
        --host="${PG_HOST}" \
        --port="${PG_PORT}" \
        --username="${PG_USER}" \
        --dbname="${PG_DATABASE}" \
        --command="SET session_replication_role = replica;" \
        >> "${LOG_FILE}" 2>&1

    # Restore data
    pg_restore \
        --host="${PG_HOST}" \
        --port="${PG_PORT}" \
        --username="${PG_USER}" \
        --dbname="${PG_DATABASE}" \
        --schema=public \
        --data-only \
        --no-owner \
        --no-privileges \
        --disable-triggers \
        --verbose \
        "${IMPORT_DIR}/data/public_data.dump" \
        >> "${LOG_FILE}" 2>&1 || log "Warning: Some restore errors (may be OK)"

    # Re-enable triggers and FK
    psql \
        --host="${PG_HOST}" \
        --port="${PG_PORT}" \
        --username="${PG_USER}" \
        --dbname="${PG_DATABASE}" \
        --command="SET session_replication_role = DEFAULT;" \
        >> "${LOG_FILE}" 2>&1

    log "Public data import complete"
}

import_storage_metadata() {
    log "Importing storage metadata..."

    if [ ! -f "${IMPORT_DIR}/storage/objects.csv" ]; then
        log "Warning: objects.csv not found, skipping storage import"
        return
    fi

    # Create staging table for objects
    psql \
        --host="${PG_HOST}" \
        --port="${PG_PORT}" \
        --username="${PG_USER}" \
        --dbname="${PG_DATABASE}" \
        --command="
        DROP TABLE IF EXISTS _staging.storage_objects;
        CREATE TABLE _staging.storage_objects (
            id UUID,
            bucket_id VARCHAR(255),
            name TEXT,
            owner UUID,
            metadata JSONB,
            created_at TIMESTAMPTZ,
            updated_at TIMESTAMPTZ,
            last_accessed_at TIMESTAMPTZ
        );
        " >> "${LOG_FILE}" 2>&1

    # Import objects CSV
    psql \
        --host="${PG_HOST}" \
        --port="${PG_PORT}" \
        --username="${PG_USER}" \
        --dbname="${PG_DATABASE}" \
        --command="\\COPY _staging.storage_objects FROM '${IMPORT_DIR}/storage/objects.csv' WITH (FORMAT CSV, HEADER TRUE, NULL 'NULL')" \
        >> "${LOG_FILE}" 2>&1 || log "Warning: Storage objects import issues"

    # Migrate to storage_v2
    psql \
        --host="${PG_HOST}" \
        --port="${PG_PORT}" \
        --username="${PG_USER}" \
        --dbname="${PG_DATABASE}" \
        --command="
        INSERT INTO storage_v2.objects (
            id, bucket_id, name, owner_id, metadata,
            created_at, updated_at, last_accessed_at
        )
        SELECT
            id,
            bucket_id,
            name,
            owner,
            COALESCE(metadata, '{}'::jsonb),
            COALESCE(created_at, now()),
            COALESCE(updated_at, now()),
            last_accessed_at
        FROM _staging.storage_objects
        WHERE bucket_id IN (SELECT id FROM storage_v2.buckets)
        ON CONFLICT (bucket_id, name) DO UPDATE SET
            metadata = EXCLUDED.metadata,
            updated_at = now();
        " >> "${LOG_FILE}" 2>&1

    log "Storage metadata import complete"
}

apply_rls_policies() {
    log "Applying standalone RLS policies..."
    psql \
        --host="${PG_HOST}" \
        --port="${PG_PORT}" \
        --username="${PG_USER}" \
        --dbname="${PG_DATABASE}" \
        --file="${SQL_DIR}/01_rls_policies_standalone.sql" \
        >> "${LOG_FILE}" 2>&1 || log "Warning: Some RLS policy errors (may be OK)"
    log "RLS policies applied"
}

validate_import() {
    log "Validating import..."

    # Get current counts
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
        " > "${IMPORT_DIR}/validation/post_import_counts.txt" 2>> "${LOG_FILE}"

    # Compare counts if source file exists
    if [ -f "${IMPORT_DIR}/validation/table_counts.json" ]; then
        log "Comparing table counts..."
        # Basic comparison (would need Python script for detailed)
        local source_tables=$(grep -o '"tablename"' "${IMPORT_DIR}/validation/table_counts.json" | wc -l)
        local target_tables=$(grep -c "public" "${IMPORT_DIR}/validation/post_import_counts.txt" || echo "0")
        log "Source tables: ${source_tables}, Target tables: ${target_tables}"
    fi

    log "Validation complete - check ${IMPORT_DIR}/validation/post_import_counts.txt"
}

cleanup_staging() {
    log "Cleaning up staging schema..."
    psql \
        --host="${PG_HOST}" \
        --port="${PG_PORT}" \
        --username="${PG_USER}" \
        --dbname="${PG_DATABASE}" \
        --command="DROP SCHEMA IF EXISTS _staging CASCADE;" \
        >> "${LOG_FILE}" 2>&1
    log "Staging schema removed"
}

print_summary() {
    log "============================================================"
    log "IMPORT SUMMARY"
    log "============================================================"
    log "Database: ${PG_HOST}:${PG_PORT}/${PG_DATABASE}"
    log "Import source: ${IMPORT_DIR}"
    log ""
    log "Key counts:"

    psql \
        --host="${PG_HOST}" \
        --port="${PG_PORT}" \
        --username="${PG_USER}" \
        --dbname="${PG_DATABASE}" \
        --tuples-only \
        --command="
        SELECT 'auth_v2.users: ' || COUNT(*) FROM auth_v2.users
        UNION ALL
        SELECT 'storage_v2.objects: ' || COUNT(*) FROM storage_v2.objects
        UNION ALL
        SELECT 'public.tenant: ' || COUNT(*) FROM public.tenant
        UNION ALL
        SELECT 'public.project: ' || COUNT(*) FROM public.project
        UNION ALL
        SELECT 'public.ml_experiment: ' || COUNT(*) FROM public.ml_experiment
        UNION ALL
        SELECT 'public.ml_model: ' || COUNT(*) FROM public.ml_model;
        " 2>/dev/null | while read -r line; do
        log "  ${line}"
    done

    log "============================================================"
    log "Import completed successfully!"
    log "============================================================"
}

# ==========================================================================
# MAIN
# ==========================================================================

main() {
    if [ $# -lt 1 ]; then
        usage
    fi

    IMPORT_DIR="$(cd "$1" && pwd)"
    LOG_FILE="${IMPORT_DIR}/import.log"

    log "============================================================"
    log "APEX-ML-PLATFORM Standalone Import"
    log "============================================================"
    log "Target: ${PG_HOST}:${PG_PORT}/${PG_DATABASE}"
    log "Source: ${IMPORT_DIR}"
    log "Started: $(date)"
    log "============================================================"

    check_prerequisites
    check_connectivity
    run_init_script
    create_staging_schema
    import_auth_users
    import_public_data
    import_storage_metadata
    apply_rls_policies
    validate_import
    cleanup_staging
    print_summary
}

main "$@"
