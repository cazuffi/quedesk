export interface MarkdownTip {
  label: string;
  syntax: string;
}

export const MARKDOWN_TIPS: MarkdownTip[] = [
  { label: "Bold", syntax: "**bold**" },
  { label: "Italic", syntax: "*italic*" },
  { label: "Bold + italic", syntax: "***both***" },
  { label: "Strikethrough", syntax: "~~strike~~" },
  { label: "Inline code", syntax: "`code`" },
  { label: "Code block", syntax: "```\ncode block\n```" },
  { label: "Heading 1", syntax: "# Heading" },
  { label: "Heading 2", syntax: "## Heading" },
  { label: "Heading 3", syntax: "### Heading" },
  { label: "Bullet list", syntax: "- item" },
  { label: "Numbered list", syntax: "1. item" },
  { label: "Task list", syntax: "- [ ] todo" },
  { label: "Link", syntax: "[text](https://…)" },
  { label: "Blockquote", syntax: "> quote" },
  { label: "Horizontal rule", syntax: "---" },
  { label: "Table", syntax: "| Col | Col |\n| --- | --- |" },
];

export function markdownHelpShortcutLabel(): string {
  const isMac =
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad|iPod/.test(navigator.platform);
  return isMac ? "⌘/" : "Ctrl+/";
}
