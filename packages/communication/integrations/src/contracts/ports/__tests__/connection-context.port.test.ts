/**
 * Stackra file contract:
 * Purpose: unit tests of the `ConnectionContext` port: an abstract class that is a `Port`, implemented by a driver
 *          that answers the call's scope node and user.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0308 (rule 9); ADR 0327 (decisions 5 and 6).
 */
import { Driver } from "@stackra/container";
import { Port, type PublicId, type ScopeRef } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ConnectionContext } from "#contracts/ports/connection-context.port";

class FixedConnectionContextDriver extends Driver(ConnectionContext) {
  scope(): ScopeRef {
    return { id: "scp_00000000000000000000000001", path: "root.acme" };
  }

  user(): PublicId<"usr"> | undefined {
    return undefined;
  }
}

describe("ConnectionContext", () => {
  it("is a port a driver implements", () => {
    const context = new FixedConnectionContextDriver();
    expect(context).toBeInstanceOf(ConnectionContext);
    expect(context).toBeInstanceOf(Port);
    expect(context.scope().path).toBe("root.acme");
    expect(context.user()).toBeUndefined();
  });
});
