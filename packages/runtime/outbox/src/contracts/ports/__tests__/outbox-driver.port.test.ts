/**
 * Stackra file contract:
 * Purpose: unit tests of the `OutboxDriver` port: it is a `Port` whose class is its token, keyed `outbox.OutboxDriver`,
 *          a driver subclass implements its six methods, and a stored message carries what the relay needs.
 * Boundary: test only; a minimal in-test driver stands in for a real one.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0142 (drivers behind ports); ADR 0078 (decision 4).
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import type { PublicId, ScopeRef } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { MessageKind } from "#contracts/enums/message-kind.enum";
import { OutboxDriver } from "#contracts/ports/outbox-driver.port";
import type { OutboxMessage } from "#contracts/types/outbox-message.type";

/** A driver that stores nothing. */
class NullOutboxDriver extends Driver(OutboxDriver) {
  async write(): Promise<void> {}

  async due(): Promise<readonly OutboxMessage[]> {
    return [];
  }

  async remove(): Promise<void> {}

  async retry(): Promise<void> {}

  async deadLetter(): Promise<void> {}

  async pruneDead(): Promise<number> {
    return 0;
  }

  async holding(): Promise<readonly OutboxMessage[]> {
    return [];
  }

  async rewrite(): Promise<void> {}
}

describe("OutboxDriver", () => {
  it("is a port a driver implements", async () => {
    const driver: OutboxDriver = new NullOutboxDriver();
    expect(driver).toBeInstanceOf(OutboxDriver);
    expect(driver).toBeInstanceOf(Port);
    await expect(driver.due(new Date(), 10)).resolves.toEqual([]);
  });

  it("is keyed outbox.OutboxDriver", () => {
    expectTypeOf<OutboxDriver["~key"]>().toEqualTypeOf<"outbox.OutboxDriver">();
  });

  it("stores what, where and when for each message", () => {
    expectTypeOf<OutboxMessage["id"]>().toEqualTypeOf<PublicId<"evt">>();
    expectTypeOf<OutboxMessage["kind"]>().toEqualTypeOf<MessageKind>();
    expectTypeOf<OutboxMessage["scope"]>().toEqualTypeOf<ScopeRef | undefined>();
    expectTypeOf<OutboxMessage["availableAt"]>().toEqualTypeOf<Date>();
    expectTypeOf<OutboxMessage["deadAt"]>().toEqualTypeOf<Date | undefined>();
  });
});
