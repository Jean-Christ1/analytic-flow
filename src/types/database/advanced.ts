/**
 * Advanced Features Database Types
 *
 * Pipelines DAG, OPA/Rego policies, Catalog/Templates, Resource Inventory,
 * IaC/Terraform, Observability, Incidents/SLA, Webhooks/Integrations,
 * FinOps/GreenOps, AI Governance (EU AI Act), Data Contracts, Dashboards.
 */

import type {
  Json,
  CloudProvider,
  PipelineNodeType,
  PipelineStatus,
  PipelineTrigger,
  PolicyEnforcementMode,
  CatalogItemKind,
  CatalogItemStatus,
  ResourceProviderType,
  ManagedResourceStatus,
  DriftSeverity,
  DriftStatus,
  IaCBackendType,
  IaCAction,
  IaCRunStatus,
  ObservabilityKind,
  ObservabilityType,
  IncidentSeverity,
  IncidentStatus,
  IntegrationType,
  WebhookDeliveryStatus,
  BudgetPeriod,
  AIRiskClass,
  AISystemStatus,
  PrivacyClassification,
  ComplianceEvidenceStatus,
  GovernanceIncidentType,
  GovernanceIncidentStatus,
} from './common';

// ============================================================================
// PIPELINE DEFINITION (DAG ENGINE)
// ============================================================================

export interface PipelineDefinitionRow {
  id: string;
  tenant_id: string;
  project_id: string;
  name: string;
  description: string | null;
  version: number | null;
  spec: Json | null;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
  is_active: boolean | null;
}

export interface PipelineDefinitionInsert {
  id?: string;
  tenant_id: string;
  project_id: string;
  name: string;
  description?: string | null;
  version?: number | null;
  spec?: Json | null;
  created_at?: string;
  created_by?: string | null;
  updated_at?: string;
  updated_by?: string | null;
  is_active?: boolean | null;
}

export interface PipelineDefinitionUpdate {
  id?: string;
  tenant_id?: string;
  project_id?: string;
  name?: string;
  description?: string | null;
  version?: number | null;
  spec?: Json | null;
  created_at?: string;
  created_by?: string | null;
  updated_at?: string;
  updated_by?: string | null;
  is_active?: boolean | null;
}

