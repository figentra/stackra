/**
 * Stackra file contract:
 * Purpose: unit tests of `DocumentTextExtractorDriver`: it reads a DOCX and a PDF (media type parameters and case
 *          ignored), reports the hints whose script it found, and refuses any other media type.
 * Boundary: test only; real fflate and unpdf over in-memory fixtures. No network.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0234; R3-SO-13; STA-789.
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";
import { strToU8, zipSync } from "fflate";

import { TextExtractor } from "#contracts/ports/text-extractor.port";
import { DocumentTextExtractorDriver } from "#node/drivers/document-text-extractor.driver";
import { pdf } from "#node/functions/__tests__/pdf.fixture";

const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const extractor = new DocumentTextExtractorDriver();

describe("DocumentTextExtractorDriver", () => {
  it("is a driver of TextExtractor", () => {
    expect(extractor).toBeInstanceOf(TextExtractor);
    expect(kindOf(DocumentTextExtractorDriver)).toEqual({
      kind: "driver",
      options: { port: TextExtractor },
    });
  });

  it("reads a DOCX and reports the scripts it found", async () => {
    const bytes = zipSync({
      "word/document.xml": strToU8(
        "<w:document><w:body><w:p><w:r><w:t>العقد</w:t></w:r></w:p><w:p><w:r><w:t>Contract</w:t></w:r></w:p></w:body></w:document>",
      ),
    });
    expect(await extractor.extract(bytes, DOCX, ["ar", "en"])).toEqual({
      text: "العقد\nContract",
      languages: ["ar", "en"],
    });
  });

  it("reads a PDF whatever the media type's case and parameters", async () => {
    expect(await extractor.extract(pdf(["Invoice"]), "Application/PDF; v=1", ["ar", "en"])).toEqual(
      {
        text: "Invoice",
        languages: ["en"],
      },
    );
  });

  it("refuses another media type", async () => {
    await expect(extractor.extract(new Uint8Array(1), "image/png", ["ar"])).rejects.toBeInstanceOf(
      RangeError,
    );
  });
});
