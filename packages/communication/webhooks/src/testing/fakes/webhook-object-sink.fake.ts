/**
 * Stackra file contract:
 * Purpose: `WebhookObjectSinkFake`, the memory stand-in of the `WebhookObjectSink` port: objects kept by bucket and key,
 *          so a test reads back what an S3 endpoint received and checks its signed metadata.
 * Boundary: a plain subclass of the port, so it binds in place of `WebhookObjectSink` (`.override(WebhookObjectSink,
 *           new WebhookObjectSinkFake())`) and `instanceof WebhookObjectSink` holds; not a driver, so gen never offers
 *           it as a candidate. `failWith` makes the next writes reject, to test the retry path. Rewriting a key
 *           replaces it, as S3 does.
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (decision 2: a fake per capability); ADR 0269 (decision 3); ADR 0422 (decision 4).
 */
import { WebhookObjectSink } from "#contracts/index";
import type { WebhookObject } from "#contracts/index";

/**
 * S3 objects a test reads back.
 *
 * @example
 * const sink = new WebhookObjectSinkFake();
 * expect(sink.object("acme-siem", key)?.metadata["webhook-id"]).toBe(eventId);
 */
export class WebhookObjectSinkFake extends WebhookObjectSink {
  /** `<bucket>/<key>` to the last object written there. */
  private readonly objects = new Map<string, WebhookObject>();

  /** The error the next writes reject with; none writes. */
  private failure: Error | undefined;

  /** Implements `WebhookObjectSink.put`, documented there. */
  put(object: WebhookObject): Promise<void> {
    if (this.failure !== undefined) return Promise.reject(this.failure);
    const { signal: _signal, ...kept } = object;
    this.objects.set(`${object.bucket}/${object.key}`, Object.freeze(kept));
    return Promise.resolve();
  }

  /** The object at `key` of `bucket`, or undefined. */
  object(bucket: string, key: string): WebhookObject | undefined {
    return this.objects.get(`${bucket}/${key}`);
  }

  /** Every object written, in write order of first write. */
  all(): readonly WebhookObject[] {
    return [...this.objects.values()];
  }

  /**
   * Makes the next writes reject with `error`; `undefined` writes again.
   *
   * @returns this fake, to chain.
   */
  failWith(error: Error | undefined): this {
    this.failure = error;
    return this;
  }
}
