// ============================================================================
// Test Utilities
// MLOps Control Plane v3
// Author: Armand AMOUSSOU
// Date: 2026-01-04
// ============================================================================

import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// ============================================================================
// QUERY CLIENT FOR TESTS
// ============================================================================

/**
 * Create a new QueryClient for each test to ensure isolation
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Turn off retries for tests
        retry: false,
        // Don't refetch on window focus in tests
        refetchOnWindowFocus: false,
        // Disable garbage collection time for testing
        gcTime: 0,
        // Set stale time to 0 for immediate refetching
        staleTime: 0,
      },
      mutations: {
        // Turn off retries for tests
        retry: false,
      },
    },
  });
}

// ============================================================================
// WRAPPER COMPONENT
// ============================================================================

interface WrapperProps {
  children: React.ReactNode;
}

/**
 * Create wrapper component with all providers
 */
function createWrapper(queryClient?: QueryClient) {
  const client = queryClient ?? createTestQueryClient();

  return function Wrapper({ children }: WrapperProps) {
    return (
      <QueryClientProvider client={client}>
        <BrowserRouter>{children}</BrowserRouter>
      </QueryClientProvider>
    );
  };
}

// ============================================================================
// CUSTOM RENDER
// ============================================================================

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  route?: string;
}

/**
 * Custom render function that wraps components with necessary providers
 */
