/**
 * Stackra file contract:
 * Purpose: `XlsxReaderDriver`, the `xlsx` driver of `TabularReader`: reads every sheet of a workbook (or the chosen
 *          ones) in workbook order, each cell as text, through the package's own zip reader (STA-1736: exceljs and its
 *          uuid, glob and minimatch copies are gone).
 * Boundary: node only. The file is held in memory (capped by `limits.bytes`) because a zip's directory is at its end;
 *           one sheet part is inflated at a time. Empty rows are not yielded, so row numbers can skip. Dates are read
 *           through the styles, so a date cell yields ISO 8601.
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
    const file = readZip(Buffer.concat(chunks));
    const decoder = new TextDecoder();
    const part = (path: string): string | undefined => {
      const found = file(path);
      return found === undefined ? undefined : decoder.decode(found);
    };
    const book = readWorkbook(part);
    let count = 0;
    for (const sheet of book.sheets) {
      if (sheets !== undefined && !sheets.includes(sheet.name)) continue;
      let isHeader = true;
      for (const { row, cells } of sheetRows(part(sheet.path) ?? "", book)) {
        if (!isHeader && limits?.rows !== undefined && ++count > limits.rows)
          throw TransferLimitExceededError.create({ limit: "rows", max: limits.rows });
        isHeader = false;
        yield { sheet: sheet.name, row, cells };
      }
    }
  }
}
