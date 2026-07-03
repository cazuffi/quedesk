import type { Task, TaskQueue } from "../types";

/** Local calendar date as YYYY-MM-DD (no UTC drift). */
export function toDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayDateString(): string {
  return toDateOnly(new Date());
}

/** Monday–Sunday range for the week containing `reference`. */
export function getThisWeekRange(reference = new Date()): {
  start: string;
  end: string;
} {
  const date = new Date(reference);
  const weekday = date.getDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;

  const monday = new Date(date);
  monday.setDate(date.getDate() + mondayOffset);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return { start: toDateOnly(monday), end: toDateOnly(sunday) };
}

/**
 * Resolve the queue a due date implies.
 * - Today or overdue → Today
 * - Later this week → This Week
 * - No due date or outside this week → null (keep current queue)
 */
export function queueForDueDate(
  dueDate: string | null | undefined,
  reference = new Date(),
): TaskQueue | null {
  if (!dueDate) return null;

  const today = todayDateString();
  if (dueDate <= today) return "today";

  const { start, end } = getThisWeekRange(reference);
  if (dueDate >= start && dueDate <= end) return "week";

  return null;
}

export function shouldAutoRoute(task: Task): boolean {
  return task.status !== "cleared" && Boolean(task.dueDate);
}

export function targetQueueForTask(task: Task): TaskQueue | null {
  if (!shouldAutoRoute(task)) return null;
  return queueForDueDate(task.dueDate);
}
