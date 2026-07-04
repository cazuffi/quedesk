import { useEffect, useState } from "react";

const TOUCH_LAYOUT_QUERY = "(max-width: 1279px), (pointer: coarse)";

function matchesTouchLayout(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(TOUCH_LAYOUT_QUERY).matches;
}

/** True on phones/tablets — use visible action chips instead of hover menus. */
export function useTouchLayout(): boolean {
  const [touchLayout, setTouchLayout] = useState(matchesTouchLayout);

  useEffect(() => {
    const mq = window.matchMedia(TOUCH_LAYOUT_QUERY);
    const sync = () => setTouchLayout(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return touchLayout;
}
