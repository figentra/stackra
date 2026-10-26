/**
 * Stackra file contract:
 * Purpose: `S3Target`, an endpoint URL of the form `s3://<bucket>/<prefix>?region=<region>` taken apart: the bucket,
 *          the key prefix every delivery is written under, and the bucket's region when the URL names one.
 * Boundary: a type only; `s3TargetOf` builds it from an endpoint URL.
 * Runtime: isomorphic
 * Governing contract: ADR 0422 (decision 4).
 */

/** An S3 delivery target. */
export interface S3Target {
  /** The bucket name. */
  readonly bucket: string;

  /** The key prefix, without leading or trailing `/`; empty for the bucket's root. */
  readonly prefix: string;

  /** The bucket's region, when the URL names one. */
  readonly region?: string;
}
