// ============================================================================
// Registries Domain Hooks - Index
// MLOps Control Plane v3
// Author: Armand AMOUSSOU
// Date: 2026-01-04
// ============================================================================

// Container Registry Hooks
export {
  // Queries
  useContainerRegistries,
  useContainerRegistry,
  useContainerRegistryByName,
  useDefaultContainerRegistry,
  useContainerRegistriesByType,
  useSearchContainerRegistries,
  // Mutations
  useCreateContainerRegistry,
  useUpdateContainerRegistry,
  useDeleteContainerRegistry,
  useSetDefaultContainerRegistry,
  useUpdateTrustPolicy,
  useUpdateRegistryAuth,
  // Keys
  containerRegistryKeys,
  containerRegistryQueryKeys,
  // Types
  type ContainerRegistry,
  type ContainerRegistryInsert,
  type ContainerRegistryUpdate,
  type ContainerRegistryWithStats,
  type ContainerRegistryType,
  type ImageTrustPolicy,
} from './useContainerRegistries';

// Object Store Hooks
export {
  // Queries
  useObjectStores,
  useObjectStore,
  useObjectStoreByName,
  useDefaultObjectStore,
  useObjectStoresByType,
  useSearchObjectStores,
  // Mutations
  useCreateObjectStore,
  useUpdateObjectStore,
  useDeleteObjectStore,
  useSetDefaultObjectStore,
  useUpdateRetentionPolicy,
  useUpdateKmsKeyRef,
  useUpdateObjectStoreAuth,
  // Keys
  objectStoreKeys,
  objectStoreQueryKeys,
  // Types
  type ObjectStore,
  type ObjectStoreInsert,
  type ObjectStoreUpdate,
  type ObjectStoreWithStats,
  type ObjectStoreType,
  type RetentionPolicy,
} from './useObjectStores';

// Data Connection Hooks
export {
  // Queries
  useDataConnections,
  useDataConnection,
  useDataConnectionByName,
  useDataConnectionsByType,
  useDataConnectionsByStatus,
  useWorkingConnections,
  useFailedConnections,
  useSearchDataConnections,
  // Mutations
  useCreateDataConnection,
  useUpdateDataConnection,
  useDeleteDataConnection,
  useUpdateConnectionConfig,
  useUpdateTestStatus,
  useUpdateTestQuery,
  useUpdateConnectionSecret,
  // Keys
  dataConnectionKeys,
  dataConnectionQueryKeys,
  // Types
  type DataConnection,
  type DataConnectionInsert,
  type DataConnectionUpdate,
  type DataConnectionWithUser,
  type DataConnectionType,
  type ConnectionTestStatus,
  type ConnectionConfig,
  type DatabaseConnectionConfig,
  type SnowflakeConnectionConfig,
  type DatabricksConnectionConfig,
  type SftpConnectionConfig,
  type KafkaConnectionConfig,
} from './useDataConnections';

// Environment Hooks
export {
  // Environment Queries
  useEnvironments,
  useInfiniteEnvironments,
  useEnvironment,
  useEnvironmentByName,
  useEnvironmentsByProject,
  useTenantWideEnvironments,
  useEnvironmentsByStatus,
  useDefaultEnvironment,
  useSearchEnvironments,
  // Build Queries
  useEnvironmentBuilds,
  useEnvironmentBuild,
  useLatestBuild,
  useRunningBuilds,
  useBuildsByStatus,
  // Environment Mutations
  useCreateEnvironment,
  useUpdateEnvironment,
  useDeleteEnvironment,
  useUpdateEnvironmentStatus,
  useSetDefaultEnvironment,
  useUpdateEnvironmentSpec,
  // Build Mutations
  useTriggerBuild,
  useUpdateBuildStatus,
  useUpdateBuildImage,
  // Keys
  environmentKeys,
  environmentBuildKeys,
  environmentQueryKeys,
  buildQueryKeys,
  // Types
  type Environment,
  type EnvironmentInsert,
  type EnvironmentUpdate,
  type EnvironmentWithRelations,
  type EnvironmentStatus,
  type BuildStrategy,
  type EnvironmentSpec,
  type EnvironmentBuild,
  type EnvironmentBuildInsert,
  type EnvironmentBuildStatus,
  type EnvironmentBuildWithEnv,
} from './useEnvironments';

// ============================================================================
// TODO: Additional Registry Hooks
// ============================================================================
// TODO: Add Model Registry hooks (if separate from MLOps)
// TODO: Add Feature Store hooks
// TODO: Add Dataset Registry hooks
// TODO: Add Artifact Repository hooks
// TODO: Add Helm Chart Repository hooks
// TODO: Add Git Repository hooks
// TODO: Add NPM/PyPI Registry hooks
// TODO: Add Image Scanning hooks
// TODO: Add Registry Webhook hooks
// TODO: Add Registry Replication hooks
