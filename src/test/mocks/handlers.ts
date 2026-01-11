// ============================================================================
// MSW Request Handlers
// MLOps Control Plane v3
// Author: Armand AMOUSSOU
// Date: 2026-01-04
// ============================================================================

import { http, HttpResponse } from 'msw';

// ============================================================================
// MOCK DATA
// ============================================================================

export const mockTenant = {
  id: 'tenant-123',
  name: 'Test Organization',
  slug: 'test-org',
  plan: 'enterprise',
  settings: {},
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

export const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  full_name: 'Test User',
  avatar_url: null,
  tenant_id: 'tenant-123',
  role: 'admin',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

export const mockProject = {
  id: 'project-123',
  tenant_id: 'tenant-123',
  name: 'ML Project',
  description: 'Test ML project',
  status: 'active',
  created_by: 'user-123',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

export const mockExperiment = {
  id: 'exp-123',
  tenant_id: 'tenant-123',
  project_id: 'project-123',
  name: 'Classification Experiment',
  description: 'Testing classification models',
  status: 'active',
  tags: ['classification', 'test'],
  created_by: 'user-123',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

export const mockRun = {
  id: 'run-123',
  tenant_id: 'tenant-123',
  experiment_id: 'exp-123',
  name: 'Run 1',
  status: 'completed',
  source_type: 'notebook',
  start_time: '2026-01-01T00:00:00Z',
  end_time: '2026-01-01T01:00:00Z',
  duration_seconds: 3600,
  user_id: 'user-123',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T01:00:00Z',
};

export const mockRunMetric = {
  id: 'metric-123',
  run_id: 'run-123',
  key: 'accuracy',
  value: 0.95,
  step: 100,
  timestamp: '2026-01-01T01:00:00Z',
};

export const mockArtifact = {
  id: 'artifact-123',
  tenant_id: 'tenant-123',
  run_id: 'run-123',
  name: 'model.pkl',
  artifact_type: 'model',
  path: '/artifacts/model.pkl',
  size_bytes: 1024000,
  checksum: 'abc123',
  storage_type: 's3',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

export const mockModel = {
  id: 'model-123',
  tenant_id: 'tenant-123',
  project_id: 'project-123',
  name: 'Classifier Model',
  description: 'Classification model',
  model_type: 'classification',
  framework: 'scikit-learn',
  created_by: 'user-123',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

export const mockModelVersion = {
  id: 'version-123',
  model_id: 'model-123',
  version: '1.0.0',
  stage: 'production',
  run_id: 'run-123',
  artifact_id: 'artifact-123',
  metrics: { accuracy: 0.95, f1_score: 0.93 },
  created_by: 'user-123',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

export const mockWorkspace = {
  id: 'workspace-123',
  tenant_id: 'tenant-123',
  project_id: 'project-123',
  user_id: 'user-123',
  name: 'Dev Workspace',
  workspace_type: 'jupyter',
  status: 'running',
  endpoint_url: 'https://workspace-123.example.com',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

// ============================================================================
// SUPABASE API HANDLERS
// ============================================================================

const SUPABASE_URL = 'https://test.supabase.co';

export const handlers = [
  // Auth handlers
  http.post(`${SUPABASE_URL}/auth/v1/token`, () => {
    return HttpResponse.json({
      access_token: 'test-access-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'test-refresh-token',
      user: mockUser,
    });
  }),

  http.get(`${SUPABASE_URL}/auth/v1/user`, () => {
    return HttpResponse.json(mockUser);
  }),

  // Tenant handlers
  http.get(`${SUPABASE_URL}/rest/v1/tenant`, () => {
    return HttpResponse.json([mockTenant]);
  }),

  http.get(`${SUPABASE_URL}/rest/v1/tenant/:id`, () => {
    return HttpResponse.json(mockTenant);
  }),

  // Project handlers
  http.get(`${SUPABASE_URL}/rest/v1/project`, () => {
    return HttpResponse.json([mockProject]);
  }),

  http.get(`${SUPABASE_URL}/rest/v1/project/:id`, () => {
    return HttpResponse.json(mockProject);
  }),

  http.post(`${SUPABASE_URL}/rest/v1/project`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      ...mockProject,
      ...(body as object),
      id: 'new-project-123',
    });
  }),

  // Experiment handlers
  http.get(`${SUPABASE_URL}/rest/v1/experiment`, () => {
    return HttpResponse.json([mockExperiment]);
  }),

  http.get(`${SUPABASE_URL}/rest/v1/experiment/:id`, () => {
    return HttpResponse.json(mockExperiment);
  }),

  http.post(`${SUPABASE_URL}/rest/v1/experiment`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      ...mockExperiment,
      ...(body as object),
      id: 'new-exp-123',
    });
  }),

  // Run handlers
  http.get(`${SUPABASE_URL}/rest/v1/run`, () => {
    return HttpResponse.json([mockRun]);
  }),

  http.get(`${SUPABASE_URL}/rest/v1/run/:id`, () => {
    return HttpResponse.json(mockRun);
  }),

  http.post(`${SUPABASE_URL}/rest/v1/run`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      ...mockRun,
      ...(body as object),
      id: 'new-run-123',
    });
  }),

  http.patch(`${SUPABASE_URL}/rest/v1/run/:id`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      ...mockRun,
      ...(body as object),
    });
  }),

  // Run metric handlers
  http.get(`${SUPABASE_URL}/rest/v1/run_metric`, () => {
    return HttpResponse.json([mockRunMetric]);
  }),

  http.post(`${SUPABASE_URL}/rest/v1/run_metric`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      ...mockRunMetric,
      ...(body as object),
      id: 'new-metric-123',
    });
  }),

  // Artifact handlers
  http.get(`${SUPABASE_URL}/rest/v1/artifact`, () => {
    return HttpResponse.json([mockArtifact]);
  }),

  http.get(`${SUPABASE_URL}/rest/v1/artifact/:id`, () => {
    return HttpResponse.json(mockArtifact);
  }),

  http.post(`${SUPABASE_URL}/rest/v1/artifact`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      ...mockArtifact,
      ...(body as object),
      id: 'new-artifact-123',
    });
  }),

  // Model handlers
  http.get(`${SUPABASE_URL}/rest/v1/model`, () => {
    return HttpResponse.json([mockModel]);
  }),

  http.get(`${SUPABASE_URL}/rest/v1/model/:id`, () => {
    return HttpResponse.json(mockModel);
  }),

  http.post(`${SUPABASE_URL}/rest/v1/model`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      ...mockModel,
      ...(body as object),
      id: 'new-model-123',
    });
  }),

  // Model version handlers
  http.get(`${SUPABASE_URL}/rest/v1/model_version`, () => {
    return HttpResponse.json([mockModelVersion]);
  }),

  http.get(`${SUPABASE_URL}/rest/v1/model_version/:id`, () => {
    return HttpResponse.json(mockModelVersion);
  }),

  http.post(`${SUPABASE_URL}/rest/v1/model_version`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      ...mockModelVersion,
      ...(body as object),
      id: 'new-version-123',
    });
  }),

  // Workspace handlers
  http.get(`${SUPABASE_URL}/rest/v1/workspace`, () => {
    return HttpResponse.json([mockWorkspace]);
  }),

  http.get(`${SUPABASE_URL}/rest/v1/workspace/:id`, () => {
    return HttpResponse.json(mockWorkspace);
  }),

  http.post(`${SUPABASE_URL}/rest/v1/workspace`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      ...mockWorkspace,
      ...(body as object),
      id: 'new-workspace-123',
    });
  }),

  http.patch(`${SUPABASE_URL}/rest/v1/workspace/:id`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      ...mockWorkspace,
      ...(body as object),
    });
  }),

  // Notification handlers
  http.get(`${SUPABASE_URL}/rest/v1/notification`, () => {
    return HttpResponse.json([]);
  }),

  http.post(`${SUPABASE_URL}/rest/v1/notification`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      ...(body as object),
      id: 'new-notification-123',
      created_at: new Date().toISOString(),
    });
  }),
];

// ============================================================================
// TODO: Additional handlers to implement
// ============================================================================
// TODO: Add error scenario handlers
// TODO: Add pagination handlers
// TODO: Add real-time subscription mock handlers
// TODO: Add storage upload/download handlers
// TODO: Add RPC function handlers
