/**
 * Stackra file contract:
 * Purpose: `CommandIo`, what `handle(io)` receives: the output, the prompts, the stop signal and the run's flags.
 * Boundary: a type only; built by the kernel for each run.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-012 to FR-024.
 */
import type { ConsoleOutput } from "#core/types/console-output.type";
import type { ConsolePrompt } from "#core/types/console-prompt.type";

/** The run as a command sees it. */
export interface CommandIo {
  /** Where the command writes. */
  readonly output: ConsoleOutput;

  /** How it asks. */
  readonly prompt: ConsolePrompt;

  /** Aborted on SIGINT or SIGTERM. */
  readonly signal: AbortSignal;

  /** `--verbose` was given. */
  readonly verbose: boolean;

  /** `--json` was given. */
  readonly json: boolean;

  /** Prompts are asked rather than defaulted. */
  readonly interactive: boolean;
}
