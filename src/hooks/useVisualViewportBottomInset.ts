import { useEffect, useState } from "react";

/** iOS Safari input accessory (arrows / Done) above the keyboard. */
const IOS_INPUT_ACCESSORY_INSET = 52;

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/.test(navigator.userAgent);
}

/** Pixels covered by the on-screen keyboard (0 when hidden). */
export function useVisualViewportBottomInset(): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    function update() {
      if (!viewport) return;
      const gap = window.innerHeight - viewport.height - viewport.offsetTop;
      const keyboardInset = Math.max(0, Math.round(gap));
      const accessoryInset =
        keyboardInset > 0 && isIos() ? IOS_INPUT_ACCESSORY_INSET : 0;
      setInset(keyboardInset + accessoryInset);
    }

    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    window.addEventListener("focusin", update);
    window.addEventListener("focusout", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
      window.removeEventListener("focusin", update);
      window.removeEventListener("focusout", update);
    };
  }, []);

  return inset;
}
