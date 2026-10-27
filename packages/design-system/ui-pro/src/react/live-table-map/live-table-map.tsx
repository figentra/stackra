/**
 * Stackra file contract:
 * Purpose: the web `LiveTableMap`: one area's floor plan drawn read-only, each table showing its live status in its
 *          tone, the caller's lines (elapsed time, waiter, party size, spend) and whether it is suggested; a table is
 *          a button that reports a press.
 * Boundary: shows, never changes, the plan or a status: the statuses, their words and tones, and the live updates are
 *           the caller's (a pack and realtime). Walls are decoration; labels are shown as text.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); WCAG 2.2 SC 1.4.1 (a status is a word, never a colour alone).
 */
import { Chip } from "@stackra/ui/react";
import type { ReactElement } from "react";

import { FLOOR_SHAPE_CLASS } from "#core/constants/floor-shape-class.constant";
import { UI_PRO_KEYS } from "#core/constants/ui-pro-keys.constant";
import { useUiProText } from "#react/hooks/use-ui-pro-text";
import type { LiveTableMapProps } from "#react/live-table-map/live-table-map.props";

/** One area's tables with their live state. */
export function LiveTableMap({
  label,
  columns,
  rows,
  cellSize = 32,
  items,
  tables,
  onTablePress,
}: LiveTableMapProps): ReactElement {
  const t = useUiProText();
  const live = new Map(tables.map((table) => [table.id, table]));
  const suggested = t(UI_PRO_KEYS.ui_pro.live_table_map.suggested);

  return (
    <div
      data-slot="live-table-map"
      role="group"
      aria-label={label}
      className="relative overflow-hidden rounded-lg border border-separator bg-surface-secondary"
      style={{ width: columns * cellSize, height: rows * cellSize }}
    >
      {items.map((item) => {
        const place = {
          insetInlineStart: item.x * cellSize,
          top: item.y * cellSize,
          width: item.width * cellSize,
          height: item.height * cellSize,
        };
        if (item.shape === "wall" || item.shape === "label")
          return (
            <div
              key={item.id}
              data-shape={item.shape}
              aria-hidden={item.shape === "wall" || undefined}
              className={`absolute flex items-center justify-center text-xs text-muted ${FLOOR_SHAPE_CLASS[item.shape]}`}
              style={place}
            >
              {item.shape === "label" ? item.label : null}
            </div>
          );
        const state = live.get(item.id);
        const words = [
          item.label,
          state?.statusLabel,
          ...(state?.lines ?? []),
          state?.isSuggested === true ? suggested : undefined,
        ].filter((word) => word !== undefined);
        return (
          <button
            key={item.id}
            type="button"
            data-table={item.id}
            data-tone={state?.tone}
            data-suggested={state?.isSuggested || undefined}
            aria-label={words.join(", ")}
            disabled={onTablePress === undefined}
            className={`absolute flex flex-col items-center justify-center gap-0.5 overflow-hidden p-1 text-xs ${FLOOR_SHAPE_CLASS[item.shape]} ${state?.isSuggested === true ? "ring-2 ring-accent" : ""}`}
            style={place}
            onClick={() => onTablePress?.(item.id)}
          >
            <span className="truncate font-medium">{item.label}</span>
            {state === undefined ? null : (
              <Chip size="sm" tone={state.tone}>
                {state.statusLabel}
              </Chip>
            )}
            {(state?.lines ?? []).map((line) => (
              <span key={line} className="truncate text-muted">
                {line}
              </span>
            ))}
          </button>
        );
      })}
    </div>
  );
}
