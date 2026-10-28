/**
 * Stackra file contract:
 * Purpose: unit tests of `checkSearchableDrift`: a facet whose text or filters differ from the latest `t.searchable`
 *          literals of its table is refused (`searchable_columns_drift`) with a fix; camel and snake case agree, filter
 *          order does not matter, text order does, a later migration wins, another module's table and a table with no
 *          literals are not judged; and `generateMember` refuses on it in the full pass.
 * Boundary: test only; pure IR in, refusals out.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0221; data-layer gap se10.
 */
import { describe, expect, it } from "@stackra/testing";

import { checkSearchableDrift } from "#core/functions/check-searchable-drift.function";
import { generateMember } from "#core/functions/generate-member.function";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { MemberIR } from "#core/types/member-ir.type";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";

/** The fixture's `Order` model (module `orders`, table `orders.orders`). */
const ORDER = COMMERCE_IR.classes.find((candidate) => candidate.name === "Order") as DeclaredClass;

/** `Order` with `@Searchable(options)`. */
const searchableOrder = (options: Readonly<Record<string, unknown>>): DeclaredClass => ({
  ...ORDER,
  facets: [
    ...ORDER.facets,
    { name: "Searchable", kind: "searchable", target: "class", options, from: "@stackra/model" },
  ],
});

/** One `t.searchable` call on `table` in `module`. */
const call = (
  file: string,
  text: readonly string[],
  filters: readonly string[] = [],
  module = "orders",
  table = "orders",
) => ({ file, module, table, text, filters });

/** The IR with `Order` swapped for `order` and the given calls. */
function irOf(order: DeclaredClass, calls: NonNullable<MemberIR["searchableColumns"]>): MemberIR {
  return {
    ...COMMERCE_IR,
    classes: COMMERCE_IR.classes.map((each) => (each === ORDER ? order : each)),
    searchableColumns: calls,
  };
}

const FIRST = "src/modules/orders/database/migrations/0001-create-orders.migration.ts";
const SECOND = "src/modules/orders/database/migrations/0002-search-totals.migration.ts";

describe("checkSearchableDrift", () => {
  it("passes a facet equal to its literals, camel against snake case, filters in any order", () => {
    const order = searchableOrder({
      text: ["number", "customerName"],
      filters: ["status", "placedAt"],
    });
    const ir = irOf(order, [call(FIRST, ["number", "customer_name"], ["placed_at", "status"])]);
    expect(checkSearchableDrift(ir)).toEqual([]);
  });

  it("refuses a changed field, a reordered text list, and judges the latest call", () => {
    const order = searchableOrder({ text: ["number", "customerName"], filters: ["status"] });
    const refused = (calls: NonNullable<MemberIR["searchableColumns"]>) =>
      checkSearchableDrift(irOf(order, calls)).map((error) => `${error.code} ${error.subject}`);
    expect(refused([call(FIRST, ["number"], ["status"])])).toEqual([
      "searchable_columns_drift Order",
    ]);
    expect(refused([call(FIRST, ["customer_name", "number"], ["status"])])).toEqual([
      "searchable_columns_drift Order",
    ]);
    expect(refused([call(FIRST, ["number", "customer_name"], ["total"])])).toHaveLength(1);
    expect(
      refused([call(FIRST, ["number"]), call(SECOND, ["number", "customer_name"], ["status"])]),
    ).toEqual([]);
    const [error] = checkSearchableDrift(irOf(order, [call(FIRST, ["number"], ["status"])]));
    expect(error?.file).toBe(ORDER.file);
    expect(error?.fix).toContain("stackra search:reindex Order");
  });

  it("names the expand step one version past the latest call, and the contract step after it", () => {
    const order = searchableOrder({ text: ["number", "customerName"], filters: ["status"] });
    const fixOf = (calls: NonNullable<MemberIR["searchableColumns"]>) =>
      checkSearchableDrift(irOf(order, calls))[0]?.fix ?? "";
    expect(fixOf([call(FIRST, ["number"])])).toContain(
      'schema.table("orders", (t) => t.searchable({ text: ["number","customer_name"], filters: ["status"], version: 2 }))',
    );
    expect(fixOf([{ ...call(SECOND, ["number"]), version: 2 }])).toContain("version: 3");
    expect(fixOf([call(FIRST, ["number"])])).toContain("renames the __v2 columns");
  });

  it("does not judge another module's table or a table with no literals", () => {
    const order = searchableOrder({ text: ["number"] });
    expect(checkSearchableDrift(irOf(order, [call(FIRST, ["title"], [], "catalog")]))).toEqual([]);
    expect(checkSearchableDrift(irOf(order, []))).toEqual([]);
  });

  it("makes generateMember refuse in the full pass", () => {
    const order = searchableOrder({ text: ["number", "customerName"] });
    const result = generateMember(irOf(order, [call(FIRST, ["number"])]));
    expect(result.files).toEqual([]);
    expect(result.errors.map((error) => error.code)).toContain("searchable_columns_drift");
  });
});
