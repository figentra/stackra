/**
 * Stackra file contract:
 * Purpose: `webhooks.webhook_delivery.send@1`, the outbound delivery job: signs one event for one endpoint with the
 *          endpoint's signing secrets, posts it through the `WebhookSender`, logs the attempt, and fails a non-2xx
 *          answer so the queue retries it for about three days; a dead letter disables the endpoint.
 * Boundary: a job only (the job actor, no endpoint, no tool). Each attempt reads the secret values blind from the
 *           `SecretStore` by the names the endpoint holds and keeps them nowhere; the job input holds the body, never
 *           a secret. The `webhook-id` is the event id on every attempt, so the receiver deduplicates; the timestamp
 *           is the attempt's. An endpoint removed or disabled since the job was queued is skipped. The attempt is logged
 *           in its own transaction before the refusal, so the log keeps it when the attempt rolls back.
 * Runtime: node
 * Governing contract: ADR 0224 (decisions 2 and 3); ADR 0305 (rules 28 and 30); ADR 0148 (decision 1); ADR 0173.
 */
import { Action, type ActionContext } from "@stackra/actions";
import type { SecretStore } from "@stackra/config/contracts";
import { ActorKind } from "@stackra/contracts";
import type { Clock } from "@stackra/contracts";
import { Backoff } from "@stackra/queue";

import type { WebhookSender } from "#contracts/index";
import { signWebhook, WebhookDeliveryFailedError } from "#core/index";
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

  /** Posts the delivery. */
  private readonly sender: WebhookSender;

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
   */
  constructor(
    endpoints: WebhookEndpointService,
    deliveries: WebhookDeliveryService,
    sender: WebhookSender,
    secrets: SecretStore,
    clock: Clock,
  ) {
    super();
    this.endpoints = endpoints;
    this.deliveries = deliveries;
    this.sender = sender;
    this.secrets = secrets;
    this.clock = clock;
  }

  /**
   * Signs, posts and logs one attempt.
   *
   * @throws WebhookDeliveryFailedError when the endpoint does not answer with a 2xx (the queue retries it).
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
    let status: number | null = null;
    let cause: unknown;
    try {
      status = await this.sender.send({
        url: endpoint.url,
        headers: { ...signed, "content-type": "application/json" },
        body: input.body,
        signal: ctx.abortSignal,
      });
    } catch (error) {
      cause = error;
    }
    const isDelivered = status !== null && status >= 200 && status < 300;
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
