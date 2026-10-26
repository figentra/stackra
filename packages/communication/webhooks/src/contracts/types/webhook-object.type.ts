/**
 * Stackra file contract:
 * Purpose: `WebhookObject`, one signed outbound delivery as a `WebhookObjectSink` writes it to an S3 target: the
 *          bucket, its region, the object key, the exact signed body and the Standard Webhooks headers as object
 *          metadata, so a SIEM that reads the bucket verifies the object as a receiver verifies a post.
 * Boundary: a type only, in the leaf entry. The metadata carries signatures, never a secret.
 * Runtime: isomorphic
 * Governing contract: ADR 0224 (decisions 2 and 3); ADR 0422 (decision 4); the Standard Webhooks specification.
 */

/** One delivery to write as an object. */
export interface WebhookObject {
  /** The bucket. */
  readonly bucket: string;

  /** The bucket's region (`me-central-1`); the sink's default region when absent. */
  readonly region?: string;

  /** The object key (`siem/records.audit_record.appended.v1/2026/10/26/evt_….json`). */
  readonly key: string;

  /** The JSON body, exactly as signed. */
  readonly body: string;

  /** `webhook-id`, `webhook-timestamp` and `webhook-signature`, stored as the object's metadata. */
  readonly metadata: Readonly<Record<string, string>>;

  /** Aborts the write when the delivery job's attempt times out. */
  readonly signal?: AbortSignal;
}
