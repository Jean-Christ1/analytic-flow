// ============================================================================
// Task Hooks
// MLOps Control Plane v3
// Author: Armand AMOUSSOU
// Date: 2026-01-04
// ============================================================================

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  createQueryKeyFactory,
  type ListQueryOptions,
  type MutationOptions,
  type PaginationParams,
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE,
  calculateOffset,
} from '../utils/query-utils';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Task priority levels
 */
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Task status
 */
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled';

/**
 * Task type categories
 */
export type TaskType =
  | 'feature'
  | 'bug'
  | 'improvement'
  | 'experiment'
  | 'documentation'
  | 'research'
  | 'data_preparation'
  | 'model_training'
  | 'deployment'
  | 'monitoring'
  | 'other';

/**
 * Task from database
 */
export interface Task {
  id: string;
  tenant_id: string;
  project_id: string;
  title: string;
  description: string | null;
  task_type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  assignee_id: string | null;
  reporter_id: string;
  parent_task_id: string | null;
  labels: string[];
  due_date: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  sprint_id: string | null;
  external_reference: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

/**
 * Task with relations
 */
export interface TaskWithRelations extends Task {
  assignee?: {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
  reporter?: {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string | null;
  };
  project?: {
    id: string;
    name: string;
    slug: string;
  };
  parent_task?: {
    id: string;
    title: string;
  } | null;
  subtasks_count?: number;
  comments_count?: number;
  dependencies_count?: number;
}

/**
 * Task dependency
 */
export interface TaskDependency {
  id: string;
  tenant_id: string;
  task_id: string;
  depends_on_task_id: string;
  dependency_type: DependencyType;
  created_at: string;
}

/**
 * Dependency type
 */
export type DependencyType = 'blocks' | 'blocked_by' | 'relates_to' | 'duplicates';

/**
 * Task dependency with task info
 */
export interface TaskDependencyWithTask extends TaskDependency {
  depends_on_task?: {
    id: string;
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
  };
  task?: {
    id: string;
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
  };
}

/**
 * Task insert type
 */
export type TaskInsert = Omit<Task, 'id' | 'created_at' | 'updated_at' | 'completed_at'> & {
  id?: string;
};

/**
 * Task update type
 */
export type TaskUpdate = Partial<Omit<Task, 'id' | 'tenant_id' | 'project_id' | 'reporter_id' | 'created_at' | 'updated_at'>>;

/**
 * Task dependency insert
 */
export type TaskDependencyInsert = Omit<TaskDependency, 'id' | 'created_at'> & {
  id?: string;
};

// ============================================================================
// QUERY KEYS
// ============================================================================

export const taskKeys = createQueryKeyFactory<string>('tasks');
export const taskDependencyKeys = createQueryKeyFactory<string>('task_dependencies');

// Extended query keys
export const taskQueryKeys = {
  ...taskKeys,
  byProject: (projectId: string) => [...taskKeys.all, 'project', projectId] as const,
  byAssignee: (assigneeId: string) => [...taskKeys.all, 'assignee', assigneeId] as const,
  byReporter: (reporterId: string) => [...taskKeys.all, 'reporter', reporterId] as const,
  byStatus: (status: TaskStatus) => [...taskKeys.all, 'status', status] as const,
  byPriority: (priority: TaskPriority) => [...taskKeys.all, 'priority', priority] as const,
  bySprint: (sprintId: string) => [...taskKeys.all, 'sprint', sprintId] as const,
  subtasks: (parentTaskId: string) => [...taskKeys.all, 'subtasks', parentTaskId] as const,
  myTasks: (userId: string) => [...taskKeys.all, 'my', userId] as const,
  overdue: () => [...taskKeys.all, 'overdue'] as const,
};

export const dependencyQueryKeys = {
  ...taskDependencyKeys,
  byTask: (taskId: string) => [...taskDependencyKeys.all, 'task', taskId] as const,
  blocking: (taskId: string) => [...taskDependencyKeys.all, 'blocking', taskId] as const,
  blockedBy: (taskId: string) => [...taskDependencyKeys.all, 'blocked_by', taskId] as const,
};

// ============================================================================
// TASK QUERY HOOKS
// ============================================================================

/**
 * Fetch all tasks with pagination
 */
export const useTasks = (options: ListQueryOptions = {}) => {
  const {
    pagination = { page: DEFAULT_PAGE, pageSize: DEFAULT_PAGE_SIZE },
    sort = { column: 'created_at', ascending: false },
    filters = [],
    search,
    enabled = true,
  } = options;

  const page = pagination.page ?? DEFAULT_PAGE;
  const pageSize = pagination.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = calculateOffset(page, pageSize);

  return useQuery({
    queryKey: taskKeys.list({ pagination, sort, filters, search }),
    queryFn: async () => {
      let query = supabase
        .from('task')
        .select(`
          *,
          assignee:profile!assignee_id(id, email, full_name, avatar_url),
          reporter:profile!reporter_id(id, email, full_name, avatar_url),
          project(id, name, slug)
        `, { count: 'exact' });

      // Apply filters
      filters.forEach(filter => {
        query = query.filter(filter.column, filter.operator, filter.value);
      });

      // Apply search
      if (search) {
        query = query.ilike('title', `%${search.value}%`);
      }

      // Apply sorting
      const sortParams = Array.isArray(sort) ? sort : [sort];
      sortParams.forEach(s => {
        query = query.order(s.column, { ascending: s.ascending ?? true });
      });

      // Apply pagination
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;
      return { data: data as TaskWithRelations[], count };
    },
    enabled,
  });
};

/**
 * Infinite scroll for tasks
 */
export const useInfiniteTasks = (options: Omit<ListQueryOptions, 'pagination'> = {}) => {
  const {
    sort = { column: 'created_at', ascending: false },
    filters = [],
    search,
    enabled = true,
  } = options;

  const pageSize = DEFAULT_PAGE_SIZE;

  return useInfiniteQuery({
    queryKey: taskKeys.infinite({ sort, filters, search }),
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('task')
        .select(`
          *,
          assignee:profile!assignee_id(id, email, full_name, avatar_url),
          reporter:profile!reporter_id(id, email, full_name, avatar_url),
          project(id, name, slug)
        `, { count: 'exact' });

      filters.forEach(filter => {
        query = query.filter(filter.column, filter.operator, filter.value);
      });

      if (search) {
        query = query.ilike('title', `%${search.value}%`);
      }

      const sortParams = Array.isArray(sort) ? sort : [sort];
      sortParams.forEach(s => {
        query = query.order(s.column, { ascending: s.ascending ?? true });
      });

      query = query.range(pageParam, pageParam + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;
      return { data: data as TaskWithRelations[], count, nextCursor: pageParam + pageSize };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (!lastPage.count || lastPage.data.length < pageSize) return undefined;
      return lastPage.nextCursor;
    },
    enabled,
  });
};

/**
 * Fetch a single task by ID
 */
export const useTask = (taskId: string, options: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: taskKeys.detail(taskId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task')
        .select(`
          *,
          assignee:profile!assignee_id(id, email, full_name, avatar_url),
          reporter:profile!reporter_id(id, email, full_name, avatar_url),
          project(id, name, slug),
          parent_task:task!parent_task_id(id, title)
        `)
        .eq('id', taskId)
        .single();

      if (error) throw error;
      return data as TaskWithRelations;
    },
    enabled: options.enabled !== false && !!taskId,
  });
};

