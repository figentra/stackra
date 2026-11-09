/**
 * Stackra file contract:
 * Purpose: `useSchedulingBoardInput(state, lanes, selectable, onItemPress, locale)`, the pointer and keyboard input of
 *          the web SchedulingBoard. Roving focus over each row's slots and blocks (arrows, mirrored right to left; Home
 *          and End); a range picked with Enter, Shift and arrows, Enter; a block picked up with `m`, moved with arrows
 *          (Up and Down change rows), resized with Shift and arrows, dropped with Enter; and the same three drags by
 *          pointer: across empty slots, on a block, or on its end handle. Escape cancels any of them.
 * Boundary: a React hook with no rendering: it turns input into drafts through the shared state's `timeAt`, `snap` and
 *           `nudge`, and reports through its `commitRange` and `commitChange`; the grid draws the preview. A movement
 *           under 4 px is a press. Pointer positions are measured from the lane's inline start, so a right-to-left
 *           board mirrors. While a keyboard drag runs, each step's time and conflicts are announced.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WAI-ARIA grid pattern; WCAG 2.2 SC 2.1.1,
 *          2.4.3, 2.5.7 and 4.1.3; shared modules step 4a (LEADER, 2026-11-09).
 */
import { useEffect, useState, type KeyboardEvent } from "react";

import type { SchedulingBoardDraft } from "#contracts/types/scheduling-board-draft.type";
import type { SchedulingBoardItem } from "#contracts/types/scheduling-board-item.type";
import { SCHEDULING_BOARD_KEYS } from "#core/constants/scheduling-board-keys.constant";
import type { PlacedSchedulingItem } from "#core/types/placed-scheduling-item.type";
import type { SchedulingBoardState } from "#core/types/scheduling-board-state.type";
import { useUiText } from "#react/hooks/use-ui-text";
import type { SchedulingBoardDrag } from "#react/scheduling-board/scheduling-board-drag.type";
import type { SchedulingBoardInput } from "#react/scheduling-board/scheduling-board-input.type";
import type { SchedulingBoardLane } from "#react/scheduling-board/scheduling-board-lane.type";

/** The SchedulingBoard's keys. */
const K = SCHEDULING_BOARD_KEYS.ui.scheduling_board;

/** How far a pointer moves before a press becomes a drag, in pixels. */
const SLOP = 4;

/** One focus stop of a row: an empty slot or a block. */
interface Stop {
  /** Its key, also its element's `data-key`. */
  readonly key: string;
  /** Where it sits, in columns, for the order along the row. */
  readonly at: number;
  /** The index of its row among the resource rows. */
  readonly row: number;
  /** The column it sits in. */
  readonly column: number;
  /** The block, or null for a slot. */
  readonly placed: PlacedSchedulingItem | null;
}

/** The key of an empty slot's stop. */
const cellKey = (resourceId: string, column: number) => `c|${resourceId}|${column}`;

/** The key of a block's stop on a row. */
const blockKey = (resourceId: string, itemId: string) => `b|${resourceId}|${itemId}`;

/** The element of a stop, looked up in the grid. */
const elementIn = (grid: HTMLElement | null, key: string): HTMLElement | undefined =>
  [...(grid?.querySelectorAll<HTMLElement>("[data-key]") ?? [])].find(
    (element) => element.dataset.key === key,
  );

/** Whether an element reads right to left: its nearest `dir`, else its computed direction. */
const isRtl = (element: Element) => {
  const dir = element.closest("[dir]")?.getAttribute("dir");
  if (dir === "rtl" || dir === "ltr") return dir === "rtl";
  return getComputedStyle(element).direction === "rtl";
};

/** A draft as a bare item, for the state's time words. */
const asItem = (draft: SchedulingBoardDraft): SchedulingBoardItem => ({
  id: "",
  resourceIds: [],
  kind: "booking",
  title: "",
  start: draft.start,
  end: draft.end,
});

/** Whether a drag has left everything where it found it. */
const isUnchanged = ({ draft, origin }: SchedulingBoardDrag) =>
  draft.resourceId === origin.resourceId &&
  draft.start.getTime() === origin.start.getTime() &&
  draft.end.getTime() === origin.end.getTime();

