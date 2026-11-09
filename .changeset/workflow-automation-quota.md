---
"@stackra/workflow": minor
"@stackra/gen": patch
---

Every automation run a trigger or a schedule starts is now checked against the new `AutomationQuota` port, which `AutomationService` injects, so a host that runs automations must select a driver: its billing's (Figentra Billing's `credits.quota.check@1` on the meter `automation.runs`) or `UnlimitedAutomationQuotaDriver`, on purpose. Over the quota, the run is skipped and `AutomationRunSkipped` (`quota_exceeded`) is recorded; that is not a failure. An unreadable quota starts nothing: an event start throws the retryable `AutomationQuotaUnavailableError`, so the outbox redelivers, and a schedule start records `quota_unavailable`. `AutomationService.triggered(block, startedBy)` takes an `AutomationStart`. Gen's platform binding of `AutomationService` gains the port.
