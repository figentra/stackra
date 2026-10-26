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
 *           open in the background (a browser tab), backoff capped at thirty seconds, the in-process fan-out and the
 *           room caps of ADR 0346. The Valkey URL carries its password, so it is the `REALTIME_VALKEY_URL` secret.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decision 1); ADR 0294 (decisions 4, 19 and 26); ADR 0295 (decision 10).
 */
import { Secret } from "@stackra/config";
import type { DriverName } from "@stackra/container";
import { Duration, Realm } from "@stackra/contracts";
import { Int, registerSchemas, Schema } from "@stackra/validation";

import type { RealtimeDriver } from "#contracts/ports/realtime-driver.port";
import type { RealtimeFanout } from "#contracts/ports/realtime-fanout.port";
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
  /** Seconds in the background before the connection is suspended, when `reconnectOnForeground` is on. */
  @Int({ min: 0 })
  backgroundGraceSeconds = 60;

  /** The longest wait between reconnect attempts, in seconds. */
  @Int({ min: 1 })
  maxBackoffSeconds = 30;

  /** The `valkey` fan-out's server (`redis://` or `rediss://`, with its password); empty until the secret is set. */
  @Secret("REALTIME_VALKEY_URL")
  fanoutValkeyUrl = "";

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

  /** The fan-out between a service's instances: `local` for one instance, `valkey` for Valkey pub/sub. */
  fanout: DriverName<RealtimeFanout> = "local";

  /** The Valkey pub/sub channel the instances of one service share. */
  fanoutChannel = "realtime:fanout";

  /** The caps of collaboration rooms (ADR 0346 decision 6); a member over one is dropped with `room_limit_reached`. */
  rooms: {
    /** Members per room on one instance. */
    maxMembers: number;
    /** The largest message payload, in bytes. */
    maxMessageBytes: number;
    /** Messages one member may send per second. */
    maxMessagesPerSecond: number;
    /** Seconds a member may stay silent before it is closed. */
    idleCloseSeconds: number;
  } = { maxMembers: 50, maxMessageBytes: 65_536, maxMessagesPerSecond: 20, idleCloseSeconds: 60 };
}

registerSchemas([[RealtimeOptions, REALTIME_CONFIG_SCHEMA]]);
