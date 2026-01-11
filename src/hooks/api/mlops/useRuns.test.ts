// ============================================================================
// Unit Tests - useRuns Hooks
// MLOps Control Plane v3
// Author: Armand AMOUSSOU
// Date: 2026-01-04
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, createMockRun } from '@/test/utils';
import { supabase } from '@/integrations/supabase/client';
import { createSimpleMockQuery } from '@/test/mocks/supabase-mock';
import {
  useRuns,
  useRun,
  useRunsByExperiment,
  useCreateRun,
  useUpdateRun,
  useStartRun,
  useCompleteRun,
  useFailRun,
  useLogRunMetric,
  useBatchLogRunMetrics,
  useDeleteRun,
  useCompareRuns,
  useBestRun,
} from './useRuns';

// ============================================================================
// MOCK SETUP
// ============================================================================

const mockRuns = [
  createMockRun({ id: 'run-1', name: 'Run 1', status: 'completed' }),
  createMockRun({ id: 'run-2', name: 'Run 2', status: 'running' }),
  createMockRun({ id: 'run-3', name: 'Run 3', status: 'pending' }),
];

const mockRunMetrics = [
  { id: 'metric-1', run_id: 'run-1', key: 'accuracy', value: 0.95, step: 100 },
  { id: 'metric-2', run_id: 'run-1', key: 'loss', value: 0.05, step: 100 },
];

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// useRuns TESTS
// ============================================================================

describe('useRuns', () => {
  it('should fetch runs successfully', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({
        data: mockRuns,
        count: mockRuns.length,
      }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useRuns());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data).toEqual(mockRuns);
    expect(supabase.from).toHaveBeenCalledWith('ml_run');
  });

  it('should handle fetch error', async () => {
    const mockError = { message: 'Database error', code: 'PGRST000' };

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({
        data: null,
        error: mockError,
      }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useRuns());

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });

  it('should filter runs by status', async () => {
    const runningRuns = mockRuns.filter((r) => r.status === 'running');

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({
        data: runningRuns,
        count: runningRuns.length,
      }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() =>
      useRuns({
        filters: [{ column: 'status', operator: 'eq', value: 'running' }],
      })
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data).toEqual(runningRuns);
  });
});

// ============================================================================
// useRun TESTS
// ============================================================================

describe('useRun', () => {
  it('should fetch a single run by ID', async () => {
    const mockRun = mockRuns[0];

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: mockRun }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useRun('run-1'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockRun);
  });

  it('should not fetch when id is undefined', () => {
    const { result } = renderHook(() => useRun(undefined));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFetching).toBe(false);
  });
});

// ============================================================================
// useRunsByExperiment TESTS
// ============================================================================

