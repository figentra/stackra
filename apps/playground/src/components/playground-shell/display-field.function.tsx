/**
 * Stackra file contract:
 * Purpose: `displayField`: one labelled field on a Display popover's two-column grid (the shell's and the Theme
 *          Studio's): the label (and under it the current value, when the control does not spell it) in the first
 *          column, the control stretched across the second.
 * Boundary: presentation only; the control carries its own accessible name, so the drawn label is hidden from it.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5).
 */
import type { ReactNode } from "react";

/** A labelled field. */
export const displayField = (label: string, control: ReactNode, value?: string) => (
  <div className="grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-x-4">
    <div aria-hidden="true" className="grid min-w-0 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      {value ? <span className="truncate text-xs text-muted">{value}</span> : null}
    </div>
    {/* One height for every control, a Select's trigger included (it is 2px taller on its own). */}
    <div className="grid min-w-0 [&_button]:h-9 [&_button]:min-h-9">{control}</div>
  </div>
);
