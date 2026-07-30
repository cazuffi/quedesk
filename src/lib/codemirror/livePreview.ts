import { syntaxTree, ensureSyntaxTree } from "@codemirror/language";
import type { SyntaxNode, SyntaxNodeRef } from "@lezer/common";
import {
  Decoration,
  type DecorationSet,
  EditorView,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import { RangeSetBuilder, type EditorState } from "@codemirror/state";
import { parseTaskLink } from "../taskLink";

const hide = Decoration.replace({});

class BulletWidget extends WidgetType {
  toDOM() {
    const span = document.createElement("span");
    span.textContent = "• ";
    span.className = "cm-md-list-mark cm-md-bullet";
    span.setAttribute("aria-hidden", "true");
    return span;
  }

  ignoreEvent() {
    return true;
  }
}

class OrderedMarkWidget extends WidgetType {
  constructor(private readonly label: string) {
    super();
  }

  eq(other: OrderedMarkWidget) {
    return other.label === this.label;
  }

  toDOM() {
    const span = document.createElement("span");
    span.textContent = `${this.label} `;
    span.className = "cm-md-list-mark cm-md-ordered";
    span.setAttribute("aria-hidden", "true");
    return span;
  }

  ignoreEvent() {
    return true;
  }
}

class CheckboxWidget extends WidgetType {
  constructor(
    private readonly checked: boolean,
    private readonly markerFrom: number,
    private readonly markerTo: number,
  ) {
    super();
  }

  eq(other: CheckboxWidget) {
    return (
      other.checked === this.checked &&
      other.markerFrom === this.markerFrom &&
      other.markerTo === this.markerTo
    );
  }

  toDOM() {
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = this.checked;
    input.className = "cm-md-checkbox";
    input.setAttribute("aria-label", this.checked ? "Completed" : "Todo");
    return input;
  }

  ignoreEvent() {
    return false;
  }
}

const bullet = Decoration.replace({ widget: new BulletWidget(), inclusive: false });

interface PendingDeco {
  from: number;
  to: number;
  deco: Decoration;
  /** Replace widgets before marks at the same position. */
  order: number;
}

function headOnLine(state: EditorState, lineFrom: number, lineTo: number): boolean {
  const head = state.selection.main.head;
  return head >= lineFrom && head <= lineTo;
}

function lineAtPos(state: EditorState, pos: number) {
  return state.doc.lineAt(pos);
}

function queueHide(
  pending: PendingDeco[],
  from: number,
  to: number,
  state: EditorState,
  lineFrom: number,
  lineTo: number,
) {
  if (from >= to) return;
  if (headOnLine(state, lineFrom, lineTo)) return;
  pending.push({ from, to, deco: hide, order: 0 });
}

function queueMark(
  pending: PendingDeco[],
  from: number,
  to: number,
  className: string,
) {
  if (from >= to) return;
  pending.push({
    from,
    to,
    deco: Decoration.mark({ class: className }),
    order: 1,
  });
}

function queueBullet(
  pending: PendingDeco[],
  from: number,
  to: number,
  state: EditorState,
  lineFrom: number,
  lineTo: number,
) {
  if (from >= to) return;
  if (headOnLine(state, lineFrom, lineTo)) return;
  pending.push({ from, to, deco: bullet, order: 0 });
}

function queueOrderedMark(
  pending: PendingDeco[],
  from: number,
  to: number,
  label: string,
  state: EditorState,
  lineFrom: number,
  lineTo: number,
) {
  if (from >= to) return;
  if (headOnLine(state, lineFrom, lineTo)) return;
  pending.push({
    from,
    to,
    deco: Decoration.replace({
      widget: new OrderedMarkWidget(label),
      inclusive: false,
    }),
    order: 0,
  });
}

function walkChildren(node: SyntaxNode, fn: (child: SyntaxNode) => void) {
  const cursor = node.cursor();
  if (!cursor.firstChild()) return;
  do {
    fn(cursor.node);
  } while (cursor.nextSibling());
}

function taskMarkerInListItem(listMark: SyntaxNodeRef): SyntaxNode | null {
  const parent = listMark.node.parent;
  if (!parent) return null;
  let marker: SyntaxNode | null = null;
  walkChildren(parent, (child) => {
    if (child.name === "TaskMarker") marker = child;
  });
  return marker;
}

function queueCheckbox(
  pending: PendingDeco[],
  from: number,
  to: number,
  checked: boolean,
  state: EditorState,
  lineFrom: number,
  lineTo: number,
) {
  if (from >= to) return;
  if (headOnLine(state, lineFrom, lineTo)) return;
  pending.push({
    from,
    to,
    deco: Decoration.replace({
      widget: new CheckboxWidget(checked, from, to),
      inclusive: false,
    }),
    order: 0,
  });
}

function headingContentRange(
  node: SyntaxNodeRef,
  state: EditorState,
): { from: number; to: number } | null {
  let from = node.from;
  walkChildren(node.node, (child) => {
    if (child.name === "HeaderMark") {
      from = Math.max(from, child.to);
    }
  });
  while (from < node.to && state.sliceDoc(from, from + 1) === " ") {
    from += 1;
  }
  return from < node.to ? { from, to: node.to } : null;
}

function linkLabelRange(node: SyntaxNodeRef): { from: number; to: number } | null {
  const marks: { from: number; to: number }[] = [];
  walkChildren(node.node, (child) => {
    if (child.name === "LinkMark") {
      marks.push({ from: child.from, to: child.to });
    }
  });
  if (marks.length < 2) return null;
  const from = marks[0].to;
  const to = marks[1].from;
  return from < to ? { from, to } : null;
}

function emphasisContentRange(node: SyntaxNodeRef): { from: number; to: number } | null {
  let from = node.from;
  let to = node.to;
  walkChildren(node.node, (child) => {
    if (child.name === "EmphasisMark") {
      if (child.from <= from) from = child.to;
      if (child.to >= to) to = child.from;
    }
  });
  return from < to ? { from, to } : null;
}

function inlineCodeContentRange(node: SyntaxNodeRef): { from: number; to: number } | null {
  let from = node.from;
  let to = node.to;
  walkChildren(node.node, (child) => {
    if (child.name === "CodeMark") {
      if (child.from <= from) from = child.to;
      if (child.to >= to) to = child.from;
    }
  });
  return from < to ? { from, to } : null;
}

function finishDecorations(pending: PendingDeco[]): DecorationSet {
  pending.sort((a, b) => {
    if (a.from !== b.from) return a.from - b.from;
    if (a.order !== b.order) return a.order - b.order;
    return a.to - b.to;
  });

  const builder = new RangeSetBuilder<Decoration>();
  let lastTo = -1;
  for (const item of pending) {
    if (item.from < lastTo) continue;
    builder.add(item.from, item.to, item.deco);
    lastTo = Math.max(lastTo, item.to);
  }
  return builder.finish();
}

function buildDecorations(view: EditorView): DecorationSet {
  const { state } = view;
  ensureSyntaxTree(state, state.doc.length, 500);
  const tree = syntaxTree(state);
  const pending: PendingDeco[] = [];

  tree.cursor().iterate((node) => {
    const { from, to, name } = node;
    if (from === to) return;

    const line = lineAtPos(state, from);
    const onActiveLine = headOnLine(state, line.from, line.to);

    switch (name) {
      case "HeaderMark":
      case "QuoteMark":
      case "EmphasisMark":
      case "CodeMark":
      case "StrikethroughMark":
        queueHide(pending, from, to, state, line.from, line.to);
        return;

      case "ListMark": {
        const markText = state.sliceDoc(from, to);
        const taskMarker = taskMarkerInListItem(node);
        if (taskMarker) {
          queueHide(pending, from, taskMarker.from, state, line.from, line.to);
          return;
        }
        if (/^\d+\.$/.test(markText)) {
          queueOrderedMark(
            pending,
            from,
            to,
            markText,
            state,
            line.from,
            line.to,
          );
        } else {
          queueBullet(pending, from, to, state, line.from, line.to);
        }
        return;
      }

      case "TaskMarker": {
        const markText = state.sliceDoc(from, to);
        const checked = /\[x\]/i.test(markText);
        queueCheckbox(
          pending,
          from,
          to,
          checked,
          state,
          line.from,
          line.to,
        );
        return;
      }

      case "LinkMark":
      case "URL":
      case "LinkTitle":
        queueHide(pending, from, to, state, line.from, line.to);
        return;

      case "ATXHeading1":
      case "SetextHeading1": {
        const content = headingContentRange(node, state);
        if (content) queueMark(pending, content.from, content.to, "cm-md-h1");
        return;
      }
      case "ATXHeading2":
      case "SetextHeading2": {
        const content = headingContentRange(node, state);
        if (content) queueMark(pending, content.from, content.to, "cm-md-h2");
        return;
      }
      case "ATXHeading3": {
        const content = headingContentRange(node, state);
        if (content) queueMark(pending, content.from, content.to, "cm-md-h3");
        return;
      }
      case "ATXHeading4": {
        const content = headingContentRange(node, state);
        if (content) queueMark(pending, content.from, content.to, "cm-md-h4");
        return;
      }
      case "ATXHeading5": {
        const content = headingContentRange(node, state);
        if (content) queueMark(pending, content.from, content.to, "cm-md-h5");
        return;
      }
      case "ATXHeading6": {
        const content = headingContentRange(node, state);
        if (content) queueMark(pending, content.from, content.to, "cm-md-h6");
        return;
      }

      case "StrongEmphasis": {
        const content = emphasisContentRange(node);
        if (content) queueMark(pending, content.from, content.to, "cm-md-strong");
        return;
      }
      case "Emphasis": {
        const content = emphasisContentRange(node);
        if (content) queueMark(pending, content.from, content.to, "cm-md-em");
        return;
      }
      case "Strikethrough": {
        const content = emphasisContentRange(node);
        if (content) queueMark(pending, content.from, content.to, "cm-md-strike");
        return;
      }
      case "InlineCode": {
        const content = inlineCodeContentRange(node);
        if (content) queueMark(pending, content.from, content.to, "cm-md-code");
        return;
      }
      case "Link": {
        if (onActiveLine) return;
        const label = linkLabelRange(node);
        if (!label) return;
        const urlNode = node.node.getChild("URL");
        const urlText = urlNode
          ? state.sliceDoc(urlNode.from, urlNode.to)
          : "";
        const className = parseTaskLink(urlText)
          ? "cm-md-task-link"
          : "cm-md-link";
        queueMark(pending, label.from, label.to, className);
        return;
      }
      case "Blockquote":
        queueMark(pending, from, to, "cm-md-blockquote");
        return;
      default:
        return;
    }
  });

  return finishDecorations(pending);
}

export function livePreviewExtension() {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = buildDecorations(view);
      }

      update(update: ViewUpdate) {
        if (
          update.docChanged ||
          update.selectionSet ||
          update.focusChanged
        ) {
          this.decorations = buildDecorations(update.view);
        }
      }
    },
    { decorations: (plugin) => plugin.decorations },
  );
}

