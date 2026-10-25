/**
 * Stackra file contract:
 * Purpose: `WebhookEventClass<I>`, what `WebhookEvent<I>({ type })` returns: an event class that carries its
 *          Integration as a type argument.
 * Boundary: a type only. The partner is type-only (`~integration` never exists at runtime); gen reads it from the
 *           heritage clause and fails with `partner_mismatch` when it is not an Integration. This package cannot
 *           import `@stackra/integrations`, so `I` is any object type here.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 5, 19 and 42 to 46: partner type arguments); ADR 0308 (rule 15).
 */
import type { Event } from "#core/bases/event.base";
import type { EventClass } from "#core/types/event-class.type";

/** A webhook event class of Integration `I`. */
export type WebhookEventClass<I extends object> = EventClass<Event> & {
  /** Type-only: the Integration that verifies and routes this event. */
  readonly "~integration"?: I;
};
