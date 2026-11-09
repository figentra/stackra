---
"@stackra/workflow": minor
"@stackra/gen": patch
---

Every automation run a trigger or a schedule starts is now checked against the new `AutomationQuota` port, which `AutomationService` injects, so a host that runs automations must select a driver. Over the quota, the run is skipped and `AutomationRunSkipped` (`quota_exceeded`) is recorded; that is not a failure. A quota that cannot be read starts nothing and records `quota_unavailable` (fail closed); `triggered` never throws for a quota. `AutomationService.triggered(block, startedBy)` takes an `AutomationStart`, kept on the skip. Gen's platform binding of `AutomationService` gains the port.

Release order: this core release first; then Figentra Billing publishes its usage client package with the driver (`credits.quota.check@1` on `automation.runs`, called as the host member inside the automation's tenant); then os bumps and selects that driver in the same pull request. No host takes `UnlimitedAutomationQuotaDriver` as a stopgap: it is only for a host that sells no automation quota.
