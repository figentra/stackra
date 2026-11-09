/**
 * Stackra file contract:
 * Purpose: `SchedulingBoardBlock`, one booking, hold or block of the web SchedulingBoard: a soft block in its tone (the
 *          item's, else accent for a booking, warning for a hold, default for a block) with a coloured start edge, in
 *          its lane of the row; the title, time, subtitle, fill and a hold's countdown, or the caller's content. A
 *          parent's item is faded and says where it comes from; a move awaiting the screen is dashed and busy; an edge
 *          cut by the view is square. A resizable block has a handle at its inline end.
 * Boundary: internal; the grid's input hook reads the pointer and keys through `data-key` and `data-resize`, and the
 *           press comes back through `onPress`. Colours are the tone's token classes; positions are logical insets.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 1.4.1, 2.4.7, 2.5.8 and 4.1.2;
 *          shared modules step 4a (LEADER, 2026-11-09).
 */
import { cn } from "@heroui/react";
import type { Tone } from "@stackra/contracts";
import type { ReactElement } from "react";

import type { SchedulingItemKind } from "#contracts/enums/scheduling-item-kind.enum";
import { MARKER_TONE_CLASS_NAME } from "#core/constants/marker-tone-class-name.constant";
import type { SchedulingBoardBlockProps } from "#react/scheduling-board/scheduling-board-block.props";

/** Each kind's tone when the item names none. */
const KIND_TONE: Readonly<Record<SchedulingItemKind, Tone>> = {
  booking: "accent",
  hold: "warning",
  block: "default",
  closure: "danger",
  working_time: "success",
};

/** One block on a row. */
export function SchedulingBoardBlock({
  placed,
  resource,
  ancestors,
  state,
  stopKey,
  isTabStop,
  isLifted,
  onPress,
  renderItem,
}: SchedulingBoardBlockProps): ReactElement {
  const { item } = placed;
  const isPending = state.isPending(item.id);
  const fill = state.fillOf(item);
  const countdown = item.kind === "hold" ? state.countdownOf(item) : null;
  const lines = [
    { key: "title", text: item.title, className: "font-medium" },
    { key: "time", text: state.timeOf(item), className: "tabular-nums" },
    { key: "subtitle", text: item.subtitle ?? null, className: "" },
    { key: "fill", text: fill, className: "tabular-nums" },
    { key: "countdown", text: countdown, className: "tabular-nums" },
  ];
  // Each line ends in a space so the lines stay separate words for anything reading the text.
  const content =
    renderItem?.(item) ??
    lines.map((line) =>
      line.text ? (
        <span key={line.key} className={cn("truncate", line.className)}>
          {line.text}{" "}
        </span>
      ) : null,
    );
  return (
    <div
      role="gridcell"
      className="absolute p-px"
      style={{
        insetInlineStart: `calc(var(--sb-col) * ${placed.offset})`,
        width: `calc(var(--sb-col) * ${placed.length})`,
        top: `${(placed.lane / placed.lanes) * 100}%`,
        height: `${100 / placed.lanes}%`,
      }}
    >
      <button
        type="button"
        data-key={stopKey}
        tabIndex={isTabStop ? 0 : -1}
        aria-label={state.nameOf(item, resource)}
        aria-busy={isPending || undefined}
        title={placed.inherited ? state.inheritedLabelOf(item, ancestors) : undefined}
        onClick={() => onPress(item)}
        className={cn(
          "relative flex size-full min-w-0 flex-col overflow-hidden px-1.5 py-0.5 text-start text-xs leading-tight",
          "rounded-[var(--radius-control-inner)] outline-none focus-visible:ring-2 focus-visible:ring-focus",
          MARKER_TONE_CLASS_NAME[item.tone ?? KIND_TONE[item.kind]],
          placed.clippedStart ? "rounded-s-none" : "border-s-2 border-current",
          placed.clippedEnd && "rounded-e-none",
          state.canMove(placed) && "cursor-grab touch-none",
          placed.inherited && "opacity-(--opacity-muted)",
          isLifted && "opacity-(--opacity-subtle)",
          isPending && "border-dashed motion-safe:animate-pulse",
        )}
      >
        {content}
        {state.canResize(placed) && !placed.clippedEnd ? (
          <span
            data-resize=""
            aria-hidden="true"
            className="absolute inset-y-0 end-0 w-1.5 cursor-ew-resize"
          />
        ) : null}
      </button>
    </div>
  );
}
