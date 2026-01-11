#!/bin/bash
# ============================================================================
# APEX-ML-PLATFORM - Supabase Export Script
# Version: 1.0.0
# Author: Armand AMOUSSOU
# Date: 2026-01-07
# ============================================================================
# This script exports all data from Supabase for migration to standalone
# ============================================================================

set -euo pipefail

# ==========================================================================
# CONFIGURATION
# ==========================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXPORT_DIR="${SCRIPT_DIR}/../../exports/$(date +%Y%m%d_%H%M%S)"
LOG_FILE="${EXPORT_DIR}/export.log"

# Load environment variables
if [ -f "${SCRIPT_DIR}/../.env.supabase" ]; then
    source "${SCRIPT_DIR}/../.env.supabase"
else
    echo "ERROR: .env.supabase not found. Please create it with Supabase credentials."
    echo "Required variables: SUPABASE_PROJECT_REF, SUPABASE_DB_PASSWORD"
    exit 1
fi

# Validate required variables
: "${SUPABASE_PROJECT_REF:?SUPABASE_PROJECT_REF is required}"
: "${SUPABASE_DB_PASSWORD:?SUPABASE_DB_PASSWORD is required}"

SUPABASE_DB_HOST="db.${SUPABASE_PROJECT_REF}.supabase.co"
SUPABASE_DB_PORT="5432"
SUPABASE_DB_USER="postgres"
SUPABASE_DB_NAME="postgres"

export PGPASSWORD="${SUPABASE_DB_PASSWORD}"

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

check_connectivity() {
    log "Testing database connectivity..."
    psql \
        --host="${SUPABASE_DB_HOST}" \
        --port="${SUPABASE_DB_PORT}" \
        --username="${SUPABASE_DB_USER}" \
        --dbname="${SUPABASE_DB_NAME}" \
        --command="SELECT 1" \
        > /dev/null 2>&1 || error_exit "Cannot connect to Supabase database"
    log "Database connection successful"
}

create_export_dirs() {
    log "Creating export directories..."
    mkdir -p "${EXPORT_DIR}"/{schema,data,storage,auth,validation}
    log "Created: ${EXPORT_DIR}"
}

export_schema() {
    log "Exporting public schema..."
    pg_dump \
        --host="${SUPABASE_DB_HOST}" \
        --port="${SUPABASE_DB_PORT}" \
        --username="${SUPABASE_DB_USER}" \
        --dbname="${SUPABASE_DB_NAME}" \
        --schema=public \
        --schema-only \
        --no-owner \
        --no-privileges \
        --file="${EXPORT_DIR}/schema/public_schema.sql" \
        2>> "${LOG_FILE}" || error_exit "Schema export failed"
    log "Schema exported: ${EXPORT_DIR}/schema/public_schema.sql"
}

export_data() {
    log "Exporting public data..."
    pg_dump \
        --host="${SUPABASE_DB_HOST}" \
        --port="${SUPABASE_DB_PORT}" \
        --username="${SUPABASE_DB_USER}" \
        --dbname="${SUPABASE_DB_NAME}" \
        --schema=public \
        --data-only \
        --format=custom \
        --compress=9 \
        --file="${EXPORT_DIR}/data/public_data.dump" \
        2>> "${LOG_FILE}" || error_exit "Data export failed"
    log "Data exported: ${EXPORT_DIR}/data/public_data.dump"
}

export_auth_users() {
    log "Exporting auth.users..."
    psql \
        --host="${SUPABASE_DB_HOST}" \
        --port="${SUPABASE_DB_PORT}" \
        --username="${SUPABASE_DB_USER}" \
        --dbname="${SUPABASE_DB_NAME}" \
        --command="COPY (
            SELECT
                id,
                email,
                email_confirmed_at,
                encrypted_password,
                raw_user_meta_data,
                raw_app_meta_data,
                created_at,
                updated_at,
                last_sign_in_at,
                phone,
                phone_confirmed_at,
                banned_until,
                deleted_at
            FROM auth.users
            WHERE deleted_at IS NULL
        ) TO STDOUT WITH (FORMAT CSV, HEADER TRUE, NULL 'NULL')" \
        > "${EXPORT_DIR}/auth/users.csv" \
        2>> "${LOG_FILE}" || log "Warning: Could not export auth.users"

    local user_count=$(wc -l < "${EXPORT_DIR}/auth/users.csv" || echo "0")
    log "Auth users exported: $((user_count - 1)) records"
}

