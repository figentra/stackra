/**
 * Stackra file contract:
 * Purpose: the `InboxDriver` port: the consumer side's record of the event ids it has already run, so a redelivered
 *          event (at-least-once transports, a relay that published before it could record) runs its listeners once.
 *          Config `outbox.driver` picks the driver (`postgres`, `memory`).
 * Boundary: an abstract class that is its own token, keyed `outbox.InboxDriver`. `claim` joins the caller's
 *           transaction, so a claim whose listeners' transaction rolls back is released with it. Event ids are unique
 *           per occurrence, so the inbox is keyed by id alone. A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0078 (decision 4: every consumer is idempotent and deduplicates on the event id); ADR 0142;
 *                     ADR 0294 (decisions 4, 15 and 16).
 */
import { Port } from "@stackra/contracts";

/**
 * A store of received event ids.
 *
 * @example
 * export class ValkeyInboxDriver extends Driver(InboxDriver) {
 *   async claim(eventId: string, at: Date): Promise<boolean> { ... }
 * }
 */
export abstract class InboxDriver extends Port {
  /** Type-only port key, so `DriverName<InboxDriver>` narrows to this port's drivers. */
  declare readonly "~key": "outbox.InboxDriver";

  /** Records `eventId` as received at `at`; `false`, recording nothing, when it was received before. */
  abstract claim(eventId: string, at: Date): Promise<boolean>;

  /** Forgets every id received before `before`: the retention purge, once redelivery can no longer reach them. */
  abstract prune(before: Date): Promise<void>;
}
