/**
 * Stackra file contract:
 * Purpose: unit tests of `XlsxReaderDriver`: every sheet of a workbook (written by `XlsxWriterDriver`) streamed with
 *          names, row numbers and text cells, a chosen sheet, and the row limit.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0367 (decisions 2 and 4).
 */
import { describe, expect, it } from "@stackra/testing";

import type { TabularReadOptions } from "#contracts/types/tabular-read-options.type";
import type { TabularRow } from "#contracts/types/tabular-row.type";
import { XlsxReaderDriver } from "#core/drivers/xlsx-reader.driver";
import { XlsxWriterDriver } from "#core/drivers/xlsx-writer.driver";
import { TransferLimitExceededError } from "#core/errors/transfer-limit-exceeded.error";

async function workbook(): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of new XlsxWriterDriver().write([
    {
      name: "المنتجات",
      rows: [
        ["الاسم", "السعر"],
        ["قلم", 5],
        ["دفتر", 12],
      ],
    },
    { name: "Notes", rows: [["note"], [true]] },
  ]))
    chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function rows(options?: TabularReadOptions): Promise<TabularRow[]> {
  const result: TabularRow[] = [];
  for await (const row of new XlsxReaderDriver().read([await workbook()], options))
    result.push(row);
  return result;
}

describe("XlsxReaderDriver", () => {
  it("streams every sheet", async () => {
    expect(await rows()).toEqual([
      { sheet: "المنتجات", row: 1, cells: ["الاسم", "السعر"] },
      { sheet: "المنتجات", row: 2, cells: ["قلم", "5"] },
      { sheet: "المنتجات", row: 3, cells: ["دفتر", "12"] },
      { sheet: "Notes", row: 1, cells: ["note"] },
      { sheet: "Notes", row: 2, cells: ["true"] },
    ]);
  });

  it("reads only the chosen sheets", async () => {
    expect((await rows({ sheets: ["Notes"] })).map((row) => row.sheet)).toEqual(["Notes", "Notes"]);
  });

  it("refuses past the row limit", async () => {
    expect(await rows({ limits: { rows: 3 } })).toHaveLength(5);
    await expect(rows({ limits: { rows: 2 } })).rejects.toThrow(TransferLimitExceededError);
  });
});
