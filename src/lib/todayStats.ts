import { isOverdue } from "./dueDateQueue";
import type { Task } from "../types";

export interface TodayStats {
  active: number;
  completed: number;
  overdue: number;
  total: number;
}

export function computeTodayStats(tasks: Task[]): TodayStats {
  let active = 0;
  let completed = 0;
  let overdue = 0;

  for (const task of tasks) {
    if (task.status === "completed") {
      completed += 1;
    } else if (task.status === "active") {
      active += 1;
      if (isOverdue(task)) overdue += 1;
    }
  }

  return { active, completed, overdue, total: tasks.length };
}

export function formatTodaySummary(stats: TodayStats): string {
  if (stats.total === 0) {
    return "Nothing on today’s list — add a focus task or pull from Inbox.";
  }

  const parts: string[] = [];
  if (stats.active > 0) parts.push(`${stats.active} to do`);
  if (stats.overdue > 0) parts.push(`${stats.overdue} overdue`);
  if (stats.completed > 0) parts.push(`${stats.completed} done`);
  return parts.join(" · ");
}