/**
 * Fetch tasks by project
 */
export const useTasksByProject = (projectId: string, pagination?: PaginationParams) => {
  const page = pagination?.page ?? DEFAULT_PAGE;
  const pageSize = pagination?.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = calculateOffset(page, pageSize);

  return useQuery({
    queryKey: taskQueryKeys.byProject(projectId),
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from('task')
        .select(`
          *,
          assignee:profile!assignee_id(id, email, full_name, avatar_url),
          reporter:profile!reporter_id(id, email, full_name, avatar_url)
        `, { count: 'exact' })
        .eq('project_id', projectId)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) throw error;
      return { data: data as TaskWithRelations[], count };
    },
    enabled: !!projectId,
  });
};

/**
 * Fetch tasks by assignee
 */
export const useTasksByAssignee = (assigneeId: string, pagination?: PaginationParams) => {
  const page = pagination?.page ?? DEFAULT_PAGE;
  const pageSize = pagination?.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = calculateOffset(page, pageSize);

  return useQuery({
    queryKey: taskQueryKeys.byAssignee(assigneeId),
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from('task')
        .select(`
          *,
          project(id, name, slug)
        `, { count: 'exact' })
        .eq('assignee_id', assigneeId)
        .neq('status', 'done')
        .neq('status', 'cancelled')
        .order('priority', { ascending: false })
        .order('due_date', { ascending: true, nullsFirst: false })
        .range(offset, offset + pageSize - 1);

      if (error) throw error;
      return { data: data as TaskWithRelations[], count };
    },
    enabled: !!assigneeId,
  });
};

/**
 * Fetch tasks by status
 */
