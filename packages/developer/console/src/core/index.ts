/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/console (the Command kind, its field decorators, `createConsole`,
 *          the theme, the errors and the presentation helpers), until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Nothing here imports `node:` other than `node:util`, so it runs
 *           wherever a CLI runs; the process binding is `./node`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { Command } from "#core/bases/command.base";
export { EXIT_CODE } from "#core/constants/exit-code.constant";
export { STACKRA_THEME } from "#core/constants/stackra-theme.constant";
export { Argument } from "#core/decorators/argument.decorator";
export { Option } from "#core/decorators/option.decorator";
export { CommandAuditMissingError } from "#core/errors/command-audit-missing.error";
export { CommandNotAuditedError } from "#core/errors/command-not-audited.error";
export { ConsoleDeclarationError } from "#core/errors/console-declaration.error";
export { DuplicateCommandError } from "#core/errors/duplicate-command.error";
export { NonInteractivePromptError } from "#core/errors/non-interactive-prompt.error";
export { PromptCancelledError } from "#core/errors/prompt-cancelled.error";
export { UsageError } from "#core/errors/usage.error";
export { createConsole } from "#core/functions/create-console.function";
export { displayWidth } from "#core/functions/display-width.function";
export { isolateBidi } from "#core/functions/isolate-bidi.function";
export { readCommand } from "#core/functions/read-command.function";
export { themeFromBrandTokens } from "#core/functions/theme-from-brand-tokens.function";
export type { BrandColourTokens } from "#core/types/brand-colour-tokens.type";
export type { BrandThemeChoice } from "#core/types/brand-theme-choice.type";
export type { CommandClass } from "#core/types/command-class.type";
export type { CommandField } from "#core/types/command-field.type";
export type { CommandIo } from "#core/types/command-io.type";
export type { CommandResult } from "#core/types/command-result.type";
export type { CommandStructure } from "#core/types/command-structure.type";
export type { ConsoleApp } from "#core/types/console-app.type";
export type { ConsoleConfig } from "#core/types/console-config.type";
export type { ConsoleContainer } from "#core/types/console-container.type";
export type { ConsoleOutput } from "#core/types/console-output.type";
export type { ConsolePorts } from "#core/types/console-ports.type";
export type { ConsolePrompt } from "#core/types/console-prompt.type";
export type { NoteTone } from "#core/types/note-tone.type";
export type { Progress } from "#core/types/progress.type";
export type { PromptPaint } from "#core/types/prompt-paint.type";
export type { Spinner } from "#core/types/spinner.type";
