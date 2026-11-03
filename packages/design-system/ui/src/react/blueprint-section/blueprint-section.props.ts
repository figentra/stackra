/**
 * Stackra file contract:
 * Purpose: `BlueprintSectionProps`, the props of the web `BlueprintSection` in `blueprint-section.tsx`.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (one declaration per file); ADR 0302 (decision 3); ADR 0501 (section 9, the blueprint
 *          roles); STA-2041.
 */
import type { ReactNode } from "react";

/** Props of the web BlueprintSection. */
export interface BlueprintSectionProps {
  /** The section's element id, the target of a `SectionDock` link. */
  readonly id?: string | undefined;
  /** The section's spoken name; given, the section is a named region landmark. */
  readonly label?: string | undefined;
  /** The section's heading and drawing. */
  readonly children: ReactNode;
  /** Draws the `+` marks at the two top corners. Defaults to true. */
  readonly hasMarks?: boolean | undefined;
  /** Styles the section, such as its padding. */
  readonly className?: string | undefined;
}
