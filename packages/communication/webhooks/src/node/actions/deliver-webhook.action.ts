/**
 * Stackra file contract:
 * Purpose: `webhooks.webhook_delivery.send@1`, the outbound delivery job: one `attemptWebhook` of one event for one
 *          receiver (a post through the `WebhookSender`, or an object through the `WebhookObjectSink` for an `s3:`
 *          target), logs the attempt, and fails a non-2xx answer or a refused write so the queue retries it for about
 *          three days; a dead letter disables the receiver.
 * Boundary: a job only (the job actor, no endpoint, no tool). Receivers and the log are ports
 *           (`WebhookEndpointStore`, `WebhookDeliveryLog`), so a service with its own tables (a partner lead's target
 *           included) reuses this job by binding its drivers and queueing it with its receiver's id. The store resolves
 *           the secret values at the attempt; they are kept nowhere and the job input holds the body, never a
 *           secret. The `webhook-id` is the event id on every attempt, so the receiver deduplicates; the timestamp
 *           is the attempt's. An endpoint removed or disabled since the job was queued is skipped. The attempt is logged
 *           in its own transaction before the refusal, so the log keeps it when the attempt rolls back. An object is keyed
 *           by the event id and the body's occurrence day, so a retry rewrites it; its metadata is the signed headers,
 *           and its log row has no HTTP status.
 * Runtime: node
 * Governing contract: ADR 0224 (decisions 2 and 3); ADR 0305 (rules 28 and 30); ADR 0148 (decision 1); ADR 0173; ADR
 *                     0422 (decision 4); ADR 0306 (rule 9).
 */
import { Action, type ActionContext } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";
import type { Clock } from "@stackra/contracts";
import { Backoff } from "@stackra/queue";

import type {
  WebhookDeliveryLog,
  WebhookEndpointStore,
  WebhookObjectSink,
  WebhookSender,
} from "#contracts/index";
import { attemptWebhook, WebhookDeliveryFailedError } from "#core/index";
import type { DeliverWebhookInput } from "#node/schemas/deliver-webhook-input.schema";

/** Delivers one event to one receiver. */
export class DeliverWebhookAction extends Action({
  key: "webhook_delivery.send",
  actors: [ActorKind.Job],
  job: {
    // about three days (ADR 0224 decision 3): nine doubling waits reach the one-hour cap, then one hour each
    retries: 80,
    backoff: Backoff.Exponential,
    timeout: "1m",
    deadLetter: true,
    onDeadLetter: "disableEndpoint",
  },
}) {
  /** Finds, signs for and disables the receiver. */
  private readonly endpoints: WebhookEndpointStore;

  /** Logs each attempt. */
  private readonly deliveries: WebhookDeliveryLog;

  /** Posts the delivery to an https receiver. */
  private readonly sender: WebhookSender;

  /** Writes the delivery to an S3 receiver. */
  private readonly objects: WebhookObjectSink;

  /** The disable time of a dead letter. */
  private readonly clock: Clock;

  /**
   * @param endpoints - the endpoint store.
   * @param deliveries - the delivery log.
   * @param sender - the webhook sender.
   * @param clock - the clock.
   * @param objects - the object sink of S3 receivers.
   */
  constructor(
    endpoints: WebhookEndpointStore,
    deliveries: WebhookDeliveryLog,
    sender: WebhookSender,
    clock: Clock,
    objects: WebhookObjectSink,
  ) {
    super();
    this.endpoints = endpoints;
    this.deliveries = deliveries;
    this.sender = sender;
    this.objects = objects;
    this.clock = clock;
  }

  /**
   * Signs, delivers and logs one attempt; a receiver removed or disabled since the job was queued is skipped.
   *
   * @throws WebhookDeliveryFailedError when the receiver does not answer with a 2xx, or the object is not written (the
   *         queue retries it).
   * @throws Error when the store cannot resolve a signing secret; nothing is sent.
   */
  async handle(input: DeliverWebhookInput, ctx: ActionContext): Promise<void> {
    const now = ctx.now();
    const target = await this.endpoints.target(input.endpointId, now);
    if (target === null) return;
    const outcome = await attemptWebhook(
      {
        url: target.url,
        eventId: input.eventId,
        type: input.type,
        body: input.body,
        secrets: target.secrets,
        now,
        signal: ctx.abortSignal,
      },
      { sender: this.sender, objects: this.objects },
    );
    await this.deliveries.record({
      endpointId: target.id,
      scope: target.scope,
      eventId: input.eventId,
      eventType: input.type,
      responseStatus: outcome.status,
      isDelivered: outcome.isDelivered,
    });
    if (!outcome.isDelivered)
      throw WebhookDeliveryFailedError.create(
        { status: outcome.status },
        outcome.cause === undefined ? {} : { cause: outcome.cause },
      );
  }

  /** Called once by the queue after the last retry: the receiver has failed for about three days, so it stops. */
  async disableEndpoint(input: DeliverWebhookInput): Promise<void> {
    await this.endpoints.disable(input.endpointId, this.clock.now());
  }
}
