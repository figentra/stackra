/**
 * Stackra file contract:
 * Purpose: the web `BlueprintSection`: one ruled band of a blueprint page, bounded by the blueprint rule on its inline
 *          sides and top, with `+` marks in the accent at its two top corners. Stacked, the bands draw one ruled
 *          column; each band's top rule closes the one above it.
 * Boundary: a `section`, a named region only when `label` is given. The marks are decoration hidden from assistive
 *           tech. Rules and marks sit on logical sides, so right-to-left mirrors them. It keeps clear of a
 *           `SectionDock` when scrolled to (`scroll-margin-bottom`). Nothing moves.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0501 (section 9, the blueprint roles); ADR 0060 (right-to-left);
 *          STA-2041.
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import type { BlueprintSectionProps } from "#react/blueprint-section/blueprint-section.props";

/** A `+` mark centred on the corner where the top rule meets a side rule (written out whole, so Tailwind sees it). */
const MARK =
  "pointer-events-none absolute -top-[calc((var(--blueprint-mark-size)_+_var(--blueprint-rule-width))/2)] size-(--blueprint-mark-size) text-accent";

/** The two top corners, on logical sides. */
const CORNERS = [
  "-start-[calc((var(--blueprint-mark-size)_+_var(--blueprint-rule-width))/2)]",
  "-end-[calc((var(--blueprint-mark-size)_+_var(--blueprint-rule-width))/2)]",
] as const;

/** A ruled band of a blueprint page. */
export function BlueprintSection({
  id,
  label,
  children,
  hasMarks = true,
  className,
}: BlueprintSectionProps): ReactElement {
  return (
    <section
      {...(id === undefined ? {} : { id })}
      {...(label === undefined ? {} : { "aria-label": label })}
      data-slot="blueprint-section"
      className={cn(
        "relative scroll-mb-(--blueprint-dock-height) [border-inline:var(--blueprint-rule-width)_solid_var(--blueprint-rule)] [border-block-start:var(--blueprint-rule-width)_solid_var(--blueprint-rule)]",
        className,
      )}
    >
      {hasMarks
        ? CORNERS.map((corner) => (
            <svg
              key={corner}
              aria-hidden="true"
              data-slot="blueprint-mark"
              viewBox="0 0 10 10"
              className={cn(MARK, corner)}
            >
              <path d="M5 0V10M0 5H10" stroke="currentColor" strokeWidth="1" />
            </svg>
          ))
        : null}
      {children}
    </section>
  );
}
