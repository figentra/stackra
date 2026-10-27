/**
 * Stackra file contract:
 * Purpose: `XlsxWriterDriver`, the `xlsx` driver of `TabularWriter`: a multi-sheet workbook written through the exceljs
 *          streaming writer, each row committed as it is written.
 * Boundary: node only. Cells keep their types (a number, a boolean, a date cell); text is never a formula, so no guard
 *           is needed. `options` is ignored. A failure while writing rejects the byte stream.
 * Runtime: node
 * Governing contract: ADR 0367 (decision 2); ADR 0294 (decisions 16 and 25).
 */
import { PassThrough } from "node:stream";

import { Driver } from "@stackra/container";

import { TabularWriter } from "#contracts/ports/tabular-writer.port";
import type { TabularSheet } from "#contracts/types/tabular-sheet.type";
import { EXCELJS } from "#node/constants/exceljs.constant";

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
    const output = new PassThrough();
    const workbook = new EXCELJS.stream.xlsx.WorkbookWriter({
      stream: output,
      useSharedStrings: false,
      useStyles: true,
    });
    const writing = (async () => {
      for (const sheet of sheets) {
        const worksheet = workbook.addWorksheet(sheet.name);
        for await (const row of sheet.rows) worksheet.addRow([...row]).commit();
        worksheet.commit();
      }
      await workbook.commit();
    })();
    writing.catch((error: unknown) =>
      output.destroy(error instanceof Error ? error : new Error(String(error))),
    );
    for await (const chunk of output) yield chunk as Uint8Array;
    await writing;
  }
}
