import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useEffect, useMemo, useRef, useState } from "react";
import { FocusView } from "./components/FocusView";
import { Header } from "./components/Header";
import { QueuePanel } from "./components/QueuePanel";
import { StatusBar } from "./components/StatusBar";
import { TabBar } from "./components/TabBar";
import { TaskDetailPanel } from "./components/TaskDetailPanel";
import { TaskDragPreview } from "./components/TaskDragPreview";
import { ConfirmProvider } from "./contexts/ConfirmContext";
import { TasksProvider, useTasks } from "./contexts/TasksContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { UiProvider, useUi } from "./contexts/UiContext";
import {
  handleDragOverQueueHighlight,
  queueAwareCollisionDetection,
  queueFromDragEvent,
} from "./lib/dnd";
import { isDesktop } from "./lib/platform";
import { todayDateString } from "./lib/dueDateQueue";
import {
  parseTaskDragId,
  QUEUE_TABS,
  type QueueTab,
  type Task,
  type TaskQueue,
} from "./types";

function AppContent() {
  const [activeTab, setActiveTab] = useState<QueueTab>("today");
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [draggingTask, setDraggingTask] = useState<Task | null>(null);
  const [dropTargetTab, setDropTargetTab] = useState<QueueTab | null>(null);

  const {
    searchQuery,
    setSearchQuery,
    tasks,
    tasksForTab,
    moveTaskToQueue,
    reorderInQueue,
    editTask,
    toggleComplete,
    removeTask,
  } = useTasks();

  const {
    selectedTaskId,
    panelLayout,
    focusMode,
    closePanel,
    expandPanel,
    collapsePanel,
  } = useUi();

  const isSearchActive = searchQuery.trim().length > 0;

  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === selectedTaskId) ?? null,
    [tasks, selectedTaskId],
  );

  const activeTabConfig = useMemo(
    () => QUEUE_TABS.find((tab) => tab.id === activeTab) ?? QUEUE_TABS[0],
    [activeTab],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (isDesktop()) {
        const { checkDatabaseHealth } = await import("./lib/db");
        const ok = await checkDatabaseHealth();
        if (!cancelled) {
          setDbReady(ok);
          if (!ok) setDbError("Schema not initialized");
        }
      } else {
        const { checkDatabaseHealth } = await import("./lib/tasks-supabase");
        const ok = await checkDatabaseHealth();
        if (!cancelled) {
          setDbReady(ok);
          if (!ok) setDbError("Could not connect to backend");
        }
      }
    })().catch((error: unknown) => {
      if (!cancelled) {
        setDbError(error instanceof Error ? error.message : "Unknown error");
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (focusMode) {
      setActiveTab("today");
    }
  }, [focusMode]);

  useEffect(() => {
    if (selectedTaskId && !tasks.some((t) => t.id === selectedTaskId)) {
      closePanel();
    }
  }, [tasks, selectedTaskId, closePanel]);

  function handleTabChange(tab: QueueTab) {
    setSearchQuery("");
    setActiveTab(tab);
  }

  function handleDragStart(event: DragStartEvent) {
    const taskId = parseTaskDragId(event.active.id);
    if (!taskId) return;
    const task = tasks.find((t) => t.id === taskId) ?? null;
    setDraggingTask(task);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setDraggingTask(null);
    setDropTargetTab(null);

    if (!over) return;

    const taskId = parseTaskDragId(active.id);
    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === "cleared") return;

    const targetQueue = queueFromDragEvent(event);
    if (targetQueue && targetQueue !== "archive") {
      try {
        if (task.queue !== targetQueue) {
          await moveTaskToQueue(taskId, targetQueue as TaskQueue);
        }
        if (targetQueue === "today" && !task.surfaceOfId) {
          await editTask(taskId, { dueDate: todayDateString() });
        }
        handleTabChange(targetQueue);
      } catch (error) {
        console.error("Failed to move task:", error);
      }
      return;
    }

    const overTaskId = parseTaskDragId(over.id);
    if (!overTaskId || overTaskId === taskId) return;

    const queueTasks = tasksForTab(task.queue as QueueTab).filter(
      (t) => t.status !== "cleared",
    );
    const oldIndex = queueTasks.findIndex((t) => t.id === taskId);
    const newIndex = queueTasks.findIndex((t) => t.id === overTaskId);
    if (oldIndex < 0 || newIndex < 0) return;

    try {
      const reordered = arrayMove(queueTasks, oldIndex, newIndex);
      await reorderInQueue(
        task.queue,
        reordered.map((t) => t.id),
      );
    } catch (error) {
      console.error("Failed to reorder tasks:", error);
    }
  }

  function handleDragOver(event: DragOverEvent) {
    handleDragOverQueueHighlight(event, setDropTargetTab);
  }

  function handleTaskMoved(queue: TaskQueue) {
    handleTabChange(queue);
  }

  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (panelLayout !== "side") return;

    function handleClickOutside(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node)
      ) {
        closePanel();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [panelLayout, closePanel]);

  async function handleDeleteFromPanel(id: string) {
    await removeTask(id);
    closePanel();
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={queueAwareCollisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setDraggingTask(null);
        setDropTargetTab(null);
      }}
    >
      <div className="flex h-full flex-col bg-[var(--color-surface)]">
        <Header />

        {!focusMode && (
          <TabBar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            dropTargetTab={dropTargetTab}
          />
        )}

        <main className="flex min-h-0 flex-1 overflow-hidden">
          {focusMode ? (
            <div className="flex min-w-0 flex-1">
              <div className="min-w-0 flex-1 overflow-hidden">
                <FocusView />
              </div>
              {panelLayout === "side" && selectedTask && (
                <div ref={panelRef} className="flex h-full shrink-0">
                  <TaskDetailPanel
                    task={selectedTask}
                    allTasks={tasks}
                    layout="side"
                    onClose={closePanel}
                    onExpand={expandPanel}
                    onCollapse={collapsePanel}
                    onSave={editTask}
                    onToggle={toggleComplete}
                    onMove={moveTaskToQueue}
                    onDelete={handleDeleteFromPanel}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="flex min-w-0 flex-1">
              <div className="min-w-0 flex-1 overflow-hidden">
                <QueuePanel
                  tab={activeTabConfig}
                  isSearchActive={isSearchActive}
                  onTaskMoved={handleTaskMoved}
                />
              </div>
              {panelLayout === "side" && selectedTask && (
                <div ref={panelRef} className="flex h-full shrink-0">
                  <TaskDetailPanel
                    task={selectedTask}
                    allTasks={tasks}
                    layout="side"
                    onClose={closePanel}
                    onExpand={expandPanel}
                    onCollapse={collapsePanel}
                    onSave={editTask}
                    onToggle={toggleComplete}
                    onMove={moveTaskToQueue}
                    onDelete={handleDeleteFromPanel}
                  />
                </div>
              )}
            </div>
          )}
        </main>

        <StatusBar dbReady={dbReady} dbError={dbError} />
      </div>

      {panelLayout === "full" && selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          allTasks={tasks}
          layout="full"
          onClose={closePanel}
          onExpand={expandPanel}
          onCollapse={collapsePanel}
          onSave={editTask}
          onToggle={toggleComplete}
          onMove={moveTaskToQueue}
          onDelete={handleDeleteFromPanel}
        />
      )}

      <DragOverlay adjustScale={false} dropAnimation={null}>
        {draggingTask ? <TaskDragPreview task={draggingTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ConfirmProvider>
        <TasksProvider>
          <UiProvider>
            <AppContent />
          </UiProvider>
        </TasksProvider>
      </ConfirmProvider>
    </ThemeProvider>
  );
}

export default App;
