/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/console, the leaf types a command author and a CLI
 *          owner name, until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing; types and the `CommandAudit` port.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export type { ArgumentOptions } from "#contracts/types/argument-options.type";
export { CommandAudit } from "#contracts/ports/command-audit.port";
export { OperatorBreakGlass } from "#contracts/ports/operator-break-glass.port";
export { ProcessRunner } from "#contracts/ports/process-runner.port";
export { Renderer } from "#contracts/ports/renderer.port";
export type { CheckRow } from "#contracts/types/check-row.type";
export type { CheckStatus } from "#contracts/types/check-status.type";
export type { ChecklistSpec } from "#contracts/types/checklist-spec.type";
export type { ChecklistSummary } from "#contracts/types/checklist-summary.type";
export type { MessageTone } from "#contracts/types/message-tone.type";
export type { NoteTone } from "#contracts/types/note-tone.type";
export type { Problem } from "#contracts/types/problem.type";
export type { ProcessResult } from "#contracts/types/process-result.type";
export type { ProcessRunOptions } from "#contracts/types/process-run-options.type";
export type { Progress } from "#contracts/types/progress.type";
export type { Spinner } from "#contracts/types/spinner.type";
export type { TableColumn } from "#contracts/types/table-column.type";
export type { TableSpec } from "#contracts/types/table-spec.type";
export type { TreeNode } from "#contracts/types/tree-node.type";
export type { BreakGlassSession } from "#contracts/types/break-glass-session.type";
export type { CommandAuditEntry } from "#contracts/types/command-audit-entry.type";
export type { CommandField } from "#contracts/types/command-field.type";
export type { CommandOptions } from "#contracts/types/command-options.type";
export type { CommandStructure } from "#contracts/types/command-structure.type";
export type { ConsoleSignal } from "#contracts/types/console-signal.type";
export type { ConsoleTheme } from "#contracts/types/console-theme.type";
export type { ThemeColours } from "#contracts/types/theme-colours.type";
export type { ValueKind } from "#contracts/types/value-kind.type";
export type { OptionOptions } from "#contracts/types/option-options.type";
export type { PromptAnswer } from "#contracts/types/prompt-answer.type";
export type { PromptChoice } from "#contracts/types/prompt-choice.type";
export type { PromptKind } from "#contracts/types/prompt-kind.type";
export type { PromptRequest } from "#contracts/types/prompt-request.type";
export type { Prompter } from "#contracts/types/prompter.type";
export type { SignalSource } from "#contracts/types/signal-source.type";
export type { WritableText } from "#contracts/types/writable-text.type";
