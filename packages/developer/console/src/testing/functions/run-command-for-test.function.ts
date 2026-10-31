/**
 * Stackra file contract:
 * Purpose: `runCommandForTest(commands, argv, options)`, one run in the test's process: memory streams, scripted
 *          answers, plain output unless asked for colour, an optional container and signal, and the exit code, output,
 *          JSON and questions back.
 * Boundary: no process I/O and no `process.env`; `CI` is never inherited.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-027 and FR-028; spec 030 Requirement 8.
 */
import { createConsole } from "#core/functions/create-console.function";
import type { CommandClass } from "#core/types/command-class.type";
import type { ConsoleConfig } from "#core/types/console-config.type";
import { manualSignals } from "#testing/functions/manual-signals.function";
import { memoryText } from "#testing/functions/memory-text.function";
import { scriptedPrompter } from "#testing/functions/scripted-prompter.function";
import type { TestRunOptions } from "#testing/types/test-run-options.type";
import type { TestRunResult } from "#testing/types/test-run-result.type";

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
  const config = options.container === undefined ? base : { ...base, container: options.container };
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
    signals,
    prompter: () => prompter,
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
