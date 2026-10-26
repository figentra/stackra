/**
 * Stackra file contract:
 * Purpose: `JsonLinesWriterDriver`, the `jsonl` driver of `TabularWriter`: one JSON object per line, keyed by the
 *          sheet's header row, UTF-8 with `\n` line ends.
 * Boundary: no dependency; one line per row, streamed. A JSON Lines file holds one sheet, so it refuses any other count.
 *           A `Date` is written as ISO 8601 text and `null` as `null`. No byte order mark and no formula guard: the
 *           file is read by programs, not spreadsheets, so `TabularWriteOptions` is ignored.
 * Runtime: isomorphic
 * Governing contract: ADR 0431 (decision 2); ADR 0367 (decision 2).
 */
import { Driver } from "@stackra/container";

import { TabularWriter } from "#contracts/ports/tabular-writer.port";
import type { TabularCell } from "#contracts/types/tabular-cell.type";
import type { TabularSheet } from "#contracts/types/tabular-sheet.type";

/**
 * Writes JSON Lines files.
 *
 * @example
 * const bytes = new JsonLinesWriterDriver().write([{ name: "Orders", rows }]);
 */
export class JsonLinesWriterDriver extends Driver(TabularWriter) {
  /** `application/jsonl`. */
  readonly mediaType = "application/jsonl";

  /**
   * See `TabularWriter.write`.
   *
   * @yields One line per data row.
   * @throws TypeError when there is not exactly one sheet, or a data row is longer than the header.
   */
  async *write(sheets: readonly TabularSheet[]): AsyncGenerator<Uint8Array> {
    const [sheet] = sheets;
    if (sheet === undefined || sheets.length !== 1)
      throw new TypeError(
        `A JSON Lines file holds one sheet, not ${sheets.length}: write each sheet to its own file`,
      );
    const encoder = new TextEncoder();
    let header: string[] | undefined;
    for await (const row of sheet.rows) {
      if (header === undefined) {
        header = row.map((cell) =>
          cell instanceof Date ? cell.toISOString() : String(cell ?? ""),
        );
        continue;
      }
      if (row.length > header.length)
        throw new TypeError(
          `A row has ${row.length} cells but the header names ${header.length} columns`,
        );
      const record: Record<string, Exclude<TabularCell, Date>> = {};
      header.forEach((key, column) => {
        const cell = row[column] ?? null;
        record[key] = cell instanceof Date ? cell.toISOString() : cell;
      });
      yield encoder.encode(`${JSON.stringify(record)}\n`);
    }
  }
}
