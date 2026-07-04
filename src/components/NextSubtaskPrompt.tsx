import { useEffect, useState } from "react";
import { useTasks } from "../contexts/TasksContext";

const AUTO_DISMISS_MS = 8000;

export function NextSubtaskPrompt() {
  const {
    nextSiblingPrompt: prompt,
    dismissNextSiblingPrompt: dismiss,
    pinSubtaskToQueue,
    completeParentFromPrompt,
  } = useTasks();

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (prompt) {
      requestAnimationFrame(() => setVisible(true));
      const timer = setTimeout(() => {
        dismiss();
      }, AUTO_DISMISS_MS);
      return () => clearTimeout(timer);
    }
    setVisible(false);
  }, [prompt, dismiss]);

  if (!prompt) return null;

  const allDone =
    prompt.progress.done === prompt.progress.total && !prompt.nextSibling;

  async function handlePin(queue: "today" | "week") {
    if (!prompt?.nextSibling) return;
    await pinSubtaskToQueue(prompt.nextSibling.id, queue);
    dismiss();
  }

  return (
    <div
      className={[
        "overflow-hidden rounded-xl border border-[var(--color-accent)]/30 bg-[var(--color-accent-soft)] transition-all",
        visible ? "max-h-40 opacity-100" : "max-h-0 opacity-0",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-3">
        <div className="min-w-0 flex-1">
          {allDone ? (
            <p className="text-xs text-[var(--color-text)]">
              <span className="font-semibold">All subtasks done</span>
              {prompt.parent && (
                <span className="text-[var(--color-text-muted)]">
                  {" "}— mark "{prompt.parent.title}" complete?
                </span>
              )}
            </p>
          ) : (
            <p className="text-xs text-[var(--color-text)]">
              <span className="font-semibold">
                "{prompt.completedTask.title}"
              </span>{" "}
              <span className="text-[var(--color-text-muted)]">
                done ({prompt.progress.done}/{prompt.progress.total})
              </span>
              {prompt.nextSibling && (
                <span className="text-[var(--color-text-muted)]">
                  {" "}— pin "{prompt.nextSibling.title}" next?
                </span>
              )}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {allDone && prompt.parent ? (
            <button
              type="button"
              onClick={completeParentFromPrompt}
              className="rounded-lg bg-[var(--color-accent)] px-3 py-1 text-[11px] font-medium text-white shadow-sm transition-all hover:bg-[var(--color-accent-hover)] hover:shadow-md"
            >
              Complete
            </button>
          ) : prompt.nextSibling ? (
            <>
              <button
                type="button"
                onClick={() => handlePin("today")}
                className="rounded-lg bg-[var(--color-accent)] px-3 py-1 text-[11px] font-medium text-white shadow-sm transition-all hover:bg-[var(--color-accent-hover)] hover:shadow-md"
              >
                Pin to Today
              </button>
              <button
                type="button"
                onClick={() => handlePin("week")}
                className="rounded-lg border border-[var(--color-accent)]/30 px-3 py-1 text-[11px] font-medium text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)] hover:text-white"
              >
                This Week
              </button>
            </>
          ) : null}
          <button
            type="button"
            onClick={dismiss}
            className="rounded-lg px-2 py-1 text-[11px] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
