import { QuickCaptureForm } from "./components/QuickCaptureForm";
import { ConfirmProvider } from "./contexts/ConfirmContext";
import { TasksProvider } from "./contexts/TasksContext";
import { ThemeProvider } from "./contexts/ThemeContext";

export function CaptureWidgetApp() {
  return (
    <ThemeProvider>
      <ConfirmProvider>
        <TasksProvider>
          <div className="h-full min-h-0 w-full bg-[var(--color-surface)]">
            <QuickCaptureForm variant="standalone" />
          </div>
        </TasksProvider>
      </ConfirmProvider>
    </ThemeProvider>
  );
}
