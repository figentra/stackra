/**
 * Stackra file contract:
 * Purpose: the `memory` driver of the `RealtimeDriver` port: sessions are in-process listeners, for local dev and a
 *          service's tests (a test issues a token for a session, connects a listener and asserts what it receives).
 * Boundary: no network. Delivery goes through the shared `RealtimeHub`, so a memory listener is checked exactly as a
 *           socket would be (channel ids, realm, permission, one-time token, expiry).
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decision 1); ADR 0266 (one default driver, memory first).
 */
import { Driver } from "@stackra/container";

import { RealtimeDriver } from "#contracts/ports/realtime-driver.port";
import type { RealtimeBroadcast } from "#contracts/types/realtime-broadcast.type";
import type { RealtimeMessage } from "#contracts/types/realtime-message.type";
import type { RealtimeHub } from "#core/services/realtime-hub.service";

/**
 * Serves in-process listeners.
 *
 * @example
 * const { token } = hub.issueToken(session);
 * const leave = driver.connect(token, (message) => received.push(message));
 */
export class MemoryRealtimeDriver extends Driver(RealtimeDriver) {
  private readonly hub: RealtimeHub;

  /**
   * @param hub - the shared channel hub.
   */
  constructor(hub: RealtimeHub) {
    super();
    this.hub = hub;
  }

  /** Delivers `broadcast` to the listeners that may receive it. */
  publish(broadcast: RealtimeBroadcast): Promise<number> {
    return Promise.resolve(this.hub.publish(broadcast));
  }

  /**
   * Joins `listener` with the one-time `token`, until the token expires or the returned function is called.
   *
   * @returns leaves the hub; `undefined` when the token is unknown, used or expired.
   */
  connect(token: string, listener: (message: RealtimeMessage) => void): (() => void) | undefined {
    return this.hub.join(token, { deliver: listener, close: () => undefined });
  }
}
