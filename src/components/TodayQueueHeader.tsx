import {
  computeTodayStats,
  formatTodaySummary,
  type TodayStats,
} from "../lib/todayStats";
import type { Task } from "../types";

interface TodayQueueHeaderProps {
  tasks: Task[];
  compact?: boolean;
}

export function TodayQueueHeader({ tasks, compact = false }: TodayQueueHeaderProps) {
  const stats = computeTodayStats(tasks);

  if (compact) {
    return (
      <div className="mb-3">
        <p className="text-xs text-[var(--color-text-muted)]">
          {formatTodaySummary(stats)}
        </p>
      </div>
    );
  }

  return (
    <div className="border-b border-[var(--color-accent)]/15 bg-gradient-to-b from-[var(--color-accent-soft)]/90 to-[var(--color-surface)] px-4 py-4 sm:px-5 sm:py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-accent)]">
            Your day
          </p>
          <h2 className="mt-0.5 text-xl font-semibold tracking-tight sm:text-lg">
            Today
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-text-muted)]">
            {formatTodaySummary(stats)}
          </p>
        </div>
        <TodayCountBadge stats={stats} />
      </div>
    </div>
  );
}

function TodayCountBadge({ stats }: { stats: TodayStats }) {
  if (stats.active === 0) {
    return (
      <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl border border-[var(--color-accent)]/25 bg-[var(--color-surface-raised)] text-[var(--color-accent)]">
        <span className="text-lg leading-none">✓</span>
      </div>
    );
  }

  return (
    <div
      className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-[var(--color-accent)] text-white shadow-md shadow-[var(--color-accent)]/25"
      aria-label={`${stats.active} tasks left today`}
    >
      <span className="text-lg font-bold leading-none">{stats.active}</span>
      <span className="text-[9px] font-semibold uppercase tracking-wide opacity-90">
        left
      </span>
    </div>
  );
}
