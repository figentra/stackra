/**
 * Stackra file contract:
 * Purpose: `useResizeHandle`, the pointer and keyboard handlers of a resize strip (a window splitter), shared by
 *          `Sidebar.Rail` and `SidePanel.Handle`: a press-and-drag with a small slop moves the width with the pointer, a
 *          press without a drag is a press, Left and Right move the edge 16 px in that screen direction, Home and End
 *          jump to the narrowest and widest.
 * Boundary: handlers only; the caller draws the strip and its ARIA (`role="separator"`, the values). The strip's edge is
 *           logical, so right-to-left mirrors the drag and the arrows. While a drag runs, the `resizing` element takes
 *           `data-resizing`, so its width follows the pointer without easing.
 * Runtime: browser
 * Governing contract: ADR 0305; WAI-ARIA window splitter pattern; WCAG 2.2 SC 2.1.1 and 2.5.7; owner request 2026-10-29
 *          (STA-1371).
 */
import { useRef, type KeyboardEvent, type PointerEvent } from "react";

import { RESIZE_SLOP } from "#core/constants/resize-slop.constant";
import type { ResizeHandleOptions } from "#react/hooks/resize-handle-options.type";

/** How far one arrow key moves the edge, in pixels. */
const STEP = 16;

/** The handlers to spread on the strip. */
interface ResizeHandlers {
  readonly onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  readonly onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  readonly onPointerUp: (event: PointerEvent<HTMLElement>) => void;
  readonly onPointerCancel: (event: PointerEvent<HTMLElement>) => void;
  readonly onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
}

/** +1 when moving right grows the box, -1 when it shrinks it, from the edge and the text direction. */
const growthOf = (element: Element, edge: "start" | "end"): 1 | -1 => {
  const rtl = getComputedStyle(element).direction === "rtl";
  return (edge === "end") !== rtl ? 1 : -1;
};

/** The handlers that make a strip resize a box. */
export function useResizeHandle({
  width,
  minWidth,
  maxWidth,
  edge,
  resizing,
  onResize,
  onDrag,
  onPress,
  keys,
}: ResizeHandleOptions): ResizeHandlers {
  const drag = useRef<{ x: number; width: number; moved: boolean } | null>(null);
  const end = (event: PointerEvent<HTMLElement>) => {
    const start = drag.current;
    drag.current = null;
    event.currentTarget.closest(resizing)?.removeAttribute("data-resizing");
    if (start !== null && !start.moved) onPress?.();
  };
  return {
    onPointerDown: (event) => {
      if (event.button !== 0) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      drag.current = { x: event.clientX, width, moved: false };
    },
    onPointerMove: (event) => {
      const start = drag.current;
      if (start === null) return;
      const delta = (event.clientX - start.x) * growthOf(event.currentTarget, edge);
      if (!start.moved && Math.abs(delta) < RESIZE_SLOP) return;
      start.moved = true;
      event.currentTarget.closest(resizing)?.setAttribute("data-resizing", "");
      (onDrag ?? onResize)(start.width + delta, delta);
    },
    onPointerUp: end,
    onPointerCancel: end,
    onKeyDown: (event) => {
      const growth = growthOf(event.currentTarget, edge);
      const moves: Record<string, () => void> = {
        ArrowRight: () => onResize(width + STEP * growth),
        ArrowLeft: () => onResize(width - STEP * growth),
        Home: () => onResize(minWidth),
        End: () => onResize(maxWidth),
        ...keys,
      };
      const move = moves[event.key];
      if (move === undefined) return;
      event.preventDefault();
      move();
    },
  };
}
