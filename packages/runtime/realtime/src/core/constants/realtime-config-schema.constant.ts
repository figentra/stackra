/**
 * Stackra file contract:
 * Purpose: `REALTIME_CONFIG_SCHEMA`, the zod schema this package ships for `RealtimeConfig` (exported as
 *          `RealtimeConfig$`): the server driver, the realtime origin, the realms allowed on tenant channels, the
 *          subscribe token's lifetime, the client's background and reconnect behaviour, the fan-out between instances
 *          and the room caps.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so `.parse({})` gives the
 *           full defaults and a host's generated `RealtimeConfig$` extends it (`shape.x.unwrap().default(...)`). The
 *           defaults equal `RealtimeOptions`' initializers (tested). No object-level refinement, so `.extend(...)`
 *           stays possible.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0225 (decision 1).
 */
import { Duration, Enum, Realm } from "@stackra/contracts";
import { z } from "zod";

/** An origin without a path (`https://api.acme.example`), or empty for the page origin. */
const ORIGIN = /^(https?:\/\/[^/\s]+)?$/;

/** The shortest subscribe token lifetime accepted: ten seconds, enough to connect over a slow network. */
const MIN_TOKEN_TTL_MS = 10_000;

/** Whether `value` is a `Duration` of at least ten seconds. */
const isTokenTtl = (value: unknown): value is Duration =>
  typeof value === "string" && Duration.toMilliseconds(value as Duration) >= MIN_TOKEN_TTL_MS;

// shortcut: authored until gen compiles this package's RealtimeOptions into #stackra/schemas; replace with STA-339.
/** The shipped `RealtimeConfig$`. */
export const REALTIME_CONFIG_SCHEMA = z.object({
  driver: z.enum(["sse", "websocket", "memory"]).default("memory"),
  origin: z.string().regex(ORIGIN).default(""),
  channelRealms: z.array(z.enum(Enum.values(Realm))).default(() => Enum.values(Realm)),
  subscribeTokenTtl: z
    .custom<Duration>(isTokenTtl, { message: "subscribeTokenTtl is a Duration of at least 10s" })
    .default(Duration.minutes(15)),
  reconnectOnForeground: z.boolean().default(false),
  backgroundGraceSeconds: z.number().int().min(0).default(60),
  maxBackoffSeconds: z.number().int().min(1).default(30),
  fanout: z.enum(["local", "valkey"]).default("local"),
  fanoutValkeyUrl: z.string().default(""),
  fanoutChannel: z.string().min(1).default("realtime:fanout"),
  rooms: z
    .object({
      maxMembers: z.number().int().min(1).default(50),
      maxMessageBytes: z.number().int().min(1).default(65_536),
      maxMessagesPerSecond: z.number().int().min(1).default(20),
      idleCloseSeconds: z.number().int().min(1).default(60),
    })
    .default(() => ({
      maxMembers: 50,
      maxMessageBytes: 65_536,
      maxMessagesPerSecond: 20,
      idleCloseSeconds: 60,
    })),
});
