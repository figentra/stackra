/**
 * Stackra file contract:
 * Purpose: `UnlimitedAutomationQuotaDriver`, the `AutomationQuota` that allows every run: for a host that sells no
 *          automation quota (a self-hosted install, an internal tool) and picks it on purpose.
 * Boundary: a candidate a host selects through config, never a default: a host that runs automations and selects no
 *           driver fails at boot. It is this package's own tests' default (`testDefault`).
 * Runtime: isomorphic
 * Governing contract: ADR 0122 (decision 3); ADR 0266 (2026-10-28 note: test-default drivers).
 */
import { Driver } from "@stackra/container";

import { AutomationQuotaAnswer } from "#core/enums/automation-quota-answer.enum";
import { AutomationQuota } from "#core/ports/automation-quota.port";

/**
 * Every run allowed.
 *
 * @example
 * await new UnlimitedAutomationQuotaDriver().check(scope, automationId); // "allow"
 */
export class UnlimitedAutomationQuotaDriver extends Driver(AutomationQuota, { testDefault: true }) {
  /** See `AutomationQuota.check`: always `allow`. */
  async check(): Promise<AutomationQuotaAnswer> {
    return AutomationQuotaAnswer.Allow;
  }
}
