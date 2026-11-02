/**
 * Stackra file contract:
 * Purpose: `TestRunOptions`, how `runCommandForTest` runs: scripted answers (which make the run interactive), extra
 *          environment, colour, width, a container, and a signal to send once the command starts.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-027.
 */
import type { CommandAudit } from "#contracts/ports/command-audit.port";
import type { OperatorBreakGlass } from "#contracts/ports/operator-break-glass.port";
import type { ProcessRunner } from "#contracts/ports/process-runner.port";
import type { ConsoleSignal } from "#contracts/types/console-signal.type";
import type { PromptAnswer } from "#contracts/types/prompt-answer.type";
import type { ConsoleConfig } from "#core/types/console-config.type";
import type { ConsolePorts } from "#core/types/console-ports.type";

/** The options of one test run. */
export interface TestRunOptions {
  /** Answers in order; giving them makes the run interactive. */
  readonly answers?: readonly PromptAnswer[];

  /** Environment variables; `NO_COLOR=1` is set unless `colour` is true. */
  readonly env?: Readonly<Record<string, string | undefined>>;

  /** Render colour as a true-colour terminal would. */
  readonly colour?: boolean;

  /** The terminal width; 80 by default. */
  readonly columns?: number;

  /** The container factory, for collaborators and fakes. */
  readonly container?: ConsoleConfig["container"];

  /** The `CommandAudit` an audited command records to; served beside `container`, or by a stand-in without one. */
  readonly audit?: CommandAudit;

  /** The `OperatorBreakGlass` a production run of an audited command needs; served like `audit`. */
  readonly breakGlass?: OperatorBreakGlass;

  /** Sent on the next tick after the run starts, to test interruption. */
  readonly signal?: ConsoleSignal;

  /** The child processes `io.process` runs; a `MemoryProcessRunnerDriver` with nothing scripted when absent. */
  readonly process?: ProcessRunner;

  /** The run's working directory (`io.cwd`); `/work` by default. */
  readonly cwd?: string;

  /** Makes the run's renderer, to test a driver of your own; the text driver when absent. */
  readonly renderer?: ConsolePorts["renderer"];
}
