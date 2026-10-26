/**
 * Stackra file contract:
 * Purpose: unit tests of `BILLING_PACK_KEYS`: every key is a dotted lowercase market-pack entry key under billing.
 * Boundary: test only; rows and pack values are test data standing in for seed-pack and market-pack records.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0392.
 */
import { describe, expect, it } from "@stackra/testing";

import { BILLING_PACK_KEYS } from "#core/constants/billing-pack-keys.constant";

describe("BILLING_PACK_KEYS", () => {
  it("holds pack entry keys under billing", () => {
    for (const key of Object.values(BILLING_PACK_KEYS)) expect(key).toMatch(/^billing\.[a-z_]+$/);
    expect(Object.isFrozen(BILLING_PACK_KEYS)).toBe(true);
  });
});
