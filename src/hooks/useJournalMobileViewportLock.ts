import { useEffect } from "react";

const JOURNAL_VIEWPORT =
  "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content";

/** Lock pinch-zoom and reduce iOS keyboard layout jumps while the journal is open. */
export function useJournalMobileViewportLock() {
  useEffect(() => {
    const root = document.documentElement;
    const meta = document.querySelector('meta[name="viewport"]');
    const previousViewport = meta?.getAttribute("content") ?? null;

    root.classList.add("journal-mode");
    meta?.setAttribute("content", JOURNAL_VIEWPORT);

    return () => {
      root.classList.remove("journal-mode");
      if (meta && previousViewport) {
        meta.setAttribute("content", previousViewport);
      }
    };
  }, []);
}
