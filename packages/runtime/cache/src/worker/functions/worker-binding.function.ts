/**
 * Stackra file contract:
 * Purpose: `workerBinding`, the Worker binding of a name: what a `./worker` driver reads its Workers resource from,
 *          by the name its configuration gives.
 * Boundary: reads `env` from the runtime module `cloudflare:workers`, so it runs in a Worker only; tests mock this
 *           file. Answers by name and lists nothing.
 * Runtime: worker
 * Governing contract: ADR 0284 (Workers members); ADR 0297 (decision 3).
 */
/// <reference path="../types/cloudflare-workers.d.ts" />
import { env } from "cloudflare:workers";

/**
 * The binding named `name`, or `undefined` when the Worker has none.
 *
 * @example
 * const kv = workerBinding(config.workers.binding);
 */
export function workerBinding(name: string): unknown {
  return Reflect.get(env, name);
}
