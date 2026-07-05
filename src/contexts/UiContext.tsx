import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Task } from "../types";

export type PanelLayout = "closed" | "side" | "full";

interface UiContextValue {
  selectedTaskId: string | null;
  panelLayout: PanelLayout;
  focusMode: boolean;
  hideCompleted: boolean;
  selectTask: (task: Task | null) => void;
  closePanel: () => void;
  expandPanel: () => void;
  collapsePanel: () => void;
  toggleFocusMode: () => void;
  setFocusMode: (enabled: boolean) => void;
  toggleHideCompleted: () => void;
}

const UiContext = createContext<UiContextValue | null>(null);

interface UiProviderProps {
  children: ReactNode;
  initialFocusMode?: boolean;
}

export function UiProvider({
  children,
  initialFocusMode = false,
}: UiProviderProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [panelLayout, setPanelLayout] = useState<PanelLayout>("closed");
  const [focusMode, setFocusMode] = useState(initialFocusMode);
  const [hideCompleted, setHideCompleted] = useState(true);

  const isMobile = () => window.innerWidth < 640;

  const selectTask = useCallback((task: Task | null) => {
    if (!task) {
      setSelectedTaskId(null);
      setPanelLayout("closed");
      return;
    }
    setSelectedTaskId(task.id);
    setPanelLayout(isMobile() ? "full" : "side");
  }, []);

  const closePanel = useCallback(() => {
    setSelectedTaskId(null);
    setPanelLayout("closed");
  }, []);

  const expandPanel = useCallback(() => {
    setPanelLayout("full");
  }, []);

  const collapsePanel = useCallback(() => {
    if (isMobile()) {
      setSelectedTaskId(null);
      setPanelLayout("closed");
    } else {
      setPanelLayout("side");
    }
  }, []);

  const toggleFocusMode = useCallback(() => {
    setFocusMode((value) => !value);
  }, []);

  const setFocusModeExplicit = useCallback((enabled: boolean) => {
    setFocusMode(enabled);
  }, []);

  const toggleHideCompleted = useCallback(() => {
    setHideCompleted((value) => !value);
  }, []);

  const value = useMemo(
    () => ({
      selectedTaskId,
      panelLayout,
      focusMode,
      hideCompleted,
      selectTask,
      closePanel,
      expandPanel,
      collapsePanel,
      toggleFocusMode,
      setFocusMode: setFocusModeExplicit,
      toggleHideCompleted,
    }),
    [
      selectedTaskId,
      panelLayout,
      focusMode,
      hideCompleted,
      selectTask,
      closePanel,
      expandPanel,
      collapsePanel,
      toggleFocusMode,
      setFocusModeExplicit,
      toggleHideCompleted,
    ],
  );

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi() {
  const context = useContext(UiContext);
  if (!context) {
    throw new Error("useUi must be used within UiProvider");
  }
  return context;
}
