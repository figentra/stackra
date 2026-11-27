/**
 * Stackra file contract:
 * Purpose: `DevRootTools`, the side effects `runDevRoot` takes from its caller: start a tool process, capture one
 *          command's output, wait for the gateway and forward a port. The command passes the real ones; tests pass fakes.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: STA-2840.
 */
import type { PortForward } from "#node/dev-root/types/port-forward.type";
import type { CliIo } from "#node/types/cli-io.type";
import type { ToolRun } from "#node/types/tool-run.type";

/** The processes and sockets a root dev run starts. */
export type DevRootTools = {
  /** Starts a tool and resolves with its exit code (`runProcess`). */
  readonly run: (tool: ToolRun, io: CliIo) => Promise<number>;

  /** Runs one command and resolves with its standard output (`runProgram`). */
  readonly capture: (
    command: string,
    args: readonly string[],
    options: { readonly cwd: string },
  ) => Promise<string>;

  /** Resolves true once `url` answers HTTP, false after `timeoutMs` or once `signal` aborts (`waitForHttp`). */
  readonly waitFor: (url: string, timeoutMs: number, signal?: AbortSignal) => Promise<boolean>;

  /** Forwards `port` to `target` (`startPortForward`). */
  readonly forward: (port: number, target: number) => Promise<PortForward>;
};
