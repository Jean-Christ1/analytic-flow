// ============================================================================
// Tenancy Domain Hooks - Index
// MLOps Control Plane v3
// Author: Armand AMOUSSOU
// Date: 2026-01-04
// ============================================================================

// Tenant Hooks
export {
  useTenants,
  useTenant,
  useTenantBySlug,
  useCurrentTenant,
  useCreateTenant,
  useUpdateTenant,
  useDeleteTenant,
  useUpdateTenantStatus,
  useUpdateTenantTier,
  tenantKeys,
  type Tenant,
  type TenantInsert,
  type TenantUpdate,
  type TenantStatus,
  type TenantTier,
} from './useTenants';

// Organization Hooks
export {
  useOrganizations,
  useOrganization,
  useOrganizationTree,
  useChildOrganizations,
  useRootOrganizations,
  useCreateOrganization,
  useUpdateOrganization,
  useDeleteOrganization,
  useMoveOrganization,
  orgKeys,
  type Organization,
  type OrganizationInsert,
  type OrganizationUpdate,
  type OrganizationWithChildren,
} from './useOrganizations';

// Project Hooks
export {
  useProjects,
  useInfiniteProjects,
  useProject,
  useProjectBySlug,
  useProjectsByOrg,
  useProjectsByOwner,
  useProjectsByLifecycle,
  useSearchProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  useArchiveProject,
  useRestoreProject,
  useUpdateProjectProgress,
  useUpdateProjectTags,
  useTransferProjectOwnership,
  projectKeys,
  type Project,
  type ProjectInsert,
  type ProjectUpdate,
  type ProjectWithRelations,
  type ProjectVisibility,
  type ProjectLifecycle,
  type Criticality,
  type ProgressStatus,
} from './useProjects';

// TODO: Add Work Items Hooks
// TODO: Add Milestones Hooks
// TODO: Add Kanban Hooks
