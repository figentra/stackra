/**
 * Stackra file contract:
 * Purpose: `webhooks.webhook_delivery.send@1`, the outbound delivery job: signs one event for one endpoint with the
 *          endpoint's signing secrets, posts it through the `WebhookSender` (an https endpoint) or writes it as an object
 *          through the `WebhookObjectSink` (an `s3://bucket/prefix` endpoint), logs the attempt, and fails a non-2xx
 *          answer or a refused write so the queue retries it for about three days; a dead letter disables the endpoint.
 * Boundary: a job only (the job actor, no endpoint, no tool). Each attempt reads the secret values blind from the
 *           `SecretStore` by the names the endpoint holds and keeps them nowhere; the job input holds the body, never
 *           a secret. The `webhook-id` is the event id on every attempt, so the receiver deduplicates; the timestamp
 *           is the attempt's. An endpoint removed or disabled since the job was queued is skipped. The attempt is logged
 *           in its own transaction before the refusal, so the log keeps it when the attempt rolls back. An object is keyed
 *           by the event id and the body's occurrence day, so a retry rewrites it; its metadata is the signed headers,
 *           and its log row has no HTTP status.
 * Runtime: node
 * Governing contract: ADR 0224 (decisions 2 and 3); ADR 0305 (rules 28 and 30); ADR 0148 (decision 1); ADR 0173; ADR
 *                     0422 (decision 4).
 */
import { Action, type ActionContext } from "@stackra/actions";
import type { SecretStore } from "@stackra/config/contracts";
import { ActorKind } from "@stackra/contracts";
import type { Clock } from "@stackra/contracts";
import { Backoff } from "@stackra/queue";

import type { WebhookObjectSink, WebhookSender } from "#contracts/index";
import { s3TargetOf, signWebhook, WebhookDeliveryFailedError, webhookObjectKey } from "#core/index";
import type { DeliverWebhookInput } from "#node/schemas/deliver-webhook-input.schema";
import type { WebhookDeliveryService } from "#node/services/webhook-delivery.service";
import type { WebhookEndpointService } from "#node/services/webhook-endpoint.service";

/** Delivers one event to one endpoint. */
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
  /** Reads and disables the endpoint. */
  private readonly endpoints: WebhookEndpointService;

  /** Logs each attempt. */
  private readonly deliveries: WebhookDeliveryService;

  /** Posts the delivery to an https endpoint. */
  private readonly sender: WebhookSender;

  /** Writes the delivery to an S3 endpoint. */
  private readonly objects: WebhookObjectSink;

  /** Resolves the signing secrets by name. */
  private readonly secrets: SecretStore;

  /** The disable time of a dead letter. */
  private readonly clock: Clock;

  /**
   * @param endpoints - the endpoint service.
   * @param deliveries - the delivery log.
   * @param sender - the webhook sender.
   * @param secrets - the secret store.
   * @param clock - the clock.
   * @param objects - the object sink of S3 endpoints.
   */
  constructor(
    endpoints: WebhookEndpointService,
    deliveries: WebhookDeliveryService,
    sender: WebhookSender,
    secrets: SecretStore,
    clock: Clock,
    objects: WebhookObjectSink,
  ) {
    super();
    this.endpoints = endpoints;
    this.deliveries = deliveries;
    this.sender = sender;
    this.objects = objects;
    this.secrets = secrets;
    this.clock = clock;
  }

  /**
   * Signs, posts and logs one attempt.
   *
   * @throws WebhookDeliveryFailedError when the endpoint does not answer with a 2xx, or the object is not written (the
   *         queue retries it).
   * @throws TypeError when a signing secret the endpoint names has no value in the secret store.
   */
  async handle(input: DeliverWebhookInput, ctx: ActionContext): Promise<void> {
    const endpoint = await this.endpoints.findOne({ id: input.endpointId });
    if (endpoint === null || endpoint.disabledAt !== null) return;
    const now = ctx.now();
    const secrets = endpoint.secretNamesAt(now).map((name) => {
      const value = this.secrets.get(name);
      if (value === undefined || value === "")
        throw new TypeError(`The webhook signing secret ${name} has no value in the secret store`);
      return value;
    });
    const signed = await signWebhook(
      { id: input.eventId, timestamp: now, body: input.body },
      secrets,
    );
    const target = s3TargetOf(endpoint.url);
    let status: number | null = null;
    let isDelivered = false;
    let cause: unknown;
    try {
      if (target === undefined) {
        status = await this.sender.send({
          url: endpoint.url,
          headers: { ...signed, "content-type": "application/json" },
          body: input.body,
          signal: ctx.abortSignal,
        });
        isDelivered = status >= 200 && status < 300;
      } else {
        await this.objects.put({
          bucket: target.bucket,
          ...(target.region === undefined ? {} : { region: target.region }),
          key: webhookObjectKey(target, input.type, input.eventId, occurredAtOf(input.body, now)),
          body: input.body,
          metadata: { ...signed },
          signal: ctx.abortSignal,
        });
        isDelivered = true;
      }
    } catch (error) {
      cause = error;
    }
    await this.deliveries.record({
      endpointId: endpoint.id,
      scopeId: endpoint.scopeId,
      scopePath: endpoint.scopePath,
      eventId: input.eventId,
      eventType: input.type,
      responseStatus: status,
      isDelivered,
    });
    if (!isDelivered)
      throw WebhookDeliveryFailedError.create({ status }, cause === undefined ? {} : { cause });
  }

  /** Called once by the queue after the last retry: the endpoint has failed for about three days, so it stops. */
  async disableEndpoint(input: DeliverWebhookInput): Promise<void> {
    await this.endpoints.disable(input.endpointId, this.clock.now());
  }
}

/** The occurrence time in the delivery body (`{ type, timestamp, data }`), or `fallback` when it has none. */
function occurredAtOf(body: string, fallback: Date): Date {
  const timestamp: unknown = (JSON.parse(body) as { readonly timestamp?: unknown }).timestamp;
  const at = typeof timestamp === "string" ? new Date(timestamp) : fallback;
  return Number.isNaN(at.getTime()) ? fallback : at;
}
