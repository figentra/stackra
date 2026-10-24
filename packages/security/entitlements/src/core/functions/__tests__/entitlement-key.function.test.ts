/**
 * Stackra file contract:
 * Purpose: unit tests of `entitlementKey`: it returns the key gen registered and refuses an unregistered class rather
 *          than guessing one.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 20).
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { Entitlement } from "#core/bases/entitlement.base";
import { ENTITLEMENT_REGISTRY } from "#core/constants/entitlement-registry.constant";
import { EntitlementKind } from "#core/enums/entitlement-kind.enum";
import { entitlementKey } from "#core/functions/entitlement-key.function";
import { registerEntitlements } from "#core/functions/register-entitlements.function";

class SsoEntitlement extends Entitlement({ kind: EntitlementKind.Feature }) {}

describe("entitlementKey", () => {
  beforeEach(() => ENTITLEMENT_REGISTRY.clear());

  it("returns the registered key", () => {
    registerEntitlements([{ type: SsoEntitlement, key: "identity.sso", gates: [] }]);
    expect(entitlementKey(SsoEntitlement)).toBe("identity.sso");
  });

  it("refuses a class gen has not registered", () => {
    expect(() => entitlementKey(SsoEntitlement)).toThrow(/SsoEntitlement is not registered/);
  });
});
