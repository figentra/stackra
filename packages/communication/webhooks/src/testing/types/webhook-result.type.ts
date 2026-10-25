/**
 * Stackra file contract:
 * Purpose: `WebhookResult`, what `deliverWebhook` resolves to: the event the receiver wrote (or `undefined` for a type no
 *          class handles), or the refusal the generated route would answer with.
 * Boundary: a type only. A refusal resolves rather than rejects, so a test asserts it with
 *           `expect(result).toRefuseWith(refusal(InvalidSignatureError))`; any other error rejects.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0140 (refusals).
 */
import type { Refusal } from "@stackra/errors";
import type { Event } from "@stackra/events";

/** The outcome of one delivered webhook. */
export type WebhookResult =
  | { readonly ok: true; readonly event: Event | undefined }
  | { readonly ok: false; readonly error: Refusal };
