/**
 * Stackra file contract:
 * Purpose: `useAnchorBox(anchor)`, the viewport box of an element that something fixed is laid over (the DataTable's
 *          cell editor), kept current while any scroll area scrolls, the window resizes or the element itself resizes.
 * Boundary: browser only (DOM); one measurement per animation frame however many events arrive. A detached element
 *           keeps its last box.
 * Runtime: browser
 * Governing contract: data-collection plan (owner, 2026-10-29), wave 3 fixes (the editor follows scroll and resize);
 *          STA-1371.
 */
import { useEffect, useState } from "react";

/**
 * The element's box in the viewport, following scroll and resize.
 * @param anchor - the element measured
 * @returns its current `DOMRect`
 */
export function useAnchorBox(anchor: HTMLElement): DOMRect {
  const [box, setBox] = useState(() => anchor.getBoundingClientRect());
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      if (frame !== 0) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (anchor.isConnected) setBox(anchor.getBoundingClientRect());
      });
    };
    const view = anchor.ownerDocument.defaultView ?? window;
    // Capture: a scroll of any scroll area (the table's own, the page's) moves the cell.
    view.addEventListener("scroll", measure, { capture: true, passive: true });
    view.addEventListener("resize", measure);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(anchor);
    return () => {
      cancelAnimationFrame(frame);
      view.removeEventListener("scroll", measure, { capture: true });
      view.removeEventListener("resize", measure);
      observer?.disconnect();
    };
  }, [anchor]);
  return box;
}