export const useTasksByStatus = (status: TaskStatus, projectId?: string) => {
  return useQuery({
    queryKey: [...taskQueryKeys.byStatus(status), projectId] as const,
    queryFn: async () => {
      let query = supabase
        .from('task')
        .select(`
          *,
          assignee:profile!assignee_id(id, email, full_name, avatar_url)
        `)
        .eq('status', status)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as TaskWithRelations[];
    },
  });
};

/**
 * Fetch tasks by priority
 */
export const useTasksByPriority = (priority: TaskPriority, projectId?: string) => {
  return useQuery({
    queryKey: [...taskQueryKeys.byPriority(priority), projectId] as const,
    queryFn: async () => {
      let query = supabase
        .from('task')
        .select(`
          *,
          assignee:profile!assignee_id(id, email, full_name, avatar_url)
        `)
        .eq('priority', priority)
        .neq('status', 'done')
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as TaskWithRelations[];
    },
  });
};

/**
 * Fetch subtasks for a parent task
 */
export const useSubtasks = (parentTaskId: string) => {
  return useQuery({
    queryKey: taskQueryKeys.subtasks(parentTaskId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task')
        .select(`
          *,
          assignee:profile!assignee_id(id, email, full_name, avatar_url)
        `)
        .eq('parent_task_id', parentTaskId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as TaskWithRelations[];
    },
    enabled: !!parentTaskId,
  });
};

/**
 * Fetch my active tasks
 */
export const useMyTasks = (userId: string) => {
  return useQuery({
    queryKey: taskQueryKeys.myTasks(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task')
        .select(`
          *,
          project(id, name, slug)
        `)
        .eq('assignee_id', userId)
        .neq('status', 'done')
        .neq('status', 'cancelled')
        .order('priority', { ascending: false })
        .order('due_date', { ascending: true, nullsFirst: false });

      if (error) throw error;
      return data as TaskWithRelations[];
    },
    enabled: !!userId,
  });
};

/**
 * Fetch overdue tasks
 */
export const useOverdueTasks = (projectId?: string) => {
  return useQuery({
    queryKey: [...taskQueryKeys.overdue(), projectId] as const,
    queryFn: async () => {
      const now = new Date().toISOString();

      let query = supabase
        .from('task')
        .select(`
          *,
          assignee:profile!assignee_id(id, email, full_name, avatar_url),
          project(id, name, slug)
        `)
        .lt('due_date', now)
        .neq('status', 'done')
        .neq('status', 'cancelled')
        .order('due_date', { ascending: true });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as TaskWithRelations[];
    },
  });
};

// ============================================================================
// TASK DEPENDENCY QUERY HOOKS
// ============================================================================

/**
 * Fetch dependencies for a task
 */
export const useTaskDependencies = (taskId: string) => {
  return useQuery({
    queryKey: dependencyQueryKeys.byTask(taskId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_dependency')
        .select(`
          *,
          depends_on_task:task!depends_on_task_id(id, title, status, priority)
        `)
        .eq('task_id', taskId);

      if (error) throw error;
      return data as TaskDependencyWithTask[];
    },
    enabled: !!taskId,
  });
};

/**
 * Fetch tasks blocking a task
 */
export const useBlockingTasks = (taskId: string) => {
  return useQuery({
    queryKey: dependencyQueryKeys.blocking(taskId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_dependency')
        .select(`
          *,
          depends_on_task:task!depends_on_task_id(id, title, status, priority)
        `)
        .eq('task_id', taskId)
        .eq('dependency_type', 'blocked_by');

      if (error) throw error;
      return data as TaskDependencyWithTask[];
    },
    enabled: !!taskId,
  });
};

/**
 * Fetch tasks blocked by a task
 */
export const useBlockedTasks = (taskId: string) => {
  return useQuery({
    queryKey: dependencyQueryKeys.blockedBy(taskId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_dependency')
        .select(`
          *,
          task:task!task_id(id, title, status, priority)
        `)
        .eq('depends_on_task_id', taskId)
        .eq('dependency_type', 'blocked_by');

      if (error) throw error;
      return data as TaskDependencyWithTask[];
    },
    enabled: !!taskId,
  });
};

// ============================================================================
// TASK MUTATION HOOKS
// ============================================================================

/**
 * Create a new task
 */
export const useCreateTask = (
  options: MutationOptions<Task, TaskInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (task: TaskInsert) => {
      const { data, error } = await supabase
        .from('task')
        .insert(task)
        .select()
        .single();

      if (error) throw error;
      return data as Task;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.byProject(data.project_id) });
      if (data.assignee_id) {
        queryClient.invalidateQueries({ queryKey: taskQueryKeys.byAssignee(data.assignee_id) });
      }
      if (data.parent_task_id) {
        queryClient.invalidateQueries({ queryKey: taskQueryKeys.subtasks(data.parent_task_id) });
      }
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update a task
 */
export const useUpdateTask = (
  options: MutationOptions<Task, { id: string; updates: TaskUpdate }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TaskUpdate }) => {
      // Set completed_at if transitioning to done
      const finalUpdates = {
        ...updates,
        ...(updates.status === 'done' && { completed_at: new Date().toISOString() }),
        ...(updates.status && updates.status !== 'done' && { completed_at: null }),
      };

      const { data, error } = await supabase
        .from('task')
        .update(finalUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Task;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.byProject(data.project_id) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Delete a task
 */
export const useDeleteTask = (
  options: MutationOptions<void, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('task')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      options.onSuccess?.(undefined, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Assign task to user
 */
export const useAssignTask = (
  options: MutationOptions<Task, { taskId: string; assigneeId: string | null }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, assigneeId }: { taskId: string; assigneeId: string | null }) => {
      const { data, error } = await supabase
        .from('task')
        .update({ assignee_id: assigneeId })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return data as Task;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(variables.taskId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      if (variables.assigneeId) {
        queryClient.invalidateQueries({ queryKey: taskQueryKeys.byAssignee(variables.assigneeId) });
      }
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update task status
 */
export const useUpdateTaskStatus = (
  options: MutationOptions<Task, { taskId: string; status: TaskStatus }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: TaskStatus }) => {
      const updates: Partial<Task> = {
        status,
        completed_at: status === 'done' ? new Date().toISOString() : null,
      };

      const { data, error } = await supabase
        .from('task')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return data as Task;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(variables.taskId) });
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.byStatus(variables.status) });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Update task priority
 */
export const useUpdateTaskPriority = (
  options: MutationOptions<Task, { taskId: string; priority: TaskPriority }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, priority }: { taskId: string; priority: TaskPriority }) => {
      const { data, error } = await supabase
        .from('task')
        .update({ priority })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return data as Task;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(variables.taskId) });
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.byPriority(variables.priority) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Log time on task
 */
