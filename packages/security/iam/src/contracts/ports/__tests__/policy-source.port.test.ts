/**
 * Stackra file contract:
 * Purpose: unit test of the `PolicySource` port: an abstract class that extends `Port`, so a driver of it is an
 *          instance of both and works as its constructor token.
 * Boundary: test only; the driver is a minimal subclass that answers an empty snapshot.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0263 (ports resolve by type).
 */
import { Driver } from "@stackra/container";
import { type Actor, ActorKind, Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { PolicySource } from "#contracts/ports/policy-source.port";
import type { PolicySnapshot } from "#contracts/types/policy-snapshot.type";

/** Answers every principal nothing. */
class EmptyPolicySourceDriver extends Driver(PolicySource) {
  snapshot(): Promise<PolicySnapshot> {
    return Promise.resolve({
      version: 0,
      grants: [],
      roles: {},
      segments: [],
      denies: [],
      visibility: [],
    });
  }
}

const visitor: Actor = { kind: ActorKind.Anonymous, id: "anon_01j9z3k4m5n6p7q8r9s0t1v2a1" };

describe("PolicySource", () => {
  it("is a port its drivers extend", async () => {
    const source = new EmptyPolicySourceDriver();
    expect(source).toBeInstanceOf(PolicySource);
    expect(source).toBeInstanceOf(Port);
    expect((await source.snapshot(visitor)).grants).toEqual([]);
  });
});
