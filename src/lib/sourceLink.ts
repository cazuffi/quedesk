/** Use when opening a stored source link in the browser. */
export function sourceLinkHref(link: string): string {
  const trimmed = link.trim();
  if (!trimmed) return trimmed;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}
