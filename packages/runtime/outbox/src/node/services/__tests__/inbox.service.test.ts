/**
 * Stackra file contract:
 * Purpose: unit tests of `InboxService`: a received event is rebuilt from its envelope and runs its listeners once with
 *          its id, time and metadata; a redelivery of the id runs nothing; each receipt runs in the event's scope or in
 *          none; an unknown wire name is refused before any claim; `prune` forgets old ids; a connected relay gets every
 *          claimed envelope once (an unknown wire name included), a throwing relay rolls the receipt back and
 *          `disconnect` drops the relays; a
 *          consumed service's event class (an `IntegrationEvent` built by its payload schema, as gen writes it into
 *          `#stackra/clients/<service>`) is rebuilt and delivered to its typed listener; an older version is lifted by
 *          its change's `up` and runs the listener once with the current version, and a newer version than this
 *          process reads is left unclaimed (stackra-403).
 * Boundary: test only; the memory inbox, the real bus with a fixed clock, and a stand-in database that records the
 *           scopes it opens.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0078 (decisions 2 to 4); ADR 0327 (decision 9); ADR 0260 (decision 4).
 */
import type { Clock, ScopeRef } from "@stackra/contracts";
import type { Database } from "@stackra/database";
import { EventBus, IntegrationEvent, Listener, type ListenerContext } from "@stackra/events";
import { describe, expect, it } from "@stackra/testing";
import { registerSchemas } from "@stackra/validation";
import { Change, registerChanges } from "@stackra/versioning";
import { z } from "zod";

import type { EventEnvelope } from "#contracts/index";
import { MemoryInboxDriver } from "#core/drivers/memory-inbox.driver";
import { UnknownEventError } from "#core/errors/unknown-event.error";
import { registerEventNames } from "#core/functions/register-event-names.function";
import { registerRelays } from "#core/functions/register-relays.function";
import { InboxService } from "#node/services/inbox.service";

const NOON = new Date(Date.UTC(2026, 9, 25, 12));

const clock = { now: () => new Date(NOON) } as Clock;

const SCOPE: ScopeRef = { id: "scp_1", path: "platform.acme" };

class OrderPaid extends IntegrationEvent({
  name: "order.paid",
}) {
  orderId!: string;
}

class OrderShipped extends IntegrationEvent({
  name: "order.shipped",
}) {
  orderId!: string;
}

registerSchemas([
  [OrderPaid, z.object({ orderId: z.string() })],
  [OrderShipped, z.object({ orderId: z.string() })],
]);
registerEventNames([{ type: OrderPaid, name: "orders.order.paid.v1" }]);

class RecordingListener extends Listener {
  readonly seen: { event: OrderPaid; ctx: ListenerContext }[] = [];

  async handle(event: OrderPaid, ctx: ListenerContext): Promise<void> {
    this.seen.push({ event, ctx });
  }
}

/** An inbox over a fresh bus with one listener, and the scopes its database opened. */
function inboxWithListener() {
  const bus = new EventBus(clock);
  const listener = new RecordingListener();
  bus.subscribe(OrderPaid, listener);
  const scopes: (ScopeRef | readonly ScopeRef[])[] = [];
  const database = {
    withScope: async <T>(scope: ScopeRef | readonly ScopeRef[], work: () => Promise<T>) => {
      scopes.push(scope);
      return work();
    },
  } as unknown as Database;
  const driver = new MemoryInboxDriver();
  return { inbox: new InboxService(driver, bus, database, clock), listener, scopes, driver };
}

/** A container that binds only `relay`. */
function binding(relay: Listener) {
  return {
    has: (type: unknown) => relay instanceof (type as new () => object),
    get: <T extends object>() => relay as unknown as T,
  };
}

/** The envelope of an `orders.order.paid.v1` occurrence. */
function envelope(fields: Partial<EventEnvelope> = {}): EventEnvelope {
  return {
    id: "evt_A",
    type: "orders.order.paid.v1",
    occurredAt: "2026-10-25T11:59:00.000Z",
    meta: { correlationId: "call-1" },
    data: { orderId: "ord_1" },
    ...fields,
  };
}

