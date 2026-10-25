/**
 * Stackra file contract:
 * Purpose: unit tests of `Filter`: field, principal and trashed filter nodes, frozen.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rule 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { Filter } from "#core/constants/filter.constant";

describe("Filter", () => {
  it("builds frozen filter nodes", () => {
    expect(Filter.from("status", { default: ["paid"], pinned: true })).toEqual({
      kind: "value",
      key: "status",
      default: ["paid"],
      pinned: true,
    });
    expect(Filter.principal("customerId")).toEqual({ kind: "principal", key: "customerId" });
    expect(Filter.trashed()).toEqual({ kind: "trashed" });
    expect(Object.isFrozen(Filter.trashed())).toBe(true);
  });
});
