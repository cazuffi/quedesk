import { useEffect, useRef } from "react";

export interface TextSelectionRange {
  start: number;
  end: number;
}

interface UseTextareaSelectionOptions {
  textarea: HTMLTextAreaElement | null;
  enabled?: boolean;
  onSelectionChange?: (
    selectedText: string,
    range: TextSelectionRange | null,
  ) => void;
}

function readTextareaSelection(textarea: HTMLTextAreaElement): {
  text: string;
  range: TextSelectionRange;
} | null {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  if (start === end) return null;

  const raw = textarea.value.slice(start, end);
  const text = raw.trim();
  if (!text) return null;

  return { text, range: { start, end } };
}

/** Reliable selection reporting for iOS Safari (selectionchange + deferred touchend). */
export function useTextareaSelection({
  textarea,
  enabled = true,
  onSelectionChange,
}: UseTextareaSelectionOptions) {
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSelectionChangeRef = useRef(onSelectionChange);
  onSelectionChangeRef.current = onSelectionChange;

  useEffect(() => {
    if (!enabled || !textarea || !onSelectionChangeRef.current) return;

    function emitSelection() {
      const handler = onSelectionChangeRef.current;
      if (!handler || !textarea) return;

      const selection = readTextareaSelection(textarea);
      if (selection) {
        if (clearTimerRef.current) {
          clearTimeout(clearTimerRef.current);
          clearTimerRef.current = null;
        }
        handler(selection.text, selection.range);
        return;
      }

      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      clearTimerRef.current = setTimeout(() => {
        if (!textarea) return;
        const stillEmpty = textarea.selectionStart === textarea.selectionEnd;
        if (stillEmpty) {
          onSelectionChangeRef.current?.("", null);
        }
      }, 250);
    }

    function scheduleRead() {
      window.requestAnimationFrame(emitSelection);
      window.setTimeout(emitSelection, 0);
      window.setTimeout(emitSelection, 120);
    }

    function onDocumentSelectionChange() {
      if (document.activeElement !== textarea) return;
      scheduleRead();
    }

    textarea.addEventListener("select", scheduleRead);
    textarea.addEventListener("touchend", scheduleRead);
    textarea.addEventListener("mouseup", scheduleRead);
    textarea.addEventListener("keyup", scheduleRead);
    document.addEventListener("selectionchange", onDocumentSelectionChange);

    return () => {
      textarea.removeEventListener("select", scheduleRead);
      textarea.removeEventListener("touchend", scheduleRead);
      textarea.removeEventListener("mouseup", scheduleRead);
      textarea.removeEventListener("keyup", scheduleRead);
      document.removeEventListener("selectionchange", onDocumentSelectionChange);
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    };
  }, [enabled, textarea]);
}
