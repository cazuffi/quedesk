import type { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

export function journalEditorTheme(): Extension {
  return EditorView.theme({
    "&": {
      height: "100%",
      fontSize: "14px",
      fontFamily: "var(--font-sans)",
    },
    ".cm-scroller": {
      overflow: "auto",
      fontFamily: "inherit",
      lineHeight: "1.65",
    },
    ".cm-content": {
      caretColor: "var(--color-accent)",
      padding: "0.5rem 0.75rem",
      minHeight: "100%",
    },
    ".cm-line": {
      padding: "0 2px",
    },
    "&.cm-focused .cm-cursor": {
      borderLeftColor: "var(--color-accent)",
    },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
      backgroundColor: "var(--color-accent-soft) !important",
    },
    ".cm-gutters": {
      display: "none",
    },
  });
}
