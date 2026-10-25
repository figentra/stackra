/**
 * Stackra file contract:
 * Purpose: `CsvReaderDriver`, the `csv` driver of `TabularReader`: decodes the file strictly (detected encoding or the
 *          market pack's fallback), detects the delimiter from the first line, and streams its records as rows of the
 *          one sheet `""`.
 * Boundary: no dependency and no buffering beyond the first line. Limits are checked while streaming. `sheets` is
 *           ignored: a CSV file has one sheet.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decisions 2 to 4); ADR 0294 (decisions 16 and 25).
 */
import { Driver } from "@stackra/container";

import { TabularReader } from "#contracts/ports/tabular-reader.port";
import type { TabularReadOptions } from "#contracts/types/tabular-read-options.type";
import type { TabularRow } from "#contracts/types/tabular-row.type";
import type { TabularSource } from "#contracts/types/tabular-source.type";
import { TransferLimitExceededError } from "#core/errors/transfer-limit-exceeded.error";
import { decodeText } from "#core/functions/decode-text.function";
import { detectDelimiter } from "#core/functions/detect-delimiter.function";
import { limitBytes } from "#core/functions/limit-bytes.function";
import { parseCsv } from "#core/functions/parse-csv.function";

/**
 * Reads CSV files.
 *
 * @example
 * for await (const row of new CsvReaderDriver().read(upload, { fallbackEncoding: pack.legacyEncoding })) { ... }
 */
export class CsvReaderDriver extends Driver(TabularReader) {
  /**
   * See `TabularReader.read`.
   *
   * @yields One row at a time.
   */
  async *read(source: TabularSource, options: TabularReadOptions = {}): AsyncGenerator<TabularRow> {
    const { limits } = options;
    const bytes = limits?.bytes === undefined ? source : limitBytes(source, limits.bytes);
    const text = decodeText(bytes, options.encoding, options.fallbackEncoding);
    let head = "";
    let next = await text.next();
    while (!next.done) {
      head += next.value;
      if (/[\r\n]/.test(head)) break;
      next = await text.next();
    }
    const delimiter = options.delimiter ?? detectDelimiter(head.split(/\r\n|\r|\n/, 1)[0] ?? "");
    async function* whole(): AsyncGenerator<string> {
      if (head !== "") yield head;
      if (next.done) return;
      for (let chunk = await text.next(); !chunk.done; chunk = await text.next()) yield chunk.value;
    }
    let row = 0;
    for await (const cells of parseCsv(whole(), delimiter)) {
      row += 1;
      if (row > 1 && limits?.rows !== undefined && row - 1 > limits.rows)
        throw TransferLimitExceededError.create({ limit: "rows", max: limits.rows });
      yield { sheet: "", row, cells };
    }
  }
}
