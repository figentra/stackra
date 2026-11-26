/**
 * Stackra file contract:
 * Purpose: `contentMatches`, whether a file's first bytes carry the signature of the media type it claims, so a bucket
 *          accepts what the bytes are, not what the upload says they are (an SVG or a script renamed `logo.png` is
 *          refused).
 * Boundary: pure; reads only the head it is given. JPEG `FF D8 FF`, PNG's eight-byte signature, GIF `GIF87a` or
 *           `GIF89a`, WebP `RIFF….WEBP`, PDF `%PDF-`, and the ISO base media `ftyp` box for AVIF (an `avif` or `avis`
 *           brand, major or compatible) and MP4 (any other brand).
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (decision 2: uploads); STA-2644 (tenant branding: content-checked images).
 */
import { MediaType } from "#core/enums/media-type.enum";

/** The ASCII of `text` as bytes. */
const ascii = (text: string): number[] =>
  [...text].map((character) => character.codePointAt(0) ?? 0);

/** Whether `head` holds `bytes` at `at`. */
const has = (head: Uint8Array, at: number, bytes: readonly number[]): boolean =>
  bytes.every((byte, index) => head[at + index] === byte);

/** The brands of the `ftyp` box `head` opens with (major first), or none when it opens with another box. */
function brandsOf(head: Uint8Array): string[] {
  if (!has(head, 4, ascii("ftyp"))) return [];
  const size =
    ((head[0] ?? 0) << 24) | ((head[1] ?? 0) << 16) | ((head[2] ?? 0) << 8) | (head[3] ?? 0);
  const end = Math.min(size, head.length);
  const brands = [String.fromCodePoint(...head.subarray(8, 12))];
  // the compatible brands follow the major brand and its four-byte minor version
  for (let at = 16; at + 4 <= end; at += 4)
    brands.push(String.fromCodePoint(...head.subarray(at, at + 4)));
  return brands;
}

/** Whether a brand list is an AVIF image's. */
const isAvif = (brands: readonly string[]): boolean =>
  brands.some((brand) => brand === "avif" || brand === "avis");

/**
 * Whether `head` (the file's first bytes; 64 are enough) is a `type` file.
 *
 * @example
 * if (!contentMatches(head, MediaType.Png)) throw UploadRejectedError.create({ bucket, reason: "content" });
 */
export function contentMatches(head: Uint8Array, type: MediaType): boolean {
  switch (type) {
    case MediaType.Jpeg: {
      return has(head, 0, [0xff, 0xd8, 0xff]);
    }
    case MediaType.Png: {
      return has(head, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    }
    case MediaType.Gif: {
      return has(head, 0, ascii("GIF87a")) || has(head, 0, ascii("GIF89a"));
    }
    case MediaType.Webp: {
      return has(head, 0, ascii("RIFF")) && has(head, 8, ascii("WEBP"));
    }
    case MediaType.Pdf: {
      return has(head, 0, ascii("%PDF-"));
    }
    case MediaType.Avif: {
      return isAvif(brandsOf(head));
    }
    case MediaType.Mp4: {
      const brands = brandsOf(head);
      return brands.length > 0 && !isAvif(brands);
    }
  }
}
