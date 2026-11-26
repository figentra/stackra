/**
 * Stackra file contract:
 * Purpose: unit tests of `keyCovers`: an exact permission key on the key covers its operation; a selector covers a
 *          public operation unless it is exact-only; a wildcard never counts; a key missing one required scope, a call
 *          with no key, and an operation that requires nothing are refused.
 * Boundary: test only; registers its own fixture permission set for the selectors.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0278 (amendment of 2026-11-09, R1 and R2); STA-2646.
 */
import type { CallCredential } from "@stackra/actions/contracts";
import { Permissions, registerPermissions } from "@stackra/container";
import { Permission } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { keyCovers } from "#core/functions/key-covers.function";

class PaymentPermissions extends Permissions {
  static readonly read = Permission.L1;

  static readonly refund = Permission.L3;
}

registerPermissions([
  {
    type: PaymentPermissions,
    keys: { read: "key_fixture.payment.read", refund: "key_fixture.payment.refund" },
  },
]);

/** A secret key holding `scopes`. */
const key = (...scopes: string[]): CallCredential => ({
  kind: "api_key",
  id: "key_1",
  scopes,
  publishable: false,
});

describe(keyCovers, () => {
  it("covers an operation the key names exactly", () => {
    const call = {
      public: { scopes: ["key_fixture.payment.refund"], exactOnly: true },
      credential: key("key_fixture.payment.refund"),
    };
    expect(keyCovers(call)).toBe(true);
  });

  it("lets a selector cover a public read, but never an exact-only operation", () => {
    const selector = key("key_fixture.@read", "key_fixture.@risk:l3");
    expect(
      keyCovers({
        public: { scopes: ["key_fixture.payment.read"], exactOnly: false },
        credential: selector,
      }),
    ).toBe(true);
    expect(
      keyCovers({
        public: { scopes: ["key_fixture.payment.refund"], exactOnly: true },
        credential: selector,
      }),
    ).toBe(false);
  });

  it("never counts a wildcard on a key", () => {
    expect(
      keyCovers({
        public: { scopes: ["key_fixture.payment.read"], exactOnly: false },
        credential: key("*", "key_fixture.*"),
      }),
    ).toBe(false);
  });

  it("refuses a key missing one required scope, a call with no key, and an operation that requires nothing", () => {
    const both = {
      scopes: ["key_fixture.payment.read", "key_fixture.payment.refund"],
      exactOnly: true,
    };
    expect(keyCovers({ public: both, credential: key("key_fixture.payment.read") })).toBe(false);
    expect(keyCovers({ public: both })).toBe(false);
    expect(keyCovers({ public: { scopes: [], exactOnly: false }, credential: key("x.y.z") })).toBe(
      false,
    );
  });
});
