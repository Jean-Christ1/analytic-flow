// ============================================================================
// Data Connection Hooks
// MLOps Control Plane v3
// Author: Armand AMOUSSOU
// Date: 2026-01-04
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  createQueryKeyFactory,
  type ListQueryOptions,
  type MutationOptions,
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE,
  calculateOffset,
} from '../utils/query-utils';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Data connection type enum
 */
export type DataConnectionType =
  | 'snowflake'
  | 'databricks'
  | 'jdbc'
  | 'sftp'
  | 'nfs'
  | 'bigquery'
  | 'redshift'
  | 'postgres'
  | 'mysql'
  | 'mongodb'
  | 'elasticsearch'
  | 'kafka'
  | 'redis'
  | 'http';

/**
 * Connection test status
 */
export type ConnectionTestStatus = 'success' | 'failed' | 'pending' | 'unknown';

/**
 * Database connection config
 */
export interface DatabaseConnectionConfig {
  host?: string;
  port?: number;
  database?: string;
  schema?: string;
  ssl?: boolean;
  sslMode?: 'disable' | 'require' | 'verify-ca' | 'verify-full';
  connectionTimeout?: number;
  queryTimeout?: number;
  maxPoolSize?: number;
  // TODO: Add more database config fields
}

/**
 * Snowflake connection config
 */
export interface SnowflakeConnectionConfig extends DatabaseConnectionConfig {
  account?: string;
  warehouse?: string;
  role?: string;
  authenticator?: 'snowflake' | 'oauth' | 'externalbrowser';
}

/**
 * Databricks connection config
 */
export interface DatabricksConnectionConfig {
  workspaceUrl?: string;
  httpPath?: string;
  catalog?: string;
  useUnityСatalog?: boolean;
}

/**
 * SFTP connection config
 */
export interface SftpConnectionConfig {
  host?: string;
  port?: number;
  basePath?: string;
  strictHostKeyChecking?: boolean;
  hostKey?: string;
}

/**
 * Kafka connection config
 */
export interface KafkaConnectionConfig {
  bootstrapServers?: string[];
  securityProtocol?: 'PLAINTEXT' | 'SSL' | 'SASL_PLAINTEXT' | 'SASL_SSL';
  saslMechanism?: 'PLAIN' | 'SCRAM-SHA-256' | 'SCRAM-SHA-512' | 'GSSAPI';
  schemaRegistryUrl?: string;
}

/**
 * Generic connection config
 */
export type ConnectionConfig =
  | DatabaseConnectionConfig
  | SnowflakeConnectionConfig
  | DatabricksConnectionConfig
  | SftpConnectionConfig
  | KafkaConnectionConfig
  | Record<string, unknown>;

/**
 * Data Connection type from database
 */
export interface DataConnection {
  id: string;
  tenant_id: string;
  name: string;
  type: DataConnectionType;
  config: ConnectionConfig;
  secret_ref_id: string | null;
  test_query: string | null;
  last_tested_at: string | null;
  test_status: ConnectionTestStatus | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

/**
 * Data connection insert type
 */
export type DataConnectionInsert = Omit<
  DataConnection,
  'id' | 'created_at' | 'updated_at' | 'last_tested_at' | 'test_status'
> & {
  id?: string;
};

/**
 * Data connection update type
 */
export type DataConnectionUpdate = Partial<
  Omit<DataConnection, 'id' | 'tenant_id' | 'created_at' | 'updated_at' | 'created_by'>
>;

/**
 * Data connection with user info
 */
export interface DataConnectionWithUser extends DataConnection {
  creator?: {
    id: string;
    display_name: string;
    email: string;
  };
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const dataConnectionKeys = createQueryKeyFactory<string>('data_connections');

// Extended query keys
export const dataConnectionQueryKeys = {
  ...dataConnectionKeys,
  byType: (type: DataConnectionType) => [...dataConnectionKeys.all, 'type', type] as const,
  byStatus: (status: ConnectionTestStatus) => [...dataConnectionKeys.all, 'status', status] as const,
  working: () => [...dataConnectionKeys.all, 'working'] as const,
  failed: () => [...dataConnectionKeys.all, 'failed'] as const,
};

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Fetch all data connections with pagination
 */
export const useDataConnections = (options: ListQueryOptions = {}) => {
  const {
    pagination = { page: DEFAULT_PAGE, pageSize: DEFAULT_PAGE_SIZE },
    sort = { column: 'name', ascending: true },
    filters = [],
    search,
    select = '*',
    enabled = true,
  } = options;

  const page = pagination.page ?? DEFAULT_PAGE;
  const pageSize = pagination.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = calculateOffset(page, pageSize);

  return useQuery({
    queryKey: dataConnectionKeys.list({ pagination, sort, filters, search }),
    queryFn: async () => {
      let query = supabase
        .from('data_connection')
        .select(select, { count: 'exact' });

      // Apply filters
      filters.forEach(filter => {
        query = query.filter(filter.column, filter.operator, filter.value);
      });

      // Apply search
      if (search) {
        query = query.ilike(search.column, `%${search.value}%`);
      }

      // Apply sorting
      const sortParams = Array.isArray(sort) ? sort : [sort];
      sortParams.forEach(s => {
        query = query.order(s.column, { ascending: s.ascending ?? true });
      });

      // Apply pagination
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;
      return { data: data as DataConnection[], count };
    },
    enabled,
  });
};

/**
 * Fetch a single data connection by ID
 */
export const useDataConnection = (connectionId: string, options: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: dataConnectionKeys.detail(connectionId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('data_connection')
        .select('*, creator:created_by(id, display_name, email)')
        .eq('id', connectionId)
        .single();

      if (error) throw error;
      return data as DataConnectionWithUser;
    },
    enabled: options.enabled !== false && !!connectionId,
  });
};

