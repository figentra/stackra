/**
 * Stackra file contract:
 * Purpose: `SchemePoster`, a dither band's poster per colour scheme: what the edge render, a page without script and
 *          print show under the canvas until it draws.
 * Boundary: a shape class only, the field type of the landing blocks; gen compiles it with them. Each value is a
 *           root-relative URL (`/posters/strata-dark.png`).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0305 (one declaration per file); STA-2041.
 */
import { Schema } from "@stackra/validation";

/** One poster per scheme. */
export class SchemePoster extends Schema {
  light!: string;

  dark!: string;
}
