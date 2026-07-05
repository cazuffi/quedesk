import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useTasks } from "../contexts/TasksContext";
import { useUi } from "../contexts/UiContext";
import { useFocusKeyboard } from "../hooks/useFocusKeyboard";
import {
  cycleFocusDock,
  cycleFocusDensity,
  focusDensityLabel,
  isUltraCompact,
  readFocusCollapsed,
  readFocusDensity,
  readFocusDock,
  readFocusNowTaskId,
  resolveFocusBand,
  resolveNowTask,
  writeFocusCollapsed,
  writeFocusDensity,
  writeFocusDock,
  writeFocusNowTaskId,
  FOCUS_DEFAULT_POPOUT_WIDTH,
  FOCUS_MIN_WIDTH,
  type FocusDensity,
  type FocusDock,
} from "../lib/focusStorage";
import {
  focusAppUrl,
  isFocusPopout,
  mainAppUrl,
  openFocusPopout,
  openFocusPopoutAtWidth,
} from "../lib/focusWindow";
import { useFocusWidthBand } from "../hooks/useFocusWidthBand";
import { computeTodayStats, formatTodaySummary } from "../lib/todayStats";
import { isWeb } from "../lib/platform";
import type { Task } from "../types";
import { FocusNowCard } from "./FocusNowCard";
import { FocusWidgetRow } from "./FocusWidgetRow";

export type FocusPanelVariant = "embedded" | "standalone";

interface FocusPanelProps {
  variant?: FocusPanelVariant;
  dock?: FocusDock;
  onDockChange?: (dock: FocusDock) => void;
  onExit?: () => void;
}

