/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/workflow (the `Workflow` and `Signal` kind bases, `@Step`, the
 *          two status enums, the run and step types, the native engine with its journal port and memory journal, the
 *          configuration and the key registration; the building-block registry, the automation document kind with its
 *          check and dry run, the workflow template pack and their refusals) until `stackra gen` writes the entry
 *          barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The shipped schemas are re-exported under their generated
 *           names (`WorkflowConfig$`, `AutomationDocument$`, `WorkflowTemplatePack$`). The plans, keys, id minting and defaults stay internal. The Postgres journal and the
 *           explorer are `./node`'s, the test driver `./testing`'s. There is no `./contracts`: the journal port and the
 *           run records name the status enums, which the template imports from `.`, so they live here together.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note.
 */
export { WorkflowConfig } from "#config/workflow.config";
export { Signal } from "#core/bases/signal.base";
export { Workflow } from "#core/bases/workflow.base";
export type { WorkflowBase } from "#core/bases/workflow.base";
export { AUTOMATION_DOCUMENT_SCHEMA as AutomationDocument$ } from "#core/constants/automation-document-schema.constant";
export { CHECKLIST_CUSTOMIZATION_SCHEMA as ChecklistCustomization$ } from "#core/constants/checklist-customization-schema.constant";
export { CHECKLIST_TEMPLATE_SCHEMA as ChecklistTemplate$ } from "#core/constants/checklist-template-schema.constant";
export { INDUSTRY_PROFILE_SCHEMA as IndustryProfile$ } from "#core/constants/industry-profile-schema.constant";
export { WORKFLOW_CONFIG_SCHEMA as WorkflowConfig$ } from "#core/constants/workflow-config-schema.constant";
export { WORKFLOW_TEMPLATE_PACK_SCHEMA as WorkflowTemplatePack$ } from "#core/constants/workflow-template-pack-schema.constant";
export { Step } from "#core/decorators/step.decorator";
export { MemoryPublisherAccessDriver } from "#core/drivers/memory-publisher-access.driver";
export { MemoryWorkflowJournalDriver } from "#core/drivers/memory-workflow-journal.driver";
export { NativeWorkflowRunnerDriver } from "#core/drivers/native-workflow-runner.driver";
export { BlockKind } from "#core/enums/block-kind.enum";
export { ChecklistAudience } from "#core/enums/checklist-audience.enum";
export { DryRunOutcome } from "#core/enums/dry-run-outcome.enum";
export { SeedResult } from "#core/enums/seed-result.enum";
export { StepStatus } from "#core/enums/step-status.enum";
export { WorkflowRunStatus } from "#core/enums/workflow-run-status.enum";
export { AutomationChangedError } from "#core/errors/automation-changed.error";
export { AutomationExceedsPublisherError } from "#core/errors/automation-exceeds-publisher.error";
export { AutomationInvalidError } from "#core/errors/automation-invalid.error";
export { AutomationNotDryRunError } from "#core/errors/automation-not-dry-run.error";
export { ChecklistInvalidError } from "#core/errors/checklist-invalid.error";
export { AutomationPaused } from "#core/events/automation-paused.event";
export { ChecklistCompleted } from "#core/events/checklist-completed.event";
export { ChecklistStepCompleted } from "#core/events/checklist-step-completed.event";
export { ServiceAcked } from "#core/events/service-acked.event";
export { buildingBlocks } from "#core/functions/building-blocks.function";
export { checkAutomation } from "#core/functions/check-automation.function";
export { checkCustomization } from "#core/functions/check-customization.function";
export { checklistView } from "#core/functions/checklist-view.function";
export { dryRun } from "#core/functions/dry-run.function";
export { registerBlocks } from "#core/functions/register-blocks.function";
export { registerWorkflows } from "#core/functions/register-workflows.function";
export { PublisherAccess } from "#core/ports/publisher-access.port";
export { WorkflowJournal } from "#core/ports/workflow-journal.port";
export { WorkflowEngineOptions } from "#core/schemas/workflow-engine-options.schema";
export { AllServicesAcked } from "#core/workflows/all-services-acked.signal";
export type { AutomationDocument } from "#core/types/automation-document.type";
export type { AutomationStep } from "#core/types/automation-step.type";
export type { BuildingBlock } from "#core/types/building-block.type";
export type { ChecklistCustomization } from "#core/types/checklist-customization.type";
export type { ChecklistTemplate } from "#core/types/checklist-template.type";
export type { ChecklistView } from "#core/types/checklist-view.type";
export type { ChecklistViewStep } from "#core/types/checklist-view-step.type";
export type { DryRun } from "#core/types/dry-run.type";
export type { DryRunStep } from "#core/types/dry-run-step.type";
export type { HeldSignal } from "#core/types/held-signal.type";
export type { IndustryProfile } from "#core/types/industry-profile.type";
export type { ResultsOf } from "#core/types/results-of.type";
export type { Run } from "#core/types/run.type";
export type { RunOrigin } from "#core/types/run-origin.type";
export type { StepContext } from "#core/types/step-context.type";
export type { StepDecorator } from "#core/types/step-decorator.type";
export type { StepName } from "#core/types/step-name.type";
export type { StepOptions } from "#core/types/step-options.type";
export type { StepRetry } from "#core/types/step-retry.type";
export type { WorkflowClass } from "#core/types/workflow-class.type";
export type { WorkflowError } from "#core/types/workflow-error.type";
export type { WorkflowOptions } from "#core/types/workflow-options.type";
export type { WorkflowRun } from "#core/types/workflow-run.type";
export type { WorkflowStepRecord } from "#core/types/workflow-step-record.type";
export type { WorkflowTemplatePack } from "#core/types/workflow-template-pack.type";
