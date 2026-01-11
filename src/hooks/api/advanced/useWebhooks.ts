// ============================================================================
// Webhook Hooks
// MLOps Control Plane v3
// Author: Armand AMOUSSOU
// Date: 2026-01-04
// ============================================================================

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  createQueryKeyFactory,
  type ListQueryOptions,
  type MutationOptions,
  type PaginationParams,
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE,
  calculateOffset,
} from '../utils/query-utils';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Webhook event types
 */
export type WebhookEventType =
  // Experiment events
  | 'experiment.created'
  | 'experiment.started'
  | 'experiment.completed'
  | 'experiment.failed'
  // Model events
  | 'model.registered'
  | 'model.version_created'
  | 'model.stage_transition'
  | 'model.deployed'
  // Deployment events
  | 'deployment.created'
  | 'deployment.started'
  | 'deployment.completed'
  | 'deployment.failed'
  | 'deployment.scaled'
  | 'deployment.rollback'
  // Pipeline events
  | 'pipeline.created'
  | 'pipeline.started'
  | 'pipeline.completed'
  | 'pipeline.failed'
  // Monitoring events
  | 'alert.triggered'
  | 'alert.resolved'
  | 'drift.detected'
  // Data events
  | 'dataset.created'
  | 'dataset.updated'
  | 'feature.created'
  // Project events
  | 'project.created'
  | 'project.archived'
  | 'project.member_added'
  | 'project.member_removed';

/**
 * Webhook status
 */
export type WebhookStatus = 'active' | 'paused' | 'disabled';

/**
 * Webhook delivery status
 */
export type WebhookDeliveryStatus = 'pending' | 'success' | 'failed' | 'retrying';

/**
 * Webhook from database
 */
export interface Webhook {
  id: string;
  tenant_id: string;
  project_id: string | null;
  name: string;
  description: string | null;
  url: string;
  secret: string | null;
  events: WebhookEventType[];
  headers: Record<string, string>;
  status: WebhookStatus;
  retry_count: number;
  retry_delay_seconds: number;
  timeout_seconds: number;
  verify_ssl: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * Webhook with stats
 */
export interface WebhookWithStats extends Webhook {
  total_deliveries?: number;
  successful_deliveries?: number;
  failed_deliveries?: number;
  last_delivery_at?: string;
  last_delivery_status?: WebhookDeliveryStatus;
  average_response_time_ms?: number;
}

/**
 * Webhook delivery log
 */
export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_type: WebhookEventType;
  event_id: string;
  payload: Record<string, unknown>;
  request_headers: Record<string, string>;
  response_status: number | null;
  response_body: string | null;
  response_headers: Record<string, string> | null;
  response_time_ms: number | null;
  status: WebhookDeliveryStatus;
  attempt_count: number;
  max_attempts: number;
  next_retry_at: string | null;
  error_message: string | null;
  delivered_at: string | null;
  created_at: string;
}

/**
 * Webhook insert type
 */
export type WebhookInsert = Omit<Webhook, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

/**
 * Webhook update type
 */
export type WebhookUpdate = Partial<
  Omit<Webhook, 'id' | 'tenant_id' | 'created_by' | 'created_at' | 'updated_at'>
>;

/**
 * Webhook test result
 */
export interface WebhookTestResult {
  success: boolean;
  status_code: number | null;
  response_time_ms: number;
  response_body: string | null;
  error_message: string | null;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const webhookKeys = createQueryKeyFactory<string>('webhooks');
export const webhookDeliveryKeys = createQueryKeyFactory<string>('webhook_deliveries');

// Extended query keys
export const webhookQueryKeys = {
  ...webhookKeys,
  byProject: (projectId: string) => [...webhookKeys.all, 'project', projectId] as const,
  byStatus: (status: WebhookStatus) => [...webhookKeys.all, 'status', status] as const,
  byEvent: (event: WebhookEventType) => [...webhookKeys.all, 'event', event] as const,
  active: () => [...webhookKeys.all, 'active'] as const,
};

export const deliveryQueryKeys = {
  ...webhookDeliveryKeys,
  byWebhook: (webhookId: string) => [...webhookDeliveryKeys.all, 'webhook', webhookId] as const,
  byStatus: (status: WebhookDeliveryStatus) =>
    [...webhookDeliveryKeys.all, 'status', status] as const,
  failed: () => [...webhookDeliveryKeys.all, 'failed'] as const,
  recent: (webhookId: string) => [...webhookDeliveryKeys.all, 'recent', webhookId] as const,
};

// ============================================================================
// WEBHOOK QUERY HOOKS
// ============================================================================

/**
 * Fetch all webhooks
 */
export const useWebhooks = (options: ListQueryOptions = {}) => {
  const {
    pagination = { page: DEFAULT_PAGE, pageSize: DEFAULT_PAGE_SIZE },
    sort = { column: 'name', ascending: true },
    filters = [],
    search,
    enabled = true,
  } = options;

  const page = pagination.page ?? DEFAULT_PAGE;
  const pageSize = pagination.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = calculateOffset(page, pageSize);

  return useQuery({
    queryKey: webhookKeys.list({ pagination, sort, filters, search }),
    queryFn: async () => {
      let query = supabase
        .from('webhook')
        .select('*', { count: 'exact' });

      // Apply filters
      filters.forEach(filter => {
        query = query.filter(filter.column, filter.operator, filter.value);
      });

      // Apply search
      if (search) {
        query = query.ilike('name', `%${search.value}%`);
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
      return { data: data as Webhook[], count };
    },
    enabled,
  });
};

/**
 * Fetch a single webhook by ID
 */
export const useWebhook = (webhookId: string, options: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: webhookKeys.detail(webhookId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook')
        .select('*')
        .eq('id', webhookId)
        .single();

      if (error) throw error;
      return data as Webhook;
    },
    enabled: options.enabled !== false && !!webhookId,
  });
};

