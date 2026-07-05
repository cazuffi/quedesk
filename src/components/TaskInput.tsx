import { useEffect, useRef, useState, type FormEvent } from "react";

interface TaskInputProps {
  placeholder?: string;
  onAdd: (title: string) => Promise<void>;
  autoFocus?: boolean;
  variant?: "primary" | "secondary";
}

export function TaskInput({
  placeholder = "Add a task…",
  onAdd,
  autoFocus = false,
  variant = "primary",
}: TaskInputProps) {
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || busy) return;

    setBusy(true);
    try {
      await onAdd(trimmed);
      setTitle("");
    } finally {
      setBusy(false);
    }
  }

  const secondary = variant === "secondary";

  return (
    <form onSubmit={handleSubmit} className="flex items-stretch gap-2">
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={placeholder}
        disabled={busy}
        className={[
          "min-w-0 flex-1 rounded-xl border bg-[var(--color-surface-raised)] px-3.5 outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] disabled:opacity-60 dark:focus:bg-[var(--color-surface-raised)]",
          secondary
            ? "border-dashed border-[var(--color-border)] py-2 text-sm focus:bg-[var(--color-surface-raised)] sm:py-1.5"
            : "border-[var(--color-border)] py-2.5 text-[16px] focus:bg-white sm:py-2 sm:text-sm",
        ].join(" ")}
      />
      <button
        type="submit"
        disabled={busy || !title.trim()}
        className={[
          "shrink-0 rounded-xl px-4 py-2.5 text-[16px] font-medium transition-all active:scale-95 disabled:opacity-40 sm:px-4 sm:py-2 sm:text-sm",
          secondary
            ? "border border-[var(--color-accent)]/30 bg-transparent text-[var(--color-accent)] disabled:shadow-none sm:hover:bg-[var(--color-accent-soft)]"
            : "bg-[var(--color-accent)] text-white shadow-sm disabled:shadow-none sm:hover:bg-[var(--color-accent-hover)] sm:hover:shadow-md",
        ].join(" ")}
      >
        Add
      </button>
    </form>
  );
}
