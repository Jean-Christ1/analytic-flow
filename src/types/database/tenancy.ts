/**
 * Tenancy Database Types
 *
 * Multi-tenant hierarchy: Tenant > Organization > Project
 * Includes project management features: milestones, kanban boards, work items
 */

import type {
  Json,
  TenantStatus,
  TenantTier,
  ProjectVisibility,
  ProjectLifecycle,
  Criticality,
  ProgressStatus,
  MilestoneStatus,
  WorkItemType,
  WorkItemStatus,
  Priority,
  Severity,
} from './common';

// ============================================================================
// TENANT
// ============================================================================

export interface TenantRow {
  id: string;
  slug: string;
  name: string;
  status: TenantStatus;
  tier: TenantTier;
  timezone: string | null;
  locale: string | null;
  created_at: string;
  updated_at: string;
}

export interface TenantInsert {
  id?: string;
  slug: string;
  name: string;
  status?: TenantStatus;
  tier?: TenantTier;
  timezone?: string | null;
  locale?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface TenantUpdate {
  id?: string;
  slug?: string;
  name?: string;
  status?: TenantStatus;
  tier?: TenantTier;
  timezone?: string | null;
  locale?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface TenantTable {
  Row: TenantRow;
  Insert: TenantInsert;
  Update: TenantUpdate;
  Relationships: [];
}

// ============================================================================
// ORGANIZATION
// ============================================================================

export interface OrgRow {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrgInsert {
  id?: string;
  tenant_id: string;
  name: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface OrgUpdate {
  id?: string;
  tenant_id?: string;
  name?: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface OrgTable {
  Row: OrgRow;
  Insert: OrgInsert;
  Update: OrgUpdate;
  Relationships: [
    {
      foreignKeyName: 'org_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// PROJECT
// ============================================================================

export interface ProjectRow {
  id: string;
  tenant_id: string;
  org_id: string;
  key: string;
  name: string;
  description: string | null;
  visibility: ProjectVisibility;
  lifecycle_status: ProjectLifecycle;
  criticality: Criticality;
  default_k8s_namespace: string | null;
  tags: Json | null;
  metadata: Json | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  archived_at: string | null;
}

export interface ProjectInsert {
  id?: string;
  tenant_id: string;
  org_id: string;
  key: string;
  name: string;
  description?: string | null;
  visibility?: ProjectVisibility;
  lifecycle_status?: ProjectLifecycle;
  criticality?: Criticality;
  default_k8s_namespace?: string | null;
  tags?: Json | null;
  metadata?: Json | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
  archived_at?: string | null;
}

export interface ProjectUpdate {
  id?: string;
  tenant_id?: string;
  org_id?: string;
  key?: string;
  name?: string;
  description?: string | null;
  visibility?: ProjectVisibility;
  lifecycle_status?: ProjectLifecycle;
  criticality?: Criticality;
  default_k8s_namespace?: string | null;
  tags?: Json | null;
  metadata?: Json | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
  archived_at?: string | null;
}

export interface ProjectTable {
  Row: ProjectRow;
  Insert: ProjectInsert;
  Update: ProjectUpdate;
  Relationships: [
    {
      foreignKeyName: 'project_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'project_org_id_fkey';
      columns: ['org_id'];
      referencedRelation: 'org';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// PROJECT PROGRESS SNAPSHOT
// ============================================================================

export interface ProjectProgressSnapshotRow {
  id: string;
  tenant_id: string;
  project_id: string;
  date_key: string;
  progress_percent: number;
  status: ProgressStatus;
  summary: string | null;
  risks: string | null;
  blockers: string | null;
  next_steps: string | null;
  kpis: Json | null;
  created_at: string;
  created_by: string | null;
}

export interface ProjectProgressSnapshotInsert {
  id?: string;
  tenant_id: string;
  project_id: string;
  date_key: string;
  progress_percent: number;
  status?: ProgressStatus;
  summary?: string | null;
  risks?: string | null;
  blockers?: string | null;
  next_steps?: string | null;
  kpis?: Json | null;
  created_at?: string;
  created_by?: string | null;
}

export interface ProjectProgressSnapshotUpdate {
  id?: string;
  tenant_id?: string;
  project_id?: string;
  date_key?: string;
  progress_percent?: number;
  status?: ProgressStatus;
  summary?: string | null;
  risks?: string | null;
  blockers?: string | null;
  next_steps?: string | null;
  kpis?: Json | null;
  created_at?: string;
  created_by?: string | null;
}

export interface ProjectProgressSnapshotTable {
  Row: ProjectProgressSnapshotRow;
  Insert: ProjectProgressSnapshotInsert;
  Update: ProjectProgressSnapshotUpdate;
  Relationships: [
    {
      foreignKeyName: 'project_progress_snapshot_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'project_progress_snapshot_project_id_fkey';
      columns: ['project_id'];
      referencedRelation: 'project';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// MILESTONE
// ============================================================================

export interface MilestoneRow {
  id: string;
  tenant_id: string;
  project_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: MilestoneStatus;
  weight: number | null;
  progress_percent: number | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface MilestoneInsert {
  id?: string;
  tenant_id: string;
  project_id: string;
  title: string;
  description?: string | null;
  due_date?: string | null;
  status?: MilestoneStatus;
  weight?: number | null;
  progress_percent?: number | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface MilestoneUpdate {
  id?: string;
  tenant_id?: string;
  project_id?: string;
  title?: string;
  description?: string | null;
  due_date?: string | null;
  status?: MilestoneStatus;
  weight?: number | null;
  progress_percent?: number | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface MilestoneTable {
  Row: MilestoneRow;
  Insert: MilestoneInsert;
  Update: MilestoneUpdate;
  Relationships: [
    {
      foreignKeyName: 'milestone_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'milestone_project_id_fkey';
      columns: ['project_id'];
      referencedRelation: 'project';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// KANBAN BOARD
// ============================================================================

export interface KanbanBoardRow {
  id: string;
  tenant_id: string;
  project_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface KanbanBoardInsert {
  id?: string;
  tenant_id: string;
  project_id: string;
  name: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface KanbanBoardUpdate {
  id?: string;
  tenant_id?: string;
  project_id?: string;
  name?: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface KanbanBoardTable {
  Row: KanbanBoardRow;
  Insert: KanbanBoardInsert;
  Update: KanbanBoardUpdate;
  Relationships: [
    {
      foreignKeyName: 'kanban_board_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'kanban_board_project_id_fkey';
      columns: ['project_id'];
      referencedRelation: 'project';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// KANBAN COLUMN
// ============================================================================

export interface KanbanColumnRow {
  id: string;
  tenant_id: string;
  board_id: string;
  name: string;
  position: number;
  wip_limit: number | null;
}

export interface KanbanColumnInsert {
  id?: string;
  tenant_id: string;
  board_id: string;
  name: string;
  position: number;
  wip_limit?: number | null;
}

export interface KanbanColumnUpdate {
  id?: string;
  tenant_id?: string;
  board_id?: string;
  name?: string;
  position?: number;
  wip_limit?: number | null;
}

export interface KanbanColumnTable {
  Row: KanbanColumnRow;
  Insert: KanbanColumnInsert;
  Update: KanbanColumnUpdate;
  Relationships: [
    {
      foreignKeyName: 'kanban_column_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'kanban_column_board_id_fkey';
      columns: ['board_id'];
      referencedRelation: 'kanban_board';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// WORK ITEM
// ============================================================================

export interface WorkItemRow {
  id: string;
  tenant_id: string;
  project_id: string;
  board_id: string | null;
  column_id: string | null;
  type: WorkItemType;
  title: string;
  description: string | null;
  status: WorkItemStatus;
  priority: Priority;
  severity: Severity | null;
  labels: Json | null;
  assignee_user_id: string | null;
  reporter_user_id: string | null;
  due_date: string | null;
  estimate_points: number | null;
  progress_percent: number | null;
  external_refs: Json | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  closed_at: string | null;
}

export interface WorkItemInsert {
  id?: string;
  tenant_id: string;
  project_id: string;
  board_id?: string | null;
  column_id?: string | null;
  type: WorkItemType;
  title: string;
  description?: string | null;
  status?: WorkItemStatus;
  priority?: Priority;
  severity?: Severity | null;
  labels?: Json | null;
  assignee_user_id?: string | null;
  reporter_user_id?: string | null;
  due_date?: string | null;
  estimate_points?: number | null;
  progress_percent?: number | null;
  external_refs?: Json | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
  closed_at?: string | null;
}

export interface WorkItemUpdate {
  id?: string;
  tenant_id?: string;
  project_id?: string;
  board_id?: string | null;
  column_id?: string | null;
  type?: WorkItemType;
  title?: string;
  description?: string | null;
  status?: WorkItemStatus;
  priority?: Priority;
  severity?: Severity | null;
  labels?: Json | null;
  assignee_user_id?: string | null;
  reporter_user_id?: string | null;
  due_date?: string | null;
  estimate_points?: number | null;
  progress_percent?: number | null;
  external_refs?: Json | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
  closed_at?: string | null;
}

export interface WorkItemTable {
  Row: WorkItemRow;
  Insert: WorkItemInsert;
  Update: WorkItemUpdate;
  Relationships: [
    {
      foreignKeyName: 'work_item_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'work_item_project_id_fkey';
      columns: ['project_id'];
      referencedRelation: 'project';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'work_item_board_id_fkey';
      columns: ['board_id'];
      referencedRelation: 'kanban_board';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'work_item_column_id_fkey';
      columns: ['column_id'];
      referencedRelation: 'kanban_column';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// TENANCY TABLES COLLECTION
// ============================================================================

export interface TenancyTables {
  tenant: TenantTable;
  org: OrgTable;
  project: ProjectTable;
  project_progress_snapshot: ProjectProgressSnapshotTable;
  milestone: MilestoneTable;
  kanban_board: KanbanBoardTable;
  kanban_column: KanbanColumnTable;
  work_item: WorkItemTable;
}
