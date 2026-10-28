/**
 * Stackra file contract:
 * Purpose: `pdfText`, the text layer of a PDF, page after page, read with unpdf (Mozilla pdf.js built for servers).
 * Boundary: in process, no network and no worker thread. A scanned PDF has no text layer and gives `""`; reading its
 *           pixels is OCR, a separate `TextExtractor` driver (stackra-26). An encrypted or broken PDF is a
 *           `RangeError`. pdf.js turns right-to-left runs back into logical order.
 * Runtime: node
 * Governing contract: ADR 0234; R3-SO-13 (PDF extraction in region); STA-789.
 */
import { extractText } from "unpdf";

/**
 * The text layer of a PDF, pages separated by a line break.
 *
 * @example
 * await pdfText(bytes); // "Invoice 1042\n…"
 * @throws RangeError when pdf.js cannot open `bytes` (not a PDF, encrypted, broken).
 */
export async function pdfText(bytes: Uint8Array): Promise<string> {
  try {
    // pdf.js takes ownership of the buffer it is given, so it gets a copy.
    const { text } = await extractText(new Uint8Array(bytes), { mergePages: false });
    return text
      .map((page) => page.trim())
      .filter((page) => page !== "")
      .join("\n");
  } catch (error) {
    throw new RangeError(
      `Not a readable PDF: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
}
