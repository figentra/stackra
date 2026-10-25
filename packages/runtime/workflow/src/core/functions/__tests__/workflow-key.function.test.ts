/**
 * Stackra file contract:
 * Purpose: unit tests of `workflowKey`: a registered class's key, else its class name, registered on first use so the
 *          class is found again by key.
 * Boundary: test only; reads and writes the process-wide registry.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 20).
 */
import { describe, expect, it } from "@stackra/testing";

import { Workflow } from "#core/bases/workflow.base";
import { WORKFLOW_KEYS } from "#core/constants/workflow-keys.constant";
import { registerWorkflows } from "#core/functions/register-workflows.function";
import { workflowKey } from "#core/functions/workflow-key.function";

class KeyedWorkflow extends Workflow({}) {}

class UnkeyedWorkflow extends Workflow({}) {}

describe(workflowKey, () => {
  it("gives the registered key", () => {
    registerWorkflows([{ type: KeyedWorkflow, key: "billing.keyed" }]);
    expect(workflowKey(KeyedWorkflow)).toBe("billing.keyed");
  });

  it("falls back to the class name and registers it", () => {
    expect(workflowKey(UnkeyedWorkflow)).toBe("UnkeyedWorkflow");
    expect(WORKFLOW_KEYS.byKey.get("UnkeyedWorkflow")).toBe(UnkeyedWorkflow);
  });
});
