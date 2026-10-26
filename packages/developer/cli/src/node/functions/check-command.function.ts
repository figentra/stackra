/**
 * Stackra file contract:
 * Purpose: `checkCommand(name, summary, defaults)`, `stackra check` and the commands products already call that are
 *          check phases under another name (`validate`, `verify`, `code:check`, `code:fix`): each takes the same flags
 *          and runs `runCheck` with its own presets.
 * Boundary: builds the command definition only; `runCheck` does the work.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3); the quality-gate coverage audit of 2026-10-27 (commands products call
 *                     that the CLI did not register).
 */
import { runCheck } from "#node/functions/run-check.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** The flags every check command takes. */
const OPTIONS: NonNullable<CliCommand["options"]> = {
  fix: { type: "boolean" },
  affected: { type: "boolean" },
  only: { type: "string" },
  skip: { type: "string" },
  format: { type: "string" },
  base: { type: "string" },
  "with-tests": { type: "boolean" },
};

/** The flag synopsis shared by the check commands. */
const FLAGS =
  "[--fix] [--affected] [--only <phase,…>] [--skip <phase,…>] [--format text|json|github] [--base <ref>] [--with-tests]";

/**
 * A check command.
 *
 * @param name - the command name.
 * @param summary - its line in `stackra --help`.
 * @param defaults - the phases (`only`), `fix` and `withTests` it presets; flags on the command line win.
 * @example
 * checkCommand("code:fix", "Format and lint with fixes", { only: ["format", "lint"], fix: true });
 */
export function checkCommand(
  name: string,
  summary: string,
  defaults: Parameters<typeof runCheck>[1] = {},
): CliCommand {
  return {
    name,
    summary,
    usage: `stackra ${name} ${FLAGS}`,
    options: OPTIONS,
    run: (context) => runCheck(context, defaults),
  };
}
