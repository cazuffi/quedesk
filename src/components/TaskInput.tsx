import { useEffect, useRef, useState, type FormEvent } from "react";

interface TaskInputProps {
  placeholder?: string;
  onAdd: (title: string) => Promise<void>;
  autoFocus?: boolean;
}

export function TaskInput({
  placeholder = "Add a task…",
  onAdd,
  autoFocus = false,
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

  return (
    <form onSubmit={handleSubmit} className="flex items-stretch gap-2">
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={placeholder}
        disabled={busy}
        className="min-w-0 flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3.5 py-2.5 text-[16px] outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:bg-white disabled:opacity-60 sm:py-2 sm:text-sm dark:focus:bg-[var(--color-surface-raised)]"
      />
      <button
        type="submit"
        disabled={busy || !title.trim()}
        className="shrink-0 rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-[16px] font-medium text-white shadow-sm transition-all active:scale-95 disabled:opacity-40 disabled:shadow-none sm:px-4 sm:py-2 sm:text-sm sm:hover:bg-[var(--color-accent-hover)] sm:hover:shadow-md"
      >
        Add
      </button>
    </form>
  );
}
