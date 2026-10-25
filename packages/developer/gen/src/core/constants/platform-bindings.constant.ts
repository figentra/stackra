/**
 * Stackra file contract:
 * Purpose: `PLATFORM_BINDINGS`, the platform services a member injects whose constructor tokens gen knows, so the
 *          wiring binds each one where it is used: `RequestContext` (where `CustomFieldService` resolves),
 *          `IntegrationRuntime` (the one dependency of every Integration), `Locks` (the dependency of `journalOf`) and
 *          `WebhookReceiver` (the generated inbound webhook route).
 * Boundary: a frozen map keyed by `<package>#<Class>`; each value lists the constructor tokens in parameter order.
 *           A binding the dependency's own wiring also writes is the same row, so the host's copy changes nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0263 (gen writes the wiring); ADR 0294 (decision 17); ADR 0136 (RequestContext); ADR 0308
 *                     (IntegrationRuntime); ADR 0224 (WebhookReceiver).
 */
import type { ClassRef } from "#core/types/class-ref.type";

/** `<package>#<Class>` to the class's constructor tokens. */
export const PLATFORM_BINDINGS: Readonly<Record<string, readonly ClassRef[]>> = Object.freeze({
  "@stackra/actions#RequestContext": [
    { name: "ContextStorage", from: "@stackra/actions/contracts" },
  ],
  "@stackra/integrations#IntegrationRuntime": [
    { name: "SecretStore", from: "@stackra/config" },
    { name: "RateLimitStore", from: "@stackra/actions/contracts" },
    { name: "Clock", from: "@stackra/contracts" },
  ],
  "@stackra/locking#Locks": [
    { name: "LockDriver", from: "@stackra/locking/contracts" },
    { name: "Clock", from: "@stackra/contracts" },
  ],
  "@stackra/webhooks#WebhookReceiver": [
    { name: "ConnectionStore", from: "@stackra/integrations" },
    { name: "SecretStore", from: "@stackra/config" },
    { name: "EventOutbox", from: "@stackra/events/contracts" },
    { name: "Clock", from: "@stackra/contracts" },
  ],
});
