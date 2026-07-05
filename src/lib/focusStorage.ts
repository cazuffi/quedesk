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

export type FocusDensity = "auto" | "cozy" | "compact" | "ultra";

const DENSITY_KEY = "quedesk:focus-density";
const POPOUT_WIDTH_KEY = "quedesk:focus-popout-width";

export const FOCUS_MIN_WIDTH = 180;
export const FOCUS_DEFAULT_POPOUT_WIDTH = 260;
export const FOCUS_MAX_POPOUT_WIDTH = 480;

export function readFocusDensity(): FocusDensity {
  const value = readStorage(DENSITY_KEY);
  if (value === "cozy" || value === "compact" || value === "ultra") return value;
  return "auto";
}

export function writeFocusDensity(density: FocusDensity): void {
  writeStorage(DENSITY_KEY, density);
}

export function cycleFocusDensity(current: FocusDensity): FocusDensity {
  if (current === "auto") return "compact";
  if (current === "compact") return "ultra";
  return "auto";
}

export function focusDensityLabel(density: FocusDensity): string {
  if (density === "auto") return "Auto width";
  if (density === "compact") return "Compact";
  return "Ultra slim";
}

export function readFocusPopoutWidth(): number {
  const raw = readStorage(POPOUT_WIDTH_KEY);
  if (!raw) return FOCUS_DEFAULT_POPOUT_WIDTH;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) return FOCUS_DEFAULT_POPOUT_WIDTH;
  return Math.min(FOCUS_MAX_POPOUT_WIDTH, Math.max(FOCUS_MIN_WIDTH, parsed));
}

export function writeFocusPopoutWidth(width: number): void {
  writeStorage(
    POPOUT_WIDTH_KEY,
    String(Math.min(FOCUS_MAX_POPOUT_WIDTH, Math.max(FOCUS_MIN_WIDTH, width))),
  );
}

export type FocusWidthBand = "wide" | "cozy" | "compact" | "ultra";

export function widthToBand(width: number): FocusWidthBand {
  if (width < 200) return "ultra";
  if (width < 260) return "compact";
  if (width < 320) return "cozy";
  return "wide";
}

export function resolveFocusBand(
  density: FocusDensity,
  measuredBand: FocusWidthBand,
): FocusWidthBand {
  if (density === "auto") return measuredBand;
  if (density === "cozy") return "cozy";
  if (density === "compact") return "compact";
  return "ultra";
}

export function isUltraCompact(band: FocusWidthBand): boolean {
  return band === "ultra" || band === "compact";
}
