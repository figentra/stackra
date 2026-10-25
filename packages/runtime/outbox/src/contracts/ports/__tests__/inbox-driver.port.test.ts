/**
 * Stackra file contract:
 * Purpose: unit tests of the `InboxDriver` port: it is a `Port` whose class is its token, keyed `outbox.InboxDriver`,
 *          and a driver subclass implements `claim` and `prune`.
 * Boundary: test only; a minimal in-test driver stands in for a real one.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0078 (decision 4: inbox deduplication by event id).
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { InboxDriver } from "#contracts/ports/inbox-driver.port";

/** A driver that claims every id. */
class OpenInboxDriver extends Driver(InboxDriver) {
  async claim(): Promise<boolean> {
    return true;
  }

  async prune(): Promise<void> {}
}

describe("InboxDriver", () => {
  it("is a port a driver implements", async () => {
    const driver: InboxDriver = new OpenInboxDriver();
    expect(driver).toBeInstanceOf(InboxDriver);
    expect(driver).toBeInstanceOf(Port);
    await expect(driver.claim("evt_1", new Date())).resolves.toBe(true);
  });

  it("is keyed outbox.InboxDriver", () => {
    expectTypeOf<InboxDriver["~key"]>().toEqualTypeOf<"outbox.InboxDriver">();
  });
});
