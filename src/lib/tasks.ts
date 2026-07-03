import { getDatabase } from "./db";
import {
  queueForDueDate,
  todayDateString,
} from "./dueDateQueue";
import {
  rowToTask,
  type Task,
  type TaskQueue,
  type TaskRow,
  type TaskStatus,
} from "../types";

function nowIso(): string {
  return new Date().toISOString();
}

function todayDate(): string {
  return todayDateString();
}

async function selectTasks(sql: string, params: unknown[] = []): Promise<Task[]> {
  const db = await getDatabase();
  const rows = await db.select<TaskRow[]>(sql, params);
  return rows.map(rowToTask);
}

async function getTaskById(id: string): Promise<Task | null> {
  const tasks = await selectTasks("SELECT * FROM tasks WHERE id = $1", [id]);
  return tasks[0] ?? null;
}

export async function fetchAllTasks(): Promise<Task[]> {
  await syncAllTaskQueuesFromDueDates();
  return selectTasks(
    `SELECT * FROM tasks
     ORDER BY
       CASE status WHEN 'cleared' THEN 2 ELSE 1 END,
       sort_order ASC,
       created_at ASC`,
  );
}

export async function searchTasks(query: string): Promise<Task[]> {
  const term = `%${query.trim()}%`;
  return selectTasks(
    `SELECT * FROM tasks
     WHERE title LIKE $1 OR notes LIKE $1 OR tags LIKE $1
     ORDER BY
       CASE status WHEN 'cleared' THEN 2 ELSE 1 END,
       sort_order ASC,
       created_at ASC`,
    [term],
  );
}

export async function nextSortOrder(queue: TaskQueue): Promise<number> {
  const db = await getDatabase();
  const rows = await db.select<{ max_order: number | null }[]>(
    `SELECT MAX(sort_order) as max_order FROM tasks
     WHERE queue = $1 AND parent_id IS NULL AND status != 'cleared'`,
    [queue],
  );
  return (rows[0]?.max_order ?? -1) + 1;
}

async function nextSubtaskOrder(parentId: string): Promise<number> {
  const db = await getDatabase();
  const rows = await db.select<{ max_order: number | null }[]>(
    `SELECT MAX(sort_order) as max_order FROM tasks WHERE parent_id = $1`,
    [parentId],
  );
  return (rows[0]?.max_order ?? -1) + 1;
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
  const db = await getDatabase();
  const id = crypto.randomUUID();
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
  const tags = JSON.stringify(input.tags ?? []);

  await db.execute(
    `INSERT INTO tasks (
      id, title, notes, queue, parent_id, surface_of_id, sort_order,
      due_date, tags, source_link, status, created_at
    ) VALUES ($1, $2, $3, $4, $5, NULL, $6, $7, $8, $9, 'active', $10)`,
    [
      id,
      input.title.trim(),
      input.notes ?? "",
      queue,
      input.parentId ?? null,
      sortOrder,
      input.dueDate ?? null,
      tags,
      input.sourceLink ?? null,
      nowIso(),
    ],
  );

  const tasks = await selectTasks("SELECT * FROM tasks WHERE id = $1", [id]);
  return tasks[0];
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
  const tasks = await selectTasks(
    `SELECT * FROM tasks
     WHERE parent_id IS NULL
       AND surface_of_id IS NULL
       AND status != 'cleared'
       AND due_date IS NOT NULL`,
  );

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
  const db = await getDatabase();
  const task = await getTaskById(taskId);
  if (!task) return;

  if (task.surfaceOfId) {
    await db.execute(`UPDATE tasks SET title = $1 WHERE id = $2`, [
      title,
      task.surfaceOfId,
    ]);
    const surfaces = await selectTasks(
      `SELECT * FROM tasks WHERE surface_of_id = $1 AND id != $2`,
      [task.surfaceOfId, taskId],
    );
    for (const surface of surfaces) {
      await db.execute(`UPDATE tasks SET title = $1 WHERE id = $2`, [
        title,
        surface.id,
      ]);
    }
    return;
  }

  await db.execute(`UPDATE tasks SET title = $1 WHERE surface_of_id = $2`, [
    title,
    taskId,
  ]);
}

