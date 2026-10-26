/**
 * Stackra file contract:
 * Purpose: unit tests of `isEntitled`: a feature or module granted `true`, a count, a soft limit or a value is
 *          entitled; `false` or not in the plan is not; a key and its class give the same answer.
 * Boundary: test only; the source is `fakeEntitlements`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0215 (decisions 1 and 3); STA-1225.
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { Entitlement } from "#core/bases/entitlement.base";
import { ENTITLEMENT_REGISTRY } from "#core/constants/entitlement-registry.constant";
import { EntitlementKind } from "#core/enums/entitlement-kind.enum";
import { isEntitled } from "#core/functions/is-entitled.function";
import { registerEntitlements } from "#core/functions/register-entitlements.function";
import { fakeEntitlements } from "#testing/functions/fake-entitlements.function";

class BillingEntitlement extends Entitlement({ kind: EntitlementKind.Module }) {}

describe("isEntitled", () => {
  beforeEach(() => {
    ENTITLEMENT_REGISTRY.clear();
    registerEntitlements([{ type: BillingEntitlement, key: "billing", gates: [] }]);
  });

  it("is true for any grant in the plan", async () => {
    for (const grant of [true, 0, 5, { limit: 2 }])
      expect(await isEntitled(fakeEntitlements([["billing", grant]]), "billing", "org_1")).toBe(
        true,
      );
  });

  it("is false for false or not in the plan", async () => {
    expect(await isEntitled(fakeEntitlements([["billing", false]]), "billing", "org_1")).toBe(
      false,
    );
    expect(await isEntitled(fakeEntitlements(), "billing", "org_1")).toBe(false);
  });

  it("answers a key and its class the same", async () => {
    const source = fakeEntitlements([[BillingEntitlement, true]]);
    expect(await isEntitled(source, "billing", undefined)).toBe(true);
    expect(await isEntitled(source, BillingEntitlement, undefined)).toBe(true);
  });
});
