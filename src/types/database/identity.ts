/**
 * Identity and RBAC Database Types
 *
 * User management, groups, roles, permissions, and access control.
 * Includes service accounts and machine identities.
 */

import type {
  Json,
  UserStatus,
  ScopeType,
  PrincipalType,
  RuleType,
  RuleAppliesTo,
  RuleSeverity,
  PermissionCategory,
  SecretBackend,
  SecretPurpose,
  IdpType,
} from './common';

// ============================================================================
// USER ACCOUNT
// ============================================================================

export interface UserAccountRow {
  id: string;
  tenant_id: string;
  external_subject: string | null;
  email: string;
  display_name: string | null;
  status: UserStatus;
  last_login_at: string | null;
  mfa_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserAccountInsert {
  id?: string;
  tenant_id: string;
  external_subject?: string | null;
  email: string;
  display_name?: string | null;
  status?: UserStatus;
  last_login_at?: string | null;
  mfa_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserAccountUpdate {
  id?: string;
  tenant_id?: string;
  external_subject?: string | null;
  email?: string;
  display_name?: string | null;
  status?: UserStatus;
  last_login_at?: string | null;
  mfa_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserAccountTable {
  Row: UserAccountRow;
  Insert: UserAccountInsert;
  Update: UserAccountUpdate;
  Relationships: [
    {
      foreignKeyName: 'user_account_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// GROUP
// ============================================================================

export interface GroupRow {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface GroupInsert {
  id?: string;
  tenant_id: string;
  name: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface GroupUpdate {
  id?: string;
  tenant_id?: string;
  name?: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface GroupTable {
  Row: GroupRow;
  Insert: GroupInsert;
  Update: GroupUpdate;
  Relationships: [
    {
      foreignKeyName: 'group_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// GROUP MEMBER
// ============================================================================

export interface GroupMemberRow {
  tenant_id: string;
  group_id: string;
  user_id: string;
  created_at: string;
}

export interface GroupMemberInsert {
  tenant_id: string;
  group_id: string;
  user_id: string;
  created_at?: string;
}

export interface GroupMemberUpdate {
  tenant_id?: string;
  group_id?: string;
  user_id?: string;
  created_at?: string;
}

export interface GroupMemberTable {
  Row: GroupMemberRow;
  Insert: GroupMemberInsert;
  Update: GroupMemberUpdate;
  Relationships: [
    {
      foreignKeyName: 'group_member_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'group_member_group_id_fkey';
      columns: ['group_id'];
      referencedRelation: 'group';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'group_member_user_id_fkey';
      columns: ['user_id'];
      referencedRelation: 'user_account';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// ROLE
// ============================================================================

export interface RoleRow {
  id: string;
  tenant_id: string;
  name: string;
  scope: ScopeType;
  description: string | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoleInsert {
  id?: string;
  tenant_id: string;
  name: string;
  scope: ScopeType;
  description?: string | null;
  is_system?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RoleUpdate {
  id?: string;
  tenant_id?: string;
  name?: string;
  scope?: ScopeType;
  description?: string | null;
  is_system?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RoleTable {
  Row: RoleRow;
  Insert: RoleInsert;
  Update: RoleUpdate;
  Relationships: [
    {
      foreignKeyName: 'role_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// PERMISSION
// ============================================================================

export interface PermissionRow {
  code: string;
  description: string | null;
  category: PermissionCategory;
}

export interface PermissionInsert {
  code: string;
  description?: string | null;
  category: PermissionCategory;
}

export interface PermissionUpdate {
  code?: string;
  description?: string | null;
  category?: PermissionCategory;
}

export interface PermissionTable {
  Row: PermissionRow;
  Insert: PermissionInsert;
  Update: PermissionUpdate;
  Relationships: [];
}

// ============================================================================
// ROLE PERMISSION
// ============================================================================

export interface RolePermissionRow {
  tenant_id: string;
  role_id: string;
  permission_code: string;
}

export interface RolePermissionInsert {
  tenant_id: string;
  role_id: string;
  permission_code: string;
}

export interface RolePermissionUpdate {
  tenant_id?: string;
  role_id?: string;
  permission_code?: string;
}

export interface RolePermissionTable {
  Row: RolePermissionRow;
  Insert: RolePermissionInsert;
  Update: RolePermissionUpdate;
  Relationships: [
    {
      foreignKeyName: 'role_permission_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'role_permission_role_id_fkey';
      columns: ['role_id'];
      referencedRelation: 'role';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'role_permission_permission_code_fkey';
      columns: ['permission_code'];
      referencedRelation: 'permission';
      referencedColumns: ['code'];
    }
  ];
}

// ============================================================================
// PRINCIPAL ROLE BINDING
// ============================================================================

export interface PrincipalRoleBindingRow {
  id: string;
  tenant_id: string;
  principal_type: PrincipalType;
  principal_id: string;
  scope_type: ScopeType;
  scope_id: string | null;
  role_id: string;
  created_at: string;
  created_by: string | null;
}

export interface PrincipalRoleBindingInsert {
  id?: string;
  tenant_id: string;
  principal_type: PrincipalType;
  principal_id: string;
  scope_type: ScopeType;
  scope_id?: string | null;
  role_id: string;
  created_at?: string;
  created_by?: string | null;
}

export interface PrincipalRoleBindingUpdate {
  id?: string;
  tenant_id?: string;
  principal_type?: PrincipalType;
  principal_id?: string;
  scope_type?: ScopeType;
  scope_id?: string | null;
  role_id?: string;
  created_at?: string;
  created_by?: string | null;
}

export interface PrincipalRoleBindingTable {
  Row: PrincipalRoleBindingRow;
  Insert: PrincipalRoleBindingInsert;
  Update: PrincipalRoleBindingUpdate;
  Relationships: [
    {
      foreignKeyName: 'principal_role_binding_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'principal_role_binding_role_id_fkey';
      columns: ['role_id'];
      referencedRelation: 'role';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// BUSINESS RULE
// ============================================================================

export interface BusinessRuleRow {
  id: string;
  tenant_id: string;
  name: string;
  rule_type: RuleType;
  applies_to: RuleAppliesTo;
  expression: Json;
  enabled: boolean;
  severity: RuleSeverity;
  message: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface BusinessRuleInsert {
  id?: string;
  tenant_id: string;
  name: string;
  rule_type: RuleType;
  applies_to: RuleAppliesTo;
  expression: Json;
  enabled?: boolean;
  severity?: RuleSeverity;
  message?: string | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface BusinessRuleUpdate {
  id?: string;
  tenant_id?: string;
  name?: string;
  rule_type?: RuleType;
  applies_to?: RuleAppliesTo;
  expression?: Json;
  enabled?: boolean;
  severity?: RuleSeverity;
  message?: string | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface BusinessRuleTable {
  Row: BusinessRuleRow;
  Insert: BusinessRuleInsert;
  Update: BusinessRuleUpdate;
  Relationships: [
    {
      foreignKeyName: 'business_rule_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// FEATURE FLAG
// ============================================================================

export interface FeatureFlagRow {
  id: string;
  tenant_id: string;
  key: string;
  description: string | null;
  enabled: boolean;
  targeting: Json | null;
  created_at: string;
  updated_at: string;
}

export interface FeatureFlagInsert {
  id?: string;
  tenant_id: string;
  key: string;
  description?: string | null;
  enabled?: boolean;
  targeting?: Json | null;
  created_at?: string;
  updated_at?: string;
}

export interface FeatureFlagUpdate {
  id?: string;
  tenant_id?: string;
  key?: string;
  description?: string | null;
  enabled?: boolean;
  targeting?: Json | null;
  created_at?: string;
  updated_at?: string;
}

export interface FeatureFlagTable {
  Row: FeatureFlagRow;
  Insert: FeatureFlagInsert;
  Update: FeatureFlagUpdate;
  Relationships: [
    {
      foreignKeyName: 'feature_flag_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// QUOTA POLICY
// ============================================================================

export interface QuotaPolicyRow {
  id: string;
  tenant_id: string;
  scope_type: ScopeType;
  scope_id: string | null;
  name: string;
  limits: Json;
  enforced: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuotaPolicyInsert {
  id?: string;
  tenant_id: string;
  scope_type: ScopeType;
  scope_id?: string | null;
  name: string;
  limits: Json;
  enforced?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface QuotaPolicyUpdate {
  id?: string;
  tenant_id?: string;
  scope_type?: ScopeType;
  scope_id?: string | null;
  name?: string;
  limits?: Json;
  enforced?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface QuotaPolicyTable {
  Row: QuotaPolicyRow;
  Insert: QuotaPolicyInsert;
  Update: QuotaPolicyUpdate;
  Relationships: [
    {
      foreignKeyName: 'quota_policy_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// ADMIN SETTING
// ============================================================================

export interface AdminSettingRow {
  id: string;
  tenant_id: string;
  key: string;
  value: Json;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface AdminSettingInsert {
  id?: string;
  tenant_id: string;
  key: string;
  value: Json;
  description?: string | null;
  updated_at?: string;
  updated_by?: string | null;
}

export interface AdminSettingUpdate {
  id?: string;
  tenant_id?: string;
  key?: string;
  value?: Json;
  description?: string | null;
  updated_at?: string;
  updated_by?: string | null;
}

export interface AdminSettingTable {
  Row: AdminSettingRow;
  Insert: AdminSettingInsert;
  Update: AdminSettingUpdate;
  Relationships: [
    {
      foreignKeyName: 'admin_setting_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// SERVICE ACCOUNT
// ============================================================================

export interface ServiceAccountRow {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  status: UserStatus;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface ServiceAccountInsert {
  id?: string;
  tenant_id: string;
  name: string;
  description?: string | null;
  status?: UserStatus;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface ServiceAccountUpdate {
  id?: string;
  tenant_id?: string;
  name?: string;
  description?: string | null;
  status?: UserStatus;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface ServiceAccountTable {
  Row: ServiceAccountRow;
  Insert: ServiceAccountInsert;
  Update: ServiceAccountUpdate;
  Relationships: [
    {
      foreignKeyName: 'service_account_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// SERVICE ACCOUNT TOKEN
// ============================================================================

export interface ServiceAccountTokenRow {
  id: string;
  tenant_id: string;
  service_account_id: string;
  token_hash: string;
  scopes: Json | null;
  expires_at: string | null;
  last_used_at: string | null;
  created_at: string;
  revoked_at: string | null;
}

export interface ServiceAccountTokenInsert {
  id?: string;
  tenant_id: string;
  service_account_id: string;
  token_hash: string;
  scopes?: Json | null;
  expires_at?: string | null;
  last_used_at?: string | null;
  created_at?: string;
  revoked_at?: string | null;
}

export interface ServiceAccountTokenUpdate {
  id?: string;
  tenant_id?: string;
  service_account_id?: string;
  token_hash?: string;
  scopes?: Json | null;
  expires_at?: string | null;
  last_used_at?: string | null;
  created_at?: string;
  revoked_at?: string | null;
}

export interface ServiceAccountTokenTable {
  Row: ServiceAccountTokenRow;
  Insert: ServiceAccountTokenInsert;
  Update: ServiceAccountTokenUpdate;
  Relationships: [
    {
      foreignKeyName: 'service_account_token_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'service_account_token_service_account_id_fkey';
      columns: ['service_account_id'];
      referencedRelation: 'service_account';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// SECRET REFERENCE
// ============================================================================

export interface SecretRefRow {
  id: string;
  tenant_id: string;
  backend: SecretBackend;
  ref: string;
  purpose: SecretPurpose;
  rotation_hint: string | null;
  created_at: string;
  updated_at: string;
}

export interface SecretRefInsert {
  id?: string;
  tenant_id: string;
  backend: SecretBackend;
  ref: string;
  purpose: SecretPurpose;
  rotation_hint?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SecretRefUpdate {
  id?: string;
  tenant_id?: string;
  backend?: SecretBackend;
  ref?: string;
  purpose?: SecretPurpose;
  rotation_hint?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SecretRefTable {
  Row: SecretRefRow;
  Insert: SecretRefInsert;
  Update: SecretRefUpdate;
  Relationships: [
    {
      foreignKeyName: 'secret_ref_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// IDENTITY PROVIDER
// ============================================================================

export interface IdentityProviderRow {
  id: string;
  tenant_id: string;
  type: IdpType;
  issuer_url: string | null;
  client_id: string | null;
  sso_metadata: Json | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface IdentityProviderInsert {
  id?: string;
  tenant_id: string;
  type: IdpType;
  issuer_url?: string | null;
  client_id?: string | null;
  sso_metadata?: Json | null;
  enabled?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface IdentityProviderUpdate {
  id?: string;
  tenant_id?: string;
  type?: IdpType;
  issuer_url?: string | null;
  client_id?: string | null;
  sso_metadata?: Json | null;
  enabled?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface IdentityProviderTable {
  Row: IdentityProviderRow;
  Insert: IdentityProviderInsert;
  Update: IdentityProviderUpdate;
  Relationships: [
    {
      foreignKeyName: 'identity_provider_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// API TOKEN
// ============================================================================

export interface ApiTokenRow {
  id: string;
  tenant_id: string;
  user_id: string;
  token_hash: string;
  name: string;
  scopes: Json | null;
  expires_at: string | null;
  last_used_at: string | null;
  created_at: string;
  revoked_at: string | null;
}

export interface ApiTokenInsert {
  id?: string;
  tenant_id: string;
  user_id: string;
  token_hash: string;
  name: string;
  scopes?: Json | null;
  expires_at?: string | null;
  last_used_at?: string | null;
  created_at?: string;
  revoked_at?: string | null;
}

export interface ApiTokenUpdate {
  id?: string;
  tenant_id?: string;
  user_id?: string;
  token_hash?: string;
  name?: string;
  scopes?: Json | null;
  expires_at?: string | null;
  last_used_at?: string | null;
  created_at?: string;
  revoked_at?: string | null;
}

export interface ApiTokenTable {
  Row: ApiTokenRow;
  Insert: ApiTokenInsert;
  Update: ApiTokenUpdate;
  Relationships: [
    {
      foreignKeyName: 'api_token_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'api_token_user_id_fkey';
      columns: ['user_id'];
      referencedRelation: 'user_account';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// IDENTITY TABLES COLLECTION
// ============================================================================

export interface IdentityTables {
  user_account: UserAccountTable;
  group: GroupTable;
  group_member: GroupMemberTable;
  role: RoleTable;
  permission: PermissionTable;
  role_permission: RolePermissionTable;
  principal_role_binding: PrincipalRoleBindingTable;
  business_rule: BusinessRuleTable;
  feature_flag: FeatureFlagTable;
  quota_policy: QuotaPolicyTable;
  admin_setting: AdminSettingTable;
  service_account: ServiceAccountTable;
  service_account_token: ServiceAccountTokenTable;
  secret_ref: SecretRefTable;
  identity_provider: IdentityProviderTable;
  api_token: ApiTokenTable;
}
