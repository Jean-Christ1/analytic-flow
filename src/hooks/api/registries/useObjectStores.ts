// ============================================================================
// Object Store Hooks
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
 * Object store type enum
 */
export type ObjectStoreType = 's3' | 'gcs' | 'azure' | 'minio';

/**
 * Retention policy configuration
 */
export interface RetentionPolicy {
  enabled?: boolean;
  retentionDays?: number;
  versioningEnabled?: boolean;
  transitionRules?: Array<{
    prefix?: string;
    daysToInfrequentAccess?: number;
    daysToGlacier?: number;
    daysToExpiration?: number;
  }>;
  // TODO: Add more retention policy fields
}

/**
 * Object Store type from database
 */
export interface ObjectStore {
  id: string;
  tenant_id: string;
  name: string;
  type: ObjectStoreType;
  endpoint: string | null;
  bucket: string | null;
  prefix: string | null;
  auth_secret_ref: string | null;
  kms_key_ref: string | null;
  retention_policy: RetentionPolicy;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Object store insert type
 */
export type ObjectStoreInsert = Omit<ObjectStore, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

/**
 * Object store update type
 */
export type ObjectStoreUpdate = Partial<
  Omit<ObjectStore, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>
>;

/**
 * Object store with stats
 */
export interface ObjectStoreWithStats extends ObjectStore {
  total_size_bytes?: number;
  object_count?: number;
  artifact_count?: number;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const objectStoreKeys = createQueryKeyFactory<string>('object_stores');

// Extended query keys
export const objectStoreQueryKeys = {
  ...objectStoreKeys,
  byType: (type: ObjectStoreType) => [...objectStoreKeys.all, 'type', type] as const,
  default: () => [...objectStoreKeys.all, 'default'] as const,
  byBucket: (bucket: string) => [...objectStoreKeys.all, 'bucket', bucket] as const,
};

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Fetch all object stores with pagination
 */
export const useObjectStores = (options: ListQueryOptions = {}) => {
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
    queryKey: objectStoreKeys.list({ pagination, sort, filters, search }),
    queryFn: async () => {
      let query = supabase
        .from('object_store')
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
      return { data: data as ObjectStore[], count };
    },
    enabled,
  });
};

/**
 * Fetch a single object store by ID
 */
export const useObjectStore = (storeId: string, options: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: objectStoreKeys.detail(storeId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('object_store')
        .select('*')
        .eq('id', storeId)
        .single();

      if (error) throw error;
      return data as ObjectStore;
    },
    enabled: options.enabled !== false && !!storeId,
  });
};

/**
 * Fetch object store by name
 */
export const useObjectStoreByName = (name: string, options: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: [...objectStoreKeys.all, 'name', name] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('object_store')
        .select('*')
        .eq('name', name)
        .single();

      if (error) throw error;
      return data as ObjectStore;
    },
    enabled: options.enabled !== false && !!name,
  });
};

/**
 * Fetch default object store for tenant
 */
export const useDefaultObjectStore = () => {
  return useQuery({
    queryKey: objectStoreQueryKeys.default(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('object_store')
        .select('*')
        .eq('is_default', true)
        .maybeSingle();

      if (error) throw error;
      return data as ObjectStore | null;
    },
  });
};

/**
 * Fetch object stores by type
 */
export const useObjectStoresByType = (type: ObjectStoreType) => {
  return useQuery({
    queryKey: objectStoreQueryKeys.byType(type),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('object_store')
        .select('*')
        .eq('type', type)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as ObjectStore[];
    },
  });
};

/**
 * Search object stores by name
 */
export const useSearchObjectStores = (searchTerm: string) => {
  return useQuery({
    queryKey: [...objectStoreKeys.all, 'search', searchTerm] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('object_store')
        .select('*')
        .ilike('name', `%${searchTerm}%`)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as ObjectStore[];
    },
    enabled: searchTerm.length >= 2,
  });
};

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Create a new object store
 */
export const useCreateObjectStore = (
  options: MutationOptions<ObjectStore, ObjectStoreInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (store: ObjectStoreInsert) => {
      const { data, error } = await supabase
        .from('object_store')
        .insert(store)
        .select()
        .single();

      if (error) throw error;
      return data as ObjectStore;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: objectStoreKeys.lists() });
      if (data.is_default) {
        queryClient.invalidateQueries({ queryKey: objectStoreQueryKeys.default() });
      }
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update an object store
 */
export const useUpdateObjectStore = (
  options: MutationOptions<ObjectStore, { id: string; updates: ObjectStoreUpdate }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ObjectStoreUpdate }) => {
      const { data, error } = await supabase
        .from('object_store')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ObjectStore;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: objectStoreKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: objectStoreKeys.lists() });
      queryClient.invalidateQueries({ queryKey: objectStoreQueryKeys.default() });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Delete an object store
 */
export const useDeleteObjectStore = (
  options: MutationOptions<void, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (storeId: string) => {
      const { error } = await supabase
        .from('object_store')
        .delete()
        .eq('id', storeId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: objectStoreKeys.all });
      options.onSuccess?.(undefined, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Set default object store
 */
export const useSetDefaultObjectStore = (
  options: MutationOptions<ObjectStore, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (storeId: string) => {
      // First, unset any existing default
      await supabase
        .from('object_store')
        .update({ is_default: false })
        .eq('is_default', true);

      // Then set the new default
      const { data, error } = await supabase
        .from('object_store')
        .update({ is_default: true })
        .eq('id', storeId)
        .select()
        .single();

      if (error) throw error;
      return data as ObjectStore;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: objectStoreKeys.all });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update retention policy
 */
export const useUpdateRetentionPolicy = (
  options: MutationOptions<ObjectStore, { id: string; retentionPolicy: RetentionPolicy }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, retentionPolicy }) => {
      const { data, error } = await supabase
        .from('object_store')
        .update({ retention_policy: retentionPolicy })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ObjectStore;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: objectStoreKeys.detail(variables.id) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update KMS key reference
 */
export const useUpdateKmsKeyRef = (
  options: MutationOptions<ObjectStore, { id: string; kmsKeyRef: string | null }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, kmsKeyRef }) => {
      const { data, error } = await supabase
        .from('object_store')
        .update({ kms_key_ref: kmsKeyRef })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ObjectStore;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: objectStoreKeys.detail(variables.id) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update authentication secret reference
 */
export const useUpdateObjectStoreAuth = (
  options: MutationOptions<ObjectStore, { id: string; authSecretRef: string | null }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, authSecretRef }) => {
      const { data, error } = await supabase
        .from('object_store')
        .update({ auth_secret_ref: authSecretRef })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ObjectStore;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: objectStoreKeys.detail(variables.id) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

// ============================================================================
// TODO: Additional Features
// ============================================================================
// TODO: Add useTestObjectStoreConnection hook for connectivity testing
// TODO: Add useListBucketObjects hook for object listing
// TODO: Add useUploadObject hook for file upload
// TODO: Add useDownloadObject hook for file download
// TODO: Add useDeleteObjects hook for bulk deletion
// TODO: Add useObjectStoreMetrics hook for usage statistics
// TODO: Add useGeneratePresignedUrl hook for temporary URLs
// TODO: Add useSyncObjectStore hook for cross-region sync
// TODO: Add useObjectVersions hook for versioning support
// TODO: Add lifecycle management hooks
