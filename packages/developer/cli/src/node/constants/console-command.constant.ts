/**
 * Stackra file contract:
 * Purpose: `CONSOLE_COMMAND`, `stackra console <member> [args...]`: runs the member's generated console entry
 *          (`.stackra/entry/console.ts`) with the arguments, so a service or app lists and runs the commands it
 *          declares and its hosted packages contribute (ADR 0506 decision 6). Its exit code is the command's.
 * Boundary: runs the entry through `runMemberConsole` (Vite's module runner, no gen) in the member's folder, or in
 *           the working directory when that is inside the member; exits 2
 *           and says so when the member has no console entry (it has no commands, or gen has not run). The same
 *           commands also run at the top level, `stackra db:status --json` (STA-2888). Here flags of the inner command
 *           go after `--` (`stackra console example db:status -- --json`), since the CLI parses its own options strictly.
 * Runtime: node
 * Governing contract: ADR 0506 (decision 6); ADR 0295 (generated entries); STA-1731 spec FR-009; STA-2888.
 */
import { CliUsageError } from "#node/errors/cli-usage.error";
import { resolveMemberRoot } from "#node/functions/resolve-member-root.function";
import { runMemberConsole } from "#node/functions/run-member-console.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** The `stackra console` command. */
export const CONSOLE_COMMAND: CliCommand = {
  name: "console",
  summary: "Run a member's console: its commands and those of its hosted packages",
  usage: "stackra console <member> [command] [args...] [-- <flags>]",
  positionals: true,
  async run({ cwd, positionals, rest, io }) {
    const [member, ...args] = positionals;
    if (member === undefined) throw new CliUsageError("name the member to run, e.g. `example`");
    return runMemberConsole(
      resolveMemberRoot(cwd, member),
      member,
      [...args, ...rest],
      io.err,
      cwd,
    );
  },
};
