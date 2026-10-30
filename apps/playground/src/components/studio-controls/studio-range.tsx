/**
 * Stackra file contract:
 * Purpose: `StudioRange`: one labelled native range input of the studio's controls, showing its value.
 * Boundary: presentation only; the value is the caller's.
 * Runtime: browser
 * Governing contract: ADR 0320 (the Theme Studio); WCAG 2.2 SC 1.3.1, 2.5.8, 4.1.2.
 */
import { useId } from "react";

import type { StudioRangeProps } from "./studio-range.props";

/** One labelled range input that shows its value. */
export function StudioRange({
  label,
  value,
  min,
  max,
  step,
  unit = "",
  isDisabled = false,
  onChange,
}: StudioRangeProps) {
  const id = useId();
  return (
    <div className="grid gap-1">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <label htmlFor={id} className="font-medium">
          {label}
        </label>
        <output htmlFor={id} dir="ltr" className="font-mono text-xs text-muted">
          {`${value}${unit}`}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={isDisabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-6 w-full cursor-pointer accent-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}
