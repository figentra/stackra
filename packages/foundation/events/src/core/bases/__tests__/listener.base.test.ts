/**
 * Stackra file contract:
 * Purpose: unit and type tests of `Listener`: both forms (`extends Listener`, `extends Listener({ queue, retry })`)
 *          are the `listener` kind, with the options recorded; a bad queue or retry is refused; `handle` must be
 *          implemented and may type its event parameter; constructor dependencies reach the subclass.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 16; amendment item 5).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { DomainEvent } from "#core/bases/domain-event.base";
import { Listener } from "#core/bases/listener.base";
import type { ListenerClass } from "#core/types/listener-class.type";
import type { ListenerContext } from "#core/types/listener-context.type";

class PointsRedeemed extends DomainEvent {
  points!: number;
}

class Ledger {
  readonly entries: number[] = [];
}

class RecordRedemptionListener extends Listener {
  readonly ledger: Ledger;

  constructor(ledger: Ledger) {
    super();
    this.ledger = ledger;
  }

  async handle(event: PointsRedeemed, _ctx: ListenerContext): Promise<void> {
    this.ledger.entries.push(event.points);
  }
}

class QueuedListener extends Listener({
  queue: "default",
  retry: { attempts: 3 },
}) {
  async handle(_event: PointsRedeemed): Promise<void> {}
}

describe("Listener", () => {
  it("is the listener kind in both forms", () => {
    expect(kindOf(RecordRedemptionListener)).toEqual({ kind: "listener", options: {} });
    expect(kindOf(QueuedListener)).toEqual({
      kind: "listener",
      options: { queue: "default", retry: { attempts: 3 } },
    });
  });

  it("refuses an empty queue or a bad retry count", () => {
    expect(() => Listener({ queue: "" })).toThrow(TypeError);
    expect(() => Listener({ retry: { attempts: 0 } })).toThrow(RangeError);
    expect(() => Listener({ retry: { attempts: 1.5 } })).toThrow(RangeError);
  });

  it("passes constructor dependencies to the subclass", async () => {
    const ledger = new Ledger();
    const listener = new RecordRedemptionListener(ledger);
    expect(listener).toBeInstanceOf(Listener);
    await listener.handle(Object.assign(Object.create(PointsRedeemed.prototype), { points: 4 }), {
      eventId: "evt_1",
      occurredAt: new Date(0),
      now: () => new Date(0),
    });
    expect(ledger.entries).toEqual([4]);
  });

  it("makes a subclass implement handle", () => {
    // @ts-expect-error -- handle is abstract and not implemented
    class Empty extends Listener {}
    expect(Empty).toBeTypeOf("function");
    expectTypeOf(Listener({ queue: "default" })).toEqualTypeOf<ListenerClass>();
  });
});
