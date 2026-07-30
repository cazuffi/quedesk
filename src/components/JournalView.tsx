import { useCallback, useEffect, useRef, useState } from "react";
import { MarkdownNotes } from "./MarkdownNotes";
import { useTasks } from "../contexts/TasksContext";
import { fetchJournalNote, upsertJournalNote } from "../lib/journalData";
import {
  buildJournalSourceLink,
  formatJournalHeading,
  shiftJournalDate,
} from "../lib/journalLink";
import { todayDateString } from "../lib/dueDateQueue";

interface JournalViewProps {
  date: string;
  onDateChange: (date: string) => void;
}

export function JournalView({ date, onDateChange }: JournalViewProps) {
  const { addTask } = useTasks();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedContentRef = useRef("");

  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [selectedText, setSelectedText] = useState("");
  const [creatingTask, setCreatingTask] = useState(false);
  const [taskCreated, setTaskCreated] = useState(false);

  const isToday = date === todayDateString();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setSaveState("idle");
    setSelectedText("");
    setTaskCreated(false);

    fetchJournalNote(date)
      .then((note) => {
        if (cancelled) return;
        const next = note?.content ?? "";
        savedContentRef.current = next;
        setContent(next);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(
          error instanceof Error ? error.message : "Could not load note",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [date]);

  useEffect(() => {
    if (loading || content === savedContentRef.current) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveState("saving");

    saveTimerRef.current = setTimeout(() => {
      upsertJournalNote(date, content)
        .then(() => {
          savedContentRef.current = content;
          setSaveState("saved");
        })
        .catch(() => {
          setSaveState("error");
        });
    }, 600);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [content, date, loading]);

  const handleCreateTask = useCallback(async () => {
    const title = selectedText.trim();
    if (!title || creatingTask) return;

    setCreatingTask(true);
    try {
      await addTask({
        title,
        queue: "inbox",
        sourceLink: buildJournalSourceLink(date),
      });
      setTaskCreated(true);
      setSelectedText("");
      window.setTimeout(() => setTaskCreated(false), 2500);
    } catch (error) {
      console.error("Failed to create task from journal:", error);
    } finally {
      setCreatingTask(false);
    }
  }, [addTask, creatingTask, date, selectedText]);

  function goToToday() {
    onDateChange(todayDateString());
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 sm:px-5">
        <div className="flex min-w-0 flex-1 items-center gap-1">
          <button
            type="button"
            onClick={() => onDateChange(shiftJournalDate(date, -1))}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface)] text-sm text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]"
            aria-label="Previous day"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => onDateChange(shiftJournalDate(date, 1))}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface)] text-sm text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]"
            aria-label="Next day"
          >
            →
          </button>
          <div className="min-w-0 px-1">
            <h2 className="truncate text-sm font-semibold tracking-tight">
              {formatJournalHeading(date)}
            </h2>
            <p className="text-[11px] text-[var(--color-text-muted)]">
              Daily journal
              {saveState === "saving"
                ? " · Saving…"
                : saveState === "saved"
                  ? " · Saved"
                  : saveState === "error"
                    ? " · Save failed"
                    : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isToday ? (
            <button
              type="button"
              onClick={goToToday}
              className="rounded-lg bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]"
            >
              Today
            </button>
          ) : null}
          {selectedText ? (
            <button
              type="button"
              onClick={() => void handleCreateTask()}
              disabled={creatingTask}
              className="rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-60"
            >
              {creatingTask ? "Adding…" : "Add to Inbox"}
            </button>
          ) : null}
          {taskCreated ? (
            <span className="text-xs font-medium text-[var(--color-accent)]">
              Task added
            </span>
          ) : null}
        </div>
      </div>

      <div className="app-scroll-y flex min-h-0 flex-1 flex-col px-4 py-3 sm:px-5 sm:py-4">
        {loading ? (
          <p className="text-sm text-[var(--color-text-muted)]">Loading note…</p>
        ) : loadError ? (
          <p className="text-sm text-red-600">{loadError}</p>
        ) : (
          <MarkdownNotes
            fill
            value={content}
            onChange={setContent}
            textareaRef={textareaRef}
            onSelectionChange={setSelectedText}
            placeholder="Write your daily note in Markdown… Select text to create a task linked back here."
          />
        )}
      </div>
    </div>
  );
}
