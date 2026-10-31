/**
 * Stackra file contract:
 * Purpose: `XlsxWriterDriver`, the `xlsx` driver of `TabularWriter`: a multi-sheet workbook streamed through the
 *          package's `writeZip`, each row deflated as it is written (STA-1736: exceljs is gone).
 * Boundary: node only. Cells keep their types (a number, a boolean, a date cell); text is never a formula, so no guard
 *           is needed. `options` is ignored. A failure while writing rejects the byte stream.
 * Runtime: node
 * Governing contract: ADR 0367 (decision 2); ADR 0294 (decisions 16 and 25).
 */
import { Driver } from "@stackra/container";

import { TabularWriter } from "#contracts/ports/tabular-writer.port";
import type { TabularSheet } from "#contracts/types/tabular-sheet.type";
import { writeZip } from "#core/functions/write-zip.function";
import { rowXml } from "#node/functions/row-xml.function";
import { workbookParts } from "#node/functions/workbook-parts.function";

const SHEET_HEAD =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
  '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>';
const SHEET_TAIL = "</sheetData></worksheet>";

/** The entries' timestamp: fixed, so the same rows give the same bytes. */
const STAMP = new Date(Date.UTC(1980, 0, 1));

/**
 * One sheet part's bytes, row by row.
 *
 * @yields The XML, encoded.
 */
async function* sheetXml(sheet: TabularSheet): AsyncGenerator<Uint8Array> {
  const encoder = new TextEncoder();
  yield encoder.encode(SHEET_HEAD);
  let row = 0;
  for await (const cells of sheet.rows) yield encoder.encode(rowXml(++row, cells));
  yield encoder.encode(SHEET_TAIL);
}

/**
 * Writes XLSX workbooks.
 *
 * @example
 * const bytes = new XlsxWriterDriver().write([{ name: "Orders", rows: orders }, { name: "Lines", rows: lines }]);
 */
export class XlsxWriterDriver extends Driver(TabularWriter) {
  /** The OOXML spreadsheet media type. */
  readonly mediaType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  /**
   * Implements `TabularWriter.write`, documented there.
   *
   * @yields The workbook bytes, chunk by chunk.
   */
  async *write(sheets: readonly TabularSheet[]): AsyncGenerator<Uint8Array> {
    const encoder = new TextEncoder();
    const parts = Object.entries(workbookParts(sheets.map((sheet) => sheet.name))).map(
      ([name, xml]) => ({ name, bytes: [encoder.encode(xml)] }),
    );
    const sheetParts = sheets.map((sheet, index) => ({
      name: `xl/worksheets/sheet${index + 1}.xml`,
      bytes: sheetXml(sheet),
    }));
    yield* writeZip([...parts, ...sheetParts], STAMP);
  }
}
