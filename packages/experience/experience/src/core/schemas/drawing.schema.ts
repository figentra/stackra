/**
 * Stackra file contract:
 * Purpose: `Drawing`, a landing drawing for `@stackra/ui`'s `Illustration`: the root-relative base URL of its four
 *          tone layers (`/art/engine`), its viewBox size for the aspect ratio, and `alt`, without which it is
 *          decorative.
 * Boundary: a shape class only, the field type of the landing blocks; gen compiles it with them. A drawing is never
 *           mirrored in right-to-left.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4 and 26); ADR 0305 (one declaration per file); STA-2041.
 */
import type { LocalizedText } from "@stackra/contracts";
import { Int, Schema } from "@stackra/validation";

/** A drawing in tone layers. */
export class Drawing extends Schema {
  /** The viewBox width. */
  @Int({ min: 1 })
  width!: number;

  /** The viewBox height. */
  @Int({ min: 1 })
  height!: number;

  /** The base URL of the tone layers, `<src>.<tone>.svg`. */
  src!: string;

  alt?: LocalizedText;
}
