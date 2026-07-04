import { getSupabase } from "./supabase";
import { queueForDueDate } from "./dueDateQueue";
import type { Task, TaskQueue, TaskStatus } from "../types";

function nowIso(): string {
  return new Date().toISOString();
}

function rowToTask(row: Record<string, unknown>): Task {
  let tags: string[] = [];
  try {
    tags = (row.tags as string[]) ?? [];
  } catch {
    tags = [];
  }

  return {
    id: row.id as string,
    title: row.title as string,
    notes: (row.notes as string) ?? "",
    queue: row.queue as TaskQueue,
    parentId: (row.parent_id as string) ?? null,
    surfaceOfId: (row.surface_of_id as string) ?? null,
    sortOrder: (row.sort_order as number) ?? 0,
    dueDate: (row.due_date as string) ?? null,
    tags,
    sourceLink: (row.source_link as string) ?? null,
    status: row.status as TaskStatus,
    createdAt: row.created_at as string,
    completedAt: (row.completed_at as string) ?? null,
    clearedAt: (row.cleared_at as string) ?? null,
  };
}

async function getUserId(): Promise<string> {
  const sb = getSupabase();
  const { data } = await sb.auth.getUser();
  if (!data.user) throw new Error("Not authenticated");
  return data.user.id;
}

async function getTaskById(id: string): Promise<Task | null> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("tasks")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToTask(data as Record<string, unknown>) : null;
}

export async function fetchAllTasks(): Promise<Task[]> {
  await syncAllTaskQueuesFromDueDates();
  const userId = await getUserId();
  const sb = getSupabase();
  const { data, error } = await sb
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .order("status", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => rowToTask(r as Record<string, unknown>));
}

export async function searchTasks(query: string): Promise<Task[]> {
  const userId = await getUserId();
  const sb = getSupabase();
  const term = `%${query.trim()}%`;
  const { data, error } = await sb
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .or(`title.ilike.${term},notes.ilike.${term}`)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => rowToTask(r as Record<string, unknown>));
}

export async function nextSortOrder(queue: TaskQueue): Promise<number> {
  const userId = await getUserId();
  const sb = getSupabase();
  const { data } = await sb
    .from("tasks")
    .select("sort_order")
    .eq("user_id", userId)
    .eq("queue", queue)
    .is("parent_id", null)
    .neq("status", "cleared")
    .order("sort_order", { ascending: false })
    .limit(1);
  return ((data?.[0]?.sort_order as number) ?? -1) + 1;
}

async function nextSubtaskOrder(parentId: string): Promise<number> {
  const sb = getSupabase();
  const { data } = await sb
    .from("tasks")
    .select("sort_order")
    .eq("parent_id", parentId)
    .order("sort_order", { ascending: false })
    .limit(1);
  return ((data?.[0]?.sort_order as number) ?? -1) + 1;
}

export interface CreateTaskInput {
  title: string;
  queue: TaskQueue;
  dueDate?: string | null;
  tags?: string[];
  sourceLink?: string | null;
  notes?: string;
  parentId?: string | null;
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const userId = await getUserId();
  const sb = getSupabase();
  const isSubtask = Boolean(input.parentId);
  let queue = input.queue;

  if (isSubtask && input.parentId) {
    const parent = await getTaskById(input.parentId);
    if (!parent) throw new Error("Parent task not found");
    queue = parent.queue;
  } else {
    queue = queueForDueDate(input.dueDate) ?? input.queue;
  }

  const sortOrder = isSubtask
    ? await nextSubtaskOrder(input.parentId!)
    : await nextSortOrder(queue);

  const { data, error } = await sb
    .from("tasks")
    .insert({
      user_id: userId,
      title: input.title.trim(),
      notes: input.notes ?? "",
      queue,
      parent_id: input.parentId ?? null,
      surface_of_id: null,
      sort_order: sortOrder,
      due_date: input.dueDate ?? null,
      tags: input.tags ?? [],
      source_link: input.sourceLink ?? null,
      status: "active",
      created_at: nowIso(),
    })
    .select()
    .single();

  if (error) throw error;
  return rowToTask(data as Record<string, unknown>);
}

export async function createSubtask(
  parentId: string,
  title: string,
): Promise<Task> {
  const parent = await getTaskById(parentId);
  if (!parent || parent.parentId) {
    throw new Error("Can only add subtasks to a top-level task");
  }

  return createTask({
    title,
    queue: parent.queue,
    parentId,
  });
}

async function syncTaskQueueFromDueDate(task: Task): Promise<void> {
  if (task.parentId || task.surfaceOfId) return;

  const targetQueue = queueForDueDate(task.dueDate);
  if (!targetQueue || targetQueue === task.queue) return;

  const sortOrder = await nextSortOrder(targetQueue);
  await moveTask(task.id, targetQueue, sortOrder);
}

