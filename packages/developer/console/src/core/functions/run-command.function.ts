/**
 * Stackra file contract:
 * Purpose: `runCommand(...)`, the dispatch of one parsed command: create the container, resolve or build the command,
 *          fill its fields, run `handle(io)` raced against SIGINT and SIGTERM, close the container on every path, and
 *          turn the outcome into an exit code; an audited command is refused without a `CommandAudit` and records one
 *          entry per run; in production it also needs the operator's open break-glass session.
 * Boundary: writes nothing itself; errors go back to the kernel to render. The container factory is called here only,
 *           never for list, help or version.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-008, FR-012, FR-013 and FR-025; spec 030 Requirement 6; STA-1731 spec
 *                     FR-015, FR-016 and FR-018.
 */
import { CommandAudit } from "#contracts/ports/command-audit.port";
import { OperatorBreakGlass } from "#contracts/ports/operator-break-glass.port";
import type { SignalSource } from "#contracts/types/signal-source.type";
import { EXIT_CODE } from "#core/constants/exit-code.constant";
import type { Command } from "#core/bases/command.base";
import { BreakGlassRequiredError } from "#core/errors/break-glass-required.error";
import { CommandAuditMissingError } from "#core/errors/command-audit-missing.error";
import { CommandNotAuditedError } from "#core/errors/command-not-audited.error";
import { auditValues } from "#core/functions/audit-values.function";
import type { CommandEntry } from "#core/types/command-entry.type";
import type { CommandIo } from "#core/types/command-io.type";
import type { ConsoleConfig } from "#core/types/console-config.type";

/** How long an interrupted audited command's handler may take to settle before its entry is written. */
const AUDIT_SETTLE_MS = 30_000;

/** Resolves after `ms`, without keeping the process alive. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    // Node's timer unrefs; a DOM timer is a number, so the lookup is by shape.
    const timer: unknown = setTimeout(resolve, ms);
    if (typeof timer === "object" && timer !== null && "unref" in timer) {
      (timer as { unref: () => void }).unref();
    }
  });
}

/** The id of `operator`'s open break-glass session, refusing the run when there is none. */
async function openSession(
  container: NonNullable<Awaited<ReturnType<NonNullable<ConsoleConfig["container"]>>>>,
  command: string,
  operator: string,
): Promise<string> {
  if (container.has?.(OperatorBreakGlass) !== true)
    throw new BreakGlassRequiredError(command, operator, "no OperatorBreakGlass is bound");
  const session = await container.get(OperatorBreakGlass).active(operator);
  if (session === undefined)
    throw new BreakGlassRequiredError(command, operator, "no session is open");
  if (session.operator !== operator)
    throw new BreakGlassRequiredError(command, operator, `the session is ${session.operator}'s`);
  if (session.expiresAt.getTime() <= Date.now())
    throw new BreakGlassRequiredError(
      command,
      operator,
      `the session ended at ${session.expiresAt.toISOString()}`,
    );
  return session.id;
}

/** What one dispatch ended with. */
interface Outcome {
  /** The exit code. */
  readonly code: number;
  /** The handler's returned object, the `--json` data. */
  readonly data?: unknown;
  /** The error to render, when the run failed. */
  readonly error?: unknown;
  /** The handler returned its own exit code, which a failed checklist row does not override. */
  readonly coded?: boolean;
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
  production: boolean,
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
  let breakGlass: string | undefined;
  let handling: Promise<unknown> | undefined;
  try {
    container = await config.container?.();
    if (entry.structure.audit) {
      // Fail closed: an audited command never runs without somewhere to record it.
      if (container?.has?.(CommandAudit) !== true)
        throw new CommandAuditMissingError(entry.structure.name);
      const sink = container.get(CommandAudit);
      await sink.ready();
      // In production an audited command runs only inside the operator's open break-glass session (ADR 0188 SC12).
      if (production) breakGlass = await openSession(container, entry.structure.name, operator);
      audit = sink;
    }
    const command: Command =
      container === undefined
        ? (Reflect.construct(entry.type, []) as Command)
        : container.get(entry.type as unknown as abstract new () => Command);
    Object.assign(command, values);
    handling = Promise.resolve().then(() => command.handle(io(controller.signal)));
    const result = await Promise.race([handling, interrupted]);
    // A handler that returns on abort still ends with the signal's code.
    if (result === "stopped" || stopped !== undefined)
      outcome = { code: stopped ?? EXIT_CODE.interrupted };
    else if (typeof result === "number")
      outcome = {
        code: Number.isInteger(result) && result >= 0 && result <= 255 ? result : EXIT_CODE.failure,
        coded: true,
      };
    else outcome = { code: EXIT_CODE.success, ...(result === undefined ? {} : { data: result }) };
  } catch (error) {
    outcome = { code: stopped ?? codeOf(error), error };
  } finally {
    off();
  }
  // An interrupted audited command is recorded once its handler has settled (or after the grace), so the entry never
  // says "cancelled" while a migration it started is still running.
  if (audit !== undefined && stopped !== undefined && handling !== undefined)
    await Promise.race([handling.catch(() => undefined), delay(AUDIT_SETTLE_MS)]);
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
        ...(breakGlass === undefined ? {} : { breakGlass }),
      });
    } catch (error) {
      outcome = {
        code: outcome.code === EXIT_CODE.success ? EXIT_CODE.failure : outcome.code,
        error: new CommandNotAuditedError(entry.structure.name, error, outcome.error),
      };
    }
  try {
    await container?.close();
  } catch (error) {
    if (outcome.code === EXIT_CODE.success) return { code: EXIT_CODE.failure, error };
  }
  return outcome;
}
