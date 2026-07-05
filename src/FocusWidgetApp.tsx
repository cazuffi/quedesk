import { FocusPanel } from "./components/FocusPanel";
import { ConfirmProvider } from "./contexts/ConfirmContext";
import { TasksProvider } from "./contexts/TasksContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { UiProvider } from "./contexts/UiContext";

export function FocusWidgetApp() {
  return (
    <ThemeProvider>
      <ConfirmProvider>
        <TasksProvider>
          <UiProvider initialFocusMode>
        <div className="app-shell h-full min-h-0 w-full min-w-0 bg-[var(--color-surface)]">
              <FocusPanel variant="standalone" />
            </div>
          </UiProvider>
        </TasksProvider>
      </ConfirmProvider>
    </ThemeProvider>
  );
}