export async function syncAllTaskQueuesFromDueDates(): Promise<void> {
  const userId = await getUserId();
  const sb = getSupabase();
  const { data, error } = await sb
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .is("parent_id", null)
    .is("surface_of_id", null)
    .neq("status", "cleared")
    .not("due_date", "is", null);
  if (error) throw error;

  const tasks = (data ?? []).map((r) => rowToTask(r as Record<string, unknown>));
  for (const task of tasks) {
    await syncTaskQueueFromDueDate(task);
  }
}

export interface UpdateTaskInput {
  title?: string;
  notes?: string;
  dueDate?: string | null;
  tags?: string[];
  sourceLink?: string | null;
}

async function syncLinkedTitles(taskId: string, title: string): Promise<void> {
  const sb = getSupabase();
  const task = await getTaskById(taskId);
  if (!task) return;

  if (task.surfaceOfId) {
    await sb.from("tasks").update({ title }).eq("id", task.surfaceOfId);
    await sb
      .from("tasks")
      .update({ title })
      .eq("surface_of_id", task.surfaceOfId)
      .neq("id", taskId);
    return;
  }

  await sb.from("tasks").update({ title }).eq("surface_of_id", taskId);
}

export async function updateTask(
  id: string,
  input: UpdateTaskInput,
): Promise<void> {
  const sb = getSupabase();
  const updates: Record<string, unknown> = {};

  if (input.title !== undefined) updates.title = input.title.trim();
  if (input.notes !== undefined) updates.notes = input.notes;
  if (input.dueDate !== undefined) updates.due_date = input.dueDate;
  if (input.tags !== undefined) updates.tags = input.tags;
  if (input.sourceLink !== undefined) updates.source_link = input.sourceLink;

  if (Object.keys(updates).length === 0) return;

  const { error } = await sb.from("tasks").update(updates).eq("id", id);
  if (error) throw error;

  if (input.title !== undefined) {
    await syncLinkedTitles(id, input.title.trim());
  }

  if (input.dueDate !== undefined) {
    const updated = await getTaskById(id);
    if (updated) {
      await syncTaskQueueFromDueDate(updated);
    }
  }
}

async function syncLinkedStatus(
  taskId: string,
  status: TaskStatus,
  timestamp: string | null,
): Promise<void> {
  const sb = getSupabase();
  const task = await getTaskById(taskId);
  if (!task) return;

  const updates: Record<string, unknown> =
    status === "active"
      ? { status: "active", completed_at: null, cleared_at: null }
      : { status: "completed", completed_at: timestamp, cleared_at: null };

  if (task.surfaceOfId) {
    await sb.from("tasks").update(updates).eq("id", task.surfaceOfId);
    await sb
      .from("tasks")
      .update(updates)
      .eq("surface_of_id", task.surfaceOfId)
      .neq("id", taskId);
    return;
  }

  await sb.from("tasks").update(updates).eq("surface_of_id", taskId);
}

export async function setTaskStatus(
  id: string,
  status: TaskStatus,
): Promise<void> {
  const sb = getSupabase();
  const timestamp = nowIso();

  if (status === "active") {
    await sb
      .from("tasks")
      .update({ status: "active", completed_at: null, cleared_at: null })
      .eq("id", id);
    await syncLinkedStatus(id, status, null);
    return;
  }

  if (status === "completed") {
    await sb
      .from("tasks")
      .update({ status: "completed", completed_at: timestamp, cleared_at: null })
      .eq("id", id);
    await syncLinkedStatus(id, status, timestamp);
    return;
  }

  await sb
    .from("tasks")
    .update({ status: "cleared", cleared_at: timestamp, queue: "backlog" })
    .eq("id", id);
}

export async function toggleTaskComplete(task: Task): Promise<void> {
  if (task.status === "cleared") return;
  await setTaskStatus(
    task.id,
    task.status === "completed" ? "active" : "completed",
  );
}

export async function clearTask(id: string): Promise<void> {
  const task = await getTaskById(id);
  if (!task) return;

  if (task.surfaceOfId) {
    await unpinSubtask(id);
    return;
  }

  await setTaskStatus(id, "cleared");
}

export async function clearCompletedInQueue(queue: TaskQueue): Promise<void> {
  const userId = await getUserId();
  const sb = getSupabase();
  const timestamp = nowIso();

  const { data: parents } = await sb
    .from("tasks")
    .select("id")
    .eq("user_id", userId)
    .eq("queue", queue)
    .is("parent_id", null)
    .eq("status", "completed");

  await sb
    .from("tasks")
    .update({ status: "cleared", cleared_at: timestamp })
    .eq("user_id", userId)
    .eq("queue", queue)
    .is("parent_id", null)
    .eq("status", "completed");

  for (const parent of parents ?? []) {
    await sb
      .from("tasks")
      .update({ status: "cleared", cleared_at: timestamp })
      .eq("parent_id", parent.id)
      .eq("status", "completed");
  }
}

