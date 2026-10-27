/**
 * Stackra file contract:
 * Purpose: `PageSectionProps`, what the playground's `PageSection` takes: the heading id and title, an optional note
 *          and the section's content.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12); ADR 0302 (decision 5).
 */
import type { ReactNode } from "react";

/** Props of {@link PageSection}. */
export interface PageSectionProps {
  /** The id of the heading, which names the region; unique on the page. */
  id: string;
  /** The section's title, its level-2 heading. */
  title: string;
  /** A short sentence under the heading saying what the samples show. */
  note?: string;
  /** The samples the section shows. */
  children: ReactNode;
}
