/**
 * Stackra file contract:
 * Purpose: `DragFollower`, the lifted copy of a dragged item that follows the pointer, shared by `useLiveDrag` (React
 *          Aria's list, grid, tree and table drags) and `useColumnDrag` (column headers): a copy of the item as it looks
 *          now (a table row or header keeps its cells' widths in a table of its own), on the surface colour, raised on
 *          the floating shadow and lifted to 1.03 with the snappy spring.
 * Boundary: drawn for the eye only (`aria-hidden`, no pointer events) in a portal on the body; the caller moves it by
 *           its `x` and `y` motion values. The copy is taken once when the drag starts. Under prefers-reduced-motion it
 *           does not scale.
 * Runtime: browser
 * Governing contract: ADR 0329 (motion layer); owner request 2026-10-31 (live drag, STA-1371).
 */
import { motionSpring, STACKRA_THEME } from "@stackra/tokens";
import { motion, useReducedMotion, type MotionValue } from "motion/react";
import { useLayoutEffect, useMemo, useRef, type ReactElement } from "react";
import { createPortal } from "react-dom";

/** The spring the copy lifts with. */
const LIFT = { type: "spring", ...motionSpring(STACKRA_THEME, "snappy") } as const;

/** One above React Aria's overlay layer (its popovers sit at 100000). */
const OVER_OVERLAYS = 100_001;

/** The marks a pressed, hovered or focused item carries, which the copy leaves behind. */
const STATE_MARKS = [
  "id",
  "data-hovered",
  "data-pressed",
  "data-focused",
  "data-focus-visible",
  "data-dragging",
  "data-drop-target",
];

/** The parts of a table: outside a table they lay out as nothing. */
const TABLE_PARTS = new Set(["TR", "TH", "TD"]);

/** A copy of `source` as it looks now, unplaced and unmarked; a table part goes in shallow copies of its table. */
function copyOf(source: HTMLElement): HTMLElement {
  const copy = source.cloneNode(true) as HTMLElement;
  for (const node of [copy, ...copy.querySelectorAll<HTMLElement>("*")])
    for (const mark of STATE_MARKS) node.removeAttribute(mark);
  copy.style.position = "static";
  copy.style.transform = "none";
  copy.style.inset = "auto";
  copy.style.opacity = "1";
  if (!TABLE_PARTS.has(source.tagName)) {
    copy.style.inlineSize = "100%";
    copy.style.blockSize = "100%";
    return copy;
  }
  // Each cell keeps the width it has in the table, so the copy reads as the same row.
  [...source.children].forEach((cell, index) => {
    const twin = copy.children[index] as HTMLElement | undefined;
    if (twin) twin.style.width = `${cell.getBoundingClientRect().width}px`;
  });
  let inner: HTMLElement = copy;
  let at: HTMLElement | null = source.parentElement;
  // Shallow copies of the row and section up to the table, so the table's own styles still reach the cells.
  while (at) {
    const shell = at.cloneNode(false) as HTMLElement;
    shell.removeAttribute("id");
    shell.style.cssText = "margin:0;width:100%;table-layout:fixed;";
    shell.append(inner);
    inner = shell;
    if (at.tagName === "TABLE") break;
    at = at.parentElement;
  }
  return inner;
}

/** The lifted copy of `source`, placed at `x`, `y` in the viewport. */
export function DragFollower({
  source,
  x,
  y,
}: {
  readonly source: HTMLElement;
  readonly x: MotionValue<number>;
  readonly y: MotionValue<number>;
}): ReactElement {
  const host = useRef<HTMLDivElement>(null);
  const isReduced = useReducedMotion() ?? false;
  const look = useMemo(() => {
    const box = source.getBoundingClientRect();
    const style = getComputedStyle(source);
    return {
      width: box.width,
      height: box.height,
      direction: style.direction,
      radius: style.borderRadius === "0px" ? "var(--radius-control)" : style.borderRadius,
    };
  }, [source]);
  useLayoutEffect(() => {
    host.current?.replaceChildren(copyOf(source));
  }, [source]);

  return createPortal(
    <motion.div
      aria-hidden="true"
      data-slot="drag-follower"
      dir={look.direction}
      className="pointer-events-none fixed top-0 left-0 overflow-hidden bg-surface text-foreground shadow-(--floating-shadow)"
      // Above React Aria's overlays (a popover is 100000), so a row dragged inside one stays in sight.
      style={{
        x,
        y,
        width: look.width,
        height: look.height,
        borderRadius: look.radius,
        zIndex: OVER_OVERLAYS,
      }}
      initial={{ scale: 1 }}
      animate={{ scale: isReduced ? 1 : 1.03 }}
      transition={LIFT}
    >
      <div ref={host} className="size-full" />
    </motion.div>,
    document.body,
  );
}
