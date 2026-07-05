import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getSubtasks,
  isArchiveRoot,
} from "../lib/taskTree";
import {
  clearCompletedInQueue,
  clearTask,
  createSubtask,
  createTask,
  deleteTask,
  fetchAllTasks,
  getNextIncompleteSibling,
  moveTask,
  nextSortOrder,
  pinSubtask,
  purgeArchive,
  reorderTasks,
  searchTasks,
  toggleTaskComplete,
  unpinSubtask,
  updateTask,
  type CreateTaskInput,
  type UpdateTaskInput,
} from "../lib/data";
import { listenForTasksChanged, notifyTasksChanged } from "../lib/tasksEvents";
import type { QueueTab, Task, TaskQueue } from "../types";

export interface NextSiblingPrompt {
  completedTask: Task;
  nextSibling: Task | null;
  parent: Task | null;
  progress: { done: number; total: number };
  queue: TaskQueue;
}

interface TasksContextValue {
  tasks: Task[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: Task[];
  refresh: () => Promise<void>;
  addTask: (input: CreateTaskInput) => Promise<void>;
  addSubtask: (parentId: string, title: string) => Promise<void>;
  addSubtasksBatch: (parentId: string, titles: string[]) => Promise<Task[]>;
  editTask: (id: string, input: UpdateTaskInput) => Promise<void>;
  toggleComplete: (task: Task) => Promise<void>;
  clearOne: (id: string) => Promise<void>;
  clearCompleted: (queue: TaskQueue) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  purgeAllArchive: () => Promise<void>;
  moveTaskToQueue: (taskId: string, queue: TaskQueue) => Promise<void>;
  reorderInQueue: (queue: TaskQueue, orderedIds: string[]) => Promise<void>;
  pinSubtaskToQueue: (subtaskId: string, queue: TaskQueue) => Promise<void>;
  unpinFromQueue: (surfaceId: string) => Promise<void>;
  tasksForTab: (tab: QueueTab) => Task[];
  subtasksFor: (parentId: string) => Task[];
  nextSiblingPrompt: NextSiblingPrompt | null;
  dismissNextSiblingPrompt: () => void;
  completeParentFromPrompt: () => Promise<void>;
}

const TasksContext = createContext<TasksContextValue | null>(null);

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Task[]>([]);
  const [nextSiblingPrompt, setNextSiblingPrompt] =
    useState<NextSiblingPrompt | null>(null);

  const refresh = useCallback(async () => {
    const all = await fetchAllTasks();
    setTasks(all);
  }, []);

