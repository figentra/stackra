/**
 * Stackra file contract:
 * Purpose: the props EmptyState and ErrorState share to say what they show: an icon, a title, a description and the
 *          actions the reader can take next, plus the outline level of the title. `EmptyStateContractProps` and
 *          `ErrorStateContractProps` extend it with the word that names why they appear.
 * Boundary: types only. The design system carries no copy, so the title is required and every word is the caller's.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0313 (decisions 1 and 6); WCAG 2.2 SC 1.3.1.
 */
import type { ReactNode } from "react";

import type { HeadingLevel } from "#contracts/enums/heading-level.enum";
import type { IconSlot } from "#contracts/types/icon-slot.type";

/** Props shared by the web and native EmptyState and ErrorState. */
export interface StateContractProps {
  /** What is the matter, in a few words. Required: it is the heading a screen reader jumps to. */
  readonly title: ReactNode;
  /** One or two sentences: why it is so, and what to do next. */
  readonly description?: ReactNode | undefined;
  /** An icon in place of the reason's or kind's own, or `false` for none. */
  readonly icon?: IconSlot | false | undefined;
  /** Buttons or links for the reader's next step, drawn under the description in a wrapping row. */
  readonly actions?: ReactNode | undefined;
  /** The title's place in the document outline, 1 to 6, so the page keeps one outline wherever this sits. */
  readonly headingLevel?: HeadingLevel | undefined;
}
