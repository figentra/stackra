/**
 * Stackra file contract:
 * Purpose: `RealtimeOptions`, the shape of `RealtimeConfig`. Server fields: which `RealtimeDriver` serves sessions,
 *          which realms may hear tenant channels and how long a subscribe token lasts. Client fields: the realtime
 *          origin, whether the connection is suspended in the background and resumed on foreground, the grace before
 *          it suspends, and the longest wait between reconnect attempts.
 * Boundary: a shape class; it registers this package's own schema (`REALTIME_CONFIG_SCHEMA`) for itself when the
 *           module loads. One configuration serves both sides, so a service and an app override the fields they use.
 *           The origin comes from the host's env configuration (`realtimeOrigin`), so this shape has no env map. The
 *           defaults are dev-safe: the memory driver, every realm, fifteen-minute tokens, a connection that stays
 *           open in the background (a browser tab), and backoff capped at thirty seconds.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decision 1); ADR 0294 (decisions 4, 19 and 26); ADR 0295 (decision 10).
 */
import type { DriverName } from "@stackra/container";
import { Duration, Realm } from "@stackra/contracts";
import { Int, registerSchemas, Schema } from "@stackra/validation";

import type { RealtimeDriver } from "#contracts/ports/realtime-driver.port";
import { REALTIME_CONFIG_SCHEMA } from "#core/constants/realtime-config-schema.constant";

/**
 * The realtime settings of a member.
 *
 * @example
 * export class RealtimeConfig extends BaseRealtimeConfig {
 *   override channelRealms: Realm[] = [Realm.Tenant];
 *   override subscribeTokenTtl = Duration.minutes(5);
 * }
 */
export class RealtimeOptions extends Schema {
  /** The `RealtimeDriver` a service serves sessions with: `memory` in dev, `sse` or `websocket` deployed. */
  driver: DriverName<RealtimeDriver> = "memory";

  /** Where clients connect (`https://api.acme.example`); empty means the page origin. */
  origin = "";

  /** The realms whose sessions may hear tenant channels; a principal always hears its own channel. */
  channelRealms: Realm[] = [Realm.Platform, Realm.Tenant, Realm.Customer];

  /** How long a subscribe token, and the connection it opens, lasts; at least ten seconds. */
  subscribeTokenTtl: Duration = Duration.minutes(15);

  /** Suspend the connection after `backgroundGraceSeconds` in the background and reconnect on foreground. */
  reconnectOnForeground = false;

  /** Seconds in the background before the connection is suspended, when `reconnectOnForeground` is on. */
  @Int({ min: 0 })
  backgroundGraceSeconds = 60;

  /** The longest wait between reconnect attempts, in seconds. */
  @Int({ min: 1 })
  maxBackoffSeconds = 30;
}

registerSchemas([[RealtimeOptions, REALTIME_CONFIG_SCHEMA]]);
