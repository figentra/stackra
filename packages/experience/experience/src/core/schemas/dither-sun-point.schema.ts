/**
 * Stackra file contract:
 * Purpose: `DitherSunPoint`, where a dither band's core glow (the sun) sits, as fractions of the band's width and
 *          height (`@stackra/ui`'s `DitherSun`).
 * Boundary: a shape class only, the field type of the landing blocks; gen compiles it with them. A fraction may run
 *           past either edge.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4 and 26); ADR 0305 (one declaration per file); STA-2041.
 */
import { Num, Schema } from "@stackra/validation";

/** The centre of the core glow. */
export class DitherSunPoint extends Schema {
  /** 0 at the left edge, 1 at the right. */
  @Num
  x!: number;

  /** 0 at the top, 1 at the bottom. */
  @Num
  y!: number;
}
