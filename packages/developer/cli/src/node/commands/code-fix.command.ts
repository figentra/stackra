/**
 * Stackra file contract:
 * Purpose: `CodeFixCommand`, `stackra code:fix`: the format and lint phases with their fixes applied
 *          (`stackra check --only format,lint --fix`), with the check flags.
 * Boundary: `checkCommand` and `runCheck` do the work; it rewrites the files the formatter and the linter fix.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3); ADR 0506; STA-1966; the quality-gate coverage audit of 2026-10-27.
 */
import { checkCommand } from "#node/functions/check-command.function";

/** Formats and applies lint fixes. */
export class CodeFixCommand extends checkCommand(
  {
    name: "code:fix",
    description: "Format and apply lint fixes (`stackra check --only format,lint --fix`)",
  },
  {
    only: ["format", "lint"],
    fix: true,
  },
) {}
