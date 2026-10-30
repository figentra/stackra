/**
 * Stackra file contract:
 * Purpose: the web `WheelPicker`: side-by-side wheels (WheelColumn) under one band that marks the centred row, the
 *          value being the centred key of each column.
 * Boundary: no list of its own; the band and the edge fade are decoration. Columns run from the reading start, so
 *           they mirror in a right-to-left page. A `group` named by `label`.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); WCAG 2.2 SC 1.3.1,
 *          2.1.1, 4.1.2.
 */
import { cn } from "@heroui/react";
import { useState, type ReactElement } from "react";

import { WheelColumn } from "#react/wheel-picker/wheel-column";
import { WHEEL_ROW } from "#react/wheel-picker/wheel-row.constant";
import type { WheelPickerProps } from "#react/wheel-picker/wheel-picker.props";

/** Fades the rows away from the centre. */
const FADE = "[mask-image:linear-gradient(to_bottom,transparent,black_30%,black_70%,transparent)]";

/** Side-by-side wheels; `onChange` gets every column's key each time one settles on a new choice. */
export function WheelPicker({
  columns,
  value,
  defaultValue,
  onChange,
  visibleCount = 5,
  label,
  isDisabled = false,
  className,
  ...rest
}: WheelPickerProps): ReactElement {
  const [own, setOwn] = useState<Readonly<Record<string, string>>>(defaultValue ?? {});
  const keys = value ?? own;
  const rows = visibleCount % 2 === 0 ? visibleCount + 1 : visibleCount;
  const select = (column: string, id: string) => {
    const next = {
      ...Object.fromEntries(columns.map((c) => [c.id, keys[c.id] ?? c.items[0]?.id ?? ""])),
      [column]: id,
    };
    if (value === undefined) setOwn(next);
    onChange?.(next);
  };
  return (
    <div
      {...rest}
      role="group"
      aria-label={label}
      aria-disabled={isDisabled || undefined}
      className={cn("relative flex gap-1", isDisabled && "opacity-60", className) ?? ""}
    >
      <div
        aria-hidden
        // The band is an inset shadow, not a background: axe took a background band as partly covering the rows
        // beside it and left every one for review; on screen the two are the same.
        className="pointer-events-none absolute inset-x-0 rounded-xl shadow-[inset_0_0_0_100vmax_var(--default)]"
        style={{ top: (WHEEL_ROW * (rows - 1)) / 2, height: WHEEL_ROW }}
      />
      {/* Clipped as well as scrolled: axe takes only `overflow: hidden` as clipping, so rows scrolled out of a wheel
          were measured where they lie, under the page, and left for review. */}
      <div className={cn("relative flex flex-1 gap-1 overflow-hidden", FADE) ?? ""}>
        {columns.map((column) => (
          <WheelColumn
            key={column.id}
            column={column}
            selected={keys[column.id] ?? column.items[0]?.id}
            onSelect={(id) => select(column.id, id)}
            visibleCount={rows}
            isDisabled={isDisabled}
          />
        ))}
      </div>
    </div>
  );
}
