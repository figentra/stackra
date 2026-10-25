/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `EventOutbox` port: abstract, a `Port`, implemented by a driver that must
 *          implement `write`, and usable as a container token.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0078 (decision 4); ADR 0263 (ports resolve by type).
 */
import { Container, Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { EventOutbox } from "#contracts/ports/event-outbox.port";
import type { RecordedEvent } from "#contracts/types/recorded-event.type";

class MemoryEventOutboxDriver extends Driver(EventOutbox) {
  readonly rows: RecordedEvent[] = [];

  async write(records: readonly RecordedEvent[]): Promise<void> {
    this.rows.push(...records);
  }
}

describe("EventOutbox", () => {
  it("is an abstract port", () => {
    expect(new MemoryEventOutboxDriver()).toBeInstanceOf(Port);
    expect(new MemoryEventOutboxDriver()).toBeInstanceOf(EventOutbox);
    expectTypeOf<EventOutbox["~kind"]>().toEqualTypeOf<"port">();
  });

  it("makes a driver implement write", () => {
    // @ts-expect-error -- write is abstract and not implemented
    class EmptyDriver extends Driver(EventOutbox) {}
    expect(EmptyDriver).toBeTypeOf("function");
  });

  it("is a container token", async () => {
    const outbox = new MemoryEventOutboxDriver();
    const container = await Container.create([], { overrides: new Map([[EventOutbox, outbox]]) });
    const record = { event: {}, meta: { id: "evt_1", occurredAt: new Date(0) } };
    await container.get(EventOutbox).write([record]);
    expect(outbox.rows).toEqual([record]);
  });
});
