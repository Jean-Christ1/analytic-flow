// ============================================================================
// Unit Tests - useExperiments Hooks
// MLOps Control Plane v3
// Author: Armand AMOUSSOU
// Date: 2026-01-04
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, createMockExperiment } from '@/test/utils';
import { supabase } from '@/integrations/supabase/client';
import { createSimpleMockQuery } from '@/test/mocks/supabase-mock';
import {
  useExperiments,
  useExperiment,
  useExperimentsByProject,
  useCreateExperiment,
  useUpdateExperiment,
  useDeleteExperiment,
  useArchiveExperiment,
  useRestoreExperiment,
  useExperimentStats,
} from './useExperiments';

// ============================================================================
// MOCK SETUP
// ============================================================================

const mockExperiments = [
  createMockExperiment({ id: 'exp-1', name: 'Experiment 1', status: 'active' }),
  createMockExperiment({ id: 'exp-2', name: 'Experiment 2', status: 'active' }),
  createMockExperiment({ id: 'exp-3', name: 'Experiment 3', status: 'archived' }),
];

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// useExperiments TESTS
// ============================================================================

describe('useExperiments', () => {
  it('should fetch experiments successfully', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({
        data: mockExperiments,
        count: mockExperiments.length,
      }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useExperiments());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data).toEqual(mockExperiments);
    expect(supabase.from).toHaveBeenCalledWith('experiment');
  });

  it('should handle fetch error', async () => {
    const mockError = { message: 'Database error', code: 'PGRST000' };

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({
        data: null,
        error: mockError,
      }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useExperiments());

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });

  it('should filter experiments by status', async () => {
    const activeExperiments = mockExperiments.filter((e) => e.status === 'active');

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({
        data: activeExperiments,
        count: activeExperiments.length,
      }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useExperiments({ status: 'active' }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data).toHaveLength(2);
  });
});

// ============================================================================
// useExperiment TESTS
// ============================================================================

describe('useExperiment', () => {
  it('should fetch a single experiment by ID', async () => {
    const mockExperiment = mockExperiments[0];

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: mockExperiment }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useExperiment('exp-1'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockExperiment);
  });

  it('should not fetch when id is undefined', () => {
    const { result } = renderHook(() => useExperiment(undefined));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFetching).toBe(false);
  });

  it('should handle not found error', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({
        data: null,
        error: { message: 'Row not found', code: 'PGRST116' },
      }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useExperiment('non-existent'));

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ============================================================================
// useExperimentsByProject TESTS
// ============================================================================

describe('useExperimentsByProject', () => {
  it('should fetch experiments for a specific project', async () => {
    const projectExperiments = mockExperiments.filter(
      (e) => e.project_id === 'project-123'
    );

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({
        data: projectExperiments,
        count: projectExperiments.length,
      }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useExperimentsByProject('project-123'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(supabase.from).toHaveBeenCalledWith('experiment');
  });
});

// ============================================================================
// useCreateExperiment TESTS
// ============================================================================

describe('useCreateExperiment', () => {
  it('should create a new experiment', async () => {
    const newExperiment = createMockExperiment({ name: 'New Experiment' });

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: newExperiment }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useCreateExperiment());

    result.current.mutate({
      project_id: 'project-123',
      name: 'New Experiment',
      description: 'Test description',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(newExperiment);
  });

  it('should handle validation error', async () => {
    const mockError = { message: 'Name is required', code: '23502' };

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({
        data: null,
        error: mockError,
      }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useCreateExperiment());

    result.current.mutate({
      project_id: 'project-123',
      name: '',
      description: 'Test',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ============================================================================
// useUpdateExperiment TESTS
// ============================================================================

describe('useUpdateExperiment', () => {
  it('should update an existing experiment', async () => {
    const updatedExperiment = { ...mockExperiments[0], name: 'Updated Experiment' };

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: updatedExperiment }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useUpdateExperiment());

    result.current.mutate({
      id: 'exp-1',
      name: 'Updated Experiment',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(updatedExperiment);
  });
});

// ============================================================================
// useDeleteExperiment TESTS
// ============================================================================

describe('useDeleteExperiment', () => {
  it('should delete an experiment', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: null }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useDeleteExperiment());

    result.current.mutate('exp-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('should handle delete with foreign key constraint', async () => {
    const mockError = {
      message: 'Cannot delete experiment with existing runs',
      code: '23503',
    };

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({
        data: null,
        error: mockError,
      }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useDeleteExperiment());

    result.current.mutate('exp-1');

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ============================================================================
// useArchiveExperiment TESTS
// ============================================================================

describe('useArchiveExperiment', () => {
  it('should archive an experiment', async () => {
    const archivedExperiment = { ...mockExperiments[0], status: 'archived' };

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: archivedExperiment }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useArchiveExperiment());

    result.current.mutate('exp-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.status).toBe('archived');
  });
});

// ============================================================================
// useRestoreExperiment TESTS
// ============================================================================

describe('useRestoreExperiment', () => {
  it('should restore an archived experiment', async () => {
    const restoredExperiment = { ...mockExperiments[2], status: 'active' };

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: restoredExperiment }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useRestoreExperiment());

    result.current.mutate('exp-3');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.status).toBe('active');
  });
});

// ============================================================================
// useExperimentStats TESTS
// ============================================================================

describe('useExperimentStats', () => {
  it('should fetch experiment statistics', async () => {
    // Mock runs data - the hook calculates stats from runs, not receives stats directly
    const mockRuns = [
      { id: 'run-1', status: 'completed', duration_seconds: 3600 },
      { id: 'run-2', status: 'completed', duration_seconds: 4200 },
      { id: 'run-3', status: 'failed', duration_seconds: 1800 },
      { id: 'run-4', status: 'running', duration_seconds: null },
    ];

    // Mock metrics data for the second query
    const mockMetrics = [{ key: 'accuracy', value: 0.95 }];

    // Mock both queries: first for ml_run, then for run_metric
    vi.mocked(supabase.from)
      .mockReturnValueOnce(
        createSimpleMockQuery({ data: mockRuns }) as ReturnType<typeof supabase.from>
      )
      .mockReturnValueOnce(
        createSimpleMockQuery({ data: mockMetrics }) as ReturnType<typeof supabase.from>
      );

    const { result } = renderHook(() => useExperimentStats('exp-1'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.totalRuns).toBe(4);
    expect(result.current.data?.completedRuns).toBe(2);
    expect(result.current.data?.failedRuns).toBe(1);
  });
});

// ============================================================================
// TODO: Additional test cases
// ============================================================================
// TODO: Add tests for experiment search functionality
// TODO: Add tests for experiment tagging
// TODO: Add tests for experiment comparison
// TODO: Add tests for experiment cloning
// TODO: Add performance tests for large experiment lists
