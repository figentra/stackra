/**
 * Stackra file contract:
 * Purpose: `PLATFORM_BINDINGS`, the platform services a member injects whose constructor tokens gen knows, so the
 *          wiring binds each one where it is used: `RequestContext` (where `CustomFieldService` resolves),
 *          `IntegrationRuntime` (the one dependency of every Integration), `Locks` (the dependency of `journalOf`),
 *          `WebhookReceiver` (the generated inbound webhook route), `SequenceService` (the one allocator of document
 *          numbers), `SettingsReader` with the market floor source, so the default reader of every service lifts a
 *          value below a legal floor, `SettingsResolver`, and `RuleSetService` over content's revisions repository, so
 *          a service that injects it gets the rules node without wiring it by hand.
 * Boundary: a frozen map keyed by `<package>#<Class>`; each value lists the constructor tokens in parameter order:
 *           a class, or a per-model token (`{ class: Model, of: repositoryOf }`) that gen binds through `MODEL_TOKENS`.
 *           A binding the dependency's own wiring also writes is the same row, so the host's copy changes nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0263 (gen writes the wiring); ADR 0294 (decision 17); ADR 0136 (RequestContext); ADR 0308
 *                     (IntegrationRuntime); ADR 0224 (WebhookReceiver); ADR 0342 (decision 5: SequenceService); ADR 0395
 *                     (decision 4: one reader path honours floors); ADR 0370 (decision 6); ADR 0331 (decisions 5 and 6).
 */
import type { ClassRef } from "#core/types/class-ref.type";
import type { TokenRef } from "#core/types/token-ref.type";

/** `<package>#<Class>` to the class's constructor tokens. */
export const PLATFORM_BINDINGS: Readonly<Record<string, readonly (ClassRef | TokenRef)[]>> =
  Object.freeze({
    "@stackra/actions#RequestContext": [
      { name: "ContextStorage", from: "@stackra/actions/contracts" },
    ],
    "@stackra/integrations#IntegrationRuntime": [
      { name: "SecretStore", from: "@stackra/config/contracts" },
      { name: "RateLimitStore", from: "@stackra/actions/contracts" },
      { name: "Clock", from: "@stackra/contracts" },
    ],
    "@stackra/locking#Locks": [
      { name: "LockDriver", from: "@stackra/locking/contracts" },
      { name: "Clock", from: "@stackra/contracts" },
    ],
    "@stackra/database#SequenceService": [
      { name: "Database", from: "@stackra/database" },
      { name: "Clock", from: "@stackra/contracts" },
    ],
    "@stackra/rules#RuleSetService": [
      {
        class: { name: "Revision", from: "@stackra/content/node" },
        of: { name: "repositoryOf", from: "@stackra/database" },
      },
    ],
    "@stackra/settings#SettingsReader": [
      { name: "SettingValueStore", from: "@stackra/settings/contracts" },
      { name: "SettingFloorSource", from: "@stackra/settings/contracts" },
    ],
    "@stackra/settings#SettingsResolver": [
      { name: "SettingValueStore", from: "@stackra/settings/contracts" },
      { name: "SettingFloorSource", from: "@stackra/settings/contracts" },
      { name: "SettingRevisionStore", from: "@stackra/settings/contracts" },
      { name: "Clock", from: "@stackra/contracts" },
    ],
    "@stackra/webhooks#WebhookReceiver": [
      { name: "ConnectionStore", from: "@stackra/integrations" },
      { name: "SecretStore", from: "@stackra/config/contracts" },
      { name: "EventOutbox", from: "@stackra/events/contracts" },
      { name: "Clock", from: "@stackra/contracts" },
    ],
  });
