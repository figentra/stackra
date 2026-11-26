/**
 * Stackra file contract:
 * Purpose: `MonoDisplayArt`, what stands with the closing wordmark: floors that rise, a code-glyph field, or nothing.
 * Boundary: an `Enum.of` value plus the type of the same name; codes are snake_case and never shown as words.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0231 (snake_case codes); STA-2041.
 */
import { Enum } from "@stackra/contracts";

/** The art of the mono display. */
export const MonoDisplayArt = Enum.of({
  /** Three floors under the wordmark that rise in floor steps. */
  Floors: "floors",
  /** A code-glyph dither field behind the wordmark; it needs a poster. */
  Glyphs: "glyphs",
  /** No art. */
  None: "none",
});

/** One of the codes above. */
export type MonoDisplayArt = Enum.Value<typeof MonoDisplayArt>;
