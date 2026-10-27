/**
 * Stackra file contract:
 * Purpose: `EdgeKvOptions`, the options of `EdgeKvConfig`: the Workers KV namespace that holds the edge KV copy.
 * Boundary: a schema class only; `EdgeKvConfig` declares it, `WranglerEdgeKvDriver` reads it. The namespace id is
 *           an OS fact (infra-cloudflare creates the namespace); the account and token are wrangler's own login.
 * Runtime: node
 * Governing contract: ADR 0437 (the KV copy); app-shells 5.3; ADR 0296 (configuration, not code).
 */
import { Schema } from "@stackra/validation";

/** The options of `EdgeKvConfig`. */
export class EdgeKvOptions extends Schema {
  /** The Workers KV namespace id of the edge KV copy; empty until set. */
  namespaceId = "";
}