export interface PipelineDefinitionTable {
  Row: PipelineDefinitionRow;
  Insert: PipelineDefinitionInsert;
  Update: PipelineDefinitionUpdate;
  Relationships: [
    {
      foreignKeyName: 'pipeline_definition_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'pipeline_definition_project_id_fkey';
      columns: ['project_id'];
      referencedRelation: 'project';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// PIPELINE NODE
// ============================================================================

export interface PipelineNodeRow {
  id: string;
  tenant_id: string;
  pipeline_definition_id: string;
  node_key: string;
  name: string;
  node_type: PipelineNodeType;
  run_template: Json | null;
  created_at: string;
}

export interface PipelineNodeInsert {
  id?: string;
  tenant_id: string;
  pipeline_definition_id: string;
  node_key: string;
  name: string;
  node_type: PipelineNodeType;
  run_template?: Json | null;
  created_at?: string;
}

export interface PipelineNodeUpdate {
  id?: string;
  tenant_id?: string;
  pipeline_definition_id?: string;
  node_key?: string;
  name?: string;
  node_type?: PipelineNodeType;
  run_template?: Json | null;
  created_at?: string;
}

export interface PipelineNodeTable {
  Row: PipelineNodeRow;
  Insert: PipelineNodeInsert;
  Update: PipelineNodeUpdate;
  Relationships: [
    {
      foreignKeyName: 'pipeline_node_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'pipeline_node_pipeline_definition_id_fkey';
      columns: ['pipeline_definition_id'];
      referencedRelation: 'pipeline_definition';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// PIPELINE EDGE
// ============================================================================

export interface PipelineEdgeRow {
  id: string;
  tenant_id: string;
  pipeline_definition_id: string;
  from_node_id: string;
  to_node_id: string;
  condition_expr: string | null;
}

export interface PipelineEdgeInsert {
  id?: string;
  tenant_id: string;
  pipeline_definition_id: string;
  from_node_id: string;
  to_node_id: string;
  condition_expr?: string | null;
}

export interface PipelineEdgeUpdate {
  id?: string;
  tenant_id?: string;
  pipeline_definition_id?: string;
  from_node_id?: string;
  to_node_id?: string;
  condition_expr?: string | null;
}

export interface PipelineEdgeTable {
  Row: PipelineEdgeRow;
  Insert: PipelineEdgeInsert;
  Update: PipelineEdgeUpdate;
  Relationships: [
    {
      foreignKeyName: 'pipeline_edge_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'pipeline_edge_pipeline_definition_id_fkey';
      columns: ['pipeline_definition_id'];
      referencedRelation: 'pipeline_definition';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'pipeline_edge_from_node_id_fkey';
      columns: ['from_node_id'];
      referencedRelation: 'pipeline_node';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'pipeline_edge_to_node_id_fkey';
      columns: ['to_node_id'];
      referencedRelation: 'pipeline_node';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// PIPELINE RUN
// ============================================================================

export interface PipelineRunRow {
  id: string;
  tenant_id: string;
  project_id: string;
  pipeline_definition_id: string;
  trigger: PipelineTrigger | null;
  status: PipelineStatus;
  status_message: string | null;
  params: Json | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  created_by: string | null;
}

export interface PipelineRunInsert {
  id?: string;
  tenant_id: string;
  project_id: string;
  pipeline_definition_id: string;
  trigger?: PipelineTrigger | null;
  status?: PipelineStatus;
  status_message?: string | null;
  params?: Json | null;
  started_at?: string | null;
  ended_at?: string | null;
  created_at?: string;
  created_by?: string | null;
}

export interface PipelineRunUpdate {
  id?: string;
  tenant_id?: string;
  project_id?: string;
  pipeline_definition_id?: string;
  trigger?: PipelineTrigger | null;
  status?: PipelineStatus;
  status_message?: string | null;
  params?: Json | null;
  started_at?: string | null;
  ended_at?: string | null;
  created_at?: string;
  created_by?: string | null;
}

export interface PipelineRunTable {
  Row: PipelineRunRow;
  Insert: PipelineRunInsert;
  Update: PipelineRunUpdate;
  Relationships: [
    {
      foreignKeyName: 'pipeline_run_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'pipeline_run_project_id_fkey';
      columns: ['project_id'];
      referencedRelation: 'project';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'pipeline_run_pipeline_definition_id_fkey';
      columns: ['pipeline_definition_id'];
      referencedRelation: 'pipeline_definition';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// PIPELINE RUN NODE
// ============================================================================

export interface PipelineRunNodeRow {
  id: string;
  tenant_id: string;
  pipeline_run_id: string;
  node_id: string;
  status: PipelineStatus;
  run_id: string | null;
  started_at: string | null;
  ended_at: string | null;
  attempts: number | null;
  error_message: string | null;
}

export interface PipelineRunNodeInsert {
  id?: string;
  tenant_id: string;
  pipeline_run_id: string;
  node_id: string;
  status?: PipelineStatus;
  run_id?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
  attempts?: number | null;
  error_message?: string | null;
}

export interface PipelineRunNodeUpdate {
  id?: string;
  tenant_id?: string;
  pipeline_run_id?: string;
  node_id?: string;
  status?: PipelineStatus;
  run_id?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
  attempts?: number | null;
  error_message?: string | null;
}

export interface PipelineRunNodeTable {
  Row: PipelineRunNodeRow;
  Insert: PipelineRunNodeInsert;
  Update: PipelineRunNodeUpdate;
  Relationships: [
    {
      foreignKeyName: 'pipeline_run_node_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'pipeline_run_node_pipeline_run_id_fkey';
      columns: ['pipeline_run_id'];
      referencedRelation: 'pipeline_run';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'pipeline_run_node_node_id_fkey';
      columns: ['node_id'];
      referencedRelation: 'pipeline_node';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'pipeline_run_node_run_id_fkey';
      columns: ['run_id'];
      referencedRelation: 'run';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// PIPELINE SCHEDULE
// ============================================================================

export interface PipelineScheduleRow {
  id: string;
  tenant_id: string;
  project_id: string;
  pipeline_definition_id: string;
  name: string;
  cron: string | null;
  timezone: string | null;
  enabled: boolean | null;
  default_params: Json | null;
  created_at: string;
  updated_at: string;
}

export interface PipelineScheduleInsert {
  id?: string;
  tenant_id: string;
  project_id: string;
  pipeline_definition_id: string;
  name: string;
  cron?: string | null;
  timezone?: string | null;
  enabled?: boolean | null;
  default_params?: Json | null;
  created_at?: string;
  updated_at?: string;
}

export interface PipelineScheduleUpdate {
  id?: string;
  tenant_id?: string;
  project_id?: string;
  pipeline_definition_id?: string;
  name?: string;
  cron?: string | null;
  timezone?: string | null;
  enabled?: boolean | null;
  default_params?: Json | null;
  created_at?: string;
  updated_at?: string;
}

export interface PipelineScheduleTable {
  Row: PipelineScheduleRow;
  Insert: PipelineScheduleInsert;
  Update: PipelineScheduleUpdate;
  Relationships: [
    {
      foreignKeyName: 'pipeline_schedule_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'pipeline_schedule_project_id_fkey';
      columns: ['project_id'];
      referencedRelation: 'project';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'pipeline_schedule_pipeline_definition_id_fkey';
      columns: ['pipeline_definition_id'];
      referencedRelation: 'pipeline_definition';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// POLICY BUNDLE (OPA/REGO)
// ============================================================================

export interface PolicyBundleRow {
  id: string;
  tenant_id: string;
  name: string;
  version: string | null;
  source_repo: string | null;
  source_ref: string | null;
  bundle_uri: string | null;
  checksum: string | null;
  status: string | null; // active|deprecated
  created_at: string;
  created_by: string | null;
}

export interface PolicyBundleInsert {
  id?: string;
  tenant_id: string;
  name: string;
  version?: string | null;
  source_repo?: string | null;
  source_ref?: string | null;
  bundle_uri?: string | null;
  checksum?: string | null;
  status?: string | null;
  created_at?: string;
  created_by?: string | null;
}

export interface PolicyBundleUpdate {
  id?: string;
  tenant_id?: string;
  name?: string;
  version?: string | null;
  source_repo?: string | null;
  source_ref?: string | null;
  bundle_uri?: string | null;
  checksum?: string | null;
  status?: string | null;
  created_at?: string;
  created_by?: string | null;
}

export interface PolicyBundleTable {
  Row: PolicyBundleRow;
  Insert: PolicyBundleInsert;
  Update: PolicyBundleUpdate;
  Relationships: [
    {
      foreignKeyName: 'policy_bundle_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// POLICY ASSIGNMENT
// ============================================================================

export interface PolicyAssignmentRow {
  id: string;
  tenant_id: string;
  bundle_id: string;
  scope_type: string; // tenant|org|project|cluster|namespace
  scope_id: string | null;
  enforcement_mode: PolicyEnforcementMode;
  created_at: string;
  created_by: string | null;
}

export interface PolicyAssignmentInsert {
  id?: string;
  tenant_id: string;
  bundle_id: string;
  scope_type: string;
  scope_id?: string | null;
  enforcement_mode?: PolicyEnforcementMode;
  created_at?: string;
  created_by?: string | null;
}

export interface PolicyAssignmentUpdate {
  id?: string;
  tenant_id?: string;
  bundle_id?: string;
  scope_type?: string;
  scope_id?: string | null;
  enforcement_mode?: PolicyEnforcementMode;
  created_at?: string;
  created_by?: string | null;
}

export interface PolicyAssignmentTable {
  Row: PolicyAssignmentRow;
  Insert: PolicyAssignmentInsert;
  Update: PolicyAssignmentUpdate;
  Relationships: [
    {
      foreignKeyName: 'policy_assignment_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'policy_assignment_bundle_id_fkey';
      columns: ['bundle_id'];
      referencedRelation: 'policy_bundle';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// POLICY DECISION LOG
// ============================================================================

export interface PolicyDecisionLogRow {
  id: string;
  tenant_id: string;
  bundle_id: string;
  decision_point: string; // api|cicd|gitops|runtime
  input_hash: string | null;
  result: Json | null;
  allow: boolean | null;
  reason: string | null;
  entity_type: string | null;
  entity_id: string | null;
  evaluated_at: string | null;
}

export interface PolicyDecisionLogInsert {
  id?: string;
  tenant_id: string;
  bundle_id: string;
  decision_point: string;
  input_hash?: string | null;
  result?: Json | null;
  allow?: boolean | null;
  reason?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  evaluated_at?: string | null;
}

export interface PolicyDecisionLogUpdate {
  id?: string;
  tenant_id?: string;
  bundle_id?: string;
  decision_point?: string;
  input_hash?: string | null;
  result?: Json | null;
  allow?: boolean | null;
  reason?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  evaluated_at?: string | null;
}

export interface PolicyDecisionLogTable {
  Row: PolicyDecisionLogRow;
  Insert: PolicyDecisionLogInsert;
  Update: PolicyDecisionLogUpdate;
  Relationships: [
    {
      foreignKeyName: 'policy_decision_log_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'policy_decision_log_bundle_id_fkey';
      columns: ['bundle_id'];
      referencedRelation: 'policy_bundle';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// CATALOG ITEM
// ============================================================================

export interface CatalogItemRow {
  id: string;
  tenant_id: string;
  project_id: string | null;
  kind: CatalogItemKind;
  name: string;
  description: string | null;
  version: string | null;
  tags: Json | null;
  spec: Json | null;
  status: CatalogItemStatus;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface CatalogItemInsert {
  id?: string;
  tenant_id: string;
  project_id?: string | null;
  kind: CatalogItemKind;
  name: string;
  description?: string | null;
  version?: string | null;
  tags?: Json | null;
  spec?: Json | null;
  status?: CatalogItemStatus;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface CatalogItemUpdate {
  id?: string;
  tenant_id?: string;
  project_id?: string | null;
  kind?: CatalogItemKind;
  name?: string;
  description?: string | null;
  version?: string | null;
  tags?: Json | null;
  spec?: Json | null;
  status?: CatalogItemStatus;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface CatalogItemTable {
  Row: CatalogItemRow;
  Insert: CatalogItemInsert;
  Update: CatalogItemUpdate;
  Relationships: [
    {
      foreignKeyName: 'catalog_item_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'catalog_item_project_id_fkey';
      columns: ['project_id'];
      referencedRelation: 'project';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// CATALOG ITEM DEPENDENCY
// ============================================================================

export interface CatalogItemDependencyRow {
  id: string;
  tenant_id: string;
  item_id: string;
  depends_on_item_id: string;
  relation: string; // requires|optional|conflicts
}

export interface CatalogItemDependencyInsert {
  id?: string;
  tenant_id: string;
  item_id: string;
  depends_on_item_id: string;
  relation: string;
}

export interface CatalogItemDependencyUpdate {
  id?: string;
  tenant_id?: string;
  item_id?: string;
  depends_on_item_id?: string;
  relation?: string;
}

export interface CatalogItemDependencyTable {
  Row: CatalogItemDependencyRow;
  Insert: CatalogItemDependencyInsert;
  Update: CatalogItemDependencyUpdate;
  Relationships: [
    {
      foreignKeyName: 'catalog_item_dependency_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'catalog_item_dependency_item_id_fkey';
      columns: ['item_id'];
      referencedRelation: 'catalog_item';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'catalog_item_dependency_depends_on_item_id_fkey';
      columns: ['depends_on_item_id'];
      referencedRelation: 'catalog_item';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// TEMPLATE INSTANCE
// ============================================================================

export interface TemplateInstanceRow {
  id: string;
  tenant_id: string;
  project_id: string;
  catalog_item_id: string;
  name: string;
  params: Json | null;
  status: string | null; // created|applied|failed|deleted
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface TemplateInstanceInsert {
  id?: string;
  tenant_id: string;
  project_id: string;
  catalog_item_id: string;
  name: string;
  params?: Json | null;
  status?: string | null;
  created_at?: string;
  created_by?: string | null;
  updated_at?: string;
  updated_by?: string | null;
}

export interface TemplateInstanceUpdate {
  id?: string;
  tenant_id?: string;
  project_id?: string;
  catalog_item_id?: string;
  name?: string;
  params?: Json | null;
  status?: string | null;
  created_at?: string;
  created_by?: string | null;
  updated_at?: string;
  updated_by?: string | null;
}

export interface TemplateInstanceTable {
  Row: TemplateInstanceRow;
  Insert: TemplateInstanceInsert;
  Update: TemplateInstanceUpdate;
  Relationships: [
    {
      foreignKeyName: 'template_instance_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'template_instance_project_id_fkey';
      columns: ['project_id'];
      referencedRelation: 'project';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'template_instance_catalog_item_id_fkey';
      columns: ['catalog_item_id'];
      referencedRelation: 'catalog_item';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// MANAGED RESOURCE (RESOURCE INVENTORY)
// ============================================================================

export interface ManagedResourceRow {
  id: string;
  tenant_id: string;
  project_id: string;
  provider: ResourceProviderType;
  resource_type: string;
  resource_name: string;
  resource_id_external: string | null;
  region: string | null;
  environment: string | null;
  desired_state: Json | null;
  observed_state: Json | null;
  status: ManagedResourceStatus;
  last_reconciled_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface ManagedResourceInsert {
  id?: string;
  tenant_id: string;
  project_id: string;
  provider: ResourceProviderType;
  resource_type: string;
  resource_name: string;
  resource_id_external?: string | null;
  region?: string | null;
  environment?: string | null;
  desired_state?: Json | null;
  observed_state?: Json | null;
  status?: ManagedResourceStatus;
  last_reconciled_at?: string | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface ManagedResourceUpdate {
  id?: string;
  tenant_id?: string;
  project_id?: string;
  provider?: ResourceProviderType;
  resource_type?: string;
  resource_name?: string;
  resource_id_external?: string | null;
  region?: string | null;
  environment?: string | null;
  desired_state?: Json | null;
  observed_state?: Json | null;
  status?: ManagedResourceStatus;
  last_reconciled_at?: string | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface ManagedResourceTable {
  Row: ManagedResourceRow;
  Insert: ManagedResourceInsert;
  Update: ManagedResourceUpdate;
  Relationships: [
    {
      foreignKeyName: 'managed_resource_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'managed_resource_project_id_fkey';
      columns: ['project_id'];
      referencedRelation: 'project';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// RESOURCE RELATION
// ============================================================================

export interface ResourceRelationRow {
  id: string;
  tenant_id: string;
  from_resource_id: string;
  to_resource_id: string;
  relation: string; // depends_on|uses|owns|contains
}

export interface ResourceRelationInsert {
  id?: string;
  tenant_id: string;
  from_resource_id: string;
  to_resource_id: string;
  relation: string;
}

export interface ResourceRelationUpdate {
  id?: string;
  tenant_id?: string;
  from_resource_id?: string;
  to_resource_id?: string;
  relation?: string;
}

export interface ResourceRelationTable {
  Row: ResourceRelationRow;
  Insert: ResourceRelationInsert;
  Update: ResourceRelationUpdate;
  Relationships: [
    {
      foreignKeyName: 'resource_relation_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'resource_relation_from_resource_id_fkey';
      columns: ['from_resource_id'];
      referencedRelation: 'managed_resource';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'resource_relation_to_resource_id_fkey';
      columns: ['to_resource_id'];
      referencedRelation: 'managed_resource';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// DRIFT EVENT
// ============================================================================

export interface DriftEventRow {
  id: string;
  tenant_id: string;
  resource_id: string;
  severity: DriftSeverity;
  summary: string | null;
  diff_uri: string | null;
  detected_at: string | null;
  status: DriftStatus;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
}

export interface DriftEventInsert {
  id?: string;
  tenant_id: string;
  resource_id: string;
  severity?: DriftSeverity;
  summary?: string | null;
  diff_uri?: string | null;
  detected_at?: string | null;
  status?: DriftStatus;
  acknowledged_at?: string | null;
  acknowledged_by?: string | null;
  resolved_at?: string | null;
  resolved_by?: string | null;
}

export interface DriftEventUpdate {
  id?: string;
  tenant_id?: string;
  resource_id?: string;
  severity?: DriftSeverity;
  summary?: string | null;
  diff_uri?: string | null;
  detected_at?: string | null;
  status?: DriftStatus;
  acknowledged_at?: string | null;
  acknowledged_by?: string | null;
  resolved_at?: string | null;
  resolved_by?: string | null;
}

export interface DriftEventTable {
  Row: DriftEventRow;
  Insert: DriftEventInsert;
  Update: DriftEventUpdate;
  Relationships: [
    {
      foreignKeyName: 'drift_event_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'drift_event_resource_id_fkey';
      columns: ['resource_id'];
      referencedRelation: 'managed_resource';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// IAC WORKSPACE (TERRAFORM)
// ============================================================================

export interface IaCWorkspaceRow {
  id: string;
  tenant_id: string;
  project_id: string;
  name: string;
  backend_type: IaCBackendType | null;
  backend_config: Json | null;
  created_at: string;
  updated_at: string;
}

export interface IaCWorkspaceInsert {
  id?: string;
  tenant_id: string;
  project_id: string;
  name: string;
  backend_type?: IaCBackendType | null;
  backend_config?: Json | null;
  created_at?: string;
  updated_at?: string;
}

export interface IaCWorkspaceUpdate {
  id?: string;
  tenant_id?: string;
  project_id?: string;
  name?: string;
  backend_type?: IaCBackendType | null;
  backend_config?: Json | null;
  created_at?: string;
  updated_at?: string;
}

export interface IaCWorkspaceTable {
  Row: IaCWorkspaceRow;
  Insert: IaCWorkspaceInsert;
  Update: IaCWorkspaceUpdate;
  Relationships: [
    {
      foreignKeyName: 'iac_workspace_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'iac_workspace_project_id_fkey';
      columns: ['project_id'];
      referencedRelation: 'project';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// IAC RUN
// ============================================================================

export interface IaCRunRow {
  id: string;
  tenant_id: string;
  project_id: string;
  workspace_id: string;
  trigger: string | null; // manual|cicd|api|schedule
  action: IaCAction;
  status: IaCRunStatus;
  plan_artifact_id: string | null;
  state_uri: string | null;
  lock_id: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  created_by: string | null;
  error_message: string | null;
}

export interface IaCRunInsert {
  id?: string;
  tenant_id: string;
  project_id: string;
  workspace_id: string;
  trigger?: string | null;
  action: IaCAction;
  status?: IaCRunStatus;
  plan_artifact_id?: string | null;
  state_uri?: string | null;
  lock_id?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
  created_at?: string;
  created_by?: string | null;
  error_message?: string | null;
}

export interface IaCRunUpdate {
  id?: string;
  tenant_id?: string;
  project_id?: string;
  workspace_id?: string;
  trigger?: string | null;
  action?: IaCAction;
  status?: IaCRunStatus;
  plan_artifact_id?: string | null;
  state_uri?: string | null;
  lock_id?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
  created_at?: string;
  created_by?: string | null;
  error_message?: string | null;
}

export interface IaCRunTable {
  Row: IaCRunRow;
  Insert: IaCRunInsert;
  Update: IaCRunUpdate;
  Relationships: [
    {
      foreignKeyName: 'iac_run_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'iac_run_project_id_fkey';
      columns: ['project_id'];
      referencedRelation: 'project';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'iac_run_workspace_id_fkey';
      columns: ['workspace_id'];
      referencedRelation: 'iac_workspace';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'iac_run_plan_artifact_id_fkey';
      columns: ['plan_artifact_id'];
      referencedRelation: 'cicd_job_artifact';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// IAC CHANGE SUMMARY
// ============================================================================

export interface IaCChangeSummaryRow {
  id: string;
  tenant_id: string;
  iac_run_id: string;
  add_count: number | null;
  change_count: number | null;
  destroy_count: number | null;
  summary: string | null;
  details_uri: string | null;
  created_at: string;
}

export interface IaCChangeSummaryInsert {
  id?: string;
  tenant_id: string;
  iac_run_id: string;
  add_count?: number | null;
  change_count?: number | null;
  destroy_count?: number | null;
  summary?: string | null;
  details_uri?: string | null;
  created_at?: string;
}

export interface IaCChangeSummaryUpdate {
  id?: string;
  tenant_id?: string;
  iac_run_id?: string;
  add_count?: number | null;
  change_count?: number | null;
  destroy_count?: number | null;
  summary?: string | null;
  details_uri?: string | null;
  created_at?: string;
}

export interface IaCChangeSummaryTable {
  Row: IaCChangeSummaryRow;
  Insert: IaCChangeSummaryInsert;
  Update: IaCChangeSummaryUpdate;
  Relationships: [
    {
      foreignKeyName: 'iac_change_summary_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'iac_change_summary_iac_run_id_fkey';
      columns: ['iac_run_id'];
      referencedRelation: 'iac_run';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// OBSERVABILITY BACKEND
// ============================================================================

export interface ObservabilityBackendRow {
  id: string;
  tenant_id: string;
  kind: ObservabilityKind;
  type: ObservabilityType;
  endpoint: string | null;
  auth_secret_ref: string | null;
  default_labels: Json | null;
  created_at: string;
  updated_at: string;
}

export interface ObservabilityBackendInsert {
  id?: string;
  tenant_id: string;
  kind: ObservabilityKind;
  type: ObservabilityType;
  endpoint?: string | null;
  auth_secret_ref?: string | null;
  default_labels?: Json | null;
  created_at?: string;
  updated_at?: string;
}

export interface ObservabilityBackendUpdate {
  id?: string;
  tenant_id?: string;
  kind?: ObservabilityKind;
  type?: ObservabilityType;
  endpoint?: string | null;
  auth_secret_ref?: string | null;
  default_labels?: Json | null;
  created_at?: string;
  updated_at?: string;
}

export interface ObservabilityBackendTable {
  Row: ObservabilityBackendRow;
  Insert: ObservabilityBackendInsert;
  Update: ObservabilityBackendUpdate;
  Relationships: [
    {
      foreignKeyName: 'observability_backend_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'observability_backend_auth_secret_ref_fkey';
      columns: ['auth_secret_ref'];
      referencedRelation: 'secret_ref';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// OBSERVABILITY LINK
// ============================================================================

export interface ObservabilityLinkRow {
  id: string;
  tenant_id: string;
  backend_id: string;
  entity_type: string;
  entity_id: string;
  query: Json | null;
  url: string | null;
  created_at: string;
}

export interface ObservabilityLinkInsert {
  id?: string;
  tenant_id: string;
  backend_id: string;
  entity_type: string;
  entity_id: string;
  query?: Json | null;
  url?: string | null;
  created_at?: string;
}

export interface ObservabilityLinkUpdate {
  id?: string;
  tenant_id?: string;
  backend_id?: string;
  entity_type?: string;
  entity_id?: string;
  query?: Json | null;
  url?: string | null;
  created_at?: string;
}

export interface ObservabilityLinkTable {
  Row: ObservabilityLinkRow;
  Insert: ObservabilityLinkInsert;
  Update: ObservabilityLinkUpdate;
  Relationships: [
    {
      foreignKeyName: 'observability_link_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'observability_link_backend_id_fkey';
      columns: ['backend_id'];
      referencedRelation: 'observability_backend';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// INCIDENT
// ============================================================================

export interface IncidentRow {
  id: string;
  tenant_id: string;
  project_id: string;
  title: string;
  description: string | null;
  severity: IncidentSeverity;
  status: IncidentStatus;
  detected_at: string | null;
  declared_at: string | null;
  resolved_at: string | null;
  owner_user_id: string | null;
  related_entity: Json | null;
  root_cause: string | null;
  impact: string | null;
  timeline_uri: string | null;
  created_at: string;
  updated_at: string;
}

export interface IncidentInsert {
  id?: string;
  tenant_id: string;
  project_id: string;
  title: string;
  description?: string | null;
  severity?: IncidentSeverity;
  status?: IncidentStatus;
  detected_at?: string | null;
  declared_at?: string | null;
  resolved_at?: string | null;
  owner_user_id?: string | null;
  related_entity?: Json | null;
  root_cause?: string | null;
  impact?: string | null;
  timeline_uri?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface IncidentUpdate {
  id?: string;
  tenant_id?: string;
  project_id?: string;
  title?: string;
  description?: string | null;
  severity?: IncidentSeverity;
  status?: IncidentStatus;
  detected_at?: string | null;
  declared_at?: string | null;
  resolved_at?: string | null;
  owner_user_id?: string | null;
  related_entity?: Json | null;
  root_cause?: string | null;
  impact?: string | null;
  timeline_uri?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface IncidentTable {
  Row: IncidentRow;
  Insert: IncidentInsert;
  Update: IncidentUpdate;
  Relationships: [
    {
      foreignKeyName: 'incident_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'incident_project_id_fkey';
      columns: ['project_id'];
      referencedRelation: 'project';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'incident_owner_user_id_fkey';
      columns: ['owner_user_id'];
      referencedRelation: 'user_account';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// INCIDENT UPDATE
// ============================================================================

export interface IncidentUpdateRow {
  id: string;
  tenant_id: string;
  incident_id: string;
  author_user_id: string;
  message: string | null;
  status: string | null; // info|mitigation|resolution
  created_at: string;
}

export interface IncidentUpdateInsert {
  id?: string;
  tenant_id: string;
  incident_id: string;
  author_user_id: string;
  message?: string | null;
  status?: string | null;
  created_at?: string;
}

export interface IncidentUpdateUpdate {
  id?: string;
  tenant_id?: string;
  incident_id?: string;
  author_user_id?: string;
  message?: string | null;
  status?: string | null;
  created_at?: string;
}

export interface IncidentUpdateTable {
  Row: IncidentUpdateRow;
  Insert: IncidentUpdateInsert;
  Update: IncidentUpdateUpdate;
  Relationships: [
    {
      foreignKeyName: 'incident_update_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'incident_update_incident_id_fkey';
      columns: ['incident_id'];
      referencedRelation: 'incident';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'incident_update_author_user_id_fkey';
      columns: ['author_user_id'];
      referencedRelation: 'user_account';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// SLA POLICY
// ============================================================================

export interface SLAPolicyRow {
  id: string;
  tenant_id: string;
  name: string;
  scope_type: string; // tenant|project
  scope_id: string | null;
  targets: Json | null;
  created_at: string;
  updated_at: string;
}

export interface SLAPolicyInsert {
  id?: string;
  tenant_id: string;
  name: string;
  scope_type: string;
  scope_id?: string | null;
  targets?: Json | null;
  created_at?: string;
  updated_at?: string;
}

export interface SLAPolicyUpdate {
  id?: string;
  tenant_id?: string;
  name?: string;
  scope_type?: string;
  scope_id?: string | null;
  targets?: Json | null;
  created_at?: string;
  updated_at?: string;
}

export interface SLAPolicyTable {
  Row: SLAPolicyRow;
  Insert: SLAPolicyInsert;
  Update: SLAPolicyUpdate;
  Relationships: [
    {
      foreignKeyName: 'sla_policy_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// INTEGRATION ENDPOINT
// ============================================================================

export interface IntegrationEndpointRow {
  id: string;
  tenant_id: string;
  type: IntegrationType;
  name: string;
  config: Json | null;
  secret_ref_id: string | null;
  enabled: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface IntegrationEndpointInsert {
  id?: string;
  tenant_id: string;
  type: IntegrationType;
  name: string;
  config?: Json | null;
  secret_ref_id?: string | null;
  enabled?: boolean | null;
  created_at?: string;
  updated_at?: string;
}

export interface IntegrationEndpointUpdate {
  id?: string;
  tenant_id?: string;
  type?: IntegrationType;
  name?: string;
  config?: Json | null;
  secret_ref_id?: string | null;
  enabled?: boolean | null;
  created_at?: string;
  updated_at?: string;
}

export interface IntegrationEndpointTable {
  Row: IntegrationEndpointRow;
  Insert: IntegrationEndpointInsert;
  Update: IntegrationEndpointUpdate;
  Relationships: [
    {
      foreignKeyName: 'integration_endpoint_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'integration_endpoint_secret_ref_id_fkey';
      columns: ['secret_ref_id'];
      referencedRelation: 'secret_ref';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// WEBHOOK SUBSCRIPTION
// ============================================================================

export interface WebhookSubscriptionRow {
  id: string;
  tenant_id: string;
  project_id: string;
  endpoint_id: string;
  event_types: Json | null;
  filter: Json | null;
  enabled: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface WebhookSubscriptionInsert {
  id?: string;
  tenant_id: string;
  project_id: string;
  endpoint_id: string;
  event_types?: Json | null;
  filter?: Json | null;
  enabled?: boolean | null;
  created_at?: string;
  updated_at?: string;
}

export interface WebhookSubscriptionUpdate {
  id?: string;
  tenant_id?: string;
  project_id?: string;
  endpoint_id?: string;
  event_types?: Json | null;
  filter?: Json | null;
  enabled?: boolean | null;
  created_at?: string;
  updated_at?: string;
}

export interface WebhookSubscriptionTable {
  Row: WebhookSubscriptionRow;
  Insert: WebhookSubscriptionInsert;
  Update: WebhookSubscriptionUpdate;
  Relationships: [
    {
      foreignKeyName: 'webhook_subscription_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'webhook_subscription_project_id_fkey';
      columns: ['project_id'];
      referencedRelation: 'project';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'webhook_subscription_endpoint_id_fkey';
      columns: ['endpoint_id'];
      referencedRelation: 'integration_endpoint';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// WEBHOOK DELIVERY
// ============================================================================

export interface WebhookDeliveryRow {
  id: string;
  tenant_id: string;
  subscription_id: string;
  event_type: string;
  payload: Json | null;
  status: WebhookDeliveryStatus;
  attempts: number | null;
  last_error: string | null;
  created_at: string;
  sent_at: string | null;
}

export interface WebhookDeliveryInsert {
  id?: string;
  tenant_id: string;
  subscription_id: string;
  event_type: string;
  payload?: Json | null;
  status?: WebhookDeliveryStatus;
  attempts?: number | null;
  last_error?: string | null;
  created_at?: string;
  sent_at?: string | null;
}

export interface WebhookDeliveryUpdate {
  id?: string;
  tenant_id?: string;
  subscription_id?: string;
  event_type?: string;
  payload?: Json | null;
  status?: WebhookDeliveryStatus;
  attempts?: number | null;
  last_error?: string | null;
  created_at?: string;
  sent_at?: string | null;
}

export interface WebhookDeliveryTable {
  Row: WebhookDeliveryRow;
  Insert: WebhookDeliveryInsert;
  Update: WebhookDeliveryUpdate;
  Relationships: [
    {
      foreignKeyName: 'webhook_delivery_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'webhook_delivery_subscription_id_fkey';
      columns: ['subscription_id'];
      referencedRelation: 'webhook_subscription';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// BILLING ACCOUNT (FINOPS)
// ============================================================================

export interface BillingAccountRow {
  id: string;
  tenant_id: string;
  provider: CloudProvider;
  name: string;
  external_id: string | null;
  currency: string | null;
  config: Json | null;
  created_at: string;
  updated_at: string;
}

export interface BillingAccountInsert {
  id?: string;
  tenant_id: string;
  provider: CloudProvider;
  name: string;
  external_id?: string | null;
  currency?: string | null;
  config?: Json | null;
  created_at?: string;
  updated_at?: string;
}

export interface BillingAccountUpdate {
  id?: string;
  tenant_id?: string;
  provider?: CloudProvider;
  name?: string;
  external_id?: string | null;
  currency?: string | null;
  config?: Json | null;
  created_at?: string;
  updated_at?: string;
}

export interface BillingAccountTable {
  Row: BillingAccountRow;
  Insert: BillingAccountInsert;
  Update: BillingAccountUpdate;
  Relationships: [
    {
      foreignKeyName: 'billing_account_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// COST ALLOCATION RULE
// ============================================================================

export interface CostAllocationRuleRow {
  id: string;
  tenant_id: string;
  name: string;
  rule_type: string; // tag_based|namespace|project_mapping|custom
  expression: Json | null;
  enabled: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface CostAllocationRuleInsert {
  id?: string;
  tenant_id: string;
  name: string;
  rule_type: string;
  expression?: Json | null;
  enabled?: boolean | null;
  created_at?: string;
  updated_at?: string;
}

export interface CostAllocationRuleUpdate {
  id?: string;
  tenant_id?: string;
  name?: string;
  rule_type?: string;
  expression?: Json | null;
  enabled?: boolean | null;
  created_at?: string;
  updated_at?: string;
}

export interface CostAllocationRuleTable {
  Row: CostAllocationRuleRow;
  Insert: CostAllocationRuleInsert;
  Update: CostAllocationRuleUpdate;
  Relationships: [
    {
      foreignKeyName: 'cost_allocation_rule_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// COST RECORD
// ============================================================================

export interface CostRecordRow {
  id: string;
  tenant_id: string;
  billing_account_id: string;
  provider: CloudProvider;
  service: string | null;
  sku: string | null;
  usage_start: string | null;
  usage_end: string | null;
  cost_amount: number | null;
  currency: string | null;
  usage_quantity: number | null;
  usage_unit: string | null;
  tags: Json | null;
  resource_external_id: string | null;
  project_id: string | null;
  run_id: string | null;
  pipeline_id: string | null;
  deployment_id: string | null;
  created_at: string;
}

export interface CostRecordInsert {
  id?: string;
  tenant_id: string;
  billing_account_id: string;
  provider: CloudProvider;
  service?: string | null;
  sku?: string | null;
  usage_start?: string | null;
  usage_end?: string | null;
  cost_amount?: number | null;
  currency?: string | null;
  usage_quantity?: number | null;
  usage_unit?: string | null;
  tags?: Json | null;
  resource_external_id?: string | null;
  project_id?: string | null;
  run_id?: string | null;
  pipeline_id?: string | null;
  deployment_id?: string | null;
  created_at?: string;
}

export interface CostRecordUpdate {
  id?: string;
  tenant_id?: string;
  billing_account_id?: string;
  provider?: CloudProvider;
  service?: string | null;
  sku?: string | null;
  usage_start?: string | null;
  usage_end?: string | null;
  cost_amount?: number | null;
  currency?: string | null;
  usage_quantity?: number | null;
  usage_unit?: string | null;
  tags?: Json | null;
  resource_external_id?: string | null;
  project_id?: string | null;
  run_id?: string | null;
  pipeline_id?: string | null;
  deployment_id?: string | null;
  created_at?: string;
}

export interface CostRecordTable {
  Row: CostRecordRow;
  Insert: CostRecordInsert;
  Update: CostRecordUpdate;
  Relationships: [
    {
      foreignKeyName: 'cost_record_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'cost_record_billing_account_id_fkey';
      columns: ['billing_account_id'];
      referencedRelation: 'billing_account';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'cost_record_project_id_fkey';
      columns: ['project_id'];
      referencedRelation: 'project';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'cost_record_run_id_fkey';
      columns: ['run_id'];
      referencedRelation: 'run';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'cost_record_pipeline_id_fkey';
      columns: ['pipeline_id'];
      referencedRelation: 'cicd_pipeline';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'cost_record_deployment_id_fkey';
      columns: ['deployment_id'];
      referencedRelation: 'model_deployment';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// BUDGET
// ============================================================================

export interface BudgetRow {
  id: string;
  tenant_id: string;
  scope_type: string; // tenant|org|project
  scope_id: string | null;
  name: string;
  period: BudgetPeriod;
  amount: number | null;
  currency: string | null;
  threshold_percentages: Json | null;
  alert_channels: Json | null;
  created_at: string;
  updated_at: string;
}

export interface BudgetInsert {
  id?: string;
  tenant_id: string;
  scope_type: string;
  scope_id?: string | null;
  name: string;
  period: BudgetPeriod;
  amount?: number | null;
  currency?: string | null;
  threshold_percentages?: Json | null;
  alert_channels?: Json | null;
  created_at?: string;
  updated_at?: string;
}

export interface BudgetUpdate {
  id?: string;
  tenant_id?: string;
  scope_type?: string;
  scope_id?: string | null;
  name?: string;
  period?: BudgetPeriod;
  amount?: number | null;
  currency?: string | null;
  threshold_percentages?: Json | null;
  alert_channels?: Json | null;
  created_at?: string;
  updated_at?: string;
}

export interface BudgetTable {
  Row: BudgetRow;
  Insert: BudgetInsert;
  Update: BudgetUpdate;
  Relationships: [
    {
      foreignKeyName: 'budget_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// CARBON RECORD (GREENOPS)
// ============================================================================

export interface CarbonRecordRow {
  id: string;
  tenant_id: string;
  provider: CloudProvider;
  region: string | null;
  start_time: string | null;
  end_time: string | null;
  kwh: number | null;
  co2e_kg: number | null;
  methodology: string | null;
  attribution: Json | null;
  created_at: string;
}

export interface CarbonRecordInsert {
  id?: string;
  tenant_id: string;
  provider: CloudProvider;
  region?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  kwh?: number | null;
  co2e_kg?: number | null;
  methodology?: string | null;
  attribution?: Json | null;
  created_at?: string;
}

export interface CarbonRecordUpdate {
  id?: string;
  tenant_id?: string;
  provider?: CloudProvider;
  region?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  kwh?: number | null;
  co2e_kg?: number | null;
  methodology?: string | null;
  attribution?: Json | null;
  created_at?: string;
}

export interface CarbonRecordTable {
  Row: CarbonRecordRow;
  Insert: CarbonRecordInsert;
  Update: CarbonRecordUpdate;
  Relationships: [
    {
      foreignKeyName: 'carbon_record_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// EFFICIENCY KPI SNAPSHOT
// ============================================================================

export interface EfficiencyKPISnapshotRow {
  id: string;
  tenant_id: string;
  project_id: string;
  date_key: string;
  cpu_hours: number | null;
  gpu_hours: number | null;
  cost_amount: number | null;
  co2e_kg: number | null;
  success_rate: number | null;
  mean_duration_sec: number | null;
  created_at: string;
}

export interface EfficiencyKPISnapshotInsert {
  id?: string;
  tenant_id: string;
  project_id: string;
  date_key: string;
  cpu_hours?: number | null;
  gpu_hours?: number | null;
  cost_amount?: number | null;
  co2e_kg?: number | null;
  success_rate?: number | null;
  mean_duration_sec?: number | null;
  created_at?: string;
}

export interface EfficiencyKPISnapshotUpdate {
  id?: string;
  tenant_id?: string;
  project_id?: string;
  date_key?: string;
  cpu_hours?: number | null;
  gpu_hours?: number | null;
  cost_amount?: number | null;
  co2e_kg?: number | null;
  success_rate?: number | null;
  mean_duration_sec?: number | null;
  created_at?: string;
}

export interface EfficiencyKPISnapshotTable {
  Row: EfficiencyKPISnapshotRow;
  Insert: EfficiencyKPISnapshotInsert;
  Update: EfficiencyKPISnapshotUpdate;
  Relationships: [
    {
      foreignKeyName: 'efficiency_kpi_snapshot_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'efficiency_kpi_snapshot_project_id_fkey';
      columns: ['project_id'];
      referencedRelation: 'project';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// AI SYSTEM (AI GOVERNANCE - EU AI ACT)
// ============================================================================

export interface AISystemRow {
  id: string;
  tenant_id: string;
  project_id: string;
  name: string;
  description: string | null;
  risk_class: AIRiskClass;
  intended_purpose: string | null;
  users_affected: string | null;
  deployment_context: string | null;
  owner_user_id: string | null;
  status: AISystemStatus;
  created_at: string;
  updated_at: string;
}

export interface AISystemInsert {
  id?: string;
  tenant_id: string;
  project_id: string;
  name: string;
  description?: string | null;
  risk_class?: AIRiskClass;
  intended_purpose?: string | null;
  users_affected?: string | null;
  deployment_context?: string | null;
  owner_user_id?: string | null;
  status?: AISystemStatus;
  created_at?: string;
  updated_at?: string;
}

export interface AISystemUpdate {
  id?: string;
  tenant_id?: string;
  project_id?: string;
  name?: string;
  description?: string | null;
  risk_class?: AIRiskClass;
  intended_purpose?: string | null;
  users_affected?: string | null;
  deployment_context?: string | null;
  owner_user_id?: string | null;
  status?: AISystemStatus;
  created_at?: string;
  updated_at?: string;
}

export interface AISystemTable {
  Row: AISystemRow;
  Insert: AISystemInsert;
  Update: AISystemUpdate;
  Relationships: [
    {
      foreignKeyName: 'ai_system_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'ai_system_project_id_fkey';
      columns: ['project_id'];
      referencedRelation: 'project';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'ai_system_owner_user_id_fkey';
      columns: ['owner_user_id'];
      referencedRelation: 'user_account';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// MODEL CARD
// ============================================================================

export interface ModelCardRow {
  id: string;
  tenant_id: string;
  model_version_id: string;
  ai_system_id: string | null;
  summary: string | null;
  training_data: string | null;
  evaluation_data: string | null;
  performance: Json | null;
  limitations: string | null;
  ethical_considerations: string | null;
  caveats: string | null;
  version: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface ModelCardInsert {
  id?: string;
  tenant_id: string;
  model_version_id: string;
  ai_system_id?: string | null;
  summary?: string | null;
  training_data?: string | null;
  evaluation_data?: string | null;
  performance?: Json | null;
  limitations?: string | null;
  ethical_considerations?: string | null;
  caveats?: string | null;
  version?: string | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
}

export interface ModelCardUpdate {
  id?: string;
  tenant_id?: string;
  model_version_id?: string;
  ai_system_id?: string | null;
  summary?: string | null;
  training_data?: string | null;
  evaluation_data?: string | null;
  performance?: Json | null;
  limitations?: string | null;
  ethical_considerations?: string | null;
  caveats?: string | null;
  version?: string | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
}

export interface ModelCardTable {
  Row: ModelCardRow;
  Insert: ModelCardInsert;
  Update: ModelCardUpdate;
  Relationships: [
    {
      foreignKeyName: 'model_card_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'model_card_model_version_id_fkey';
      columns: ['model_version_id'];
      referencedRelation: 'model_version';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'model_card_ai_system_id_fkey';
      columns: ['ai_system_id'];
      referencedRelation: 'ai_system';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// RISK ASSESSMENT
// ============================================================================

export interface RiskAssessmentRow {
  id: string;
  tenant_id: string;
  ai_system_id: string;
  methodology: string | null;
  hazards: Json | null;
  mitigations: Json | null;
  residual_risk: string | null; // low|medium|high
  decision: string | null;
  assessor_user_id: string | null;
  assessed_at: string | null;
  next_review_at: string | null;
}

export interface RiskAssessmentInsert {
  id?: string;
  tenant_id: string;
  ai_system_id: string;
  methodology?: string | null;
  hazards?: Json | null;
  mitigations?: Json | null;
  residual_risk?: string | null;
  decision?: string | null;
  assessor_user_id?: string | null;
  assessed_at?: string | null;
  next_review_at?: string | null;
}

export interface RiskAssessmentUpdate {
  id?: string;
  tenant_id?: string;
  ai_system_id?: string;
  methodology?: string | null;
  hazards?: Json | null;
  mitigations?: Json | null;
  residual_risk?: string | null;
  decision?: string | null;
  assessor_user_id?: string | null;
  assessed_at?: string | null;
  next_review_at?: string | null;
}

export interface RiskAssessmentTable {
  Row: RiskAssessmentRow;
  Insert: RiskAssessmentInsert;
  Update: RiskAssessmentUpdate;
  Relationships: [
    {
      foreignKeyName: 'risk_assessment_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'risk_assessment_ai_system_id_fkey';
      columns: ['ai_system_id'];
      referencedRelation: 'ai_system';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'risk_assessment_assessor_user_id_fkey';
      columns: ['assessor_user_id'];
      referencedRelation: 'user_account';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// COMPLIANCE CONTROL
// ============================================================================

export interface ComplianceControlRow {
  id: string;
  tenant_id: string;
  framework: string; // eu_ai_act|gdpr|iso27001|iso23894|...
  control_code: string;
  title: string | null;
  description: string | null;
  evidence_required: string | null;
  created_at: string;
}

export interface ComplianceControlInsert {
  id?: string;
  tenant_id: string;
  framework: string;
  control_code: string;
  title?: string | null;
  description?: string | null;
  evidence_required?: string | null;
  created_at?: string;
}

export interface ComplianceControlUpdate {
  id?: string;
  tenant_id?: string;
  framework?: string;
  control_code?: string;
  title?: string | null;
  description?: string | null;
  evidence_required?: string | null;
  created_at?: string;
}

export interface ComplianceControlTable {
  Row: ComplianceControlRow;
  Insert: ComplianceControlInsert;
  Update: ComplianceControlUpdate;
  Relationships: [
    {
      foreignKeyName: 'compliance_control_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// COMPLIANCE EVIDENCE
// ============================================================================

export interface ComplianceEvidenceRow {
  id: string;
  tenant_id: string;
  control_id: string;
  entity_type: string; // ai_system|model_version|deployment|pipeline|policy
  entity_id: string;
  artifact_id: string | null;
  notes: string | null;
  status: ComplianceEvidenceStatus;
  created_at: string;
  validated_at: string | null;
  validated_by: string | null;
}

export interface ComplianceEvidenceInsert {
  id?: string;
  tenant_id: string;
  control_id: string;
  entity_type: string;
  entity_id: string;
  artifact_id?: string | null;
  notes?: string | null;
  status?: ComplianceEvidenceStatus;
  created_at?: string;
  validated_at?: string | null;
  validated_by?: string | null;
}

export interface ComplianceEvidenceUpdate {
  id?: string;
  tenant_id?: string;
  control_id?: string;
  entity_type?: string;
  entity_id?: string;
  artifact_id?: string | null;
  notes?: string | null;
  status?: ComplianceEvidenceStatus;
  created_at?: string;
  validated_at?: string | null;
  validated_by?: string | null;
}

export interface ComplianceEvidenceTable {
  Row: ComplianceEvidenceRow;
  Insert: ComplianceEvidenceInsert;
  Update: ComplianceEvidenceUpdate;
  Relationships: [
    {
      foreignKeyName: 'compliance_evidence_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'compliance_evidence_control_id_fkey';
      columns: ['control_id'];
      referencedRelation: 'compliance_control';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'compliance_evidence_artifact_id_fkey';
      columns: ['artifact_id'];
      referencedRelation: 'artifact';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// MONITORING PLAN
// ============================================================================

export interface MonitoringPlanRow {
  id: string;
  tenant_id: string;
  ai_system_id: string;
  plan: Json | null;
  active: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface MonitoringPlanInsert {
  id?: string;
  tenant_id: string;
  ai_system_id: string;
  plan?: Json | null;
  active?: boolean | null;
  created_at?: string;
  updated_at?: string;
}

export interface MonitoringPlanUpdate {
  id?: string;
  tenant_id?: string;
  ai_system_id?: string;
  plan?: Json | null;
  active?: boolean | null;
  created_at?: string;
  updated_at?: string;
}

export interface MonitoringPlanTable {
  Row: MonitoringPlanRow;
  Insert: MonitoringPlanInsert;
  Update: MonitoringPlanUpdate;
  Relationships: [
    {
      foreignKeyName: 'monitoring_plan_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'monitoring_plan_ai_system_id_fkey';
      columns: ['ai_system_id'];
      referencedRelation: 'ai_system';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// GOVERNANCE INCIDENT
// ============================================================================

export interface GovernanceIncidentRow {
  id: string;
  tenant_id: string;
  ai_system_id: string;
  model_deployment_id: string | null;
  type: GovernanceIncidentType;
  severity: string | null;
  description: string | null;
  detected_at: string | null;
  status: GovernanceIncidentStatus;
  resolution: string | null;
  closed_at: string | null;
  owner_user_id: string | null;
}

export interface GovernanceIncidentInsert {
  id?: string;
  tenant_id: string;
  ai_system_id: string;
  model_deployment_id?: string | null;
  type: GovernanceIncidentType;
  severity?: string | null;
  description?: string | null;
  detected_at?: string | null;
  status?: GovernanceIncidentStatus;
  resolution?: string | null;
  closed_at?: string | null;
  owner_user_id?: string | null;
}

export interface GovernanceIncidentUpdate {
  id?: string;
  tenant_id?: string;
  ai_system_id?: string;
  model_deployment_id?: string | null;
  type?: GovernanceIncidentType;
  severity?: string | null;
  description?: string | null;
  detected_at?: string | null;
  status?: GovernanceIncidentStatus;
  resolution?: string | null;
  closed_at?: string | null;
  owner_user_id?: string | null;
}

export interface GovernanceIncidentTable {
  Row: GovernanceIncidentRow;
  Insert: GovernanceIncidentInsert;
  Update: GovernanceIncidentUpdate;
  Relationships: [
    {
      foreignKeyName: 'governance_incident_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'governance_incident_ai_system_id_fkey';
      columns: ['ai_system_id'];
      referencedRelation: 'ai_system';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'governance_incident_model_deployment_id_fkey';
      columns: ['model_deployment_id'];
      referencedRelation: 'model_deployment';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'governance_incident_owner_user_id_fkey';
      columns: ['owner_user_id'];
      referencedRelation: 'user_account';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// DATA CONTRACT
// ============================================================================

export interface DataContractRow {
  id: string;
  tenant_id: string;
  project_id: string;
  name: string;
  version: string | null;
  schema: Json | null;
  sla: Json | null;
  privacy_classification: PrivacyClassification | null;
  retention_days: number | null;
  owner_user_id: string | null;
  status: string | null; // draft|active|deprecated
  created_at: string;
  updated_at: string;
}

export interface DataContractInsert {
  id?: string;
  tenant_id: string;
  project_id: string;
  name: string;
  version?: string | null;
  schema?: Json | null;
  sla?: Json | null;
  privacy_classification?: PrivacyClassification | null;
  retention_days?: number | null;
  owner_user_id?: string | null;
  status?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DataContractUpdate {
  id?: string;
  tenant_id?: string;
  project_id?: string;
  name?: string;
  version?: string | null;
  schema?: Json | null;
  sla?: Json | null;
  privacy_classification?: PrivacyClassification | null;
  retention_days?: number | null;
  owner_user_id?: string | null;
  status?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DataContractTable {
  Row: DataContractRow;
  Insert: DataContractInsert;
  Update: DataContractUpdate;
  Relationships: [
    {
      foreignKeyName: 'data_contract_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'data_contract_project_id_fkey';
      columns: ['project_id'];
      referencedRelation: 'project';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'data_contract_owner_user_id_fkey';
      columns: ['owner_user_id'];
      referencedRelation: 'user_account';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// DATA CONTRACT BINDING
// ============================================================================

export interface DataContractBindingRow {
  id: string;
  tenant_id: string;
  contract_id: string;
  entity_type: string; // run|pipeline_definition|model_version|data_connection
  entity_id: string;
  created_at: string;
}

export interface DataContractBindingInsert {
  id?: string;
  tenant_id: string;
  contract_id: string;
  entity_type: string;
  entity_id: string;
  created_at?: string;
}

export interface DataContractBindingUpdate {
  id?: string;
  tenant_id?: string;
  contract_id?: string;
  entity_type?: string;
  entity_id?: string;
  created_at?: string;
}

export interface DataContractBindingTable {
  Row: DataContractBindingRow;
  Insert: DataContractBindingInsert;
  Update: DataContractBindingUpdate;
  Relationships: [
    {
      foreignKeyName: 'data_contract_binding_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'data_contract_binding_contract_id_fkey';
      columns: ['contract_id'];
      referencedRelation: 'data_contract';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// DASHBOARD
// ============================================================================

export interface DashboardRow {
  id: string;
  tenant_id: string;
  project_id: string;
  name: string;
  description: string | null;
  layout: Json | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface DashboardInsert {
  id?: string;
  tenant_id: string;
  project_id: string;
  name: string;
  description?: string | null;
  layout?: Json | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface DashboardUpdate {
  id?: string;
  tenant_id?: string;
  project_id?: string;
  name?: string;
  description?: string | null;
  layout?: Json | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface DashboardTable {
  Row: DashboardRow;
  Insert: DashboardInsert;
  Update: DashboardUpdate;
  Relationships: [
    {
      foreignKeyName: 'dashboard_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'dashboard_project_id_fkey';
      columns: ['project_id'];
      referencedRelation: 'project';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// DASHBOARD WIDGET
// ============================================================================

export interface DashboardWidgetRow {
  id: string;
  tenant_id: string;
  dashboard_id: string;
  type: string; // kpi|chart|table|feed|status|cost|carbon|cicd|gitops
  config: Json | null;
  position: Json | null;
}

export interface DashboardWidgetInsert {
  id?: string;
  tenant_id: string;
  dashboard_id: string;
  type: string;
  config?: Json | null;
  position?: Json | null;
}

export interface DashboardWidgetUpdate {
  id?: string;
  tenant_id?: string;
  dashboard_id?: string;
  type?: string;
  config?: Json | null;
  position?: Json | null;
}

export interface DashboardWidgetTable {
  Row: DashboardWidgetRow;
  Insert: DashboardWidgetInsert;
  Update: DashboardWidgetUpdate;
  Relationships: [
    {
      foreignKeyName: 'dashboard_widget_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'dashboard_widget_dashboard_id_fkey';
      columns: ['dashboard_id'];
      referencedRelation: 'dashboard';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// EXECUTION LINK
// ============================================================================

export interface ExecutionLinkRow {
  id: string;
  tenant_id: string;
  project_id: string;
  source_type: string; // cicd_pipeline|cicd_job|pipeline_run|iac_run|argocd_application
  source_id: string;
  target_type: string; // run|environment_build|model_version|model_deployment|managed_resource
  target_id: string;
  relation: string; // triggers|produces|deploys|updates|observes
  created_at: string;
}

export interface ExecutionLinkInsert {
  id?: string;
  tenant_id: string;
  project_id: string;
  source_type: string;
  source_id: string;
  target_type: string;
  target_id: string;
  relation: string;
  created_at?: string;
}

export interface ExecutionLinkUpdate {
  id?: string;
  tenant_id?: string;
  project_id?: string;
  source_type?: string;
  source_id?: string;
  target_type?: string;
  target_id?: string;
  relation?: string;
  created_at?: string;
}

export interface ExecutionLinkTable {
  Row: ExecutionLinkRow;
  Insert: ExecutionLinkInsert;
  Update: ExecutionLinkUpdate;
  Relationships: [
    {
      foreignKeyName: 'execution_link_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'execution_link_project_id_fkey';
      columns: ['project_id'];
      referencedRelation: 'project';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// ADVANCED TABLES COLLECTION
// ============================================================================

export interface AdvancedTables {
  // Pipelines DAG
  pipeline_definition: PipelineDefinitionTable;
  pipeline_node: PipelineNodeTable;
  pipeline_edge: PipelineEdgeTable;
  pipeline_run: PipelineRunTable;
  pipeline_run_node: PipelineRunNodeTable;
  pipeline_schedule: PipelineScheduleTable;
  // OPA/Rego
  policy_bundle: PolicyBundleTable;
  policy_assignment: PolicyAssignmentTable;
  policy_decision_log: PolicyDecisionLogTable;
  // Catalog/Templates
  catalog_item: CatalogItemTable;
  catalog_item_dependency: CatalogItemDependencyTable;
  template_instance: TemplateInstanceTable;
  // Resource Inventory
  managed_resource: ManagedResourceTable;
  resource_relation: ResourceRelationTable;
  drift_event: DriftEventTable;
  // IaC/Terraform
  iac_workspace: IaCWorkspaceTable;
  iac_run: IaCRunTable;
  iac_change_summary: IaCChangeSummaryTable;
  // Observability
  observability_backend: ObservabilityBackendTable;
  observability_link: ObservabilityLinkTable;
  // Incidents/SLA
  incident: IncidentTable;
  incident_update: IncidentUpdateTable;
  sla_policy: SLAPolicyTable;
  // Webhooks/Integrations
  integration_endpoint: IntegrationEndpointTable;
  webhook_subscription: WebhookSubscriptionTable;
  webhook_delivery: WebhookDeliveryTable;
  // FinOps/GreenOps
  billing_account: BillingAccountTable;
  cost_allocation_rule: CostAllocationRuleTable;
  cost_record: CostRecordTable;
  budget: BudgetTable;
  carbon_record: CarbonRecordTable;
  efficiency_kpi_snapshot: EfficiencyKPISnapshotTable;
  // AI Governance
  ai_system: AISystemTable;
  model_card: ModelCardTable;
  risk_assessment: RiskAssessmentTable;
  compliance_control: ComplianceControlTable;
  compliance_evidence: ComplianceEvidenceTable;
  monitoring_plan: MonitoringPlanTable;
  governance_incident: GovernanceIncidentTable;
  // Data Contracts
  data_contract: DataContractTable;
  data_contract_binding: DataContractBindingTable;
  // Dashboards
  dashboard: DashboardTable;
  dashboard_widget: DashboardWidgetTable;
  // Execution Links
  execution_link: ExecutionLinkTable;
}
