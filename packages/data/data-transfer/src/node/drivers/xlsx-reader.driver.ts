/**
 * Stackra file contract:
 * Purpose: `XlsxReaderDriver`, the `xlsx` driver of `TabularReader`: reads every sheet of a workbook (or the chosen
 *          ones) in workbook order, each cell as text, through the package's own zip reader (STA-1736: exceljs and its
 *          uuid, glob and minimatch copies are gone).
 * Boundary: node only; the file is untrusted. It is held in memory (capped by `limits.bytes`) because a zip's
 *           directory is at its end, and one part is inflated at a time under `XLSX_CEILINGS` (entries, ratio, part
 *           and total size); every part passes `checkXml` (no DTD, bounded depth) before it is parsed. A hostile or
 *           malformed file is `UnreadableWorkbookError`; past the caller's rows, bytes, columns or cell length,
 *           `TransferLimitExceededError`. Empty rows are not yielded, so row numbers can skip. Dates are read through
 *           the styles, in the 1900 or 1904 system, so a date cell yields ISO 8601.
 * Runtime: node
 * Governing contract: ADR 0367 (decisions 2 and 4); ADR 0294 (decisions 16 and 25).
 */
import { Driver } from "@stackra/container";

import { TabularReader } from "#contracts/ports/tabular-reader.port";
import type { TabularReadOptions } from "#contracts/types/tabular-read-options.type";
import type { TabularRow } from "#contracts/types/tabular-row.type";
import type { TabularSource } from "#contracts/types/tabular-source.type";
import { TransferLimitExceededError } from "#core/errors/transfer-limit-exceeded.error";
import { limitBytes } from "#core/functions/limit-bytes.function";
import { XLSX_CEILINGS } from "#node/constants/xlsx-ceilings.constant";
import { checkXml } from "#node/functions/check-xml.function";
import { readWorkbook } from "#node/functions/read-workbook.function";
import { readZip } from "#node/functions/read-zip.function";
import { sheetRows } from "#node/functions/sheet-rows.function";

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
    const chunks: Uint8Array[] = [];
    for await (const chunk of limits?.bytes === undefined
      ? source
      : limitBytes(source, limits.bytes))
      chunks.push(chunk);
    const file = readZip(Buffer.concat(chunks), XLSX_CEILINGS);
    const decoder = new TextDecoder();
    const part = (path: string): string | undefined => {
      const found = file(path);
      return found === undefined ? undefined : checkXml(decoder.decode(found), XLSX_CEILINGS.depth);
    };
    const book = readWorkbook(part);
    let count = 0;
    for (const sheet of book.sheets) {
      if (sheets !== undefined && !sheets.includes(sheet.name)) continue;
      let isHeader = true;
      for (const { row, cells } of sheetRows(part(sheet.path) ?? "", book, XLSX_CEILINGS.columns)) {
        if (!isHeader && limits?.rows !== undefined && ++count > limits.rows)
          throw TransferLimitExceededError.create({ limit: "rows", max: limits.rows });
        if (limits?.columns !== undefined && cells.length > limits.columns)
          throw TransferLimitExceededError.create({ limit: "columns", max: limits.columns });
        const { cellLength } = limits ?? {};
        if (cellLength !== undefined && cells.some((cell) => cell.length > cellLength))
          throw TransferLimitExceededError.create({ limit: "cell_length", max: cellLength });
        isHeader = false;
        yield { sheet: sheet.name, row, cells };
      }
    }
  }
}
