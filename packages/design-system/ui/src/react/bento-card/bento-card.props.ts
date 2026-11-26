/**
 * Stackra file contract:
 * Purpose: `BentoCardProps`, the props of the web `BentoCard` in `bento-card.tsx`.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (one declaration per file); ADR 0302 (decision 3); STA-2041.
 */
import type { Theme } from "@stackra/tokens/contracts";
import type { ReactNode } from "react";

import type { DitherArtProps } from "#react/dither-art/dither-art.props";

/** Props of the web BentoCard. */
export interface BentoCardProps {
  /** The card's heading. */
  readonly title: string;
  /** The heading's level in the page outline. Defaults to 3. */
  readonly headingLevel?: 2 | 3 | 4 | undefined;
  /** One or two lines under the title. */
  readonly description?: ReactNode;
  /** Up to two pill links under the text; `primary` is filled, `ghost` (the default) is quiet. */
  readonly actions?:
    | readonly {
        readonly id: string;
        readonly label: string;
        readonly href: string;
        readonly variant?: "primary" | "ghost" | undefined;
      }[]
    | undefined;
  /** The live widget at the bottom of the card. */
  readonly media?: ReactNode;
  /** How the media meets the card's edge: `bottom` (the default) runs it to the bottom edge, `full` to every edge. */
  readonly mediaBleed?: "none" | "bottom" | "full" | undefined;
  /** Dithered art behind the media. */
  readonly art?: DitherArtProps | undefined;
  /** A product's theme: the card draws in that brand's tokens, as on the "Built on" strip. */
  readonly brand?: Theme | undefined;
  /** The columns the card spans in a two-column bento grid. Defaults to 1. */
  readonly span?: 1 | 2 | undefined;
  /** Styles the card. */
  readonly className?: string | undefined;
}
