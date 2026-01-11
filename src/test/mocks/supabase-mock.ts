// ============================================================================
// Supabase Mock Factory
// MLOps Control Plane v3
// Author: Armand AMOUSSOU
// Date: 2026-01-06
// ============================================================================

import { vi } from 'vitest';

// ============================================================================
// TYPES
// ============================================================================

interface MockQueryResult<T> {
  data: T | T[] | null;
  error: null | { message: string; code: string };
  count?: number;
}

interface MockQueryBuilder {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  upsert: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  neq: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  is: ReturnType<typeof vi.fn>;
  gt: ReturnType<typeof vi.fn>;
  gte: ReturnType<typeof vi.fn>;
  lt: ReturnType<typeof vi.fn>;
  lte: ReturnType<typeof vi.fn>;
  like: ReturnType<typeof vi.fn>;
  ilike: ReturnType<typeof vi.fn>;
  or: ReturnType<typeof vi.fn>;
  and: ReturnType<typeof vi.fn>;
  not: ReturnType<typeof vi.fn>;
  filter: ReturnType<typeof vi.fn>;
  match: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  range: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  returns: ReturnType<typeof vi.fn>;
  throwOnError: ReturnType<typeof vi.fn>;
  then: ReturnType<typeof vi.fn>;
}

// ============================================================================
// MOCK DATA BY TABLE
// ============================================================================

