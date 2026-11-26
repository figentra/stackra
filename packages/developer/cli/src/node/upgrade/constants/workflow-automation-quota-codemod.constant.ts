/**
 * Stackra file contract:
 * Purpose: `WORKFLOW_AUTOMATION_QUOTA_CODEMOD`, 0.31.0: a host that runs automations must select an `AutomationQuota`
 *          driver.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); ADR 0013 (decision 5); STA-145; changeset 137a7f9.
 */
import type { UpgradeCodemod } from "#node/upgrade/types/upgrade-codemod.type";

/** Automation runs are checked against the AutomationQuota port. */
export const WORKFLOW_AUTOMATION_QUOTA_CODEMOD: UpgradeCodemod = {
  id: "workflow-automation-quota",
  version: "0.31.0",
  title: "Automation runs are checked against the AutomationQuota port",
  note: "AutomationService injects the new AutomationQuota port, so a host that runs automations must select a driver: the plan service's usage client driver, or UnlimitedAutomationQuotaDriver only for a host that sells no automation quota. Over the quota a run is skipped and recorded as AutomationRunSkipped (quota_exceeded); a quota that cannot be read starts nothing (quota_unavailable).",
  source: "137a7f9",
};
