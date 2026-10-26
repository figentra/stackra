/**
 * Stackra file contract:
 * Purpose: unit tests of `entitlementKey`: it returns the key gen registered and refuses an unregistered class rather
 *          than guessing one; a key passes through once its shape is checked (STA-1225).
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

  it("passes a module key or a module.name key through", () => {
    expect(entitlementKey("billing")).toBe("billing");
    expect(entitlementKey("catalogue.product_limit")).toBe("catalogue.product_limit");
  });

  it("refuses a malformed key", () => {
    for (const key of ["", "Billing", "a.b.c", ".sso", "identity.", "identity sso"])
      expect(() => entitlementKey(key)).toThrow(/is not an entitlement key/);
  });
});
