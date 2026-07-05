function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

const POPOUT_WIDTH_KEY = "quedesk:capture-popout-width";

export const CAPTURE_MIN_WIDTH = 180;
export const CAPTURE_DEFAULT_POPOUT_WIDTH = 240;
export const CAPTURE_MAX_POPOUT_WIDTH = 420;

export function readCapturePopoutWidth(): number {
  const raw = readStorage(POPOUT_WIDTH_KEY);
  if (!raw) return CAPTURE_DEFAULT_POPOUT_WIDTH;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) return CAPTURE_DEFAULT_POPOUT_WIDTH;
  return Math.min(
    CAPTURE_MAX_POPOUT_WIDTH,
    Math.max(CAPTURE_MIN_WIDTH, parsed),
  );
}

export function writeCapturePopoutWidth(width: number): void {
  writeStorage(
    POPOUT_WIDTH_KEY,
    String(
      Math.min(CAPTURE_MAX_POPOUT_WIDTH, Math.max(CAPTURE_MIN_WIDTH, width)),
    ),
  );
}
