/**
 * Stackra file contract:
 * Purpose: `useLiveDrag`, the live feel of every React Aria drag in this package (SortableList, the column editor, the
 *          Table's rows, the board's cards, TreeView, DashboardGrid): while a pointer holds an item, a lifted copy of it
 *          follows the pointer (`DragFollower`, the browser's own ghost hidden), the item stays behind dimmed as its
 *          placeholder (the component's `data-[dragging]` class), and the rows after the drop target slide aside by the
 *          item's size into a gap with an accent slot in it, springing back when the target moves on. A keyboard or
 *          screen-reader drag (React Aria's own) opens the same gap and has no copy to follow.
 * Boundary: it only draws: React Aria still picks the target, announces, and calls the component's drop handlers. The
 *           options spread into `useDragAndDrop` (`onDragStart`, `onDragEnd`, `renderDragPreview`), `renderDropIndicator`
 *           draws the gap, and `follower` goes anywhere in the component. `mode: "flow"` puts the slot in the layout
 *           instead of shifting rows (a wrapping grid, where a shift cannot make room). The drag in progress is shared by
 *           every instance, so a card dragged to another board column opens its gap there. Under prefers-reduced-motion
 *           nothing springs or scales.
 * Runtime: browser
 * Governing contract: ADR 0165 (React Aria on web); ADR 0329 (motion layer); owner request 2026-10-31 (live drag,
 *          STA-1371); WCAG 2.2 SC 2.1.1, 2.5.7.
 */
import { cn } from "@heroui/react";
import { motionSpring, STACKRA_THEME } from "@stackra/tokens";
import { animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from "react";
import { ListDropTargetDelegate } from "react-aria/ListDropTargetDelegate";
import {
  DropIndicator,
  type DropTarget,
  type Key,
  type useDragAndDrop,
} from "react-aria-components";

import { DragFollower } from "#react/hooks/drag-follower";

/** React Aria's drop target finder. */
type DropTargetDelegate = NonNullable<Parameters<typeof useDragAndDrop>[0]["dropTargetDelegate"]>;

/** The spring rows slide aside with. */
const SLIDE = { type: "spring", ...motionSpring(STACKRA_THEME, "snappy") } as const;

/** The size of the item being dragged, shared by every instance; 0 when nothing is. */
let dragSize = 0;
const listeners = new Set<() => void>();
const publish = (size: number) => {
  dragSize = size;
  for (const listener of listeners) listener();
};
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => void listeners.delete(listener);
};

/** The element and point a native drag started from, kept for the length of its `dragstart` dispatch. */
let started: { readonly element: HTMLElement; readonly x: number; readonly y: number } | null =
  null;
let watchers = 0;
const remember = (event: DragEvent) => {
  const target = event.target instanceof HTMLElement ? event.target : null;
  if (!target) return;
  started = {
    element: target.closest<HTMLElement>("[data-key]") ?? target,
    x: event.clientX,
    y: event.clientY,
  };
  // React Aria reads it in the same dispatch; a later keyboard drag must not find it.
  setTimeout(() => {
    started = null;
  });
};

/** The rows of the collection around `indicator`, each with whether it comes after it. */
const rowsAround = (indicator: HTMLElement) => {
  const root = indicator.closest("[role=grid],[role=treegrid]");
  // shortcut: document order is taken as the visual order; a virtualised list that reuses views out of order would
  // shift the wrong rows, upgrade to the layout's own order if that shows up.
  return [...(root?.querySelectorAll<HTMLElement>("[role=row][data-key]") ?? [])].map((row) => ({
    row,
    isAfter: (indicator.compareDocumentPosition(row) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
  }));
};

/** The gap at a drop target: an accent slot the size of the dragged item, shifting the rows after it aside. */
// oxlint-disable-next-line react/only-export-components -- reason: the gap is this hook's own drawing, never used alone
function Gap({
  isDropTarget,
  isFlow,
}: {
  readonly isDropTarget: boolean;
  readonly isFlow: boolean;
}): ReactElement {
  const size = useSyncExternalStore(
    subscribe,
    () => dragSize,
    () => 0,
  );
  const isReduced = useReducedMotion() ?? false;
  const self = useRef<HTMLDivElement>(null);
  // Next to the dragged item the gap would only repeat its dimmed place, so none opens there.
  const [isBeside, setBeside] = useState(false);
  useLayoutEffect(() => {
    const indicator = self.current?.parentElement?.closest<HTMLElement>("[role=row]");
    setBeside(
      [indicator?.previousElementSibling, indicator?.nextElementSibling].some(
        (row) => row?.hasAttribute("data-dragging") === true,
      ),
    );
  }, [isDropTarget]);
  const open = isDropTarget && !isBeside ? size : 0;
  const transition = isReduced ? { duration: 0 } : SLIDE;

  useLayoutEffect(() => {
    const indicator = self.current?.parentElement?.closest<HTMLElement>("[role=row]");
    if (isFlow || !indicator || open === 0) return;
    const parent = getComputedStyle(indicator.parentElement ?? indicator);
    const step = open + (Number.parseFloat(parent.rowGap) || 0);
    const rows = rowsAround(indicator);
    for (const { row, isAfter } of rows) animate(row, { y: isAfter ? step : 0 }, transition);
    return () => {
      for (const { row } of rows) animate(row, { y: 0 }, transition);
    };
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- reason: the transition follows the reduced-motion flag
  }, [open, isFlow, isReduced]);

  return (
    <div ref={self} aria-hidden="true" className="relative">
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: open, opacity: open > 0 ? 1 : 0 }}
        transition={transition}
        className={cn(
          "inset-x-0 top-0 rounded-[var(--radius-control)] border-2 border-dashed border-accent bg-accent-soft",
          isFlow ? "relative" : "absolute",
        )}
      />
    </div>
  );
}

