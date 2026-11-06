/**
 * Stackra file contract:
 * Purpose: `nodePorts()`, the ports of a real run: the process's streams, their TTY state, its environment, the
 *          terminal width, SIGINT and SIGTERM, the working directory, the Clack prompter, the process runner and the
 *          Ink renderer (text, with Ink for live parts).
 * Boundary: reads `process`; installs signal listeners only while a command runs (the kernel subscribes and
 *           unsubscribes).
 * Runtime: node
 * Governing contract: STA-1730 spec FR-012, FR-020 and FR-023.
 */
import type { ConsoleSignal } from "#contracts/types/console-signal.type";
import type { ConsolePorts } from "#core/types/console-ports.type";
import { InkRendererDriver } from "#node/drivers/ink-renderer.driver";
import { NodeProcessRunnerDriver } from "#node/drivers/node-process-runner.driver";
import { TabCompletionsDriver } from "#node/drivers/tab-completions.driver";
import { clackPrompter } from "#node/functions/clack-prompter.function";

/**
 * The ports of this process.
 *
 * @example
 * process.exitCode = await createConsole({ name, version, commands }).run(process.argv.slice(2), nodePorts());
 */
export function nodePorts(): ConsolePorts {
  return {
    stdout: process.stdout,
    stderr: process.stderr,
    stdoutIsTTY: process.stdout.isTTY === true,
    stdinIsTTY: process.stdin.isTTY === true,
    env: process.env,
    cwd: process.cwd(),
    ...(process.stdout.columns === undefined ? {} : { columns: process.stdout.columns }),
    signals: {
      on: (handler) => {
        const listeners = (["SIGINT", "SIGTERM"] as const).map((signal: ConsoleSignal) => {
          const listener = () => handler(signal);
          process.on(signal, listener);
          return () => process.off(signal, listener);
        });
        return () => {
          for (const off of listeners) off();
        };
      },
    },
    prompter: () => clackPrompter(process.stdin, process.stdout),
    process: () => new NodeProcessRunnerDriver(),
    renderer: (context) => new InkRendererDriver(context),
    completions: () => new TabCompletionsDriver(),
  };
}
