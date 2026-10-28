/**
 * Stackra file contract:
 * Purpose: `exportWriter`, the `TabularWriter` of an export format: CSV and JSON Lines from data-transfer's core, XLSX
 *          from its node entry, PDF from documents' table writer over the bound `PdfEngine`.
 * Boundary: internal. Builds a fresh writer per export; the PDF writer takes the configured page and row cap.
 * Runtime: node
 * Governing contract: ADR 0307 (rule 10); ADR 0367; ADR 0431 (XLSX on node); reporting gap 11.
 */
import { CsvWriterDriver, JsonLinesWriterDriver } from "@stackra/data-transfer";
import type { TabularWriter } from "@stackra/data-transfer/contracts";
import { XlsxWriterDriver } from "@stackra/data-transfer/node";
import { PdfTableWriterDriver } from "@stackra/documents";
import type { PdfEngine, PdfPage } from "@stackra/documents/contracts";

import { ExportFormat } from "#core/enums/export-format.enum";

/**
 * The writer of `format`.
 *
 * @throws TypeError when `format` is PDF and no `PdfEngine` is bound.
 * @example
 * const writer = exportWriter(ExportFormat.Csv, { engine: undefined, page, maxRows: 5000 });
 */
export function exportWriter(
  format: ExportFormat,
  pdf: { readonly engine: PdfEngine | undefined; readonly page: PdfPage; readonly maxRows: number },
): TabularWriter {
  switch (format) {
    case ExportFormat.Csv: {
      return new CsvWriterDriver();
    }
    case ExportFormat.JsonLines: {
      return new JsonLinesWriterDriver();
    }
    case ExportFormat.Xlsx: {
      return new XlsxWriterDriver();
    }
    case ExportFormat.Pdf: {
      if (pdf.engine === undefined)
        throw new TypeError("A PDF export needs a bound PdfEngine (documents' gotenberg driver)");
      return new PdfTableWriterDriver(pdf.engine, pdf.page, pdf.maxRows);
    }
  }
}
