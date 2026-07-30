import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { EditorSelection, type Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { keymap } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import {
  journalLinkClickExtension,
  livePreviewExtension,
} from "../lib/codemirror/livePreview";
import { journalEditorTheme } from "../lib/codemirror/journalTheme";
import { toggleBulletList } from "../lib/codemirror/listCommands";
import { openMarkdownHref } from "../lib/sourceLink";

function listToggleShortcutLabel(): string {
  const isMac =
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad|iPod/.test(navigator.platform);
  return isMac ? "⌘L" : "Ctrl+L";
}

interface JournalLiveEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSelectionChange?: (
    selectedText: string,
    range: { start: number; end: number } | null,
  ) => void;
  placeholder?: string;
}

export interface JournalLiveEditorHandle {
  clearSelection: () => void;
}

function reportSelection(
  view: EditorView,
  onSelectionChange?: JournalLiveEditorProps["onSelectionChange"],
) {
  if (!onSelectionChange) return;
  const sel = view.state.selection.main;
  if (sel.from === sel.to) {
    onSelectionChange("", null);
    return;
  }
  const text = view.state.sliceDoc(sel.from, sel.to).trim();
  if (!text) {
    onSelectionChange("", null);
    return;
  }
  onSelectionChange(text, { start: sel.from, end: sel.to });
}

export const JournalLiveEditor = forwardRef<
  JournalLiveEditorHandle,
  JournalLiveEditorProps
>(function JournalLiveEditor(
  { value, onChange, onSelectionChange, placeholder },
  ref,
) {
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onSelectionChangeRef = useRef(onSelectionChange);
  onChangeRef.current = onChange;
  onSelectionChangeRef.current = onSelectionChange;

  useImperativeHandle(ref, () => ({
    clearSelection() {
      const view = viewRef.current;
      if (!view) return;
      const head = view.state.selection.main.head;
      view.dispatch({
        selection: EditorSelection.single(head),
      });
      reportSelection(view, onSelectionChangeRef.current);
    },
  }));

  const extensions = useMemo(() => {
    const exts: Extension[] = [
      history(),
      keymap.of([
        { key: "Mod-l", run: toggleBulletList },
        ...defaultKeymap,
        ...historyKeymap,
      ]),
      markdown({ base: markdownLanguage, codeLanguages: [] }),
      journalEditorTheme(),
      livePreviewExtension(),
      journalLinkClickExtension((href) => {
        void openMarkdownHref(href);
      }),
      EditorView.lineWrapping,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChangeRef.current(update.state.doc.toString());
        }
        if (update.selectionSet) {
          reportSelection(update.view, onSelectionChangeRef.current);
          window.requestAnimationFrame(() => {
            reportSelection(update.view, onSelectionChangeRef.current);
          });
          window.setTimeout(() => {
            reportSelection(update.view, onSelectionChangeRef.current);
          }, 120);
        }
      }),
      EditorView.contentAttributes.of({
        "aria-label": placeholder ?? "Daily journal",
      }),
    ];
    return exts;
  }, [placeholder]);

  return (
    <div className="journal-live-editor flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <CodeMirror
        value={value}
        height="100%"
        className="h-full min-h-0 flex-1 overflow-hidden [&_.cm-editor]:h-full [&_.cm-editor]:outline-none"
        basicSetup={false}
        extensions={extensions}
        onCreateEditor={(view) => {
          viewRef.current = view;
          reportSelection(view, onSelectionChangeRef.current);
        }}
      />
      <p className="shrink-0 border-t border-[var(--color-border)] px-3 py-1.5 text-[10px] text-[var(--color-text-muted)]">
        Live preview — {listToggleShortcutLabel()} toggles bullet list. Tap a line
        to edit markdown.
      </p>
    </div>
  );
});
