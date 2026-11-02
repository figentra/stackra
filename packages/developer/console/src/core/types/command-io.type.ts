/**
 * Stackra file contract:
 * Purpose: `CommandIo`, what `handle(io)` receives: the output, the prompts, the child processes, the working
 *          directory, the stop signal and the run's flags.
 * Boundary: a type only; built by the kernel for each run.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-012 to FR-024; STA-1966 spec FR-007 and FR-029.
 */
import type { ConsoleOutput } from "#core/types/console-output.type";
import type { ConsoleProcess } from "#core/types/console-process.type";
import type { ConsolePrompt } from "#core/types/console-prompt.type";

/** The run as a command sees it. */
export interface CommandIo {
  /** Where the command writes. */
  readonly output: ConsoleOutput;

  /** How it asks. */
  readonly prompt: ConsolePrompt;

  /** How it runs child processes. */
  readonly process: ConsoleProcess;

  /** The directory the command works in; never `process.cwd()`, which a local MCP or a test does not share. */
  readonly cwd: string;

  /** Aborted on SIGINT or SIGTERM. */
  readonly signal: AbortSignal;

  /** `--verbose` was given. */
  readonly verbose: boolean;

  /** `--json` was given. */
  readonly json: boolean;

  /** Prompts are asked rather than defaulted. */
  readonly interactive: boolean;

  /** Output is drawn live on a colour terminal (spinners spin, bars redraw). */
  readonly animate: boolean;

  /** Who runs the command: `STACKRA_OPERATOR`, else the login the environment names; passed on to registries. */
  readonly operator: string;
}
