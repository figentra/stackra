/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryTabularWriterDriver`: no bytes, each write's sheets kept in call order, and a round
 *          trip through `MemoryTabularReaderDriver`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0266; ADR 0367 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { TabularWriter } from "#contracts/ports/tabular-writer.port";
import { MemoryTabularReaderDriver } from "#core/drivers/memory-tabular-reader.driver";
import { MemoryTabularWriterDriver } from "#core/drivers/memory-tabular-writer.driver";

async function* streamed(): AsyncGenerator<readonly (string | number)[]> {
  yield ["sku", "qty"];
  yield ["A-1", 2];
}

async function drain(bytes: AsyncIterable<Uint8Array>): Promise<number> {
  let count = 0;
  for await (const chunk of bytes) count += chunk.length;
  return count;
}

describe("MemoryTabularWriterDriver", () => {
  it("keeps each write's sheets and writes no bytes", async () => {
    const writer = new MemoryTabularWriterDriver();
    expect(writer).toBeInstanceOf(TabularWriter);
    expect(
      await drain(
        writer.write([
          { name: "Orders", rows: streamed() },
          { name: "Empty", rows: [] },
        ]),
      ),
    ).toBe(0);
    await drain(writer.write([]));
    expect(writer.written).toEqual([
      [
        {
          name: "Orders",
          rows: [
            ["sku", "qty"],
            ["A-1", 2],
          ],
        },
        { name: "Empty", rows: [] },
      ],
      [],
    ]);
  });

  it("round-trips through the memory reader", async () => {
    const writer = new MemoryTabularWriterDriver();
    await drain(writer.write([{ name: "", rows: streamed() }]));
    const cells: (readonly string[])[] = [];
    for await (const row of new MemoryTabularReaderDriver().seed(writer.written[0] ?? []).read([]))
      cells.push(row.cells);
    expect(cells).toEqual([
      ["sku", "qty"],
      ["A-1", "2"],
    ]);
  });
});
