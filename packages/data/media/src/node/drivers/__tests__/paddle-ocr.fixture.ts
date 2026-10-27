/**
 * Stackra file contract:
 * Purpose: `PADDLE_OCR_INVOICE`, a PaddleOCR 3.x serving reply to `POST /ocr` for a one-page Arabic tax invoice, in
 *          the shape the serving docs give (`errorCode`, `errorMsg`, `result.ocrResults[].prunedResult` with
 *          `rec_texts`, `rec_scores` and `rec_boxes`); the fixture the `paddle_ocr` driver tests replay.
 * Boundary: test data only. Written from the published serving docs, not captured from a live service: re-record it
 *           against the deployed service when the driver is certified (owner D3, certification pending).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0192; STA-789.
 */

/** The reply for the invoice scan: a right-to-left title row and a mixed number row. */
export const PADDLE_OCR_INVOICE = {
  logId: "6f0d3c1e-2b8a-4d6e-9a51-7c2f1e0b9d44",
  errorCode: 0,
  errorMsg: "Success",
  result: {
    ocrResults: [
      {
        prunedResult: {
          model_settings: { use_doc_preprocessor: false, use_textline_orientation: false },
          text_type: "general",
          rec_texts: ["ضريبية", "فاتورة", "الإجمالي", "1,150.00"],
          rec_scores: [0.991, 0.987, 0.975, 0.998],
          rec_boxes: [
            [310, 40, 420, 78],
            [440, 38, 560, 80],
            [400, 120, 540, 150],
            [220, 122, 330, 148],
          ],
        },
        ocrImage: null,
      },
    ],
    dataInfo: { width: 600, height: 800, type: "image" },
  },
} as const;
