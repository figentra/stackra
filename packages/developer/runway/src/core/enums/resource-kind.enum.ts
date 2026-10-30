/**
 * Stackra file contract:
 * Purpose: `ResourceKind`, the managed kinds a root runway's `resources.<name>` may declare: a Postgres server, a queue,
 *          a topic, a cache and a bucket. Kafka, OpenSearch and SES are reserved names the schema refuses until an ADR
 *          builds them (ADR 0493 decision 5, ADR 0227).
 * Boundary: an `Enum.of` value plus the type of the same name.
 * Runtime: isomorphic
 * Governing contract: ADR 0493 (decisions 1 and 5), ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** One case per kind Runway provisions. */
export const ResourceKind = Enum.of({
  /** RDS or Aurora Postgres behind RDS Proxy. */
  Postgres: "postgres",
  /** An SQS queue. */
  Queue: "queue",
  /** An SNS topic. */
  Topic: "topic",
  /** A Valkey cache. */
  Cache: "cache",
  /** An S3 bucket. */
  Bucket: "bucket",
});

/** One of the codes above. */
export type ResourceKind = Enum.Value<typeof ResourceKind>;
