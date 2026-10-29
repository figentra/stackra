/**
 * Stackra file contract:
 * Purpose: unit tests of `exportWriter`: each format gets its writer (CSV, JSON Lines, XLSX, PDF over the engine), and
 *          a PDF without a bound engine is refused.
 * Boundary: test only; no file is written.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rule 10).
 */
import { CsvWriterDriver, JsonLinesWriterDriver } from "@stackra/data-transfer";
import { XlsxWriterDriver } from "@stackra/data-transfer/node";
import { PdfTableWriter } from "@stackra/documents";
import type { PdfEngine } from "@stackra/documents/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ExportFormat } from "#core/enums/export-format.enum";
import { exportWriter } from "#node/functions/export-writer.function";

const page = { widthMm: 297, heightMm: 210, marginMm: 10 };
const engine = { print: async () => new Uint8Array() } as unknown as PdfEngine;

describe("exportWriter", () => {
  it("picks the writer of each format", () => {
    const pdf = { engine, page, maxRows: 10 };
    expect(exportWriter(ExportFormat.Csv, pdf)).toBeInstanceOf(CsvWriterDriver);
    expect(exportWriter(ExportFormat.JsonLines, pdf)).toBeInstanceOf(JsonLinesWriterDriver);
    expect(exportWriter(ExportFormat.Xlsx, pdf)).toBeInstanceOf(XlsxWriterDriver);
    expect(exportWriter(ExportFormat.Pdf, pdf)).toBeInstanceOf(PdfTableWriter);
  });

  it("refuses a PDF without an engine", () => {
    expect(() => exportWriter(ExportFormat.Pdf, { engine: undefined, page, maxRows: 10 })).toThrow(
      TypeError,
    );
  });
});
