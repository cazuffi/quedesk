import {
  readCapturePopoutWidth,
  writeCapturePopoutWidth,
} from "./captureStorage";

export function isCaptureRoute(): boolean {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname.replace(/\/+$/, "");
  const params = new URLSearchParams(window.location.search);
  return path.endsWith("/capture") || params.get("capture") === "1";
}

export function isCapturePopout(): boolean {
  if (typeof window === "undefined") return false;
  return (
    isCaptureRoute() &&
    (window.opener !== null ||
      new URLSearchParams(window.location.search).get("popout") === "1")
  );
}

export function captureAppUrl(options?: { popout?: boolean }): string {
  const base = import.meta.env.BASE_URL.replace(/\/?$/, "/");
  const url = new URL(`${base}capture`, window.location.origin);
  if (options?.popout) url.searchParams.set("popout", "1");
  return url.toString();
}

export function openCapturePopout(
  width = readCapturePopoutWidth(),
): Window | null {
  writeCapturePopoutWidth(width);
  return window.open(
    captureAppUrl({ popout: true }),
    "quedesk-capture",
    `popup=yes,width=${width},height=200,noopener,noreferrer,scrollbars=no`,
  );
}

export function openCapturePopoutAtWidth(width: number): Window | null {
  return openCapturePopout(width);
}

export function dismissCaptureWindow(): void {
  if (window.opener) {
    window.close();
    return;
  }
  window.location.href = `${import.meta.env.BASE_URL}`;
}
