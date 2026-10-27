/**
 * Stackra file contract:
 * Purpose: unit tests of `PaddleOcrTextExtractorDriver`: the request it posts (base64 file, fileType, endpoint), the
 *          recorded Arabic reply read in logical order with the languages found, and every refusal (media type, size,
 *          a language the service does not read, a service error).
 * Boundary: test only; `fetch` is stubbed with the recorded fixture, so no request leaves the process.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0192; R3-SO-13; STA-789.
 */
import { buildConfig } from "@stackra/config";
import { kindOf } from "@stackra/container";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { MediaConfig } from "#config/media.config";
import { TextExtractor } from "#contracts/ports/text-extractor.port";
import { PADDLE_OCR_INVOICE } from "#node/drivers/__tests__/paddle-ocr.fixture";
import { PaddleOcrTextExtractorDriver } from "#node/drivers/paddle-ocr-text-extractor.driver";

const ENDPOINT = "http://ocr.ksa.internal/ocr";

/** The driver against the in-region service, reading at most `maxBytes`. */
function extractor(maxBytes = 1024): PaddleOcrTextExtractorDriver {
  return new PaddleOcrTextExtractorDriver(
    buildConfig(MediaConfig, {
      values: { ocr: { endpoint: ENDPOINT, languages: ["ar", "en"], maxBytes, timeoutMs: 5_000 } },
    }),
  );
}

/** Stubs `fetch` to answer `body` with `status`. */
function serve(body: unknown, status = 200) {
  const fetch = vi.fn(async () => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PaddleOcrTextExtractorDriver", () => {
  it("is a driver of TextExtractor", () => {
    expect(extractor()).toBeInstanceOf(TextExtractor);
    expect(kindOf(PaddleOcrTextExtractorDriver)).toEqual({
      kind: "driver",
      options: { port: TextExtractor },
    });
  });

  it("posts the scan to the in-region service and reads it in logical order", async () => {
    const fetch = serve(PADDLE_OCR_INVOICE);
    const result = await extractor().extract(new Uint8Array([1, 2, 3]), "image/JPEG", ["ar", "en"]);
    expect(result).toEqual({ text: "فاتورة ضريبية\nالإجمالي 1,150.00", languages: ["ar"] });
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(ENDPOINT);
    expect(JSON.parse(init.body as string)).toEqual({
      file: "AQID",
      fileType: 1,
      visualize: false,
    });
  });

  it("sends a PDF as fileType 0", async () => {
    const fetch = serve(PADDLE_OCR_INVOICE);
    await extractor().extract(new Uint8Array(1), "application/pdf", ["ar"]);
    const [, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toMatchObject({ fileType: 0 });
  });

  it("refuses what the service does not read, without calling it", async () => {
    const fetch = serve(PADDLE_OCR_INVOICE);
    const bytes = new Uint8Array(1);
    await expect(extractor().extract(bytes, "text/plain", ["ar"])).rejects.toBeInstanceOf(
      RangeError,
    );
    await expect(extractor(0).extract(bytes, "image/png", ["ar"])).rejects.toBeInstanceOf(
      RangeError,
    );
    await expect(extractor().extract(bytes, "image/png", ["ar", "zh"])).rejects.toThrow(/zh/);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("throws the service's error", async () => {
    serve({ logId: "x", errorCode: 500, errorMsg: "Internal Server Error" }, 500);
    await expect(extractor().extract(new Uint8Array(1), "image/png", ["ar"])).rejects.toThrow(
      /Internal Server Error/,
    );
  });
});
