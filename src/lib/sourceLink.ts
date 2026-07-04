/** Normalize a stored source link into a valid URL. */
export function sourceLinkHref(link: string): string {
  const trimmed = link.trim();
  if (!trimmed) return trimmed;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/** Open a source link in the system browser via Tauri's opener plugin. */
export async function openSourceLink(link: string): Promise<void> {
  const href = sourceLinkHref(link);
  if (!href) return;

  try {
    const { openUrl } = await import("@tauri-apps/plugin-opener");
    await openUrl(href);
  } catch {
    window.open(href, "_blank", "noopener,noreferrer");
  }
}
