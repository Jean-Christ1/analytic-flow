// ============================================================================
// Infrastructure Domain Hooks - Index
// MLOps Control Plane v3
// Author: Armand AMOUSSOU
// Date: 2026-01-04
// ============================================================================

// K8s Cluster Hooks
export {
  // Queries
  useClusters,
  useInfiniteClusters,
  useCluster,
  useClusterByName,
  useClustersByProvider,
  useClustersByEnvironment,
  useClustersByStatus,
  useReadyClusters,
  useClustersByRegion,
  useSearchClusters,
  // Mutations
  useCreateCluster,
  useUpdateCluster,
  useDeleteCluster,
  useUpdateClusterStatus,
  useUpdateClusterLabels,
  useUpdateClusterNetworkProfile,
  // Keys
  clusterKeys,
  clusterQueryKeys,
  // Types
  type K8sCluster,
  type K8sClusterInsert,
  type K8sClusterUpdate,
  type K8sClusterWithStats,
  type CloudProvider,
  type K8sEnvironment,
  type K8sClusterStatus,
} from './useClusters';

// K8s Namespace Binding Hooks
export {
  // Queries
  useNamespaceBindings,
  useNamespaceBinding,
  useNamespaceBindingsByProject,
  useNamespaceBindingsByCluster,
  useNamespaceBindingsByStatus,
  useCheckNamespaceExists,
  // Mutations
  useCreateNamespaceBinding,
  useUpdateNamespaceBinding,
  useDeleteNamespaceBinding,
  useUpdateResourceQuota,
  useUpdateLimitRange,
  useUpdateSecurityProfiles,
  useUpdateNamespaceBindingStatus,
  // Keys
  namespaceBindingKeys,
  namespaceBindingQueryKeys,
  // Types
  type K8sNamespaceBinding,
  type K8sNamespaceBindingInsert,
  type K8sNamespaceBindingUpdate,
  type K8sNamespaceBindingWithRelations,
  type ResourceQuotaSpec,
  type LimitRangeSpec,
} from './useNamespaceBindings';

// Compute Profile Hooks
export {
  // Queries
  useComputeProfiles,
  useComputeProfile,
  useComputeProfileByName,
  useGpuProfiles,
  useCpuOnlyProfiles,
  useProfilesByGpuType,
  useProfilesByPriorityClass,
  useSearchComputeProfiles,
  useSuitableProfiles,
  // Mutations
  useCreateComputeProfile,
  useUpdateComputeProfile,
  useDeleteComputeProfile,
  useUpdateCpuResources,
  useUpdateMemoryResources,
  useUpdateGpuConfig,
  useUpdateNodeSelector,
  useUpdateTolerations,
  useUpdateAffinity,
  useCloneComputeProfile,
  // Keys
  computeProfileKeys,
  computeProfileQueryKeys,
  // Types
  type ComputeProfile,
  type ComputeProfileInsert,
  type ComputeProfileUpdate,
  type ComputeProfileWithStats,
  type K8sToleration,
  type K8sAffinity,
  type GpuProfileFilter,
} from './useComputeProfiles';

// Runtime Policy Hooks
export {
  // Queries
  useRuntimePolicies,
  useRuntimePolicy,
  useRuntimePolicyByName,
  useRuntimePoliciesBySecurityProfile,
  useRestrictedPolicies,
  useBaselinePolicies,
  useSearchRuntimePolicies,
  useValidateImage,
  // Mutations
  useCreateRuntimePolicy,
  useUpdateRuntimePolicy,
  useDeleteRuntimePolicy,
  useUpdateAllowedImages,
  useAddAllowedImage,
  useRemoveAllowedImage,
  useUpdateAllowedRegistries,
  useUpdateEgressRules,
  useUpdateIngressRules,
  useUpdatePodSecurityProfile,
  useUpdateEnvVarAllowlist,
  useUpdateSecretMountPolicy,
  useCloneRuntimePolicy,
  // Keys
  runtimePolicyKeys,
  runtimePolicyQueryKeys,
  // Types
  type RuntimePolicy,
  type RuntimePolicyInsert,
  type RuntimePolicyUpdate,
  type RuntimePolicyWithUsage,
  type PodSecurityProfile,
  type EgressRule,
  type IngressRule,
  type SecretMountPolicy,
} from './useRuntimePolicies';

// ============================================================================
// TODO: Additional Infrastructure Hooks
// ============================================================================
// TODO: Add Node Pool hooks for K8s node management
// TODO: Add Storage Class hooks for persistent storage
// TODO: Add Ingress Controller hooks for traffic management
// TODO: Add Service Mesh hooks (Istio, Linkerd)
// TODO: Add Certificate Management hooks
// TODO: Add DNS Management hooks
// TODO: Add Load Balancer hooks
// TODO: Add VPC/Network hooks
// TODO: Add Firewall Rules hooks
// TODO: Add Cloud Resource hooks (AWS/GCP/Azure specific)
