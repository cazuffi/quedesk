import { useState } from "react";
import {
  FocusDockFrame,
  FocusPanel,
  readInitialFocusDock,
} from "./FocusPanel";
import type { FocusDock } from "../lib/focusStorage";

export function FocusEmbeddedShell() {
  const [dock, setDock] = useState<FocusDock>(() => readInitialFocusDock());

  return (
    <FocusDockFrame dock={dock}>
      <FocusPanel variant="embedded" dock={dock} onDockChange={setDock} />
    </FocusDockFrame>
  );
}