function customRender(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult & { queryClient: QueryClient } {
  const { queryClient = createTestQueryClient(), route = '/', ...renderOptions } = options;

  // Set the initial route
  window.history.pushState({}, 'Test page', route);

  const Wrapper = createWrapper(queryClient);

  const result = render(ui, { wrapper: Wrapper, ...renderOptions });

  return {
    ...result,
    queryClient,
  };
}

// ============================================================================
// HOOK TESTING UTILITIES
// ============================================================================

import { renderHook, RenderHookOptions, RenderHookResult } from '@testing-library/react';

interface CustomRenderHookOptions<TProps> extends Omit<RenderHookOptions<TProps>, 'wrapper'> {
  queryClient?: QueryClient;
}

/**
 * Custom renderHook function that wraps hooks with necessary providers
 */
function customRenderHook<TResult, TProps>(
  hook: (props: TProps) => TResult,
  options: CustomRenderHookOptions<TProps> = {}
): RenderHookResult<TResult, TProps> & { queryClient: QueryClient } {
  const { queryClient = createTestQueryClient(), ...renderOptions } = options;

  const Wrapper = createWrapper(queryClient);

  const result = renderHook(hook, { wrapper: Wrapper, ...renderOptions });

  return {
    ...result,
    queryClient,
  };
}

// ============================================================================
// ASYNC UTILITIES
// ============================================================================

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const { timeout = 5000, interval = 50 } = options;
  const startTime = Date.now();

  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Timed out waiting for condition after ${timeout}ms`);
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

/**
 * Wait for next tick
 */
export function nextTick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Wait for specified milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// MOCK FACTORIES
// ============================================================================

/**
 * Create a mock experiment with optional overrides
 */
export function createMockExperiment(overrides: Record<string, unknown> = {}) {
  return {
    id: `exp-${Date.now()}`,
    tenant_id: 'tenant-123',
    project_id: 'project-123',
    name: 'Test Experiment',
    description: 'Test description',
    status: 'active',
    tags: [],
    created_by: 'user-123',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock run with optional overrides
 */
export function createMockRun(overrides: Record<string, unknown> = {}) {
  return {
    id: `run-${Date.now()}`,
    tenant_id: 'tenant-123',
    experiment_id: 'exp-123',
    name: 'Test Run',
    status: 'completed',
    source_type: 'notebook',
    start_time: new Date().toISOString(),
    end_time: new Date().toISOString(),
    duration_seconds: 3600,
    user_id: 'user-123',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock model with optional overrides
 */
export function createMockModel(overrides: Record<string, unknown> = {}) {
  return {
    id: `model-${Date.now()}`,
    tenant_id: 'tenant-123',
    project_id: 'project-123',
    name: 'Test Model',
    description: 'Test description',
    model_type: 'classification',
    framework: 'scikit-learn',
    created_by: 'user-123',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock artifact with optional overrides
 */
export function createMockArtifact(overrides: Record<string, unknown> = {}) {
  return {
    id: `artifact-${Date.now()}`,
    tenant_id: 'tenant-123',
    run_id: 'run-123',
    name: 'test-artifact.pkl',
    artifact_type: 'model',
    path: '/artifacts/test-artifact.pkl',
    size_bytes: 1024,
    checksum: 'abc123',
    storage_type: 's3',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock workspace with optional overrides
 */
export function createMockWorkspace(overrides: Record<string, unknown> = {}) {
  return {
    id: `workspace-${Date.now()}`,
    tenant_id: 'tenant-123',
    project_id: 'project-123',
    user_id: 'user-123',
    name: 'Test Workspace',
    workspace_type: 'jupyter',
    status: 'running',
    endpoint_url: 'https://workspace.example.com',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export * from '@testing-library/react';
export { customRender as render, customRenderHook as renderHook };

// ============================================================================
// GOVERNANCE MOCK FACTORIES
// ============================================================================

/**
 * Create a mock AI system with optional overrides
 */
export function createMockAISystem(overrides: Record<string, unknown> = {}) {
  return {
    id: `ai-system-${Date.now()}`,
    tenant_id: 'tenant-123',
    name: 'Test AI System',
    description: 'Test AI system description',
    system_type: 'ml_model',
    risk_class: 'high_risk',
    version: '1.0.0',
    status: 'active',
    purpose: 'Classification of customer data',
    intended_use: 'Automated decision support',
    technical_documentation_url: 'https://docs.example.com/ai-system',
    contact_email: 'ai-team@example.com',
    deployer_info: { name: 'Test Corp', address: 'Test Street 123' },
    created_by: 'user-123',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock model card with optional overrides
 */
export function createMockModelCard(overrides: Record<string, unknown> = {}) {
  return {
    id: `model-card-${Date.now()}`,
    tenant_id: 'tenant-123',
    model_id: 'model-123',
    version: '1.0.0',
    status: 'published',
    model_details: {
      name: 'Test Model',
      version: '1.0.0',
      type: 'classification',
      framework: 'scikit-learn',
    },
    intended_use: {
      primary_uses: ['Classification'],
      out_of_scope_uses: ['Real-time processing'],
    },
    training_data: {
      dataset: 'Training Dataset v1',
      preprocessing: 'Standard scaling',
    },
    evaluation_data: {
      dataset: 'Evaluation Dataset v1',
      metrics: ['accuracy', 'precision', 'recall'],
    },
    quantitative_analysis: {
      accuracy: 0.95,
      precision: 0.94,
      recall: 0.93,
    },
    ethical_considerations: {
      bias_analysis: 'No significant bias detected',
      fairness_metrics: {},
    },
    caveats_recommendations: {
      limitations: ['Limited to English text'],
      recommendations: ['Monitor for drift'],
    },
    created_by: 'user-123',
    approved_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock risk assessment with optional overrides
 */
export function createMockRiskAssessment(overrides: Record<string, unknown> = {}) {
  return {
    id: `risk-${Date.now()}`,
    tenant_id: 'tenant-123',
    ai_system_id: 'ai-system-123',
    assessment_type: 'initial',
    risk_level: 'medium',
    status: 'completed',
    assessor_id: 'user-123',
    reviewer_id: null,
    risk_factors: {
      data_quality: 'medium',
      bias_potential: 'low',
      transparency: 'high',
    },
    mitigation_measures: {
      monitoring: 'Continuous monitoring enabled',
      human_oversight: 'Weekly review by team lead',
    },
    compliance_gaps: [],
    recommendations: ['Implement drift detection', 'Add explainability layer'],
    assessment_date: new Date().toISOString(),
    review_date: null,
    next_review_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock compliance control with optional overrides
 */
export function createMockComplianceControl(overrides: Record<string, unknown> = {}) {
  return {
    id: `control-${Date.now()}`,
    tenant_id: 'tenant-123',
    control_id: 'CTRL-001',
    name: 'Data Quality Management',
    description: 'Ensure high-quality training data',
    category: 'data_governance',
    framework: 'eu_ai_act',
    framework_reference: 'Article 10',
    is_mandatory: true,
    implementation_guidance: 'Implement data validation pipelines',
    evidence_requirements: ['Data quality reports', 'Validation logs'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock governance incident with optional overrides
 */
export function createMockGovernanceIncident(overrides: Record<string, unknown> = {}) {
  return {
    id: `gov-incident-${Date.now()}`,
    tenant_id: 'tenant-123',
    ai_system_id: 'ai-system-123',
    title: 'Model Drift Detected',
    description: 'Significant model drift detected in production',
    incident_type: 'model_drift',
    severity: 'medium',
    status: 'investigating',
    reported_by: 'user-123',
    assigned_to: 'user-456',
    root_cause: null,
    resolution: null,
    reported_at: new Date().toISOString(),
    resolved_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================================================
// FINOPS MOCK FACTORIES
// ============================================================================

/**
 * Create a mock billing account with optional overrides
 */
export function createMockBillingAccount(overrides: Record<string, unknown> = {}) {
  return {
    id: `billing-${Date.now()}`,
    tenant_id: 'tenant-123',
    provider: 'aws',
    account_id: 'aws-123456789',
    account_name: 'Production Account',
    status: 'active',
    is_primary: true,
    credentials_encrypted: '***encrypted***',
    last_sync_at: new Date().toISOString(),
    sync_status: 'synced',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock cost record with optional overrides
 */
export function createMockCostRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: `cost-${Date.now()}`,
    tenant_id: 'tenant-123',
    billing_account_id: 'billing-123',
    project_id: 'project-123',
    service: 'compute',
    resource_type: 'ec2_instance',
    resource_id: 'i-1234567890abcdef0',
    usage_type: 'BoxUsage:m5.xlarge',
    usage_quantity: 720,
    usage_unit: 'Hours',
    cost_amount: 150.00,
    currency: 'USD',
    usage_date: new Date().toISOString().split('T')[0],
    tags: { environment: 'production', team: 'ml' },
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock budget with optional overrides
 */
export function createMockBudget(overrides: Record<string, unknown> = {}) {
  return {
    id: `budget-${Date.now()}`,
    tenant_id: 'tenant-123',
    name: 'ML Compute Budget',
    description: 'Monthly budget for ML compute resources',
    budget_type: 'project',
    scope_id: 'project-123',
    amount: 10000.00,
    currency: 'USD',
    period: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
    end_date: null,
    alert_thresholds: [50, 75, 90, 100],
    notification_emails: ['admin@example.com'],
    status: 'active',
    current_spend: 4500.00,
    forecasted_spend: 9200.00,
    created_by: 'user-123',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock carbon record with optional overrides
 */
export function createMockCarbonRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: `carbon-${Date.now()}`,
    tenant_id: 'tenant-123',
    project_id: 'project-123',
    resource_type: 'compute',
    resource_id: 'i-1234567890abcdef0',
    region: 'us-east-1',
    energy_kwh: 50.5,
    carbon_kg: 22.7,
    carbon_intensity: 0.45,
    measurement_date: new Date().toISOString().split('T')[0],
    data_source: 'cloud_carbon_footprint',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================================================
// OBSERVABILITY MOCK FACTORIES
// ============================================================================

/**
 * Create a mock observability backend with optional overrides
 */
export function createMockObservabilityBackend(overrides: Record<string, unknown> = {}) {
  return {
    id: `obs-backend-${Date.now()}`,
    tenant_id: 'tenant-123',
    name: 'Production Grafana',
    kind: 'grafana',
    obs_type: 'metrics',
    base_url: 'https://grafana.example.com',
    api_key_encrypted: '***encrypted***',
    is_default: true,
    status: 'healthy',
    last_health_check: new Date().toISOString(),
    config: { org_id: 1 },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock observability incident with optional overrides
 */
export function createMockObservabilityIncident(overrides: Record<string, unknown> = {}) {
  return {
    id: `obs-incident-${Date.now()}`,
    tenant_id: 'tenant-123',
    project_id: 'project-123',
    title: 'High Latency Alert',
    description: 'API latency exceeded threshold',
    severity: 'high',
    status: 'open',
    source: 'prometheus',
    source_incident_id: 'alert-12345',
    related_entities: [
      { type: 'deployment', id: 'deploy-123' },
    ],
    assigned_to: 'user-123',
    acknowledged_at: null,
    resolved_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock SLA policy with optional overrides
 */
export function createMockSLAPolicy(overrides: Record<string, unknown> = {}) {
  return {
    id: `sla-${Date.now()}`,
    tenant_id: 'tenant-123',
    name: 'Production SLA',
    description: 'SLA for production deployments',
    scope_type: 'project',
    scope_id: 'project-123',
    targets: {
      availability: { target: 99.9, measurement_window: 'monthly' },
      latency_p99: { target: 200, unit: 'ms' },
      error_rate: { target: 0.1, unit: 'percent' },
    },
    is_active: true,
    created_by: 'user-123',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================================================
// TODO: Additional test utilities
// ============================================================================
// TODO: Add snapshot testing utilities
// TODO: Add accessibility testing utilities
// TODO: Add performance testing utilities
// TODO: Add visual regression testing utilities
// TODO: Add integration testing utilities
// TODO: Add mock factories for tenancy domain
// TODO: Add mock factories for identity domain
// TODO: Add mock factories for infrastructure domain
// TODO: Add mock factories for registries domain
// TODO: Add mock factories for collaboration domain
