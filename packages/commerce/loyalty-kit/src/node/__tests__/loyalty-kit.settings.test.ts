/**
 * Stackra file contract:
 * Purpose: unit tests of `LoyaltyKitSettings`: a settings group at the platform and the scope level tenancy
 *          contributes, whose resolved defaults are a twelve-month window and the tier thresholds, with the lockable
 *          window, the approval on the tiers and the silver-below-gold rule.
 * Boundary: test only; resolved through `fakeSettings`, so no store runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0307 (rules 22 to 24); ADR 0323 (decision 4).
 */
import { kindOf } from "@stackra/container";
import { Setting, SettingScope } from "@stackra/settings";
import { fakeSettings } from "@stackra/settings/testing";
import { TenancyScopes } from "@stackra/tenancy";
import { describe, expect, it } from "@stackra/testing";

import { LoyaltyKitSettings } from "#node/loyalty-kit.settings";

describe("LoyaltyKitSettings", () => {
  it("is a settings group at the platform and the scope level tenancy contributes", () => {
    expect(kindOf(LoyaltyKitSettings)?.options["scopes"]).toEqual([
      SettingScope.Platform,
      TenancyScopes.Tenant,
    ]);
  });

  it("resolves to a twelve-month window and the default thresholds", async () => {
    const settings = await fakeSettings().get(LoyaltyKitSettings);
    expect(settings.expiryMonths).toBe(12);
    expect(settings.tiers).toEqual({ silverFrom: 1_000, goldFrom: 5_000 });
    expect([settings.stampsPerVisit, settings.stampsPerCard]).toEqual([1, 10]);
  });

  it("locks the window, approves the tiers and keeps silver below gold", () => {
    expect(Setting.members(LoyaltyKitSettings).get("expiryMonths")).toMatchObject({
      lockable: true,
    });
    expect(Setting.members(LoyaltyKitSettings).get("tiers")).toMatchObject({ approval: true });
    const rules = new LoyaltyKitSettings().rules({
      lessThan: (a, b) => ({ kind: "less_than", a, b }),
      atMost: (a, b) => ({ kind: "at_most", a, b }),
      greaterThan: (a, b) => ({ kind: "greater_than", a, b }),
      atLeast: (a, b) => ({ kind: "at_least", a, b }),
    });
    expect(rules).toEqual([{ kind: "less_than", a: "tiers.silverFrom", b: "tiers.goldFrom" }]);
  });
});
