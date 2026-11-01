/**
 * Stackra file contract:
 * Purpose: unit tests of `OutboxListenerAuditTrailDriver`: it is `@stackra/events`' `ListenerAuditTrail`; each entry is
 *          written as one `AuditEntryRecorded` keyed `listener:<Listener>` with the event's id as the call id, the
 *          handling system actor, the tenant and the listener's fields plus the event's name and who caused it, and
 *          metadata correlated and caused by the event.
 * Boundary: test only; a recording EventOutbox.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0212; ADR 0136 (decision 5); STA-1715.
 */
import { Driver } from "@stackra/container";
import { ActorKind, Realm } from "@stackra/contracts";
import type { Actor, PublicId } from "@stackra/contracts";
import { EventOutbox, ListenerAuditTrail } from "@stackra/events/contracts";
import type { RecordedEvent } from "@stackra/events/contracts";
import { describe, expect, it } from "@stackra/testing";

import { OutboxListenerAuditTrailDriver } from "#core/drivers/outbox-listener-audit-trail.driver";
import { AuditEntryRecorded } from "#core/events/audit-entry-recorded.event";

class Outbox extends Driver(EventOutbox) {
  readonly written: RecordedEvent[] = [];

  async write(records: readonly RecordedEvent[]): Promise<void> {
    this.written.push(...records);
  }
}

describe(OutboxListenerAuditTrailDriver, () => {
  it("writes each delivery as an AuditEntryRecorded event keyed by its listener", async () => {
    const outbox = new Outbox();
    const trail = new OutboxListenerAuditTrailDriver(outbox);
    expect(trail).toBeInstanceOf(ListenerAuditTrail);
    const handler: Actor = { kind: ActorKind.System, id: "sys_listener" as PublicId };
    const owner: Actor = { kind: ActorKind.User, id: "usr_1", realm: Realm.Customer };
    const at = new Date("2026-10-31T09:00:00.000Z");
    await trail.record({
      listener: "IssueDeviceCredentialListener",
      event: "devices.device.paired.v1",
      eventId: "evt_paired",
      actor: handler,
      causedBy: owner,
      scopeId: "ten_1",
      at,
      fields: { credentialId: "crd_1" },
    });
    const [record] = outbox.written;
    expect(record?.event).toBeInstanceOf(AuditEntryRecorded);
    expect({ ...(record?.event as AuditEntryRecorded) }).toMatchObject({
      callId: "evt_paired",
      key: "listener:IssueDeviceCredentialListener",
      effects: [],
      actor: handler,
      scopeId: "ten_1",
      outcome: "ok",
      fields: {
        credentialId: "crd_1",
        event: "devices.device.paired.v1",
        causedBy: { kind: ActorKind.User, id: "usr_1" },
      },
    });
    expect(record?.meta).toMatchObject({
      occurredAt: at,
      scopeId: "ten_1",
      actor: handler,
      correlationId: "evt_paired",
      causationId: "evt_paired",
    });
    expect(record?.meta.id).toMatch(/^evt_/);
  });
});
