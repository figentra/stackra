/**
 * Stackra file contract:
 * Purpose: unit tests of `recordEvent`: events are kept per aggregate in record order and never on the aggregate
 *          itself, so its own fields and JSON stay untouched.
 * Boundary: test only; reads the recording back with `takeRecordedEvents`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 27).
 */
import { describe, expect, it } from "@stackra/testing";

import { DomainEvent } from "#core/bases/domain-event.base";
import { recordEvent } from "#core/functions/record-event.function";
import { takeRecordedEvents } from "#core/functions/take-recorded-events.function";

class OrderPlaced extends DomainEvent {}

class OrderPaid extends DomainEvent {}

describe(recordEvent, () => {
  it("keeps events per aggregate in order, off the aggregate", () => {
    const order = { id: "ord_1" };
    const other = { id: "ord_2" };
    const placed = new OrderPlaced();
    const paid = new OrderPaid();
    recordEvent(order, placed);
    recordEvent(order, paid);
    expect(Object.keys(order)).toEqual(["id"]);
    expect(JSON.stringify(order)).toBe('{"id":"ord_1"}');
    expect(takeRecordedEvents(other)).toEqual([]);
    expect(takeRecordedEvents(order)).toStrictEqual([placed, paid]);
  });
});
