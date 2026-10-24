/**
 * Stackra file contract:
 * Purpose: unit tests of the `ScopeResolver` port: it is an abstract `Port` and a driver answers a scope for a request
 *          or `undefined` to pass it on.
 * Boundary: test only; the driver here is a stand-in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0327 (decision 7).
 */
import { Driver } from "@stackra/container";
import { ActorKind, Port, Realm } from "@stackra/contracts";
import type { ScopeRef } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ScopeResolver } from "#contracts/ports/scope-resolver.port";
import type { ScopeRequest } from "#contracts/types/scope-request.type";

const ACME: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w4", path: "platform.acme" };

class FixedScopeResolverDriver extends Driver(ScopeResolver) {
  async resolve(request: ScopeRequest): Promise<ScopeRef | undefined> {
    return request.claim === ACME.path ? ACME : undefined;
  }
}

const actor = {
  kind: ActorKind.User,
  id: "usr_01j9z3k4m5n6p7q8r9s0t1v2w3",
  realm: Realm.Platform,
} as const;

describe("ScopeResolver", () => {
  it("is an abstract port", () => {
    expect(ScopeResolver.prototype).toBeInstanceOf(Port);
  });

  it("is implemented by a driver that answers or passes", async () => {
    const resolver: ScopeResolver = new FixedScopeResolverDriver();
    await expect(resolver.resolve({ actor, claim: "platform.acme" })).resolves.toBe(ACME);
    await expect(resolver.resolve({ actor })).resolves.toBeUndefined();
  });
});
