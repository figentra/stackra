/**
 * Stackra file contract:
 * Purpose: the title block of a region that has a heading: the title, an optional line under it and the heading's
 *          place in the document outline. PageHeader (the page's `h1`) and Section (a card's `h2`) both take it, so a
 *          page keeps one outline wherever they sit.
 * Boundary: types only. The heading level has no default here: PageHeader defaults to 1 and Section to 2.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0313 (the text slots row); ADR 0314;
 *          WCAG 2.2 SC 1.3.1 and 2.4.6.
 */
import type { ReactNode } from "react";

import type { HeadingLevel } from "#contracts/enums/heading-level.enum";

/** Props shared by PageHeader and Section. */
export interface TitledContractProps {
  /** What the region is about, in a few words. Required: it is the heading a screen reader jumps to. */
  readonly title: ReactNode;
  /** One muted line under the title, for example what the section holds. */
  readonly description?: ReactNode | undefined;
  /** The title's place in the document outline, 1 to 6. */
  readonly headingLevel?: HeadingLevel | undefined;
}
