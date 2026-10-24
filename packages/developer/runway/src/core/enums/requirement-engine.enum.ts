/**
 * Stackra file contract:
 * Purpose: the engines a member runway's `requires.<resource>.engine` may name: the ones ADR 0296 lists (decision 5
 *          and its 2026-10-24 note). A dedicated search resource takes `postgres`.
 * Boundary: an `Enum.of` value plus the type of the same name, in the order of the canonical schemas' `engine` enum.
 *           A new engine is a new row in ADR 0296 and in `tools/schemas/runway-*.schema.json` together; a deferred
 *           engine (Typesense, Meilisearch, OpenSearch, Kafka, NATS, a separate vector store) stays absent.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 5 and its 2026-10-24 note), ADR 0231.
 */
import { Enum } from "@stackra/contracts";

/** One case per allowed engine. */
export const RequirementEngine = Enum.of({
  /** A Postgres database, also the search and vector engine (ADR 0160, ADR 0221). */
  Postgres: "postgres",
  /** A Valkey cache. */
  Valkey: "valkey",
  /** An S3-compatible object store. */
  S3: "s3",
  /** An SNS topic with SQS queues. */
  SnsSqs: "sns-sqs",
});

/** One of the codes above. */
export type RequirementEngine = Enum.Value<typeof RequirementEngine>;
