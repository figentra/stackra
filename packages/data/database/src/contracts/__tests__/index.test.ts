/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: `Disposal`, `HoldChannel`, `HoldRegistry`, `QueryObserver`, `SequenceTimeZone` and `VisibilityFilter` are the values, and `Where` accepts a
 *          typed filter and one `$raw` fragment.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0294 (decision 15); ADR 0022.
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type { QuerySample, Where } from "#contracts/index";

describe("@stackra/database/contracts", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(contracts).sort()).toEqual([
      "ConnectionResolver",
      "Disposal",
      "HoldChannel",
      "HoldRegistry",
      "PRIMARY_CONNECTION",
      "QueryObserver",
      "SequenceTimeZone",
      "VisibilityFilter",
    ]);
  });

  it("types a filter of M", () => {
    expectTypeOf<{ sku: string }>().toExtend<Where<{ sku: string }>>();
    expectTypeOf<{ sku: number }>().not.toExtend<Where<{ sku: string }>>();
  });

  it("types a query sample with no parameter values (STA-1400)", () => {
    expectTypeOf<QuerySample["statement"]>().toEqualTypeOf<string>();
    expectTypeOf<QuerySample["table"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<QuerySample>().not.toHaveProperty("params");
  });
});
