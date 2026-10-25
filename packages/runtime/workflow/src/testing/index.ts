/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./testing` entry of @stackra/workflow (the in-process test driver: the testing-module
 *          plugin, `runWorkflow`, `signal` and the result type) until `stackra gen` writes the entry barrels
 *          (STA-339).
 * Boundary: names each re-export and declares nothing. Importing it registers the plugin with the testing module;
 *           gen's vitest config loads it for every member that depends on @stackra/workflow.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0269 (decision 3); the STA-347 stand-in barrel decision.
 */
export { WORKFLOW_TESTING_PLUGIN } from "#testing/constants/workflow-testing-plugin.constant";
export { runWorkflow } from "#testing/functions/run-workflow.function";
export { signal } from "#testing/functions/signal.function";
export type { WorkflowResult } from "#testing/types/workflow-result.type";
