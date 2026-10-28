/**
 * Stackra file contract:
 * Purpose: `attemptWebhook`, one outbound delivery attempt: signs the body with Standard Webhooks headers, then posts
 *          it through the `WebhookSender` (an https URL) or writes it through the `WebhookObjectSink` (an `s3:` target,
 *          keyed by the event id and the body's occurrence day, the signed headers as metadata), and reports the
 *          outcome.
 * Boundary: no retry, no log and no store: `DeliverWebhookAction` (and a host's own job, a partner lead's for one)
 *           records the outcome and refuses a failed attempt so its queue retries it. A transport error becomes the
 *           outcome's cause; a malformed `s3:` URL throws before anything is sent. The secrets are signed with and
 *           dropped.
 * Runtime: isomorphic
 * Governing contract: ADR 0224 (decisions 2 and 3); ADR 0422 (decision 4); ADR 0173.
 */
import type { WebhookObjectSink, WebhookSender } from "#contracts/index";
import { s3TargetOf } from "#core/functions/s3-target-of.function";
import { signWebhook } from "#core/functions/sign-webhook.function";
import { webhookObjectKey } from "#core/functions/webhook-object-key.function";
import type { WebhookAttemptOutcome } from "#core/types/webhook-attempt-outcome.type";
import type { WebhookAttemptRequest } from "#core/types/webhook-attempt-request.type";

/**
 * Signs and delivers `request` once.
 *
 * @throws TypeError when the URL is a malformed `s3:` target.
 * @example
 * const outcome = await attemptWebhook({ url, eventId, type, body, secrets, now: ctx.now() }, { sender, objects });
 * if (!outcome.isDelivered) throw WebhookDeliveryFailedError.create({ status: outcome.status });
 */
export async function attemptWebhook(
  request: WebhookAttemptRequest,
  transports: { readonly sender: WebhookSender; readonly objects: WebhookObjectSink },
): Promise<WebhookAttemptOutcome> {
  const { url, eventId, type, body, now, signal } = request;
  const signed = await signWebhook({ id: eventId, timestamp: now, body }, request.secrets);
  const target = s3TargetOf(url);
  let status: number | null = null;
  try {
    if (target === undefined) {
      status = await transports.sender.send({
        url,
        headers: { ...signed, "content-type": "application/json" },
        body,
        ...(signal === undefined ? {} : { signal }),
      });
      return { status, isDelivered: status >= 200 && status < 300 };
    }
    await transports.objects.put({
      bucket: target.bucket,
      ...(target.region === undefined ? {} : { region: target.region }),
      key: webhookObjectKey(target, type, eventId, occurredAtOf(body, now)),
      body,
      metadata: { ...signed },
      ...(signal === undefined ? {} : { signal }),
    });
    return { status: null, isDelivered: true };
  } catch (error) {
    return { status, isDelivered: false, cause: error };
  }
}

/** The occurrence time in the delivery body (`{ type, timestamp, data }`), or `fallback` when it has none. */
function occurredAtOf(body: string, fallback: Date): Date {
  const timestamp: unknown = (JSON.parse(body) as { readonly timestamp?: unknown }).timestamp;
  const at = typeof timestamp === "string" ? new Date(timestamp) : fallback;
  return Number.isNaN(at.getTime()) ? fallback : at;
}
