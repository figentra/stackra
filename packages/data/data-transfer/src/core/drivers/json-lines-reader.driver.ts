/**
 * Stackra file contract:
 * Purpose: `JsonLinesReaderDriver`, the `jsonl` driver of `TabularReader`: streams a JSON Lines file (one JSON object
 *          per line, UTF-8) as rows of the one sheet `""`, the keys of the first object being the header.
 * Boundary: no dependency and no buffering beyond one line. A line is its own row number, so a refused record points at
 *           the line to fix; the header is the synthetic row `0`. A later object with a key the first one lacks is
 *           refused (a column would be lost silently); a missing key is an empty cell. Strings stay as they are,
 *           numbers and booleans become their JSON text, `null` is empty and a nested value is its JSON text. Plain
 *           JSON (one array) is not streamable and stays on the full-tenant export path (ADR 0431 decision 2).
 * Runtime: isomorphic
 * Governing contract: ADR 0431 (decision 2); ADR 0367 (decisions 2 and 4); ADR 0163 (decision 3).
 */
import { Driver } from "@stackra/container";

import { TabularReader } from "#contracts/ports/tabular-reader.port";
import type { TabularReadOptions } from "#contracts/types/tabular-read-options.type";
import type { TabularRow } from "#contracts/types/tabular-row.type";
import type { TabularSource } from "#contracts/types/tabular-source.type";
import { TransferLimitExceededError } from "#core/errors/transfer-limit-exceeded.error";
import { decodeText } from "#core/functions/decode-text.function";
import { limitBytes } from "#core/functions/limit-bytes.function";

/** The text of one JSON value as a cell. */
function cellOf(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

/**
 * Reads JSON Lines files.
 *
 * @example
 * for await (const row of new JsonLinesReaderDriver().read(upload, { limits })) { ... }
 */
export class JsonLinesReaderDriver extends Driver(TabularReader) {
  /**
   * See `TabularReader.read`. `encoding`, `fallbackEncoding`, `delimiter` and `sheets` are ignored: JSON Lines is
   * UTF-8 and has one sheet.
   *
   * @yields The header (row `0`), then one row per non-blank line.
   * @throws TypeError when a line is not a JSON object or has a key the first object lacks.
   */
  async *read(source: TabularSource, options: TabularReadOptions = {}): AsyncGenerator<TabularRow> {
    const { limits } = options;
    const bytes = limits?.bytes === undefined ? source : limitBytes(source, limits.bytes);
    let header: string[] | undefined;
    let line = 0;
    let count = 0;
    let rest = "";
    const rowOf = (text: string): TabularRow[] => {
      line += 1;
      if (text.trim() === "") return [];
      let value: unknown;
      try {
        value = JSON.parse(text);
      } catch {
        throw new TypeError(`Line ${line} of the JSON Lines file is not valid JSON`);
      }
      if (typeof value !== "object" || value === null || Array.isArray(value))
        throw new TypeError(`Line ${line} of the JSON Lines file is not a JSON object`);
      const record = value as Record<string, unknown>;
      const rows: TabularRow[] = [];
      if (header === undefined) {
        header = Object.keys(record);
        rows.push({ sheet: "", row: 0, cells: header });
      }
      const known = header;
      const extra = Object.keys(record).find((key) => !known.includes(key));
      if (extra !== undefined)
        throw new TypeError(
          `Line ${line} of the JSON Lines file has the key "${extra}", which the first line does not`,
        );
      if (limits?.rows !== undefined && ++count > limits.rows)
        throw TransferLimitExceededError.create({ limit: "rows", max: limits.rows });
      rows.push({ sheet: "", row: line, cells: known.map((key) => cellOf(record[key])) });
      return rows;
    };
    for await (const chunk of decodeText(bytes, "utf-8", undefined)) {
      const lines = (rest + chunk).split("\n");
      rest = lines.pop() ?? "";
      for (const text of lines) yield* rowOf(text.replace(/\r$/, ""));
    }
    if (rest !== "") yield* rowOf(rest.replace(/\r$/, ""));
  }
}
