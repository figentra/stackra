/**
 * Stackra file contract:
 * Purpose: `useColumnDrag`, the live column move shared by `Table` (a pointer drag on the header's grip) and `DataGrid`
 *          (a native drag of the header): a lifted copy of the header follows the pointer, and the columns slide
 *          sideways, header and cells together, so the dragged column's dimmed placeholder already stands where it will
 *          land and the columns it passes make room. The release reports the move.
 * Boundary: the target is the movable header whose box (measured when the drag starts, before anything slides) holds
 *           the pointer; its logical half says before or after it, so right-to-left mirrors. The cells of a column are
 *           the row children that line up with the header exactly; a cell spanning columns is left alone. Slides are `motion`'s spring
 *           on the cells' transforms, cleared at once on the release; under prefers-reduced-motion they jump. The
 *           keyboard moves a column from its menu or the column editor, not here.
 * Runtime: browser
 * Governing contract: ADR 0329 (motion layer); owner request 2026-10-31 (live drag, STA-1371); WCAG 2.2 SC 2.5.7.
 */
import { motionSpring, STACKRA_THEME } from "@stackra/tokens";
import { animate, useMotionValue, useReducedMotion } from "motion/react";
import { useRef, useState, type DragEvent, type ReactNode } from "react";

import { DragFollower } from "#react/hooks/drag-follower";

/** The spring the columns slide with. */
const SLIDE = { type: "spring", ...motionSpring(STACKRA_THEME, "snappy") } as const;

/** A transparent image for the browser's own drag ghost: the follower is the preview. */
let blank: HTMLImageElement | null = null;

/** Whether `cell` or its row sticks in place, over the rows that scroll under it. */
const isStuck = (cell: HTMLElement) =>
  [cell, cell.parentElement, cell.parentElement?.parentElement].some(
    (element) => element instanceof HTMLElement && getComputedStyle(element).position === "sticky",
  );

/** Where a dragged column would land: before or after the header `id`, logically. */
interface ColumnDropTarget {
  readonly id: string;
  readonly side: "start" | "end";
}

/** One header as measured when the drag started, with the cells of its column. */
interface Measured {
  readonly id: string;
  readonly left: number;
  readonly right: number;
  readonly cells: readonly HTMLElement[];
}

/** What a column drag needs from its grid. */
interface ColumnDragOptions {
  /** Every column id in the order drawn. */
  readonly order: readonly string[];
  /** Whether a column can be moved, and so be a target. */
  readonly isMovable: (id: string) => boolean;
  /** The reading direction (React Aria's `useLocale`): right to left mirrors the halves and the slides. */
  readonly direction: "ltr" | "rtl";
  /** Moves `id` to `index` in the order without it. */
  readonly onMove: (id: string, index: number) => void;
}

/** The column being dragged and the handlers that drive it. */
interface ColumnDrag {
  /** The column held, or none. */
  readonly dragged: string | null;
  /** Starts a drag of `id` by its `header`, from the pointer at `x`, `y`. */
  readonly begin: (id: string, header: HTMLElement, x: number, y: number) => void;
  /** Follows the pointer; returns the target it is over. */
  readonly move: (x: number, y: number) => ColumnDropTarget | null;
  /** Ends the drag, moving the column when `isDrop` and the pointer is over a target. */
  readonly finish: (isDrop: boolean, x?: number, y?: number) => void;
  /** Starts a native drag (`dragstart`) of `id`, followed and dropped through the document. */
  readonly beginNative: (event: DragEvent<HTMLElement>, id: string, label: string) => void;
  /** The copy that follows the pointer, while one does. */
  readonly follower: ReactNode;
}

