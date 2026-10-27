/**
 * Stackra file contract:
 * Purpose: the `paddle_ocr` driver of `TextExtractor`: OCR with Arabic for scanned pages and photos, through the
 *          self-hosted PaddleOCR service (PP-OCRv5 with the Arabic recognition model) the platform runs in each
 *          region. It posts the file to the service's `POST /ocr` and puts the recognised boxes in logical reading
 *          order (`ocrLines`).
 * Boundary: the bytes go to `media.ocr.endpoint` only, which runway sets per region to the service in that region
 *           (R3-SO-13); nothing goes to a third party. Images (fileType 1) and PDFs (fileType 0) are sent; any other
 *           media type, a file over `media.ocr.maxBytes` or a language hint outside `media.ocr.languages` is a
 *           `RangeError`, so a page is never read with a model that would garble it. A service error or timeout throws
 *           `Error` with the service's message, never the file. Built from the PaddleOCR 3.x serving docs with
 *           recorded-fixture tests; certification pending (owner D3, 2026-10-27).
 * Runtime: node
 * Governing contract: ADR 0192 (Arabic defaults); ADR 0222; R2-5, M7 (self-hosted OCR default); R3-SO-13; STA-789.
 */
import { Driver } from "@stackra/container";

import type { MediaConfig } from "#config/media.config";
import { TextExtractor } from "#contracts/ports/text-extractor.port";
import type { ExtractedText } from "#contracts/types/extracted-text.type";
import { languagesIn } from "#node/functions/languages-in.function";
import { ocrLines } from "#node/functions/ocr-lines.function";
import type { OcrBox } from "#node/types/ocr-box.type";

/** The part of a PaddleOCR serving reply this driver reads. */
interface PaddleOcrReply {
  readonly errorCode: number;
  readonly errorMsg: string;
  readonly result?: {
    readonly ocrResults: readonly {
      readonly prunedResult: {
        readonly rec_texts?: readonly string[];
        readonly rec_boxes?: readonly OcrBox[];
      };
    }[];
  };
}

/** The serving `fileType` of a media type: 0 for a PDF, 1 for an image, `undefined` for anything else. */
function fileTypeOf(type: string): 0 | 1 | undefined {
  if (type === "application/pdf") return 0;
  if (type.startsWith("image/")) return 1;
  return undefined;
}

/**
 * Reads scanned pages and photos with the in-region PaddleOCR service.
 *
 * @example
 * // runway.yaml (ksa): config.media: { ocr: { endpoint: http://ocr.ksa.internal/ocr, languages: [ar, en] } }
 * const { text } = await extractor.extract(scan, "image/jpeg", ["ar", "en"]);
 */
export class PaddleOcrTextExtractorDriver extends Driver(TextExtractor) {
  private readonly ocr: MediaConfig["ocr"];

  /**
   * @param config - the service endpoint, its languages, the size limit and the timeout (`ocr`).
   */
  constructor(config: MediaConfig) {
    super();
    this.ocr = config.ocr;
  }

  /**
   * The text the service recognises, page by page.
   *
   * @throws RangeError when the media type, the size or a language is outside what the service reads.
   * @throws Error when the service answers with an error or not in time.
   */
  async extract(
    bytes: Uint8Array,
    contentType: string,
    languages: readonly string[],
  ): Promise<ExtractedText> {
    const fileType = fileTypeOf(contentType.split(";")[0]?.trim().toLowerCase() ?? "");
    if (fileType === undefined)
      throw new RangeError(`The PaddleOCR text extractor does not read ${contentType}`);
    if (bytes.length > this.ocr.maxBytes)
      throw new RangeError(`The file is larger than ${this.ocr.maxBytes} bytes`);
    const unread = languages.filter((language) => !this.ocr.languages.includes(language));
    if (unread.length > 0)
      throw new RangeError(`The OCR service does not read ${unread.join(", ")}`);

    const response = await fetch(this.ocr.endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        file: Buffer.from(bytes).toString("base64"),
        fileType,
        visualize: false,
      }),
      signal: AbortSignal.timeout(this.ocr.timeoutMs),
    });
    const reply = (await response.json().catch(() => undefined)) as PaddleOcrReply | undefined;
    if (!response.ok || reply === undefined || reply.errorCode !== 0 || reply.result === undefined)
      throw new Error(`The OCR service refused the file: ${reply?.errorMsg ?? response.status}`);

    const text = reply.result.ocrResults
      .map(({ prunedResult }) => ocrLines(prunedResult.rec_texts ?? [], prunedResult.rec_boxes))
      .filter((page) => page !== "")
      .join("\n\n");
    return { text, languages: languagesIn(text, languages) };
  }
}
