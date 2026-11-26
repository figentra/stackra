/**
 * Stackra file contract:
 * Purpose: `RuledBandContext`, whether a landing block already sits inside a ruled band, so a block nested in another
 *          (a statement in the bento grid, the CTA row in the hero) draws no second band.
 * Boundary: internal to the `./react` entry; `RuledBand` provides and reads it. Not exported.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); STA-2041 (taste v2 §1: one ruled column).
 */
import { createContext } from "react";

/** True inside a ruled band. */
export const RuledBandContext = createContext(false);
