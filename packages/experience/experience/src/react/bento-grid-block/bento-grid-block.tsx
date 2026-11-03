/**
 * Stackra file contract:
 * Purpose: `BentoGridBlock`, the landing kit's bento grid: one or two equal columns of cards from `md` up, one column
 *          below it, with the kit's `lg` gap.
 * Boundary: composition of @stackra/ui's `Grid` only; the cards are the caller's. Cells fill in reading order, so the
 *           grid mirrors in right-to-left.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0165 (UI through @stackra/ui); ADR 0060 (light, dark, RTL);
 *          STA-2041.
 */
import { Grid } from "@stackra/ui/react";
import type { ReactElement } from "react";

import type { BentoGridBlockProps } from "#react/bento-grid-block/bento-grid-block.props";

/**
 * A grid of bento cards.
 *
 * @example
 * <BentoGridBlock columns={2}>{cards}</BentoGridBlock>
 */
export function BentoGridBlock({
  columns = 2,
  children,
  className,
}: BentoGridBlockProps): ReactElement {
  return (
    <Grid
      columns={columns}
      gap="lg"
      // Grid writes its columns inline; a two-column bento stacks under `md`, so that rule must outrank the inline one.
      className={[columns === 2 ? "max-md:grid-cols-1!" : "", className].filter(Boolean).join(" ")}
    >
      {children}
    </Grid>
  );
}
