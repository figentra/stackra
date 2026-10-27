/**
 * Stackra file contract:
 * Purpose: `OutboxAccessLogSinkDriver`, the `outbox` sink: each access record leaves as one `AccessRecorded`
 *          integration event through the `EventOutbox`, so a service's read audits reach the audit service, which
 *          chains them per tenant and stores them with the rest of the evidence.
 * Boundary: no store and no chain of its own: the audit service chains on receipt (ADR 0212 decision 3), and the relay
 *           delivers at least once, so it deduplicates by the event id. The write joins the caller's transaction when
 *           there is one, so a read audited inside an action commits with it. The event's metadata carries the actor's
 *           tenant and the call id as its correlation id. An outbox failure rejects, and `AccessLogService` then fails
 *           open or closed by the class.
 * Runtime: isomorphic
 * Governing contract: ADR 0212 (decisions 1, 3, 4 and 5); ADR 0141; ADR 0294 (decision 16); ADR 0409; STA-821.
 */
import { Driver } from "@stackra/container";
import { EventOutbox } from "@stackra/events/contracts";

import { AccessLogSink } from "#contracts/ports/access-log-sink.port";
import type { AccessRecord } from "#contracts/types/access-record.type";
import { AccessRecorded } from "#core/events/access-recorded.event";
import { mintAccessEventId } from "#core/functions/mint-access-event-id.function";

/**
 * Sends access records to the audit service through the outbox.
 *
 * @example
 * export class AccessLogConfig extends BaseAccessLogConfig {
 *   override sink: DriverName<AccessLogSink> = "outbox";
 * }
 */
export class OutboxAccessLogSinkDriver extends Driver(AccessLogSink) {
  /** Where the events are written. */
  private readonly outbox: EventOutbox;

  /** @param outbox - the service's event outbox. */
  constructor(outbox: EventOutbox) {
    super();
    this.outbox = outbox;
  }

  /** See `AccessLogSink.write`. */
  async write(record: AccessRecord): Promise<void> {
    const event = AccessRecorded.create({
      callId: record.callId,
      actor: record.actor,
      target: record.target,
      classification: record.classification,
      subjects: [...record.subjects],
      at: record.at.toISOString(),
    });
    await this.outbox.write([
      {
        event,
        meta: {
          id: mintAccessEventId(),
          occurredAt: record.at,
          ...(record.actor.scopeId === undefined ? {} : { scopeId: record.actor.scopeId }),
          actor: record.actor,
          correlationId: record.callId,
        },
      },
    ]);
  }
}