export_storage_metadata() {
    log "Exporting storage metadata..."

    # Export buckets
    psql \
        --host="${SUPABASE_DB_HOST}" \
        --port="${SUPABASE_DB_PORT}" \
        --username="${SUPABASE_DB_USER}" \
        --dbname="${SUPABASE_DB_NAME}" \
        --command="COPY (SELECT * FROM storage.buckets) TO STDOUT WITH (FORMAT CSV, HEADER TRUE)" \
        > "${EXPORT_DIR}/storage/buckets.csv" \
        2>> "${LOG_FILE}" || log "Warning: Could not export storage.buckets"

    # Export objects metadata
    psql \
        --host="${SUPABASE_DB_HOST}" \
        --port="${SUPABASE_DB_PORT}" \
        --username="${SUPABASE_DB_USER}" \
        --dbname="${SUPABASE_DB_NAME}" \
        --command="COPY (
            SELECT
                id,
                bucket_id,
                name,
                owner,
                metadata,
                created_at,
                updated_at,
                last_accessed_at
            FROM storage.objects
        ) TO STDOUT WITH (FORMAT CSV, HEADER TRUE, NULL 'NULL')" \
        > "${EXPORT_DIR}/storage/objects.csv" \
        2>> "${LOG_FILE}" || log "Warning: Could not export storage.objects"

    log "Storage metadata exported"
}

generate_validation_data() {
    log "Generating validation data..."

    # Get table counts
    psql \
        --host="${SUPABASE_DB_HOST}" \
        --port="${SUPABASE_DB_PORT}" \
        --username="${SUPABASE_DB_USER}" \
        --dbname="${SUPABASE_DB_NAME}" \
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

    # Get enum types
    psql \
        --host="${SUPABASE_DB_HOST}" \
        --port="${SUPABASE_DB_PORT}" \
        --username="${SUPABASE_DB_USER}" \
        --dbname="${SUPABASE_DB_NAME}" \
        --command="
        SELECT
            t.typname AS enum_name,
            e.enumlabel AS enum_value
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public'
        ORDER BY t.typname, e.enumsortorder" \
        > "${EXPORT_DIR}/validation/enum_types.txt" \
        2>> "${LOG_FILE}"

    log "Validation data generated"
}

compute_checksums() {
    log "Computing checksums..."

    # Compute MD5 checksums for all exported files
    find "${EXPORT_DIR}" -type f -name "*.dump" -o -name "*.sql" -o -name "*.csv" | while read -r file; do
        md5sum "$file" >> "${EXPORT_DIR}/validation/checksums.md5"
    done

    log "Checksums computed: ${EXPORT_DIR}/validation/checksums.md5"
}

compress_export() {
    log "Compressing export..."

    local archive_name="apex_export_$(date +%Y%m%d_%H%M%S).tar.gz"
    tar -czf "${EXPORT_DIR}/../${archive_name}" -C "${EXPORT_DIR}/.." "$(basename "${EXPORT_DIR}")"

    local archive_size=$(du -h "${EXPORT_DIR}/../${archive_name}" | cut -f1)
    log "Archive created: ${archive_name} (${archive_size})"
}

print_summary() {
    log "============================================================"
    log "EXPORT SUMMARY"
    log "============================================================"
    log "Export directory: ${EXPORT_DIR}"
    log "Files created:"
    find "${EXPORT_DIR}" -type f | while read -r file; do
        log "  - $(basename "$file")"
    done
    log "============================================================"
    log "Next step: Run import_standalone.sh with this export"
    log "============================================================"
}

# ==========================================================================
# MAIN
# ==========================================================================

main() {
    log "============================================================"
    log "APEX-ML-PLATFORM Supabase Export"
    log "============================================================"
    log "Project: ${SUPABASE_PROJECT_REF}"
    log "Started: $(date)"
    log "============================================================"

    create_export_dirs
    check_connectivity
    export_schema
    export_data
    export_auth_users
    export_storage_metadata
    generate_validation_data
    compute_checksums
    compress_export
    print_summary

    log "Export completed successfully!"
}

main "$@"
