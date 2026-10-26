/**
 * Stackra file contract:
 * Purpose: unit tests of `jsonContains`: the column's `@>` against one JSON parameter, and a refusal of a value JSON
 *          cannot hold.
 * Boundary: test only; inspects the MikroORM fragment, runs no query.
 * Runtime: node (vitest)
 * Governing contract: ADR 0160 (decision 1); ADR 0022; ADR 0269.
 */
import { describe, expect, it } from "@stackra/testing";

import { jsonContains } from "#core/functions/json-contains.function";
import { table } from "#core/functions/table.function";

const Bookings = table("scheduling.bookings", { resourceIds: "resource_ids" });

describe(jsonContains, () => {
  it("binds the value as one JSON parameter", () => {
    const fragment = jsonContains(Bookings.columns.resourceIds, ["res_1"]);
    expect(fragment.sql).toBe('"resource_ids" @> ?::jsonb');
    expect(fragment.params).toEqual(['["res_1"]']);
  });

  it("refuses a value JSON cannot hold", () => {
    expect(() => jsonContains(Bookings.columns.resourceIds, undefined)).toThrow(/JSON value/);
  });
});
