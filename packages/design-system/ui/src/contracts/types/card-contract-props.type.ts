/**
 * Stackra file contract:
 * Purpose: the props every runtime's `Card` root takes: a surface with card chrome (padding, radius, the theme's
 *          surface shadow) holding `Card.Header`, `Card.Title`, `Card.Description`, `Card.Content` and `Card.Footer`.
 *          Each runtime's `CardProps` is this plus its HeroUI card's own props, which pass through unchanged.
 * Boundary: types only; the parts other than the title take their HeroUI part's props unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0165.
 */
import type { ReactNode } from "react";

import type { SurfaceVariant } from "#contracts/enums/surface-variant.enum";

/** Props shared by the web and native `Card`. */
export interface CardContractProps {
  /** The card's parts, usually a header, content and footer; any element is allowed. */
  readonly children: ReactNode;
  /** The surface level of the card; `transparent` drops the background and shadow. Defaults to `default`. */
  readonly variant?: SurfaceVariant | undefined;
}