export async function updateTask(
  id: string,
  input: UpdateTaskInput,
): Promise<void> {
  const db = await getDatabase();
  const fields: string[] = [];
  const params: unknown[] = [];
  let index = 1;

  if (input.title !== undefined) {
    fields.push(`title = $${index++}`);
    params.push(input.title.trim());
  }
  if (input.notes !== undefined) {
    fields.push(`notes = $${index++}`);
    params.push(input.notes);
  }
  if (input.dueDate !== undefined) {
    fields.push(`due_date = $${index++}`);
    params.push(input.dueDate);
  }
  if (input.tags !== undefined) {
    fields.push(`tags = $${index++}`);
    params.push(JSON.stringify(input.tags));
  }
  if (input.sourceLink !== undefined) {
    fields.push(`source_link = $${index++}`);
    params.push(input.sourceLink);
  }

  if (fields.length === 0) return;

  params.push(id);
  await db.execute(
    `UPDATE tasks SET ${fields.join(", ")} WHERE id = $${index}`,
    params,
  );

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
  const db = await getDatabase();
  const task = await getTaskById(taskId);
  if (!task) return;

  const apply = async (id: string) => {
    if (status === "active") {
      await db.execute(
        `UPDATE tasks SET status = 'active', completed_at = NULL, cleared_at = NULL
         WHERE id = $1`,
        [id],
      );
      return;
    }
    if (status === "completed") {
      await db.execute(
        `UPDATE tasks SET status = 'completed', completed_at = $1, cleared_at = NULL
         WHERE id = $2`,
        [timestamp, id],
      );
    }
  };

  if (task.surfaceOfId) {
    await apply(task.surfaceOfId);
    const siblingSurfaces = await selectTasks(
      `SELECT * FROM tasks WHERE surface_of_id = $1 AND id != $2`,
      [task.surfaceOfId, taskId],
    );
    for (const surface of siblingSurfaces) {
      await apply(surface.id);
    }
    return;
  }

  const surfaces = await selectTasks(
    `SELECT * FROM tasks WHERE surface_of_id = $1`,
    [taskId],
  );
  for (const surface of surfaces) {
    await apply(surface.id);
  }
}

export async function setTaskStatus(
  id: string,
  status: TaskStatus,
): Promise<void> {
  const db = await getDatabase();
  const timestamp = nowIso();

  if (status === "active") {
    await db.execute(
      `UPDATE tasks SET status = 'active', completed_at = NULL, cleared_at = NULL
       WHERE id = $1`,
      [id],
    );
    await syncLinkedStatus(id, status, null);
    return;
  }

  if (status === "completed") {
    await db.execute(
      `UPDATE tasks SET status = 'completed', completed_at = $1, cleared_at = NULL
       WHERE id = $2`,
      [timestamp, id],
    );
    await syncLinkedStatus(id, status, timestamp);
    return;
  }

  await db.execute(
    `UPDATE tasks SET status = 'cleared', cleared_at = $1, queue = 'backlog'
     WHERE id = $2`,
    [timestamp, id],
  );
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
    await unpromoteSubtask(id);
    return;
  }

  await setTaskStatus(id, "cleared");
}

export async function clearCompletedInQueue(queue: TaskQueue): Promise<void> {
  const db = await getDatabase();
  const timestamp = nowIso();

  const parents = await selectTasks(
    `SELECT id FROM tasks
     WHERE queue = $1 AND parent_id IS NULL AND status = 'completed'`,
    [queue],
  );

  await db.execute(
    `UPDATE tasks SET status = 'cleared', cleared_at = $1
     WHERE queue = $2 AND parent_id IS NULL AND status = 'completed'`,
    [timestamp, queue],
  );

  for (const parent of parents) {
    await db.execute(
      `UPDATE tasks SET status = 'cleared', cleared_at = $1
       WHERE parent_id = $2 AND status = 'completed'`,
      [timestamp, parent.id],
    );
  }
}

