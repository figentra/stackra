/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryTenderEligibilityDriver`: a line is eligible when its category is in the rule set's
 *          list; a line without a category, or an unknown rule set, is not; lists grow with `allow`.
 * Boundary: test only; pure in-memory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0266; ADR 0445.
 */
import { Money } from "@stackra/money";
import { describe, expect, it } from "@stackra/testing";

import { MemoryTenderEligibilityDriver } from "#core/drivers/memory-tender-eligibility.driver";

const unitPrice = Money.ofMinor(100, "USD");
const lines = [
  { name: "Milk", quantity: 1, unitPrice, category: "dairy" },
  { name: "Soap", quantity: 1, unitPrice, category: "household" },
  { name: "Bag", quantity: 1, unitPrice },
];

describe("MemoryTenderEligibilityDriver", () => {
  it("flags lines whose category the rule set lists", async () => {
    const eligibility = new MemoryTenderEligibilityDriver().allow("rs", "dairy");
    expect(await eligibility.eligible("xa", "rs", lines)).toEqual([true, false, false]);
    eligibility.allow("rs", "household");
    expect(await eligibility.eligible("xa", "rs", lines)).toEqual([true, true, false]);
    expect(await eligibility.eligible("xa", "other", lines)).toEqual([false, false, false]);
  });
});
