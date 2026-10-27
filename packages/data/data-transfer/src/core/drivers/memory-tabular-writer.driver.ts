/**
 * Stackra file contract:
 * Purpose: `MemoryTabularWriterDriver`, the `memory` driver of `TabularWriter` for tests and development: it keeps
 *          every write's sheets, rows and cells as given, and writes no bytes.
 * Boundary: the memory driver the port ships with (ADR 0266); its name is the file prefix (`memory`). It holds whole
 *           sheets, unlike a format driver, so it is not for production exports. It writes no format, so it takes any
 *           number of sheets and ignores `TabularWriteOptions`.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decisions 2 and 10); ADR 0266 (decision 2).
 */
import { Driver } from "@stackra/container";

import { TabularWriter } from "#contracts/ports/tabular-writer.port";
import type { TabularCell } from "#contracts/types/tabular-cell.type";
import type { TabularSheet } from "#contracts/types/tabular-sheet.type";

/** One sheet as written, its rows collected. */
type WrittenSheet = { readonly name: string; readonly rows: readonly (readonly TabularCell[])[] };

/**
 * Records what is written.
 *
 * @example
 * const writer = new MemoryTabularWriterDriver();
 * for await (const _ of writer.write([{ name: "Orders", rows }]));
 * writer.written[0]; // [{ name: "Orders", rows: [...] }]
 */
export class MemoryTabularWriterDriver extends Driver(TabularWriter) {
  /** No file format: the bytes are empty. */
  readonly mediaType = "application/octet-stream";

  /** Each write's sheets, in call order. */
  readonly written: (readonly WrittenSheet[])[] = [];

  /**
   * See `TabularWriter.write`. The write is recorded once its rows are drained.
   *
   * @yields Nothing.
   */
  async *write(sheets: readonly TabularSheet[]): AsyncGenerator<Uint8Array> {
    const kept: WrittenSheet[] = [];
    for (const sheet of sheets) {
      const rows: (readonly TabularCell[])[] = [];
      for await (const row of sheet.rows) rows.push([...row]);
      kept.push({ name: sheet.name, rows });
    }
    this.written.push(kept);
    yield* []; // a sink: the rows are kept, no bytes are made
  }
}
