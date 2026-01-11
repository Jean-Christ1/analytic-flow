// ============================================================================
// Identity Domain Hooks - Index
// MLOps Control Plane v3
// Author: Armand AMOUSSOU
// Date: 2026-01-04
// ============================================================================

// User Hooks
export {
  useUsers,
  useUser,
  useUserWithRoles,
  useUserByEmail,
  useSearchUsers,
  useUsersByStatus,
  useCreateUser,
  useUpdateUser,
  useUpdateUserStatus,
  useUpdateUserPreferences,
  useDeleteUser,
  useSuspendUser,
  useActivateUser,
  userKeys,
  type UserAccount,
  type UserAccountInsert,
  type UserAccountUpdate,
  type UserStatus,
  type UserWithRoles,
} from './useUsers';

// Role & Permission Hooks
export {
  // Role queries
  useRoles,
  useRole,
  useRoleWithPermissions,
  useSystemRoles,
  useCustomRoles,
  // Permission queries
  usePermissions,
  usePermissionsByCategory,
  usePermissionsGrouped,
  // Role binding queries
  usePrincipalRoleBindings,
  useProjectRoleBindings,
  // Role mutations
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  useAddRolePermission,
  useRemoveRolePermission,
  useSetRolePermissions,
  // Role binding mutations
  useAssignRole,
  useRevokeRole,
  // Keys
  roleKeys,
  permissionKeys,
  roleBindingKeys,
  // Types
  type Role,
  type RoleInsert,
  type RoleUpdate,
  type Permission,
  type RolePermission,
  type PrincipalRoleBinding,
  type RoleWithPermissions,
  type PrincipalRoleBindingInsert,
  type RoleScopeType,
  type PrincipalType,
  type PermissionCategory,
} from './useRoles';

// TODO: Add Group Hooks
// TODO: Add Service Account Hooks
// TODO: Add API Token Hooks
// TODO: Add Feature Flag Hooks
