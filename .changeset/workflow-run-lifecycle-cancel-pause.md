---
"@stackra/workflow": minor
---

Add run operations to `@stackra/workflow` (ADR 0152 decision 4). Every run records `WorkflowRunStarted` and
`WorkflowRunEnded` (domain events on the bound bus) so a host can record and meter runs. A document run keeps the
automation it runs (`startDocument(…, { automation })`, `WorkflowRun.automation`, migration `workflow.0007`) and
`WorkflowJournal.byAutomation` lists an automation's runs newest first; the explorer passes the automation for
triggered runs. `NativeWorkflowRunnerDriver.cancel(runId, reason)` ends a running or waiting run in the new
`cancelled` status. `AutomationService.pause(automationId, reason)` pauses an automation for a host's reason.
`WorkflowJournal` gains the abstract `byAutomation`: a custom journal driver must implement it.
