/**
 * Stackra file contract:
 * Purpose: unit tests of `LoyaltyTierSettings`: a registered section whose initializers are the thresholds' defaults,
 *          with `goldFrom` lockable.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0307 (rules 22 to 24); ADR 0328.
 */
import { Setting } from "@stackra/settings";
import { describe, expect, it } from "@stackra/testing";

import { LoyaltyTierSettings } from "#node/schemas/loyalty-tier-settings.schema";

describe("LoyaltyTierSettings", () => {
  it("defaults silver to 1 000 and gold to 5 000 points", () => {
    expect({ ...new LoyaltyTierSettings() }).toEqual({ silverFrom: 1000, goldFrom: 5000 });
    expect(LoyaltyTierSettings.create({ silverFrom: 10, goldFrom: 20 }).goldFrom).toBe(20);
  });

  it("lets the platform lock the gold threshold", () => {
    expect(Setting.members(LoyaltyTierSettings).get("goldFrom")).toMatchObject({ lockable: true });
  });
});
