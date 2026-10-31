/**
 * Stackra file contract:
 * Purpose: `WheelColumn`, one wheel of the web WheelPicker: a scroll-snapping list box whose centred row is the
 *          choice. Scrolling, a press on a row, and the arrow, Home and End keys move it; the wheel settles on the
 *          nearest enabled row.
 * Boundary: internal to the wheel pickers. A `listbox` with `aria-activedescendant`, so a screen reader reads the
 *           centred option; the rows scroll smoothly unless the user asks for reduced motion.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); WCAG 2.2 SC 2.1.1, 2.3.3, 4.1.2.
 */
import { cn } from "@heroui/react";
import { useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, type KeyboardEvent, type ReactElement } from "react";

import type { WheelPickerColumn } from "#contracts/types/wheel-picker-column.type";
import { WHEEL_ROW } from "#react/wheel-picker/wheel-row.constant";
import { wheelIndexOf } from "#core/functions/wheel-index-of.function";

/** How long the wheel waits after the last scroll event before it settles. */
// oxlint-disable-next-line stackra/no-literal-duration -- scroll-end debounce, not motion
const SETTLE_MS = 120;

/** The next enabled row from `from` going `step` rows, or `from` when there is none. */
function stepped(column: WheelPickerColumn, from: number, step: number): number {
  for (
    let index = from + step;
    index >= 0 && index < column.items.length;
    index += Math.sign(step) || 1
  ) {
    if (!column.items[index]?.isDisabled) return index;
  }
  return from;
}

/** Draws one scrolling wheel of a wheel picker. */
export function WheelColumn({
  column,
  selected,
  onSelect,
  visibleCount,
  isDisabled,
}: {
  readonly column: WheelPickerColumn;
  readonly selected: string | undefined;
  readonly onSelect: (id: string) => void;
  readonly visibleCount: number;
  readonly isDisabled: boolean;
}): ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const id = useId();
  const isReduced = useReducedMotion() ?? false;
  const found = column.items.findIndex((item) => item.id === selected);
  const index = found < 0 ? 0 : found;

  // The wheel follows the value, whoever changed it.
  useEffect(() => {
    const element = ref.current;
    if (element && Math.abs(element.scrollTop - index * WHEEL_ROW) > 1) {
      element.scrollTo?.({ top: index * WHEEL_ROW, behavior: isReduced ? "auto" : "smooth" });
    }
  }, [index, isReduced]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const choose = (next: number) => {
    const item = column.items[next];
    if (isDisabled || !item || item.isDisabled) return;
    if (item.id !== selected) onSelect(item.id);
  };

  const settle = () => {
    const element = ref.current;
    if (!element) return;
    const next = wheelIndexOf(element.scrollTop, WHEEL_ROW, column.items);
    if (next === index || isDisabled) {
      element.scrollTo?.({ top: index * WHEEL_ROW, behavior: isReduced ? "auto" : "smooth" });
    } else if (next >= 0) choose(next);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const last = column.items.length - 1;
    const moves: Record<string, number> = {
      ArrowDown: stepped(column, index, 1),
      ArrowUp: stepped(column, index, -1),
      PageDown: stepped(column, Math.min(last, index + 4), 0),
      PageUp: stepped(column, Math.max(0, index - 4), 0),
      Home: stepped(column, -1, 1),
      End: stepped(column, column.items.length, -1),
    };
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    choose(next);
  };

  return (
    <div
      ref={ref}
      role="listbox"
      aria-label={column.label}
      aria-activedescendant={`${id}-${index}`}
      aria-disabled={isDisabled || undefined}
      tabIndex={isDisabled ? -1 : 0}
      onKeyDown={onKeyDown}
      onScroll={() => {
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(settle, SETTLE_MS);
      }}
      className="relative min-w-14 flex-auto snap-y snap-mandatory overflow-y-auto overscroll-contain rounded-[var(--radius-container)] outline-none [scrollbar-width:none] focus-visible:[outline-style:var(--focus-ring-style)] focus-visible:outline-(length:--focus-ring-width) focus-visible:-outline-offset-2 focus-visible:outline-focus"
      style={{
        height: WHEEL_ROW * visibleCount,
        paddingBlock: (WHEEL_ROW * (visibleCount - 1)) / 2,
      }}
    >
      {column.items.map((item, row) => (
        // oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus -- reason: the listbox owns the focus and the keys (aria-activedescendant); a click on an option is the pointer path
        <div
          key={item.id}
          id={`${id}-${row}`}
          role="option"
          aria-selected={row === index}
          aria-disabled={item.isDisabled || undefined}
          onClick={() => choose(row)}
          className={
            cn(
              "flex snap-center items-center justify-center px-2 whitespace-nowrap tabular-nums select-none",
              row === index ? "font-semibold text-foreground" : "text-muted",
              item.isDisabled ? "opacity-(--opacity-subtle)" : "cursor-pointer",
            ) ?? ""
          }
          style={{ height: WHEEL_ROW }}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
}
