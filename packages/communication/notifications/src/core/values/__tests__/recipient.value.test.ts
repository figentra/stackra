/**
 * Stackra file contract:
 * Purpose: unit tests of `Recipient`: a principal recipient and a scope recipient hold only their id, are frozen, and
 *          compare equal to another recipient of the same principal or scope.
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
    expect({ ...recipient }).toEqual({ principalId: null, scopeId: scope.id });
  });

  it("is frozen", () => {
    expect(Object.isFrozen(Recipient.principal(CUSTOMER))).toBe(true);
  });
});