export async function promoteSubtask(
  subtaskId: string,
  queue: TaskQueue,
): Promise<Task> {
  const subtask = await getTaskById(subtaskId);
  if (!subtask?.parentId) {
    throw new Error("Only subtasks can be promoted");
  }

  const existing = await selectTasks(
    `SELECT * FROM tasks
     WHERE surface_of_id = $1 AND queue = $2 AND status != 'cleared'`,
    [subtaskId, queue],
  );
  if (existing[0]) return existing[0];

  const db = await getDatabase();
  const id = crypto.randomUUID();
  const sortOrder = await nextSortOrder(queue);

  await db.execute(
    `INSERT INTO tasks (
      id, title, notes, queue, parent_id, surface_of_id, sort_order,
      due_date, tags, source_link, status, created_at
    ) VALUES ($1, $2, $3, $4, NULL, $5, $6, $7, $8, $9, $10, $11)`,
    [
      id,
      subtask.title,
      subtask.notes,
      queue,
      subtaskId,
      sortOrder,
      subtask.dueDate,
      JSON.stringify(subtask.tags),
      subtask.sourceLink,
      subtask.status,
      nowIso(),
    ],
  );

  const tasks = await selectTasks("SELECT * FROM tasks WHERE id = $1", [id]);
  return tasks[0];
}

export async function unpromoteSubtask(surfaceId: string): Promise<void> {
  const db = await getDatabase();
  await db.execute("DELETE FROM tasks WHERE id = $1 AND surface_of_id IS NOT NULL", [
    surfaceId,
  ]);
}

export async function moveTask(
  id: string,
  queue: TaskQueue,
  sortOrder: number,
): Promise<void> {
  const db = await getDatabase();
  const task = await getTaskById(id);
  if (!task) return;

  if (task.surfaceOfId) {
    await db.execute(
      `UPDATE tasks SET queue = $1, sort_order = $2 WHERE id = $3`,
      [queue, sortOrder, id],
    );
    return;
  }

  await db.execute(
    `UPDATE tasks SET queue = $1, sort_order = $2 WHERE id = $3`,
    [queue, sortOrder, id],
  );

  if (!task.parentId) {
    await db.execute(
      `UPDATE tasks SET queue = $1
       WHERE parent_id = $2 AND surface_of_id IS NULL`,
      [queue, id],
    );
  }
}

export async function reorderTasks(
  queue: TaskQueue,
  orderedIds: string[],
): Promise<void> {
  const db = await getDatabase();
  for (let i = 0; i < orderedIds.length; i++) {
    await db.execute(
      `UPDATE tasks SET sort_order = $1, queue = $2 WHERE id = $3`,
      [i, queue, orderedIds[i]],
    );
  }
}

export async function deleteTask(id: string): Promise<void> {
  const db = await getDatabase();
  const task = await getTaskById(id);
  if (!task) return;

  const subtasks = await selectTasks(
    "SELECT id FROM tasks WHERE parent_id = $1",
    [id],
  );

  for (const subtask of subtasks) {
    await db.execute("DELETE FROM tasks WHERE surface_of_id = $1", [
      subtask.id,
    ]);
  }

  await db.execute("DELETE FROM tasks WHERE surface_of_id = $1", [id]);
  await db.execute("DELETE FROM tasks WHERE parent_id = $1", [id]);
  await db.execute("DELETE FROM tasks WHERE id = $1", [id]);
}

export async function purgeArchive(): Promise<void> {
  const db = await getDatabase();

  const cleared = await selectTasks(
    "SELECT id FROM tasks WHERE status = 'cleared'",
  );

  for (const task of cleared) {
    await deleteTask(task.id);
  }

  await db.execute("DELETE FROM tasks WHERE status = 'cleared'");
}

export function isOverdue(task: Task): boolean {
  if (!task.dueDate || task.status !== "active") return false;
  return task.dueDate < todayDate();
}

export function formatDueDate(dueDate: string): string {
  const today = todayDate();
  if (dueDate === today) return "Today";
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (dueDate === tomorrow.toISOString().slice(0, 10)) return "Tomorrow";
  return new Date(`${dueDate}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
