/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./testing` entry of @stackra/shortcuts (`runShortcut`, its extension point
 *          `registerShortcutTestingPart` and their types) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Builds on the `.` entry's sources only; no other package's
 *           `./testing` (ADR 0269 decision 3): other packages take part through `registerShortcutTestingPart`.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0269 (decision 3); the STA-347 stand-in barrel decision.
 */
export { registerShortcutTestingPart } from "#testing/functions/register-shortcut-testing-part.function";
export { runShortcut } from "#testing/functions/run-shortcut.function";
export type { ShortcutRun } from "#testing/types/shortcut-run.type";
export type { ShortcutRunInput } from "#testing/types/shortcut-run-input.type";
export type { ShortcutTestingContribution } from "#testing/types/shortcut-testing-contribution.type";
export type { ShortcutTestingPart } from "#testing/types/shortcut-testing-part.type";
