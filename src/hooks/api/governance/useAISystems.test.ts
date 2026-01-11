// ============================================================================
// Unit Tests - useAISystems Hooks
// MLOps Control Plane v3
// Author: Armand AMOUSSOU
// Date: 2026-01-04
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, createMockAISystem } from '@/test/utils';
import { supabase } from '@/integrations/supabase/client';
import { createSimpleMockQuery } from '@/test/mocks/supabase-mock';
import {
  useAISystems,
  useAISystem,
  useAISystemsByRiskClass,
  useHighRiskAISystems,
  useCreateAISystem,
  useUpdateAISystem,
  useDeleteAISystem,
} from './useAISystems';

// ============================================================================
// MOCK SETUP
// ============================================================================

const mockAISystems = [
  createMockAISystem({ id: 'ai-1', name: 'AI System 1', risk_class: 'high' }),
  createMockAISystem({ id: 'ai-2', name: 'AI System 2', risk_class: 'limited' }),
  createMockAISystem({ id: 'ai-3', name: 'AI System 3', risk_class: 'high', status: 'deprecated' }),
];

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// useAISystems TESTS
// ============================================================================

describe('useAISystems', () => {
  it('should fetch AI systems successfully', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: mockAISystems, count: mockAISystems.length }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useAISystems());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data).toEqual(mockAISystems);
    expect(supabase.from).toHaveBeenCalledWith('ai_system');
  });

  it('should handle fetch error', async () => {
    const mockError = { message: 'Database error', code: 'PGRST000' };

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: null, error: mockError }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useAISystems());

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });

  it('should filter AI systems by status', async () => {
    const activeAISystems = mockAISystems.filter((s) => s.status === 'active');

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: activeAISystems, count: activeAISystems.length }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() =>
      useAISystems({
        filters: [{ column: 'status', operator: 'eq', value: 'active' }],
      })
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data).toHaveLength(2);
  });
});

// ============================================================================
// useAISystem TESTS
// ============================================================================

describe('useAISystem', () => {
  it('should fetch a single AI system by ID', async () => {
    const mockAISystem = mockAISystems[0];

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: mockAISystem }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useAISystem('ai-1'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockAISystem);
  });

  it('should not fetch when id is undefined', () => {
    const { result } = renderHook(() => useAISystem(undefined));

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

    const { result } = renderHook(() => useAISystem('non-existent'));

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ============================================================================
// useAISystemsByRiskClass TESTS
// ============================================================================

describe('useAISystemsByRiskClass', () => {
  it('should fetch AI systems by risk class', async () => {
    const highRiskSystems = mockAISystems.filter((s) => s.risk_class === 'high');

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: highRiskSystems, count: highRiskSystems.length }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useAISystemsByRiskClass('high'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data).toHaveLength(2);
  });
});

// ============================================================================
// useHighRiskAISystems TESTS
// ============================================================================

describe('useHighRiskAISystems', () => {
  it('should fetch only high-risk AI systems', async () => {
    const highRiskSystems = mockAISystems.filter((s) => s.risk_class === 'high');

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: highRiskSystems, count: highRiskSystems.length }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useHighRiskAISystems());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data?.every((s) => s.risk_class === 'high')).toBe(true);
  });
});

// ============================================================================
// useCreateAISystem TESTS
// ============================================================================

describe('useCreateAISystem', () => {
  it('should create a new AI system', async () => {
    const newAISystem = createMockAISystem({ name: 'New AI System' });

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: newAISystem }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useCreateAISystem());

    result.current.mutate({
      tenant_id: 'tenant-1',
      project_id: 'project-123',
      name: 'New AI System',
      description: 'Test description',
      risk_class: 'high',
      intended_purpose: 'Testing',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(newAISystem);
  });

  it('should handle validation error', async () => {
    const mockError = { message: 'Name is required', code: '23502' };

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: null, error: mockError }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useCreateAISystem());

    result.current.mutate({
      tenant_id: 'tenant-1',
      project_id: 'project-123',
      name: '',
      risk_class: 'high',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ============================================================================
// useUpdateAISystem TESTS
// ============================================================================

describe('useUpdateAISystem', () => {
  it('should update an existing AI system', async () => {
    const updatedAISystem = { ...mockAISystems[0], name: 'Updated AI System' };

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: updatedAISystem }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useUpdateAISystem());

    result.current.mutate({
      id: 'ai-1',
      data: { name: 'Updated AI System' },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(updatedAISystem);
  });
});

// ============================================================================
// useDeleteAISystem TESTS
// ============================================================================

describe('useDeleteAISystem', () => {
  it('should delete an AI system', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: null }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useDeleteAISystem());

    result.current.mutate('ai-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('should handle delete with foreign key constraint', async () => {
    const mockError = {
      message: 'Cannot delete AI system with existing assessments',
      code: '23503',
    };

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: null, error: mockError }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useDeleteAISystem());

    result.current.mutate('ai-1');

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ============================================================================
// TODO: Additional test cases
// ============================================================================
// TODO: Add tests for AI system search functionality
// TODO: Add tests for AI system versioning
// TODO: Add tests for AI system cloning
// TODO: Add tests for bulk operations
// TODO: Add tests for AI system export/import
// TODO: Add integration tests with model cards
// TODO: Add integration tests with risk assessments
