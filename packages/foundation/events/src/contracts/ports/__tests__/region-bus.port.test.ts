/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `RegionBus` port: abstract, a `Port`, implemented by a driver that must
 *          implement `send`, and usable as a container token.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0263 (ports resolve by type); STA-1268.
 */
import { Container, Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { RegionBus } from "#contracts/ports/region-bus.port";
import type { RecordedEvent } from "#contracts/types/recorded-event.type";

class MemoryRegionBusDriver extends Driver(RegionBus) {
  readonly sent: RecordedEvent[] = [];

  async send(records: readonly RecordedEvent[]): Promise<void> {
    this.sent.push(...records);
  }
}

describe("RegionBus", () => {
  it("is an abstract port", () => {
    expect(new MemoryRegionBusDriver()).toBeInstanceOf(Port);
    expect(new MemoryRegionBusDriver()).toBeInstanceOf(RegionBus);
    expectTypeOf<RegionBus["~kind"]>().toEqualTypeOf<"port">();
  });

  it("makes a driver implement send", () => {
    // @ts-expect-error -- send is abstract and not implemented
    class EmptyDriver extends Driver(RegionBus) {}
    expect(EmptyDriver).toBeTypeOf("function");
  });

  it("is a container token", async () => {
    const bus = new MemoryRegionBusDriver();
    const container = await Container.create([], { overrides: new Map([[RegionBus, bus]]) });
    const record = { event: {}, meta: { id: "evt_1", occurredAt: new Date(0) } };
    await container.get(RegionBus).send([record]);
    expect(bus.sent).toEqual([record]);
  });
});
