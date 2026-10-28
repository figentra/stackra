/**
 * Stackra file contract:
 * Purpose: unit tests of `ParquetWriterDriver`: the file starts and ends with the magic and its footer length points at
 *          a `FileMetaData` naming the columns, `rowGroupRows` streams row groups, and the refusals (sheet count, no
 *          header, a repeated column, a long row, a cell of another kind, a bad row group size).
 * Boundary: test only; reads the footer bytes, not a full Parquet reader.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0163 and ADR 0190 (2026-10-29 amendments); Apache Parquet format.
 */
import { describe, expect, it } from "@stackra/testing";

import type { TabularCell } from "#contracts/types/tabular-cell.type";
import type { TabularWriteOptions } from "#contracts/types/tabular-write-options.type";
import { ParquetWriterDriver } from "#core/drivers/parquet-writer.driver";

/** The chunks a write of `rows` yields. */
async function chunksOf(
  rows: (readonly TabularCell[])[],
  options?: TabularWriteOptions,
): Promise<Uint8Array[]> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of new ParquetWriterDriver().write([{ name: "Orders", rows }], options))
    chunks.push(chunk);
  return chunks;
}

describe(ParquetWriterDriver, () => {
  it("writes the magic, the column chunks and a footer naming the columns", async () => {
    const file = Buffer.concat(
      await chunksOf([
        ["id", "total", "paid", "at"],
        ["o-1", 5.5, true, new Date("2026-10-29T00:00:00.000Z")],
        ["o-2", null, false],
      ]),
    );
    expect(file.subarray(0, 4).toString()).toBe("PAR1");
    expect(file.subarray(-4).toString()).toBe("PAR1");
    const length = file.readUInt32LE(file.length - 8);
    const footer = file.subarray(file.length - 8 - length, file.length - 8);
    expect([...footer.subarray(0, 2)]).toEqual([0x15, 0x02]);
    for (const name of ["schema", "id", "total", "paid", "at", "stackra data-transfer"])
      expect(footer.includes(Buffer.from(name))).toBe(true);
    expect(new ParquetWriterDriver().mediaType).toBe("application/vnd.apache.parquet");
  });

  it("streams one chunk per column per row group", async () => {
    const chunks = await chunksOf([["n"], [1], [2], [3]], { rowGroupRows: 2 });
    expect(chunks).toHaveLength(4);
    expect(await chunksOf([["n"], [1], [2], [3]])).toHaveLength(3);
    expect(await chunksOf([["n"]])).toHaveLength(2);
  });

  it("writes any cell into a text column", async () => {
    await expect(chunksOf([["v"], ["a"], [1], [new Date(0)]])).resolves.toHaveLength(3);
  });

  it("refuses what a Parquet file cannot hold", async () => {
    await expect(
      (async () => {
        for await (const _ of new ParquetWriterDriver().write([])) continue;
      })(),
    ).rejects.toThrow(TypeError);
    await expect(chunksOf([])).rejects.toThrow("needs a header row");
    await expect(chunksOf([["a", "a"]])).rejects.toThrow('repeat the column name "a"');
    await expect(chunksOf([["a"], [1, 2]])).rejects.toThrow("2 cells");
    await expect(chunksOf([["n"], [1], ["x"]])).rejects.toThrow(TypeError);
    await expect(chunksOf([["n"], [1]], { rowGroupRows: 0 })).rejects.toThrow("rowGroupRows");
  });
});
