import type { Task } from "../types";

const NOW_TASK_KEY = "quedesk:focus-now-task";
const COLLAPSED_KEY = "quedesk:focus-collapsed";
const DOCK_KEY = "quedesk:focus-dock";

export type FocusDock = "left" | "right" | "center";

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

export function readFocusNowTaskId(): string | null {
  return readStorage(NOW_TASK_KEY);
}

export function writeFocusNowTaskId(id: string | null): void {
  writeStorage(NOW_TASK_KEY, id);
}

export function readFocusCollapsed(): boolean {
  return readStorage(COLLAPSED_KEY) === "1";
}

export function writeFocusCollapsed(collapsed: boolean): void {
  writeStorage(COLLAPSED_KEY, collapsed ? "1" : "0");
}

export function readFocusDock(): FocusDock {
  const value = readStorage(DOCK_KEY);
  if (value === "left" || value === "right" || value === "center") return value;
  return "right";
}

export function writeFocusDock(dock: FocusDock): void {
  writeStorage(DOCK_KEY, dock);
}

export function resolveNowTask(
  tasks: Task[],
  explicitId: string | null,
): Task | null {
  if (explicitId) {
    const pinned = tasks.find(
      (task) => task.id === explicitId && task.status === "active",
    );
    if (pinned) return pinned;
  }
  return tasks.find((task) => task.status === "active") ?? null;
}

export function cycleFocusDock(current: FocusDock): FocusDock {
  if (current === "right") return "left";
  if (current === "left") return "center";
  return "right";
}
