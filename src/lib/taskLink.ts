import { isDesktop } from "./platform";

const TASK_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** In-app link stored in markdown or task.sourceLink. */
export function buildTaskLink(taskId: string): string {
  if (isDesktop()) {
    return `quedesk:task/${taskId}`;
  }
  const path =
    typeof window !== "undefined"
      ? window.location.pathname.replace(/\/?$/, "/")
      : "/quedesk/";
  return `${path}?task=${taskId}`;
}

export function parseTaskLink(link: string): string | null {
  const trimmed = link.trim();
  if (!trimmed) return null;

  const queryMatch = trimmed.match(/[?&]task=([0-9a-f-]{36})/i);
  if (queryMatch?.[1] && TASK_ID_RE.test(queryMatch[1])) {
    return queryMatch[1];
  }

  const protoMatch = trimmed.match(/^quedesk:task\/([0-9a-f-]{36})$/i);
  if (protoMatch?.[1] && TASK_ID_RE.test(protoMatch[1])) {
    return protoMatch[1];
  }

  return null;
}

export function isTaskLink(link: string): boolean {
  return parseTaskLink(link) !== null;
}

/** Markdown link inserted in journal when text becomes a task. */
export function buildTaskMarkdownLink(title: string, taskId: string): string {
  const safe = title.replace(/[\[\]]/g, "").trim() || "Task";
  return `[✓ ${safe}](${buildTaskLink(taskId)})`;
}

export function replaceTextRange(
  content: string,
  start: number,
  end: number,
  replacement: string,
): string {
  return content.slice(0, start) + replacement + content.slice(end);
}
