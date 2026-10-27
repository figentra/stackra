/**
 * Stackra file contract:
 * Purpose: `XlsxReaderDriver`, the `xlsx` driver of `TabularReader`: streams every sheet of a workbook (or the chosen
 *          ones) through the exceljs streaming reader, each cell as text.
 * Boundary: node only (exceljs reads a Node stream and may spill sheets that arrive before the shared strings to a
 *           temporary file). Empty rows are not yielded, so row numbers can skip. A skipped sheet is still drained,
 *           because the zip is read in order. Dates are read through the styles, so a date cell yields ISO 8601.
 * Runtime: node
 * Governing contract: ADR 0367 (decisions 2 and 4); ADR 0294 (decisions 16 and 25).
 */
import { Readable } from "node:stream";

import { Driver } from "@stackra/container";

import { TabularReader } from "#contracts/ports/tabular-reader.port";
import type { TabularReadOptions } from "#contracts/types/tabular-read-options.type";
import type { TabularRow } from "#contracts/types/tabular-row.type";
import type { TabularSource } from "#contracts/types/tabular-source.type";
import { TransferLimitExceededError } from "#core/errors/transfer-limit-exceeded.error";
import { limitBytes } from "#core/functions/limit-bytes.function";
import { EXCELJS } from "#node/constants/exceljs.constant";
import { cellText } from "#node/functions/cell-text.function";

/**
 * Reads XLSX workbooks.
 *
 * @example
 * for await (const row of new XlsxReaderDriver().read(upload, { sheets: ["Products"] })) { ... }
 */
export class XlsxReaderDriver extends Driver(TabularReader) {
  /**
   * Implements `TabularReader.read`, documented there.
   *
   * @yields One row at a time.
   */
  async *read(source: TabularSource, options: TabularReadOptions = {}): AsyncGenerator<TabularRow> {
    const { limits, sheets } = options;
    const bytes = limits?.bytes === undefined ? source : limitBytes(source, limits.bytes);
    const workbook = new EXCELJS.stream.xlsx.WorkbookReader(Readable.from(bytes), {
      entries: "emit",
      sharedStrings: "cache",
      hyperlinks: "ignore",
      styles: "cache",
      worksheets: "emit",
    });
    let count = 0;
    for await (const worksheet of workbook) {
      // exceljs sets the sheet's name from the workbook part at runtime; `WorksheetReader`'s typings omit it
      const name = (worksheet as typeof worksheet & { readonly name?: string }).name ?? "";
      const isWanted = sheets === undefined || sheets.includes(name);
      let isHeader = true;
      for await (const row of worksheet) {
        if (!isWanted) continue;
        if (!isHeader && limits?.rows !== undefined && ++count > limits.rows)
          throw TransferLimitExceededError.create({ limit: "rows", max: limits.rows });
        isHeader = false;
        const values = Array.isArray(row.values) ? row.values.slice(1) : [];
        yield {
          sheet: name,
          row: row.number,
          cells: Array.from(values, (value) => cellText(value)),
        };
      }
    }
  }
}
