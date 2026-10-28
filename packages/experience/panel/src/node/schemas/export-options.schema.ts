/**
 * Stackra file contract:
 * Purpose: `ExportOptions`, the options of the queued export: rows per list page, the row cap of a file (and of a PDF),
 *          the disk folder and the PDF page.
 * Boundary: a shape class over the shipped `EXPORT_CONFIG_SCHEMA`, read through `ExportConfig`.
 * Runtime: isomorphic
 * Governing contract: ADR 0363; ADR 0294 (decisions 19 and 20); ADR 0307 (rule 10).
 */
import type { PdfPage } from "@stackra/documents/contracts";
import { Field, Int, registerSchemas, Schema, Str } from "@stackra/validation";

import { EXPORT_CONFIG_SCHEMA } from "#node/constants/export-config-schema.constant";

/** What the export reads from configuration. */
export class ExportOptions extends Schema {
  /** Rows read per list page; at most 5000. */
  @Int({
    min: 1,
    max: 5000,
  })
  pageSize = 500;

  /** The most data rows one export file holds; the rest is left out and the output says so. */
  @Int({ min: 1 })
  maxRows = 100_000;

  /** The disk folder export files are written under. */
  @Str({ min: 1 })
  folder = "exports";

  /** The page a PDF table is printed on (A4 landscape by default). */
  // reason: a nested object with no shape class; the package's own shipped schema says it
  @Field(EXPORT_CONFIG_SCHEMA.shape.pdfPage.unwrap())
  pdfPage: PdfPage = { widthMm: 297, heightMm: 210, marginMm: 10 };

  /** The most data rows a PDF holds, as it is printed whole. */
  @Int({ min: 1 })
  pdfMaxRows = 5000;
}

registerSchemas([[ExportOptions, EXPORT_CONFIG_SCHEMA]]);
