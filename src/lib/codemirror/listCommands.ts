import type { ChangeSpec, EditorState } from "@codemirror/state";
import { EditorSelection } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

const TASK_LIST_RE = /^(\s*)-\s+\[([ xX])\]\s+/;
const PLAIN_BULLET_RE = /^(\s*)-\s+(?!\[)/;
const ORDERED_LIST_RE = /^(\s*)((?:\d+\.))\s+/;

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

/** Obsidian-style toggle: add/remove `- [ ]` task list markers on selected lines. */
export function toggleTaskList(view: EditorView): boolean {
  const { state } = view;
  const lines = selectedLines(state);
  if (lines.length === 0) return false;

  const lineTexts = lines.map((line) => state.sliceDoc(line.from, line.to));
  const allTaskItems = lineTexts.every((text) => TASK_LIST_RE.test(text));

  const changes: ChangeSpec[] = [];
  const selectionOffsets: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const text = lineTexts[i];
    const taskMatch = text.match(TASK_LIST_RE);
    const bulletMatch = text.match(PLAIN_BULLET_RE);
    const orderedMatch = text.match(ORDERED_LIST_RE);

    if (allTaskItems && taskMatch) {
      const removeFrom = line.from + taskMatch[1].length;
      const removeTo = removeFrom + 6;
      changes.push({ from: removeFrom, to: removeTo, insert: "" });
      selectionOffsets.push(-6);
    } else if (!allTaskItems) {
      if (taskMatch) {
        selectionOffsets.push(0);
      } else if (bulletMatch) {
        const markerFrom = line.from + bulletMatch[1].length;
        changes.push({ from: markerFrom, to: markerFrom + 2, insert: "- [ ] " });
        selectionOffsets.push(4);
      } else if (orderedMatch) {
        const markerFrom = line.from + orderedMatch[1].length;
        const markerTo = markerFrom + orderedMatch[2].length + 1;
        changes.push({ from: markerFrom, to: markerTo, insert: "- [ ] " });
        selectionOffsets.push(0);
      } else {
        const indent = text.match(/^(\s*)/)?.[1] ?? "";
        const insertAt = line.from + indent.length;
        changes.push({ from: insertAt, to: insertAt, insert: "- [ ] " });
        selectionOffsets.push(6);
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

/** @deprecated Use toggleTaskList */
export const toggleBulletList = toggleTaskList;
