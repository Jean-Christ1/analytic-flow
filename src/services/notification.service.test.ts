// ============================================================================
// Unit Tests - Notification Service
// MLOps Control Plane v3
// Author: Armand AMOUSSOU
// Date: 2026-01-04
// ============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import { createSimpleMockQuery } from '@/test/mocks/supabase-mock';
import {
  notificationService,
  type Notification,
  type NotificationFilter,
  type AlertRule,
} from './notification.service';

// ============================================================================
// MOCK SETUP
// ============================================================================

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
};

const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    userId: 'user-123',
    tenantId: 'tenant-123',
    type: 'run_completed',
    priority: 'normal',
    title: 'Run Completed',
    message: 'Your ML run has completed successfully.',
    link: '/runs/run-123',
    read: false,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'notif-2',
    userId: 'user-123',
    tenantId: 'tenant-123',
    type: 'model_deployed',
    priority: 'high',
    title: 'Model Deployed',
    message: 'Your model has been deployed to production.',
    link: '/deployments/deploy-123',
    read: true,
    readAt: '2026-01-01T01:00:00Z',
    createdAt: '2026-01-01T00:30:00Z',
  },
];

const mockAlertRules: AlertRule[] = [
  {
    id: 'rule-1',
    name: 'Accuracy Alert',
    description: 'Alert when accuracy drops below threshold',
    enabled: true,
    condition: {
      type: 'metric_threshold',
      metric: 'accuracy',
      operator: 'lt',
      threshold: 0.9,
    },
    actions: [
      { type: 'notification', config: { priority: 'high' } },
    ],
    cooldownMinutes: 60,
  },
];

beforeEach(() => {
  vi.clearAllMocks();

  // Mock auth.getUser
  vi.mocked(supabase.auth.getUser).mockResolvedValue({
    data: { user: mockUser as never },
    error: null,
  });

  // Mock channel subscription - subscribe() must return the channel for this.channel to be set
  const mockChannel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),  // Return the channel itself
  };
  vi.mocked(supabase.channel).mockReturnValue(
    mockChannel as unknown as ReturnType<typeof supabase.channel>
  );

  vi.mocked(supabase.removeChannel).mockResolvedValue('ok' as never);
});

afterEach(async () => {
  await notificationService.cleanup();
});

// ============================================================================
// initialize / cleanup TESTS
// ============================================================================

describe('notificationService.initialize', () => {
  it('should initialize and subscribe to notifications', async () => {
    await notificationService.initialize();

    expect(supabase.auth.getUser).toHaveBeenCalled();
    expect(supabase.channel).toHaveBeenCalled();
  });

  it('should throw error when not authenticated', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    });

    await expect(notificationService.initialize()).rejects.toThrow(
      'Not authenticated'
    );
  });
});

describe('notificationService.cleanup', () => {
  it('should remove channel and clear state', async () => {
    await notificationService.initialize();
    await notificationService.cleanup();

    expect(supabase.removeChannel).toHaveBeenCalled();
  });
});

// ============================================================================
// getNotifications TESTS
// ============================================================================

