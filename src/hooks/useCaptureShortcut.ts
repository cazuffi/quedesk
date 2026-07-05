import { useEffect } from "react";

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

/** Open quick capture from anywhere in the app (not when typing in a field). */
export function useCaptureShortcut(onOpen: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() !== "n") return;
      if (!e.shiftKey || !(e.metaKey || e.ctrlKey)) return;
      if (isTypingTarget(e.target)) return;
      e.preventDefault();
      onOpen();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, onOpen]);
}
