// ============================================================================
// Query Utilities for React Query Hooks
// MLOps Control Plane v3
// Author: Armand AMOUSSOU
// Date: 2026-01-04
// ============================================================================

import type { PostgrestError } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Generic result type for Supabase queries
 */
export interface QueryResult<T> {
  data: T | null;
  error: PostgrestError | null;
  count: number | null;
}

/**
 * Pagination parameters for list queries
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  offset?: number;
  limit?: number;
}

/**
 * Sort parameters for list queries
 */
export interface SortParams {
  column: string;
  ascending?: boolean;
}

/**
 * Filter parameters for list queries
 */
export interface FilterParams {
  column: string;
  operator: FilterOperator;
  value: unknown;
}

/**
 * Supported filter operators
 */
export type FilterOperator =
  | 'eq'      // Equal
  | 'neq'     // Not equal
  | 'gt'      // Greater than
  | 'gte'     // Greater than or equal
  | 'lt'      // Less than
  | 'lte'     // Less than or equal
  | 'like'    // Pattern match (case-sensitive)
  | 'ilike'   // Pattern match (case-insensitive)
  | 'is'      // Is (for null checks)
  | 'in'      // In array
  | 'cs'      // Contains (for arrays)
  | 'cd'      // Contained by (for arrays)
  | 'ov'      // Overlaps (for arrays)
  | 'sl'      // Strictly left of (for ranges)
  | 'sr'      // Strictly right of (for ranges)
  | 'nxl'     // Does not extend to the left
  | 'nxr'     // Does not extend to the right
  | 'adj';    // Adjacent (for ranges)

/**
 * Standard list query options
 */
export interface ListQueryOptions {
  pagination?: PaginationParams;
  sort?: SortParams | SortParams[];
  filters?: FilterParams[];
  search?: {
    column: string;
    value: string;
  };
  select?: string;
  enabled?: boolean;
}

/**
 * Standard mutation options
 */
export interface MutationOptions<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: PostgrestError, variables: TVariables) => void;
  onSettled?: (data: TData | undefined, error: PostgrestError | null, variables: TVariables) => void;
}

// ============================================================================
// QUERY KEY FACTORIES
// ============================================================================

/**
 * Factory for creating consistent query keys
 * Follows the pattern: [domain, entity, ...params]
 */
export const createQueryKeyFactory = <T extends string>(domain: string) => ({
  all: [domain] as const,
  lists: () => [domain, 'list'] as const,
  list: (params?: Record<string, unknown>) => [domain, 'list', params] as const,
  details: () => [domain, 'detail'] as const,
  detail: (id: T) => [domain, 'detail', id] as const,
  infinite: (params?: Record<string, unknown>) => [domain, 'infinite', params] as const,
});

// ============================================================================
// PAGINATION HELPERS
// ============================================================================

/**
 * Calculate offset from page and page size
 */
export const calculateOffset = (page: number, pageSize: number): number => {
  return (page - 1) * pageSize;
};

/**
 * Calculate total pages from count and page size
 */
export const calculateTotalPages = (count: number, pageSize: number): number => {
  return Math.ceil(count / pageSize);
};

/**
 * Default pagination values
 */
export const DEFAULT_PAGE_SIZE = 20;
export const DEFAULT_PAGE = 1;

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Standard error messages for common error codes
 */
export const ERROR_MESSAGES: Record<string, string> = {
  '23505': 'A record with this identifier already exists.',
  '23503': 'Cannot complete this action due to a reference constraint.',
  '23502': 'A required field is missing.',
  '42501': 'You do not have permission to perform this action.',
  '42P01': 'The requested resource was not found.',
  'PGRST301': 'The requested resource does not exist.',
  'PGRST116': 'The result contains multiple rows when only one was expected.',
};

/**
 * Get user-friendly error message from PostgrestError
 */
export const getErrorMessage = (error: PostgrestError): string => {
  if (error.code && ERROR_MESSAGES[error.code]) {
    return ERROR_MESSAGES[error.code];
  }
  return error.message || 'An unexpected error occurred.';
};

/**
 * Check if error is a not found error
 */
export const isNotFoundError = (error: PostgrestError): boolean => {
  return error.code === 'PGRST116' || error.code === 'PGRST301';
};

/**
 * Check if error is a permission error
 */
export const isPermissionError = (error: PostgrestError): boolean => {
  return error.code === '42501';
};

/**
 * Check if error is a duplicate error
 */
export const isDuplicateError = (error: PostgrestError): boolean => {
  return error.code === '23505';
};

// ============================================================================
// SELECT HELPERS
// ============================================================================

/**
 * Default select fields for list queries (minimal data)
 */
export const DEFAULT_LIST_SELECT = '*';

/**
 * Create a select string with relationships
 */
export const createSelectWithRelations = (
  baseFields: string[],
  relations: { table: string; fields: string[]; alias?: string }[]
): string => {
  const base = baseFields.join(', ');
  const relationsStr = relations
    .map(r => {
      const alias = r.alias ? `${r.alias}:` : '';
      return `${alias}${r.table}(${r.fields.join(', ')})`;
    })
    .join(', ');

  return relationsStr ? `${base}, ${relationsStr}` : base;
};

// ============================================================================
// CACHE INVALIDATION HELPERS
// ============================================================================

/**
 * Invalidation strategies for mutations
 */
export type InvalidationStrategy =
  | 'all'         // Invalidate all queries in the domain
  | 'lists'       // Invalidate only list queries
  | 'detail'      // Invalidate only the specific detail
  | 'related';    // Invalidate related domains

/**
 * Create invalidation config for a mutation
 */
export interface InvalidationConfig {
  strategy: InvalidationStrategy;
  domains?: string[];
  detailId?: string;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard for PostgrestError
 */
export const isPostgrestError = (error: unknown): error is PostgrestError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  );
};

// ============================================================================
// OPTIMISTIC UPDATE HELPERS
// ============================================================================

/**
 * Create an optimistic update for a list query
 * @param oldData - Current data in cache
 * @param newItem - New item to add
 * @param position - Position to add the item ('start' or 'end')
 */
export const addToList = <T extends { id: string }>(
  oldData: T[] | undefined,
  newItem: T,
  position: 'start' | 'end' = 'start'
): T[] => {
  if (!oldData) return [newItem];
  return position === 'start' ? [newItem, ...oldData] : [...oldData, newItem];
};

/**
 * Remove an item from a list by ID
 */
export const removeFromList = <T extends { id: string }>(
  oldData: T[] | undefined,
  id: string
): T[] => {
  if (!oldData) return [];
  return oldData.filter(item => item.id !== id);
};

/**
 * Update an item in a list
 */
export const updateInList = <T extends { id: string }>(
  oldData: T[] | undefined,
  id: string,
  updates: Partial<T>
): T[] => {
  if (!oldData) return [];
  return oldData.map(item =>
    item.id === id ? { ...item, ...updates } : item
  );
};
