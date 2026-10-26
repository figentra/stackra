/**
 * Stackra file contract:
 * Purpose: unit test of the `RolesAtNode` port: an abstract class that extends `Port`, so a driver of it is an
 *          instance of both and works as its constructor token.
 * Boundary: test only; the driver is a minimal subclass that answers no role.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0263 (ports resolve by type); STA-1271.
 */
import { Driver } from "@stackra/container";
import { type Actor, ActorKind, Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { RolesAtNode } from "#contracts/ports/roles-at-node.port";

/** Answers every principal no role. */
class NoRolesAtNodeDriver extends Driver(RolesAtNode) {
  of(): Promise<ReadonlySet<string>> {
    return Promise.resolve(new Set());
  }
}

const visitor: Actor = { kind: ActorKind.Anonymous, id: "anon_01j9z3k4m5n6p7q8r9s0t1v2a1" };

describe("RolesAtNode", () => {
  it("is a port its drivers extend", async () => {
    const roles = new NoRolesAtNodeDriver();
    expect(roles).toBeInstanceOf(RolesAtNode);
    expect(roles).toBeInstanceOf(Port);
    expect(
      await roles.of(visitor, { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform" }),
    ).toEqual(new Set());
  });
});
