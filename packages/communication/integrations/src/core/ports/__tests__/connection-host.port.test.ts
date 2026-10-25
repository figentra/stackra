/**
 * Stackra file contract:
 * Purpose: unit tests of the `ConnectionHost` port: an abstract class that is a `Port`, so the integrations service's
 *          client can stand in for it.
 * Boundary: test only; the hosted driver's own tests drive a full fake.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0308 (rule 12).
 */
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ConnectionHost } from "#core/ports/connection-host.port";

describe("ConnectionHost", () => {
  it("is a port", () => {
    expect(ConnectionHost.prototype).toBeInstanceOf(Port);
  });
});
