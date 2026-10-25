---
"@stackra/workflow": minor
---

Add automations to `@stackra/workflow`: the building-block registry (`registerBlocks`, `buildingBlocks`), the automation
document kind (`AutomationDocument$`, `checkAutomation`, `dryRun`), versioned `Automation` records with
`AutomationService` (draft, dry run, publish as a principal, seed from `WorkflowTemplatePack$` documents; migration
`workflow.0003`), and `NativeWorkflowRunnerDriver.startDocument`, which runs an automation or an agent's plan as a
workflow whose steps are action calls. Runs are pinned to the version they started on (`Workflow({ version })`,
migration `workflow.0002`), and a step may wait for an event as well as a signal.
