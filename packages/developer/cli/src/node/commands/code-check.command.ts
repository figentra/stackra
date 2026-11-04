/**
 * Stackra file contract:
 * Purpose: `CodeCheckCommand`, `stackra code:check`: the format and lint phases (`stackra check --only format,lint`),
 *          with the check flags.
 * Boundary: `checkCommand` and `runCheck` do the work; it writes nothing without `--fix`.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3); ADR 0506; STA-1966; the quality-gate coverage audit of 2026-10-27.
 */
import { checkCommand } from "#node/functions/check-command.function";

/** Checks formatting and lint. */
export class CodeCheckCommand extends checkCommand(
  {
    name: "code:check",
    description: "Check formatting and lint (`stackra check --only format,lint`)",
  },
  { only: ["format", "lint"] },
) {}
