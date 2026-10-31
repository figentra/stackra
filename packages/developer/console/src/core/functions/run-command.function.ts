/**
 * Stackra file contract:
 * Purpose: `runCommand(...)`, the dispatch of one parsed command: create the container, resolve or build the command,
 *          fill its fields, run `handle(io)` raced against SIGINT and SIGTERM, close the container on every path, and
 *          turn the outcome into an exit code; an audited command is refused without a `CommandAudit` and records one
 *          entry per run.
 * Boundary: writes nothing itself; errors go back to the kernel to render. The container factory is called here only,
 *           never for list, help or version.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-008, FR-012, FR-013 and FR-025; spec 030 Requirement 6; STA-1731 spec
 *                     FR-015 and FR-016.
 */
import { CommandAudit } from "#contracts/ports/command-audit.port";
import type { SignalSource } from "#contracts/types/signal-source.type";
import { EXIT_CODE } from "#core/constants/exit-code.constant";
import type { Command } from "#core/bases/command.base";
import { CommandAuditMissingError } from "#core/errors/command-audit-missing.error";
import { auditValues } from "#core/functions/audit-values.function";
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
  operator: string,
): Promise<Outcome> {
  const at = new Date();
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
  let audit: CommandAudit | undefined;
  try {
    container = await config.container?.();
    if (entry.structure.audit) {
      // Fail closed: an audited command never runs without somewhere to record it.
      if (container?.has?.(CommandAudit) !== true)
        throw new CommandAuditMissingError(entry.structure.name);
      audit = container.get(CommandAudit);
    }
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
  if (audit !== undefined)
    try {
      await audit.record({
        operator,
        command: entry.structure.name,
        values: auditValues(entry.structure, values),
        at,
        outcome:
          outcome.code === EXIT_CODE.success
            ? "ok"
            : outcome.code === EXIT_CODE.interrupted || outcome.code === EXIT_CODE.terminated
              ? "cancelled"
              : "failed",
        exitCode: outcome.code,
      });
    } catch (error) {
      if (outcome.code === EXIT_CODE.success) outcome = { code: EXIT_CODE.failure, error };
    }
  try {
    await container?.close();
  } catch (error) {
    if (outcome.code === EXIT_CODE.success) return { code: EXIT_CODE.failure, error };
  }
  return outcome;
}
