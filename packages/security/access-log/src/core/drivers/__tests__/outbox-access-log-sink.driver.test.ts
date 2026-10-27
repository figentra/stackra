/**
 * Stackra file contract:
 * Purpose: unit tests of `OutboxAccessLogSinkDriver`: it is the `AccessLogSink` port; each record is written to the
 *          `EventOutbox` as one `AccessRecorded` with the call id, actor, target, class, subjects and time, and metadata
 *          carrying a fresh `evt_` id, the record's time, the actor's tenant and the call id as correlation; a platform
 *          actor's event has no tenant; an outbox failure rejects.
 * Boundary: test only; a recording EventOutbox.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0212 (decisions 1, 3 and 5); ADR 0409; STA-821.
 */
import { Driver } from "@stackra/container";
import { type Actor, ActorKind, DataClassification, Realm } from "@stackra/contracts";
import { EventOutbox } from "@stackra/events/contracts";
import type { RecordedEvent } from "@stackra/events/contracts";
import { describe, expect, it } from "@stackra/testing";

import { AccessLogSink } from "#contracts/ports/access-log-sink.port";
import { OutboxAccessLogSinkDriver } from "#core/drivers/outbox-access-log-sink.driver";
import { AccessRecorded } from "#core/events/access-recorded.event";

class Outbox extends Driver(EventOutbox) {
  readonly written: RecordedEvent[] = [];

  failing = false;

  async write(records: readonly RecordedEvent[]): Promise<void> {
    if (this.failing) throw new Error("outbox down");
    this.written.push(...records);
  }
}

const AT = new Date("2026-10-26T09:00:00.000Z");

const STAFF: Actor = {
  kind: ActorKind.User,
  id: "usr_staff",
  realm: Realm.Platform,
  scopeId: "ten_1",
};

describe(OutboxAccessLogSinkDriver, () => {
  it("writes each record as an AccessRecorded event with its envelope", async () => {
    const outbox = new Outbox();
    const sink = new OutboxAccessLogSinkDriver(outbox);
    expect(sink).toBeInstanceOf(AccessLogSink);
    await sink.write({
      callId: "call_1",
      actor: STAFF,
      target: "Wallets.view",
      classification: DataClassification.Financial,
      subjects: ["usr_1"],
      at: AT,
    });
    const [record] = outbox.written;
    expect(record?.event).toBeInstanceOf(AccessRecorded);
    expect(record?.event).toMatchObject({
      callId: "call_1",
      actor: STAFF,
      target: "Wallets.view",
      classification: "financial",
      subjects: ["usr_1"],
      at: "2026-10-26T09:00:00.000Z",
    });
    expect(record?.meta).toMatchObject({
      occurredAt: AT,
      scopeId: "ten_1",
      actor: STAFF,
      correlationId: "call_1",
    });
    expect(record?.meta.id).toMatch(/^evt_[0-9a-hjkmnp-tv-z]{26}$/);
  });

  it("writes no tenant for a platform actor, and rejects when the outbox fails", async () => {
    const outbox = new Outbox();
    const sink = new OutboxAccessLogSinkDriver(outbox);
    const platform: Actor = { kind: ActorKind.Service, id: "svc_support" };
    const record = {
      callId: "call_2",
      actor: platform,
      target: "Tenants.view",
      classification: DataClassification.Pseudonymous,
      subjects: ["usr_2"],
      at: AT,
    };
    await sink.write(record);
    expect(outbox.written[0]?.meta).not.toHaveProperty("scopeId");
    outbox.failing = true;
    await expect(sink.write(record)).rejects.toThrow("outbox down");
  });
});
