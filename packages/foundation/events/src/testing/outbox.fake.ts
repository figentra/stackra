/**
 * Stackra file contract:
 * Purpose: `OutboxFake`, the in-memory `EventOutbox` of a test: it keeps what the unit of work wrote until
 *          `drainOutbox()` takes it, and everything it was ever given for `app.events.published()`.
 * Boundary: a port fake (ADR 0269), so this package never depends on `@stackra/outbox`. Bind it with
 *           `.override(EventOutbox, new OutboxFake())` when the app under test binds no outbox of its own; a write is
 *           recorded as `calls("write")`.
 * Runtime: node
 * Governing contract: ADR 0269 (decisions 2 and 3); ADR 0294 (amendment item 12: `<name>.fake.ts`); ADR 0078
 *                     (decision 4).
 */
import { Fake } from "@stackra/testing";

import { EventOutbox } from "#contracts/index";
import type { RecordedEvent } from "#contracts/index";

/**
 * The outbox fake.
 *
 * @example
 * const app = await createTestingModule(OrdersModule).override(EventOutbox, new OutboxFake()).compile();
 */
export class OutboxFake extends Fake.of(EventOutbox) {
  /** Written and not yet taken, oldest first. */
  private readonly pending: RecordedEvent[] = [];

  /** Keeps `records` for `take()` and records the call. */
  async write(records: readonly RecordedEvent[]): Promise<void> {
    this.record("write", records);
    this.pending.push(...records);
  }

  /** Everything written since the last take, oldest first; the relay step of `drainOutbox()`. */
  take(): RecordedEvent[] {
    return this.pending.splice(0);
  }

  /** Everything ever written, oldest first, taken or not. */
  written(): readonly RecordedEvent[] {
    return this.calls("write").flat();
  }
}
