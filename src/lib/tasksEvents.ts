export const TASKS_CHANGED_EVENT = "tasks-changed";

export async function notifyTasksChanged(): Promise<void> {
  try {
    const { emit } = await import("@tauri-apps/api/event");
    await emit(TASKS_CHANGED_EVENT);
  } catch {
    // Not running inside Tauri (e.g. Vite-only dev).
  }
}

export async function listenForTasksChanged(
  onChanged: () => void,
): Promise<() => void> {
  try {
    const { listen } = await import("@tauri-apps/api/event");
    return await listen(TASKS_CHANGED_EVENT, onChanged);
  } catch {
    return () => {};
  }
}

export async function hideCurrentWindow(): Promise<void> {
  try {
    const { getCurrentWebviewWindow } = await import(
      "@tauri-apps/api/webviewWindow"
    );
    await getCurrentWebviewWindow().hide();
  } catch {
    // Not running inside Tauri.
  }
}

/** Hide the window when it loses focus (e.g. user clicks elsewhere). */
export async function listenForWindowBlur(
  onBlur: () => void,
  delayMs = 150,
): Promise<() => void> {
  try {
    const { getCurrentWebviewWindow } = await import(
      "@tauri-apps/api/webviewWindow"
    );
    const win = getCurrentWebviewWindow();
    let armed = false;
    const timer = window.setTimeout(() => {
      armed = true;
    }, delayMs);

    const unlisten = await win.onFocusChanged(({ payload: focused }) => {
      if (armed && !focused) onBlur();
    });

    return () => {
      window.clearTimeout(timer);
      unlisten();
    };
  } catch {
    return () => {};
  }
}

export async function showMainWindow(): Promise<void> {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("show_main_window");
  } catch {
    // Not running inside Tauri.
  }
}
