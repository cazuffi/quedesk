import { useEffect } from "react";
import type { Task } from "../types";

interface UseFocusKeyboardOptions {
  enabled: boolean;
  activeTasks: Task[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  onToggleTask: (task: Task) => void;
  onSetNow: (task: Task) => void;
  onToggleCollapsed: () => void;
  onFocusQuickAdd: () => void;
  onExit?: () => void;
}

export function useFocusKeyboard({
  enabled,
  activeTasks,
  selectedIndex,
  onSelectIndex,
  onToggleTask,
  onSetNow,
  onToggleCollapsed,
  onFocusQuickAdd,
  onExit,
}: UseFocusKeyboardOptions) {
  useEffect(() => {
    if (!enabled) return;

    function isTypingTarget(target: EventTarget | null): boolean {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target.isContentEditable
      );
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) {
        if (event.key === "Escape") {
          (event.target as HTMLElement).blur();
        }
        return;
      }

      const task = activeTasks[selectedIndex];

      switch (event.key) {
        case "j":
        case "ArrowDown":
          event.preventDefault();
          onSelectIndex(
            Math.min(selectedIndex + 1, Math.max(activeTasks.length - 1, 0)),
          );
          break;
        case "k":
        case "ArrowUp":
          event.preventDefault();
          onSelectIndex(Math.max(selectedIndex - 1, 0));
          break;
        case " ":
          event.preventDefault();
          if (task) onToggleTask(task);
          break;
        case "n":
          event.preventDefault();
          onFocusQuickAdd();
          break;
        case "f":
          event.preventDefault();
          if (task) onSetNow(task);
          break;
        case "c":
          event.preventDefault();
          onToggleCollapsed();
          break;
        case "Escape":
          event.preventDefault();
          onExit?.();
          break;
        default:
          if (/^[1-9]$/.test(event.key)) {
            const index = Number(event.key) - 1;
            if (index < activeTasks.length) {
              event.preventDefault();
              onSelectIndex(index);
              onSetNow(activeTasks[index]!);
            }
          }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    enabled,
    activeTasks,
    selectedIndex,
    onSelectIndex,
    onToggleTask,
    onSetNow,
    onToggleCollapsed,
    onFocusQuickAdd,
    onExit,
  ]);
}
