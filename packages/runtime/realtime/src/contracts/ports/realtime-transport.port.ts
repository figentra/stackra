/**
 * Stackra file contract:
 * Purpose: the `RealtimeTransport` port, the client side of realtime: how an app opens one link to the realtime
 *          endpoint. The `websocket` driver opens a socket and falls back to server-sent events; the `memory` driver
 *          links in process (tests and offline dev).
 * Boundary: an abstract class that is its own token, keyed `realtime.RealtimeTransport`. A transport opens one link
 *           and reports it; reconnecting, backoff and listeners are `RealtimeConnection`'s.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decision 1); ADR 0294 (decisions 4, 15 and 16); ADR 0263 (ports resolve by type).
 */
import { Port } from "@stackra/contracts";

import type { RealtimeLink } from "#contracts/types/realtime-link.type";
import type { RealtimeLinkHandlers } from "#contracts/types/realtime-link-handlers.type";
import type { RealtimeTarget } from "#contracts/types/realtime-target.type";

/**
 * Opens links to the realtime endpoint.
 *
 * @example
 * const link = transport.open({ origin: "https://api.acme.example", token }, {
 *   onOpen: () => setLive(true),
 *   onMessage: (message) => refetch(message.name),
 *   onClose: () => setLive(false),
 * });
 */
export abstract class RealtimeTransport extends Port {
  /** Type-only port key, so `DriverName<RealtimeTransport>` narrows to this port's drivers. */
  declare readonly "~key": "realtime.RealtimeTransport";

  /**
   * Opens one link to `target` and reports it through `handlers`.
   *
   * @returns the link, to close.
   */
  abstract open(target: RealtimeTarget, handlers: RealtimeLinkHandlers): RealtimeLink;
}
