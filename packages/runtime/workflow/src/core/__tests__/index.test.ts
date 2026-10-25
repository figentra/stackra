/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: the kind bases, `@Step`, the status enums, the engine with its
 *          journal port and memory journal, the configuration with its shipped schema under the generated name
 *          `WorkflowConfig$`, its shape and the key registration, the building-block registry, the automation
 *          document kind (`AutomationDocument$`, its check, its dry run and refusals) and the workflow template pack
 *          (`WorkflowTemplatePack$`) are its values, and nothing else is.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import { AUTOMATION_DOCUMENT_SCHEMA } from "#core/constants/automation-document-schema.constant";
import { WORKFLOW_CONFIG_SCHEMA } from "#core/constants/workflow-config-schema.constant";
import { WORKFLOW_TEMPLATE_PACK_SCHEMA } from "#core/constants/workflow-template-pack-schema.constant";
import * as workflow from "#core/index";

describe("@stackra/workflow", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(workflow).sort()).toEqual([
      "AutomationChangedError",
      "AutomationDocument$",
      "AutomationInvalidError",
      "AutomationNotDryRunError",
      "BlockKind",
      "DryRunOutcome",
      "MemoryWorkflowJournalDriver",
      "NativeWorkflowRunnerDriver",
      "SeedResult",
      "Signal",
      "Step",
      "StepStatus",
      "Workflow",
      "WorkflowConfig",
      "WorkflowConfig$",
      "WorkflowEngineOptions",
      "WorkflowJournal",
      "WorkflowRunStatus",
      "WorkflowTemplatePack$",
      "buildingBlocks",
      "checkAutomation",
      "dryRun",
      "registerBlocks",
      "registerWorkflows",
    ]);
  });

  it("exports the shipped schemas under their generated names", () => {
    expect(workflow.WorkflowConfig$).toBe(WORKFLOW_CONFIG_SCHEMA);
    expect(workflow.AutomationDocument$).toBe(AUTOMATION_DOCUMENT_SCHEMA);
    expect(workflow.WorkflowTemplatePack$).toBe(WORKFLOW_TEMPLATE_PACK_SCHEMA);
  });
});