export function FocusPanel({
  variant = "embedded",
  dock: dockProp,
  onDockChange,
  onExit,
}: FocusPanelProps) {
  const { tasksForTab, toggleComplete, addTask, loading } = useTasks();
  const { hideCompleted, toggleHideCompleted, toggleFocusMode } = useUi();

  const [collapsed, setCollapsed] = useState(() => readFocusCollapsed());
  const [internalDock, setInternalDock] = useState<FocusDock>(() => readFocusDock());
  const dock = dockProp ?? internalDock;
  const [nowTaskId, setNowTaskId] = useState<string | null>(() =>
    readFocusNowTaskId(),
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [quickAdd, setQuickAdd] = useState("");
  const [adding, setAdding] = useState(false);
  const quickAddRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const standalone = variant === "standalone";
  const popout = isFocusPopout();
  const [density, setDensity] = useState<FocusDensity>(() => readFocusDensity());
  const measuredBand = useFocusWidthBand(panelRef);
  const band = resolveFocusBand(density, measuredBand);
  const slim = isUltraCompact(band);
  const ultra = band === "ultra";

  const todayTasks = useMemo(() => {
    const items = tasksForTab("today");
    if (!hideCompleted) return items;
    return items.filter((task) => task.status !== "completed");
  }, [tasksForTab, hideCompleted]);

  const activeTasks = useMemo(
    () => todayTasks.filter((task) => task.status === "active"),
    [todayTasks],
  );

  const nowTask = useMemo(
    () => resolveNowTask(todayTasks, nowTaskId),
    [todayTasks, nowTaskId],
  );

  const listTasks = useMemo(() => {
    if (!nowTask) return activeTasks;
    return activeTasks.filter((task) => task.id !== nowTask.id);
  }, [activeTasks, nowTask]);

  const stats = useMemo(() => computeTodayStats(todayTasks), [todayTasks]);

  useEffect(() => {
    if (nowTaskId && !todayTasks.some((task) => task.id === nowTaskId)) {
      setNowTaskId(null);
      writeFocusNowTaskId(null);
    }
  }, [nowTaskId, todayTasks]);

  useEffect(() => {
    if (selectedIndex >= listTasks.length) {
      setSelectedIndex(Math.max(listTasks.length - 1, 0));
    }
  }, [listTasks.length, selectedIndex]);

  const handleSetNow = useCallback((task: Task) => {
    setNowTaskId(task.id);
    writeFocusNowTaskId(task.id);
  }, []);

  const handleToggle = useCallback(
    async (task: Task) => {
      await toggleComplete(task);
      if (task.id === nowTaskId && task.status === "active") {
        setNowTaskId(null);
        writeFocusNowTaskId(null);
      }
    },
    [toggleComplete, nowTaskId],
  );

  const handleToggleCollapsed = useCallback(() => {
    setCollapsed((value) => {
      const next = !value;
      writeFocusCollapsed(next);
      return next;
    });
  }, []);

  const handleCycleDock = useCallback(() => {
    const next = cycleFocusDock(dock);
    writeFocusDock(next);
    if (onDockChange) onDockChange(next);
    else setInternalDock(next);
  }, [dock, onDockChange]);

  const handleCycleDensity = useCallback(() => {
    setDensity((current) => {
      const next = cycleFocusDensity(current);
      writeFocusDensity(next);
      return next;
    });
  }, []);

  const handleExit = useCallback(() => {
    if (onExit) {
      onExit();
      return;
    }
    if (standalone || popout) {
      if (window.opener) window.close();
      else window.location.href = mainAppUrl();
      return;
    }
    toggleFocusMode();
  }, [onExit, standalone, popout, toggleFocusMode]);

  const handleQuickAdd = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      const trimmed = quickAdd.trim();
      if (!trimmed || adding) return;
      setQuickAdd("");
      setAdding(true);
      try {
        await addTask({ title: trimmed, queue: "today" });
        quickAddRef.current?.focus();
      } finally {
        setAdding(false);
      }
    },
    [quickAdd, adding, addTask],
  );

  useFocusKeyboard({
    enabled: !collapsed,
    activeTasks: listTasks,
    selectedIndex,
    onSelectIndex: setSelectedIndex,
    onToggleTask: (task) => {
      void handleToggle(task);
    },
    onSetNow: handleSetNow,
    onToggleCollapsed: handleToggleCollapsed,
    onFocusQuickAdd: () => quickAddRef.current?.focus(),
    onExit: handleExit,
  });

  const nextTaskTitle =
    nowTask?.title ?? activeTasks[0]?.title ?? "All done for today";

  if (collapsed) {
    return (
      <div
        ref={panelRef}
        className={[
          "flex h-full w-full min-w-0 flex-col bg-[var(--color-surface)]",
          standalone ? "" : "rounded-2xl border border-[var(--color-border)] shadow-lg shadow-black/5",
        ].join(" ")}
        data-focus-band={band}
      >
        <button
          type="button"
          onClick={handleToggleCollapsed}
          className={[
            "flex min-h-0 flex-1 items-center text-left transition-colors hover:bg-[var(--color-surface-raised)]",
            ultra ? "gap-2 px-2 py-2" : "gap-3 px-4 py-3",
          ].join(" ")}
          title="Expand focus panel (C)"
        >
          <div
            className={[
              "flex shrink-0 flex-col items-center justify-center rounded-xl bg-[var(--color-accent)] text-white shadow-sm",
              ultra ? "h-8 w-8" : "h-9 w-9",
            ].join(" ")}
          >
            <span className="text-sm font-bold leading-none">
              {stats.active || "✓"}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            {!ultra ? (
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-accent)]">
                Focus
              </p>
            ) : null}
            <p
              className={[
                "truncate font-medium text-[var(--color-text)]",
                ultra ? "text-xs" : "text-sm",
              ].join(" ")}
            >
              {nextTaskTitle}
            </p>
            {!ultra ? (
              <p className="text-[11px] text-[var(--color-text-muted)]">
                {formatTodaySummary(stats)}
              </p>
            ) : null}
          </div>
          <span className="shrink-0 text-xs text-[var(--color-text-muted)]">
            ▲
          </span>
        </button>
      </div>
    );
  }

  const headerPad = ultra ? "px-2 py-2" : slim ? "px-2.5 py-2" : "px-3.5 py-2.5";
  const bodyPad = ultra ? "px-2 py-2" : slim ? "px-2.5 py-2.5" : "px-3 py-3";

  return (
    <div
      ref={panelRef}
      className={[
        "flex h-full w-full min-w-0 flex-col bg-[var(--color-surface)]",
        standalone ? "" : "rounded-2xl border border-[var(--color-border)] shadow-lg shadow-black/5",
      ].join(" ")}
      data-focus-dock={dock}
      data-focus-band={band}
    >
      <header className={["shrink-0 border-b border-[var(--color-border)]/80", headerPad].join(" ")}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {!ultra ? (
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-accent)]">
                Focus
              </p>
            ) : null}
            {!slim ? (
              <h2 className="text-sm font-semibold tracking-tight">Today</h2>
            ) : null}
            {!ultra ? (
              <p className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">
                {loading ? "Loading…" : formatTodaySummary(stats)}
              </p>
            ) : (
              <p className="text-[11px] font-medium text-[var(--color-text-muted)]">
                {loading ? "…" : `${stats.active} left`}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {!standalone ? (
              <button
                type="button"
                onClick={handleCycleDock}
                className="hidden rounded-md px-2 py-1 text-[10px] font-medium text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text)] sm:inline"
                title={`Dock ${dock} — click to cycle`}
              >
                {dock === "left" ? "◧" : dock === "right" ? "◨" : "▣"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleToggleCollapsed}
              className="rounded-md px-2 py-1 text-[10px] font-medium text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text)]"
              title="Collapse (C)"
            >
              ─
            </button>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-1">
          <button
            type="button"
            onClick={handleCycleDensity}
            className="rounded-md bg-[var(--color-surface-raised)] px-2 py-1 text-[10px] font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-accent)]"
            title="Cycle layout density for narrow zones"
          >
            {focusDensityLabel(density)}
          </button>
          <button
            type="button"
            onClick={toggleHideCompleted}
            className="rounded-md bg-[var(--color-surface-raised)] px-2 py-1 text-[10px] font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-accent)]"
          >
            {ultra ? (hideCompleted ? "✓" : "✓*") : hideCompleted ? "Show done" : "Hide done"}
          </button>
          {isWeb() && !standalone && !popout ? (
            <button
              type="button"
              onClick={() => openFocusPopout()}
              className="rounded-md bg-[var(--color-surface-raised)] px-2 py-1 text-[10px] font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-accent)]"
              title="Open focus in a side window"
            >
              Pop out
            </button>
          ) : null}
          {isWeb() && (standalone || popout) ? (
            <>
              <button
                type="button"
                onClick={() => openFocusPopoutAtWidth(220)}
                className="rounded-md bg-[var(--color-surface-raised)] px-1.5 py-1 text-[10px] font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-accent)]"
                title="Open pop-out at 220px width"
              >
                220
              </button>
              <button
                type="button"
                onClick={() => openFocusPopoutAtWidth(FOCUS_DEFAULT_POPOUT_WIDTH)}
                className="rounded-md bg-[var(--color-surface-raised)] px-1.5 py-1 text-[10px] font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-accent)]"
                title="Open pop-out at 260px width"
              >
                260
              </button>
              {!slim ? (
                <button
                  type="button"
                  onClick={() => openFocusPopoutAtWidth(320)}
                  className="rounded-md bg-[var(--color-surface-raised)] px-1.5 py-1 text-[10px] font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-accent)]"
                  title="Open pop-out at 320px width"
                >
                  320
                </button>
              ) : null}
            </>
          ) : null}
          {!standalone && !popout ? (
            <a
              href={focusAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md bg-[var(--color-surface-raised)] px-2 py-1 text-[10px] font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-accent)]"
            >
              /focus
            </a>
          ) : null}
          <button
            type="button"
            onClick={handleExit}
            className="ml-auto rounded-md bg-[var(--color-accent-soft)] px-2 py-1 text-[10px] font-semibold text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)] hover:text-white"
          >
            {standalone || popout ? "Close" : "Exit"}
          </button>
        </div>
      </header>

      <div className={["app-scroll-y min-h-0 flex-1 overflow-x-hidden", bodyPad].join(" ")}>
        {nowTask ? (
          <div className={ultra ? "mb-2" : "mb-3"}>
            <FocusNowCard
              task={nowTask}
              compact={slim}
              ultra={ultra}
              onToggle={(task) => void handleToggle(task)}
            />
          </div>
        ) : null}

        {listTasks.length > 0 ? (
          <ul className="space-y-1">
            {listTasks.map((task, index) => (
              <FocusWidgetRow
                key={task.id}
                task={task}
                selected={index === selectedIndex}
                compact={slim}
                ultra={ultra}
                onToggle={(item) => void handleToggle(item)}
                onSetNow={handleSetNow}
              />
            ))}
          </ul>
        ) : !nowTask ? (
          <p className="py-8 text-center text-xs text-[var(--color-text-muted)]">
            Nothing for today — add a task below or exit to plan.
          </p>
        ) : (
          <p className="py-4 text-center text-xs text-[var(--color-text-muted)]">
            Only your Now task remains.
          </p>
        )}
      </div>

      <footer
        className={[
          "shrink-0 border-t border-[var(--color-border)]/80",
          ultra ? "px-2 py-2" : "px-3 py-2.5",
        ].join(" ")}
      >
        <form
          onSubmit={handleQuickAdd}
          className={[
            "touch-manipulation",
            ultra ? "flex flex-col gap-1.5" : "flex gap-1.5",
          ].join(" ")}
        >
          <input
            ref={quickAddRef}
            type="text"
            value={quickAdd}
            onChange={(event) => setQuickAdd(event.target.value)}
            placeholder={ultra ? "Add…" : "Quick add to Today…"}
            enterKeyHint="done"
            className={[
              "min-w-0 flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)]",
              ultra ? "px-2 py-1.5 text-xs" : "px-2.5 py-2 text-sm",
            ].join(" ")}
          />
          <button
            type="submit"
            disabled={!quickAdd.trim() || adding}
            className={[
              "shrink-0 rounded-lg bg-[var(--color-accent)] font-semibold text-white transition-all active:scale-95 disabled:opacity-40",
              ultra ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-xs",
            ].join(" ")}
          >
            Add
          </button>
        </form>
        {(standalone || popout) && !ultra ? (
          <p className="mt-2 text-[10px] leading-relaxed text-[var(--color-text-muted)]">
            Drag the window edge to resize — layout adapts down to {FOCUS_MIN_WIDTH}px for
            FancyZones.
          </p>
        ) : null}
        {!slim ? (
          <p className="mt-2 hidden text-[10px] text-[var(--color-text-muted)] sm:block">
            Space complete · N add · F focus · J/K move · C collapse · Esc exit
          </p>
        ) : null}
      </footer>
    </div>
  );
}

export function FocusDockFrame({
  dock,
  children,
}: {
  dock: FocusDock;
  children: ReactNode;
}) {
  return (
    <div
      className={[
        "flex min-h-0 w-full flex-1 overflow-hidden bg-[var(--color-surface)]",
        dock === "left" && "justify-start",
        dock === "right" && "justify-end",
        dock === "center" && "justify-center",
      ].join(" ")}
    >
      <div className="h-full w-full min-w-0">{children}</div>
    </div>
  );
}

export function readInitialFocusDock(): FocusDock {
  return readFocusDock();
}
