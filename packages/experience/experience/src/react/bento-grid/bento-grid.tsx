/**
 * Stackra file contract:
 * Purpose: `BentoGrid`, the landing kit's bento grid: one or two equal columns of cards from `md` up, one column
 *          below it, with the kit's `lg` gap, in its ruled band.
 * Boundary: composition of @stackra/ui's `Grid` only; the cards are the caller's, and a landing block among them draws
 *           in the grid's band, not one of its own. Cells fill in reading order, so the grid mirrors in right-to-left.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0165 (UI through @stackra/ui); ADR 0060 (light, dark, RTL);
 *          STA-2041 (taste v2 §1).
 */
import { Grid } from "@stackra/ui/react";
import type { ReactElement } from "react";

import type { BentoGridProps } from "#react/bento-grid/bento-grid.props";
import { RuledBand } from "#react/ruled-band/ruled-band";

/**
 * A grid of bento cards.
 *
 * @example
 * <BentoGrid columns={2}>{cards}</BentoGrid>
 */
export function BentoGrid({ columns = 2, children, className }: BentoGridProps): ReactElement {
  return (
    <RuledBand>
      <Grid
        columns={columns}
        gap="lg"
        // Grid writes its columns inline; a two-column bento stacks under `md`, so that rule must outrank the inline one.
        className={[columns === 2 ? "max-md:grid-cols-1!" : "", className]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </Grid>
    </RuledBand>
  );
}
