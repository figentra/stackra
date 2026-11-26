/**
 * Stackra file contract:
 * Purpose: `devToolContainer(run, env)`, the container the local MCP's tool commands are built from: each command is
 *          constructed with a `DevToolHost` over the server's CLI runner and environment.
 * Boundary: builds commands only; holds nothing to close. The host it makes is the port's only implementation.
 * Runtime: node
 * Governing contract: STA-1730 spec FR-008 (a command's constructor takes its collaborators); ADR 0294 (decision 25);
 *                     STA-2873.
 */
import type { ConsoleContainer } from "@stackra/console";

import { DevToolHost } from "#core/ports/dev-tool-host.port";
import type { StackraRunner } from "#node/types/stackra-runner.type";

/**
 * A container that builds each tool command with a host over `run` and `env`.
 *
 * @param run - the CLI runner every write and gate goes through.
 * @param env - the server's environment.
 * @example
 * const container = () => devToolContainer(run, env);
 * toolsOf({ name: "stackra", version, commands: DEV_TOOL_COMMANDS, container }, ports);
 */
export function devToolContainer(
  run: StackraRunner,
  env: Readonly<Record<string, string | undefined>>,
): ConsoleContainer {
  const host = new (class extends DevToolHost {
    run(args: readonly string[], options?: { readonly cwd?: string }) {
      return run(args, options);
    }

    environment() {
      return env;
    }
  })();
  return {
    get: <T extends object>(type: abstract new (...args: never[]) => T): T => {
      // Every tool command takes the host alone; the kernel asks for nothing else.
      const Built = type as unknown as new (host: DevToolHost) => T;
      return new Built(host);
    },
    close: async () => undefined,
  };
}
