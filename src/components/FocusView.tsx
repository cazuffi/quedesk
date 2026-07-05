import { FocusEmbeddedShell } from "./FocusEmbeddedShell";

export function FocusView() {
  return (
    <div className="h-full min-h-0 w-full flex-1 overflow-hidden">
      <FocusEmbeddedShell />
    </div>
  );
}
