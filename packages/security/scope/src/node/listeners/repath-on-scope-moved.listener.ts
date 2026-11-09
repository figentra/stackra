/**
 * Stackra file contract:
 * Purpose: `RepathOnScopeMovedListener`, the one listener every service with @stackra/scope runs on
 *          `scope.node.moved.v1`: it re-paths the `scope_path` rows of every model with `MovesWithScope`, the service's
 *          own and its packages' alike, from the moved node's old path to its new one (`repathAllRecords`), so no service
 *          writes a re-path listener of its own.
 * Boundary: a queued listener, retried with back-off: the job runs as the event's actor in the event's scope (the
 *           move's, which reaches both paths, ADR 0411) in one transaction, so every model moves together or none
 *           does, and a redelivery moves nothing more. A model opts in with the trait; a `jsonb` scope or another
 *           special case stays with its owner's own listener.
 * Runtime: node
 * Governing contract: ADR 0411 (subtree move); ADR 0327 (decision 3); ADR 0078 (decision 4: a queued listener).
 */
import { Duration } from "@stackra/contracts";
import { repathAllRecords } from "@stackra/database";
import { Listener } from "@stackra/events";

import type { ScopeMoved } from "#node/events/scope-moved.event";

/**
 * Re-paths every opted-in model when a scope subtree moves.
 *
 * @example
 * // gen wires it in every service that declares @stackra/scope; the move's outbox event reaches it
 * await listener.handle(ScopeMoved.create({ scopeId, from: "platform.a.shop", to: "platform.b.shop" }));
 */
export class RepathOnScopeMovedListener extends Listener({
  queue: "default",
  retry: { attempts: 8, base: Duration.seconds(30), max: Duration.minutes(30) },
}) {
  /** Moves every `MovesWithScope` model's rows at or below `event.from` to `event.to`. */
  async handle(event: ScopeMoved): Promise<void> {
    await repathAllRecords(event.from, event.to);
  }
}
