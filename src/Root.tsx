import { useEffect, useState } from "react";
import App from "./App";
import { QuickCaptureApp } from "./QuickCaptureApp";
import { TodayWidgetApp } from "./TodayWidgetApp";

type AppWindow = "main" | "today-widget" | "quick-capture";

export function Root() {
  const [windowKind, setWindowKind] = useState<AppWindow | null>(null);

  useEffect(() => {
    import("@tauri-apps/api/webviewWindow")
      .then(({ getCurrentWebviewWindow }) => {
        const label = getCurrentWebviewWindow().label;
        if (label === "today-widget") setWindowKind("today-widget");
        else if (label === "quick-capture") setWindowKind("quick-capture");
        else setWindowKind("main");
      })
      .catch(() => setWindowKind("main"));
  }, []);

  if (!windowKind) {
    return null;
  }

  if (windowKind === "today-widget") return <TodayWidgetApp />;
  if (windowKind === "quick-capture") return <QuickCaptureApp />;
  return <App />;
}
