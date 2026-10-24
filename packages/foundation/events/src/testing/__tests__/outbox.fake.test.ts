/**
 * Stackra file contract:
 * Purpose: unit tests of `OutboxFake`: it is an `EventOutbox`, keeps writes for `take()` (once), remembers every write
 *          in `written()` and records each call.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 2: port fakes).
 */
import { describe, expect, it } from "@stackra/testing";

import { EventOutbox } from "#contracts/index";
import { OutboxFake } from "#testing/outbox.fake";

const first = { event: {}, meta: { id: "evt_1", occurredAt: new Date(0) } };
const second = { event: {}, meta: { id: "evt_2", occurredAt: new Date(1) } };

describe("OutboxFake", () => {
  it("is an EventOutbox", () => {
    expect(new OutboxFake()).toBeInstanceOf(EventOutbox);
  });

  it("keeps writes for one take and remembers them all", async () => {
    const outbox = new OutboxFake();
    await outbox.write([first]);
    await outbox.write([second]);

    expect(outbox.take()).toEqual([first, second]);
    expect(outbox.take()).toEqual([]);
    expect(outbox.written()).toEqual([first, second]);
    expect(outbox.calls("write")).toEqual([[first], [second]]);
  });
});
