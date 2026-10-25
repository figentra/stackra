/**
 * Stackra file contract:
 * Purpose: unit tests of `Bind`: record, range, table filter and actor bind codes.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rule 18).
 */
import { describe, expect, it } from "@stackra/testing";

import { Bind } from "#core/constants/bind.constant";

describe("Bind", () => {
  it("builds bind codes", () => {
    expect(Bind.record("totals.currency")).toBe("record.totals.currency");
    expect(Bind.range()).toBe("range");
    expect(Bind.tableFilter()).toBe("table_filter");
    expect(Bind.tableFilter("status")).toBe("table_filter.status");
    expect(Bind.actor["accountId"]).toBe("actor.accountId");
  });
});
