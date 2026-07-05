export type ListEmphasis = "default" | "today";

export type QueueTab = "today" | "week" | "backlog" | "inbox" | "archive";

export type TaskQueue = "inbox" | "today" | "week" | "backlog";

export type TaskStatus = "active" | "completed" | "cleared";

export type ThemeMode = "light" | "dark" | "system";

export interface QueueTabConfig {
  id: QueueTab;
  label: string;
  description: string;
}

export const QUEUE_TABS: QueueTabConfig[] = [
  {
    id: "today",
    label: "Today",
    description: "Tasks planned for today.",
  },
  {
    id: "week",
    label: "This Week",
    description: "Tasks queued for this week.",
  },
  {
    id: "backlog",
    label: "Backlog",
    description: "Active tasks not yet scheduled.",
  },
  {
    id: "inbox",
    label: "Inbox",
    description: "Unsorted capture — can live here indefinitely.",
  },
  {
    id: "archive",
    label: "Archive",
    description: "Cleared completed tasks — searchable.",
  },
];

export interface Task {
  id: string;
  title: string;
  notes: string;
  queue: TaskQueue;
  parentId: string | null;
  surfaceOfId: string | null;
  sortOrder: number;
  dueDate: string | null;
  tags: string[];
  sourceLink: string | null;
  status: TaskStatus;
  createdAt: string;
  completedAt: string | null;
  clearedAt: string | null;
}

export interface TaskRow {
  id: string;
  title: string;
  notes: string;
  queue: string;
  parent_id: string | null;
  surface_of_id: string | null;
  sort_order: number;
  due_date: string | null;
  tags: string;
  source_link: string | null;
  status: string;
  created_at: string;
  completed_at: string | null;
  cleared_at: string | null;
}

export function rowToTask(row: TaskRow): Task {
  let tags: string[] = [];
  try {
    tags = JSON.parse(row.tags) as string[];
  } catch {
    tags = [];
  }

  return {
    id: row.id,
    title: row.title,
    notes: row.notes,
    queue: row.queue as TaskQueue,
    parentId: row.parent_id,
    surfaceOfId: row.surface_of_id,
    sortOrder: row.sort_order,
    dueDate: row.due_date,
    tags,
    sourceLink: row.source_link,
    status: row.status as TaskStatus,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    clearedAt: row.cleared_at,
  };
}

export function queueTabLabel(queue: TaskQueue): string {
  return QUEUE_TABS.find((t) => t.id === queue)?.label ?? queue;
}

export const DRAG_TASK_PREFIX = "task:";
export const DROP_QUEUE_PREFIX = "queue:";

export function taskDragId(id: string): string {
  return `${DRAG_TASK_PREFIX}${id}`;
}

export function queueDropId(tab: QueueTab): string {
  return `${DROP_QUEUE_PREFIX}${tab}`;
}

export function parseTaskDragId(id: string | number): string | null {
  const value = String(id);
  return value.startsWith(DRAG_TASK_PREFIX)
    ? value.slice(DRAG_TASK_PREFIX.length)
    : null;
}

export function parseQueueDropId(id: string | number): QueueTab | null {
  const value = String(id);
  if (!value.startsWith(DROP_QUEUE_PREFIX)) return null;
  const tab = value.slice(DROP_QUEUE_PREFIX.length) as QueueTab;
  return QUEUE_TABS.some((t) => t.id === tab) ? tab : null;
}
