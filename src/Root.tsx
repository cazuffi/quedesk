import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import App from "./App";
import { isCaptureRoute } from "./lib/captureWindow";
import { isFocusRoute } from "./lib/focusWindow";
import { isDesktop } from "./lib/platform";

type AppWindow = "main" | "today-widget" | "quick-capture";

export function Root() {
  const [windowKind, setWindowKind] = useState<AppWindow | null>(null);
  const [WidgetComponent, setWidgetComponent] = useState<ComponentType | null>(null);
  const desktop = isDesktop();

  useEffect(() => {
    if (!desktop) {
      setWindowKind("main");
      return;
    }

    import("@tauri-apps/api/webviewWindow")
      .then(({ getCurrentWebviewWindow }) => {
        const label = getCurrentWebviewWindow().label;
        if (label === "today-widget") {
          import("./TodayWidgetApp").then((m) => {
            setWidgetComponent(() => m.TodayWidgetApp);
            setWindowKind("today-widget");
          });
        } else if (label === "quick-capture") {
          import("./QuickCaptureApp").then((m) => {
            setWidgetComponent(() => m.QuickCaptureApp);
            setWindowKind("quick-capture");
          });
        } else {
          setWindowKind("main");
        }
      })
      .catch(() => setWindowKind("main"));
  }, [desktop]);

  if (!windowKind) return null;

  if (desktop && WidgetComponent) return <WidgetComponent />;
  if (desktop) return <App />;

  return <WebRoot />;
}

function WebRoot() {
  const [Gate, setGate] = useState<ComponentType<{ children: ReactNode }> | null>(null);
  const [FocusApp, setFocusApp] = useState<ComponentType | null>(null);
  const [CaptureApp, setCaptureApp] = useState<ComponentType | null>(null);
  const focusRoute = isFocusRoute();
  const captureRoute = isCaptureRoute();

  useEffect(() => {
    import("./components/AuthGate").then((m) => setGate(() => m.AuthGate));
    if (focusRoute) {
      import("./FocusWidgetApp").then((m) => setFocusApp(() => m.FocusWidgetApp));
    }
    if (captureRoute) {
      import("./CaptureWidgetApp").then((m) =>
        setCaptureApp(() => m.CaptureWidgetApp),
      );
    }
  }, [focusRoute, captureRoute]);

  if (!Gate) return null;
  if (captureRoute && !CaptureApp) return null;
  if (focusRoute && !FocusApp) return null;

  return (
    <Gate>
      {captureRoute && CaptureApp ? (
        <CaptureApp />
      ) : focusRoute && FocusApp ? (
        <FocusApp />
      ) : (
        <App />
      )}
    </Gate>
  );
}
