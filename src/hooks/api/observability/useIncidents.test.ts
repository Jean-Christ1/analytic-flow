// ============================================================================
// Unit Tests - useIncidents Hooks
// MLOps Control Plane v3
// Author: Armand AMOUSSOU
// Date: 2026-01-04
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, createMockObservabilityIncident } from '@/test/utils';
import { supabase } from '@/integrations/supabase/client';
import { createSimpleMockQuery } from '@/test/mocks/supabase-mock';
import {
  useIncidents,
  useIncident,
  useIncidentsByProject,
  useIncidentsByStatus,
  useIncidentsBySeverity,
  useOpenIncidents,
  useCriticalIncidents,
  useMyIncidents,
  useCreateIncident,
  useUpdateIncident,
  useDeleteIncident,
  useIncidentTimeline,
  useIncidentMetrics,
} from './useIncidents';

// ============================================================================
// MOCK SETUP
// ============================================================================

const mockIncidents = [
  createMockObservabilityIncident({ id: 'inc-1', title: 'High Latency', severity: 'sev0', status: 'open' }),
  createMockObservabilityIncident({ id: 'inc-2', title: 'Memory Spike', severity: 'sev1', status: 'mitigating' }),
  createMockObservabilityIncident({ id: 'inc-3', title: 'Disk Usage', severity: 'sev2', status: 'resolved' }),
  createMockObservabilityIncident({ id: 'inc-4', title: 'API Errors', severity: 'sev1', status: 'open' }),
];

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// useIncidents TESTS
// ============================================================================

describe('useIncidents', () => {
  it('should fetch incidents successfully', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: mockIncidents, count: mockIncidents.length }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useIncidents());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data).toEqual(mockIncidents);
    expect(supabase.from).toHaveBeenCalledWith('incident');
  });

  it('should handle fetch error', async () => {
    const mockError = { message: 'Database error', code: 'PGRST000' };

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: null, error: mockError }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useIncidents());

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});

// ============================================================================
// useIncident TESTS
// ============================================================================

describe('useIncident', () => {
  it('should fetch a single incident by ID', async () => {
    const mockIncident = mockIncidents[0];

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: mockIncident }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useIncident('inc-1'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockIncident);
  });

  it('should not fetch when id is undefined', () => {
    const { result } = renderHook(() => useIncident(undefined));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFetching).toBe(false);
  });
});

// ============================================================================
// useIncidentsByProject TESTS
// ============================================================================

describe('useIncidentsByProject', () => {
  it('should fetch incidents by project', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: mockIncidents, count: mockIncidents.length }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useIncidentsByProject('project-123'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(supabase.from).toHaveBeenCalledWith('incident');
  });
});

// ============================================================================
// useIncidentsByStatus TESTS
// ============================================================================

describe('useIncidentsByStatus', () => {
  it('should fetch incidents by status', async () => {
    const openIncidents = mockIncidents.filter((i) => i.status === 'open');

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: openIncidents, count: openIncidents.length }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useIncidentsByStatus('open'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data?.every((i) => i.status === 'open')).toBe(true);
  });
});

// ============================================================================
// useIncidentsBySeverity TESTS
// ============================================================================

describe('useIncidentsBySeverity', () => {
  it('should fetch incidents by severity', async () => {
    const criticalIncidents = mockIncidents.filter((i) => i.severity === 'sev0');

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: criticalIncidents, count: criticalIncidents.length }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useIncidentsBySeverity('sev0'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data?.every((i) => i.severity === 'sev0')).toBe(true);
  });
});

// ============================================================================
// useOpenIncidents TESTS
// ============================================================================

describe('useOpenIncidents', () => {
  it('should fetch only open incidents', async () => {
    const openIncidents = mockIncidents.filter((i) => ['open', 'mitigating'].includes(i.status));

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: openIncidents, count: openIncidents.length }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useOpenIncidents());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data?.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// useCriticalIncidents TESTS
// ============================================================================

describe('useCriticalIncidents', () => {
  it('should fetch only critical open incidents', async () => {
    const criticalIncidents = mockIncidents.filter(
      (i) => ['sev0', 'sev1'].includes(i.severity) && ['open', 'mitigating'].includes(i.status)
    );

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: criticalIncidents, count: criticalIncidents.length }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useCriticalIncidents());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

// ============================================================================
// useMyIncidents TESTS
// ============================================================================

describe('useMyIncidents', () => {
  it('should fetch incidents assigned to current user', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: mockIncidents, count: mockIncidents.length }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useMyIncidents('user-123'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

// ============================================================================
// useCreateIncident TESTS
// ============================================================================

describe('useCreateIncident', () => {
  it('should create a new incident', async () => {
    const newIncident = createMockObservabilityIncident({ title: 'New Incident' });

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: newIncident }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useCreateIncident());

    result.current.mutate({
      tenant_id: 'tenant-1',
      project_id: 'project-123',
      title: 'New Incident',
      description: 'Test description',
      severity: 'sev1',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(newIncident);
  });
});

// ============================================================================
// useUpdateIncident TESTS
// ============================================================================

describe('useUpdateIncident', () => {
  it('should update an existing incident', async () => {
    const updatedIncident = { ...mockIncidents[0], title: 'Updated Title' };

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: updatedIncident }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useUpdateIncident());

    result.current.mutate({
      id: 'inc-1',
      data: { title: 'Updated Title' },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(updatedIncident);
  });
});

// ============================================================================
// useDeleteIncident TESTS
// ============================================================================

describe('useDeleteIncident', () => {
  it('should delete an incident', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: null }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useDeleteIncident());

    result.current.mutate('inc-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

// ============================================================================
// useIncidentTimeline TESTS
// ============================================================================

describe('useIncidentTimeline', () => {
  it('should fetch incident timeline', async () => {
    const mockTimeline = [
      { id: 'tl-1', incident_id: 'inc-1', message: 'Created', created_at: new Date().toISOString() },
      { id: 'tl-2', incident_id: 'inc-1', message: 'Investigating', created_at: new Date().toISOString() },
      { id: 'tl-3', incident_id: 'inc-1', message: 'Resolved', created_at: new Date().toISOString() },
    ];

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: mockTimeline }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useIncidentTimeline('inc-1'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(3);
  });
});

// ============================================================================
// useIncidentMetrics TESTS
// ============================================================================

describe('useIncidentMetrics', () => {
  it('should fetch incident metrics', async () => {
    const mockIncidentsData = mockIncidents.map((i) => ({
      severity: i.severity,
      status: i.status,
      detected_at: i.detected_at,
      declared_at: i.declared_at,
      resolved_at: i.resolved_at,
      project_id: i.project_id,
    }));

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: mockIncidentsData }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useIncidentMetrics());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();
  });
});

// ============================================================================
// TODO: Additional test cases
// ============================================================================
// TODO: Add tests for incident escalation
// TODO: Add tests for incident assignment
// TODO: Add tests for incident correlation
// TODO: Add tests for incident deduplication
// TODO: Add tests for incident notification delivery
// TODO: Add tests for incident SLA tracking
// TODO: Add tests for incident post-mortem generation
// TODO: Add integration tests with observability backends
