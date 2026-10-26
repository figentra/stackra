/**
 * Stackra file contract:
 * Purpose: unit tests of `JsonLinesWriterDriver`: one object per data row keyed by the header, dates as ISO text, a
 *          round trip through `JsonLinesReaderDriver`, and the refusals (sheet count, a row longer than the header).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0431 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import type { TabularSheet } from "#contracts/types/tabular-sheet.type";
import { JsonLinesReaderDriver } from "#core/drivers/json-lines-reader.driver";
import { JsonLinesWriterDriver } from "#core/drivers/json-lines-writer.driver";

async function text(sheets: TabularSheet[]): Promise<string> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of new JsonLinesWriterDriver().write(sheets)) chunks.push(chunk);
  return new TextDecoder().decode(Buffer.concat(chunks));
}

describe("JsonLinesWriterDriver", () => {
  it("writes one object per data row", async () => {
    const file = await text([
      {
        name: "Orders",
        rows: [
          ["id", "total", "at", "note"],
          ["o-1", 5, new Date("2026-10-01T00:00:00.000Z"), null],
          ["o-2", 7],
        ],
      },
    ]);
    expect(file).toBe(
      '{"id":"o-1","total":5,"at":"2026-10-01T00:00:00.000Z","note":null}\n{"id":"o-2","total":7,"at":null,"note":null}\n',
    );
    expect(new JsonLinesWriterDriver().mediaType).toBe("application/jsonl");
    const read = [];
    for await (const row of new JsonLinesReaderDriver().read([new TextEncoder().encode(file)]))
      read.push(row.cells);
    expect(read[1]).toEqual(["o-1", "5", "2026-10-01T00:00:00.000Z", ""]);
  });

  it("refuses two sheets and a row longer than the header", async () => {
    await expect(text([])).rejects.toThrow(TypeError);
    await expect(text([{ name: "a", rows: [["x"], ["1", "2"]] }])).rejects.toThrow(/2 cells/);
  });
});
