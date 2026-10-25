/**
 * Stackra file contract:
 * Purpose: `dispatchBlockEvent`, which hands a block's verb to the host's handler of that verb: a navigate verb's route
 *          key to `onNavigate`, an action verb to `onAction`.
 * Boundary: a verb with no handler is dropped (see `BlockEventHandlers`). Internal: the web and native drivers give it
 *           to each block as `onEvent`; not exported from an entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0110 (decision 3); ADR 0112.
 */
import type { BlockEvent } from "#contracts/types/block-event.type";
import type { BlockEventHandlers } from "#contracts/types/block-event-handlers.type";

/**
 * Hands `event` to its handler in `handlers`.
 *
 * @example
 * dispatchBlockEvent({ verb: "navigate", route: "create_order" }, { onNavigate: open });
 */
export function dispatchBlockEvent(event: BlockEvent, handlers: BlockEventHandlers): void {
  if (event.verb === "navigate") handlers.onNavigate?.(event.route);
  else handlers.onAction?.(event);
}