/** A block's draft named by what it does so far: a move once its start or row changed, else a resize. */
const named = (draft: SchedulingBoardDraft, origin: SchedulingBoardDraft): SchedulingBoardDraft => {
  if (draft.change === "select") return draft;
  const moved =
    draft.resourceId !== origin.resourceId || draft.start.getTime() !== origin.start.getTime();
  return {
    ...draft,
    change: moved || draft.end.getTime() === origin.end.getTime() ? "move" : "resize",
  };
};

/** Stops the click that ends a drag before it reaches a slot or block. */
function swallow(click: MouseEvent): void {
  click.stopPropagation();
  click.preventDefault();
}

/**
 * Swallows the next click: a one-shot capturing listener, so no handler has to read a flag. The click that ends a drag
 * fires before any timer, so the timer only removes the listener when no click came.
 */
function suppress(): void {
  window.addEventListener("click", swallow, { capture: true, once: true });
  setTimeout(() => window.removeEventListener("click", swallow, { capture: true }), 0);
}

/** The pointer and keyboard input of the web SchedulingBoard. */
export function useSchedulingBoardInput(
  state: SchedulingBoardState,
  lanes: readonly SchedulingBoardLane[],
  selectable: boolean,
  onItemPress: ((item: SchedulingBoardItem) => void) | undefined,
  locale: string,
): SchedulingBoardInput {
  const t = useUiText();
  const [drag, setDrag] = useState<SchedulingBoardDrag | null>(null);
  const [active, setActive] = useState<string | null>(null);
  // The grid element is state, set by a callback ref, so render never reads a ref.
  const [grid, setGrid] = useState<HTMLDivElement | null>(null);
  // A stop to focus once it is drawn, as a fresh object per request so asking twice for one key still runs.
  const [refocus, setRefocus] = useState<{ readonly key: string } | null>(null);
  const count = state.columns.length;
  const first = state.columns[0];
  const columnMs = first ? first.end.getTime() - first.start.getTime() : 0;

  const rows: Stop[][] = lanes.map((lane, row) =>
    [
      ...Array.from({ length: count }, (_, column) => ({
        key: cellKey(lane.resource.id, column),
        at: column,
        row,
        column,
        placed: null,
      })),
      ...lane.placements
        .filter((placed) => placed.layer === "block")
        .map((placed) => ({
          key: blockKey(lane.resource.id, placed.item.id),
          at: placed.offset,
          row,
          column: Math.min(count - 1, Math.max(0, Math.floor(placed.offset))),
          placed,
        })),
    ].toSorted((a, b) => a.at - b.at || Number(a.placed !== null) - Number(b.placed !== null)),
  );
  const stops = new Map(rows.flat().map((stop) => [stop.key, stop]));
  const tabKey = active !== null && stops.has(active) ? active : (rows[0]?.[0]?.key ?? "");

  // A stop that appears only after a render (a dropped block on its new row) is focused once it is drawn.
  useEffect(() => {
    if (refocus !== null) elementIn(grid, refocus.key)?.focus();
  }, [refocus, grid]);

  const focus = (key: string | undefined) => {
    if (key === undefined) return;
    setActive(key);
    const element = elementIn(grid, key);
    if (element) element.focus();
    else setRefocus({ key });
  };
  const list = new Intl.ListFormat(locale, { style: "narrow", type: "unit" });
  const wordsOf = (draft: SchedulingBoardDraft) =>
    list.format([
      state.resourceOf(draft.resourceId)?.label ?? "",
      state.timeOf(asItem(draft)),
      ...state
        .conflictsOf(draft)
        .flatMap((conflict) => (conflict.message ? [conflict.message] : [])),
    ]);
  const cancel = () => {
    setDrag(null);
    state.announce(t(K.cancelled));
  };
  const finish = (current: SchedulingBoardDrag) => {
    setDrag(null);
    const { draft } = current;
    if (draft.change === "select") {
      state.commitRange(draft);
      return;
    }
    if (isUnchanged(current)) {
      state.announce(t(K.cancelled));
      return;
    }
    state.commitChange(draft);
    if (current.source === "keyboard" && draft.itemId !== null) {
      focus(blockKey(draft.resourceId, draft.itemId));
    }
  };
  const step = (current: SchedulingBoardDrag, steps: number, rowSteps: number, resize: boolean) => {
    const draft = named(state.nudge(current.draft, steps, rowSteps, resize), current.origin);
    setDrag({ ...current, draft });
    state.announce(wordsOf(draft));
  };

  const onDragKey = (
    event: KeyboardEvent<HTMLElement>,
    current: SchedulingBoardDrag,
    across: number,
    down: number,
  ) => {
    const { placed, draft } = current;
    const isRange = draft.change === "select";
    if (event.key === "Escape") cancel();
    else if (event.key === "Enter") finish(current);
    else if (across !== 0 && event.shiftKey && (isRange || (placed && state.canResize(placed)))) {
      step(current, across, 0, true);
    } else if (across !== 0 && !event.shiftKey && (isRange || (placed && state.canMove(placed)))) {
      step(current, across, 0, false);
    } else if (down !== 0 && !isRange && placed && state.canMove(placed)) {
      step(current, 0, down, false);
    } else if (!event.key.startsWith("Arrow") && event.key !== " ") {
      return;
    }
    event.preventDefault();
  };

  return {
    drag,
    tabKey,
    attach: setGrid,
    cellKey,
    blockKey,
    pressSlot: (resourceId, column) => {
      const at = state.columns[column];
      if (drag !== null || !selectable || !at) return;
      state.commitRange({
        change: "select",
        itemId: null,
        fromResourceId: null,
        resourceId,
        start: at.start,
        end: at.end,
      });
    },
    pressItem: (item) => {
      if (drag !== null) return;
      onItemPress?.(item);
    },
    onKeyDown: (event) => {
      const target =
        event.target instanceof Element ? event.target.closest<HTMLElement>("[data-key]") : null;
      const key = target?.dataset.key;
      const stop = key === undefined ? undefined : stops.get(key);
      if (!target || !stop) return;
      const forward = isRtl(target) ? -1 : 1;
      const across =
        event.key === "ArrowRight" ? forward : event.key === "ArrowLeft" ? -forward : 0;
      const down = event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0;
      if (drag?.source === "pointer") return;
      if (drag !== null) {
        onDragKey(event, drag, across, down);
        return;
      }
      const row = rows[stop.row] ?? [];
      const lane = lanes[stop.row];
      const index = row.indexOf(stop);
      const placed = stop.placed;
      if (across !== 0 && !event.shiftKey) {
        focus(row[Math.min(row.length - 1, Math.max(0, index + across))]?.key);
      } else if (event.key === "Home" || event.key === "End") {
        focus((event.key === "Home" ? row[0] : row.at(-1))?.key);
      } else if (down !== 0) {
        const next = lanes[stop.row + down];
        if (next) focus(cellKey(next.resource.id, stop.column));
      } else if (event.key === "Enter" && placed === null && selectable && lane) {
        const at = state.columns[stop.column];
        if (!at) return;
        const draft: SchedulingBoardDraft = {
          change: "select",
          itemId: null,
          fromResourceId: null,
          resourceId: lane.resource.id,
          start: at.start,
          end: at.end,
        };
        setDrag({ source: "keyboard", draft, origin: draft, placed: null, point: null });
        state.announce(state.startWordsOf(draft, null));
      } else if (
        (event.key === "m" || event.key === "M") &&
        placed !== null &&
        lane &&
        (state.canMove(placed) || state.canResize(placed))
      ) {
        const draft: SchedulingBoardDraft = {
          change: state.canMove(placed) ? "move" : "resize",
          itemId: placed.item.id,
          fromResourceId: lane.resource.id,
          resourceId: lane.resource.id,
          start: placed.item.start,
          end: placed.item.end,
        };
        setDrag({ source: "keyboard", draft, origin: draft, placed, point: null });
        state.announce(state.startWordsOf(draft, placed.item.title));
      } else {
        return;
      }
      event.preventDefault();
    },
    onPointerDown: (event) => {
      if (event.button !== 0 || drag !== null || !(event.target instanceof Element)) return;
      const target = event.target.closest<HTMLElement>("[data-key]");
      const key = target?.dataset.key;
      const stop = key === undefined ? undefined : stops.get(key);
      const laneElement = target?.closest<HTMLElement>("[data-lane]");
      const lane = stop ? lanes[stop.row] : undefined;
      if (!stop || !laneElement || !lane) return;
      const placed = stop.placed;
      const onHandle = event.target.closest("[data-resize]") !== null;
      const change =
        placed === null
          ? selectable
            ? "select"
            : null
          : onHandle && state.canResize(placed)
            ? "resize"
            : state.canMove(placed)
              ? "move"
              : null;
      if (change === null) return;
      const rtl = isRtl(laneElement);
      const positionAt = (x: number) => {
        const rect = laneElement.getBoundingClientRect();
        if (rect.width === 0) return 0;
        return ((rtl ? rect.right - x : x - rect.left) / rect.width) * count;
      };
      const anchor = positionAt(event.clientX);
      const [x0, y0, pointerId] = [event.clientX, event.clientY, event.pointerId];
      const column = state.columns[stop.column];
      if (!column) return;
      const origin: SchedulingBoardDraft = placed
        ? {
            change,
            itemId: placed.item.id,
            fromResourceId: lane.resource.id,
            resourceId: lane.resource.id,
            start: placed.item.start,
            end: placed.item.end,
          }
        : {
            change,
            itemId: null,
            fromResourceId: null,
            resourceId: lane.resource.id,
            start: column.start,
            end: column.end,
          };
      let latest: SchedulingBoardDrag | null = null;
      const rowAt = (x: number, y: number) => {
        // The preview and hint take no pointer events, so the row under the pointer is found through them.
        const hit =
          typeof document.elementFromPoint === "function" ? document.elementFromPoint(x, y) : null;
        return (
          hit?.closest<HTMLElement>("[data-resource-id]")?.dataset.resourceId ??
          latest?.draft.resourceId ??
          origin.resourceId
        );
      };
      const draftAt = (x: number, y: number): SchedulingBoardDraft => {
        const delta = positionAt(x) - anchor;
        if (placed === null) {
          const here = Math.min(count - 1, Math.max(0, Math.floor(positionAt(x))));
          const from = Math.min(stop.column, here);
          const to = Math.max(stop.column, here) + 1;
          return { ...origin, start: state.timeAt(from), end: state.timeAt(to) };
        }
        const { item } = placed;
        if (change === "resize") {
          const least = state.nudge({ ...origin, end: origin.start }, 0, 0, true).end;
          const end = placed.clippedEnd
            ? state.snap(new Date(item.end.getTime() + delta * columnMs))
            : state.timeAt(placed.offset + placed.length + delta);
          return { ...origin, end: end < least ? least : end };
        }
        const start = placed.clippedStart
          ? state.snap(new Date(item.start.getTime() + delta * columnMs))
          : state.timeAt(placed.offset + delta);
        const length = item.end.getTime() - item.start.getTime();
        return named(
          { ...origin, resourceId: rowAt(x, y), start, end: new Date(start.getTime() + length) },
          origin,
        );
      };
      const stopListening = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onCancel);
        window.removeEventListener("keydown", onEscape);
      };
      function onMove(move: globalThis.PointerEvent) {
        if (move.pointerId !== pointerId) return;
        if (latest === null && Math.hypot(move.clientX - x0, move.clientY - y0) < SLOP) return;
        latest = {
          source: "pointer",
          draft: draftAt(move.clientX, move.clientY),
          origin,
          placed,
          point: [move.clientX, move.clientY],
        };
        setDrag(latest);
      }
      function onUp(up: globalThis.PointerEvent) {
        if (up.pointerId !== pointerId) return;
        stopListening();
        if (latest === null) return;
        suppress();
        finish(latest);
      }
      function onCancel(cancelled: globalThis.PointerEvent) {
        if (cancelled.pointerId !== pointerId) return;
        stopListening();
        if (latest !== null) setDrag(null);
      }
      function onEscape(press: globalThis.KeyboardEvent) {
        if (press.key !== "Escape") return;
        press.preventDefault();
        stopListening();
        if (latest === null) return;
        suppress();
        cancel();
      }
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onCancel);
      window.addEventListener("keydown", onEscape);
    },
    onFocus: (event) => {
      const key = event.target instanceof HTMLElement ? event.target.dataset.key : undefined;
      if (key !== undefined && stops.has(key)) setActive(key);
    },
    onBlur: (event) => {
      const next = event.relatedTarget;
      if (drag?.source !== "keyboard") return;
      if (next instanceof Node && grid?.contains(next)) return;
      cancel();
    },
  };
}
