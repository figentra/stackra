/**
 * Stackra file contract:
 * Purpose: unit tests of `OutboxAuditTrailDriver`: it is the `AuditTrail` port; each entry is written to the
 *          `EventOutbox` as one `AuditEntryRecorded` with the call's identity, tags, actor, scope, request origin,
 *          outcome, code and fields, and metadata carrying a fresh `evt_` id, the call's time, tenant, actor and correlation.
 * Boundary: test only; a recording EventOutbox.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0212 (decisions 1, 2 and 4); ADR 0098 (decision 7); ADR 0456.
 */
import { Driver } from "@stackra/container";
import { ActorKind, ApiArea, Realm } from "@stackra/contracts";
import type { Actor } from "@stackra/contracts";
import { EventOutbox } from "@stackra/events/contracts";
import type { RecordedEvent } from "@stackra/events/contracts";
import { describe, expect, it } from "@stackra/testing";

import { CallOriginKind } from "#contracts/enums/call-origin-kind.enum";
import { Effect } from "#contracts/enums/effect.enum";
import { AuditTrail } from "#contracts/ports/audit-trail.port";
import { OutboxAuditTrailDriver } from "#core/drivers/outbox-audit-trail.driver";
import { AuditEntryRecorded } from "#core/events/audit-entry-recorded.event";

class Outbox extends Driver(EventOutbox) {
  readonly written: RecordedEvent[] = [];

  async write(records: readonly RecordedEvent[]): Promise<void> {
    this.written.push(...records);
  }
}

describe(OutboxAuditTrailDriver, () => {
  it("writes each entry as an AuditEntryRecorded event", async () => {
    const outbox = new Outbox();
    const trail = new OutboxAuditTrailDriver(outbox);
    expect(trail).toBeInstanceOf(AuditTrail);
    const actor: Actor = {
      kind: ActorKind.User,
      id: "usr_1",
      realm: Realm.Staff,
      scopeId: "ten_1",
    };
    const at = new Date("2026-10-25T09:00:00.000Z");
    await trail.record({
      call: {
        callId: "call-1",
        type: class {},
        kind: "action",
        key: "payments.payment.refund@1",
        // oxlint-disable-next-line stackra/no-raw-key-literal -- reason: the test stands in for gen, which writes the descriptor's permission
        permission: "payments.payment.refund",
        risk: "L3",
        effects: [Effect.Financial],
        actor,
        scopeId: "ten_1",
        scope: { id: "scp_1", path: "platform.acme" },
        area: ApiArea.App,
        origin: { kind: CallOriginKind.ApiKey, id: "key_1" },
      },
      at,
      outcome: "refused",
      code: "forbidden",
      fields: { amount: 2500 },
    });
    const [record] = outbox.written;
    expect(record?.event).toBeInstanceOf(AuditEntryRecorded);
    expect(record?.event).toMatchObject({
      callId: "call-1",
      key: "payments.payment.refund@1",
      // oxlint-disable-next-line stackra/no-raw-key-literal -- reason: the expected event carries the permission gen wrote
      permission: "payments.payment.refund",
      risk: "L3",
      effects: ["financial"],
      actor,
      scopeId: "scp_1",
      scopePath: "platform.acme",
      originKind: "api_key",
      originId: "key_1",
      outcome: "refused",
      code: "forbidden",
      fields: { amount: 2500 },
    });
    expect(record?.meta).toMatchObject({
      occurredAt: at,
      scopeId: "ten_1",
      actor,
      correlationId: "call-1",
    });
    expect(record?.meta.id).toMatch(/^evt_[0-9a-z]{26}$/);
  });
});