const mockDataByTable: Record<string, Record<string, unknown>[]> = {
  tenant: [
    {
      id: 'tenant-123',
      name: 'Test Organization',
      slug: 'test-org',
      plan: 'enterprise',
      settings: {},
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  ],
  project: [
    {
      id: 'project-123',
      tenant_id: 'tenant-123',
      name: 'ML Project',
      description: 'Test ML project',
      status: 'active',
      created_by: 'user-123',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  ],
  experiment: [
    {
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
    },
  ],
  run: [
    {
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
    },
  ],
  run_metric: [
    {
      id: 'metric-123',
      run_id: 'run-123',
      key: 'accuracy',
      value: 0.95,
      step: 100,
      timestamp: '2026-01-01T01:00:00Z',
    },
  ],
  model: [
    {
      id: 'model-123',
      tenant_id: 'tenant-123',
      project_id: 'project-123',
      name: 'Classifier Model',
      description: 'Classification model',
      framework: 'scikit-learn',
      task_type: 'classification',
      tags: [],
      metadata: {},
      latest_version: 1,
      created_by: 'user-123',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  ],
  model_version: [
    {
      id: 'version-123',
      tenant_id: 'tenant-123',
      model_id: 'model-123',
      version: 1,
      stage: 'production',
      status: 'ready',
      run_id: 'run-123',
      artifact_uri: '/artifacts/model.pkl',
      metrics: { accuracy: 0.95, f1_score: 0.93 },
      parameters: {},
      tags: [],
      created_by: 'user-123',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  ],
  model_deployment: [
    {
      id: 'deploy-123',
      tenant_id: 'tenant-123',
      model_id: 'model-123',
      model_version_id: 'version-123',
      name: 'Production Deployment',
      target: 'kubernetes',
      environment_id: 'env-123',
      cluster_id: 'cluster-123',
      endpoint_url: 'https://api.example.com/v1/predict',
      status: 'running',
      replicas: 3,
      config: {},
      created_by: 'user-123',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  ],
  artifact: [
    {
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
    },
  ],
  workspace: [
    {
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
    },
  ],
  notification: [],
  billing_account: [
    {
      id: 'billing-123',
      tenant_id: 'tenant-123',
      provider: 'aws',
      account_id: 'aws-123456789',
      account_name: 'Production Account',
      status: 'active',
      is_primary: true,
      last_sync_at: '2026-01-01T00:00:00Z',
      sync_status: 'synced',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  ],
  budget: [
    {
      id: 'budget-123',
      tenant_id: 'tenant-123',
      name: 'ML Compute Budget',
      description: 'Monthly budget for ML compute',
      budget_type: 'project',
      scope_type: 'project',
      scope_id: 'project-123',
      amount: 10000.00,
      currency: 'USD',
      period: 'monthly',
      alert_thresholds: [50, 75, 90, 100],
      status: 'active',
      current_spend: 4500.00,
      created_by: 'user-123',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  ],
  cost_record: [
    {
      id: 'cost-123',
      tenant_id: 'tenant-123',
      billing_account_id: 'billing-123',
      project_id: 'project-123',
      service: 'compute',
      resource_type: 'ec2_instance',
      cost_amount: 150.00,
      currency: 'USD',
      usage_date: '2026-01-01',
      created_at: '2026-01-01T00:00:00Z',
    },
  ],
  carbon_record: [
    {
      id: 'carbon-123',
      tenant_id: 'tenant-123',
      project_id: 'project-123',
      resource_type: 'compute',
      energy_kwh: 50.5,
      carbon_kg: 22.7,
      measurement_date: '2026-01-01',
      created_at: '2026-01-01T00:00:00Z',
    },
  ],
  ai_system: [
    {
      id: 'ai-system-123',
      tenant_id: 'tenant-123',
      name: 'Test AI System',
      system_type: 'ml_model',
      risk_class: 'high_risk',
      status: 'active',
      created_by: 'user-123',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  ],
  model_card: [
    {
      id: 'model-card-123',
      tenant_id: 'tenant-123',
      model_version_id: 'version-123',
      version: '1.0.0',
      status: 'published',
      model_details: { name: 'Test Model' },
      created_by: 'user-123',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  ],
  risk_assessment: [
    {
      id: 'risk-123',
      tenant_id: 'tenant-123',
      ai_system_id: 'ai-system-123',
      risk_level: 'medium',
      status: 'completed',
      assessor_id: 'user-123',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  ],
  observability_backend: [
    {
      id: 'obs-backend-123',
      tenant_id: 'tenant-123',
      name: 'Production Grafana',
      kind: 'grafana',
      obs_type: 'metrics',
      base_url: 'https://grafana.example.com',
      is_default: true,
      status: 'healthy',
      last_health_check: '2026-01-01T00:00:00Z',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  ],
  incident: [
    {
      id: 'incident-123',
      tenant_id: 'tenant-123',
      project_id: 'project-123',
      title: 'High Latency Alert',
      severity: 'high',
      status: 'open',
      source: 'prometheus',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  ],
  sla_policy: [
    {
      id: 'sla-123',
      tenant_id: 'tenant-123',
      name: 'Production SLA',
      scope_type: 'project',
      scope_id: 'project-123',
      targets: { availability: { target: 99.9 } },
      is_active: true,
      created_by: 'user-123',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  ],
};

// ============================================================================
// MOCK QUERY BUILDER FACTORY
// ============================================================================

/**
 * Creates a chainable mock query builder that resolves with data.
 *
 * Parameters
 * ----------
 * tableName : string
 *     The name of the database table to mock.
 *
 * Returns
 * -------
 * MockQueryBuilder
 *     A chainable mock object that simulates Supabase query operations.
 */
export function createMockQueryBuilder(tableName: string): MockQueryBuilder {
  const tableData = mockDataByTable[tableName] ?? [];

  let currentData = [...tableData];
  let isSingleQuery = false;
  let isMaybeSingleQuery = false;

  const builder: MockQueryBuilder = {
    select: vi.fn().mockImplementation(() => {
      return builder;
    }),
    insert: vi.fn().mockImplementation((data: Record<string, unknown> | Record<string, unknown>[]) => {
      const newData = Array.isArray(data) ? data : [data];
      const insertedData = newData.map((item, index) => ({
        id: `new-${tableName}-${Date.now()}-${index}`,
        ...item,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      currentData = insertedData;
      return builder;
    }),
    update: vi.fn().mockImplementation((data: Record<string, unknown>) => {
      currentData = currentData.map((item) => ({ ...item, ...data, updated_at: new Date().toISOString() }));
      return builder;
    }),
    delete: vi.fn().mockImplementation(() => {
      currentData = [];
      return builder;
    }),
    upsert: vi.fn().mockImplementation((data: Record<string, unknown> | Record<string, unknown>[]) => {
      const newData = Array.isArray(data) ? data : [data];
      currentData = newData.map((item) => ({
        ...item,
        updated_at: new Date().toISOString(),
      }));
      return builder;
    }),
    eq: vi.fn().mockImplementation((column: string, value: unknown) => {
      currentData = currentData.filter((item) => item[column] === value);
      return builder;
    }),
    neq: vi.fn().mockImplementation((column: string, value: unknown) => {
      currentData = currentData.filter((item) => item[column] !== value);
      return builder;
    }),
    in: vi.fn().mockImplementation((column: string, values: unknown[]) => {
      currentData = currentData.filter((item) => values.includes(item[column]));
      return builder;
    }),
    is: vi.fn().mockImplementation((column: string, value: unknown) => {
      currentData = currentData.filter((item) => item[column] === value);
      return builder;
    }),
    gt: vi.fn().mockImplementation((column: string, value: unknown) => {
      currentData = currentData.filter((item) => (item[column] as number) > (value as number));
      return builder;
    }),
    gte: vi.fn().mockImplementation((column: string, value: unknown) => {
      currentData = currentData.filter((item) => (item[column] as number) >= (value as number));
      return builder;
    }),
    lt: vi.fn().mockImplementation((column: string, value: unknown) => {
      currentData = currentData.filter((item) => (item[column] as number) < (value as number));
      return builder;
    }),
    lte: vi.fn().mockImplementation((column: string, value: unknown) => {
      currentData = currentData.filter((item) => (item[column] as number) <= (value as number));
      return builder;
    }),
    like: vi.fn().mockImplementation((column: string, pattern: string) => {
      const regex = new RegExp(pattern.replace(/%/g, '.*'), 'i');
      currentData = currentData.filter((item) => regex.test(String(item[column])));
      return builder;
    }),
    ilike: vi.fn().mockImplementation((column: string, pattern: string) => {
      const regex = new RegExp(pattern.replace(/%/g, '.*'), 'i');
      currentData = currentData.filter((item) => regex.test(String(item[column])));
      return builder;
    }),
    or: vi.fn().mockImplementation(() => builder),
    and: vi.fn().mockImplementation(() => builder),
    not: vi.fn().mockImplementation(() => builder),
    filter: vi.fn().mockImplementation(() => builder),
    match: vi.fn().mockImplementation((query: Record<string, unknown>) => {
      currentData = currentData.filter((item) =>
        Object.entries(query).every(([key, value]) => item[key] === value)
      );
      return builder;
    }),
    order: vi.fn().mockImplementation((column: string, options?: { ascending?: boolean }) => {
      const ascending = options?.ascending ?? true;
      currentData.sort((a, b) => {
        const aVal = a[column];
        const bVal = b[column];
        if (aVal === bVal) return 0;
        if (ascending) {
          return aVal < bVal ? -1 : 1;
        }
        return aVal > bVal ? -1 : 1;
      });
      return builder;
    }),
    limit: vi.fn().mockImplementation((count: number) => {
      currentData = currentData.slice(0, count);
      return builder;
    }),
    range: vi.fn().mockImplementation((from: number, to: number) => {
      currentData = currentData.slice(from, to + 1);
      return builder;
    }),
    single: vi.fn().mockImplementation(() => {
      isSingleQuery = true;
      return builder;
    }),
    maybeSingle: vi.fn().mockImplementation(() => {
      isMaybeSingleQuery = true;
      return builder;
    }),
    returns: vi.fn().mockImplementation(() => builder),
    throwOnError: vi.fn().mockImplementation(() => builder),
    then: vi.fn().mockImplementation((resolve: (result: MockQueryResult<unknown>) => void) => {
      let data: unknown;

      if (isSingleQuery) {
        data = currentData[0] ?? null;
      } else if (isMaybeSingleQuery) {
        data = currentData[0] ?? null;
      } else {
        data = currentData;
      }

      resolve({
        data,
        error: null,
        count: tableData.length,
      });

      // Reset for next query
      currentData = [...tableData];
      isSingleQuery = false;
      isMaybeSingleQuery = false;
    }),
  };

  // Make the builder thenable (Promise-like)
  Object.defineProperty(builder, 'then', {
    value: (
      onFulfilled?: (value: MockQueryResult<unknown>) => unknown,
      onRejected?: (reason: unknown) => unknown
    ) => {
      return Promise.resolve().then(() => {
        let data: unknown;

        if (isSingleQuery) {
          data = currentData[0] ?? null;
        } else if (isMaybeSingleQuery) {
          data = currentData[0] ?? null;
        } else {
          data = currentData;
        }

        const result: MockQueryResult<unknown> = {
          data,
          error: null,
          count: tableData.length,
        };

        // Reset for next query
        currentData = [...tableData];
        isSingleQuery = false;
        isMaybeSingleQuery = false;

        return result;
      }).then(onFulfilled, onRejected);
    },
    enumerable: false,
    configurable: true,
  });

  return builder;
}

// ============================================================================
// CREATE COMPLETE SUPABASE MOCK
// ============================================================================

/**
 * Creates a complete mock of the Supabase client.
 *
 * Returns
 * -------
 * object
 *     A mock Supabase client with all necessary methods.
 */
export function createSupabaseMock() {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            app_metadata: { tenant_id: 'tenant-123' },
            user_metadata: { full_name: 'Test User' },
          },
        },
        error: null,
      }),
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: {
            access_token: 'test-access-token',
            refresh_token: 'test-refresh-token',
            user: {
              id: 'test-user-id',
              email: 'test@example.com',
              app_metadata: { tenant_id: 'tenant-123' },
            },
          },
        },
        error: null,
      }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: {
          user: { id: 'test-user-id', email: 'test@example.com' },
          session: { access_token: 'test-token' },
        },
        error: null,
      }),
      signUp: vi.fn().mockResolvedValue({
        data: {
          user: { id: 'new-user-id', email: 'new@example.com' },
          session: null,
        },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
      updateUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: {
          subscription: {
            id: 'auth-subscription-123',
            unsubscribe: vi.fn(),
          },
        },
      }),
    },
    from: vi.fn().mockImplementation((tableName: string) => {
      return createMockQueryBuilder(tableName);
    }),
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnValue({
        unsubscribe: vi.fn(),
      }),
    }),
    removeChannel: vi.fn().mockResolvedValue({ error: null }),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: { path: 'test-file.png' },
          error: null,
        }),
        download: vi.fn().mockResolvedValue({
          data: new Blob(['test']),
          error: null,
        }),
        remove: vi.fn().mockResolvedValue({
          data: [{ name: 'test-file.png' }],
          error: null,
        }),
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: 'https://example.com/signed-url' },
          error: null,
        }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/public-url' },
        }),
        list: vi.fn().mockResolvedValue({
          data: [{ name: 'file1.png' }, { name: 'file2.png' }],
          error: null,
        }),
      }),
      createBucket: vi.fn().mockResolvedValue({ error: null }),
      deleteBucket: vi.fn().mockResolvedValue({ error: null }),
      listBuckets: vi.fn().mockResolvedValue({
        data: [{ name: 'avatars' }, { name: 'artifacts' }],
        error: null,
      }),
    },
    functions: {
      invoke: vi.fn().mockImplementation((functionName: string, options?: { body?: unknown }) => {
        // Default mock responses for Edge Functions
        const responses: Record<string, unknown> = {
          'send-notification': { success: true, id: 'notif-123' },
          'process-webhook': { processed: true },
          'generate-report': { reportUrl: 'https://example.com/report.pdf' },
          'validate-model': { valid: true, score: 0.95 },
        };

        return Promise.resolve({
          data: responses[functionName] ?? { success: true },
          error: null,
        });
      }),
    },
    rpc: vi.fn().mockImplementation((functionName: string, params?: Record<string, unknown>) => {
      // Default mock responses for RPC functions
      const responses: Record<string, unknown> = {
        get_user_tenant_id: 'tenant-123',
        get_user_projects: [{ id: 'project-123', name: 'ML Project' }],
        calculate_budget_usage: { usage_percentage: 45.0, current_spend: 4500.00 },
        get_experiment_stats: { total_runs: 10, completed_runs: 8, avg_duration: 3600 },
      };

      return Promise.resolve({
        data: responses[functionName] ?? null,
        error: null,
      });
    }),
    realtime: {
      setAuth: vi.fn(),
    },
  };
}

