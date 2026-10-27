/**
 * Stackra file contract:
 * Purpose: `OutboxEventOutboxDriver`, the driver of @stackra/events' `EventOutbox` port: a caller that holds recorded
 *          integration events (a unit of work, a workflow staging its events) writes them through it into the outbox,
 *          in its own transaction, exactly as the flush writer stores a model's events.
 * Boundary: works over the `OutboxDriver` port, so it joins the caller's transaction when the store is Postgres. It
 *           takes integration events only; a domain event stays in process and is refused.
 * Runtime: isomorphic
 * Governing contract: ADR 0078 (decisions 3 and 4); ADR 0141 (decision 3); ADR 0305 (rule 21: a domain event leaves
 *                     only as an integration event).
 */
import { Driver } from "@stackra/container";
import { EventOutbox } from "@stackra/events/contracts";
import type { RecordedEvent } from "@stackra/events/contracts";

import type { OutboxDriver } from "#contracts/index";
import { eventMessage } from "#core/functions/event-message.function";

/**
 * Writes recorded integration events into the outbox.
 *
 * @example
 * // generated wiring: { port: EventOutbox, candidates: { outbox: () => import("@stackra/outbox").then((m) => m.OutboxEventOutboxDriver) } }
 */
export class OutboxEventOutboxDriver extends Driver(EventOutbox) {
  /** The message store. */
  private readonly driver: OutboxDriver;

  /**
   * @param driver - the message store the events are written to.
   */
  constructor(driver: OutboxDriver) {
    super();
    this.driver = driver;
  }

  /**
   * See `EventOutbox.write`.
   *
   * @throws TypeError when a record's event is not an integration event or its id is not an `evt_` id.
   */
  async write(records: readonly RecordedEvent[]): Promise<void> {
    await this.driver.write(records.map((record) => eventMessage(record)));
  }
}
