/**
 * Stackra file contract:
 * Purpose: `usePlotWidth`, the measured width of a web chart's plot, for the charts whose circles and words must not
 *          stretch: their SVG is drawn at the real width rather than in a box stretched to it.
 * Boundary: browser; a ResizeObserver on the element the returned ref is set on. Before the first measure (and where
 *           ResizeObserver is missing, as in jsdom) the width is `fallback`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */
import { type RefCallback, useCallback, useRef, useState } from "react";

/** The plot's width and the ref that measures it. */
export function usePlotWidth(fallback = 640): {
  readonly width: number;
  readonly ref: RefCallback<HTMLElement>;
} {
  const [width, setWidth] = useState(fallback);
  const observer = useRef<ResizeObserver | null>(null);
  const ref = useCallback<RefCallback<HTMLElement>>((element) => {
    observer.current?.disconnect();
    observer.current = null;
    if (!element || typeof ResizeObserver === "undefined") return;
    observer.current = new ResizeObserver(([entry]) => {
      const measured = Math.round(entry?.contentRect.width ?? 0);
      if (measured > 0) setWidth(measured);
    });
    observer.current.observe(element);
  }, []);
  return { width, ref };
}
