---
"@stackra/workflow": minor
---

With a `QueueService` bound, a trigger occurrence starts its automations through the new queued job `StartTriggeredAutomationsAction` (`workflow.automation.start_triggered@1`), pushed in the delivery's transaction and scope. An automation quota that cannot be read now throws a retryable `AutomationQuotaUnavailableError` on an attempt a retry follows, and only the job's last attempt records `AutomationRunSkipped` (`quota_unavailable`), so a short quota outage no longer skips the occurrence. `AutomationService.triggered(block, startedBy, { last })` takes the attempt; without a queue, starts run in process as before.