/**
 * Fetch data connection by name
 */
export const useDataConnectionByName = (name: string, options: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: [...dataConnectionKeys.all, 'name', name] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('data_connection')
        .select('*')
        .eq('name', name)
        .single();

      if (error) throw error;
      return data as DataConnection;
    },
    enabled: options.enabled !== false && !!name,
  });
};

/**
 * Fetch data connections by type
 */
export const useDataConnectionsByType = (type: DataConnectionType) => {
  return useQuery({
    queryKey: dataConnectionQueryKeys.byType(type),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('data_connection')
        .select('*')
        .eq('type', type)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as DataConnection[];
    },
  });
};

/**
 * Fetch data connections by test status
 */
export const useDataConnectionsByStatus = (status: ConnectionTestStatus) => {
  return useQuery({
    queryKey: dataConnectionQueryKeys.byStatus(status),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('data_connection')
        .select('*')
        .eq('test_status', status)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as DataConnection[];
    },
  });
};

/**
 * Fetch only working connections
 */
export const useWorkingConnections = () => {
  return useQuery({
    queryKey: dataConnectionQueryKeys.working(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('data_connection')
        .select('*')
        .eq('test_status', 'success')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as DataConnection[];
    },
  });
};

/**
 * Fetch failed connections
 */
export const useFailedConnections = () => {
  return useQuery({
    queryKey: dataConnectionQueryKeys.failed(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('data_connection')
        .select('*')
        .eq('test_status', 'failed')
        .order('last_tested_at', { ascending: false });

      if (error) throw error;
      return data as DataConnection[];
    },
  });
};

/**
 * Search data connections by name
 */
export const useSearchDataConnections = (searchTerm: string) => {
  return useQuery({
    queryKey: [...dataConnectionKeys.all, 'search', searchTerm] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('data_connection')
        .select('*')
        .ilike('name', `%${searchTerm}%`)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as DataConnection[];
    },
    enabled: searchTerm.length >= 2,
  });
};

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Create a new data connection
 */
export const useCreateDataConnection = (
  options: MutationOptions<DataConnection, DataConnectionInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (connection: DataConnectionInsert) => {
      const { data, error } = await supabase
        .from('data_connection')
        .insert(connection)
        .select()
        .single();

      if (error) throw error;
      return data as DataConnection;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: dataConnectionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dataConnectionQueryKeys.byType(data.type) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update a data connection
 */
export const useUpdateDataConnection = (
  options: MutationOptions<DataConnection, { id: string; updates: DataConnectionUpdate }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: DataConnectionUpdate }) => {
      const { data, error } = await supabase
        .from('data_connection')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as DataConnection;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: dataConnectionKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: dataConnectionKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Delete a data connection
 */
export const useDeleteDataConnection = (
  options: MutationOptions<void, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (connectionId: string) => {
      const { error } = await supabase
        .from('data_connection')
        .delete()
        .eq('id', connectionId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: dataConnectionKeys.all });
      options.onSuccess?.(undefined, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update connection config
 */
export const useUpdateConnectionConfig = (
  options: MutationOptions<DataConnection, { id: string; config: ConnectionConfig }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, config }) => {
      const { data, error } = await supabase
        .from('data_connection')
        .update({ config })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as DataConnection;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: dataConnectionKeys.detail(variables.id) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update test status (after testing connection)
 */
export const useUpdateTestStatus = (
  options: MutationOptions<DataConnection, {
    id: string;
    testStatus: ConnectionTestStatus;
  }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, testStatus }) => {
      const { data, error } = await supabase
        .from('data_connection')
        .update({
          test_status: testStatus,
          last_tested_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as DataConnection;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: dataConnectionKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: dataConnectionQueryKeys.byStatus(variables.testStatus) });
      queryClient.invalidateQueries({ queryKey: dataConnectionQueryKeys.working() });
      queryClient.invalidateQueries({ queryKey: dataConnectionQueryKeys.failed() });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update test query
 */
export const useUpdateTestQuery = (
  options: MutationOptions<DataConnection, { id: string; testQuery: string | null }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, testQuery }) => {
      const { data, error } = await supabase
        .from('data_connection')
        .update({ test_query: testQuery })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as DataConnection;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: dataConnectionKeys.detail(variables.id) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update secret reference
 */
export const useUpdateConnectionSecret = (
  options: MutationOptions<DataConnection, { id: string; secretRefId: string | null }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, secretRefId }) => {
      const { data, error } = await supabase
        .from('data_connection')
        .update({ secret_ref_id: secretRefId })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as DataConnection;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: dataConnectionKeys.detail(variables.id) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

// ============================================================================
// TODO: Additional Features
// ============================================================================
// TODO: Add useTestConnection hook for connectivity testing
// TODO: Add useExecuteQuery hook for running test queries
// TODO: Add useListSchemas hook for schema discovery
// TODO: Add useListTables hook for table discovery
// TODO: Add usePreviewData hook for data preview
// TODO: Add useConnectionMetrics hook for usage statistics
// TODO: Add useConnectionLogs hook for audit logs
// TODO: Add batch connection testing hooks
// TODO: Add connection sharing hooks (with permissions)
// TODO: Add connection templates for common setups
// TODO: Add connection health monitoring hooks
