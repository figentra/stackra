/**
 * Stackra file contract:
 * Purpose: `SchedulingBoardPreview`, where a drag on the web SchedulingBoard would leave things: a dashed accent block
 *          at the draft's place on its row, the carried block's title in it, and a hint with the row, the time and
 *          each conflict (red for `block`, amber for `warn`). A pointer's hint follows the pointer; the keyboard's sits
 *          under the preview.
 * Boundary: internal and silent: it takes no pointer events and is hidden from assistive technology, because the input
 *           hook announces the same words in the board's live region. Colours are token classes.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 1.4.1 and 2.5.7; shared modules
 *          step 4a (LEADER, 2026-11-09).
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import { schedulingPositionOf } from "#core/functions/scheduling-position-of.function";
import type { SchedulingBoardPreviewProps } from "#react/scheduling-board/scheduling-board-preview.props";

/** The drag's preview and hint. */
export function SchedulingBoardPreview({
  state,
  drag,
}: SchedulingBoardPreviewProps): ReactElement | null {
  const { draft, placed, point } = drag;
  const start = schedulingPositionOf(draft.start, state.columns);
  const end = schedulingPositionOf(draft.end, state.columns);
  const conflicts = state.conflictsOf(draft);
  const isBlocked = conflicts.some((conflict) => conflict.severity === "block");
  const time = state.timeOf({
    id: "",
    resourceIds: [],
    kind: "booking",
    title: "",
    start: draft.start,
    end: draft.end,
  });
  const hint = (
    <div
      className={cn(
        "pointer-events-none z-(--z-float) flex max-w-64 flex-col gap-0.5 rounded-[var(--radius-control)] border border-separator bg-overlay px-2 py-1 text-xs text-foreground shadow-overlay",
        point ? "fixed translate-x-3 translate-y-3" : "absolute start-0 top-full mt-1",
      )}
      style={point ? { left: point[0], top: point[1] } : undefined}
    >
      <span className="font-medium">{state.resourceOf(draft.resourceId)?.label}</span>
      <span className="tabular-nums">{time}</span>
      {conflicts.map((conflict) =>
        conflict.message ? (
          <span
            key={conflict.reason}
            className={conflict.severity === "block" ? "text-danger" : "text-warning"}
          >
            {conflict.message}
          </span>
        ) : null,
      )}
    </div>
  );
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 z-(--z-raised) p-px"
      style={{
        insetInlineStart: `calc(var(--sb-col) * ${start})`,
        width: `calc(var(--sb-col) * ${Math.max(0, end - start)})`,
      }}
    >
      <div
        className={cn(
          "flex size-full min-w-0 flex-col overflow-hidden rounded-[var(--radius-control-inner)] border-2 border-dashed px-1.5 py-0.5 text-xs leading-tight",
          isBlocked
            ? "border-danger bg-danger-soft text-danger-soft-foreground"
            : "border-accent bg-accent-soft text-accent-soft-foreground",
        )}
      >
        {placed ? <span className="truncate font-medium">{placed.item.title}</span> : null}
        <span className="truncate tabular-nums">{time}</span>
      </div>
      {hint}
    </div>
  );
}
