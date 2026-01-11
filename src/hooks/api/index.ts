// ============================================================================
// API Hooks - Main Index
// MLOps Control Plane v3
// Author: Armand AMOUSSOU
// Date: 2026-01-04
// ============================================================================

// Re-export all domain hooks

// Tenancy Domain - Tenants, Projects, Teams, Memberships
export * from './tenancy';

// Identity Domain - Users, Profiles, Roles, Permissions, API Keys
export * from './identity';

// Infrastructure Domain - Clusters, Namespaces, Compute Profiles, Runtime Policies
export * from './infrastructure';

// Registries Domain - Container Registries, Object Stores, Data Connections, Environments
export * from './registries';

// MLOps Domain - Experiments, Models, Deployments, Datasets, Features, Monitoring
export * from './mlops';

// CI/CD Domain - Git Providers, Pipelines, ArgoCD
export * from './cicd';

// Collaboration Domain - Comments, Tasks, Notifications, Activity Feed
export * from './collaboration';

// Advanced Domain - Audit Logs, Feature Flags, Quotas, Webhooks
export * from './advanced';

// Governance Domain - AI Systems, Model Cards, Risk Assessments, Compliance (EU AI Act)
export * from './governance';

// FinOps Domain - Billing, Costs, Budgets, Carbon Tracking (GreenOps)
export * from './finops';

// Observability Domain - Backends, Links, Incidents, SLA Policies
export * from './observability';

// Utils
export * from './utils/query-utils';

// ============================================================================
// HOOK USAGE EXAMPLES
// ============================================================================
//
// 1. Fetching data with pagination:
//    const { data, isLoading, error } = useTenants({
//      pagination: { page: 1, pageSize: 20 },
//      sort: { column: 'name', ascending: true },
//    });
//
// 2. Fetching a single item:
//    const { data: tenant } = useTenant(tenantId);
//
// 3. Creating a new item:
//    const createTenant = useCreateTenant({
//      onSuccess: (data) => console.log('Created:', data),
//    });
//    createTenant.mutate({ name: 'New Tenant', slug: 'new-tenant' });
//
// 4. Updating an item:
//    const updateTenant = useUpdateTenant();
//    updateTenant.mutate({ id: tenantId, updates: { name: 'Updated Name' } });
//
// 5. Using infinite scroll:
//    const { data, fetchNextPage, hasNextPage } = useInfiniteExperiments();
//
// 6. Checking feature flags:
//    const { data } = useFlagEnabled('new-feature', { userId: currentUserId });
//
// 7. Tracking quota usage:
//    const { data: status } = useQuotaStatus('project', projectId);
//
// ============================================================================

// ============================================================================
// TODO: Additional Features
// ============================================================================
// TODO: Add useRealtimeSubscription hook for real-time updates
// TODO: Add useOptimisticUpdates utility for optimistic UI
// TODO: Add usePrefetch utility for prefetching data
// TODO: Add useInfiniteScroll utility hook
// TODO: Add usePaginatedQuery utility hook
// TODO: Add useQueryWithRetry utility hook
// TODO: Add global error handling utilities
// TODO: Add request deduplication utilities
// TODO: Add cache persistence utilities
