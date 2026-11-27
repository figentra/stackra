/**
 * Stackra file contract:
 * Purpose: `HttpOptions`, the shape of `HttpConfig`: the largest request body, in bytes, a generated HTTP adapter
 *          reads before any guard runs (a larger one is answered 413), the drain deadline, in seconds: how long a
 *          stopping server waits for its calls in flight before it shuts down anyway, and the load-shedding bulkhead:
 *          how many calls run at once, how many more may queue and for how long, before a call is answered 503
 *          (`AppOverloadedError`).
 * Boundary: a shape class; it registers this package's own schema (`HTTP_CONFIG_SCHEMA`) when the module loads.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 26); ADR 0237 (STA-2577 note: raw adapters); ADR 0143 (decision 3:
 *                     draining timeouts); ADR 0140 (`Unavailable` is 503); STA-1467 (load shedding).
 */
import { Int, registerSchemas, Schema } from "@stackra/validation";

import { HTTP_CONFIG_SCHEMA } from "#core/constants/http-config-schema.constant";

/**
 * The HTTP adapter settings.
 *
 * @example
 * export class HttpConfig extends BaseHttpConfig {
 *   override maxBodyBytes = 5_242_880;
 * }
 */
export class HttpOptions extends Schema {
  /** The largest request body read, in bytes (1 to 100 MiB; 1 MiB by default). */
  @Int({
    min: 1,
    max: 104_857_600,
  })
  maxBodyBytes = 1_048_576;

  /**
   * How long `drain()` waits for calls in flight, in seconds (1 to 600; 20 by default, inside the 30-second grace a
   * container platform gives before SIGKILL, leaving the rest for the shutdown hooks).
   */
  @Int({
    min: 1,
    max: 600,
  })
  drainTimeoutSeconds = 20;

  /**
   * How many calls one instance runs at once; a call past it queues (0 to 1,000,000; 1024 by default). 0 turns load
   * shedding off: every call runs at once, however many there are.
   */
  @Int({
    min: 0,
    max: 1_000_000,
  })
  maxConcurrentCalls = 1024;

  /**
   * How many calls may wait for a place once `maxConcurrentCalls` run; a call past it is answered 503 at once (0 to
   * 1,000,000; 1024 by default).
   */
  @Int({
    min: 0,
    max: 1_000_000,
  })
  maxQueuedCalls = 1024;

  /**
   * How long a queued call waits for a place before it is answered 503, in milliseconds (0 to 60,000; 5000 by
   * default, so a burst rides out and a sustained overload answers fast instead of timing out at the gateway).
   */
  @Int({
    min: 0,
    max: 60_000,
  })
  maxQueueWaitMs = 5000;
}

registerSchemas([[HttpOptions, HTTP_CONFIG_SCHEMA]]);
