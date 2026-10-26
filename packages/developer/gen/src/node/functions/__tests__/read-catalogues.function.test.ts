/**
 * Stackra file contract:
 * Purpose: unit tests of `readCatalogues`: every `assets/lang/<locale>/<namespace>.json` read as locale to namespace to
 *          JSON, non-JSON files ignored, undefined without the folder, and an invalid catalogue refused with its path.
 * Boundary: test only; writes small fixtures under `.cache/`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0080; STA-1293.
 */
import { describe, expect, it } from "@stackra/testing";

import { readCatalogues } from "#node/functions/read-catalogues.function";
import { writeFixtureMember } from "#node/__tests__/fixtures/write-fixture-member";

describe("readCatalogues", () => {
  it("reads each locale's namespaces", () => {
    const root = writeFixtureMember("sales", {
      "assets/lang/en/carts.json": JSON.stringify({ nav: { sales: "Sales" } }),
      "assets/lang/en/orders.json": JSON.stringify({ title: "Orders" }),
      "assets/lang/ar/carts.json": JSON.stringify({ nav: { sales: "المبيعات" } }),
      "assets/lang/ar/README.md": "# not a catalogue",
    });
    expect(readCatalogues(root)).toEqual({
      en: { carts: { nav: { sales: "Sales" } }, orders: { title: "Orders" } },
      ar: { carts: { nav: { sales: "المبيعات" } } },
    });
  });

  it("has none without assets/lang", () => {
    expect(readCatalogues(writeFixtureMember("bare", {}))).toBeUndefined();
  });

  it("refuses an invalid catalogue", () => {
    const root = writeFixtureMember("broken", { "assets/lang/en/carts.json": "{ nope" });
    expect(() => readCatalogues(root)).toThrow(/carts\.json is not valid JSON/);
  });
});