/** What a component spreads into `useDragAndDrop` and draws. */
interface LiveDrag {
  /** Spread into `useDragAndDrop`: the copy and gap start and end with React Aria's drag. */
  readonly options: {
    readonly onDragStart: (event: { readonly keys: Set<Key> }) => void;
    readonly onDragEnd: () => void;
    readonly renderDragPreview: () => ReactElement;
    readonly dropTargetDelegate?: DropTargetDelegate;
  };
  /** React Aria's drop indicator, drawn as the gap; `className` places it (a grid span, say). */
  readonly renderDropIndicator: (target: DropTarget, className?: string) => ReactElement;
  /** Given as the collection's `ref` (`GridList`, `Tree`, the table), so targets are found where rows stood. */
  readonly attach: (element: HTMLElement | null) => void;
  /** The keys being dragged, or none. */
  readonly draggedKeys: ReadonlySet<Key>;
  /** The copy that follows the pointer, while one does. */
  readonly follower: ReactNode;
}

/** The live drag of one React Aria collection. */
export function useLiveDrag({
  mode = "shift",
}: { readonly mode?: "shift" | "flow" } = {}): LiveDrag {
  const [source, setSource] = useState<HTMLElement | null>(null);
  const [draggedKeys, setDraggedKeys] = useState<ReadonlySet<Key>>(new Set());
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const stop = useRef<(() => void) | null>(null);
  const [root, setRoot] = useState<HTMLElement | null>(null);
  // React Aria's own list targeting, read with the slid rows put back for the moment: a row's target is where it stood,
  // so opening a gap never moves the target away from the pointer.
  const dropTargetDelegate = useMemo<DropTargetDelegate>(
    () => ({
      getDropTargetFromPoint(pointX, pointY, isValidDropTarget) {
        const rows = [...(root?.querySelectorAll<HTMLElement>("[role=row][data-key]") ?? [])];
        const slid = rows.map((row) => [row, row.style.transform] as const);
        for (const [row] of slid) row.style.transform = "none";
        const items = rows.map((row) => ({ type: "item", key: row.dataset["key"] ?? "" }));
        const target = new ListDropTargetDelegate(
          items as unknown as ConstructorParameters<typeof ListDropTargetDelegate>[0],
          { current: root } as RefObject<HTMLElement>,
        ).getDropTargetFromPoint(pointX, pointY, isValidDropTarget);
        for (const [row, transform] of slid) row.style.transform = transform;
        return target;
      },
    }),
    [root],
  );

  useEffect(() => {
    if (watchers++ === 0) document.addEventListener("dragstart", remember, true);
    return () => {
      if (--watchers === 0) document.removeEventListener("dragstart", remember, true);
      stop.current?.();
    };
  }, []);

  const end = () => {
    stop.current?.();
    stop.current = null;
    publish(0);
    setSource(null);
    setDraggedKeys(new Set());
  };

  // The source may unmount on the drop (a card that changed column), so its own `dragend` is not waited for.
  const finish = () => queueMicrotask(end);

  const onDragStart = ({ keys }: { readonly keys: Set<Key> }) => {
    const pointer = started;
    const element =
      pointer?.element ??
      (document.activeElement instanceof HTMLElement
        ? document.activeElement.closest<HTMLElement>("[data-key]")
        : null);
    setDraggedKeys(new Set(keys));
    if (!element) return;
    const box = element.getBoundingClientRect();
    publish(box.height);
    if (!pointer) return;
    const offset = { x: pointer.x - box.left, y: pointer.y - box.top };
    const follow = (event: DragEvent) => {
      // A drag over a frame or off the window reports 0, 0; the copy stays where it was.
      if (event.clientX === 0 && event.clientY === 0) return;
      x.set(event.clientX - offset.x);
      y.set(event.clientY - offset.y);
    };
    x.set(box.left);
    y.set(box.top);
    document.addEventListener("dragover", follow, true);
    document.addEventListener("drop", finish, true);
    document.addEventListener("dragend", finish, true);
    stop.current = () => {
      document.removeEventListener("dragover", follow, true);
      document.removeEventListener("drop", finish, true);
      document.removeEventListener("dragend", finish, true);
    };
    setSource(element);
  };

  return {
    options: {
      onDragStart,
      onDragEnd: end,
      // The browser's ghost is a see-through pixel: the follower is the preview.
      renderDragPreview: () => <div className="size-px opacity-0" />,
      ...(mode === "shift" ? { dropTargetDelegate } : {}),
    },
    renderDropIndicator: (target, className) => (
      <DropIndicator target={target} className={cn("border-0 outline-none", className) ?? ""}>
        {({ isDropTarget }) => <Gap isDropTarget={isDropTarget} isFlow={mode === "flow"} />}
      </DropIndicator>
    ),
    attach: setRoot,
    draggedKeys,
    follower: source ? <DragFollower source={source} x={x} y={y} /> : null,
  };
}
