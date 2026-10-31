/**
 * Stackra file contract:
 * Purpose: `runCommand(...)`, the dispatch of one parsed command: create the container, resolve or build the command,
 *          fill its fields, run `handle(io)` raced against SIGINT and SIGTERM, close the container on every path, and
 *          turn the outcome into an exit code.
 * Boundary: writes nothing itself; errors go back to the kernel to render. The container factory is called here only,
 *           never for list, help or version.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-008, FR-012, FR-013 and FR-025; spec 030 Requirement 6.
 */
import type { SignalSource } from "#contracts/types/signal-source.type";
import { EXIT_CODE } from "#core/constants/exit-code.constant";
import type { Command } from "#core/bases/command.base";
import type { CommandEntry } from "#core/types/command-entry.type";
import type { CommandIo } from "#core/types/command-io.type";
import type { ConsoleConfig } from "#core/types/console-config.type";

/** What one dispatch ended with. */
interface Outcome {
  /** The exit code. */
  readonly code: number;
  /** The handler's returned object, the `--json` data. */
  readonly data?: unknown;
  /** The error to render, when the run failed. */
  readonly error?: unknown;
}

/** Runs `entry` with `values`, building `io` around the run's abort signal. */
export async function runCommand(
  entry: CommandEntry,
  values: Readonly<Record<string, unknown>>,
  config: ConsoleConfig,
  signals: SignalSource,
  io: (signal: AbortSignal) => CommandIo,
  codeOf: (error: unknown) => number,
): Promise<Outcome> {
  const controller = new AbortController();
  let stopped: number | undefined;
  let wake: (() => void) | undefined;
  const interrupted = new Promise<"stopped">((resolve) => {
    wake = () => resolve("stopped");
  });
  const off = signals.on((signal) => {
    stopped = signal === "SIGINT" ? EXIT_CODE.interrupted : EXIT_CODE.terminated;
    controller.abort(signal);
    wake?.();
  });
  let container: Awaited<ReturnType<NonNullable<ConsoleConfig["container"]>>> | undefined;
  let outcome: Outcome;
  try {
    container = await config.container?.();
    const command: Command =
      container === undefined
        ? (Reflect.construct(entry.type, []) as Command)
        : container.get(entry.type as unknown as abstract new () => Command);
    Object.assign(command, values);
    const result = await Promise.race([
      Promise.resolve().then(() => command.handle(io(controller.signal))),
      interrupted,
    ]);
    // A handler that returns on abort still ends with the signal's code.
    if (result === "stopped" || stopped !== undefined)
      outcome = { code: stopped ?? EXIT_CODE.interrupted };
    else if (typeof result === "number")
      outcome = {
        code: Number.isInteger(result) && result >= 0 && result <= 255 ? result : EXIT_CODE.failure,
      };
    else outcome = { code: EXIT_CODE.success, ...(result === undefined ? {} : { data: result }) };
  } catch (error) {
    outcome = { code: stopped ?? codeOf(error), error };
  } finally {
    off();
  }
  try {
    await container?.close();
  } catch (error) {
    if (outcome.code === EXIT_CODE.success) return { code: EXIT_CODE.failure, error };
  }
  return outcome;
}
