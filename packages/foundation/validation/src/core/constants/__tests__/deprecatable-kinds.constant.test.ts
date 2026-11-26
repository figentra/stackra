/**
 * Stackra file contract:
 * Purpose: unit tests of `DEPRECATABLE_KINDS`: every identity kind, a settings group and a service, sorted, frozen and
 *          without duplicates.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0131 (decision 4); STA-2836.
 */
import { describe, expect, it } from "@stackra/testing";

import { DEPRECATABLE_KINDS } from "#core/constants/deprecatable-kinds.constant";
import { IDENTITY_KINDS } from "#core/constants/identity-kinds.constant";

describe("DEPRECATABLE_KINDS", () => {
  it("holds every identity kind, settings and service, sorted and frozen", () => {
    expect(DEPRECATABLE_KINDS).toEqual(
      expect.arrayContaining([...IDENTITY_KINDS, "settings", "service"]),
    );
    expect(DEPRECATABLE_KINDS).toHaveLength(IDENTITY_KINDS.length + 2);
    expect([...DEPRECATABLE_KINDS].sort()).toEqual(DEPRECATABLE_KINDS);
    expect(Object.isFrozen(DEPRECATABLE_KINDS)).toBe(true);
  });
});
