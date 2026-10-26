/**
 * Stackra file contract:
 * Purpose: the `WebhookObjectSink` port: how one signed outbound delivery reaches an S3 target (`s3://bucket/prefix`),
 *          as an object, for a SIEM that reads a bucket instead of receiving posts (OS-288). The `s3` driver in
 *          `./node` writes it with the AWS SDK.
 * Boundary: an abstract class that is its own token, keyed `webhooks.WebhookObjectSink`. A driver writes once and
 *           never retries, signs or reads a secret: the delivery job does the retries and the signing. Rewriting the
 *           same key is harmless, because the key is derived from the event id. Managed or bring your own: the bucket
 *           is the platform's or the tenant's, and the tenant's grants the platform's role write access by its own
 *           bucket policy, so no tenant credential is stored here.
 * Runtime: isomorphic
 * Governing contract: ADR 0224 (decision 3); ADR 0422 (decision 4); ADR 0142 (transport behind drivers).
 */
import { Port } from "@stackra/contracts";

import type { WebhookObject } from "#contracts/types/webhook-object.type";

/**
 * Writes one delivery as an object.
 *
 * @example
 * export class S3WebhookObjectSinkDriver extends Driver(WebhookObjectSink) {
 *   async put(object: WebhookObject): Promise<void> { ... }
 * }
 */
export abstract class WebhookObjectSink extends Port {
  /** Type-only port key, so `DriverName<WebhookObjectSink>` narrows to this port's drivers. */
  declare readonly "~key": "webhooks.WebhookObjectSink";

  /**
   * Writes `object` once.
   *
   * @throws when the store refuses or does not answer (access denied, network failure, abort).
   */
  abstract put(object: WebhookObject): Promise<void>;
}
