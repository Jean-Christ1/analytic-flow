/**
 * Infrastructure Database Types
 *
 * Kubernetes clusters, namespaces, compute profiles, and runtime policies.
 * Data plane target management for MLOps workloads.
 */

import type {
  Json,
  CloudProvider,
  K8sEnvironment,
  K8sClusterStatus,
} from './common';

// ============================================================================
// KUBERNETES CLUSTER
// ============================================================================

export interface K8sClusterRow {
  id: string;
  tenant_id: string;
  name: string;
  provider: CloudProvider;
  region: string | null;
  environment: K8sEnvironment;
  api_server_url: string | null;
  cluster_identity: Json | null;
  network_profile: Json | null;
  status: K8sClusterStatus;
  version: string | null;
  labels: Json | null;
  created_at: string;
  updated_at: string;
}

export interface K8sClusterInsert {
  id?: string;
  tenant_id: string;
  name: string;
  provider: CloudProvider;
  region?: string | null;
  environment: K8sEnvironment;
  api_server_url?: string | null;
  cluster_identity?: Json | null;
  network_profile?: Json | null;
  status?: K8sClusterStatus;
  version?: string | null;
  labels?: Json | null;
  created_at?: string;
  updated_at?: string;
}

export interface K8sClusterUpdate {
  id?: string;
  tenant_id?: string;
  name?: string;
  provider?: CloudProvider;
  region?: string | null;
  environment?: K8sEnvironment;
  api_server_url?: string | null;
  cluster_identity?: Json | null;
  network_profile?: Json | null;
  status?: K8sClusterStatus;
  version?: string | null;
  labels?: Json | null;
  created_at?: string;
  updated_at?: string;
}

export interface K8sClusterTable {
  Row: K8sClusterRow;
  Insert: K8sClusterInsert;
  Update: K8sClusterUpdate;
  Relationships: [
    {
      foreignKeyName: 'k8s_cluster_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// KUBERNETES NAMESPACE BINDING
// ============================================================================

export interface K8sNamespaceBindingRow {
  id: string;
  tenant_id: string;
  project_id: string;
  cluster_id: string;
  namespace: string;
  resource_quota: Json | null;
  limit_range: Json | null;
  network_policy_profile: string | null;
  pod_security_profile: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
}

export interface K8sNamespaceBindingInsert {
  id?: string;
  tenant_id: string;
  project_id: string;
  cluster_id: string;
  namespace: string;
  resource_quota?: Json | null;
  limit_range?: Json | null;
  network_policy_profile?: string | null;
  pod_security_profile?: string | null;
  status?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface K8sNamespaceBindingUpdate {
  id?: string;
  tenant_id?: string;
  project_id?: string;
  cluster_id?: string;
  namespace?: string;
  resource_quota?: Json | null;
  limit_range?: Json | null;
  network_policy_profile?: string | null;
  pod_security_profile?: string | null;
  status?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface K8sNamespaceBindingTable {
  Row: K8sNamespaceBindingRow;
  Insert: K8sNamespaceBindingInsert;
  Update: K8sNamespaceBindingUpdate;
  Relationships: [
    {
      foreignKeyName: 'k8s_namespace_binding_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'k8s_namespace_binding_project_id_fkey';
      columns: ['project_id'];
      referencedRelation: 'project';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'k8s_namespace_binding_cluster_id_fkey';
      columns: ['cluster_id'];
      referencedRelation: 'k8s_cluster';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// COMPUTE PROFILE
// ============================================================================

export interface ComputeProfileRow {
  id: string;
  tenant_id: string;
  name: string;
  cpu_request: number | null;
  cpu_limit: number | null;
  mem_request_mb: number | null;
  mem_limit_mb: number | null;
  gpu_count: number | null;
  gpu_type: string | null;
  ephemeral_storage_mb: number | null;
  node_selector: Json | null;
  tolerations: Json | null;
  affinity: Json | null;
  priority_class: string | null;
  created_at: string;
  updated_at: string;
}

export interface ComputeProfileInsert {
  id?: string;
  tenant_id: string;
  name: string;
  cpu_request?: number | null;
  cpu_limit?: number | null;
  mem_request_mb?: number | null;
  mem_limit_mb?: number | null;
  gpu_count?: number | null;
  gpu_type?: string | null;
  ephemeral_storage_mb?: number | null;
  node_selector?: Json | null;
  tolerations?: Json | null;
  affinity?: Json | null;
  priority_class?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ComputeProfileUpdate {
  id?: string;
  tenant_id?: string;
  name?: string;
  cpu_request?: number | null;
  cpu_limit?: number | null;
  mem_request_mb?: number | null;
  mem_limit_mb?: number | null;
  gpu_count?: number | null;
  gpu_type?: string | null;
  ephemeral_storage_mb?: number | null;
  node_selector?: Json | null;
  tolerations?: Json | null;
  affinity?: Json | null;
  priority_class?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ComputeProfileTable {
  Row: ComputeProfileRow;
  Insert: ComputeProfileInsert;
  Update: ComputeProfileUpdate;
  Relationships: [
    {
      foreignKeyName: 'compute_profile_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// RUNTIME POLICY
// ============================================================================

export interface RuntimePolicyRow {
  id: string;
  tenant_id: string;
  name: string;
  allowed_images: Json | null;
  allowed_registries: Json | null;
  egress_rules: Json | null;
  ingress_rules: Json | null;
  pod_security_profile: string | null;
  env_var_allowlist: Json | null;
  secret_mount_policy: Json | null;
  created_at: string;
  updated_at: string;
}

export interface RuntimePolicyInsert {
  id?: string;
  tenant_id: string;
  name: string;
  allowed_images?: Json | null;
  allowed_registries?: Json | null;
  egress_rules?: Json | null;
  ingress_rules?: Json | null;
  pod_security_profile?: string | null;
  env_var_allowlist?: Json | null;
  secret_mount_policy?: Json | null;
  created_at?: string;
  updated_at?: string;
}

export interface RuntimePolicyUpdate {
  id?: string;
  tenant_id?: string;
  name?: string;
  allowed_images?: Json | null;
  allowed_registries?: Json | null;
  egress_rules?: Json | null;
  ingress_rules?: Json | null;
  pod_security_profile?: string | null;
  env_var_allowlist?: Json | null;
  secret_mount_policy?: Json | null;
  created_at?: string;
  updated_at?: string;
}

export interface RuntimePolicyTable {
  Row: RuntimePolicyRow;
  Insert: RuntimePolicyInsert;
  Update: RuntimePolicyUpdate;
  Relationships: [
    {
      foreignKeyName: 'runtime_policy_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// INFRASTRUCTURE TABLES COLLECTION
// ============================================================================

export interface InfrastructureTables {
  k8s_cluster: K8sClusterTable;
  k8s_namespace_binding: K8sNamespaceBindingTable;
  compute_profile: ComputeProfileTable;
  runtime_policy: RuntimePolicyTable;
}
