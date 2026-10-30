/**
 * Stackra file contract:
 * Purpose: `DisplaySection`: a titled section of a Display popover's fields (the shell's and the Theme Studio's); a
 *          hairline parts it from the one before.
 * Boundary: presentation only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); WCAG 2.2 SC 1.3.1.
 */
import { useId } from "react";

import type { DisplaySectionProps } from "./display-section.props";

/** A titled group of fields. */
export function DisplaySection({ title, children }: DisplaySectionProps) {
  const id = useId();
  return (
    <div
      role="group"
      aria-labelledby={id}
      className="grid gap-3 border-t border-separator pt-4 first:border-t-0 first:pt-0"
    >
      <h3 id={id} className="text-xs font-semibold text-muted">
        {title}
      </h3>
      {children}
    </div>
  );
}
