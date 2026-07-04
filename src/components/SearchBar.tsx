interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative w-full sm:max-w-xs">
      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--color-text-muted)]">
        ⌕
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search tasks…"
        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pl-7 pr-7 text-[16px] text-[var(--color-text)] outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:bg-[var(--color-surface-raised)] sm:py-1.5 sm:text-xs"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-xs text-[var(--color-text-muted)] transition-colors active:bg-[var(--color-surface)] sm:p-0.5 sm:text-[10px]"
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  );
}
