/**
 * Stackra file contract:
 * Purpose: `CsvWriterDriver`, the `csv` driver of `TabularWriter`: UTF-8 text, CRLF line ends, quoting where needed,
 *          an optional byte order mark (on by default) and the formula guard (on by default).
 * Boundary: no dependency; one line per row, streamed. A CSV file holds one sheet, so it refuses any other count.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decisions 2 and 10); ADR 0294 (decisions 16 and 25).
 */
import { Driver } from "@stackra/container";

import { TabularWriter } from "#contracts/ports/tabular-writer.port";
import type { TabularSheet } from "#contracts/types/tabular-sheet.type";
import type { TabularWriteOptions } from "#contracts/types/tabular-write-options.type";
import { csvCell } from "#core/functions/csv-cell.function";

/**
 * Writes CSV files.
 *
 * @example
 * const bytes = new CsvWriterDriver().write([{ name: "Orders", rows }], { delimiter: ";" });
 */
export class CsvWriterDriver extends Driver(TabularWriter) {
  /** `text/csv`. */
  readonly mediaType = "text/csv";

  /**
   * See `TabularWriter.write`.
   *
   * @yields The file bytes, chunk by chunk.
   */
  async *write(
    sheets: readonly TabularSheet[],
    options: TabularWriteOptions = {},
  ): AsyncGenerator<Uint8Array> {
    const [sheet] = sheets;
    if (sheet === undefined || sheets.length !== 1)
      throw new TypeError(
        `A CSV file holds one sheet, not ${sheets.length}: write each sheet to its own file, or write XLSX`,
      );
    const delimiter = options.delimiter ?? ",";
    const isGuarded = options.formulaGuard ?? true;
    const encoder = new TextEncoder();
    if (options.byteOrderMark ?? true) yield new Uint8Array([0xef, 0xbb, 0xbf]);
    for await (const row of sheet.rows)
      yield encoder.encode(
        `${row.map((value) => csvCell(value, delimiter, isGuarded)).join(delimiter)}\r\n`,
      );
  }
}