describe('notificationService.getNotifications', () => {
  beforeEach(async () => {
    await notificationService.initialize();
  });

  it('should fetch notifications successfully', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({
        data: mockNotifications.map((n) => ({
          id: n.id,
          user_id: n.userId,
          tenant_id: n.tenantId,
          type: n.type,
          priority: n.priority,
          title: n.title,
          message: n.message,
          link: n.link,
          read: n.read,
          read_at: n.readAt,
          created_at: n.createdAt,
        })),
      }) as ReturnType<typeof supabase.from>
    );

    const notifications = await notificationService.getNotifications();

    expect(notifications).toHaveLength(2);
    expect(notifications[0].id).toBe('notif-1');
  });

  it('should filter by types', async () => {
    const filter: NotificationFilter = { types: ['run_completed'] };

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({
        data: [mockNotifications[0]].map((n) => ({
          id: n.id,
          user_id: n.userId,
          tenant_id: n.tenantId,
          type: n.type,
          priority: n.priority,
          title: n.title,
          message: n.message,
          link: n.link,
          read: n.read,
          created_at: n.createdAt,
        })),
      }) as ReturnType<typeof supabase.from>
    );

    const notifications = await notificationService.getNotifications(filter);

    expect(notifications).toHaveLength(1);
    expect(notifications[0].type).toBe('run_completed');
  });

  it('should filter by read status', async () => {
    const filter: NotificationFilter = { read: false };

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({
        data: mockNotifications.filter((n) => !n.read).map((n) => ({
          id: n.id,
          user_id: n.userId,
          tenant_id: n.tenantId,
          type: n.type,
          priority: n.priority,
          title: n.title,
          message: n.message,
          link: n.link,
          read: n.read,
          created_at: n.createdAt,
        })),
      }) as ReturnType<typeof supabase.from>
    );

    const notifications = await notificationService.getNotifications(filter);

    expect(notifications).toHaveLength(1);
    expect(notifications[0].read).toBe(false);
  });
});

// ============================================================================
// getUnreadCount TESTS
// ============================================================================

describe('notificationService.getUnreadCount', () => {
  beforeEach(async () => {
    await notificationService.initialize();
  });

  it('should return unread count', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: [], count: 5 }) as ReturnType<typeof supabase.from>
    );

    const count = await notificationService.getUnreadCount();

    expect(count).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================================
// markAsRead TESTS
// ============================================================================

describe('notificationService.markAsRead', () => {
  beforeEach(async () => {
    await notificationService.initialize();
  });

  it('should mark notification as read', async () => {
    const mockQuery = createSimpleMockQuery({ data: null });
    vi.mocked(supabase.from).mockReturnValue(mockQuery as ReturnType<typeof supabase.from>);

    await notificationService.markAsRead('notif-1');

    expect(supabase.from).toHaveBeenCalledWith('notification');
    expect(mockQuery.update).toHaveBeenCalled();
  });

  it('should handle error when marking as read', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({
        data: null,
        error: { message: 'Update failed', code: 'PGRST000' },
      }) as ReturnType<typeof supabase.from>
    );

    await expect(notificationService.markAsRead('notif-1')).rejects.toThrow(
      'Update failed'
    );
  });
});

// ============================================================================
// markAllAsRead TESTS
// ============================================================================

describe('notificationService.markAllAsRead', () => {
  beforeEach(async () => {
    await notificationService.initialize();
  });

  it('should mark all notifications as read', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: null }) as ReturnType<typeof supabase.from>
    );

    await notificationService.markAllAsRead();

    expect(supabase.from).toHaveBeenCalledWith('notification');
  });
});

// ============================================================================
// deleteNotification TESTS
// ============================================================================

describe('notificationService.deleteNotification', () => {
  beforeEach(async () => {
    await notificationService.initialize();
  });

  it('should delete a notification', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: null }) as ReturnType<typeof supabase.from>
    );

    await notificationService.deleteNotification('notif-1');

    expect(supabase.from).toHaveBeenCalledWith('notification');
  });
});

// ============================================================================
// sendNotification TESTS
// ============================================================================

describe('notificationService.sendNotification', () => {
  beforeEach(async () => {
    await notificationService.initialize();
  });

  it('should send a notification', async () => {
    const newNotification = {
      id: 'notif-new',
      user_id: 'user-456',
      tenant_id: 'tenant-123',
      type: 'info',
      priority: 'normal',
      title: 'Test Notification',
      message: 'This is a test notification.',
      read: false,
      created_at: new Date().toISOString(),
    };

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: newNotification }) as ReturnType<typeof supabase.from>
    );

    const notification = await notificationService.sendNotification({
      userId: 'user-456',
      tenantId: 'tenant-123',
      type: 'info',
      title: 'Test Notification',
      message: 'This is a test notification.',
    });

    expect(notification).toBeDefined();
    expect(notification.id).toBe('notif-new');
  });
});

