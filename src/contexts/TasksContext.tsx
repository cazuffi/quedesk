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
} from "../lib/taskTree";
import {
  clearCompletedInQueue,
  clearTask,
  createSubtask,
  createTask,
  deleteTask,
  fetchAllTasks,
  moveTask,
  nextSortOrder,
  promoteSubtask,
  purgeArchive,
  reorderTasks,
  searchTasks,
  toggleTaskComplete,
  unpromoteSubtask,
  updateTask,
  type CreateTaskInput,
  type UpdateTaskInput,
} from "../lib/tasks";
import { listenForTasksChanged, notifyTasksChanged } from "../lib/tasksEvents";
import type { QueueTab, Task, TaskQueue } from "../types";

interface TasksContextValue {
  tasks: Task[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: Task[];
  refresh: () => Promise<void>;
  addTask: (input: CreateTaskInput) => Promise<void>;
  addSubtask: (parentId: string, title: string) => Promise<void>;
  editTask: (id: string, input: UpdateTaskInput) => Promise<void>;
  toggleComplete: (task: Task) => Promise<void>;
  clearOne: (id: string) => Promise<void>;
  clearCompleted: (queue: TaskQueue) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  purgeAllArchive: () => Promise<void>;
  moveTaskToQueue: (taskId: string, queue: TaskQueue) => Promise<void>;
  reorderInQueue: (queue: TaskQueue, orderedIds: string[]) => Promise<void>;
  promoteSubtaskToQueue: (
    subtaskId: string,
    queue: TaskQueue,
  ) => Promise<void>;
  unpromoteSurface: (surfaceId: string) => Promise<void>;
  tasksForTab: (tab: QueueTab) => Task[];
  subtasksFor: (parentId: string) => Task[];
}

const TasksContext = createContext<TasksContextValue | null>(null);

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Task[]>([]);

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
        return tasks.filter((t) => t.status === "cleared");
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
    (parentId: string) => getSubtasks(tasks, parentId),
    [tasks],
  );

  const addTask = useCallback(
    async (input: CreateTaskInput) => {
      await createTask(input);
      await refreshAndNotify();
    },
    [refreshAndNotify],
  );

  const addSubtask = useCallback(
    async (parentId: string, title: string) => {
      await createSubtask(parentId, title);
      await refreshAndNotify();
    },
    [refreshAndNotify],
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
      await toggleTaskComplete(task);
      await refreshAndNotify();
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

  const promoteSubtaskToQueue = useCallback(
    async (subtaskId: string, queue: TaskQueue) => {
      await promoteSubtask(subtaskId, queue);
      await refreshAndNotify();
    },
    [refreshAndNotify],
  );

  const unpromoteSurface = useCallback(
    async (surfaceId: string) => {
      await unpromoteSubtask(surfaceId);
      await refreshAndNotify();
    },
    [refreshAndNotify],
  );

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
      editTask,
      toggleComplete,
      clearOne,
      clearCompleted,
      removeTask,
      purgeAllArchive,
      moveTaskToQueue,
      reorderInQueue,
      promoteSubtaskToQueue,
      unpromoteSurface,
      tasksForTab,
      subtasksFor,
    }),
    [
      tasks,
      loading,
      searchQuery,
      searchResults,
      refresh,
      addTask,
      addSubtask,
      editTask,
      toggleComplete,
      clearOne,
      clearCompleted,
      removeTask,
      purgeAllArchive,
      moveTaskToQueue,
      reorderInQueue,
      promoteSubtaskToQueue,
      unpromoteSurface,
      tasksForTab,
      subtasksFor,
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
