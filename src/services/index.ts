// ============================================================================
// Services Layer - Main Index
// MLOps Control Plane v3
// Author: Armand AMOUSSOU
// Date: 2026-01-04
// ============================================================================

// Core Services
export * from './auth.service';
export * from './tenant.service';
export * from './experiment.service';
export * from './run.service';
export * from './model.service';
export * from './workspace.service';
export * from './notification.service';

// ============================================================================
// SERVICES LAYER ARCHITECTURE
// ============================================================================
//
// The services layer provides:
// 1. Business logic encapsulation
// 2. Data transformation and validation
// 3. Cross-domain operations
// 4. Caching strategies
// 5. Error handling patterns
// 6. Event dispatching
//
// Services interact with:
// - React Query hooks for data fetching
// - Supabase client for direct operations
// - External APIs and integrations
// - Event bus for cross-component communication
//
// ============================================================================

// ============================================================================
// TODO: Additional Services
// ============================================================================
// TODO: Add artifact.service for artifact management
// TODO: Add pipeline.service for ML pipelines
// TODO: Add deployment.service for model deployments
// TODO: Add monitoring.service for observability
// TODO: Add audit.service for audit logging
// TODO: Add quota.service for quota management
// TODO: Add webhook.service for webhook dispatching
// TODO: Add export.service for data exports
// TODO: Add import.service for data imports
// TODO: Add sync.service for external sync operations
