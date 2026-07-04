import { isDesktop } from "./platform";
import type { Task, TaskQueue, TaskStatus } from "../types";

export type { Task, TaskQueue, TaskStatus };
export type { CreateTaskInput, UpdateTaskInput } from "./tasks";
export { isOverdue, formatDueDate } from "./dueDateQueue";

type DataModule = typeof import("./tasks") | typeof import("./tasks-supabase");

let mod: DataModule | null = null;

async function getModule(): Promise<DataModule> {
  if (mod) return mod;

  if (isDesktop()) {
    mod = await import("./tasks");
  } else {
    mod = await import("./tasks-supabase");
  }
  return mod;
}

export async function fetchAllTasks() {
  return (await getModule()).fetchAllTasks();
}
export async function searchTasks(query: string) {
  return (await getModule()).searchTasks(query);
}
export async function nextSortOrder(queue: TaskQueue) {
  return (await getModule()).nextSortOrder(queue);
}
export async function createTask(
  input: import("./tasks").CreateTaskInput,
) {
  return (await getModule()).createTask(input);
}
export async function createSubtask(parentId: string, title: string) {
  return (await getModule()).createSubtask(parentId, title);
}
export async function updateTask(
  id: string,
  input: import("./tasks").UpdateTaskInput,
) {
  return (await getModule()).updateTask(id, input);
}
export async function setTaskStatus(id: string, status: TaskStatus) {
  return (await getModule()).setTaskStatus(id, status);
}
export async function toggleTaskComplete(task: Task) {
  return (await getModule()).toggleTaskComplete(task);
}
export async function clearTask(id: string) {
  return (await getModule()).clearTask(id);
}
export async function clearCompletedInQueue(queue: TaskQueue) {
  return (await getModule()).clearCompletedInQueue(queue);
}
export async function pinSubtask(subtaskId: string, queue: TaskQueue) {
  return (await getModule()).pinSubtask(subtaskId, queue);
}
export async function unpinSubtask(surfaceId: string) {
  return (await getModule()).unpinSubtask(surfaceId);
}
export async function moveTask(
  id: string,
  queue: TaskQueue,
  sortOrder: number,
) {
  return (await getModule()).moveTask(id, queue, sortOrder);
}
export async function reorderTasks(queue: TaskQueue, orderedIds: string[]) {
  return (await getModule()).reorderTasks(queue, orderedIds);
}
export async function deleteTask(id: string) {
  return (await getModule()).deleteTask(id);
}
export async function purgeArchive() {
  return (await getModule()).purgeArchive();
}
export async function getNextIncompleteSibling(subtaskId: string) {
  return (await getModule()).getNextIncompleteSibling(subtaskId);
}
export async function syncAllTaskQueuesFromDueDates() {
  return (await getModule()).syncAllTaskQueuesFromDueDates();
}
