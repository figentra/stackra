/**
 * Stackra file contract:
 * Purpose: `CONSOLE_COMMAND`, `stackra console <member> [args...]`: runs the member's generated console entry
 *          (`.stackra/entry/console.ts`) with the arguments, so a service or app lists and runs the commands it
 *          declares and its hosted packages contribute (ADR 0506 decision 6). Its exit code is the command's.
 * Boundary: loads the entry through Vite's module runner in the member's folder and runs no gen; exits 2 and says so when the member has
 *           no console entry (it has no commands, or gen has not run). Flags of the inner command go after `--`
 *           (`stackra console example db:status -- --json`), since the CLI parses its own options strictly.
 * Runtime: node
 * Governing contract: ADR 0506 (decision 6); ADR 0295 (generated entries); STA-1731 spec FR-009.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

import { runnerImport } from "vite";

import { CliUsageError } from "#node/errors/cli-usage.error";
import { resolveMemberRoot } from "#node/functions/resolve-member-root.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** What a generated console entry exports. */
interface ConsoleEntry {
  /** Runs the console with `argv`; resolves to the exit code. */
  readonly run: (argv: readonly string[]) => Promise<number>;
}

/** The `stackra console` command. */
export const CONSOLE_COMMAND: CliCommand = {
  name: "console",
  summary: "Run a member's console: its commands and those of its hosted packages",
  usage: "stackra console <member> [command] [args...] [-- <flags>]",
  positionals: true,
  async run({ cwd, positionals, rest, io }) {
    const [member, ...args] = positionals;
    if (member === undefined) throw new CliUsageError("name the member to run, e.g. `example`");
    const root = resolveMemberRoot(cwd, member);
    if (!existsSync(join(root, ".stackra", "entry", "console.ts"))) {
      io.err(
        `stackra console: ${member} has no console entry (.stackra/entry/console.ts): it declares no command, or \`stackra gen\` has not run\n`,
      );
      return 2;
    }
    // Node's type stripping refuses decorators, so the entry loads through Vite with the house decorator transform.
    const { module } = await runnerImport<ConsoleEntry>(
      join(root, ".stackra", "entry", "console.ts"),
      {
        root,
        configFile: false,
        logLevel: "silent",
        oxc: { decorator: { legacy: true, emitDecoratorMetadata: false } },
      },
    );
    return module.run([...args, ...rest]);
  },
};
