/**
 * Stackra file contract:
 * Purpose: the `AutomationQuota` port: whether a tenant may start one more run of a published automation, asked
 *          before each run a trigger or a schedule starts, so a tenant over its plan's automation quota starts none.
 * Boundary: an abstract class that is its own token, keyed `workflow.AutomationQuota`; `AutomationService` injects
 *           it, so a host that runs automations must select a driver: its billing's (Figentra Billing's usage query
 *           `credits.quota.check@1` on the meter `automation.runs`, in the automation's scope), or
 *           `UnlimitedAutomationQuotaDriver` on purpose. Never a silent default. This package names no billing service.
 *           A driver only reads: the run's own usage event consumes the quota. A driver that cannot answer returns
 *           `unavailable` (or throws), and no run starts.
 * Runtime: isomorphic
 * Governing contract: ADR 0122 (decision 3); ADR 0142 (drivers behind ports); ADR 0153 (decision 2).
 */
import { Port } from "@stackra/contracts";
import type { PublicId, ScopeRef } from "@stackra/contracts";

import type { AutomationQuotaAnswer } from "#core/enums/automation-quota-answer.enum";

/**
 * Whether a tenant's automation may run again.
 *
 * @example
 * export class UsageAutomationQuotaDriver extends Driver(AutomationQuota) {
 *   async check(scope, automationId) { ... } // credits.quota.check@1 { meter: "automation.runs", units: 1 }
 * }
 */
export abstract class AutomationQuota extends Port {
  /** Type-only port key, so `DriverName<AutomationQuota>` narrows to this port's drivers. */
  declare readonly "~key": "workflow.AutomationQuota";

  /**
   * The answer for one more run of `automationId`, which belongs to the scope node `scope`; the driver asks in that
   * scope, whose tenant the quota is.
   */
  abstract check(scope: ScopeRef, automationId: PublicId<"wfa">): Promise<AutomationQuotaAnswer>;
}
