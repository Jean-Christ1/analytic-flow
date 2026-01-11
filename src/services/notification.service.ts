// ============================================================================
// Notification Service - Real-time Notifications & Alerts
// MLOps Control Plane v3
// Author: Armand AMOUSSOU
// Date: 2026-01-04
// ============================================================================

import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

export type NotificationType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'run_completed'
  | 'run_failed'
  | 'model_deployed'
  | 'model_failed'
  | 'workspace_ready'
  | 'workspace_stopped'
  | 'alert_triggered'
  | 'resource_limit'
  | 'collaboration_invite'
  | 'comment_mention';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export type NotificationChannel = 'in_app' | 'email' | 'slack' | 'webhook';

export interface Notification {
  id: string;
  userId: string;
  tenantId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
  read: boolean;
  readAt?: string;
  createdAt: string;
}

export interface NotificationPreferences {
  userId: string;
  channels: {
    in_app: boolean;
    email: boolean;
    slack: boolean;
    webhook: boolean;
  };
  types: {
    [key in NotificationType]?: {
      enabled: boolean;
      channels: NotificationChannel[];
    };
  };
  quietHours?: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string;
    timezone: string;
  };
  emailDigest?: 'none' | 'daily' | 'weekly';
}

export interface NotificationFilter {
  types?: NotificationType[];
  priorities?: NotificationPriority[];
  read?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
}

export interface AlertRule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  condition: AlertCondition;
  actions: AlertAction[];
  cooldownMinutes: number;
  lastTriggeredAt?: string;
}

export interface AlertCondition {
  type: 'metric_threshold' | 'run_status' | 'resource_usage' | 'custom';
  metric?: string;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq';
  threshold?: number;
  duration?: number; // seconds
  customQuery?: string;
}

export interface AlertAction {
  type: 'notification' | 'email' | 'slack' | 'webhook' | 'auto_scale' | 'stop_run';
  config: Record<string, unknown>;
}

type NotificationCallback = (notification: Notification) => void;

// ============================================================================
// NOTIFICATION SERVICE
// ============================================================================

class NotificationService {
  private channel: RealtimeChannel | null = null;
  private subscribers: Map<string, NotificationCallback[]> = new Map();
  private userId: string | null = null;

  /**
   * Initialize notification service for current user
   */
  async initialize(): Promise<void> {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      throw new Error('Not authenticated');
    }