describe(InboxService, () => {
  it("runs the listeners of a received event once, with its id, time and metadata", async () => {
    const { inbox, listener } = inboxWithListener();
    await expect(inbox.receive(envelope())).resolves.toBe(true);
    await expect(inbox.receive(envelope())).resolves.toBe(false);
    expect(listener.seen).toHaveLength(1);
    const [seen] = listener.seen;
    expect(seen?.event).toBeInstanceOf(OrderPaid);
    expect(seen?.event.orderId).toBe("ord_1");
    expect(seen?.ctx).toMatchObject({
      eventId: "evt_A",
      occurredAt: new Date("2026-10-25T11:59:00.000Z"),
      correlationId: "call-1",
    });
  });

  it("runs each receipt in the event's scope, or in none", async () => {
    const { inbox, scopes } = inboxWithListener();
    await inbox.receive(envelope({ scope: SCOPE }));
    await inbox.receive(envelope({ id: "evt_B" }));
    expect(scopes).toEqual([SCOPE, []]);
  });

  it("refuses an unknown wire name before claiming the id", async () => {
    const { inbox, driver } = inboxWithListener();
    await expect(
      inbox.receive(envelope({ type: "orders.order.shipped.v1" })),
    ).rejects.toBeInstanceOf(UnknownEventError);
    await expect(driver.claim("evt_A", NOON)).resolves.toBe(true);
  });

  it("forgets the ids received before a cut-off", async () => {
    const { inbox, listener } = inboxWithListener();
    await inbox.receive(envelope());
    await inbox.prune(new Date(NOON.getTime() + 1));
    await expect(inbox.receive(envelope())).resolves.toBe(true);
    expect(listener.seen).toHaveLength(2);
  });

  describe("relays", () => {
    class RecordingRelay extends Listener {
      readonly seen: { envelope: EventEnvelope; ctx: ListenerContext }[] = [];

      async handle(received: EventEnvelope, ctx: ListenerContext): Promise<void> {
        this.seen.push({ envelope: received, ctx });
      }
    }

    class FailingRelay extends Listener {
      async handle(): Promise<void> {
        throw new Error("relay down");
      }
    }

    registerRelays([RecordingRelay, FailingRelay]);

    it("hands every claimed envelope to a connected relay once, an unknown wire name included", async () => {
      const { inbox, listener } = inboxWithListener();
      const relay = new RecordingRelay();
      inbox.connect(binding(relay));
      inbox.connect(binding(relay));
      await expect(inbox.receive(envelope())).resolves.toBe(true);
      await expect(inbox.receive(envelope())).resolves.toBe(false);
      await expect(
        inbox.receive(envelope({ id: "evt_B", type: "orders.order.shipped.v1" })),
      ).resolves.toBe(true);
      expect(relay.seen.map(({ envelope: seen }) => seen.type)).toEqual([
        "orders.order.paid.v1",
        "orders.order.shipped.v1",
      ]);
      expect(relay.seen[0]?.ctx).toMatchObject({ eventId: "evt_A", correlationId: "call-1" });
      expect(listener.seen).toHaveLength(1);
    });

    it("runs no listener when a relay throws, so the receipt rolls back", async () => {
      const { inbox, listener } = inboxWithListener();
      inbox.connect(binding(new FailingRelay()));
      await expect(inbox.receive(envelope())).rejects.toThrow("relay down");
      expect(listener.seen).toHaveLength(0);
    });

    it("hands nothing to a relay after disconnect, and refuses an unknown wire name again", async () => {
      const { inbox } = inboxWithListener();
      const relay = new RecordingRelay();
      inbox.connect(binding(relay));
      inbox.disconnect();
      await expect(inbox.receive(envelope())).resolves.toBe(true);
      await expect(
        inbox.receive(envelope({ id: "evt_B", type: "orders.order.shipped.v1" })),
      ).rejects.toBeInstanceOf(UnknownEventError);
      expect(relay.seen).toHaveLength(0);
    });
  });

  it("rebuilds a consumed service's event class and runs its typed listener", async () => {
    // What gen writes into #stackra/clients/developer: an integration event built by its payload schema.
    const payload = z.object({ appId: z.string() });
    const Base = IntegrationEvent({
      name: "developer.app.approved",
    }) as unknown as new () => object;
    class AppApproved extends Base {
      static create(values: unknown): AppApproved {
        return Object.freeze(
          Object.assign(Object.create(this.prototype) as AppApproved, payload.parse(values)),
        );
      }
    }
    registerEventNames([{ type: AppApproved, name: "developer.app.approved.v1" }]);
    const seen: unknown[] = [];
    class RegistryListener extends Listener {
      async handle(event: AppApproved): Promise<void> {
        seen.push(event);
      }
    }
    const { inbox } = inboxWithListener();
    (inbox as unknown as { bus: EventBus }).bus.subscribe(AppApproved, new RegistryListener());
    await inbox.receive(
      envelope({ id: "evt_C", type: "developer.app.approved.v1", data: { appId: "app_1" } }),
    );
    expect(seen).toHaveLength(1);
    expect(seen[0]).toBeInstanceOf(AppApproved);
    expect({ ...(seen[0] as object) }).toEqual({ appId: "app_1" });
  });

  describe("versions", () => {
    class PointsEarned extends IntegrationEvent({
      name: "points.earned",
      version: 2,
    }) {
      memberId!: string;

      tier!: string;
    }

    class PointsEarnedV1Change extends Change<PointsEarned>({
      from: 1,
      sunset: "2027-04-01",
    }) {
      memberId!: string;

      up(v1: PointsEarnedV1Change): PointsEarned {
        return PointsEarned.create({ memberId: v1.memberId, tier: "bronze" });
      }

      down(v2: PointsEarned): PointsEarnedV1Change {
        return PointsEarnedV1Change.create({ memberId: v2.memberId });
      }
    }

    registerSchemas([
      [PointsEarned, z.object({ memberId: z.string(), tier: z.string() })],
      [PointsEarnedV1Change, z.object({ memberId: z.string() })],
    ]);
    registerEventNames([{ type: PointsEarned, name: "loyalty.points.earned.v2" }]);
    registerChanges([[PointsEarned, PointsEarnedV1Change]]);

    /** An inbox whose bus records every `PointsEarned` it delivers. */
    function versionedInbox() {
      const seen: PointsEarned[] = [];
      class PointsListener extends Listener {
        async handle(event: PointsEarned): Promise<void> {
          seen.push(event);
        }
      }
      const { inbox, driver } = inboxWithListener();
      (inbox as unknown as { bus: EventBus }).bus.subscribe(PointsEarned, new PointsListener());
      return { inbox, driver, seen };
    }

    it("lifts an older version with its change and runs the listener once across both versions", async () => {
      const { inbox, seen } = versionedInbox();
      await expect(
        inbox.receive(
          envelope({ id: "evt_V", type: "loyalty.points.earned.v1", data: { memberId: "mem_1" } }),
        ),
      ).resolves.toBe(true);
      await expect(
        inbox.receive(
          envelope({
            id: "evt_V",
            type: "loyalty.points.earned.v2",
            data: { memberId: "mem_1", tier: "gold" },
          }),
        ),
      ).resolves.toBe(false);
      expect(seen).toHaveLength(1);
      expect(seen[0]).toBeInstanceOf(PointsEarned);
      expect({ ...seen[0] }).toEqual({ memberId: "mem_1", tier: "bronze" });
    });

    it("leaves a newer version unclaimed, so the older copy of the same id still runs", async () => {
      const { inbox, seen } = versionedInbox();
      await expect(
        inbox.receive(envelope({ id: "evt_W", type: "loyalty.points.earned.v3", data: {} })),
      ).resolves.toBe(false);
      await expect(
        inbox.receive(
          envelope({
            id: "evt_W",
            type: "loyalty.points.earned.v2",
            data: { memberId: "mem_1", tier: "gold" },
          }),
        ),
      ).resolves.toBe(true);
      expect(seen).toHaveLength(1);
    });
  });
});
