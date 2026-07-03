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
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={placeholder}
        disabled={busy}
        className="min-w-0 flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)] disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={busy || !title.trim()}
        className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
      >
        Add
      </button>
    </form>
  );
}
