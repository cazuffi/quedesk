import { useCallback, useEffect, useRef, useState } from "react";
import { JournalSearchResults } from "./JournalSearchResults";
import { MarkdownNotes } from "./MarkdownNotes";
import { SearchBar } from "./SearchBar";
import { useTasks } from "../contexts/TasksContext";
import {
  fetchJournalNote,
  searchJournalNotes,
  upsertJournalNote,
} from "../lib/journalData";
import {
  buildJournalSourceLink,
  formatJournalHeading,
  shiftJournalDate,
} from "../lib/journalLink";
import { todayDateString } from "../lib/dueDateQueue";
import type { JournalSearchResult } from "../types/journal";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<JournalSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const isToday = date === todayDateString();
  const isSearchActive = searchQuery.trim().length > 0;

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

  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    let cancelled = false;
    setSearchLoading(true);

    const timer = setTimeout(() => {
      searchJournalNotes(query)
        .then((results) => {
          if (!cancelled) {
            setSearchResults(results);
            setSearchLoading(false);
          }
        })
        .catch((error: unknown) => {
          console.error("Journal search failed:", error);
          if (!cancelled) {
            setSearchResults([]);
            setSearchLoading(false);
          }
        });
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

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

  function handleSearchResultSelect(nextDate: string) {
    setSearchQuery("");
    onDateChange(nextDate);
  }

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-1">
            <button
              type="button"
              onClick={() => onDateChange(shiftJournalDate(date, -1))}
              disabled={isSearchActive}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface)] text-sm text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)] disabled:opacity-40"
              aria-label="Previous day"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => onDateChange(shiftJournalDate(date, 1))}
              disabled={isSearchActive}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface)] text-sm text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)] disabled:opacity-40"
              aria-label="Next day"
            >
              →
            </button>
            <div className="min-w-0 px-1">
              <h2 className="truncate text-sm font-semibold tracking-tight">
                {isSearchActive ? "Search notes" : formatJournalHeading(date)}
              </h2>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                {isSearchActive
                  ? searchLoading
                    ? "Searching…"
                    : `${searchResults.length} result${searchResults.length === 1 ? "" : "s"}`
                  : `Daily journal${
                      saveState === "saving"
                        ? " · Saving…"
                        : saveState === "saved"
                          ? " · Saved"
                          : saveState === "error"
                            ? " · Save failed"
                            : ""
                    }`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isToday && !isSearchActive ? (
              <button
                type="button"
                onClick={goToToday}
                className="rounded-lg bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]"
              >
                Today
              </button>
            ) : null}
            {!isSearchActive && selectedText ? (
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

        <div className="mt-3 w-full">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search journal notes…"
            fullWidth
          />
        </div>
      </div>

      <div
        className={[
          "flex min-h-0 w-full min-w-0 flex-1 flex-col px-4 sm:px-5",
          isSearchActive
            ? "app-scroll-y overflow-x-hidden py-3 sm:py-4"
            : "overflow-hidden py-3 sm:py-4",
        ].join(" ")}
      >
        {isSearchActive ? (
          <JournalSearchResults
            query={searchQuery.trim()}
            results={searchResults}
            loading={searchLoading}
            onSelectDate={handleSearchResultSelect}
          />
        ) : loading ? (
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
