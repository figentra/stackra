/**
 * Stackra file contract:
 * Purpose: unit tests of the `ConnectionStore` port: an abstract class that is a `Port`, and both drivers are
 *          instances of it.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0308 (rule 12).
 */
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { HostedConnectionStoreDriver } from "#core/drivers/hosted-connection-store.driver";
import { LocalConnectionStoreDriver } from "#core/drivers/local-connection-store.driver";
import { ConnectionStore } from "#core/ports/connection-store.port";

describe("ConnectionStore", () => {
  it("is a port both drivers implement", () => {
    expect(ConnectionStore.prototype).toBeInstanceOf(Port);
    expect(LocalConnectionStoreDriver.prototype).toBeInstanceOf(ConnectionStore);
    expect(HostedConnectionStoreDriver.prototype).toBeInstanceOf(ConnectionStore);
  });
});
