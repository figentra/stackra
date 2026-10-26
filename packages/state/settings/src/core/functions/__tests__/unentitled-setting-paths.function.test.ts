/**
 * Stackra file contract:
 * Purpose: unit tests of `unentitledSettingPaths` and `refuseUnentitledSettings`: a key gate refuses every value
 *          without its grant, a value gate refuses only the gated value, a granted gate and an ungated key pass, and
 *          the refusal is `entitlement_required` with a field error per path.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0420 (decisions 1 and 3).
 */
import type { I18nKey } from "@stackra/i18n";
import { EntitlementRequiredError } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { SettingType } from "#core/enums/setting-type.enum";
import { refuseUnentitledSettings } from "#core/functions/refuse-unentitled-settings.function";
import { unentitledSettingPaths } from "#core/functions/unentitled-setting-paths.function";
import type { SettingKey } from "#core/types/setting-key.type";

const label = "access::settings.x.label" as I18nKey;
const KEYS: readonly SettingKey[] = [
  {
    type: SettingType.Boolean,
    default: false,
    scopes: ["platform"],
    label,
    module: "access",
    name: "ssoEnforced",
    path: "access.ssoEnforced",
    entitlement: "access.sso",
  },
  {
    type: SettingType.String,
    default: "hour",
    scopes: ["platform"],
    label,
    module: "access",
    name: "length",
    section: "support",
    path: "access.support.length",
    entitlementValues: { unlimited: "access.enterprise_support" },
  },
  {
    type: SettingType.Integer,
    default: 5,
    scopes: ["platform"],
    label,
    module: "access",
    name: "seats",
    path: "access.seats",
  },
];

describe(unentitledSettingPaths, () => {
  it("names a key-gated path and a gated value without their grants", () => {
    expect(
      unentitledSettingPaths(
        { ssoEnforced: false, "support.length": "unlimited", seats: 9 },
        KEYS,
        new Set(),
      ),
    ).toEqual(["ssoEnforced", "support.length"]);
  });

  it("passes an ungated value of a value-gated key and every granted gate", () => {
    expect(unentitledSettingPaths({ "support.length": "day" }, KEYS, new Set())).toEqual([]);
    expect(
      unentitledSettingPaths(
        { ssoEnforced: true, "support.length": "unlimited" },
        KEYS,
        new Set(["access.sso", "access.enterprise_support"]),
      ),
    ).toEqual([]);
  });
});

describe(refuseUnentitledSettings, () => {
  it("refuses with entitlement_required and a field error per path", () => {
    let refused: unknown;
    try {
      refuseUnentitledSettings({ ssoEnforced: true }, KEYS, new Set());
    } catch (error) {
      refused = error;
    }
    expect(refused).toBeInstanceOf(EntitlementRequiredError);
    expect((refused as EntitlementRequiredError).fieldErrors).toEqual({
      ssoEnforced: "entitlement_required",
    });
  });

  it("lets an unlocked write through", () => {
    expect(() => refuseUnentitledSettings({ seats: 3 }, KEYS, new Set())).not.toThrow();
  });
});
