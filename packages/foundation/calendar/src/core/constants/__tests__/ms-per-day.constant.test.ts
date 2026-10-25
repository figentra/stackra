/**
 * Stackra file contract:
 * Purpose: unit test of `MS_PER_DAY`.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0366.
 */
import { describe, expect, it } from "@stackra/testing";

import { MS_PER_DAY } from "#core/constants/ms-per-day.constant";

describe("MS_PER_DAY", () => {
  it("is one UTC day", () => {
    expect(MS_PER_DAY).toBe(24 * 60 * 60 * 1000);
  });
});
