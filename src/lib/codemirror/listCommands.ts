import type { ChangeSpec, EditorState } from "@codemirror/state";
import { EditorSelection } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

const LIST_MARKER_RE = /^(\s*)((?:[-*+]|\d+\.))\s+/;

function selectedLines(state: EditorState) {
  const { from, to } = state.selection.main;
  const start = state.doc.lineAt(from).number;
  const end = state.doc.lineAt(to).number;
  const lines = [];
  for (let n = start; n <= end; n++) {
    lines.push(state.doc.line(n));
  }
  return lines;
}

/** Obsidian-style toggle: add/remove `- ` bullet markers on selected lines. */
export function toggleBulletList(view: EditorView): boolean {
  const { state } = view;
  const lines = selectedLines(state);
  if (lines.length === 0) return false;

  const lineTexts = lines.map((line) => state.sliceDoc(line.from, line.to));
  const allListed = lineTexts.every((text) => LIST_MARKER_RE.test(text));

  const changes: ChangeSpec[] = [];
  const selectionOffsets: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const text = lineTexts[i];
    const match = text.match(LIST_MARKER_RE);

    if (allListed && match) {
      const removeFrom = line.from + match[1].length;
      const removeTo = removeFrom + match[2].length + 1;
      const removed = removeTo - removeFrom;
      changes.push({ from: removeFrom, to: removeTo, insert: "" });
      selectionOffsets.push(-removed);
    } else if (!allListed) {
      if (match) {
        if (/^\d+\.$/.test(match[2])) {
          const markerFrom = line.from + match[1].length;
          const markerTo = markerFrom + match[2].length + 1;
          changes.push({ from: markerFrom, to: markerTo, insert: "- " });
        }
        selectionOffsets.push(0);
      } else {
        const indent = text.match(/^(\s*)/)?.[1] ?? "";
        const insertAt = line.from + indent.length;
        changes.push({ from: insertAt, to: insertAt, insert: "- " });
        selectionOffsets.push(2);
      }
    }
  }

  if (changes.length === 0) return false;

  let selection = state.selection;
  if (selection.ranges.length === 1) {
    const range = selection.main;
    let anchor = range.anchor;
    let head = range.head;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const delta = selectionOffsets[i] ?? 0;
      if (delta === 0) continue;
      if (anchor >= line.from) anchor += delta;
      if (head >= line.from) head += delta;
    }
    selection = EditorSelection.single(anchor, head);
  }

  view.dispatch({ changes, selection, scrollIntoView: true });
  return true;
}
