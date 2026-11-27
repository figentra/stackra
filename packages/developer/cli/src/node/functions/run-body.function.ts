/**
 * Stackra file contract:
 * Purpose: `runBody(io, body, input)`, runs a command body (`CliCommand.run`) for a native console command:
 *          the context is the command's fields (`values` by flag name, a false or absent flag left out, as the body's
 *          own parser left it), its positionals and the tokens after `--`; its writes reach the run's streams byte for
 *          byte, and its tools take the terminal when the run's runtime (`currentCliRuntime`) allows. Under `--json` its standard output is kept and
 *          shown on standard error instead, its tools never take the terminal, and the data is what the body reports
 *          (`context.report`), else `toData` of the kept output (when it reads it), else `{ exitCode, output }` with the
 *          output as lines.
 *          A `CliUsageError` without a hint gets the body's usage as one (exit 2).
 * Boundary: no parsing: the console has checked every field. Never writes JSON itself; the console writes the
 *           document from `io.output.json`.
 * Runtime: node
 * Governing contract: ADR 0506; ADR 0500 (decision 7: a moved command keeps its output); STA-1966 spec FR-008;
 *                     STA-2883.
 */
import { UsageError, type CommandIo } from "@stackra/console";

import { currentCliRuntime } from "#node/functions/current-cli-runtime.function";
import type { CliCommand } from "#node/types/cli-command.type";
import type { CliContext } from "#node/types/cli-context.type";
import type { CliIo } from "#node/types/cli-io.type";

/** What a command hands its body. */
type BodyInput = {
  /** The fields by flag name. */
  readonly values: Readonly<Record<string, string | boolean | undefined>>;
  /** The positional arguments. */
  readonly positionals?: readonly string[];
  /** The tokens after `--`. */
  readonly rest?: readonly string[];
  /** The `--json` data from the kept standard output, when the body prints its own JSON. */
  readonly toData?: (output: string, exitCode: number) => unknown;
};

/** `text` as lines, without the empty last one. */
const lines = (text: string): string[] =>
  text.split("\n").filter((line, index, all) => line !== "" || index < all.length - 1);

/** `toData` of the kept output, else (no `toData`, or output it cannot read) the exit code and the output's lines. */
function read(input: BodyInput, kept: string, exitCode: number): unknown {
  try {
    const data = input.toData?.(kept, exitCode);
    if (data !== undefined) return data;
  } catch {
    // A body that prints JSON only on success (`db diff`, `testbed status`) prints text on a failure.
  }
  return { exitCode, output: lines(kept) };
}

/**
 * Runs `body` and resolves with its exit code.
 *
 * @param io - the command's io.
 * @param body - the command body.
 * @param input - its values, positionals and rest.
 * @throws UsageError when the body refuses the invocation.
 * @example
 * return runBody(io, GEN_COMMAND, { values: { check: this.check } });
 */
export async function runBody(io: CommandIo, body: CliCommand, input: BodyInput): Promise<number> {
  const runtime = currentCliRuntime();
  let kept = "";
  let reported: { readonly data: unknown } | undefined;
  const cliIo: CliIo = io.json
    ? {
        out: (text) => {
          kept += text;
          io.stderr.write(text);
        },
        err: (text) => io.stderr.write(text),
        inherit: false,
      }
    : {
        out: (text) => io.stdout.write(text),
        err: (text) => io.stderr.write(text),
        inherit: runtime.inherit,
      };
  const values = Object.fromEntries(
    Object.entries(input.values).filter(([, value]) => value !== undefined && value !== false),
  );
  const context: CliContext = {
    cwd: io.cwd,
    io: cliIo,
    values,
    positionals: input.positionals ?? [],
    rest: input.rest ?? [],
    cli: (args, next) => runtime.cli(args, next, io.cwd),
    report: (data) => {
      reported = { data };
    },
  };
  let exitCode: number;
  try {
    exitCode = await body.run(context);
  } catch (error) {
    if (error instanceof UsageError && error.hint === undefined)
      throw new UsageError(error.message, `Usage: ${body.usage}`);
    throw error;
  }
  if (io.json) io.output.json(reported?.data ?? read(input, kept, exitCode));
  return exitCode;
}
