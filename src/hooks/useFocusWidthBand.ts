import { useEffect, useState, type RefObject } from "react";
import { widthToBand, type FocusWidthBand } from "../lib/focusStorage";

export function useFocusWidthBand(
  containerRef: RefObject<HTMLElement | null>,
): FocusWidthBand {
  const [band, setBand] = useState<FocusWidthBand>("wide");

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const update = (width: number) => {
      setBand(widthToBand(width));
    };

    update(element.getBoundingClientRect().width);

    const observer = new ResizeObserver(([entry]) => {
      if (entry) update(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [containerRef]);

  return band;
}
