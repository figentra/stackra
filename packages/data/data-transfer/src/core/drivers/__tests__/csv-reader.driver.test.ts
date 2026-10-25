/**
 * Stackra file contract:
 * Purpose: unit tests of `CsvReaderDriver`: an Arabic file in the legacy fallback encoding with a detected `;`
 *          delimiter, a given delimiter and encoding, the row and byte limits, and an empty file.
 * Boundary: test only. The fallback label is test data, as a market pack would pass it.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0367 (decisions 2 to 4).
 */
import { describe, expect, it } from "@stackra/testing";

import type { TabularReadOptions } from "#contracts/types/tabular-read-options.type";
import type { TabularRow } from "#contracts/types/tabular-row.type";
import { CsvReaderDriver } from "#core/drivers/csv-reader.driver";
import { TransferLimitExceededError } from "#core/errors/transfer-limit-exceeded.error";

async function rows(chunks: Uint8Array[], options?: TabularReadOptions): Promise<TabularRow[]> {
  const result: TabularRow[] = [];
  for await (const row of new CsvReaderDriver().read(chunks, options)) result.push(row);
  return result;
}

// "الاسم;السعر\r\nمرحبا;5\r\n" in windows-1256
const LEGACY_FILE = new Uint8Array([
  0xc7, 0xe1, 0xc7, 0xd3, 0xe3, 0x3b, 0xc7, 0xe1, 0xd3, 0xda, 0xd1, 0x0d, 0x0a, 0xe3, 0xd1, 0xcd,
  0xc8, 0xc7, 0x3b, 0x35, 0x0d, 0x0a,
]);

describe("CsvReaderDriver", () => {
  it("reads a legacy Arabic file through the fallback and detects the delimiter", async () => {
    expect(
      await rows([LEGACY_FILE.subarray(0, 7), LEGACY_FILE.subarray(7)], {
        fallbackEncoding: "windows-1256",
      }),
    ).toEqual([
      { sheet: "", row: 1, cells: ["الاسم", "السعر"] },
      { sheet: "", row: 2, cells: ["مرحبا", "5"] },
    ]);
  });

  it("uses the given delimiter and encoding", async () => {
    const file = new TextEncoder().encode("a,b|c\n1,2|3");
    expect(
      (await rows([file], { delimiter: "|", encoding: "utf-8" })).map((row) => row.cells),
    ).toEqual([
      ["a,b", "c"],
      ["1,2", "3"],
    ]);
  });

  it("refuses past the row and byte limits", async () => {
    const file = new TextEncoder().encode("h\n1\n2\n3\n");
    expect(await rows([file], { limits: { rows: 3 } })).toHaveLength(4);
    await expect(rows([file], { limits: { rows: 2 } })).rejects.toThrow(TransferLimitExceededError);
    await expect(rows([file], { limits: { bytes: 4 } })).rejects.toThrow(
      TransferLimitExceededError,
    );
  });

  it("yields nothing for an empty file", async () => {
    expect(await rows([])).toEqual([]);
  });
});
