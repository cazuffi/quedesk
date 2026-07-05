import { TasksProvider } from "./contexts/TasksContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { QuickCaptureForm } from "./components/QuickCaptureForm";

export function QuickCaptureApp() {
  return (
    <ThemeProvider>
      <TasksProvider>
        <QuickCaptureForm variant="embedded" />
      </TasksProvider>
    </ThemeProvider>
  );
}