export async function pinSubtask(
  subtaskId: string,
  queue: TaskQueue,
): Promise<Task> {
  const subtask = await getTaskById(subtaskId);
  if (!subtask?.parentId) {
    throw new Error("Only subtasks can be pinned");
  }

  const sb = getSupabase();
  const { data: existing } = await sb
    .from("tasks")
    .select("*")
    .eq("surface_of_id", subtaskId)
    .eq("queue", queue)
    .neq("status", "cleared")
    .limit(1);

  if (existing?.[0]) return rowToTask(existing[0] as Record<string, unknown>);

  const userId = await getUserId();
  const sortOrder = await nextSortOrder(queue);

  const { data, error } = await sb
    .from("tasks")
    .insert({
      user_id: userId,
      title: subtask.title,
      notes: subtask.notes,
      queue,
      parent_id: null,
      surface_of_id: subtaskId,
      sort_order: sortOrder,
      due_date: subtask.dueDate,
      tags: subtask.tags,
      source_link: subtask.sourceLink,
      status: subtask.status,
      created_at: nowIso(),
    })
    .select()
    .single();

  if (error) throw error;
  return rowToTask(data as Record<string, unknown>);
}

export async function unpinSubtask(surfaceId: string): Promise<void> {
  const sb = getSupabase();
  await sb
    .from("tasks")
    .delete()
    .eq("id", surfaceId)
    .not("surface_of_id", "is", null);
}

export async function moveTask(
  id: string,
  queue: TaskQueue,
  sortOrder: number,
): Promise<void> {
  const sb = getSupabase();
  const task = await getTaskById(id);
  if (!task) return;

  await sb
    .from("tasks")
    .update({ queue, sort_order: sortOrder })
    .eq("id", id);

  if (!task.parentId && !task.surfaceOfId) {
    await sb
      .from("tasks")
      .update({ queue })
      .eq("parent_id", id)
      .is("surface_of_id", null);
  }
}

export async function reorderTasks(
  queue: TaskQueue,
  orderedIds: string[],
): Promise<void> {
  const sb = getSupabase();
  for (let i = 0; i < orderedIds.length; i++) {
    await sb
      .from("tasks")
      .update({ sort_order: i, queue })
      .eq("id", orderedIds[i]);
  }
}

export async function deleteTask(id: string): Promise<void> {
  const sb = getSupabase();
  const task = await getTaskById(id);
  if (!task) return;

  const { data: subtasks } = await sb
    .from("tasks")
    .select("id")
    .eq("parent_id", id);

  for (const subtask of subtasks ?? []) {
    await sb.from("tasks").delete().eq("surface_of_id", subtask.id);
  }

  await sb.from("tasks").delete().eq("surface_of_id", id);
  await sb.from("tasks").delete().eq("parent_id", id);
  await sb.from("tasks").delete().eq("id", id);
}

export async function purgeArchive(): Promise<void> {
  const userId = await getUserId();
  const sb = getSupabase();
  const { data: cleared } = await sb
    .from("tasks")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "cleared");

  for (const task of cleared ?? []) {
    await deleteTask(task.id);
  }
}

export async function getNextIncompleteSibling(
  subtaskId: string,
): Promise<{
  next: Task | null;
  parent: Task | null;
  progress: { done: number; total: number };
}> {
  const subtask = await getTaskById(subtaskId);
  if (!subtask)
    return { next: null, parent: null, progress: { done: 0, total: 0 } };

  const originalId = subtask.surfaceOfId ?? subtask.id;
  const original = subtask.surfaceOfId
    ? await getTaskById(originalId)
    : subtask;
  if (!original?.parentId)
    return { next: null, parent: null, progress: { done: 0, total: 0 } };

  const parent = await getTaskById(original.parentId);
  const sb = getSupabase();
  const { data } = await sb
    .from("tasks")
    .select("*")
    .eq("parent_id", original.parentId)
    .is("surface_of_id", null)
    .order("sort_order", { ascending: true });

  const siblings = (data ?? []).map((r) =>
    rowToTask(r as Record<string, unknown>),
  );
  const done = siblings.filter((s) => s.status === "completed").length;
  const progress = { done, total: siblings.length };

  const currentIdx = siblings.findIndex((s) => s.id === originalId);
  const after = siblings
    .slice(currentIdx + 1)
    .find((s) => s.status !== "completed");
  if (after) return { next: after, parent, progress };

  const before = siblings
    .slice(0, currentIdx)
    .find((s) => s.status !== "completed");
  return { next: before ?? null, parent, progress };
}

export { isOverdue, formatDueDate } from "./dueDateQueue";

export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const sb = getSupabase();
    const { error } = await sb.from("tasks").select("id").limit(1);
    return !error;
  } catch {
    return false;
  }
}