function linkHrefAtPos(view: EditorView, pos: number): string | null {
  ensureSyntaxTree(view.state, view.state.doc.length, 500);
  let href: string | null = null;

  syntaxTree(view.state).iterate({
    from: pos,
    to: pos,
    enter(node) {
      if (node.name !== "Link") return;
      const label = linkLabelRange(node);
      if (!label || pos < label.from || pos >= label.to) return;
      const urlNode = node.node.getChild("URL");
      if (urlNode) {
        href = view.state.sliceDoc(urlNode.from, urlNode.to);
      }
      return false;
    },
  });

  return href;
}

export function journalTaskCheckboxExtension() {
  return EditorView.domEventHandlers({
    change(event, view) {
      const target = event.target as HTMLInputElement | null;
      if (!target?.classList.contains("cm-md-checkbox")) return false;

      const pos = view.posAtDOM(target, 0);
      if (pos == null) return false;

      ensureSyntaxTree(view.state, view.state.doc.length, 500);
      let markerFrom = -1;
      let markerTo = -1;

      syntaxTree(view.state).iterate({
        from: pos,
        to: pos,
        enter(node) {
          if (node.name === "TaskMarker") {
            markerFrom = node.from;
            markerTo = node.to;
            return false;
          }
        },
      });

      if (markerFrom < 0) return false;

      view.dispatch({
        changes: {
          from: markerFrom,
          to: markerTo,
          insert: target.checked ? "[x]" : "[ ]",
        },
      });
      return true;
    },
  });
}

export function journalLinkClickExtension(
  onLinkClick: (href: string) => void,
) {
  return EditorView.domEventHandlers({
    click(event, view) {
      const target = event.target as HTMLElement | null;
      const onLinkLabel = target?.closest(".cm-md-link, .cm-md-task-link");
      if (!onLinkLabel) return false;

      const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
      if (pos == null) return false;

      const href = linkHrefAtPos(view, pos);
      if (href) {
        event.preventDefault();
        onLinkClick(href);
        return true;
      }
      return false;
    },
  });
}
