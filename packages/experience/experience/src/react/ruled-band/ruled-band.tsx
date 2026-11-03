/**
 * Stackra file contract:
 * Purpose: `RuledBand`, the band every landing block but the header, the footer and the dock draws in: a
 *          @stackra/ui `BlueprintSection` (side rules and `+` marks) in the hero's padding, so the ruled column and the
 *          blocks' text edges run unbroken from the hero to the footer.
 * Boundary: internal to the `./react` entry; not exported. Inside another band it draws only its children (no second
 *           band, no id or name), so a block nested in another block keeps one column. Nothing moves.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0165 (UI through @stackra/ui); STA-2041 (taste v2 §1, design
 *                     pass §4).
 */
import { BlueprintSection } from "@stackra/ui/react";
import { type ReactNode, useContext } from "react";

import { RuledBandContext } from "#react/ruled-band/ruled-band.context";
import type { RuledBandProps } from "#react/ruled-band/ruled-band.props";

/** The landing's band padding: the hero's rhythm. */
const BAND = "px-4 py-16 sm:px-8 lg:px-12";

/**
 * A block's ruled band, drawn once however deep the block sits.
 *
 * @example
 * <RuledBand label={title}>{content}</RuledBand>
 */
export function RuledBand({ id, label, children, className }: RuledBandProps): ReactNode {
  const isInside = useContext(RuledBandContext);
  if (isInside) return children;
  return (
    <RuledBandContext.Provider value>
      <BlueprintSection id={id} label={label} className={className ?? BAND}>
        {children}
      </BlueprintSection>
    </RuledBandContext.Provider>
  );
}
