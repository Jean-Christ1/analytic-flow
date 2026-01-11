// ============================================================================
// Unit Tests - useBillingAccounts Hooks
// MLOps Control Plane v3
// Author: Armand AMOUSSOU
// Date: 2026-01-04
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, createMockBillingAccount } from '@/test/utils';
import { supabase } from '@/integrations/supabase/client';
import { createSimpleMockQuery } from '@/test/mocks/supabase-mock';
import {
  useBillingAccounts,
  useBillingAccount,
  useBillingAccountsByProvider,
  useActiveBillingAccounts,
  useCreateBillingAccount,
  useUpdateBillingAccount,
  useDeleteBillingAccount,
  useSyncBillingAccount,
  useBillingAccountSyncStatus,
} from './useBillingAccounts';

// ============================================================================
// MOCK SETUP
// ============================================================================

const mockBillingAccounts = [
  createMockBillingAccount({ id: 'billing-1', provider: 'aws', name: 'Production AWS' }),
  createMockBillingAccount({ id: 'billing-2', provider: 'gcp', name: 'Production GCP' }),
  createMockBillingAccount({ id: 'billing-3', provider: 'azure', name: 'Dev Azure', status: 'suspended' }),
];

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// useBillingAccounts TESTS
// ============================================================================

describe('useBillingAccounts', () => {
  it('should fetch billing accounts successfully', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: mockBillingAccounts, count: mockBillingAccounts.length }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useBillingAccounts());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data).toEqual(mockBillingAccounts);
    expect(supabase.from).toHaveBeenCalledWith('billing_account');
  });

  it('should handle fetch error', async () => {
    const mockError = { message: 'Database error', code: 'PGRST000' };

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: null, error: mockError }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useBillingAccounts());

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});

// ============================================================================
// useBillingAccount TESTS
// ============================================================================

describe('useBillingAccount', () => {
  it('should fetch a single billing account by ID', async () => {
    const mockAccount = mockBillingAccounts[0];

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: mockAccount }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useBillingAccount('billing-1'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockAccount);
  });

  it('should not fetch when id is undefined', () => {
    const { result } = renderHook(() => useBillingAccount(undefined));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFetching).toBe(false);
  });
});

// ============================================================================
// useBillingAccountsByProvider TESTS
// ============================================================================

describe('useBillingAccountsByProvider', () => {
  it('should fetch billing accounts by provider', async () => {
    const awsAccounts = mockBillingAccounts.filter((a) => a.provider === 'aws');

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: awsAccounts, count: awsAccounts.length }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useBillingAccountsByProvider('aws'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data?.every((a) => a.provider === 'aws')).toBe(true);
  });
});

// ============================================================================
// useActiveBillingAccounts TESTS
// ============================================================================

describe('useActiveBillingAccounts', () => {
  it('should fetch only active billing accounts', async () => {
    const activeAccounts = mockBillingAccounts.filter((a) => a.status === 'active');

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: activeAccounts, count: activeAccounts.length }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useActiveBillingAccounts());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data?.every((a) => a.status === 'active')).toBe(true);
  });
});

// ============================================================================
// useCreateBillingAccount TESTS
// ============================================================================

describe('useCreateBillingAccount', () => {
  it('should create a new billing account', async () => {
    const newAccount = createMockBillingAccount({ name: 'New Account' });

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: newAccount }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useCreateBillingAccount());

    result.current.mutate({
      tenant_id: 'tenant-1',
      provider: 'aws',
      name: 'New Account',
      external_id: 'aws-new-123',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(newAccount);
  });

  it('should handle duplicate account error', async () => {
    const mockError = { message: 'Account already exists', code: '23505' };

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: null, error: mockError }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useCreateBillingAccount());

    result.current.mutate({
      tenant_id: 'tenant-1',
      provider: 'aws',
      name: 'Duplicate Account',
      external_id: 'aws-123456789',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ============================================================================
// useUpdateBillingAccount TESTS
// ============================================================================

describe('useUpdateBillingAccount', () => {
  it('should update an existing billing account', async () => {
    const updatedAccount = { ...mockBillingAccounts[0], name: 'Updated Account' };

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: updatedAccount }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useUpdateBillingAccount());

    result.current.mutate({
      id: 'billing-1',
      data: { name: 'Updated Account' },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(updatedAccount);
  });
});

// ============================================================================
// useDeleteBillingAccount TESTS
// ============================================================================

describe('useDeleteBillingAccount', () => {
  it('should delete a billing account', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: null }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useDeleteBillingAccount());

    result.current.mutate('billing-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('should handle delete with associated cost records', async () => {
    const mockError = {
      message: 'Cannot delete billing account with existing cost records',
      code: '23503',
    };

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: null, error: mockError }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useDeleteBillingAccount());

    result.current.mutate('billing-1');

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ============================================================================
// useSyncBillingAccount TESTS
// ============================================================================

describe('useSyncBillingAccount', () => {
  it('should trigger sync for a billing account', async () => {
    const syncedAccount = { ...mockBillingAccounts[0], updated_at: new Date().toISOString() };

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: syncedAccount }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useSyncBillingAccount());

    result.current.mutate('billing-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

// ============================================================================
// useBillingAccountSyncStatus TESTS
// ============================================================================

describe('useBillingAccountSyncStatus', () => {
  it('should fetch sync status for a billing account', async () => {
    const mockAccount = {
      id: 'billing-1',
      sync_status: 'synced',
      last_sync_at: new Date().toISOString(),
      config: null,
    };

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: mockAccount, count: 1500 }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useBillingAccountSyncStatus('billing-1'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

// ============================================================================
// TODO: Additional test cases
// ============================================================================
// TODO: Add tests for billing account credentials management
// TODO: Add tests for multi-account aggregation
// TODO: Add tests for provider-specific validations (AWS, GCP, Azure)
// TODO: Add tests for sync conflict resolution
// TODO: Add tests for sync retry logic
// TODO: Add integration tests with cost records
// TODO: Add tests for rate limiting during sync
