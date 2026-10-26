/**
 * Stackra file contract:
 * Purpose: unit tests of `SEED_RECORD_KINDS`: frozen, unique, and holding the plan-catalogue kinds (fee schedules and
 *          rate cards) and the checklist templates that onboarding seeds.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0391; RV-22 (STA-776); config-model section 6.
 */
import { describe, expect, it } from "@stackra/testing";

import { SEED_RECORD_KINDS } from "#node/constants/seed-record-kinds.constant";

describe("SEED_RECORD_KINDS", () => {
  it("is frozen and has no repeated kind", () => {
    expect(Object.isFrozen(SEED_RECORD_KINDS)).toBe(true);
    expect(new Set(SEED_RECORD_KINDS).size).toBe(SEED_RECORD_KINDS.length);
  });

  it("holds the plan-catalogue and checklist kinds", () => {
    expect(SEED_RECORD_KINDS).toEqual(
      expect.arrayContaining([
        "plan-catalogue",
        "price-list",
        "offer",
        "fee-schedule",
        "rate-card",
        "checklist-template",
      ]),
    );
  });
});
