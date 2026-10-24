/**
 * Stackra file contract:
 * Purpose: the engines a member runway's `requires.<resource>.engine` may name: only engines ADR 0227 neither defers
 *          nor rejects. A dedicated search resource takes `postgres`.
 * Boundary: an `Enum.of` value plus the type of the same name. A deferred engine (Typesense, Meilisearch,
 *           OpenSearch, Kafka, NATS, a separate vector store) returns only through a new ADR, so it is absent here.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 5), ADR 0227 (rejected and deferred technologies), ADR 0231.
 */
import { Enum } from "@stackra/contracts";

/** One case per allowed engine. */
export const RequirementEngine = Enum.of({
  /** A Postgres database, also the search and vector engine (ADR 0160, ADR 0221). */
  Postgres: "postgres",
  /** A Valkey cache. */
  Valkey: "valkey",
});

/** One of the codes above. */
export type RequirementEngine = Enum.Value<typeof RequirementEngine>;
