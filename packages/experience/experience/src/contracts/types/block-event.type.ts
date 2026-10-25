/**
 * Stackra file contract:
 * Purpose: `BlockEvent`, the closed set of verbs a block hands to its renderer: navigate to a route of the host by its
 *          key, or run an action by its versioned key. A block never navigates or calls a service by itself on
 *          native; it passes the verb up, and the host decides.
 * Boundary: a type only, in the leaf entry. `verb` is the discriminant, so a block's own event schemas (one per verb,
 *           with its own enum case as the discriminant) are assignable to it. Never a URL or code: a route is a
 *           generated route key and an action is a key the host's client consumes.
 * Runtime: isomorphic
 * Governing contract: ADR 0110 (decision 3: events bind to action keys or a closed set of UI verbs); ADR 0112.
 */
import type { Json } from "@stackra/contracts";

/**
 * A verb from a block.
 *
 * @example
 * onEvent({ verb: "navigate", route: RouteKey.CreateOrder });
 * onEvent({ verb: "action", key: "orders.order.create@1", input: { lines: [] } });
 */
export type BlockEvent =
  | {
      /** Open a route of the host. */
      readonly verb: "navigate";
      /** The route's generated key. */
      readonly route: string;
    }
  | {
      /** Run an action through the host's client. */
      readonly verb: "action";
      /** The action's versioned key (`orders.order.create@1`). */
      readonly key: string;
      /** The action's input, when the block supplies one. */
      readonly input?: Json;
    };
