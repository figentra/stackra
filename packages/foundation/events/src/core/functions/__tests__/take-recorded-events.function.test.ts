/**
 * Stackra file contract:
 * Purpose: unit tests of `takeRecordedEvents`: it returns the recorded events once, frozen, and a second take is
 *          empty until the aggregate records again.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 27).
 */
import { describe, expect, it } from "@stackra/testing";

import { DomainEvent } from "#core/bases/domain-event.base";
import { recordEvent } from "#core/functions/record-event.function";
import { takeRecordedEvents } from "#core/functions/take-recorded-events.function";

class StockLow extends DomainEvent {}

describe(takeRecordedEvents, () => {
  it("returns the events once and forgets them", () => {
    const level = {};
    const first = new StockLow();
    recordEvent(level, first);
    const taken = takeRecordedEvents(level);
    expect(taken).toEqual([first]);
    expect(Object.isFrozen(taken)).toBe(true);
    expect(takeRecordedEvents(level)).toEqual([]);
    const second = new StockLow();
    recordEvent(level, second);
    expect(takeRecordedEvents(level)).toEqual([second]);
  });
});
