/**
 * Stackra file contract:
 * Purpose: unit and type tests of `Aggregate`: the panel's enum is `@stackra/database`'s, codes in order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0470 (consequences: one `Aggregate`); ADR 0359 (decision 14).
 */
import { Enum } from "@stackra/contracts";
import { Aggregate as DatabaseAggregate } from "@stackra/database";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Aggregate } from "#core/enums/aggregate.enum";

describe("Aggregate", () => {
  it("is the database enum, codes in order", () => {
    expect(Aggregate).toBe(DatabaseAggregate);
    expect(Enum.values(Aggregate)).toEqual(["count", "sum", "avg", "min", "max", "distinct"]);
  });

  it("types its values", () => {
    expectTypeOf<Aggregate>().toEqualTypeOf<"count" | "sum" | "avg" | "min" | "max" | "distinct">();
  });
});
