/**
 * Stackra file contract:
 * Purpose: unit tests of `ConnectionResolver` and `PrimaryConnectionResolverDriver`: the port is an abstract `Port`
 *          (its own token) and the free driver answers `PRIMARY_CONNECTION` for any scope and for platform work.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0088 (decision 3);
 *                     stackra-310.
 */
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { PRIMARY_CONNECTION } from "#contracts/constants/primary-connection.constant";
import { ConnectionResolver } from "#contracts/ports/connection-resolver.port";
import { PrimaryConnectionResolverDriver } from "#node/drivers/primary-connection-resolver.driver";

describe("PrimaryConnectionResolverDriver", () => {
  it("drives the ConnectionResolver port", () => {
    expect(ConnectionResolver.prototype).toBeInstanceOf(Port);
    expect(new PrimaryConnectionResolverDriver()).toBeInstanceOf(ConnectionResolver);
  });

  it("serves every scope and platform work from the primary", async () => {
    const resolver: ConnectionResolver = new PrimaryConnectionResolverDriver();
    expect(PRIMARY_CONNECTION).toBe("primary");
    await expect(
      resolver.connectionOf({ id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w2", path: "platform.acme" }),
    ).resolves.toBe(PRIMARY_CONNECTION);
    await expect(resolver.connectionOf(undefined)).resolves.toBe(PRIMARY_CONNECTION);
  });
});
