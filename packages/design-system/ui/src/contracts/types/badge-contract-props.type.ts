/**
 * Stackra file contract:
 * Purpose: the props every runtime's `Badge` takes: the content, tone, variant, size, logical corner and the text
 *          assistive technology says. Each runtime's `BadgeProps` is this plus its HeroUI base's own props, which
 *          pass through unchanged.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7); ADR 0304; WCAG 2.2
 *          SC 1.1.1.
 */
import type { Tone } from "@stackra/contracts";
import type { ReactNode } from "react";

import type { BadgePlacement } from "#contracts/enums/badge-placement.enum";
import type { BadgeVariant } from "#contracts/enums/badge-variant.enum";
import type { Size } from "#contracts/enums/size.enum";

/** Props shared by the web and native `Badge`. */
export interface BadgeContractProps {
  /** The text, number or icon shown, already formatted (for example "99+"); without it the badge is a dot. */
  readonly children?: ReactNode;
  /** The colour role of the badge. Defaults to `default`. */
  readonly tone?: Tone | undefined;
  /** The fill: `primary` solid, `secondary` neutral with toned text, `soft` tinted. Defaults to `primary`. */
  readonly variant?: BadgeVariant | undefined;
  /** The minimum size and the text size. Defaults to `md`. */
  readonly size?: Size | undefined;
  /** The corner of the anchor, by reading direction; `top-end` is top right in English, top left in Arabic. */
  readonly placement?: BadgePlacement | undefined;
  /** What assistive technology says, for example "3 unread"; without it the badge is hidden from it. */
  readonly label?: string | undefined;
}
