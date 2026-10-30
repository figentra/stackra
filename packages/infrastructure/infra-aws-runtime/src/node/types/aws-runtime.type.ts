/**
 * Stackra file contract:
 * Purpose: `AwsRuntime`, what `awsRuntime` returns: per plan key, the identifiers a driver or a generated infra config
 *          needs (a queue's URL and ARN, a topic's ARN, a cache's primary endpoint, a bucket's name), for the program
 *          to export as stack outputs.
 * Boundary: type only; Pulumi outputs, resolved when the stack is previewed or applied.
 * Runtime: node
 * Governing contract: ADR 0171 (decision 3), ADR 0296 (decision 1), ADR 0493 (database endpoints).
 */
import type { Output } from "@pulumi/pulumi";

/** The runtime resources' identifiers, keyed like the plan (`commerce.default`, `shared`). */
export type AwsRuntime = {
  /** Each queue's URL and ARN. */
  readonly queues: Readonly<
    Record<string, { readonly url: Output<string>; readonly arn: Output<string> }>
  >;
  /** Each topic-fed queue's SNS topic ARN, under the queue's key. */
  readonly topics: Readonly<Record<string, Output<string>>>;
  /** Each cache's primary endpoint address (TLS on port 6379). */
  readonly caches: Readonly<Record<string, Output<string>>>;
  /** Each bucket's name. */
  readonly buckets: Readonly<Record<string, Output<string>>>;
  /** Each Postgres resource's RDS Proxy endpoint and port (ADR 0493). */
  readonly databases: Readonly<
    Record<string, { readonly endpoint: Output<string>; readonly port: number }>
  >;
};