// ============================================================================
// SIMPLE MOCK QUERY BUILDER FOR TESTS
// ============================================================================

/**
 * Creates a simple chainable mock query builder for test overrides.
 *
 * This is designed to be used with vi.mocked(supabase.from).mockReturnValue()
 * in individual tests that need custom behavior.
 *
 * Parameters
 * ----------
 * options : object
 *     Configuration options for the mock.
 * options.data : unknown
 *     The data to return from the query.
 * options.error : object | null, optional
 *     The error to return from the query.
 * options.count : number, optional
 *     The count to return for paginated queries.
 *
 * Returns
 * -------
 * object
 *     A chainable mock query builder.
 *
 * Examples
 * --------
 * >>> vi.mocked(supabase.from).mockReturnValue(
 * ...   createSimpleMockQuery({ data: mockData })
 * ... );
 */
export function createSimpleMockQuery(options: {
  data?: unknown;
  error?: { message: string; code: string } | null;
  count?: number;
} = {}) {
  const { data = [], error = null, count = 0 } = options;

  const result = { data, error, count };

  const builder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    and: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),
    match: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(),
    returns: vi.fn().mockReturnThis(),
    throwOnError: vi.fn().mockReturnThis(),
  };

  // Make it thenable
  Object.defineProperty(builder, 'then', {
    value: (
      onFulfilled?: (value: typeof result) => unknown,
      onRejected?: (reason: unknown) => unknown
    ) => {
      if (error) {
        return Promise.reject(error).catch(onRejected);
      }
      return Promise.resolve(result).then(onFulfilled, onRejected);
    },
    enumerable: false,
    configurable: true,
  });

  return builder;
}

// ============================================================================
// EXPORTS
// ============================================================================

export { mockDataByTable, createSimpleMockQuery as createMockQuery };
