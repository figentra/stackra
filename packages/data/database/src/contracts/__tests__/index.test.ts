/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: `Disposal`, `HoldRegistry` and `VisibilityFilter` are the values, and `Where` accepts a
 *          typed filter and one `$raw` fragment.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0294 (decision 15); ADR 0022.
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type { Where } from "#contracts/index";

describe("@stackra/database/contracts", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(contracts).sort()).toEqual(["Disposal", "HoldRegistry", "VisibilityFilter"]);
  });

  it("types a filter of M", () => {
    expectTypeOf<Where<{ sku: string }>>().toHaveProperty("sku");
  });
});
