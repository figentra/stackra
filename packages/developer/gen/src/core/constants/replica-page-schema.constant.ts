/**
 * Stackra file contract:
 * Purpose: `REPLICA_PAGE_SCHEMA`, the JSON Schema of `ReplicaPage` from `@stackra/actions`, the output of a replica
 *          query's `handle` (`Promise<ReplicaPage>`): the changed rows, the removed ids, the next cursor, the "as of"
 *          time and whether the answer is the whole replica.
 * Boundary: a constant; the manifest writes it under `schemas` as `<module>.ReplicaPage` for each module with a
 *           replica query, so the OpenAPI document and the generated clients describe the output like any shape. It
 *           mirrors `ReplicaPage` and `@stackra/query`'s `REPLICA_CHANGES_SCHEMA`; a change to either changes this.
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decision 3: bounded replicas, an opaque cursor, the "as of" time); ADR 0294
 *                     (decision 26).
 */
import type { Json } from "@stackra/contracts";

/** The wire shape of a replica query's answer. */
export const REPLICA_PAGE_SCHEMA: Json = {
  type: "object",
  required: ["rows", "removed", "cursor", "asOf", "full"],
  properties: {
    rows: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "at", "data"],
        properties: {
          id: { type: "string", minLength: 1 },
          at: { type: "string", format: "date-time" },
          data: {},
        },
      },
    },
    removed: { type: "array", items: { type: "string", minLength: 1 } },
    cursor: { type: "string", minLength: 1 },
    asOf: { type: "string", format: "date-time" },
    full: { type: "boolean" },
  },
  "x-stackra-type": "replica_page",
};
