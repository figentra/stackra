/**
 * Stackra file contract:
 * Purpose: `HEARTBEAT_CONFIG_SCHEMA`, the zod schema this package ships for `HeartbeatConfig` (exported as
 *          `HeartbeatConfig$`): the heartbeat URL of each background job of the service (the `STACKRA_HEARTBEAT_URLS`
 *          secret, a JSON object of job name to `https://` URL, empty when unset), the shortest gap between two beats
 *          of one job, and how long one beat may take.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so `.parse({})` gives the
 *           full defaults; they equal `HeartbeatOptions`' initializers (tested). A refusal names the field and the rule,
 *           never the value: the URLs are credentials. `heartbeatUrls` reads the secret's shape.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0173 (no secret values in config);
 *                     ADR 0184 (decision 4: crons, relays and workers send heartbeats).
 */
import { Duration } from "@stackra/contracts";
import { z } from "zod";

import { heartbeatUrls } from "#core/functions/heartbeat-urls.function";

/** The shortest gap between two beats: one second. */
const MIN_INTERVAL_MS = 1000;

/** The longest gap between two beats: ten seconds, a third of Better Stack's shortest period (30 seconds). */
const MAX_INTERVAL_MS = 10_000;

/** The shortest time a beat may take: a hundred milliseconds. */
const MIN_TIMEOUT_MS = 100;

/** The longest time a beat may take: ten seconds. */
const MAX_TIMEOUT_MS = 10_000;

/** Whether `value` is a `Duration` within `[min, max]` milliseconds. */
function within(value: unknown, min: number, max: number): value is Duration {
  if (typeof value !== "string") return false;
  try {
    const milliseconds = Duration.toMilliseconds(value as Duration);
    return milliseconds >= min && milliseconds <= max;
  } catch {
    return false;
  }
}

/** The shipped `HeartbeatConfig$`. */
export const HEARTBEAT_CONFIG_SCHEMA = z.object({
  urls: z
    .string()
    .refine((text) => heartbeatUrls(text) !== undefined, {
      message: "urls is a JSON object of kebab-case job names to https:// URLs",
    })
    .default(""),
  minInterval: z
    .custom<Duration>((value) => within(value, MIN_INTERVAL_MS, MAX_INTERVAL_MS), {
      message: "minInterval is a Duration from 1s to 10s",
    })
    .default(Duration.seconds(10)),
  timeout: z
    .custom<Duration>((value) => within(value, MIN_TIMEOUT_MS, MAX_TIMEOUT_MS), {
      message: "timeout is a Duration from 100ms to 10s",
    })
    .default(Duration.seconds(3)),
});
