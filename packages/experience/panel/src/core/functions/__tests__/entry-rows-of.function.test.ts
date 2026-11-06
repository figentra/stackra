/**
 * Stackra file contract:
 * Purpose: unit tests of `entryRowsOf`: a value entry as one cell, a money entry with its currency, a list as a small
 *          table whose `…Minor` cells take their currency, and a section with its title and entries.
 * Boundary: test only; translation returns the key.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rules 1 and 2).
 */
import type { I18nKey } from "@stackra/i18n";
import { describe, expect, it } from "@stackra/testing";

import { entryRowsOf } from "#core/functions/entry-rows-of.function";

const t = (key: I18nKey): string => key;
const record = {
  status: "paid",
  totalMinor: 1250,
  currency: "AED",
  lines: [{ sku: "a", priceMinor: 500 }],
};

describe("entryRowsOf", () => {
  it("builds the value, money and list rows and the sections", () => {
    const { rows, sections } = entryRowsOf(
      "orders.order",
      [
        { kind: "value", key: "status" },
        { kind: "money", key: "totalMinor", currency: "currency" },
        { kind: "list", key: "lines", columns: ["sku", "priceMinor"], currency: "currency" },
        { kind: "section", name: "more", entries: [{ kind: "value", key: "status" }] },
      ],
      record,
      t,
    );
    expect(rows.map((row) => row.id)).toEqual(["status", "totalMinor", "lines"]);
    expect(rows[0]?.cell).toMatchObject({ kind: "value", value: "paid" });
    expect(rows[1]?.cell).toMatchObject({ kind: "money", value: 1250, currency: "AED" });
    const list = rows[2]?.list;
    expect(list?.items).toEqual([{ sku: "a", priceMinor: 500, id: "0" }]);
    expect(list?.cell({ priceMinor: 500 }, "priceMinor")).toMatchObject({
      kind: "money",
      value: 500,
      currency: "AED",
    });
    expect(list?.cell({ sku: "a" }, "sku")).toMatchObject({ kind: "value", value: "a" });
    expect(sections).toHaveLength(1);
    expect(sections[0]?.name).toBe("more");
  });
});
