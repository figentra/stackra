/**
 * Stackra file contract:
 * Purpose: `RealtimeOptions`, the shape of `RealtimeConfig`. Server fields: which `RealtimeDriver` serves sessions,
 *          which realms may hear tenant channels and how long a subscribe token lasts. Client fields: the realtime
 *          origin, whether the connection is suspended in the background and resumed on foreground, the grace before
 *          it suspends, and the longest wait between reconnect attempts. Venue fields: the local-network relay's driver,
 *          port, advertised address, the peers a device probes and how long it waits for one.
 * Boundary: a shape class; it registers this package's own schema (`REALTIME_CONFIG_SCHEMA`) for itself when the
 *           module loads. One configuration serves both sides, so a service and an app override the fields they use.
 *           The origin comes from the host's env configuration (`realtimeOrigin`), so this shape has no env map. The
 *           defaults are dev-safe: the memory driver, every realm, fifteen-minute tokens, a connection that stays
 *           open in the background (a browser tab), backoff capped at thirty seconds, the in-process fan-out and the
 *           room caps of ADR 0346 (the member cap counted across instances). The Valkey URL carries its password, so
 *           it is the `REALTIME_VALKEY_URL` secret; the venue relay's shared key is the `REALTIME_LOCAL_RELAY_KEY`
 *           secret.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decision 1); ADR 0294 (decisions 4, 19 and 26); ADR 0295 (decision 10).
 */
import { Secret } from "@stackra/config";
import type { DriverName } from "@stackra/container";
import { Duration, Realm } from "@stackra/contracts";
import { Field, Int, registerSchemas, Schema } from "@stackra/validation";

import type { RealtimeDriver } from "#contracts/ports/realtime-driver.port";
import type { RealtimeFanout } from "#contracts/ports/realtime-fanout.port";
import type { RealtimeLocalRelay } from "#contracts/ports/realtime-local-relay.port";
import { REALTIME_CONFIG_SCHEMA } from "#core/constants/realtime-config-schema.constant";
import "#core/types/realtime-local-relay-name.type";

/**
 * The realtime settings of a member.
 *
 * @example
 * export class RealtimeConfig extends BaseRealtimeConfig {
 *   override channelRealms: Realm[] = [Realm.Staff];
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

  /** The key every device of one venue shares to link to its relay; empty until the secret is set. */
  @Secret("REALTIME_LOCAL_RELAY_KEY")
  localRelayKey = "";

  /** The port a hosting device serves the relay on. */
  @Int({
    min: 1,
    max: 65_535,
  })
  localRelayPort = 4790;

  /** How long a probe waits for a relay to answer, in milliseconds. */
  @Int({ min: 100 })
  localRelayProbeMs = 1500;

  /** The caps of collaboration rooms (ADR 0346 decision 6); a member over one is dropped with `room_limit_reached`. */
  // reason: a nested driver option a host override replaces whole; the shipped config schema holds its rules
  @Field(REALTIME_CONFIG_SCHEMA.shape.rooms)
  rooms: {
    /** Members per room: on this instance, or on all of them with `countAcrossInstances`. */
    maxMembers: number;
    /** Count `maxMembers` over every instance (their counts arrive through the fan-out), not this one alone. */
    countAcrossInstances: boolean;
    /** The largest message payload, in bytes. */
    maxMessageBytes: number;
    /** Messages one member may send per second. */
    maxMessagesPerSecond: number;
    /** Seconds a member may stay silent before it is closed. */
    idleCloseSeconds: number;
  } = {
    maxMembers: 50,
    countAcrossInstances: true,
    maxMessageBytes: 65_536,
    maxMessagesPerSecond: 20,
    idleCloseSeconds: 60,
  };

  /** The `RealtimeDriver` a service serves sessions with: `memory` in dev, `sse` or `websocket` deployed. */
  driver: DriverName<RealtimeDriver> = "memory";

  /** Where clients connect (`https://api.acme.example`); empty means the page origin. */
  origin = "";

  /** The realms whose sessions may hear tenant channels; a principal always hears its own channel. */
  channelRealms: Realm[] = [Realm.Platform, Realm.Staff, Realm.Customer];

  /** How long a subscribe token, and the connection it opens, lasts; at least ten seconds. */
  subscribeTokenTtl: Duration = Duration.minutes(15);

  /** Suspend the connection after `backgroundGraceSeconds` in the background and reconnect on foreground. */
  reconnectOnForeground = false;

  /** The fan-out between a service's instances: `local` for one instance, `valkey` for Valkey pub/sub. */
  fanout: DriverName<RealtimeFanout> = "local";

  /** The Valkey pub/sub channel the instances of one service share. */
  fanoutChannel = "realtime:fanout";

  /** The venue relay's driver: `lan` serves and probes over the local network (`./node`). */
  localRelay: DriverName<RealtimeLocalRelay> = "lan";

  /** The address a hosting device gives the others (`192.168.1.20`); empty means its first local IPv4 address. */
  localRelayAddress = "";

  /** The relays a device probes, in order (`http://192.168.1.20:4790`): the venue's hosting devices. */
  localRelayPeers: string[] = [];
}

registerSchemas([[RealtimeOptions, REALTIME_CONFIG_SCHEMA]]);
