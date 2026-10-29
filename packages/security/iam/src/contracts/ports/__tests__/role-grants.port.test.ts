/**
 * Stackra file contract:
 * Purpose: unit test of the `RoleGrants` port: an abstract class that extends `Port`, so a driver of it is an instance
 *          of both and works as its constructor token, and a driver answers whether it wrote the grant.
 * Boundary: test only; the driver is a minimal subclass that keeps grants in a set.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0263 (ports resolve by type); STA-1586.
 */
import { Driver } from "@stackra/container";
import { Port, type PublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { RoleGrants } from "#contracts/ports/role-grants.port";
import type { Grant } from "#contracts/types/grant.type";

/** Keeps each principal, role and node once. */
class SetRoleGrantsDriver extends Driver(RoleGrants) {
  readonly held = new Set<string>();

  grant(principal: PublicId, grant: Grant): Promise<boolean> {
    const key = `${principal}:${grant.role}:${grant.scope.path}`;
    const written = !this.held.has(key);
    this.held.add(key);
    return Promise.resolve(written);
  }
}

const ROOT = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform" } as const;

describe("RoleGrants", () => {
  it("is a port its drivers extend, answering whether it wrote", async () => {
    const grants: RoleGrants = new SetRoleGrantsDriver();
    expect(grants).toBeInstanceOf(RoleGrants);
    expect(grants).toBeInstanceOf(Port);
    expect(await grants.grant("usr_1", { role: "owner", scope: ROOT })).toBe(true);
    expect(await grants.grant("usr_1", { role: "owner", scope: ROOT })).toBe(false);
  });
});
