/**
 * Stackra file contract:
 * Purpose: unit tests of `toRecord`: it passes for a list of events or recorded events holding the class with the
 *          given fields, or an object whose `events` is such a list (a `run()` result), `.not` inverts it, the
 *          failure message names what was recorded, and any other received value is refused.
 * Boundary: test only; importing the matcher registers it with `expect`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { DomainEvent } from "#core/index";
import { toRecord } from "#testing/to-record.matcher";

class StockLow extends DomainEvent {
  available!: number;
}

class OrderPaid extends DomainEvent {}

const low = Object.assign(new StockLow(), { available: 2 });

describe(toRecord, () => {
  it("passes for a list holding the event with the fields", () => {
    expect([low]).toRecord(StockLow, { available: 2 });
    expect([{ event: low, meta: { id: "evt_1", occurredAt: new Date(0) } }]).toRecord(StockLow);
    expect([low]).not.toRecord(StockLow, { available: 3 });
    expect([low]).not.toRecord(OrderPaid);
  });

  it("reads the events of a run() result", () => {
    const result = { output: { expired: 1 }, events: [low] };
    expect(result).toRecord(StockLow, { available: 2 });
    expect({ output: {}, events: [] }).not.toRecord(StockLow);
  });

  it("names what was recorded on failure", () => {
    expect(() => expect([low]).toRecord(OrderPaid)).toThrow(
      /to record OrderPaid .*recorded \[StockLow\]/,
    );
  });

  it("refuses a value that is neither a list nor a run() result", () => {
    expect(() => expect(low as never).toRecord(StockLow)).toThrow(TypeError);
    expect(() => expect({ events: "none" } as never).toRecord(StockLow)).toThrow(TypeError);
  });
});
