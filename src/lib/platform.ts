export type Platform = "desktop" | "web";

let detected: Platform | null = null;

export function getPlatform(): Platform {
  if (detected) return detected;

  detected =
    typeof window !== "undefined" && "__TAURI_INTERNALS__" in window
      ? "desktop"
      : "web";

  return detected;
}

export function isDesktop(): boolean {
  return getPlatform() === "desktop";
}

export function isWeb(): boolean {
  return getPlatform() === "web";
}