  const refreshAndNotify = useCallback(async () => {
    await refresh();
    await notifyTasksChanged();
  }, [refresh]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    refresh()
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    listenForTasksChanged(() => {
      refresh().catch(console.error);
    }).then((dispose) => {
      unlisten = dispose;
    });
    return () => {
      unlisten?.();
    };
  }, [refresh]);

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        refresh().catch(console.error);
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [refresh]);

  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      searchTasks(query)
        .then((results) => {
          if (!cancelled) setSearchResults(results);
        })
        .catch(console.error);
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const tasksForTab = useCallback(
    (tab: QueueTab): Task[] => {
      if (tab === "archive") {
        return tasks
          .filter(isArchiveRoot)
          .sort((a, b) => {
            const aTime = a.clearedAt ? Date.parse(a.clearedAt) : 0;
            const bTime = b.clearedAt ? Date.parse(b.clearedAt) : 0;
            return bTime - aTime;
          });
      }
      return tasks
        .filter(
          (t) =>
            t.queue === tab && t.status !== "cleared" && t.parentId === null,
        )
        .sort((a, b) => a.sortOrder - b.sortOrder);
    },
    [tasks],
  );

  const subtasksFor = useCallback(
    (parentId: string) => {
      const parent = tasks.find((t) => t.id === parentId);
      const subs = getSubtasks(tasks, parentId);
      if (parent?.status === "cleared") {
        return subs.filter((t) => t.status === "cleared");
      }
      return subs.filter((t) => t.status !== "cleared");
    },
    [tasks],
  );

  const addTask = useCallback(
    async (input: CreateTaskInput) => {
      await createTask(input);
      await refreshAndNotify();
    },
    [refreshAndNotify],
  );

  const addSubtask = useCallback(async (parentId: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;

    const tempId = `pending-${crypto.randomUUID()}`;

    setTasks((prev) => {
      const parent = prev.find((t) => t.id === parentId);
      const optimistic: Task = {
        id: tempId,
        title: trimmed,
        notes: "",
        queue: parent?.queue ?? "inbox",
        parentId,
        surfaceOfId: null,
        sortOrder: getSubtasks(prev, parentId).length,
        dueDate: null,
        tags: [],
        sourceLink: null,
        status: "active",
        createdAt: new Date().toISOString(),
        completedAt: null,
        clearedAt: null,
      };
      return [...prev, optimistic];
    });

    try {
      const task = await createSubtask(parentId, trimmed);
      setTasks((prev) => prev.map((t) => (t.id === tempId ? task : t)));
      void notifyTasksChanged();
    } catch (error) {
      setTasks((prev) => prev.filter((t) => t.id !== tempId));
      throw error;
    }
  }, []);

  const addSubtasksBatch = useCallback(
    async (parentId: string, titles: string[]): Promise<Task[]> => {
      const trimmed = titles.map((t) => t.trim()).filter(Boolean);
      if (trimmed.length === 0) return [];

      const pending = trimmed.map((title, index) => ({
        tempId: `pending-${crypto.randomUUID()}`,
        title,
        index,
      }));

      setTasks((prev) => {
        const parent = prev.find((t) => t.id === parentId);
        const baseOrder = getSubtasks(prev, parentId).length;
        const optimistic = pending.map(({ tempId, title, index }) => ({
          id: tempId,
          title,
          notes: "",
          queue: parent?.queue ?? "inbox",
          parentId,
          surfaceOfId: null,
          sortOrder: baseOrder + index,
          dueDate: null,
          tags: [],
          sourceLink: null,
          status: "active" as const,
          createdAt: new Date().toISOString(),
          completedAt: null,
          clearedAt: null,
        }));
        return [...prev, ...optimistic];
      });

      try {
        const created = await Promise.all(
          trimmed.map((title) => createSubtask(parentId, title)),
        );

        const tempToReal = new Map(
          pending.map((p, index) => [p.tempId, created[index]]),
        );

        setTasks((prev) =>
          prev.map((t) => tempToReal.get(t.id) ?? t),
        );
        void notifyTasksChanged();
        return created;
      } catch (error) {
        const tempIds = new Set(pending.map((p) => p.tempId));
        setTasks((prev) => prev.filter((t) => !tempIds.has(t.id)));
        throw error;
      }
    },
    [],
  );

  const editTask = useCallback(
    async (id: string, input: UpdateTaskInput) => {
      await updateTask(id, input);
      await refreshAndNotify();
    },
    [refreshAndNotify],
  );

  const toggleComplete = useCallback(
    async (task: Task) => {
      const wasActive = task.status === "active";
      await toggleTaskComplete(task);
      await refreshAndNotify();

      if (wasActive && (task.surfaceOfId || task.parentId)) {
        try {
          const result = await getNextIncompleteSibling(task.id);
          if (result.next || result.progress.done === result.progress.total) {
            setNextSiblingPrompt({
              completedTask: task,
              nextSibling: result.next,
              parent: result.parent,
              progress: result.progress,
              queue: task.queue,
            });
          }
        } catch {
          // Silently ignore — prompt is a nice-to-have
        }
      }
    },
    [refreshAndNotify],
  );

  const clearOne = useCallback(
    async (id: string) => {
      await clearTask(id);
      await refreshAndNotify();
    },
    [refreshAndNotify],
  );

  const clearCompleted = useCallback(
    async (queue: TaskQueue) => {
      await clearCompletedInQueue(queue);
      await refreshAndNotify();
    },
    [refreshAndNotify],
  );

  const removeTask = useCallback(
    async (id: string) => {
      await deleteTask(id);
      await refreshAndNotify();
    },
    [refreshAndNotify],
  );

  const purgeAllArchive = useCallback(async () => {
    await purgeArchive();
    await refreshAndNotify();
  }, [refreshAndNotify]);

  const moveTaskToQueue = useCallback(
    async (taskId: string, queue: TaskQueue) => {
      try {
        const sortOrder = await nextSortOrder(queue);
        await moveTask(taskId, queue, sortOrder);
        await refreshAndNotify();
      } catch (error) {
        console.error("moveTaskToQueue failed:", error);
        throw error;
      }
    },
    [refreshAndNotify],
  );

  const reorderInQueue = useCallback(
    async (queue: TaskQueue, orderedIds: string[]) => {
      await reorderTasks(queue, orderedIds);
      await refreshAndNotify();
    },
    [refreshAndNotify],
  );

  const pinSubtaskToQueue = useCallback(
    async (subtaskId: string, queue: TaskQueue) => {
      await pinSubtask(subtaskId, queue);
      await refreshAndNotify();
    },
    [refreshAndNotify],
  );

  const unpinFromQueue = useCallback(
    async (surfaceId: string) => {
      await unpinSubtask(surfaceId);
      await refreshAndNotify();
    },
    [refreshAndNotify],
  );

  const dismissNextSiblingPrompt = useCallback(() => {
    setNextSiblingPrompt(null);
  }, []);

  const completeParentFromPrompt = useCallback(async () => {
    const prompt = nextSiblingPrompt;
    if (!prompt?.parent) return;
    const parentTask = tasks.find((t) => t.id === prompt.parent!.id);
    if (parentTask) {
      await toggleTaskComplete(parentTask);
      await refreshAndNotify();
    }
    setNextSiblingPrompt(null);
  }, [nextSiblingPrompt, tasks, refreshAndNotify]);

  const value = useMemo(
    () => ({
      tasks,
      loading,
      searchQuery,
      setSearchQuery,
      searchResults,
      refresh,
      addTask,
      addSubtask,
      addSubtasksBatch,
      editTask,
      toggleComplete,
      clearOne,
      clearCompleted,
      removeTask,
      purgeAllArchive,
      moveTaskToQueue,
      reorderInQueue,
      pinSubtaskToQueue,
      unpinFromQueue,
      tasksForTab,
      subtasksFor,
      nextSiblingPrompt,
      dismissNextSiblingPrompt,
      completeParentFromPrompt,
    }),
    [
      tasks,
      loading,
      searchQuery,
      searchResults,
      refresh,
      addTask,
      addSubtask,
      addSubtasksBatch,
      editTask,
      toggleComplete,
      clearOne,
      clearCompleted,
      removeTask,
      purgeAllArchive,
      moveTaskToQueue,
      reorderInQueue,
      pinSubtaskToQueue,
      unpinFromQueue,
      tasksForTab,
      subtasksFor,
      nextSiblingPrompt,
      dismissNextSiblingPrompt,
      completeParentFromPrompt,
    ],
  );

  return (
    <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error("useTasks must be used within TasksProvider");
  }
  return context;
}
