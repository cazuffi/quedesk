import {
  readFocusPopoutWidth,
  writeFocusPopoutWidth,
} from "./focusStorage";

export function isFocusRoute(): boolean {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname.replace(/\/+$/, "");
  const params = new URLSearchParams(window.location.search);
  return path.endsWith("/focus") || params.get("focus") === "1";
}

export function isFocusPopout(): boolean {
  if (typeof window === "undefined") return false;
  return (
    isFocusRoute() &&
    (window.opener !== null ||
      new URLSearchParams(window.location.search).get("popout") === "1")
  );
}

export function focusAppUrl(options?: { popout?: boolean }): string {
  const base = import.meta.env.BASE_URL.replace(/\/?$/, "/");
  const url = new URL(`${base}focus`, window.location.origin);
  if (options?.popout) url.searchParams.set("popout", "1");
  return url.toString();
}

export function mainAppUrl(): string {
  const base = import.meta.env.BASE_URL;
  return `${window.location.origin}${base}`;
}

export function openFocusPopout(width = readFocusPopoutWidth()): Window | null {
  writeFocusPopoutWidth(width);
  return window.open(
    focusAppUrl({ popout: true }),
    "quedesk-focus",
    `popup=yes,width=${width},height=820,noopener,noreferrer,scrollbars=no`,
  );
}

export function openFocusPopoutAtWidth(width: number): Window | null {
  return openFocusPopout(width);
}
