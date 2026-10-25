/**
 * Stackra file contract:
 * Purpose: the `TextExtractor` port: OCR and text extraction from an uploaded document or image, Arabic included, for
 *          search, the agent's context and data entry.
 * Boundary: an abstract class that is its own token, keyed `media.TextExtractor`. `languages` is the list of BCP 47
 *           hints the caller takes from the tenant's language settings; a driver that cannot read one of them refuses
 *           rather than returning garbled text. Which OCR provider runs is a driver choice in config, never code.
 * Runtime: isomorphic
 * Governing contract: ADR 0222; ADR 0192; ADR 0294 (decisions 4 and 16); OS-150, OS-154.
 */
import { Port } from "@stackra/contracts";

import type { ExtractedText } from "#contracts/types/extracted-text.type";

/**
 * Reads the text out of a file.
 *
 * @example
 * const { text } = await extractor.extract(bytes, "application/pdf", ["ar", "en"]);
 */
export abstract class TextExtractor extends Port {
  /** Type-only port key, so `DriverName<TextExtractor>` narrows to this port's drivers. */
  declare readonly "~key": "media.TextExtractor";

  /**
   * The text of `bytes`.
   *
   * @param bytes - the file.
   * @param contentType - its media type (`application/pdf`, `image/jpeg`).
   * @param languages - the BCP 47 languages to read, most likely first.
   * @throws RangeError when the driver cannot read `contentType` or one of `languages`.
   */
  abstract extract(
    bytes: Uint8Array,
    contentType: string,
    languages: readonly string[],
  ): Promise<ExtractedText>;
}
