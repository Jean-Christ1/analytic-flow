// ============================================================================
// Unit Tests - useModels Hooks
// MLOps Control Plane v3
// Author: Armand AMOUSSOU
// Date: 2026-01-04
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, createMockModel } from '@/test/utils';
import { supabase } from '@/integrations/supabase/client';
import { createSimpleMockQuery } from '@/test/mocks/supabase-mock';
import {
  useModels,
  useModel,
  useModelsByProject,
  useModelVersions,
  useModelVersion,
  useCreateModel,
  useUpdateModel,
  useDeleteModel,
  useCreateModelVersion,
  usePromoteModelVersion,
  useModelDeployments,
  useCreateModelDeployment,
  useUpdateModelDeployment,
  useDeleteModelDeployment,
} from './useModels';

// ============================================================================
// MOCK SETUP
// ============================================================================

const mockModels = [
  createMockModel({ id: 'model-1', name: 'Classification Model' }),
  createMockModel({ id: 'model-2', name: 'Regression Model' }),
  createMockModel({ id: 'model-3', name: 'NLP Model' }),
];

const mockModelVersions = [
  {
    id: 'version-1',
    model_id: 'model-1',
    version: '1.0.0',
    stage: 'production',
    run_id: 'run-1',
    metrics: { accuracy: 0.95 },
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'version-2',
    model_id: 'model-1',
    version: '1.1.0',
    stage: 'staging',
    run_id: 'run-2',
    metrics: { accuracy: 0.97 },
    created_at: '2026-01-02T00:00:00Z',
  },
];

const mockDeployments = [
  {
    id: 'deploy-1',
    model_version_id: 'version-1',
    name: 'Production Deployment',
    environment: 'production',
    status: 'active',
    endpoint_url: 'https://api.example.com/model/v1',
    replicas: 3,
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// useModels TESTS
// ============================================================================

describe('useModels', () => {
  it('should fetch models successfully', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({
        data: mockModels,
        count: mockModels.length,
      }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useModels());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data).toEqual(mockModels);
    expect(supabase.from).toHaveBeenCalledWith('model');
  });

  it('should handle fetch error', async () => {
    const mockError = { message: 'Database error', code: 'PGRST000' };

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({
        data: null,
        error: mockError,
      }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useModels());

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ============================================================================
// useModel TESTS
// ============================================================================

describe('useModel', () => {
  it('should fetch a single model by ID', async () => {
    const mockModel = mockModels[0];

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: mockModel }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useModel('model-1'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockModel);
  });

  it('should not fetch when id is undefined', () => {
    const { result } = renderHook(() => useModel(undefined));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFetching).toBe(false);
  });
});

// ============================================================================
// useModelsByProject TESTS
// ============================================================================

describe('useModelsByProject', () => {
  it('should fetch models for a specific project', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({
        data: mockModels,
        count: mockModels.length,
      }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useModelsByProject('project-123'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(supabase.from).toHaveBeenCalledWith('model');
  });
});

// ============================================================================
// useModelVersions TESTS
// ============================================================================

describe('useModelVersions', () => {
  it('should fetch versions for a specific model', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({
        data: mockModelVersions,
        count: mockModelVersions.length,
      }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useModelVersions('model-1'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data).toHaveLength(2);
  });
});

// ============================================================================
// useModelVersion TESTS
// ============================================================================

describe('useModelVersion', () => {
  it('should fetch a single model version', async () => {
    const mockVersion = mockModelVersions[0];

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: mockVersion }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useModelVersion('version-1'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockVersion);
  });
});

// ============================================================================
// useCreateModel TESTS
// ============================================================================

describe('useCreateModel', () => {
  it('should create a new model', async () => {
    const newModel = createMockModel({ name: 'New Model' });

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: newModel }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useCreateModel());

    result.current.mutate({
      project_id: 'project-123',
      name: 'New Model',
      description: 'A new ML model',
      model_type: 'classification',
      framework: 'pytorch',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(newModel);
  });
});

// ============================================================================
// useUpdateModel TESTS
// ============================================================================

describe('useUpdateModel', () => {
  it('should update an existing model', async () => {
    const updatedModel = { ...mockModels[0], name: 'Updated Model' };

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: updatedModel }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useUpdateModel());

    result.current.mutate({
      id: 'model-1',
      name: 'Updated Model',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.name).toBe('Updated Model');
  });
});

// ============================================================================
// useDeleteModel TESTS
// ============================================================================

describe('useDeleteModel', () => {
  it('should delete a model', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: null }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useDeleteModel());

    result.current.mutate('model-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

// ============================================================================
// useCreateModelVersion TESTS
// ============================================================================

describe('useCreateModelVersion', () => {
  it('should create a new model version', async () => {
    const newVersion = {
      id: 'version-new',
      model_id: 'model-1',
      version: '2.0.0',
      stage: 'none',
      run_id: 'run-3',
      metrics: { accuracy: 0.99 },
    };

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: newVersion }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useCreateModelVersion());

    result.current.mutate({
      model_id: 'model-1',
      version: '2.0.0',
      run_id: 'run-3',
      metrics: { accuracy: 0.99 },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(newVersion);
  });
});

// ============================================================================
// usePromoteModelVersion TESTS
// ============================================================================

describe('usePromoteModelVersion', () => {
  it('should promote a model version to production', async () => {
    const promotedVersion = { ...mockModelVersions[1], stage: 'production' };

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: promotedVersion }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => usePromoteModelVersion());

    result.current.mutate({
      versionId: 'version-2',
      stage: 'production',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.stage).toBe('production');
  });
});

// ============================================================================
// useModelDeployments TESTS
// ============================================================================

describe('useModelDeployments', () => {
  it('should fetch deployments for a model', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({
        data: mockDeployments,
        count: mockDeployments.length,
      }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useModelDeployments('model-1'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

// ============================================================================
// useCreateModelDeployment TESTS
// ============================================================================

describe('useCreateModelDeployment', () => {
  it('should create a new deployment', async () => {
    const newDeployment = {
      id: 'deploy-new',
      model_version_id: 'version-2',
      name: 'New Deployment',
      environment: 'staging',
      status: 'deploying',
      replicas: 2,
    };

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: newDeployment }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useCreateModelDeployment());

    result.current.mutate({
      model_version_id: 'version-2',
      name: 'New Deployment',
      environment: 'staging',
      replicas: 2,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(newDeployment);
  });
});

// ============================================================================
// useUpdateModelDeployment TESTS
// ============================================================================

describe('useUpdateModelDeployment', () => {
  it('should update a deployment', async () => {
    const updatedDeployment = { ...mockDeployments[0], replicas: 5 };

    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: updatedDeployment }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useUpdateModelDeployment());

    result.current.mutate({
      id: 'deploy-1',
      replicas: 5,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.replicas).toBe(5);
  });
});

// ============================================================================
// useDeleteModelDeployment TESTS
// ============================================================================

describe('useDeleteModelDeployment', () => {
  it('should delete a deployment', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createSimpleMockQuery({ data: null }) as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useDeleteModelDeployment());

    result.current.mutate('deploy-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

// ============================================================================
// TODO: Additional test cases
// ============================================================================
// TODO: Add tests for model version comparison
// TODO: Add tests for deployment scaling
// TODO: Add tests for deployment rollback
// TODO: Add tests for model lineage tracking
// TODO: Add integration tests for end-to-end model lifecycle
