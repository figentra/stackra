/**
 * Stackra file contract:
 * Purpose: the `document` driver of `TextExtractor`: reads the text of a DOCX (`docxText`) or the text layer of a PDF
 *          (`pdfText`) in process, so a privileged file (a Juristra contract) never leaves the region the service runs
 *          in.
 * Boundary: no network, no provider, no credential. Any other media type is a `RangeError`; a scanned PDF gives empty
 *           text, for the caller to send to an OCR driver. Language hints never make it refuse, since a text layer
 *           reads in every language; the languages it reports are the hints whose script is in the text.
 * Runtime: node
 * Governing contract: ADR 0234; R3-SO-13 (TextExtractor DOCX and PDF in region); ADR 0294 (decision 16); STA-789.
 */
import { Driver } from "@stackra/container";

import { TextExtractor } from "#contracts/ports/text-extractor.port";
import type { ExtractedText } from "#contracts/types/extracted-text.type";
import { docxText } from "#node/functions/docx-text.function";
import { languagesIn } from "#node/functions/languages-in.function";
import { pdfText } from "#node/functions/pdf-text.function";

/** The DOCX media type. */
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/**
 * Extracts the text of DOCX and PDF files in process.
 *
 * @example
 * const { text, languages } = await extractor.extract(bytes, "application/pdf", ["ar", "en"]);
 */
export class DocumentTextExtractorDriver extends Driver(TextExtractor) {
  /**
   * The text of a DOCX or PDF.
   *
   * @throws RangeError when `contentType` is neither, or the file cannot be opened.
   */
  async extract(
    bytes: Uint8Array,
    contentType: string,
    languages: readonly string[],
  ): Promise<ExtractedText> {
    const type = contentType.split(";")[0]?.trim().toLowerCase();
    let text: string;
    if (type === "application/pdf") text = await pdfText(bytes);
    else if (type === DOCX) text = docxText(bytes);
    else throw new RangeError(`The document text extractor does not read ${contentType}`);
    return { text, languages: languagesIn(text, languages) };
  }
}
