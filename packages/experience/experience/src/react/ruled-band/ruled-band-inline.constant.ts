/**
 * Stackra file contract:
 * Purpose: `RULED_BAND_INLINE`, the landing's inline band padding (the hero's rhythm), so every band's text edge sits
 *          on the same line of the ruled column.
 * Boundary: internal to the `./react` entry; `RuledBand` composes it into its band padding, and the hero, whose
 *           horizon runs full bleed, puts it on its own text grid. Not exported.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0305 (one declaration per file); STA-2041 (design pass §4).
 */

/** The band's inline padding at each breakpoint. */
export const RULED_BAND_INLINE = "px-4 sm:px-8 lg:px-12";
