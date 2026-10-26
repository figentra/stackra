/**
 * Stackra file contract:
 * Purpose: the `s3` `WebhookObjectSink`: one `PutObject` per delivery to the endpoint's bucket, the signed body as
 *          `application/json` and the Standard Webhooks headers as the object's metadata, for a SIEM that reads a bucket
 *          (OS-288).
 * Boundary: writes once; never retries, signs or reads a secret. Holds no credential: the AWS SDK reads its default
 *           chain (the platform's role, which runway grants). A managed target is the platform's bucket; a tenant's own
 *           bucket grants that role `s3:PutObject` on its prefix by its bucket policy, so nothing of the tenant's is
 *           stored here. One client per region, made on first use; a target without a region uses the SDK's default
 *           region. The job's signal aborts the write.
 * Runtime: node
 * Governing contract: ADR 0224 (decision 3); ADR 0422 (decision 4); ADR 0173 (secrets); ADR 0142 (transport behind
 *                     drivers).
 */
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Driver } from "@stackra/container";

import { WebhookObjectSink } from "#contracts/index";
import type { WebhookObject } from "#contracts/index";

/**
 * Writes deliveries to S3.
 *
 * @example
 * await new S3WebhookObjectSinkDriver().put({ bucket, region, key, body, metadata, signal });
 */
export class S3WebhookObjectSinkDriver extends Driver(WebhookObjectSink) {
  /** One client per region; `""` is the SDK's default region. */
  private readonly clients = new Map<string, S3Client>();

  /** See `WebhookObjectSink.put`. */
  async put(object: WebhookObject): Promise<void> {
    await this.clientFor(object.region ?? "").send(
      new PutObjectCommand({
        Bucket: object.bucket,
        Key: object.key,
        Body: object.body,
        ContentType: "application/json",
        Metadata: { ...object.metadata },
      }),
      object.signal === undefined ? {} : { abortSignal: object.signal },
    );
  }

  /** The client of `region`, made once. */
  private clientFor(region: string): S3Client {
    let client = this.clients.get(region);
    if (client === undefined) {
      client = new S3Client(region === "" ? {} : { region });
      this.clients.set(region, client);
    }
    return client;
  }
}
