/**
 * Stackra file contract:
 * Purpose: `CacheMode`, how an environment's shared cache runs: `serverless` (Valkey serverless, no node class) or
 *          `nodes` (a node class and a node count).
 * Boundary: an `Enum.of` value plus the type of the same name.
 * Runtime: isomorphic
 * Governing contract: ADR 0524; ADR 0231.
 */
import { Enum } from "@stackra/contracts";

/** One case per cache mode. */
export const CacheMode = Enum.of({
  /** Valkey serverless: billed by use, no node class. */
  Serverless: "serverless",
  /** A fixed number of nodes of one class. */
  Nodes: "nodes",
});

/** One of the modes above. */
export type CacheMode = Enum.Value<typeof CacheMode>;
