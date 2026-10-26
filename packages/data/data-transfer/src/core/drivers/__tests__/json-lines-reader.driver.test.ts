/**
 * Stackra file contract:
 * Purpose: unit tests of `JsonLinesReaderDriver`: the first object's keys as the header, line numbers as rows, blank
 *          lines skipped, a line split across chunks, value conversion, and the refusals (bad JSON, not an object, an
 *          unknown key, the row limit).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0431 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import type { TabularRow } from "#contracts/types/tabular-row.type";
import { JsonLinesReaderDriver } from "#core/drivers/json-lines-reader.driver";
import { TransferLimitExceededError } from "#core/errors/transfer-limit-exceeded.error";

async function rows(chunks: string[], limit?: number): Promise<TabularRow[]> {
  const encoder = new TextEncoder();
  const read: TabularRow[] = [];
  const options = limit === undefined ? {} : { limits: { rows: limit } };
  for await (const row of new JsonLinesReaderDriver().read(
    chunks.map((chunk) => encoder.encode(chunk)),
    options,
  ))
    read.push(row);
  return read;
}

describe("JsonLinesReaderDriver", () => {
  it("reads the first object's keys as the header and each line as a row", async () => {
    expect(
      await rows([
        '{"sku":"A-1","price":5,"tags":["x"]}\r\n\n{"sku":"قلم",',
        '"price":null}\n{"price":true}',
      ]),
    ).toEqual([
      { sheet: "", row: 0, cells: ["sku", "price", "tags"] },
      { sheet: "", row: 1, cells: ["A-1", "5", '["x"]'] },
      { sheet: "", row: 3, cells: ["قلم", "", ""] },
      { sheet: "", row: 4, cells: ["", "true", ""] },
    ]);
  });

  it("refuses a line that is not a JSON object or has an unknown key", async () => {
    await expect(rows(['{"a":1}\n{oops\n'])).rejects.toThrow(/Line 2.*not valid JSON/);
    await expect(rows(["[1,2]\n"])).rejects.toThrow(/Line 1.*not a JSON object/);
    await expect(rows(['{"a":1}\n{"b":2}\n'])).rejects.toThrow(/key "b"/);
  });

  it("refuses past the row limit", async () => {
    await expect(rows(['{"a":1}\n{"a":2}\n'], 1)).rejects.toBeInstanceOf(
      TransferLimitExceededError,
    );
  });
});