/**
 * Fetch webhooks by project
 */
export const useWebhooksByProject = (projectId: string) => {
  return useQuery({
    queryKey: webhookQueryKeys.byProject(projectId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook')
        .select('*')
        .eq('project_id', projectId)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Webhook[];
    },
    enabled: !!projectId,
  });
};

/**
 * Fetch active webhooks
 */
export const useActiveWebhooks = () => {
  return useQuery({
    queryKey: webhookQueryKeys.active(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook')
        .select('*')
        .eq('status', 'active')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Webhook[];
    },
  });
};

/**
 * Fetch webhooks by event type
 */
export const useWebhooksByEvent = (event: WebhookEventType) => {
  return useQuery({
    queryKey: webhookQueryKeys.byEvent(event),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook')
        .select('*')
        .contains('events', [event])
        .eq('status', 'active')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Webhook[];
    },
  });
};

// ============================================================================
// DELIVERY QUERY HOOKS
// ============================================================================

/**
 * Fetch webhook deliveries
 */
export const useWebhookDeliveries = (webhookId: string, pagination?: PaginationParams) => {
  const page = pagination?.page ?? DEFAULT_PAGE;
  const pageSize = pagination?.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = calculateOffset(page, pageSize);

  return useQuery({
    queryKey: deliveryQueryKeys.byWebhook(webhookId),
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from('webhook_delivery')
        .select('*', { count: 'exact' })
        .eq('webhook_id', webhookId)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) throw error;
      return { data: data as WebhookDelivery[], count };
    },
    enabled: !!webhookId,
  });
};

/**
 * Infinite scroll for webhook deliveries
 */
export const useInfiniteWebhookDeliveries = (
  webhookId: string,
  options: { enabled?: boolean } = {}
) => {
  const pageSize = DEFAULT_PAGE_SIZE;

  return useInfiniteQuery({
    queryKey: [...deliveryQueryKeys.byWebhook(webhookId), 'infinite'] as const,
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error, count } = await supabase
        .from('webhook_delivery')
        .select('*', { count: 'exact' })
        .eq('webhook_id', webhookId)
        .order('created_at', { ascending: false })
        .range(pageParam, pageParam + pageSize - 1);

      if (error) throw error;
      return { data: data as WebhookDelivery[], count, nextCursor: pageParam + pageSize };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (!lastPage.count || lastPage.data.length < pageSize) return undefined;
      return lastPage.nextCursor;
    },
    enabled: options.enabled !== false && !!webhookId,
  });
};

/**
 * Fetch a single delivery
 */
export const useWebhookDelivery = (deliveryId: string, options: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: webhookDeliveryKeys.detail(deliveryId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_delivery')
        .select('*')
        .eq('id', deliveryId)
        .single();

      if (error) throw error;
      return data as WebhookDelivery;
    },
    enabled: options.enabled !== false && !!deliveryId,
  });
};

/**
 * Fetch failed deliveries
 */
export const useFailedDeliveries = (pagination?: PaginationParams) => {
  const page = pagination?.page ?? DEFAULT_PAGE;
  const pageSize = pagination?.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = calculateOffset(page, pageSize);

  return useQuery({
    queryKey: deliveryQueryKeys.failed(),
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from('webhook_delivery')
        .select('*, webhook(id, name, url)', { count: 'exact' })
        .eq('status', 'failed')
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) throw error;
      return { data: data as (WebhookDelivery & { webhook: Pick<Webhook, 'id' | 'name' | 'url'> })[], count };
    },
  });
};

/**
 * Fetch recent deliveries for a webhook
 */
