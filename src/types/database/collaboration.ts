/**
 * Collaboration Database Types
 *
 * Comment threads, comments, notifications, activity events,
 * attachments, approvals, audit events, and event outbox.
 */

import type {
  Json,
  NotificationType,
  NotificationChannel,
  ApprovalStatus,
  ApprovalDecisionType,
  AuditActorType,
  EventOutboxStatus,
} from './common';

// ============================================================================
// COMMENT THREAD
// ============================================================================

export interface CommentThreadRow {
  id: string;
  tenant_id: string;
  project_id: string;
  entity_type: string; // project|run|model|deployment|work_item|pipeline|argocd_app|resource
  entity_id: string;
  title: string | null;
  created_at: string;
  created_by: string | null;
}

export interface CommentThreadInsert {
  id?: string;
  tenant_id: string;
  project_id: string;
  entity_type: string;
  entity_id: string;
  title?: string | null;
  created_at?: string;
  created_by?: string | null;
}

export interface CommentThreadUpdate {
  id?: string;
  tenant_id?: string;
  project_id?: string;
  entity_type?: string;
  entity_id?: string;
  title?: string | null;
  created_at?: string;
  created_by?: string | null;
}

export interface CommentThreadTable {
  Row: CommentThreadRow;
  Insert: CommentThreadInsert;
  Update: CommentThreadUpdate;
  Relationships: [
    {
      foreignKeyName: 'comment_thread_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'comment_thread_project_id_fkey';
      columns: ['project_id'];
      referencedRelation: 'project';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// COMMENT
// ============================================================================

export interface CommentRow {
  id: string;
  tenant_id: string;
  thread_id: string;
  author_user_id: string;
  body: string | null;
  mentions: Json | null;
  attachments: Json | null;
  created_at: string;
  updated_at: string;
  edited: boolean | null;
  deleted_at: string | null;
}

export interface CommentInsert {
  id?: string;
  tenant_id: string;
  thread_id: string;
  author_user_id: string;
  body?: string | null;
  mentions?: Json | null;
  attachments?: Json | null;
  created_at?: string;
  updated_at?: string;
  edited?: boolean | null;
  deleted_at?: string | null;
}

export interface CommentUpdate {
  id?: string;
  tenant_id?: string;
  thread_id?: string;
  author_user_id?: string;
  body?: string | null;
  mentions?: Json | null;
  attachments?: Json | null;
  created_at?: string;
  updated_at?: string;
  edited?: boolean | null;
  deleted_at?: string | null;
}

export interface CommentTable {
  Row: CommentRow;
  Insert: CommentInsert;
  Update: CommentUpdate;
  Relationships: [
    {
      foreignKeyName: 'comment_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'comment_thread_id_fkey';
      columns: ['thread_id'];
      referencedRelation: 'comment_thread';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'comment_author_user_id_fkey';
      columns: ['author_user_id'];
      referencedRelation: 'user_account';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// NOTIFICATION
// ============================================================================

export interface NotificationRow {
  id: string;
  tenant_id: string;
  user_id: string;
  type: NotificationType;
  title: string | null;
  message: string | null;
  entity_type: string | null;
  entity_id: string | null;
  channel: NotificationChannel | null;
  read_at: string | null;
  created_at: string;
}

export interface NotificationInsert {
  id?: string;
  tenant_id: string;
  user_id: string;
  type: NotificationType;
  title?: string | null;
  message?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  channel?: NotificationChannel | null;
  read_at?: string | null;
  created_at?: string;
}

export interface NotificationUpdate {
  id?: string;
  tenant_id?: string;
  user_id?: string;
  type?: NotificationType;
  title?: string | null;
  message?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  channel?: NotificationChannel | null;
  read_at?: string | null;
  created_at?: string;
}

export interface NotificationTable {
  Row: NotificationRow;
  Insert: NotificationInsert;
  Update: NotificationUpdate;
  Relationships: [
    {
      foreignKeyName: 'notification_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'notification_user_id_fkey';
      columns: ['user_id'];
      referencedRelation: 'user_account';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// ACTIVITY EVENT
// ============================================================================

export interface ActivityEventRow {
  id: string;
  tenant_id: string;
  project_id: string | null;
  actor_user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  payload: Json | null;
  created_at: string;
}

export interface ActivityEventInsert {
  id?: string;
  tenant_id: string;
  project_id?: string | null;
  actor_user_id?: string | null;
  action: string;
  entity_type?: string | null;
  entity_id?: string | null;
  payload?: Json | null;
  created_at?: string;
}

export interface ActivityEventUpdate {
  id?: string;
  tenant_id?: string;
  project_id?: string | null;
  actor_user_id?: string | null;
  action?: string;
  entity_type?: string | null;
  entity_id?: string | null;
  payload?: Json | null;
  created_at?: string;
}

export interface ActivityEventTable {
  Row: ActivityEventRow;
  Insert: ActivityEventInsert;
  Update: ActivityEventUpdate;
  Relationships: [
    {
      foreignKeyName: 'activity_event_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'activity_event_project_id_fkey';
      columns: ['project_id'];
      referencedRelation: 'project';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'activity_event_actor_user_id_fkey';
      columns: ['actor_user_id'];
      referencedRelation: 'user_account';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// ATTACHMENT
// ============================================================================

export interface AttachmentRow {
  id: string;
  tenant_id: string;
  project_id: string;
  entity_type: string | null;
  entity_id: string | null;
  artifact_id: string | null;
  filename: string | null;
  created_at: string;
  created_by: string | null;
}

export interface AttachmentInsert {
  id?: string;
  tenant_id: string;
  project_id: string;
  entity_type?: string | null;
  entity_id?: string | null;
  artifact_id?: string | null;
  filename?: string | null;
  created_at?: string;
  created_by?: string | null;
}

export interface AttachmentUpdate {
  id?: string;
  tenant_id?: string;
  project_id?: string;
  entity_type?: string | null;
  entity_id?: string | null;
  artifact_id?: string | null;
  filename?: string | null;
  created_at?: string;
  created_by?: string | null;
}

export interface AttachmentTable {
  Row: AttachmentRow;
  Insert: AttachmentInsert;
  Update: AttachmentUpdate;
  Relationships: [
    {
      foreignKeyName: 'attachment_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'attachment_project_id_fkey';
      columns: ['project_id'];
      referencedRelation: 'project';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'attachment_artifact_id_fkey';
      columns: ['artifact_id'];
      referencedRelation: 'artifact';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// APPROVAL REQUEST
// ============================================================================

export interface ApprovalRequestRow {
  id: string;
  tenant_id: string;
  project_id: string;
  entity_type: string; // model_version|deployment|release|pipeline|policy|catalog_item
  entity_id: string;
  requested_by: string | null;
  status: ApprovalStatus;
  required_approvers: Json | null;
  rationale: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApprovalRequestInsert {
  id?: string;
  tenant_id: string;
  project_id: string;
  entity_type: string;
  entity_id: string;
  requested_by?: string | null;
  status?: ApprovalStatus;
  required_approvers?: Json | null;
  rationale?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ApprovalRequestUpdate {
  id?: string;
  tenant_id?: string;
  project_id?: string;
  entity_type?: string;
  entity_id?: string;
  requested_by?: string | null;
  status?: ApprovalStatus;
  required_approvers?: Json | null;
  rationale?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ApprovalRequestTable {
  Row: ApprovalRequestRow;
  Insert: ApprovalRequestInsert;
  Update: ApprovalRequestUpdate;
  Relationships: [
    {
      foreignKeyName: 'approval_request_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'approval_request_project_id_fkey';
      columns: ['project_id'];
      referencedRelation: 'project';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// APPROVAL DECISION
// ============================================================================

export interface ApprovalDecisionRow {
  id: string;
  tenant_id: string;
  approval_request_id: string;
  approver_user_id: string;
  decision: ApprovalDecisionType;
  comment: string | null;
  decided_at: string | null;
}

export interface ApprovalDecisionInsert {
  id?: string;
  tenant_id: string;
  approval_request_id: string;
  approver_user_id: string;
  decision: ApprovalDecisionType;
  comment?: string | null;
  decided_at?: string | null;
}

export interface ApprovalDecisionUpdate {
  id?: string;
  tenant_id?: string;
  approval_request_id?: string;
  approver_user_id?: string;
  decision?: ApprovalDecisionType;
  comment?: string | null;
  decided_at?: string | null;
}

export interface ApprovalDecisionTable {
  Row: ApprovalDecisionRow;
  Insert: ApprovalDecisionInsert;
  Update: ApprovalDecisionUpdate;
  Relationships: [
    {
      foreignKeyName: 'approval_decision_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'approval_decision_approval_request_id_fkey';
      columns: ['approval_request_id'];
      referencedRelation: 'approval_request';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'approval_decision_approver_user_id_fkey';
      columns: ['approver_user_id'];
      referencedRelation: 'user_account';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// AUDIT EVENT
// ============================================================================

export interface AuditEventRow {
  id: string;
  tenant_id: string;
  actor_type: AuditActorType;
  actor_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  ip: string | null;
  user_agent: string | null;
  payload: Json | null;
  created_at: string;
}

export interface AuditEventInsert {
  id?: string;
  tenant_id: string;
  actor_type: AuditActorType;
  actor_id?: string | null;
  action: string;
  resource_type?: string | null;
  resource_id?: string | null;
  ip?: string | null;
  user_agent?: string | null;
  payload?: Json | null;
  created_at?: string;
}

export interface AuditEventUpdate {
  id?: string;
  tenant_id?: string;
  actor_type?: AuditActorType;
  actor_id?: string | null;
  action?: string;
  resource_type?: string | null;
  resource_id?: string | null;
  ip?: string | null;
  user_agent?: string | null;
  payload?: Json | null;
  created_at?: string;
}

export interface AuditEventTable {
  Row: AuditEventRow;
  Insert: AuditEventInsert;
  Update: AuditEventUpdate;
  Relationships: [
    {
      foreignKeyName: 'audit_event_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// EVENT OUTBOX
// ============================================================================

export interface EventOutboxRow {
  id: string;
  tenant_id: string;
  event_type: string;
  aggregate_type: string | null;
  aggregate_id: string | null;
  payload: Json | null;
  status: EventOutboxStatus;
  attempts: number | null;
  next_retry_at: string | null;
  created_at: string;
  sent_at: string | null;
}

export interface EventOutboxInsert {
  id?: string;
  tenant_id: string;
  event_type: string;
  aggregate_type?: string | null;
  aggregate_id?: string | null;
  payload?: Json | null;
  status?: EventOutboxStatus;
  attempts?: number | null;
  next_retry_at?: string | null;
  created_at?: string;
  sent_at?: string | null;
}

export interface EventOutboxUpdate {
  id?: string;
  tenant_id?: string;
  event_type?: string;
  aggregate_type?: string | null;
  aggregate_id?: string | null;
  payload?: Json | null;
  status?: EventOutboxStatus;
  attempts?: number | null;
  next_retry_at?: string | null;
  created_at?: string;
  sent_at?: string | null;
}

export interface EventOutboxTable {
  Row: EventOutboxRow;
  Insert: EventOutboxInsert;
  Update: EventOutboxUpdate;
  Relationships: [
    {
      foreignKeyName: 'event_outbox_tenant_id_fkey';
      columns: ['tenant_id'];
      referencedRelation: 'tenant';
      referencedColumns: ['id'];
    }
  ];
}

// ============================================================================
// COLLABORATION TABLES COLLECTION
// ============================================================================

export interface CollaborationTables {
  comment_thread: CommentThreadTable;
  comment: CommentTable;
  notification: NotificationTable;
  activity_event: ActivityEventTable;
  attachment: AttachmentTable;
  approval_request: ApprovalRequestTable;
  approval_decision: ApprovalDecisionTable;
  audit_event: AuditEventTable;
  event_outbox: EventOutboxTable;
}
