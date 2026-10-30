/**
 * Stackra file contract:
 * Purpose: `DisplaySectionProps`: props of `DisplaySection`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12).
 */
import type { ReactNode } from "react";

/** Props of {@link DisplaySection}. */
export interface DisplaySectionProps {
  /** The section's title. */
  readonly title: string;
  /** The section's fields. */
  readonly children: ReactNode;
}
