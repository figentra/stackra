/**
 * Stackra file contract:
 * Purpose: `Drawing`, a landing drawing for `@stackra/ui`'s `Illustration`: the root-relative base URL of its four
 *          tone layers (`/art/engine`), its viewBox size for the aspect ratio, and `alt`, without which it is
 *          decorative.
 * Boundary: a type only, the field type of the landing blocks. A drawing is never mirrored in right-to-left.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-2041.
 */
import type { LocalizedText } from "@stackra/contracts";

/** A drawing in tone layers. */
export interface Drawing {
  /** The viewBox width, a whole number of at least 1. */
  readonly width: number;

  /** The viewBox height, a whole number of at least 1. */
  readonly height: number;

  /** The base URL of the tone layers, `<src>.<tone>.svg`. */
  readonly src: string;

  /** What the drawing shows; the drawing is decorative when absent. */
  readonly alt?: LocalizedText;
}