// ============================================================================
// getAlertRules TESTS
// ============================================================================

describe('notificationService.getAlertRules', () => {
  beforeEach(async () => {
    await notificationService.initialize();
  });

  it('should fetch alert rules', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({
        data: mockAlertRules.map((r) => ({
          id: r.id,
          name: r.name,
          description: r.description,
          enabled: r.enabled,
          condition: r.condition,
          actions: r.actions,
          cooldown_minutes: r.cooldownMinutes,
        })),
      }) as ReturnType<typeof supabase.from>
    );

    const rules = await notificationService.getAlertRules();

    expect(rules).toHaveLength(1);
    expect(rules[0].name).toBe('Accuracy Alert');
  });
});

// ============================================================================
// createAlertRule TESTS
// ============================================================================

describe('notificationService.createAlertRule', () => {
  beforeEach(async () => {
    await notificationService.initialize();
  });

  it('should create an alert rule', async () => {
    const newRule = {
      ...mockAlertRules[0],
      id: 'rule-new',
    };

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'profiles') {
        return createSimpleMockQuery({
          data: { tenant_id: 'tenant-123' },
        }) as ReturnType<typeof supabase.from>;
      }

      return createSimpleMockQuery({
        data: {
          id: newRule.id,
          name: newRule.name,
          description: newRule.description,
          enabled: newRule.enabled,
          condition: newRule.condition,
          actions: newRule.actions,
          cooldown_minutes: newRule.cooldownMinutes,
        },
      }) as ReturnType<typeof supabase.from>;
    });

    const rule = await notificationService.createAlertRule({
      name: 'Accuracy Alert',
      enabled: true,
      condition: {
        type: 'metric_threshold',
        metric: 'accuracy',
        operator: 'lt',
        threshold: 0.9,
      },
      actions: [{ type: 'notification', config: { priority: 'high' } }],
      cooldownMinutes: 60,
    });

    expect(rule).toBeDefined();
  });
});

// ============================================================================
// updateAlertRule TESTS
// ============================================================================

describe('notificationService.updateAlertRule', () => {
  beforeEach(async () => {
    await notificationService.initialize();
  });

  it('should update an alert rule', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: null }) as ReturnType<typeof supabase.from>
    );

    await notificationService.updateAlertRule('rule-1', {
      name: 'Updated Alert',
      enabled: false,
    });

    expect(supabase.from).toHaveBeenCalledWith('alert_rule');
  });
});

// ============================================================================
// deleteAlertRule TESTS
// ============================================================================

describe('notificationService.deleteAlertRule', () => {
  beforeEach(async () => {
    await notificationService.initialize();
  });

  it('should delete an alert rule', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: null }) as ReturnType<typeof supabase.from>
    );

    await notificationService.deleteAlertRule('rule-1');

    expect(supabase.from).toHaveBeenCalledWith('alert_rule');
  });
});

// ============================================================================
// onNotification TESTS
// ============================================================================

describe('notificationService.onNotification', () => {
  beforeEach(async () => {
    await notificationService.initialize();
  });

  it('should subscribe to notifications', () => {
    const callback = vi.fn();

    const unsubscribe = notificationService.onNotification(callback);

    expect(typeof unsubscribe).toBe('function');
  });

  it('should unsubscribe from notifications', () => {
    const callback = vi.fn();

    const unsubscribe = notificationService.onNotification(callback);
    unsubscribe();

    // Should not throw
    expect(true).toBe(true);
  });
});

// ============================================================================
// TODO: Additional test cases
// ============================================================================
// TODO: Add tests for broadcastToTenant
// TODO: Add tests for clearOldNotifications
// TODO: Add tests for getPreferences and updatePreferences
// TODO: Add tests for testAlertRule
// TODO: Add integration tests for real-time notifications
// TODO: Add tests for external channel delivery (email, Slack)
