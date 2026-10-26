/**
 * Stackra file contract:
 * Purpose: the `RealtimeLocalRelay` port: a realtime relay on the local network, so devices in one venue (tills, floor
 *          tablets, kitchen displays) keep exchanging refreshes and room frames when the internet link is down. One
 *          device hosts the relay; the others find it and open a link to it with `RealtimeTransport`.
 * Boundary: an abstract class that is its own token, keyed `realtime.RealtimeLocalRelay`. It hosts and finds a relay
 *           and answers its address as a `RealtimeTarget`; carrying messages, reconnecting and replaying the outbox
 *           after the internet returns are the transport's and the app's. Which device hosts is a setting.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decision 1); ADR 0294 (decisions 4, 15 and 16); ADR 0263 (ports resolve by type).
 */
import { Port } from "@stackra/contracts";

import type { RealtimeTarget } from "#contracts/types/realtime-target.type";

/**
 * Hosts or finds the venue's local relay.
 *
 * @example
 * const relay = (await localRelay.discover()) ?? (await localRelay.host());
 * transport.open(relay, handlers);
 */
export abstract class RealtimeLocalRelay extends Port {
  /** Type-only port key, so `DriverName<RealtimeLocalRelay>` narrows to this port's drivers. */
  declare readonly "~key": "realtime.RealtimeLocalRelay";

  /** Starts relaying on this device and resolves with the address other devices link to. */
  abstract host(): Promise<RealtimeTarget>;

  /** The address of a relay on the local network, or null when none answers. */
  abstract discover(): Promise<RealtimeTarget | null>;

  /** Stops relaying on this device; open links to it close. */
  abstract stop(): Promise<void>;
}