export const useLogTaskTime = (
  options: MutationOptions<Task, { taskId: string; hours: number }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, hours }: { taskId: string; hours: number }) => {
      // First get current actual_hours
      const { data: current, error: fetchError } = await supabase
        .from('task')
        .select('actual_hours')
        .eq('id', taskId)
        .single();

      if (fetchError) throw fetchError;

      const newHours = (current.actual_hours || 0) + hours;

      const { data, error } = await supabase
        .from('task')
        .update({ actual_hours: newHours })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return data as Task;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(variables.taskId) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

// ============================================================================
// DEPENDENCY MUTATION HOOKS
// ============================================================================

/**
 * Add task dependency
 */
export const useAddTaskDependency = (
  options: MutationOptions<TaskDependency, TaskDependencyInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dependency: TaskDependencyInsert) => {
      const { data, error } = await supabase
        .from('task_dependency')
        .insert(dependency)
        .select()
        .single();

      if (error) throw error;
      return data as TaskDependency;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: dependencyQueryKeys.byTask(data.task_id) });
      queryClient.invalidateQueries({ queryKey: dependencyQueryKeys.byTask(data.depends_on_task_id) });
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

/**
 * Remove task dependency
 */
export const useRemoveTaskDependency = (
  options: MutationOptions<void, { dependencyId: string; taskId: string }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ dependencyId }: { dependencyId: string; taskId: string }) => {
      const { error } = await supabase
        .from('task_dependency')
        .delete()
        .eq('id', dependencyId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: dependencyQueryKeys.byTask(variables.taskId) });
      options.onSuccess?.(undefined, variables);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });
};

// ============================================================================
// TODO: Additional Features
// ============================================================================
// TODO: Add useBulkUpdateTasks mutation for batch status updates
// TODO: Add useTaskTimeline hook for task activity timeline
// TODO: Add useTaskWatchers hook for task subscribers
// TODO: Add useTaskTemplates hook for task templates
// TODO: Add useTaskRecurrence hook for recurring tasks
// TODO: Add useKanbanBoard hook for kanban view data
// TODO: Add useSprintTasks hook for sprint board
// TODO: Add useTaskExport hook for exporting tasks
// TODO: Add useTaskImport mutation for importing from Jira/Asana
// TODO: Add real-time subscriptions for live task updates
// TODO: Add useTaskSLA hook for SLA tracking
// TODO: Add useTaskAutomation hook for workflow automation
