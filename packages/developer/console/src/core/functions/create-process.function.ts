/**
 * Stackra file contract:
 * Purpose: `createProcess(setup)`, the `ConsoleProcess` of one run: it runs each child in the run's working directory
 *          through the `ProcessRunner`, echoes its output dimmed to standard error only under `--verbose`, redacts
 *          the run's secret values from what it keeps, throws a `CommandError` (the output as its detail) on a
 *          non-zero exit, and refuses an interactive child, naming it, when the run is not interactive.
 * Boundary: no terminal or environment test of its own: interactivity comes from the decided mode.
 * Runtime: isomorphic
 * Governing contract: STA-1966 spec FR-007, FR-028 and FR-029.
 */
import type { ProcessRunner } from "#contracts/ports/process-runner.port";
import { CommandError } from "#core/errors/command-error.error";
import type { ConsoleMode } from "#core/types/console-mode.type";
import type { ConsoleProcess } from "#core/types/console-process.type";

/** A command line as the operator would type it. */
const commandLine = (command: string, args: readonly string[]) =>
  [command, ...args]
    .map((part) => (/^[\w./:=@-]+$/u.test(part) ? part : JSON.stringify(part)))
    .join(" ");

/** The child processes of one run. */
export function createProcess(setup: {
  /** The runner; without one every run is refused. */
  readonly runner?: ProcessRunner;
  readonly mode: ConsoleMode;
  readonly cwd: string;
  /** Raw output under `--verbose`. */
  readonly echo: (chunk: string) => void;
  /** Hides the run's secret values. */
  readonly redact: (text: string) => string;
}): ConsoleProcess {
  return {
    run: async (command, args, options = {}) => {
      const line = commandLine(command, args);
      if (options.interactive === true && !setup.mode.interactive)
        throw new CommandError(`"${line}" needs a terminal`, {
          why: "it asks for input or shows live progress, and this run is not interactive",
          fix: line,
        });
      if (setup.runner === undefined)
        throw new CommandError(`"${line}" cannot run: no process runner is bound`, {
          fix: "pass nodePorts() from @stackra/console/node, or a ProcessRunner in the ports",
        });
      const result = await setup.runner.run(command, args, {
        ...options,
        cwd: options.cwd ?? setup.cwd,
        onOutput: (chunk) => {
          if (setup.mode.verbose) setup.echo(setup.redact(chunk));
          options.onOutput?.(chunk);
        },
      });
      const output = setup.redact(result.output);
      if (result.code !== 0 && options.check !== false)
        throw new CommandError(`"${line}" failed with exit code ${result.code}`, {
          detail: output,
          ...(options.fix === undefined ? {} : { fix: options.fix }),
        });
      return { code: result.code, output };
    },
  };
}
