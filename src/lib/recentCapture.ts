import type { Task } from "../types";

const NEW_CAPTURE_MS = 24 * 60 * 60 * 1000;

export function isRecentlyCaptured(
  task: Task,
  now = Date.now(),
): boolean {
  const created = Date.parse(task.createdAt);
  if (Number.isNaN(created)) return false;
  return now - created < NEW_CAPTURE_MS;
}

export function countRecentlyCaptured(tasks: Task[]): number {
  return tasks.filter((task) => isRecentlyCaptured(task)).length;
}
