/**
 * Stackra file contract:
 * Purpose: the `EdgeKvWriter` port: writes and removes rows of the edge KV copy (Cloudflare Workers KV) from outside
 *          the Worker, the way Runway and the edge projector keep `host:`, `boot:`, `release:`, `canary:`,
 *          `wellknown:` and `shell:` rows current.
 * Boundary: an abstract class that is its own token, keyed `app.EdgeKvWriter`; a driver (the Cloudflare API, memory
 *           for tests) implements it with `extends Driver(EdgeKvWriter)`. Rows are durable text (JSON or a file
 *           body) under the exact key given: no namespace prefix and no expiry, unlike the `Cache` port. The account,
 *           namespace id and token are configuration.
 * Runtime: isomorphic
 * Governing contract: ADR 0437 (not yet landed; app-shells 5.3); ADR 0294 (decisions 4, 15 and 16); ADR 0263 (ports resolve by type).
 */
import { Port } from "@stackra/contracts";

/**
 * Writes the edge KV copy.
 *
 * @example
 * await kv.put(`${EdgeKvPrefix.Release}:commerce:console`, JSON.stringify({ version, url }));
 */
export abstract class EdgeKvWriter extends Port {
  /** Type-only port key, so `DriverName<EdgeKvWriter>` narrows to this port's drivers. */
  declare readonly "~key": "app.EdgeKvWriter";

  /** Stores `value` under `key`, replacing any row there. */
  abstract put(key: string, value: string): Promise<void>;

  /** Removes `key`; removing a missing key is not an error. */
  abstract delete(key: string): Promise<void>;
}