describe('useRunsByExperiment', () => {
  it('should fetch runs for a specific experiment', async () => {
    const experimentRuns = mockRuns.filter((r) => r.experiment_id === 'exp-123');

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({
        data: experimentRuns,
        count: experimentRuns.length,
      }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useRunsByExperiment('exp-123'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(supabase.from).toHaveBeenCalledWith('ml_run');
  });
});

// ============================================================================
// useCreateRun TESTS
// ============================================================================

describe('useCreateRun', () => {
  it('should create a new run', async () => {
    const newRun = createMockRun({ name: 'New Run' });

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: newRun }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useCreateRun());

    result.current.mutate({
      experiment_id: 'exp-123',
      name: 'New Run',
      status: 'pending',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(newRun);
  });

  it('should handle creation error', async () => {
    const mockError = { message: 'Validation error', code: 'PGRST000' };

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({
        data: null,
        error: mockError,
      }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useCreateRun());

    result.current.mutate({
      experiment_id: 'exp-123',
      name: 'New Run',
      status: 'pending',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ============================================================================
// useUpdateRun TESTS
// ============================================================================

describe('useUpdateRun', () => {
  it('should update an existing run', async () => {
    const updatedRun = { ...mockRuns[0], name: 'Updated Run' };

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: updatedRun }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useUpdateRun());

    result.current.mutate({
      id: 'run-1',
      name: 'Updated Run',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(updatedRun);
  });
});

// ============================================================================
// useStartRun TESTS
// ============================================================================

describe('useStartRun', () => {
  it('should start a pending run', async () => {
    const startedRun = {
      ...mockRuns[2],
      status: 'running',
      start_time: new Date().toISOString(),
    };

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: startedRun }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useStartRun());

    result.current.mutate('run-3');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.status).toBe('running');
  });
});

// ============================================================================
// useCompleteRun TESTS
// ============================================================================

describe('useCompleteRun', () => {
  it('should complete a running run', async () => {
    const completedRun = {
      ...mockRuns[1],
      status: 'completed',
      end_time: new Date().toISOString(),
    };

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: completedRun }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useCompleteRun());

    result.current.mutate('run-2');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.status).toBe('completed');
  });
});

// ============================================================================
// useFailRun TESTS
// ============================================================================

describe('useFailRun', () => {
  it('should mark a run as failed', async () => {
    const failedRun = {
      ...mockRuns[1],
      status: 'failed',
      error_message: 'Out of memory',
    };

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: failedRun }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useFailRun());

    result.current.mutate({ id: 'run-2', errorMessage: 'Out of memory' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.status).toBe('failed');
  });
});

// ============================================================================
// useLogRunMetric TESTS
// ============================================================================

describe('useLogRunMetric', () => {
  it('should log a metric for a run', async () => {
    const newMetric = {
      id: 'metric-new',
      run_id: 'run-1',
      key: 'f1_score',
      value: 0.92,
      step: 100,
    };

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: newMetric }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useLogRunMetric());

    result.current.mutate({
      run_id: 'run-1',
      key: 'f1_score',
      value: 0.92,
      step: 100,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(newMetric);
  });
});

// ============================================================================
// useBatchLogRunMetrics TESTS
// ============================================================================

describe('useBatchLogRunMetrics', () => {
  it('should log multiple metrics at once', async () => {
    const newMetrics = [
      { id: 'metric-1', run_id: 'run-1', key: 'accuracy', value: 0.95, step: 100 },
      { id: 'metric-2', run_id: 'run-1', key: 'loss', value: 0.05, step: 100 },
    ];

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: newMetrics }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useBatchLogRunMetrics());

    result.current.mutate({
      runId: 'run-1',
      metrics: [
        { key: 'accuracy', value: 0.95, step: 100 },
        { key: 'loss', value: 0.05, step: 100 },
      ],
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(2);
  });
});

// ============================================================================
// useDeleteRun TESTS
// ============================================================================

describe('useDeleteRun', () => {
  it('should delete a run', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: null }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useDeleteRun());

    result.current.mutate('run-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('should handle delete error', async () => {
    const mockError = { message: 'Cannot delete', code: 'PGRST000' };

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({
        data: null,
        error: mockError,
      }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useDeleteRun());

    result.current.mutate('run-1');

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ============================================================================
// useCompareRuns TESTS
// ============================================================================

describe('useCompareRuns', () => {
  it('should compare multiple runs', async () => {
    const runsWithMetrics = mockRuns.map((run) => ({
      ...run,
      run_metric: mockRunMetrics.filter((m) => m.run_id === run.id),
    }));

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: runsWithMetrics }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useCompareRuns(['run-1', 'run-2']));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();
  });

  it('should not fetch when run IDs are empty', () => {
    const { result } = renderHook(() => useCompareRuns([]));

    expect(result.current.isLoading).toBe(false);
  });
});

// ============================================================================
// useBestRun TESTS
// ============================================================================

describe('useBestRun', () => {
  it('should find the best run by metric', async () => {
    const bestRun = mockRuns[0];
    const mockMetrics = [
      { id: 'metric-1', run_id: 'run-1', key: 'accuracy', value: 0.95, step: 100 },
    ];

    // Mock returns completed runs first, then metrics
    let callCount = 0;
    vi.mocked(supabase.from).mockImplementation(() => {
      callCount++;
      if (callCount <= 1) {
        // First call - completed runs
        return createSimpleMockQuery({ data: [bestRun] }) as ReturnType<typeof supabase.from>;
      }
      // Second call - metrics
      return createSimpleMockQuery({ data: mockMetrics }) as ReturnType<typeof supabase.from>;
    });

    const { result } = renderHook(() =>
      useBestRun('exp-123', 'accuracy', { maximize: true })
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(bestRun);
  });
});

// ============================================================================
// TODO: Additional test cases
// ============================================================================
// TODO: Add tests for pagination with useInfiniteRuns
// TODO: Add tests for real-time subscriptions
// TODO: Add tests for optimistic updates
// TODO: Add tests for cache invalidation
// TODO: Add integration tests with actual Supabase