export const useRecentDeliveries = (webhookId: string, limit: number = 10) => {
  return useQuery({
    queryKey: deliveryQueryKeys.recent(webhookId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_delivery')
        .select('*')
        .eq('webhook_id', webhookId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as WebhookDelivery[];
    },
    enabled: !!webhookId,
  });
};

// ============================================================================
// WEBHOOK MUTATION HOOKS
// ============================================================================

/**
 * Create a webhook
 */
export const useCreateWebhook = (
  options: MutationOptions<Webhook, WebhookInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (webhook: WebhookInsert) => {
      const { data, error } = await supabase
        .from('webhook')
        .insert(webhook)
        .select()
        .single();

      if (error) throw error;
      return data as Webhook;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.lists() });
      if (data.project_id) {
        queryClient.invalidateQueries({ queryKey: webhookQueryKeys.byProject(data.project_id) });
      }
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update a webhook
 */
export const useUpdateWebhook = (
  options: MutationOptions<Webhook, { id: string; updates: WebhookUpdate }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: WebhookUpdate }) => {
      const { data, error } = await supabase
        .from('webhook')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Webhook;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: webhookKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Delete a webhook
 */
export const useDeleteWebhook = (
  options: MutationOptions<void, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (webhookId: string) => {
      const { error } = await supabase
        .from('webhook')
        .delete()
        .eq('id', webhookId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.all });
      options.onSuccess?.(undefined, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Toggle webhook status
 */
export const useToggleWebhookStatus = (
  options: MutationOptions<Webhook, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (webhookId: string) => {
      // Get current status
      const { data: current, error: fetchError } = await supabase
        .from('webhook')
        .select('status')
        .eq('id', webhookId)
        .single();

      if (fetchError) throw fetchError;

      const newStatus: WebhookStatus = current.status === 'active' ? 'paused' : 'active';

      const { data, error } = await supabase
        .from('webhook')
        .update({ status: newStatus })
        .eq('id', webhookId)
        .select()
        .single();

      if (error) throw error;
      return data as Webhook;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.detail(variables) });
      queryClient.invalidateQueries({ queryKey: webhookQueryKeys.active() });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Test webhook
 */
export const useTestWebhook = (
  options: MutationOptions<WebhookTestResult, string> = {}
) => {
  return useMutation({
    mutationFn: async (webhookId: string) => {
      // Get webhook details
      const { data: webhook, error: fetchError } = await supabase
        .from('webhook')
        .select('*')
        .eq('id', webhookId)
        .single();

      if (fetchError) throw fetchError;

      // Send test request (this would normally go through a backend service)
      const startTime = Date.now();

      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Secret': webhook.secret || '',
            ...webhook.headers,
          },
          body: JSON.stringify({
            event: 'webhook.test',
            webhook_id: webhookId,
            timestamp: new Date().toISOString(),
            data: { message: 'This is a test webhook delivery' },
          }),
        });

        const responseTime = Date.now() - startTime;
        const responseBody = await response.text();

        return {
          success: response.ok,
          status_code: response.status,
          response_time_ms: responseTime,
          response_body: responseBody,
          error_message: response.ok ? null : `HTTP ${response.status}`,
        } as WebhookTestResult;
      } catch (error) {
        return {
          success: false,
          status_code: null,
          response_time_ms: Date.now() - startTime,
          response_body: null,
          error_message: error instanceof Error ? error.message : 'Unknown error',
        } as WebhookTestResult;
      }
    },
    onSuccess: options.onSuccess,
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Retry failed delivery
 */
export const useRetryDelivery = (
  options: MutationOptions<WebhookDelivery, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (deliveryId: string) => {
      const { data, error } = await supabase
        .from('webhook_delivery')
        .update({
          status: 'pending',
          attempt_count: 0,
          next_retry_at: new Date().toISOString(),
        })
        .eq('id', deliveryId)
        .select()
        .single();

      if (error) throw error;
      return data as WebhookDelivery;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: webhookDeliveryKeys.detail(variables) });
      queryClient.invalidateQueries({ queryKey: deliveryQueryKeys.byWebhook(data.webhook_id) });
      queryClient.invalidateQueries({ queryKey: deliveryQueryKeys.failed() });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Regenerate webhook secret
 */
export const useRegenerateWebhookSecret = (
  options: MutationOptions<Webhook, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (webhookId: string) => {
      // Generate new secret (in real app, this would be done server-side)
      const newSecret = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const { data, error } = await supabase
        .from('webhook')
        .update({ secret: newSecret })
        .eq('id', webhookId)
        .select()
        .single();

      if (error) throw error;
      return data as Webhook;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.detail(variables) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

// ============================================================================
// TODO: Additional Features
// ============================================================================
// TODO: Add useBulkRetryDeliveries mutation for batch retries
// TODO: Add useWebhookStats hook for delivery statistics
// TODO: Add useWebhookLogs hook for detailed logging
// TODO: Add useWebhookSignature hook for signature verification
// TODO: Add useWebhookTemplates hook for payload templates
// TODO: Add useWebhookFilters hook for event filtering
// TODO: Add useWebhookRateLimits hook for rate limiting
// TODO: Add useWebhookTransformers hook for payload transformation
// TODO: Add real-time delivery status updates
// TODO: Add useWebhookHealthCheck hook for endpoint health
