import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Task } from "../types";
import { todayDateString } from "../lib/dueDateQueue";

export type PanelLayout = "closed" | "side" | "full";

interface UiContextValue {
  selectedTaskId: string | null;
  panelLayout: PanelLayout;
  focusMode: boolean;
  journalMode: boolean;
  journalDate: string;
  hideCompleted: boolean;
  captureOpen: boolean;
  captureSettingsOpen: boolean;
  selectTask: (task: Task | null) => void;
  closePanel: () => void;
  expandPanel: () => void;
  collapsePanel: () => void;
  toggleFocusMode: () => void;
  setFocusMode: (enabled: boolean) => void;
  toggleJournalMode: () => void;
  setJournalMode: (enabled: boolean) => void;
  openJournalDate: (date: string) => void;
  setJournalDate: (date: string) => void;
  toggleHideCompleted: () => void;
  openCapture: () => void;
  closeCapture: () => void;
  openCaptureSettings: () => void;
  closeCaptureSettings: () => void;
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
  const [journalMode, setJournalMode] = useState(false);
  const [journalDate, setJournalDate] = useState(todayDateString);
  const [hideCompleted, setHideCompleted] = useState(true);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [captureSettingsOpen, setCaptureSettingsOpen] = useState(false);

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
    setFocusMode((value) => {
      const next = !value;
      if (next) setJournalMode(false);
      return next;
    });
  }, []);

  const setFocusModeExplicit = useCallback((enabled: boolean) => {
    setFocusMode(enabled);
    if (enabled) setJournalMode(false);
  }, []);

  const toggleJournalMode = useCallback(() => {
    setJournalMode((value) => {
      const next = !value;
      if (next) {
        setJournalDate(todayDateString());
        setFocusMode(false);
        setSelectedTaskId(null);
        setPanelLayout("closed");
      }
      return next;
    });
  }, []);

  const setJournalModeExplicit = useCallback((enabled: boolean) => {
    setJournalMode(enabled);
    if (enabled) {
      setJournalDate(todayDateString());
      setFocusMode(false);
      setSelectedTaskId(null);
      setPanelLayout("closed");
    }
  }, []);

  const openJournalDate = useCallback((date: string) => {
    setJournalDate(date);
    setJournalMode(true);
    setFocusMode(false);
    setSelectedTaskId(null);
    setPanelLayout("closed");
  }, []);

  const toggleHideCompleted = useCallback(() => {
    setHideCompleted((value) => !value);
  }, []);

  const openCapture = useCallback(() => {
    setCaptureOpen(true);
  }, []);

  const closeCapture = useCallback(() => {
    setCaptureOpen(false);
  }, []);

  const openCaptureSettings = useCallback(() => {
    setCaptureSettingsOpen(true);
    setCaptureOpen(false);
  }, []);

  const closeCaptureSettings = useCallback(() => {
    setCaptureSettingsOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      selectedTaskId,
      panelLayout,
      focusMode,
      journalMode,
      journalDate,
      hideCompleted,
      captureOpen,
      captureSettingsOpen,
      selectTask,
      closePanel,
      expandPanel,
      collapsePanel,
      toggleFocusMode,
      setFocusMode: setFocusModeExplicit,
      toggleJournalMode,
      setJournalMode: setJournalModeExplicit,
      openJournalDate,
      setJournalDate,
      toggleHideCompleted,
      openCapture,
      closeCapture,
      openCaptureSettings,
      closeCaptureSettings,
    }),
    [
      selectedTaskId,
      panelLayout,
      focusMode,
      journalMode,
      journalDate,
      hideCompleted,
      captureOpen,
      captureSettingsOpen,
      selectTask,
      closePanel,
      expandPanel,
      collapsePanel,
      toggleFocusMode,
      setFocusModeExplicit,
      toggleJournalMode,
      setJournalModeExplicit,
      openJournalDate,
      toggleHideCompleted,
      openCapture,
      closeCapture,
      openCaptureSettings,
      closeCaptureSettings,
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