    this.userId = data.user.id;
    await this.subscribeToNotifications();
  }

  /**
   * Clean up notification service
   */
  async cleanup(): Promise<void> {
    if (this.channel) {
      await supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.subscribers.clear();
    this.userId = null;
  }

  /**
   * Get notifications with filtering
   */
  async getNotifications(
    filter?: NotificationFilter,
    limit: number = 50,
    offset: number = 0
  ): Promise<Notification[]> {
    if (!this.userId) throw new Error('Not initialized');

    let query = supabase
      .from('notification')
      .select('*')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filter?.types?.length) {
      query = query.in('type', filter.types);
    }

    if (filter?.priorities?.length) {
      query = query.in('priority', filter.priorities);
    }

    if (filter?.read !== undefined) {
      query = query.eq('read', filter.read);
    }

    if (filter?.startDate) {
      query = query.gte('created_at', filter.startDate);
    }

    if (filter?.endDate) {
      query = query.lte('created_at', filter.endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch notifications:', error);
      throw new Error(error.message);
    }

    return (data ?? []).map(this.mapNotification);
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    if (!this.userId) throw new Error('Not initialized');

    const { count, error } = await supabase
      .from('notification')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', this.userId)
      .eq('read', false);

    if (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }

    return count ?? 0;
  }

  /**
   * Get notification statistics
   */
  async getStats(): Promise<NotificationStats> {
    if (!this.userId) throw new Error('Not initialized');

    const { data: notifications } = await supabase
      .from('notification')
      .select('type, priority, read')
      .eq('user_id', this.userId);

    const stats: NotificationStats = {
      total: 0,
      unread: 0,
      byType: {} as Record<NotificationType, number>,
      byPriority: {} as Record<NotificationPriority, number>,
    };

    for (const n of notifications ?? []) {
      stats.total++;
      if (!n.read) stats.unread++;

      const type = n.type as NotificationType;
      stats.byType[type] = (stats.byType[type] ?? 0) + 1;

      const priority = n.priority as NotificationPriority;
      stats.byPriority[priority] = (stats.byPriority[priority] ?? 0) + 1;
    }

    return stats;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notification')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) {
      console.error('Failed to mark notification as read:', error);
      throw new Error(error.message);
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    if (!this.userId) throw new Error('Not initialized');

    const { error } = await supabase
      .from('notification')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('user_id', this.userId)
      .eq('read', false);

    if (error) {
      console.error('Failed to mark all as read:', error);
      throw new Error(error.message);
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notification')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Failed to delete notification:', error);
      throw new Error(error.message);
    }
  }

  /**
   * Clear old notifications
   */
  async clearOldNotifications(daysOld: number = 30): Promise<number> {
    if (!this.userId) throw new Error('Not initialized');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { data, error } = await supabase
      .from('notification')
      .delete()
      .eq('user_id', this.userId)
      .eq('read', true)
      .lt('created_at', cutoffDate.toISOString())
      .select('id');

    if (error) {
      console.error('Failed to clear old notifications:', error);
      throw new Error(error.message);
    }

    return data?.length ?? 0;
  }

  /**
   * Send a notification (for internal use or admin)
   */
  async sendNotification(notification: {
    userId: string;
    tenantId: string;
    type: NotificationType;
    priority?: NotificationPriority;
    title: string;
    message: string;
    link?: string;
    metadata?: Record<string, unknown>;
  }): Promise<Notification> {
    const { data, error } = await supabase
      .from('notification')
      .insert({
        user_id: notification.userId,
        tenant_id: notification.tenantId,
        type: notification.type,
        priority: notification.priority ?? 'normal',
        title: notification.title,
        message: notification.message,
        link: notification.link,
        metadata: notification.metadata,
        read: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to send notification:', error);
      throw new Error(error.message);
    }

    // TODO: Send to external channels (email, Slack, webhook) based on preferences
    // await this.sendToExternalChannels(notification);

    return this.mapNotification(data);
  }

  /**
   * Broadcast notification to all tenant users
   */
  async broadcastToTenant(
    tenantId: string,
    notification: {
      type: NotificationType;
      priority?: NotificationPriority;
      title: string;
      message: string;
      link?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<number> {
    // Get all users in tenant
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('tenant_id', tenantId);

    if (!profiles?.length) return 0;

    const notifications = profiles.map((p) => ({
      user_id: p.user_id,
      tenant_id: tenantId,
      type: notification.type,
      priority: notification.priority ?? 'normal',
      title: notification.title,
      message: notification.message,
      link: notification.link,
      metadata: notification.metadata,
      read: false,
    }));

    const { error } = await supabase.from('notification').insert(notifications);

    if (error) {
      console.error('Failed to broadcast notification:', error);
      throw new Error(error.message);
    }

    return notifications.length;
  }

  /**
   * Get user notification preferences
   */
  async getPreferences(): Promise<NotificationPreferences | null> {
    if (!this.userId) throw new Error('Not initialized');

    const { data } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', this.userId)
      .single();

    if (!data) return null;

    return {
      userId: data.user_id,
      channels: data.channels as NotificationPreferences['channels'],
      types: data.types as NotificationPreferences['types'],
      quietHours: data.quiet_hours as NotificationPreferences['quietHours'],
      emailDigest: data.email_digest as NotificationPreferences['emailDigest'],
    };
  }

  /**
   * Update user notification preferences
   */
  async updatePreferences(
    preferences: Partial<Omit<NotificationPreferences, 'userId'>>
  ): Promise<void> {
    if (!this.userId) throw new Error('Not initialized');

    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: this.userId,
        channels: preferences.channels,
        types: preferences.types,
        quiet_hours: preferences.quietHours,
        email_digest: preferences.emailDigest,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Failed to update preferences:', error);
      throw new Error(error.message);
    }
  }

  /**
   * Subscribe to real-time notifications
   */
  onNotification(callback: NotificationCallback): () => void {
    const key = 'notification';
    const existing = this.subscribers.get(key) ?? [];
    this.subscribers.set(key, [...existing, callback]);

    return () => {
      const callbacks = this.subscribers.get(key) ?? [];
      this.subscribers.set(
        key,
        callbacks.filter((cb) => cb !== callback)
      );
    };
  }

  // ============================================================================
  // ALERT RULES
  // ============================================================================

  /**
   * Get alert rules for current user
   */
  async getAlertRules(): Promise<AlertRule[]> {
    if (!this.userId) throw new Error('Not initialized');

    const { data, error } = await supabase
      .from('alert_rule')
      .select('*')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch alert rules:', error);
      throw new Error(error.message);
    }

    return (data ?? []).map(this.mapAlertRule);
  }

  /**
   * Create alert rule
   */
  async createAlertRule(rule: Omit<AlertRule, 'id' | 'lastTriggeredAt'>): Promise<AlertRule> {
    if (!this.userId) throw new Error('Not initialized');

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('user_id', this.userId)
      .single();

    const { data, error } = await supabase
      .from('alert_rule')
      .insert({
        user_id: this.userId,
        tenant_id: profile?.tenant_id,
        name: rule.name,
        description: rule.description,
        enabled: rule.enabled,
        condition: rule.condition,
        actions: rule.actions,
        cooldown_minutes: rule.cooldownMinutes,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create alert rule:', error);
      throw new Error(error.message);
    }

    return this.mapAlertRule(data);
  }

  /**
   * Update alert rule
   */
  async updateAlertRule(
    ruleId: string,
    updates: Partial<Omit<AlertRule, 'id' | 'lastTriggeredAt'>>
  ): Promise<void> {
    const { error } = await supabase
      .from('alert_rule')
      .update({
        name: updates.name,
        description: updates.description,
        enabled: updates.enabled,
        condition: updates.condition,
        actions: updates.actions,
        cooldown_minutes: updates.cooldownMinutes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ruleId);

    if (error) {
      console.error('Failed to update alert rule:', error);
      throw new Error(error.message);
    }
  }

  /**
   * Delete alert rule
   */
  async deleteAlertRule(ruleId: string): Promise<void> {
    const { error } = await supabase
      .from('alert_rule')
      .delete()
      .eq('id', ruleId);

    if (error) {
      console.error('Failed to delete alert rule:', error);
      throw new Error(error.message);
    }
  }

  /**
   * Test alert rule condition
   */
  async testAlertRule(ruleId: string): Promise<{
    triggered: boolean;
    message: string;
    value?: number;
  }> {
    // TODO: Implement actual condition evaluation
    // This would query metrics, check thresholds, etc.

    return {
      triggered: false,
      message: 'Alert rule test completed (mock)',
      value: 0,
    };
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private async subscribeToNotifications(): Promise<void> {
    if (!this.userId) return;

    this.channel = supabase
      .channel(`notifications:${this.userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification',
          filter: `user_id=eq.${this.userId}`,
        },
        (payload) => {
          const notification = this.mapNotification(payload.new);
          const callbacks = this.subscribers.get('notification') ?? [];
          callbacks.forEach((cb) => cb(notification));
        }
      )
      .subscribe();
  }

  private mapNotification(data: Record<string, unknown>): Notification {
    return {
      id: data.id as string,
      userId: data.user_id as string,
      tenantId: data.tenant_id as string,
      type: data.type as NotificationType,
      priority: data.priority as NotificationPriority,
      title: data.title as string,
      message: data.message as string,
      link: data.link as string | undefined,
      metadata: data.metadata as Record<string, unknown> | undefined,
      read: data.read as boolean,
      readAt: data.read_at as string | undefined,
      createdAt: data.created_at as string,
    };
  }

  private mapAlertRule(data: Record<string, unknown>): AlertRule {
    return {
      id: data.id as string,
      name: data.name as string,
      description: data.description as string | undefined,
      enabled: data.enabled as boolean,
      condition: data.condition as AlertCondition,
      actions: data.actions as AlertAction[],
      cooldownMinutes: data.cooldown_minutes as number,
      lastTriggeredAt: data.last_triggered_at as string | undefined,
    };
  }

  // TODO: Implement external channel delivery
  // private async sendToExternalChannels(notification: {...}): Promise<void> {
  //   const prefs = await this.getPreferences();
  //   if (!prefs) return;
  //
  //   const typeConfig = prefs.types[notification.type];
  //   if (!typeConfig?.enabled) return;
  //
  //   for (const channel of typeConfig.channels) {
  //     switch (channel) {
  //       case 'email':
  //         await this.sendEmail(notification);
  //         break;
  //       case 'slack':
  //         await this.sendSlack(notification);
  //         break;
  //       case 'webhook':
  //         await this.sendWebhook(notification);
  //         break;
  //     }
  //   }
  // }
}

// Export singleton instance
export const notificationService = new NotificationService();

// ============================================================================
// REACT HOOKS FOR NOTIFICATIONS
// ============================================================================

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to use notification service in React components
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const [notifs, count] = await Promise.all([
        notificationService.getNotifications(),
        notificationService.getUnreadCount(),
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    notificationService.initialize().then(refresh);

    const unsubscribe = notificationService.onNotification((notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      unsubscribe();
      notificationService.cleanup();
    };
  }, [refresh]);

  const markAsRead = useCallback(async (id: string) => {
    await notificationService.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    await notificationService.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    await notificationService.deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refresh,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}

// ============================================================================
// TODO: Additional Notification Features
// ============================================================================
// TODO: Implement email delivery integration (SendGrid, AWS SES)
// TODO: Implement Slack webhook integration
// TODO: Implement custom webhook delivery
// TODO: Add notification templates
// TODO: Add notification batching for high-volume scenarios
// TODO: Add notification rate limiting
// TODO: Implement push notifications (PWA, mobile)
// TODO: Add notification scheduling (delayed delivery)
// TODO: Add notification analytics and metrics
// TODO: Implement notification translations (i18n)
