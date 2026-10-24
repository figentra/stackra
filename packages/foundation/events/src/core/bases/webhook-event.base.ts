/**
 * Stackra file contract:
 * Purpose: `WebhookEvent<I>({ type })`, the kind base of an inbound provider webhook: the Integration `I` verifies the
 *          signature before any field is parsed and routes by the payload's type to this class; listeners receive it
 *          in the connection's tenant, with `ctx.connection` set.
 * Boundary: called only, with the Integration as a type argument; the class names only the provider's event type.
 *           Verification, routing, the URL and the secret belong to the Integration (`@stackra/integrations`), which
 *           imports this package, never the reverse.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 15 and 16); ADR 0305 (rules 2, 19 and 42 to 46); ADR 0224 (webhooks).
 */
import { createKind } from "@stackra/container";

import { Event } from "#core/bases/event.base";
import type { WebhookEventClass } from "#core/types/webhook-event-class.type";
import type { WebhookEventOptions } from "#core/types/webhook-event-options.type";

/** The runtime base. Not exported: authors extend `WebhookEvent<I>({ ... })`. */
abstract class WebhookEventBase extends Event {
  /** Type-only kind brand. */
  declare protected readonly "~kind": "webhook_event";
}

/** Checks the options. */
function read(options: WebhookEventOptions) {
  if (typeof options?.type !== "string" || options.type === "")
    throw new TypeError(
      `WebhookEvent({ type }) needs the provider's event type, got ${JSON.stringify(options?.type)}`,
    );
  return { ...options };
}

/**
 * The webhook event kind base.
 *
 * @example
 * export class InboundMailReceived extends WebhookEvent<ResendIntegration>({ type: "email.received" }) {
 *   created_at!: Date;
 *   data!: ResendEmailReceivedData;
 * }
 */
export const WebhookEvent = createKind("webhook_event", WebhookEventBase, read) as <
  I extends object,
>(
  options: WebhookEventOptions,
) => WebhookEventClass<I>;
