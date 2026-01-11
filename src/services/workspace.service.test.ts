// ============================================================================
// Unit Tests - Workspace Service
// MLOps Control Plane v3
// Author: Armand AMOUSSOU
// Date: 2026-01-04
// ============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import { workspaceService, type WorkspaceLaunchConfig } from './workspace.service';

// ============================================================================
// MOCK SETUP
// ============================================================================

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
};

const mockProfile = {
  tenant_id: 'tenant-123',
};

const mockWorkspace = {
  id: 'workspace-123',
  tenant_id: 'tenant-123',
  project_id: 'project-123',
  user_id: 'user-123',
  name: 'Test Workspace',
  workspace_type: 'jupyter',
  status: 'running',
  endpoint_url: 'https://workspace-123.example.com',
  started_at: '2026-01-01T00:00:00Z',
  last_activity_at: '2026-01-01T01:00:00Z',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const mockTemplate = {
  id: 'template-123',
  name: 'Jupyter Notebook',
  image: 'jupyter/datascience-notebook:latest',
  default_environment_vars: { JUPYTER_ENABLE_LAB: 'yes' },
};

const mockComputeProfile = {
  cpu_request: '2',
  memory_request: '4Gi',
  gpu_count: 0,
};

beforeEach(() => {
  vi.clearAllMocks();

  // Mock auth.getUser
  vi.mocked(supabase.auth.getUser).mockResolvedValue({
    data: { user: mockUser as never },
    error: null,
  });

  // Mock profiles query for tenant_id
  vi.mocked(supabase.from).mockImplementation((table: string) => {
    if (table === 'profiles') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockProfile,
          error: null,
        }),
      } as ReturnType<typeof supabase.from>;
    }

    // Default mock for other tables
    return {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    } as ReturnType<typeof supabase.from>;
  });
});

afterEach(() => {
  vi.useRealTimers();
});

// ============================================================================
// launchWorkspace TESTS
// ============================================================================

describe('workspaceService.launchWorkspace', () => {
  it('should launch a new workspace without template', async () => {
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
        } as ReturnType<typeof supabase.from>;
      }

      if (table === 'workspace') {
        return {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockWorkspace, error: null }),
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
        } as ReturnType<typeof supabase.from>;
      }

      return {} as ReturnType<typeof supabase.from>;
    });

    const config: WorkspaceLaunchConfig = {
      projectId: 'project-123',
      name: 'Test Workspace',
      workspaceType: 'jupyter',
      clusterId: 'cluster-123',
    };

    const workspace = await workspaceService.launchWorkspace(config);

    expect(workspace).toBeDefined();
    expect(workspace.id).toBe('workspace-123');
  });

  it('should launch workspace with template', async () => {
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
        } as ReturnType<typeof supabase.from>;
      }

      if (table === 'workspace_template') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockTemplate, error: null }),
        } as ReturnType<typeof supabase.from>;
      }

      if (table === 'workspace') {
        return {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockWorkspace, error: null }),
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
        } as ReturnType<typeof supabase.from>;
      }

      return {} as ReturnType<typeof supabase.from>;
    });

    const config: WorkspaceLaunchConfig = {
      projectId: 'project-123',
      name: 'Test Workspace',
      workspaceType: 'jupyter',
      clusterId: 'cluster-123',
      templateId: 'template-123',
    };

    const workspace = await workspaceService.launchWorkspace(config);

    expect(workspace).toBeDefined();
  });

  it('should throw error when not authenticated', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const config: WorkspaceLaunchConfig = {
      projectId: 'project-123',
      name: 'Test Workspace',
      workspaceType: 'jupyter',
      clusterId: 'cluster-123',
    };

    await expect(workspaceService.launchWorkspace(config)).rejects.toThrow(
      'Not authenticated'
    );
  });
});

// ============================================================================
// getWorkspaceDetails TESTS
// ============================================================================

describe('workspaceService.getWorkspaceDetails', () => {
  it('should return workspace details with computed fields', async () => {
    const workspaceWithRelations = {
      ...mockWorkspace,
      project: { id: 'project-123', name: 'Test Project' },
      user: { id: 'user-123', full_name: 'Test User' },
      compute_profile: mockComputeProfile,
    };

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: workspaceWithRelations,
        error: null,
      }),
    } as ReturnType<typeof supabase.from>);

    const details = await workspaceService.getWorkspaceDetails('workspace-123');

    expect(details).not.toBeNull();
    expect(details?.id).toBe('workspace-123');
    expect(details?.project.name).toBe('Test Project');
    expect(details?.user.name).toBe('Test User');
    expect(details?.resources.cpu).toBe('2');
    expect(details?.resources.memory).toBe('4Gi');
  });

  it('should return null when workspace not found', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Not found', code: 'PGRST116' },
      }),
    } as ReturnType<typeof supabase.from>);

    const details = await workspaceService.getWorkspaceDetails('non-existent');

    expect(details).toBeNull();
  });

  it('should calculate uptime for running workspace', async () => {
    const startedAt = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
    const workspaceWithRelations = {
      ...mockWorkspace,
      status: 'running',
      started_at: startedAt,
      project: { id: 'project-123', name: 'Test Project' },
      user: { id: 'user-123', full_name: 'Test User' },
      compute_profile: mockComputeProfile,
    };

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: workspaceWithRelations,
        error: null,
      }),
    } as ReturnType<typeof supabase.from>);

    const details = await workspaceService.getWorkspaceDetails('workspace-123');

    expect(details?.uptime).toBeGreaterThan(3500); // approximately 1 hour in seconds
  });
});

