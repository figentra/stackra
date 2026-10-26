/**
 * Stackra file contract:
 * Purpose: the `WebhookEntitlementSource` port: which of the entitlements the outbound webhook events name (the
 *          `entitlement` of a `registerOutboundWebhooks` row) a scope node is granted, so an endpoint subscribes to a
 *          gated event (the audit SIEM stream) only on a plan that includes it.
 * Boundary: an abstract class that is its own token, keyed `webhooks.WebhookEntitlementSource`. It answers grants by
 *           entitlement key (`records.audit_evidence`) and nothing else; a deployment binds a driver over the
 *           entitlements package's `EntitlementSource` (the plan snapshot in SaaS, the licence on-prem). Webhooks
 *           depends on no entitlements package: the key is text, as settings' `SettingEntitlementSource` (ADR 0420).
 * Runtime: isomorphic
 * Governing contract: ADR 0422 (decision 4); ADR 0420 (decision 2); ADR 0215 (decision 1: grants come from one source).
 */
import { Port } from "@stackra/contracts";

/**
 * Answers the granted entitlements of a scope node.
 *
 * @example
 * export class PlanWebhookEntitlementSourceDriver extends Driver(WebhookEntitlementSource) {
 *   async granted(entitlements: readonly string[], scopeId: string): Promise<ReadonlySet<string>> { ... }
 * }
 */
export abstract class WebhookEntitlementSource extends Port {
  /** Type-only port key, so `DriverName<WebhookEntitlementSource>` narrows to this port's drivers. */
  declare readonly "~key": "webhooks.WebhookEntitlementSource";

  /**
   * The keys of `entitlements` scope node `scopeId` is granted; a key not answered is not granted.
   *
   * @throws Error when the grants cannot be read; the subscription or fan-out then fails, never as granted.
   */
  abstract granted(entitlements: readonly string[], scopeId: string): Promise<ReadonlySet<string>>;
}
