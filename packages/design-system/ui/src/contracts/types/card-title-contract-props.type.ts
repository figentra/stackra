/**
 * Stackra file contract:
 * Purpose: the props every runtime's `Card.Title` takes: the card's heading text and its place in the document
 *          outline.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0304; WCAG 2.2 SC 1.3.1 and 2.4.6.
 */
import type { ReactNode } from "react";

import type { HeadingLevel } from "#contracts/enums/heading-level.enum";

/** Props shared by the web and native `Card.Title`. */
export interface CardTitleContractProps {
  /** The title text. */
  readonly children?: ReactNode;
  /** The heading level in the page outline; the look stays the card title's. Defaults to 3, below a section's 2. */
  readonly level?: HeadingLevel | undefined;
}