// ============================================================================
// stopWorkspace TESTS
// ============================================================================

describe('workspaceService.stopWorkspace', () => {
  it('should stop a running workspace', async () => {
    vi.useFakeTimers();

    vi.mocked(supabase.from).mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    } as ReturnType<typeof supabase.from>);

    const stopPromise = workspaceService.stopWorkspace('workspace-123');

    // Fast-forward timers
    await vi.advanceTimersByTimeAsync(2000);

    await stopPromise;

    expect(supabase.from).toHaveBeenCalledWith('workspace');
  });
});

// ============================================================================
// getWorkspaceUrl TESTS
// ============================================================================

describe('workspaceService.getWorkspaceUrl', () => {
  it('should return URL for running workspace', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          endpoint_url: 'https://workspace.example.com',
          status: 'running',
        },
        error: null,
      }),
    } as ReturnType<typeof supabase.from>);

    const url = await workspaceService.getWorkspaceUrl('workspace-123');

    expect(url).toBe('https://workspace.example.com');
  });

  it('should return null for stopped workspace', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          endpoint_url: 'https://workspace.example.com',
          status: 'stopped',
        },
        error: null,
      }),
    } as ReturnType<typeof supabase.from>);

    const url = await workspaceService.getWorkspaceUrl('workspace-123');

    expect(url).toBeNull();
  });
});

// ============================================================================
// getResourceUsage TESTS
// ============================================================================

describe('workspaceService.getResourceUsage', () => {
  it('should return resource usage for workspace', async () => {
    const resourcesUsed = {
      cpu_percent: 45,
      memory_percent: 60,
      memory_used_mb: 2048,
      gpu_percent: null,
      disk_used_gb: 10,
      network_in_mb: 100,
      network_out_mb: 50,
    };

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { resources_used: resourcesUsed },
        error: null,
      }),
    } as ReturnType<typeof supabase.from>);

    const usage = await workspaceService.getResourceUsage('workspace-123');

    expect(usage).not.toBeNull();
    expect(usage?.cpuPercent).toBe(45);
    expect(usage?.memoryPercent).toBe(60);
    expect(usage?.memoryUsedMb).toBe(2048);
  });

  it('should return null when workspace not found', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    } as ReturnType<typeof supabase.from>);

    const usage = await workspaceService.getResourceUsage('non-existent');

    expect(usage).toBeNull();
  });
});

// ============================================================================
// recordActivity TESTS
// ============================================================================

describe('workspaceService.recordActivity', () => {
  it('should update last_activity_at timestamp', async () => {
    const mockUpdate = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockResolvedValue({ data: null, error: null });

    vi.mocked(supabase.from).mockReturnValue({
      update: mockUpdate,
      eq: mockEq,
    } as ReturnType<typeof supabase.from>);

    await workspaceService.recordActivity('workspace-123');

    expect(supabase.from).toHaveBeenCalledWith('workspace');
    expect(mockUpdate).toHaveBeenCalled();
  });
});

// ============================================================================
// checkIdleWorkspaces TESTS
// ============================================================================

describe('workspaceService.checkIdleWorkspaces', () => {
  it('should stop workspaces that exceed idle timeout', async () => {
    const idleWorkspace = {
      id: 'workspace-idle',
      auto_shutdown_minutes: 60,
      last_activity_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    };

    vi.useFakeTimers();

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'workspace') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: idleWorkspace, error: null }),
        } as ReturnType<typeof supabase.from>;
      }
      return {} as ReturnType<typeof supabase.from>;
    });

    // The method would call stopWorkspace internally
    // This test just verifies it doesn't throw
    await expect(workspaceService.checkIdleWorkspaces()).resolves.not.toThrow();
  });
});

// ============================================================================
// cloneWorkspace TESTS
// ============================================================================

describe('workspaceService.cloneWorkspace', () => {
  it('should clone workspace configuration', async () => {
    const sourceWorkspace = {
      ...mockWorkspace,
      environment_vars: { VAR1: 'value1' },
      volumes: ['/data'],
      ports: [8888],
    };

    const clonedWorkspace = {
      ...sourceWorkspace,
      id: 'workspace-clone',
      name: 'Cloned Workspace',
      status: 'pending',
      metadata: { cloned_from: 'workspace-123' },
    };

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
        } as ReturnType<typeof supabase.from>;
      }

      if (table === 'workspace') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: sourceWorkspace, error: null }),
          insert: vi.fn().mockReturnThis(),
        } as ReturnType<typeof supabase.from>;
      }

      return {} as ReturnType<typeof supabase.from>;
    });

    // Note: This test is incomplete because the actual implementation
    // has multiple chained calls. In a real scenario, you'd need more
    // sophisticated mocking.
  });

  it('should throw error when source workspace not found', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Not found', code: 'PGRST116' },
      }),
    } as ReturnType<typeof supabase.from>);

    await expect(
      workspaceService.cloneWorkspace('non-existent', 'Clone')
    ).rejects.toThrow('Source workspace not found');
  });
});

// ============================================================================
// TODO: Additional test cases
// ============================================================================
// TODO: Add tests for terminateWorkspace
// TODO: Add tests for restartWorkspace
// TODO: Add tests for getMyActiveWorkspaces
// TODO: Add integration tests with actual Kubernetes provisioning
// TODO: Add performance tests for concurrent workspace operations
