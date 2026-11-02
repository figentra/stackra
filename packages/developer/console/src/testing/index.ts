/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./testing` entry of @stackra/console, the in-process run harness and its parts, until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { MemoryOperatorBreakGlassDriver } from "#testing/drivers/memory-operator-break-glass.driver";
export { MemoryCommandAuditDriver } from "#testing/drivers/memory-command-audit.driver";
export { MemoryProcessRunnerDriver } from "#testing/drivers/memory-process-runner.driver";
export { manualSignals } from "#testing/functions/manual-signals.function";
export { memoryText } from "#testing/functions/memory-text.function";
export { runCommandForTest } from "#testing/functions/run-command-for-test.function";
export { scriptedPrompter } from "#testing/functions/scripted-prompter.function";
export type { ManualSignals } from "#testing/types/manual-signals.type";
export type { MemoryText } from "#testing/types/memory-text.type";
export type { TestRunOptions } from "#testing/types/test-run-options.type";
export type { TestRunResult } from "#testing/types/test-run-result.type";
