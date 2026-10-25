/**
 * Stackra file contract:
 * Purpose: `InboundWebhook`, one provider webhook as the generated route hands it to `WebhookReceiver.receive`: the
 *          Integration its path names, the connection id of a connection's URL, the headers and the raw body.
 * Boundary: a type only. The body is the raw text, never parsed JSON, because the signature covers its exact bytes.
 *           Header names are lowercase. `connectionId` comes from the URL (`/webhooks/<module>/<name>/:connectionId`),
 *           never from the body; absent, the delivery is for the platform's own account.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 15 and 16); the Standard Webhooks specification.
 */
import type { IntegrationClass } from "@stackra/integrations";

/** One received webhook. */
export interface InboundWebhook {
  /** The Integration the URL names (`ResendIntegration`). */
  readonly integration: IntegrationClass;

  /** The connection a connection's URL names; absent for the platform's own account. */
  readonly connectionId?: string;

  /** The request's headers, lowercase names. */
  readonly headers: Readonly<Record<string, string | undefined>>;

  /** The raw body, exactly as received. */
  readonly body: string;
}
