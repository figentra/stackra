/**
 * Stackra file contract:
 * Purpose: `MediaType`, the media types a bucket may accept: the common web image formats, PDF and MP4.
 * Boundary: a closed set whose codes are the IANA media types themselves (a tool-owned spelling), so a code is what a
 *           browser reports as `File.type` and what the store keeps as the content type. The file extension of a
 *           stored file is the subtype (`image/jpeg` is `.jpeg`). SVG is left out on purpose: a public SVG can run
 *           script in the reader's browser.
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (decision 2: uploads); ADR 0128 (`Enum.of`, no `enum`).
 */
import { Enum } from "@stackra/contracts";

/** An accepted media type. */
export const MediaType = Enum.of({
  /** A JPEG photograph. */
  Jpeg: "image/jpeg",
  /** A PNG image. */
  Png: "image/png",
  /** A WebP image. */
  Webp: "image/webp",
  /** An AVIF image. */
  Avif: "image/avif",
  /** A GIF image. */
  Gif: "image/gif",
  /** A PDF document. */
  Pdf: "application/pdf",
  /** An MP4 video. */
  Mp4: "video/mp4",
});

/** One of the `MediaType` codes. */
export type MediaType = Enum.Value<typeof MediaType>;
