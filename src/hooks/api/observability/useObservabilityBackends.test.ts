// ============================================================================
// Unit Tests - useObservabilityBackends Hooks
// MLOps Control Plane v3
// Author: Armand AMOUSSOU
// Date: 2026-01-04
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, createMockObservabilityBackend } from '@/test/utils';
import { supabase } from '@/integrations/supabase/client';
import { createSimpleMockQuery } from '@/test/mocks/supabase-mock';
import {
  useObservabilityBackends,
  useObservabilityBackend,
  useObservabilityBackendsByKind,
  useObservabilityBackendsByType,
  useLogsBackends,
  useMetricsBackends,
  useTracesBackends,
  useCreateObservabilityBackend,
  useUpdateObservabilityBackend,
  useDeleteObservabilityBackend,
} from './useObservabilityBackends';

// ============================================================================
// MOCK SETUP
// ============================================================================

const mockBackends = [
  createMockObservabilityBackend({ id: 'obs-1', kind: 'metrics', type: 'prometheus' }),
  createMockObservabilityBackend({ id: 'obs-2', kind: 'logs', type: 'loki' }),
  createMockObservabilityBackend({ id: 'obs-3', kind: 'traces', type: 'jaeger' }),
  createMockObservabilityBackend({ id: 'obs-4', kind: 'metrics', type: 'victoriametrics' }),
];

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// useObservabilityBackends TESTS
// ============================================================================

describe('useObservabilityBackends', () => {
  it('should fetch observability backends successfully', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: mockBackends, count: mockBackends.length }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useObservabilityBackends());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data).toEqual(mockBackends);
    expect(supabase.from).toHaveBeenCalledWith('observability_backend');
  });

  it('should handle fetch error', async () => {
    const mockError = { message: 'Database error', code: 'PGRST000' };

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: null, error: mockError }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useObservabilityBackends());

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});

// ============================================================================
// useObservabilityBackend TESTS
// ============================================================================

describe('useObservabilityBackend', () => {
  it('should fetch a single backend by ID', async () => {
    const mockBackend = mockBackends[0];

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: mockBackend }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useObservabilityBackend('obs-1'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockBackend);
  });

  it('should not fetch when id is undefined', () => {
    const { result } = renderHook(() => useObservabilityBackend(undefined));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFetching).toBe(false);
  });
});

// ============================================================================
// useObservabilityBackendsByKind TESTS
// ============================================================================

describe('useObservabilityBackendsByKind', () => {
  it('should fetch backends by kind', async () => {
    const metricsBackends = mockBackends.filter((b) => b.kind === 'metrics');

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: metricsBackends, count: metricsBackends.length }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useObservabilityBackendsByKind('metrics'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data?.every((b) => b.kind === 'metrics')).toBe(true);
  });
});

// ============================================================================
// useObservabilityBackendsByType TESTS
// ============================================================================

describe('useObservabilityBackendsByType', () => {
  it('should fetch backends by type', async () => {
    const prometheusBackends = mockBackends.filter((b) => b.type === 'prometheus');

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: prometheusBackends, count: prometheusBackends.length }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useObservabilityBackendsByType('prometheus'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data?.every((b) => b.type === 'prometheus')).toBe(true);
  });
});

// ============================================================================
// useLogsBackends TESTS
// ============================================================================

describe('useLogsBackends', () => {
  it('should fetch only logs backends', async () => {
    const logsBackends = mockBackends.filter((b) => b.kind === 'logs');

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: logsBackends, count: logsBackends.length }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useLogsBackends());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data?.every((b) => b.kind === 'logs')).toBe(true);
  });
});

// ============================================================================
// useMetricsBackends TESTS
// ============================================================================

describe('useMetricsBackends', () => {
  it('should fetch only metrics backends', async () => {
    const metricsBackends = mockBackends.filter((b) => b.kind === 'metrics');

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: metricsBackends, count: metricsBackends.length }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useMetricsBackends());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data?.every((b) => b.kind === 'metrics')).toBe(true);
  });
});

// ============================================================================
// useTracesBackends TESTS
// ============================================================================

describe('useTracesBackends', () => {
  it('should fetch only traces backends', async () => {
    const tracesBackends = mockBackends.filter((b) => b.kind === 'traces');

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: tracesBackends, count: tracesBackends.length }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useTracesBackends());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data?.every((b) => b.kind === 'traces')).toBe(true);
  });
});

// ============================================================================
// useCreateObservabilityBackend TESTS
// ============================================================================

describe('useCreateObservabilityBackend', () => {
  it('should create a new observability backend', async () => {
    const newBackend = createMockObservabilityBackend({ id: 'obs-new' });

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: newBackend }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useCreateObservabilityBackend());

    result.current.mutate({
      tenant_id: 'tenant-1',
      kind: 'metrics',
      type: 'prometheus',
      endpoint: 'https://prometheus.example.com',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(newBackend);
  });

  it('should handle invalid endpoint error', async () => {
    const mockError = { message: 'Invalid endpoint format', code: '23514' };

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: null, error: mockError }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useCreateObservabilityBackend());

    result.current.mutate({
      tenant_id: 'tenant-1',
      kind: 'metrics',
      type: 'prometheus',
      endpoint: 'not-a-valid-url',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ============================================================================
// useUpdateObservabilityBackend TESTS
// ============================================================================

describe('useUpdateObservabilityBackend', () => {
  it('should update an existing backend', async () => {
    const updatedBackend = { ...mockBackends[0], endpoint: 'https://new-endpoint.example.com' };

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: updatedBackend }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useUpdateObservabilityBackend());

    result.current.mutate({
      id: 'obs-1',
      data: { endpoint: 'https://new-endpoint.example.com' },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(updatedBackend);
  });
});

// ============================================================================
// useDeleteObservabilityBackend TESTS
// ============================================================================

describe('useDeleteObservabilityBackend', () => {
  it('should delete an observability backend', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: null }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useDeleteObservabilityBackend());

    result.current.mutate('obs-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('should handle delete with linked entities', async () => {
    const mockError = {
      message: 'Cannot delete backend with existing links',
      code: '23503',
    };

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: null, error: mockError }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useDeleteObservabilityBackend());

    result.current.mutate('obs-1');

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ============================================================================
// TODO: Additional test cases
// ============================================================================
// TODO: Add tests for backend auto-discovery
// TODO: Add tests for backend credential rotation
// TODO: Add tests for backend health check scheduling
// TODO: Add tests for backend failover logic
// TODO: Add tests for multi-backend aggregation
// TODO: Add tests for backend-specific query builders
// TODO: Add integration tests with observability links
// TODO: Add tests for rate limiting and throttling
