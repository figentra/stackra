/**
 * Stackra file contract:
 * Purpose: `HeartbeatOptions`, the shape of `HeartbeatConfig`: the heartbeat URL of each background job of the service,
 *          the shortest gap between two beats of one job, and how long one beat may take.
 * Boundary: a shape class; it registers this package's own schema (`HEARTBEAT_CONFIG_SCHEMA`) for itself when the module
 *           loads. The URLs are credentials (anyone holding one can beat for the job), so they are the
 *           `STACKRA_HEARTBEAT_URLS` secret, never a value; with none set nothing beats (dev, preview, tests).
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (decision 4); ADR 0294 (decisions 4, 19 and 26); ADR 0173.
 */
import { Secret } from "@stackra/config";
import { Duration } from "@stackra/contracts";
import { registerSchemas, Schema } from "@stackra/validation";

import { HEARTBEAT_CONFIG_SCHEMA } from "#core/constants/heartbeat-config-schema.constant";

/**
 * The heartbeat settings.
 *
 * @example
 * export class HeartbeatConfig extends BaseHeartbeatConfig {
 *   override timeout = Duration.seconds(1);
 * }
 */
export class HeartbeatOptions extends Schema {
  /**
   * The URL each job beats, as a JSON object of job name to `https://` URL: the stack output
   * `heartbeats.<environment>.<service>` of `@stackra/infra-observability`. Empty until the secret is set.
   */
  @Secret("STACKRA_HEARTBEAT_URLS")
  urls = "";

  /** The shortest gap between two beats of one job, from one to ten seconds; a beat sooner is skipped. */
  minInterval: Duration = Duration.seconds(10);

  /** How long one beat may take, from 100 milliseconds to ten seconds; a slower beat is abandoned and logged. */
  timeout: Duration = Duration.seconds(3);
}

registerSchemas([[HeartbeatOptions, HEARTBEAT_CONFIG_SCHEMA]]);
