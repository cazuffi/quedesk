import { syntaxTree, ensureSyntaxTree } from "@codemirror/language";
import {
  Decoration,
  type DecorationSet,
  EditorView,
  ViewPlugin,
  type ViewUpdate,
} from "@codemirror/view";
import { RangeSetBuilder, type EditorState } from "@codemirror/state";
import { parseTaskLink } from "../taskLink";

const hide = Decoration.replace({});

function headOnLine(state: EditorState, lineFrom: number, lineTo: number): boolean {
  const head = state.selection.main.head;
  return head >= lineFrom && head <= lineTo;
}

function overlapsSelection(
  state: EditorState,
  from: number,
  to: number,
): boolean {
  const { from: selFrom, to: selTo } = state.selection.main;
  return selFrom < to && selTo > from;
}

function addHidden(
  builder: RangeSetBuilder<Decoration>,
  from: number,
  to: number,
  state: EditorState,
  lineFrom: number,
  lineTo: number,
) {
  if (from >= to) return;
  if (headOnLine(state, lineFrom, lineTo)) return;
  builder.add(from, to, hide);
}

function addMark(
  builder: RangeSetBuilder<Decoration>,
  from: number,
  to: number,
  className: string,
) {
  if (from >= to) return;
  builder.add(from, to, Decoration.mark({ class: className }));
}

function buildDecorations(view: EditorView): DecorationSet {
  const { state } = view;
  ensureSyntaxTree(state, state.doc.length, 300);
  const tree = syntaxTree(state);
  const builder = new RangeSetBuilder<Decoration>();

  tree.cursor().iterate((node) => {
    const { from, to, name } = node;
    if (from === to) return;

    const line = state.doc.lineAt(from);

    switch (name) {
      case "HeaderMark":
      case "QuoteMark":
      case "ListMark":
      case "EmphasisMark":
      case "CodeMark":
      case "LinkMark":
      case "StrikethroughMark":
        addHidden(builder, from, to, state, line.from, line.to);
        return;

      case "URL":
      case "LinkTitle": {
        if (!overlapsSelection(state, from, to)) {
          addHidden(builder, from, to, state, line.from, line.to);
        }
        return;
      }

      case "ATXHeading1":
      case "SetextHeading1":
        addMark(builder, from, to, "cm-md-h1");
        return;
      case "ATXHeading2":
      case "SetextHeading2":
        addMark(builder, from, to, "cm-md-h2");
        return;
      case "ATXHeading3":
        addMark(builder, from, to, "cm-md-h3");
        return;
      case "ATXHeading4":
        addMark(builder, from, to, "cm-md-h4");
        return;
      case "ATXHeading5":
        addMark(builder, from, to, "cm-md-h5");
        return;
      case "ATXHeading6":
        addMark(builder, from, to, "cm-md-h6");
        return;

      case "StrongEmphasis":
        addMark(builder, from, to, "cm-md-strong");
        return;
      case "Emphasis":
        addMark(builder, from, to, "cm-md-em");
        return;
      case "Strikethrough":
        addMark(builder, from, to, "cm-md-strike");
        return;
      case "InlineCode":
        addMark(builder, from, to, "cm-md-code");
        return;
      case "Link": {
        const urlNode = node.node.getChild("URL");
        const urlText = urlNode
          ? state.sliceDoc(urlNode.from, urlNode.to)
          : "";
        const className = parseTaskLink(urlText)
          ? "cm-md-task-link"
          : "cm-md-link";
        addMark(builder, from, to, className);
        return;
      }
      case "Blockquote":
        addMark(builder, from, to, "cm-md-blockquote");
        return;
      default:
        return;
    }
  });

  return builder.finish();
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

export function journalLinkClickExtension(
  onLinkClick: (href: string) => void,
) {
  return EditorView.domEventHandlers({
    click(event, view) {
      const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
      if (pos == null) return false;

      ensureSyntaxTree(view.state, view.state.doc.length, 300);
      let href: string | null = null;

      syntaxTree(view.state).iterate({
        from: pos,
        to: pos,
        enter(node) {
          if (node.name === "Link" && node.from <= pos && node.to >= pos) {
            const urlNode = node.node.getChild("URL");
            if (urlNode) {
              href = view.state.sliceDoc(urlNode.from, urlNode.to);
            }
            return false;
          }
        },
      });

      if (href) {
        event.preventDefault();
        onLinkClick(href);
        return true;
      }
      return false;
    },
  });
}