/** The live column move of one grid. */
export function useColumnDrag({
  order,
  isMovable,
  direction,
  onMove,
}: ColumnDragOptions): ColumnDrag {
  const isReduced = useReducedMotion() ?? false;
  const [dragged, setDragged] = useState<{ id: string; header: HTMLElement } | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const session = useRef<{
    id: string;
    offsetX: number;
    offsetY: number;
    isRtl: boolean;
    headers: readonly Measured[];
    target: ColumnDropTarget | null;
  } | null>(null);

  const targetAt = (pointerX: number): ColumnDropTarget | null => {
    const now = session.current;
    const over = now?.headers.find((entry) => pointerX >= entry.left && pointerX <= entry.right);
    if (!now || !over || over.id === now.id || !isMovable(over.id)) return null;
    const isLeftHalf = pointerX < over.left + (over.right - over.left) / 2;
    return { id: over.id, side: isLeftHalf === !now.isRtl ? "start" : "end" };
  };

  /** Slides each column to where it stands if the drop happened at `target`. */
  const slide = (target: ColumnDropTarget | null, isInstant = false) => {
    const now = session.current;
    if (!now) return;
    const ids = order;
    const rest = ids.filter((id) => id !== now.id);
    const at = target ? rest.indexOf(target.id) + (target.side === "end" ? 1 : 0) : -1;
    const landed = at < 0 ? ids : [...rest.slice(0, at), now.id, ...rest.slice(at)];
    const widthOf = (id: string) => {
      const entry = now.headers.find((header) => header.id === id);
      return entry ? entry.right - entry.left : 0;
    };
    const step = (id: string) => landed.indexOf(id) - ids.indexOf(id);
    const sign = now.isRtl ? -1 : 1;
    const shiftOf = (id: string) =>
      id === now.id
        ? ids.reduce((sum, other) => (other === id ? sum : sum - step(other) * widthOf(other)), 0)
        : step(id) * widthOf(now.id);
    const transition = isInstant || isReduced ? { duration: 0 } : SLIDE;
    for (const header of now.headers)
      if (header.cells.length > 0)
        animate([...header.cells], { x: shiftOf(header.id) * sign }, transition);
  };

  const begin = (id: string, header: HTMLElement, pointerX: number, pointerY: number) => {
    const grid = header.closest("[role=grid],[role=treegrid]");
    // Every cell (or, virtualised, the box React Aria places it in) belongs to the header it lines up with exactly; a
    // cell spanning columns lines up with none and stays put.
    const boxes = [...(grid?.querySelectorAll<HTMLElement>("[role=row] > *") ?? [])].map(
      (cell) => [cell, cell.getBoundingClientRect()] as const,
    );
    const headers = [
      ...(grid?.querySelectorAll<HTMLElement>("[role=columnheader][data-key]") ?? []),
    ].map((element): Measured => {
      const box = element.getBoundingClientRect();
      const cells = boxes.flatMap(([cell, edge]) =>
        Math.abs(edge.left - box.left) < 1 && Math.abs(edge.right - box.right) < 1 ? [cell] : [],
      );
      return {
        id: element.getAttribute("data-key") ?? "",
        left: box.left,
        right: box.right,
        cells,
      };
    });
    // The column's cells dim with its header (which dims by its own class): together they are the placeholder.
    for (const cell of headers.find((entry) => entry.id === id)?.cells ?? [])
      // A stuck cell (a footer, a pin) covers rows scrolling under it, so it stays opaque.
      if (!cell.contains(header) && !isStuck(cell)) cell.style.opacity = "var(--opacity-dimmed)";
    const box = header.getBoundingClientRect();
    session.current = {
      id,
      offsetX: pointerX - box.left,
      offsetY: pointerY - box.top,
      isRtl: direction === "rtl",
      headers,
      target: null,
    };
    x.set(box.left);
    y.set(box.top);
    setDragged({ id, header });
  };

  const move = (pointerX: number, pointerY: number) => {
    const now = session.current;
    if (!now) return null;
    x.set(pointerX - now.offsetX);
    y.set(pointerY - now.offsetY);
    const target = targetAt(pointerX);
    if (target?.id !== now.target?.id || target?.side !== now.target?.side) {
      now.target = target;
      slide(target);
    }
    return target;
  };

  const finish = (isDrop: boolean, pointerX?: number, pointerY?: number) => {
    const now = session.current;
    if (!now) return;
    const target = pointerX === undefined ? now.target : move(pointerX, pointerY ?? 0);
    slide(null, true);
    for (const cell of now.headers.find((entry) => entry.id === now.id)?.cells ?? [])
      cell.style.opacity = "";
    session.current = null;
    setDragged(null);
    if (!isDrop || !target) return;
    const rest = order.filter((id) => id !== now.id);
    onMove(now.id, rest.indexOf(target.id) + (target.side === "end" ? 1 : 0));
  };

  /** A native drag over the page: follows it, and lets it drop where a target is (a frame or off the window says 0, 0). */
  const over = (drag: globalThis.DragEvent) => {
    if (drag.clientX === 0 && drag.clientY === 0) return;
    if (move(drag.clientX, drag.clientY)) drag.preventDefault();
  };

  const beginNative = (event: DragEvent<HTMLElement>, id: string, label: string) => {
    /* oxlint-disable no-param-reassign -- the drag-and-drop contract is to set effectAllowed on the event */
    event.dataTransfer.effectAllowed = "move";
    /* oxlint-enable no-param-reassign */
    event.dataTransfer.setData("text/plain", label);
    if (!blank) {
      blank = new Image(1, 1);
      blank.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    }
    event.dataTransfer.setDragImage(blank, 0, 0);
    begin(id, event.currentTarget, event.clientX, event.clientY);
    const drop = (drag: globalThis.DragEvent) => {
      drag.preventDefault();
      done();
      finish(true);
    };
    const cancel = () => {
      done();
      finish(false);
    };
    const done = () => {
      document.removeEventListener("dragover", over, true);
      document.removeEventListener("drop", drop, true);
      document.removeEventListener("dragend", cancel, true);
    };
    document.addEventListener("dragover", over, true);
    document.addEventListener("drop", drop, true);
    document.addEventListener("dragend", cancel, true);
  };

  return {
    dragged: dragged?.id ?? null,
    begin,
    move,
    finish,
    beginNative,
    follower: dragged ? <DragFollower source={dragged.header} x={x} y={y} /> : null,
  };
}
