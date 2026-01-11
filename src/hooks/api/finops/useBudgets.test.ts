// ============================================================================
// Unit Tests - useBudgets Hooks
// MLOps Control Plane v3
// Author: Armand AMOUSSOU
// Date: 2026-01-04
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, createMockBudget } from '@/test/utils';
import { supabase } from '@/integrations/supabase/client';
import { createSimpleMockQuery } from '@/test/mocks/supabase-mock';
import {
  useBudgets,
  useBudget,
  useCreateBudget,
  useUpdateBudget,
  useDeleteBudget,
} from './useBudgets';

// ============================================================================
// MOCK SETUP
// ============================================================================

const mockBudgets = [
  createMockBudget({ id: 'budget-1', name: 'ML Compute', amount: 10000 }),
  createMockBudget({ id: 'budget-2', name: 'Storage', amount: 5000 }),
  createMockBudget({ id: 'budget-3', name: 'API Calls', amount: 2000 }),
];

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// useBudgets TESTS
// ============================================================================

describe('useBudgets', () => {
  it('should fetch budgets successfully', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: mockBudgets, count: mockBudgets.length }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useBudgets());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data).toEqual(mockBudgets);
    expect(supabase.from).toHaveBeenCalledWith('budget');
  });

  it('should handle fetch error', async () => {
    const mockError = { message: 'Database error', code: 'PGRST000' };

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: null, error: mockError }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useBudgets());

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});

// ============================================================================
// useBudget TESTS
// ============================================================================

describe('useBudget', () => {
  it('should fetch a single budget by ID', async () => {
    const mockBudget = mockBudgets[0];

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: mockBudget }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useBudget('budget-1'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockBudget);
  });

  it('should not fetch when id is undefined', () => {
    const { result } = renderHook(() => useBudget(undefined));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFetching).toBe(false);
  });
});

// ============================================================================
// useCreateBudget TESTS
// ============================================================================

describe('useCreateBudget', () => {
  it('should create a new budget', async () => {
    const newBudget = createMockBudget({ name: 'New Budget' });

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: newBudget }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useCreateBudget());

    result.current.mutate({
      tenant_id: 'tenant-1',
      scope_type: 'project',
      scope_id: 'project-123',
      name: 'New Budget',
      amount: 5000,
      currency: 'USD',
      period: 'monthly',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(newBudget);
  });

  it('should handle validation error for negative amount', async () => {
    const mockError = { message: 'Amount must be positive', code: '23514' };

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: null, error: mockError }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useCreateBudget());

    result.current.mutate({
      tenant_id: 'tenant-1',
      scope_type: 'project',
      scope_id: 'project-123',
      name: 'Invalid Budget',
      amount: -1000,
      currency: 'USD',
      period: 'monthly',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ============================================================================
// useUpdateBudget TESTS
// ============================================================================

describe('useUpdateBudget', () => {
  it('should update an existing budget', async () => {
    const updatedBudget = { ...mockBudgets[0], amount: 15000 };

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: updatedBudget }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useUpdateBudget());

    result.current.mutate({
      id: 'budget-1',
      data: { amount: 15000 },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.amount).toBe(15000);
  });
});

// ============================================================================
// useDeleteBudget TESTS
// ============================================================================

describe('useDeleteBudget', () => {
  it('should delete a budget', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: null }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useDeleteBudget());

    result.current.mutate('budget-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

// ============================================================================
// TODO: Additional test cases
// ============================================================================
// TODO: Add tests for budget forecasting
// TODO: Add tests for budget rollover functionality
// TODO: Add tests for budget alert threshold configuration
// TODO: Add tests for budget notification delivery
// TODO: Add tests for multi-currency budgets
// TODO: Add tests for budget history/trends
// TODO: Add integration tests with cost records
// TODO: Add tests for budget approval workflows
