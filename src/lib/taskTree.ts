import type { Task } from "../types";

export function isTopLevelInQueue(task: Task): boolean {
  return task.parentId === null;
}

export function isSurfaceCopy(task: Task): boolean {
  return task.surfaceOfId !== null;
}

export function isSubtask(task: Task): boolean {
  return task.parentId !== null && !task.surfaceOfId;
}

export function parentProgress(subtasks: Task[]): {
  done: number;
  total: number;
} {
  const total = subtasks.length;
  const done = subtasks.filter((t) => t.status === "completed").length;
  return { done, total };
}

export function getSubtasks(allTasks: Task[], parentId: string): Task[] {
  return allTasks
    .filter((t) => t.parentId === parentId && !t.surfaceOfId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getSurfacesForSubtask(
  allTasks: Task[],
  subtaskId: string,
): Task[] {
  return allTasks.filter(
    (t) => t.surfaceOfId === subtaskId && t.status !== "cleared",
  );
}

export function resolveParentTitle(
  allTasks: Task[],
  surface: Task,
): string | null {
  if (!surface.surfaceOfId) return null;
  const subtask = allTasks.find((t) => t.id === surface.surfaceOfId);
  if (!subtask?.parentId) return null;
  return allTasks.find((t) => t.id === subtask.parentId)?.title ?? null;
}
