/**
 * Stackra file contract:
 * Purpose: the `RealtimeDriver` port, the server side of realtime: how a service delivers a broadcast to the sessions
 *          connected to it. The `memory` driver serves in-process listeners (dev and tests), `sse` serves
 *          `text/event-stream` responses and `websocket` serves sockets with the SSE fallback.
 * Boundary: an abstract class that is its own token, keyed `realtime.RealtimeDriver`, so `RealtimeConfig.driver`
 *           takes only this port's driver names. A driver checks nothing itself: the hub delivers only to sessions
 *           whose ids match the channel and which hold the permission.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decision 1: WebSocket with an SSE fallback, drivers); ADR 0294 (decisions 4, 15 and
 *                     16); ADR 0263 (ports resolve by type).
 */
import { Port } from "@stackra/contracts";

import type { RealtimeBroadcast } from "#contracts/types/realtime-broadcast.type";

/**
 * Delivers broadcasts to connected sessions.
 *
 * @example
 * export class MemoryRealtimeDriver extends Driver(RealtimeDriver) {
 *   publish(broadcast: RealtimeBroadcast): Promise<number> {
 *     return Promise.resolve(this.hub.publish(broadcast));
 *   }
 * }
 */
export abstract class RealtimeDriver extends Port {
  /** Type-only port key, so `DriverName<RealtimeDriver>` narrows to this port's drivers. */
  declare readonly "~key": "realtime.RealtimeDriver";

  /**
   * Delivers `broadcast` to every session this driver serves that may receive it.
   *
   * @returns how many sessions it reached.
   */
  abstract publish(broadcast: RealtimeBroadcast): Promise<number>;
}
