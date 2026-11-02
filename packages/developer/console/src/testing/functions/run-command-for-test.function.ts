/**
 * Stackra file contract:
 * Purpose: `runCommandForTest(commands, argv, options)`, one run in the test's process: memory streams, scripted
 *          answers, plain output unless asked for colour, an optional container and signal, and the exit code, output,
 *          JSON and questions back.
 * Boundary: no process I/O and no `process.env`; `CI` is never inherited.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-027 and FR-028; spec 030 Requirement 8.
 */
import { CommandAudit } from "#contracts/ports/command-audit.port";
import type { Completions } from "#contracts/ports/completions.port";
import { OperatorBreakGlass } from "#contracts/ports/operator-break-glass.port";
import type { ConsoleContainer } from "#core/types/console-container.type";
import { createConsole } from "#core/functions/create-console.function";
import type { CommandClass } from "#core/types/command-class.type";
import type { ConsoleConfig } from "#core/types/console-config.type";
import { MemoryProcessRunnerDriver } from "#testing/drivers/memory-process-runner.driver";
import { manualSignals } from "#testing/functions/manual-signals.function";
import { memoryText } from "#testing/functions/memory-text.function";
import { scriptedPrompter } from "#testing/functions/scripted-prompter.function";
import type { TestRunOptions } from "#testing/types/test-run-options.type";
import type { TestRunResult } from "#testing/types/test-run-result.type";

/** `factory`'s container (or a stand-in that builds classes with no arguments) that also serves `ports`. */
function withPorts(
  factory: ConsoleConfig["container"],
  ports: ReadonlyMap<unknown, object>,
): NonNullable<ConsoleConfig["container"]> {
  return async () => {
    const inner = await factory?.();
    const container: ConsoleContainer = {
      get: <T extends object>(type: abstract new (...args: never[]) => T): T =>
        ports.has(type)
          ? (ports.get(type) as T)
          : inner === undefined
            ? (Reflect.construct(type, []) as T)
            : inner.get(type),
      has: (type) => ports.has(type) || inner?.has?.(type) === true,
      close: async () => {
        await inner?.close();
      },
    };
    return container;
  };
}

/**
 * Runs `argv` against `commands` (a class list or a whole console config).
 *
 * @example
 * const result = await runCommandForTest([GreetCommand], ["greet"], { answers: ["Ada"] });
 * expect(result.stdout).toContain("Hello Ada");
 */
export async function runCommandForTest(
  commands: readonly CommandClass[] | ConsoleConfig,
  argv: readonly string[],
  options: TestRunOptions = {},
): Promise<TestRunResult> {
  const base: ConsoleConfig = Array.isArray(commands)
    ? { name: "app", version: "0.0.0", commands: commands as readonly CommandClass[] }
    : (commands as ConsoleConfig);
  const ports = new Map<unknown, object>();
  if (options.audit !== undefined) ports.set(CommandAudit, options.audit);
  if (options.breakGlass !== undefined) ports.set(OperatorBreakGlass, options.breakGlass);
  const container = ports.size === 0 ? options.container : withPorts(options.container, ports);
  const config = container === undefined ? base : { ...base, container };
  const stdout = memoryText();
  const stderr = memoryText();
  const signals = manualSignals();
  const prompter = scriptedPrompter(options.answers ?? []);
  const interactive = options.answers !== undefined;
  const running = createConsole(config).run(argv, {
    stdout,
    stderr,
    stdoutIsTTY: interactive || options.colour === true,
    stdinIsTTY: interactive,
    env: {
      ...(options.colour === true ? { COLORTERM: "truecolor" } : { NO_COLOR: "1" }),
      ...options.env,
    },
    columns: options.columns ?? 80,
    cwd: options.cwd ?? "/work",
    process: () => options.process ?? new MemoryProcessRunnerDriver(),
    signals,
    prompter: () => prompter,
    ...(options.renderer === undefined ? {} : { renderer: options.renderer }),
    ...(options.completions === undefined
      ? {}
      : { completions: () => options.completions as Completions }),
  });
  if (options.signal !== undefined) {
    const signal = options.signal;
    setTimeout(() => signals.send(signal), 0);
  }
  const exitCode = await running;
  let json: unknown;
  try {
    json = JSON.parse(stdout.text());
  } catch {
    json = undefined;
  }
  return { exitCode, stdout: stdout.text(), stderr: stderr.text(), json, asked: prompter.asked };
}
