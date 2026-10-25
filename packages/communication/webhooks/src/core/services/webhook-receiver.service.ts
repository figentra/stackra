/**
 * Stackra file contract:
 * Purpose: `WebhookReceiver`, the inbound side of webhooks: it verifies one provider webhook against the secret its URL
 *          resolves, before any field is parsed, routes it by the payload's event type to its `WebhookEvent<I>` class
 *          and writes the event to the outbox, so its listeners run after the delivery is acknowledged.
 * Boundary: a platform service; the generated route (`/webhooks/<module>/<name>/:connectionId`) calls `receive` and maps
 *           a refusal to its status. A connection's URL verifies only against that connection's secret field and the
 *           platform's URL only against the Integration's `@Secret` field, read blind from the `SecretStore`: neither
 *           falls back to the other, so an event signed for one is refused at the other. The event id is the
 *           `webhook-id`, so a redelivery is deduplicated by the inbox; `connection` travels in the event's metadata
 *           and reaches listeners as `ctx.connection`. An event type with no class is acknowledged and dropped, so the
 *           provider never retries it.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 15, 16 and 20); ADR 0224 (decision 4, as amended); ADR 0078 (decision 4: inbox
 *                     dedup); ADR 0173 (secrets read blind).
 */
import { Secret, type SecretStore } from "@stackra/config";
import { Service } from "@stackra/container";
import type { Clock } from "@stackra/contracts";
import { NotFoundError } from "@stackra/errors";
import type { Event } from "@stackra/events";
import type { EventOutbox } from "@stackra/events/contracts";
import {
  InvalidSignatureError,
  resolvePlaceholders,
  type ConnectionStore,
} from "@stackra/integrations";

import { WEBHOOK_EVENTS } from "#core/constants/webhook-events.constant";
import { verifyWebhook } from "#core/functions/verify-webhook.function";
import type { InboundWebhook } from "#core/types/inbound-webhook.type";

/** A string worth verifying with: not empty. */
const textOf = (value: unknown): string | undefined =>
  typeof value === "string" && value !== "" ? value : undefined;

/** The value at a dotted `path` of a parsed payload. */
function valueAt(payload: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (value, key) =>
        typeof value === "object" && value !== null ? Reflect.get(value, key) : undefined,
      payload,
    );
}

/**
 * Verifies, routes and records inbound webhooks.
 *
 * @example
 * const event = await receiver.receive({ integration: ResendIntegration, connectionId, headers, body });
 */
export class WebhookReceiver extends Service {
  /** Loads a connection's secret field. */
  private readonly connections: ConnectionStore;

  /** Resolves the Integration's `@Secret` fields by name. */
  private readonly secrets: SecretStore;

  /** Where the verified event is written for its listeners. */
  private readonly outbox: EventOutbox;

  /** The tolerance window's now. */
  private readonly clock: Clock;

  /**
   * @param connections - the connection store.
   * @param secrets - the secret store.
   * @param outbox - the event outbox.
   * @param clock - the clock.
   */
  constructor(
    connections: ConnectionStore,
    secrets: SecretStore,
    outbox: EventOutbox,
    clock: Clock,
  ) {
    super();
    this.connections = connections;
    this.secrets = secrets;
    this.outbox = outbox;
    this.clock = clock;
  }

  /**
   * Verifies `request`, then writes the event its type names to the outbox.
   *
   * @returns the event written, or `undefined` when no class handles the payload's type.
   * @throws InvalidSignatureError when the signature, the id or the timestamp does not verify.
   * @throws NotFoundError when the URL names a connection that does not exist, or the Integration has none.
   * @throws TypeError when the Integration has no registered webhook event or its secret placeholder has no value.
   */
  async receive(request: InboundWebhook): Promise<Event | undefined> {
    const { integration, connectionId, headers, body } = request;
    const route = WEBHOOK_EVENTS.byIntegration.get(integration);
    if (route === undefined)
      throw new TypeError(
        `${integration.name} has no registered webhook event: gen's entry calls registerWebhookEvents`,
      );
    let lookup: (field: string) => string | undefined;
    if (connectionId === undefined) {
      const names = Secret.members(integration);
      lookup = (field) => {
        const name = names.get(field);
        return name === undefined ? undefined : textOf(this.secrets.get(name));
      };
    } else {
      if (route.connection === undefined) throw NotFoundError.create();
      const connection = await this.connections.byId(route.connection, connectionId);
      lookup = (field) => textOf(Reflect.get(connection, field));
    }
    const secret = resolvePlaceholders(route.webhooks.secret, lookup);
    if (!(await verifyWebhook(headers, body, [secret], this.clock.now())))
      throw InvalidSignatureError.create();
    const payload: unknown = JSON.parse(body);
    const type = valueAt(payload, route.webhooks.eventType.path);
    const eventClass = typeof type === "string" ? route.types.get(type) : undefined;
    if (eventClass === undefined) return undefined;
    // reason: the event's generated schema checks the payload at runtime; `create` types its fields from the class
    const event = (eventClass as unknown as { create(values: unknown): Event }).create(payload);
    const id = headers["webhook-id"] ?? headers["svix-id"] ?? "";
    const sentAt = Number(headers["webhook-timestamp"] ?? headers["svix-timestamp"]);
    await this.outbox.write([
      {
        event,
        meta: {
          id,
          occurredAt: new Date(sentAt * 1000),
          ...(connectionId === undefined ? {} : { connection: connectionId }),
        },
      },
    ]);
    return event;
  }
}
