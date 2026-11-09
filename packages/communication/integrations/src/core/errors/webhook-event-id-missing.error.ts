/**
 * Stackra file contract:
 * Purpose: `webhook_event_id_missing`: a verified inbound webhook lacks a part of its event id (a payload path or a
 *          header the Integration's `webhooks.eventId` names), so it cannot be deduplicated and is refused instead of
 *          sharing an empty id with every other event.
 * Boundary: thrown by the webhook receiver after the signature verifies and before anything is written.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 20); ADR 0140.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** The event names no id the Integration can deduplicate it by. */
export class WebhookEventIdMissingError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {}
