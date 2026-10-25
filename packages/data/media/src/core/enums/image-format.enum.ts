/**
 * Stackra file contract:
 * Purpose: `ImageFormat`, the formats an image variant can be delivered in (`useImageVariant`, a bucket's `variants`).
 * Boundary: a closed set; the code is the `format` value of a variant URL.
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (decision 4: image variants); ADR 0128 (`Enum.of`, no `enum`).
 */
import { Enum } from "@stackra/contracts";

/** A variant's delivery format. */
export const ImageFormat = Enum.of({
  /** WebP: every current browser; the default choice for the web. */
  Webp: "webp",
  /** AVIF: smaller than WebP where it is supported. */
  Avif: "avif",
  /** JPEG: the fallback for photographs. */
  Jpeg: "jpeg",
  /** PNG: lossless, for images with transparency or text. */
  Png: "png",
});

/** One of the `ImageFormat` codes. */
export type ImageFormat = Enum.Value<typeof ImageFormat>;
