import { useEffect, useState } from "react";

/** Pixels covered by the on-screen keyboard (0 when hidden). */
export function useVisualViewportBottomInset(): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    function update() {
      if (!viewport) return;
      const gap = window.innerHeight - viewport.height - viewport.offsetTop;
      setInset(Math.max(0, Math.round(gap)));
    }

    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, []);

  return inset;
}
