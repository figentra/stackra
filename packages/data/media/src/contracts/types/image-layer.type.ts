/**
 * Stackra file contract:
 * Purpose: `ImageLayer`, one image an `ImageTransformer` composites over the transformed base: a watermark, a
 *          personalisation (a name or a logo rendered to an image) or a frame.
 * Boundary: a type only. The layer is placed on the output image after the resize, at `left`/`top` pixels (both or
 *           neither) or at a `gravity`; it must fit inside the output. The layer's own metadata never reaches the
 *           output.
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (decision 3); STA-789 (server-side compositing); OS-142.
 */

/** One image composited over the transformed base. */
export interface ImageLayer {
  /** The layer image (PNG with transparency for a watermark). */
  readonly bytes: Uint8Array;

  /** Pixels from the output's left edge; given with `top`. */
  readonly left?: number;

  /** Pixels from the output's top edge; given with `left`. */
  readonly top?: number;

  /** Where the layer sits when `left` and `top` are absent; `center` by default. */
  readonly gravity?:
    | "center"
    | "north"
    | "northeast"
    | "east"
    | "southeast"
    | "south"
    | "southwest"
    | "west"
    | "northwest";
}
