/**
 * Stackra file contract:
 * Purpose: `ImageAsset`, an image a template places (a logo, a stamp, a drawn signature): its media type and bytes.
 * Boundary: a type only. PNG and JPEG only, the two that HTML, every PDF engine and DOCX all embed; the bytes are
 *           inlined, so a render never fetches a URL.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decisions 2 and 4).
 */

/** An inline image. */
export interface ImageAsset {
  /** `image/png` or `image/jpeg`. */
  readonly mediaType: "image/png" | "image/jpeg";

  /** The encoded image. */
  readonly bytes: Uint8Array;
}
