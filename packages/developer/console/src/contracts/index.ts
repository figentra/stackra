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
export type { BreakGlassSession } from "#contracts/types/break-glass-session.type";
export type { CommandAuditEntry } from "#contracts/types/command-audit-entry.type";
export type { CommandOptions } from "#contracts/types/command-options.type";
export type { ConsoleSignal } from "#contracts/types/console-signal.type";
export type { ConsoleTheme } from "#contracts/types/console-theme.type";
export type { ThemeColours } from "#contracts/types/theme-colours.type";
export type { OptionOptions } from "#contracts/types/option-options.type";
export type { PromptAnswer } from "#contracts/types/prompt-answer.type";
export type { PromptChoice } from "#contracts/types/prompt-choice.type";
export type { PromptKind } from "#contracts/types/prompt-kind.type";
export type { PromptRequest } from "#contracts/types/prompt-request.type";
export type { Prompter } from "#contracts/types/prompter.type";
export type { SignalSource } from "#contracts/types/signal-source.type";
export type { WritableText } from "#contracts/types/writable-text.type";
