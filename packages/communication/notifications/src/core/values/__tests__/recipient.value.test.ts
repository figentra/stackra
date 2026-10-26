/**
 * Stackra file contract:
 * Purpose: unit tests of `Recipient`: a principal recipient and a scope recipient hold only their id, are frozen, and
 *          compare equal to another recipient of the same principal or scope; an address recipient is trimmed,
 *          lower-cased and checked.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0223; ADR 0135 (public ids).
 */
import type { ScopeRef } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { Recipient } from "#core/values/recipient.value";

const CUSTOMER = "usr_01j9z3k4m5n6p7q8r9s0t1v2w3" as const;

describe("Recipient", () => {
  it("addresses one principal by public id", () => {
    const recipient = Recipient.principal(CUSTOMER);
    expect(recipient.principalId).toBe(CUSTOMER);
    expect(recipient.scopeId).toBeNull();
    expect(recipient).toEqual(Recipient.principal(CUSTOMER));
    expect(recipient).not.toEqual(Recipient.principal("usr_01j9z3k4m5n6p7q8r9s0t1v2w4"));
  });

  it("addresses a scope by its id alone", () => {
    const scope: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w3", path: "platform.acme" };
    const recipient = Recipient.scope(scope);
    expect(recipient.scopeId).toBe(scope.id);
    expect(recipient.principalId).toBeNull();
    expect({ ...recipient }).toEqual({ principalId: null, scopeId: scope.id, email: null });
  });

  it("addresses a mail address with no account, trimmed and lower-cased", () => {
    const recipient = Recipient.address("  Sara@Example.COM ");
    expect({ ...recipient }).toEqual({
      principalId: null,
      scopeId: null,
      email: "sara@example.com",
    });
    expect(recipient).toEqual(Recipient.address("sara@example.com"));
    expect(Recipient.principal(CUSTOMER).email).toBeNull();
  });

  it("refuses an address that is not one mail address", () => {
    expect(() => Recipient.address("sara")).toThrow(RangeError);
    expect(() => Recipient.address("a@b.co, c@d.co")).toThrow(RangeError);
  });

  it("is frozen", () => {
    expect(Object.isFrozen(Recipient.principal(CUSTOMER))).toBe(true);
  });
});
