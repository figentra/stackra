/**
 * Stackra file contract:
 * Purpose: `checkCommand(options, defaults)`, the base of `stackra check` and the commands products already call that
 *          are check phases under another name (`validate`, `verify`, `code:check`, `code:fix`): a console command
 *          class with the flags they share (`--fix`, `--affected`, `--only`, `--skip`, `--format text|json|github`,
 *          `--base`, `--with-tests`, `--keep-going`) whose `handle` runs `runCheck` with its own presets and exits 1
 *          when a phase failed. The text output is `runCheck`'s, byte-exact; under `--json` the data is the findings
 *          and the phase rows.
 * Boundary: builds the class only; `runCheck` does the work. Each command subclasses it in `commands/`, so every
 *           command keeps its own class and name.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3); ADR 0506; ADR 0500 (decision 7); STA-1966; the quality-gate coverage
 *                     audit of 2026-10-27 (commands products call that the CLI did not register).
 */
import { Command, Option, type CommandIo } from "@stackra/console";
import type { CommandOptions } from "@stackra/console/contracts";
import { Str } from "@stackra/validation";

import { cliIoOf } from "#node/functions/cli-io-of.function";
import { runCheck } from "#node/functions/run-check.function";
import type { CheckRunner } from "#node/types/check-runner.type";

/**
 * The base class of a check command.
 *
 * @param options - the command's kind options (name, description, tool); `bin` is set.
 * @param defaults - the phases (`only`), `fix` and `withTests` it presets; flags on the command line win.
 * @example
 * export class CheckCommand extends checkCommand({
 *   name: "check",
 *   description: "Run the quality gate",
 * }) {}
 */
export function checkCommand(
  options: CommandOptions,
  defaults: Parameters<typeof runCheck>[1] = {},
): new () => CheckRunner {
  /** Runs the check phases `defaults` and the flags select. */
  class CheckRunCommand extends Command({
    bin: true,
    ...options,
  }) {
    /** Apply the fixes the phases offer. */
    @Option({ description: "Apply the fixes the phases offer (format, lint, gen)" })
    fix = false;

    /** Only the files changed since `--base`. */
    @Option({ description: "Only the files changed since --base" })
    affected = false;

    /** The phases to run. */
    @Option({ description: "Only these phases, comma-separated" })
    @Str
    only?: string;

    /** The phases to leave out. */
    @Option({ description: "Leave out these phases, comma-separated" })
    @Str
    skip?: string;

    /** How the findings print. */
    @Option({
      description: "How findings print: text, json (an array) or github (annotations)",
      choices: ["text", "json", "github"],
    })
    format = "text";

    /** The ref `--affected` compares with. */
    @Option({ description: "The ref --affected compares with (default: origin/main)" })
    @Str
    base?: string;

    /** Add the test phase. */
    @Option({ description: "Add the test phase" })
    withTests = false;

    /** Run every phase even after one fails. */
    @Option({ description: "Run every phase even after one fails" })
    keepGoing = false;

    /** Runs the phases and returns 1 when one failed. */
    async handle(io: CommandIo): Promise<number> {
      const { code, findings, phases } = await runCheck(
        {
          cwd: io.cwd,
          io: cliIoOf(io),
          values: {
            fix: this.fix,
            affected: this.affected,
            only: this.only,
            skip: this.skip,
            format: this.format,
            base: this.base,
            "with-tests": this.withTests,
            "keep-going": this.keepGoing,
          },
        },
        defaults,
      );
      // Only under --json: otherwise io.output.json would print the document after the text.
      if (io.json) io.output.json({ findings, phases });
      return code;
    }
  }
  return CheckRunCommand;
}
