/**
 * Stackra file contract:
 * Purpose: `MemoryTabularReaderDriver`, the `memory` driver of `TabularReader` for tests and development: it yields the
 *          sheets it was built with as rows, so an importer is tested without writing a CSV file or a workbook.
 * Boundary: the memory driver the port ships with (ADR 0266); its name is the file prefix (`memory`). It holds its
 *           sheets and ignores the source's bytes, so `encoding`, `fallbackEncoding`, `delimiter` and `limits.bytes`
 *           do not apply; `sheets` and `limits.rows` do. A cell is text as a reader yields it: a `Date` is ISO 8601,
 *           `null` is `""`. Pair it with `MemoryTabularWriterDriver.written` for a round trip.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decisions 2 to 4); ADR 0266 (decision 2).
 */
import { Driver } from "@stackra/container";

import { TabularReader } from "#contracts/ports/tabular-reader.port";
import type { TabularCell } from "#contracts/types/tabular-cell.type";
import type { TabularReadOptions } from "#contracts/types/tabular-read-options.type";
import type { TabularRow } from "#contracts/types/tabular-row.type";
import type { TabularSheet } from "#contracts/types/tabular-sheet.type";
import type { TabularSource } from "#contracts/types/tabular-source.type";
import { TransferLimitExceededError } from "#core/errors/transfer-limit-exceeded.error";

/** A cell as the text a reader yields. */
function textOf(cell: TabularCell): string {
  if (cell === null) return "";
  return cell instanceof Date ? cell.toISOString() : String(cell);
}

/**
 * Reads the sheets it holds.
 *
 * @example
 * const reader = new MemoryTabularReaderDriver([{ name: "", rows: [["sku", "qty"], ["A-1", 2]] }]);
 */
export class MemoryTabularReaderDriver extends Driver(TabularReader) {
  /** The sheets every read yields, header first. */
  private readonly sheets: readonly TabularSheet[];

  /**
   * @param sheets - the sheets to yield, in order (a CSV-like file is one sheet named `""`).
   */
  constructor(sheets: readonly TabularSheet[]) {
    super();
    this.sheets = sheets;
  }

  /**
   * See `TabularReader.read`; `source` is not read.
   *
   * @yields Each chosen sheet's rows, numbered from 1, header first.
   * @throws TransferLimitExceededError past `options.limits.rows` data rows across the sheets.
   */
  async *read(
    _source: TabularSource,
    options: TabularReadOptions = {},
  ): AsyncGenerator<TabularRow> {
    const max = options.limits?.rows;
    let count = 0;
    for (const sheet of this.sheets) {
      if (options.sheets && !options.sheets.includes(sheet.name)) continue;
      let row = 0;
      for await (const cells of sheet.rows) {
        row += 1;
        if (row > 1 && max !== undefined && ++count > max)
          throw TransferLimitExceededError.create({ limit: "rows", max });
        yield { sheet: sheet.name, row, cells: cells.map(textOf) };
      }
    }
  }
}
